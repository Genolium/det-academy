package service

import (
	"context"
	"sync/atomic"

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

var (
	evalQueued       atomic.Int64
	evalProcessing   atomic.Int64
	evalRetryable    atomic.Int64
	evalFailed       atomic.Int64
	evalOldestAgeSec atomic.Int64
)

func EvaluationQueueMetrics() (queued, processing, retryable, failed, oldestAgeSec int64) {
	return evalQueued.Load(), evalProcessing.Load(), evalRetryable.Load(), evalFailed.Load(), evalOldestAgeSec.Load()
}

type EvaluationQueue struct {
	sessionRepo           repository.TestSessionRepository
	questionRepo          repository.QuestionRepository
	evaluator             *Evaluator
	transcriber           ai.Transcriber
	provider              ai.Provider
	allowClientTranscript bool
	requireNeural         bool
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
		requireNeural:         os.Getenv("REQUIRE_NEURAL_EVALUATION") == "true",
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
			_, _ = q.sessionRepo.ReapStaleEvaluationJobs(ctx)
			q.refreshMetrics(ctx)
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

func (q *EvaluationQueue) refreshMetrics(ctx context.Context) {
	stats, err := q.sessionRepo.EvaluationQueueStats(ctx)
	if err != nil {
		return
	}
	evalQueued.Store(int64(stats.Queued))
	evalProcessing.Store(int64(stats.Processing))
	evalRetryable.Store(int64(stats.RetryableFailed))
	evalFailed.Store(int64(stats.PermanentlyFailed))
	evalOldestAgeSec.Store(stats.OldestProcessingAgeSec)
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

	if job.Mode == "writing" {
		q.processWritingJob(ctx, job, evaluation)
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
		evaluation.Provider = "practice_feedback"
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
	result.Provider = "practice_feedback"
	result.EvaluatorVersion = "2026.1"
	result.FeedbackStatus = "completed"
	result.RetryCount = job.Attempts
	result.CreatedAt = evaluation.CreatedAt

	if evaluator, ok := q.provider.(ai.Evaluator); ok {
		neural, neuralErr := evaluator.Evaluate(ctx, ai.EnrichInput{
			QuestionType: questionType,
			Prompt:       questionPromptText(questionType, nil, job.QuestionID),
			Response:     transcript,
			Transcript:   transcript,
		})
		if neuralErr != nil {
			evaluation.FeedbackStatus = "retryable_failed"
			evaluation.LastError = neuralErr.Error()
			_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)
			q.fail(ctx, job, neuralErr)
			return
		}
		result.Score = neural.Score
		result.CEFRLevel = neural.CEFR
		result.Feedback = neural.Feedback
		result.Provider = neural.Provider
		result.EvaluatorVersion = neural.Model
		result.EvidenceSpans = nil
		for _, span := range neural.Evidence {
			result.EvidenceSpans = append(result.EvidenceSpans, models.EvidenceSpan{
				Start: span.Start, End: span.End, Text: span.Text,
				Label: span.Label, Suggestion: span.Suggestion,
			})
		}
	} else if q.requireNeural {
		evaluation.Status = "INSUFFICIENT"
		evaluation.Score = 0
		evaluation.FeedbackStatus = "unsupported"
		evaluation.LastError = "neural evaluator is required but not configured"
		_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)
		_ = q.sessionRepo.CompleteEvaluationJob(ctx, job.ID)
		return
	}

	if err := q.sessionRepo.UpdateEvaluation(ctx, &result); err != nil {
		q.fail(ctx, job, err)
		return
	}
	_ = q.sessionRepo.UpdateResponseScore(ctx, job.SessionID, job.QuestionID, result.Score, result.Score >= 0.6)
	_ = q.sessionRepo.CompleteEvaluationJob(ctx, job.ID)
}

func (q *EvaluationQueue) processWritingJob(ctx context.Context, job *models.EvaluationJob, evaluation *models.EvaluationResult) {
	evaluation.FeedbackStatus = "evaluating"
	_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)

	questionType := "WRITING_SAMPLE"
	var prompt string
	var keywords []string
	if question, err := q.questionRepo.GetByID(ctx, job.QuestionID); err == nil && question != nil {
		questionType = question.Type
		prompt = questionPromptText(question.Type, question.ContentPayload, job.QuestionID)
		keywords = extractContextKeywords(question.ContentPayload)
	}
	responseText := strings.TrimSpace(job.ClientTranscript)

	var result models.EvaluationResult
	if evaluator, ok := q.provider.(ai.Evaluator); ok {
		neural, err := evaluator.Evaluate(ctx, ai.EnrichInput{
			QuestionType: questionType,
			Prompt:       prompt,
			Response:     responseText,
		})
		if err != nil {
			evaluation.FeedbackStatus = "retryable_failed"
			evaluation.LastError = err.Error()
			_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)
			q.fail(ctx, job, err)
			return
		}
		result = models.EvaluationResult{
			ID: evaluation.ID, SessionID: job.SessionID, QuestionID: job.QuestionID,
			QuestionType: questionType, Status: "COMPLETED", Score: neural.Score,
			CEFRLevel: neural.CEFR, Feedback: neural.Feedback, Provider: neural.Provider,
			EvaluatorVersion: neural.Model, FeedbackStatus: "completed", CreatedAt: evaluation.CreatedAt,
		}
		for _, span := range neural.Evidence {
			result.EvidenceSpans = append(result.EvidenceSpans, models.EvidenceSpan{
				Start: span.Start, End: span.End, Text: span.Text,
				Label: span.Label, Suggestion: span.Suggestion,
			})
		}
	} else if q.requireNeural {
		evaluation.Status = "INSUFFICIENT"
		evaluation.Score = 0
		evaluation.FeedbackStatus = "unsupported"
		evaluation.LastError = "neural evaluator is required but not configured"
		_ = q.sessionRepo.UpdateEvaluation(ctx, evaluation)
		_ = q.sessionRepo.CompleteEvaluationJob(ctx, job.ID)
		return
	} else {
		result = q.evaluator.EvaluateWriting(job.SessionID, job.QuestionID, questionType, responseText, keywords)
		result.ID = evaluation.ID
		result.Provider = "practice_feedback"
		result.EvaluatorVersion = "2026.1"
		result.FeedbackStatus = "completed"
		result.RetryCount = job.Attempts
	}

	if err := q.sessionRepo.UpdateEvaluation(ctx, &result); err != nil {
		q.fail(ctx, job, err)
		return
	}
	_ = q.sessionRepo.UpdateResponseScore(ctx, job.SessionID, job.QuestionID, result.Score, result.Score >= 0.6)
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
		Mode:             "speaking",
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

func (q *EvaluationQueue) EnqueueWritingEvaluation(
	ctx context.Context,
	sessionID, questionID, evaluationID, text string,
) error {
	now := time.Now().UTC()
	return q.sessionRepo.CreateEvaluationJob(ctx, &models.EvaluationJob{
		ID:               uuid.New().String(),
		SessionID:        sessionID,
		QuestionID:       questionID,
		EvaluationID:     evaluationID,
		ClientTranscript: text,
		Mode:             "writing",
		Status:           "queued",
		Attempts:         0,
		MaxAttempts:      3,
		NextAttemptAt:    now,
		CreatedAt:        now,
		UpdatedAt:        now,
	})
}
