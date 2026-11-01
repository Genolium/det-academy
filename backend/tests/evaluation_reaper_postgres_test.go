package tests

import (
	"context"
	"os"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/postgres"

	"github.com/google/uuid"
)

// A stale processing job must not leave the linked evaluation PENDING forever:
// completion would otherwise count it as a zero score instead of an
// unmeasured skill.
func TestPostgresReaperMarksLinkedEvaluationFailed(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx := context.Background()
	store, err := postgres.New(dbURL)
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}
	defer store.Close()

	userID := uuid.NewString()
	if err := store.Users().Create(ctx, &models.User{
		ID:           userID,
		Email:        "reaper-" + userID[:8] + "@example.com",
		PasswordHash: "not-used",
		Name:         "Reaper Test",
		Role:         "student",
		Locale:       "ru",
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	defer store.Users().Delete(ctx, userID)

	session := &models.TestSession{
		ID:              uuid.NewString(),
		UserID:          userID,
		Status:          "IN_PROGRESS",
		StageName:       "SPEAKING_SAMPLE",
		CurrentStage:    13,
		DifficultyLevel: "B1",
		Mode:            "full",
	}
	if err := store.Sessions().Create(ctx, session); err != nil {
		t.Fatalf("create session: %v", err)
	}

	evaluation := &models.EvaluationResult{
		ID:           uuid.NewString(),
		SessionID:    session.ID,
		QuestionID:   "q-reaper",
		QuestionType: "SPEAK_PHOTO",
		Status:       "PENDING",
		CreatedAt:    time.Now().UTC(),
	}
	if err := store.Sessions().SaveEvaluation(ctx, evaluation); err != nil {
		t.Fatalf("save evaluation: %v", err)
	}
	if err := store.Sessions().CreateEvaluationJob(ctx, &models.EvaluationJob{
		ID:           uuid.NewString(),
		SessionID:    session.ID,
		QuestionID:   "q-reaper",
		EvaluationID: evaluation.ID,
		Status:       "processing",
		Attempts:     3,
		MaxAttempts:  3,
		CreatedAt:    time.Now().Add(-10 * time.Minute),
		UpdatedAt:    time.Now().Add(-10 * time.Minute),
	}); err != nil {
		t.Fatalf("create job: %v", err)
	}

	reaped, err := store.Sessions().ReapStaleEvaluationJobs(ctx)
	if err != nil || reaped != 1 {
		t.Fatalf("reap: got %d err=%v", reaped, err)
	}
	evaluations, err := store.Sessions().GetSessionEvaluations(ctx, session.ID)
	if err != nil || len(evaluations) != 1 {
		t.Fatalf("read evaluations: %v %v", evaluations, err)
	}
	if evaluations[0].Status != "FAILED" || evaluations[0].FeedbackStatus != "permanently_failed" {
		t.Fatalf("reaped evaluation was not marked failed: %+v", evaluations[0])
	}
}
