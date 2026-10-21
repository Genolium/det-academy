package service

import (
	"context"
	"det-academy-backend/internal/ai"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

var ErrEvaluationPending = errors.New("evaluation is still pending")

type EvaluationQueue struct {
	sessionRepo           repository.TestSessionRepository
	questionRepo          repository.QuestionRepository
	evaluator             *Evaluator
	transcriber           ai.Transcriber
	provider              ai.Provider
	allowClientTranscript bool
}

func NewEvaluationQueue(
	sessionRepo repository.TestSessionRepository,
	questionRepo repository.QuestionRepository,
	transcriber ai.Transcriber,
	provider ai.Provider,
) *EvaluationQueue {
	return &EvaluationQueue{
		sessionRepo:           sessionRepo,
		questionRepo:          questionRepo,
		evaluator:             NewEvaluator(),
		transcriber:           transcriber,
		provider:              provider,
		allowClientTranscript: os.Getenv("ALLOW_CLIENT_TRANSCRIPT") == "true",
	}
}

func (q *EvaluationQueue) Run(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			for {
				job, err := q.sessionRepo.ClaimEvaluationJob(ctx)
				if err != nil {
					break
				}
				q.processJob(ctx, job)
			}
		}
	}
}

func (q *EvaluationQueue) processJob(ctx context.Context, job *models.EvaluationJob) {
	evaluations, err := q.sessionRepo.GetSessionEvaluations(ctx, job.SessionID)
	if err != nil {
		q.fail(ctx, job, err)
		return
	}
	var evaluation *models.EvaluationResult
	for index := range evaluations {
		if evaluations[index].ID == job.EvaluationID {
			evaluation = &evaluations[index]
			break
		}
	}
	if evaluation == nil {
		q.fail(ctx, job, errors.New("evaluation not found"))
		return
	}

	evaluation.FeedbackStatus = "transcribing"
	_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)

	transcript := strings.TrimSpace(job.ClientTranscript)
	transcriptSource := "client"
	if q.transcriber != nil && job.AudioPath != "" {
		serverTranscript, transcribeErr := q.transcriber.Transcribe(ctx, job.AudioPath, job.AudioMIME)
		if transcribeErr != nil {
			evaluation.FeedbackStatus = "retryable_failed"
			evaluation.LastError = transcribeErr.Error()
			_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)
			q.fail(ctx, job, transcribeErr)
			return
		}
		transcript = serverTranscript
		transcriptSource = "server"
	} else if !q.allowClientTranscript {
		evaluation.Status = "INSUFFICIENT"
		evaluation.Score = 0
		evaluation.Transcript = ""
		evaluation.TranscriptSource = "none"
		evaluation.FeedbackStatus = "unsupported"
		evaluation.LastError = "server-side transcription is not configured"
		evaluation.Provider = "rule-based"
		evaluation.EvaluatorVersion = "2026.1"
		_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)
		_ = q.sessionRepo.CompleteEvaluationJob(ctx, job.ID)
		return
	}

	evaluation.FeedbackStatus = "evaluating"
	_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)

	questionType := "SPEAKING_SAMPLE"
	var keywords []string
	if question, questionErr := q.questionRepo.GetByID(ctx, job.QuestionID); questionErr == nil && question != nil {
		questionType = question.Type
		keywords = extractContextKeywords(question.ContentPayload)
	}
	result := q.evaluator.EvaluateSpeaking(job.SessionID, job.QuestionID, questionType, transcript, evaluation.SpeakingDuration, keywords)
	result.ID = evaluation.ID
	result.AudioURL = evaluation.AudioURL
	result.Transcript = transcript
	result.TranscriptSource = transcriptSource
	result.Provider = "rule-based"
	result.EvaluatorVersion = "2026.1"
	result.FeedbackStatus = "completed"
	result.RetryCount = job.Attempts
	result.CreatedAt = evaluation.CreatedAt

	if q.provider != nil {
		enrichment, enrichErr := q.provider.Enrich(ctx, ai.EnrichInput{
			QuestionType: questionType,
			Prompt:       evaluation.Transcript,
			Response:     transcript,
			Transcript:   transcript,
			Score:        result.Score,
			CEFR:         result.CEFRLevel,
		})
		if enrichErr == nil {
			result.Feedback = enrichment.Feedback
			result.Provider = enrichment.Provider
			result.EvaluatorVersion = enrichment.Model
			for _, span := range enrichment.Evidence {
				result.EvidenceSpans = append(result.EvidenceSpans, models.EvidenceSpan{
					Start: span.Start, End: span.End, Text: span.Text,
					Label: span.Label, Suggestion: span.Suggestion,
				})
			}
		} else {
			result.LastError = enrichErr.Error()
		}
	}

	if err := q.sessionRepo.UpdateEvaluation(ctx, &result); err != nil {
		q.fail(ctx, job, err)
		return
	}
	_ = q.sessionRepo.CompleteEvaluationJob(ctx, job.ID)
}

func (q *EvaluationQueue) fail(ctx context.Context, job *models.EvaluationJob, err error) {
	backoff := time.Duration(job.Attempts*job.Attempts) * 10 * time.Second
	if backoff > 5*time.Minute {
		backoff = 5 * time.Minute
	}
	log.Printf("[EvaluationQueue] job %s failed: %v", job.ID, err)
	_ = q.sessionRepo.FailEvaluationJob(ctx, job.ID, time.Now().UTC().Add(backoff), err.Error())
}

func (q *EvaluationQueue) EnqueueAudioEvaluation(
	ctx context.Context,
	sessionID, questionID, evaluationID, audioPath, audioMIME, clientTranscript string,
) error {
	now := time.Now().UTC()
	return q.sessionRepo.CreateEvaluationJob(ctx, &models.EvaluationJob{
		ID:               uuid.New().String(),
		SessionID:        sessionID,
		QuestionID:       questionID,
		EvaluationID:     evaluationID,
		AudioPath:        audioPath,
		AudioMIME:        audioMIME,
		ClientTranscript: clientTranscript,
		Status:           "queued",
		Attempts:         0,
		MaxAttempts:      3,
		NextAttemptAt:    now,
		CreatedAt:        now,
		UpdatedAt:        now,
	})
}

func (q *EvaluationQueue) PendingForSession(ctx context.Context, sessionID string) (int, error) {
	return q.sessionRepo.CountPendingEvaluationJobs(ctx, sessionID)
}
