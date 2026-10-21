package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"det-academy-backend/internal/ai"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"

	"github.com/google/uuid"
)

type fakeTranscriber struct{ text string }

func (f fakeTranscriber) Name() string { return "fake" }
func (f fakeTranscriber) Transcribe(ctx context.Context, audioPath, mimeType string) (string, error) {
	if f.text == "" {
		return "", errors.New("transcription failed")
	}
	return f.text, nil
}

func TestEvaluationQueueUsesServerTranscript(t *testing.T) {
	store := memory.New()
	session := &models.TestSession{
		ID: uuid.New().String(), UserID: uuid.New().String(), Status: "IN_PROGRESS",
		StageName: "SPEAKING_SAMPLE", CurrentStage: 13, DifficultyLevel: "B1",
	}
	if err := store.Sessions().Create(context.Background(), session); err != nil {
		t.Fatalf("create session: %v", err)
	}
	evaluation := &models.EvaluationResult{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-sp-01",
		QuestionType: "SPEAK_PHOTO", Status: "PENDING", SpeakingDuration: 75,
		FeedbackStatus: "queued", CreatedAt: time.Now().UTC(),
	}
	if err := store.Sessions().SaveEvaluation(context.Background(), evaluation); err != nil {
		t.Fatalf("save evaluation: %v", err)
	}
	job := &models.EvaluationJob{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-sp-01",
		EvaluationID: evaluation.ID, AudioPath: "/tmp/test.webm", Status: "queued", MaxAttempts: 3,
		NextAttemptAt: time.Now().Add(-time.Second), CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	if err := store.Sessions().CreateEvaluationJob(context.Background(), job); err != nil {
		t.Fatalf("create job: %v", err)
	}

	queue := NewEvaluationQueue(store.Sessions(), store.Questions(), fakeTranscriber{text: "I can see a group of students working together in a bright modern laboratory. They are discussing an experiment and taking notes."}, nil)
	claimed, err := store.Sessions().ClaimEvaluationJob(context.Background())
	if err != nil {
		t.Fatalf("claim job: %v", err)
	}
	queue.processJob(context.Background(), claimed)

	evaluations, err := store.Sessions().GetSessionEvaluations(context.Background(), session.ID)
	if err != nil || len(evaluations) != 1 {
		t.Fatalf("expected one evaluation, got %v %v", evaluations, err)
	}
	result := evaluations[0]
	if result.TranscriptSource != "server" {
		t.Fatalf("expected server transcript, got %s", result.TranscriptSource)
	}
	if result.Score <= 0 || result.FeedbackStatus != "completed" {
		t.Fatalf("expected completed scored evaluation, got score %.2f status %s", result.Score, result.FeedbackStatus)
	}
	if result.Provider != "rule-based" {
		t.Fatalf("expected rule-based provider, got %s", result.Provider)
	}
}

func TestEvaluationQueueMarksUnsupportedWithoutSTT(t *testing.T) {
	store := memory.New()
	session := &models.TestSession{
		ID: uuid.New().String(), UserID: uuid.New().String(), Status: "IN_PROGRESS",
		StageName: "SPEAKING_SAMPLE", CurrentStage: 13, DifficultyLevel: "B1",
	}
	_ = store.Sessions().Create(context.Background(), session)
	evaluation := &models.EvaluationResult{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-sp-01",
		QuestionType: "SPEAK_PHOTO", Status: "PENDING", SpeakingDuration: 75,
		FeedbackStatus: "queued", CreatedAt: time.Now().UTC(),
	}
	_ = store.Sessions().SaveEvaluation(context.Background(), evaluation)
	job := &models.EvaluationJob{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-sp-01",
		EvaluationID: evaluation.ID, Status: "queued", MaxAttempts: 3,
		NextAttemptAt: time.Now().Add(-time.Second), CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	_ = store.Sessions().CreateEvaluationJob(context.Background(), job)

	queue := NewEvaluationQueue(store.Sessions(), store.Questions(), nil, nil)
	claimed, _ := store.Sessions().ClaimEvaluationJob(context.Background())
	queue.processJob(context.Background(), claimed)

	evaluations, _ := store.Sessions().GetSessionEvaluations(context.Background(), session.ID)
	if len(evaluations) != 1 {
		t.Fatal("expected one evaluation")
	}
	if evaluations[0].FeedbackStatus != "unsupported" || evaluations[0].Score != 0 {
		t.Fatalf("expected unsupported zero-score evaluation, got %+v", evaluations[0])
	}
}

func TestCompleteSessionRejectsPendingEvaluations(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	queue := NewEvaluationQueue(store.Sessions(), store.Questions(), nil, nil)
	cat.SetEvaluationQueue(queue)
	ctx := context.Background()

	session := &models.TestSession{
		ID: uuid.New().String(), UserID: uuid.New().String(), Status: "IN_PROGRESS",
		StageName: "COMPLETED", CurrentStage: 14, DifficultyLevel: "B1",
	}
	_ = store.Sessions().Create(ctx, session)
	evaluation := &models.EvaluationResult{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-sp-01",
		QuestionType: "SPEAK_PHOTO", Status: "PENDING", SpeakingDuration: 75,
		FeedbackStatus: "queued", CreatedAt: time.Now().UTC(),
	}
	_ = store.Sessions().SaveEvaluation(ctx, evaluation)
	_ = store.Sessions().CreateEvaluationJob(ctx, &models.EvaluationJob{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-sp-01",
		EvaluationID: evaluation.ID, Status: "queued", MaxAttempts: 3,
		NextAttemptAt: time.Now().UTC(), CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	})

	_, err := cat.CompleteSession(ctx, session.ID, session.UserID, models.CompleteSessionRequest{})
	if !errors.Is(err, ErrEvaluationPending) {
		t.Fatalf("expected ErrEvaluationPending, got %v", err)
	}
}

type fakeNeuralProvider struct{}

func (fakeNeuralProvider) Name() string    { return "fake-neural" }
func (fakeNeuralProvider) Version() string { return "test-v1" }
func (fakeNeuralProvider) Enrich(ctx context.Context, input ai.EnrichInput) (ai.Enrichment, error) {
	return ai.Enrichment{Feedback: "ok", Provider: "fake-neural", Model: "test-v1"}, nil
}
func (fakeNeuralProvider) Evaluate(ctx context.Context, input ai.EnrichInput) (ai.Evaluation, error) {
	return ai.Evaluation{
		Score: 0.8, CEFR: "B2", Feedback: "Clear, but add evidence.",
		Provider: "fake-neural", Model: "test-v1",
		Evidence: []ai.Evidence{{Start: 0, End: 4, Text: "test", Label: "vague_claim"}},
	}, nil
}

func TestEvaluationQueueUsesNeuralWritingEvaluator(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	session := &models.TestSession{ID: uuid.New().String(), UserID: uuid.New().String(), Status: "IN_PROGRESS", StageName: "WRITING_SAMPLE", CurrentStage: 12, DifficultyLevel: "B1"}
	_ = store.Sessions().Create(ctx, session)
	_ = store.Sessions().RecordResponse(ctx, &models.QuestionResponse{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-ws-01",
		UserResponse: []byte(`{"text":"A short response."}`), RawScore: 0,
		CreatedAt: time.Now().UTC(),
	})
	evaluation := &models.EvaluationResult{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-ws-01",
		QuestionType: "WRITING_SAMPLE", Status: "PENDING", FeedbackStatus: "queued", CreatedAt: time.Now().UTC(),
	}
	_ = store.Sessions().SaveEvaluation(ctx, evaluation)
	_ = store.Sessions().CreateEvaluationJob(ctx, &models.EvaluationJob{
		ID: uuid.New().String(), SessionID: session.ID, QuestionID: "q-ws-01",
		EvaluationID: evaluation.ID, Mode: "writing", ClientTranscript: "A short response.",
		Status: "queued", MaxAttempts: 3, NextAttemptAt: time.Now().Add(-time.Second),
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	})

	queue := NewEvaluationQueue(store.Sessions(), store.Questions(), nil, fakeNeuralProvider{})
	claimed, _ := store.Sessions().ClaimEvaluationJob(ctx)
	queue.processJob(ctx, claimed)

	evaluations, _ := store.Sessions().GetSessionEvaluations(ctx, session.ID)
	if len(evaluations) != 1 || evaluations[0].Provider != "fake-neural" || evaluations[0].Score != 0.8 {
		t.Fatalf("expected neural evaluation, got %+v", evaluations)
	}
	responses, _ := store.Sessions().GetSessionResponses(ctx, session.ID)
	if len(responses) != 1 || responses[0].RawScore != 0.8 {
		t.Fatalf("expected response score to be updated, got %+v", responses)
	}
}
