package tests

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/postgres"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

// answerPayload is accepted by every grader: unknown fields are ignored and the
// test is about the flow, not about answer accuracy.
var answerPayload = json.RawMessage(`{"text":"The library provides free access to academic journals.","transcript":"I prefer living in a large city because it offers more opportunities.","answer":"ergy","isReal":true,"answers":["a"],"durationSec":60}`)

// TestPostgresFullMockCompletesExactlyOnce drives the complete 13-stage mock
// test on a real PostgreSQL database: every stage is answered and completed,
// a retried answer is rejected, the finalisation is idempotent and a second
// complete call returns the same immutable result.
func TestPostgresFullMockCompletesExactlyOnce(t *testing.T) {
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
	user := &models.User{
		ID:           userID,
		Email:        "full-mock-" + userID[:8] + "@example.com",
		PasswordHash: "not-used",
		Name:         "Full Mock",
		Role:         "student",
		Locale:       "ru",
	}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatalf("create user: %v", err)
	}
	defer store.Users().Delete(ctx, user.ID)

	cat := service.NewCATService(
		store.Sessions(),
		store.Questions(),
		store.Theory(),
		store.Certificates(),
		service.NewTheoryService(store.Theory()),
		store.Study(),
	)

	session, _, err := cat.StartSession(ctx, user.ID, "Full Mock", "B1")
	if err != nil {
		t.Fatalf("start session: %v", err)
	}

	for stageIndex := 0; stageIndex < len(service.StageSequence); stageIndex++ {
		stage := session.StageName
		assigned, err := store.Sessions().GetAssignedQuestions(ctx, session.ID, stage)
		if err != nil {
			t.Fatalf("assigned questions for %s: %v", stage, err)
		}
		if len(assigned) == 0 {
			t.Fatalf("stage %s has no assigned questions", stage)
		}

		for _, question := range assigned {
			if _, _, err := cat.RecordQuestionResponse(ctx, session.ID, user.ID, models.SubmitResponseRequest{
				QuestionID:   question.QuestionID,
				UserResponse: answerPayload,
				TimeSpentSec: 1,
			}); err != nil {
				t.Fatalf("stage %s question %s: %v", stage, question.QuestionID, err)
			}
		}

		// A retried answer must never replace the graded one.
		if _, _, err := cat.RecordQuestionResponse(ctx, session.ID, user.ID, models.SubmitResponseRequest{
			QuestionID:   assigned[0].QuestionID,
			UserResponse: answerPayload,
			TimeSpentSec: 1,
		}); !errors.Is(err, service.ErrQuestionAlreadyAnswered) {
			t.Fatalf("stage %s: expected ErrQuestionAlreadyAnswered, got %v", stage, err)
		}

		session, _, err = cat.SubmitStageResult(ctx, session.ID, user.ID, models.StageCompleteRequest{StageName: stage})
		if err != nil {
			t.Fatalf("complete stage %s: %v", stage, err)
		}
		if session.StageName == stage {
			t.Fatalf("stage %s did not advance", stage)
		}
	}

	if session.StageName != "COMPLETED" {
		t.Fatalf("session did not reach COMPLETED, current stage %q", session.StageName)
	}

	result, err := cat.CompleteSession(ctx, session.ID, user.ID, models.CompleteSessionRequest{})
	if err != nil {
		t.Fatalf("complete session: %v", err)
	}
	if result.Session.Status != "COMPLETED" {
		t.Fatalf("session status = %q, want COMPLETED", result.Session.Status)
	}

	// Finalisation is idempotent: a retry returns the same immutable result.
	again, err := cat.CompleteSession(ctx, session.ID, user.ID, models.CompleteSessionRequest{})
	if err != nil {
		t.Fatalf("second complete: %v", err)
	}
	if again.Scores.Overall != result.Scores.Overall {
		t.Fatalf("second complete changed the score: %d -> %d", result.Scores.Overall, again.Scores.Overall)
	}
	if again.Session.CompletedAt == nil || result.Session.CompletedAt == nil {
		t.Fatal("completed session must have a completion timestamp")
	}

	// A stage result cannot be submitted after the session is finalised.
	if _, _, err := cat.SubmitStageResult(ctx, session.ID, user.ID, models.StageCompleteRequest{StageName: "SPEAKING_SAMPLE"}); err == nil {
		t.Fatal("stage completion after finalisation must be rejected")
	}
}

// TestPostgresEvaluationJobSurvivesReconnect proves that a queued evaluation
// job is durable: it is still claimable after the worker's connection is
// closed and reopened, which is what happens on a container restart.
func TestPostgresEvaluationJobSurvivesReconnect(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	ctx := context.Background()

	first, err := postgres.New(dbURL)
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}

	userID := uuid.NewString()
	if err := first.Users().Create(ctx, &models.User{
		ID: userID, Email: "restart-" + userID[:8] + "@example.com",
		PasswordHash: "not-used", Name: "Restart", Role: "student", Locale: "ru",
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	session := &models.TestSession{
		ID: uuid.NewString(), UserID: userID, CandidateName: "Restart",
		Status: "IN_PROGRESS", CurrentStage: 13, StageName: "SPEAKING_SAMPLE",
		DifficultyLevel: "B1", Mode: "full",
	}
	if err := first.Sessions().Create(ctx, session); err != nil {
		t.Fatalf("create session: %v", err)
	}
	evaluation := &models.EvaluationResult{
		ID: uuid.NewString(), SessionID: session.ID, QuestionID: "q-restart",
		QuestionType: "SPEAKING_SAMPLE", Status: "PENDING", FeedbackStatus: "queued",
	}
	if err := first.Sessions().SaveEvaluation(ctx, evaluation); err != nil {
		t.Fatalf("save evaluation: %v", err)
	}
	job := &models.EvaluationJob{
		ID: uuid.NewString(), SessionID: session.ID, QuestionID: "q-restart",
		EvaluationID: evaluation.ID, Status: "queued", MaxAttempts: 3,
	}
	if err := first.Sessions().CreateEvaluationJob(ctx, job); err != nil {
		t.Fatalf("enqueue job: %v", err)
	}

	// Simulate a restart: the worker's connection is closed.
	if err := first.Close(); err != nil {
		t.Fatalf("close first connection: %v", err)
	}

	second, err := postgres.New(dbURL)
	if err != nil {
		t.Fatalf("reopen postgres: %v", err)
	}
	defer second.Close()

	// The job itself must be durable. The queue may contain jobs left by other
	// tests, so the claim is checked by identity instead of assuming this job
	// is the oldest one.
	var status string
	if err := second.DB().QueryRowContext(ctx, `SELECT status FROM evaluation_jobs WHERE id = $1`, job.ID).Scan(&status); err != nil {
		t.Fatalf("job did not survive the restart: %v", err)
	}
	if status != "queued" {
		t.Fatalf("job status after restart = %q, want queued", status)
	}

	found := false
	for attempt := 0; attempt < 200 && !found; attempt++ {
		claimed, err := second.Sessions().ClaimEvaluationJob(ctx)
		if err != nil {
			t.Fatalf("claim job after restart: %v", err)
		}
		if claimed == nil {
			break
		}
		// Leave the queue clean for the other integration tests: every claimed
		// job is completed, including the leftovers from previous runs.
		if err := second.Sessions().CompleteEvaluationJob(ctx, claimed.ID); err != nil {
			t.Fatalf("complete claimed job: %v", err)
		}
		if claimed.ID == job.ID {
			found = true
		}
	}
	if !found {
		t.Fatal("queued job was not claimable after the restart")
	}

	// Removing the user cascades to the session, the evaluation and its job.
	if _, err := second.DB().ExecContext(ctx, `DELETE FROM users WHERE id = $1`, userID); err != nil {
		t.Fatalf("cleanup user: %v", err)
	}
}
