package tests

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/postgres"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

func TestPostgresEvaluationJobLeaseReclaimsAndReaps(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	store, err := postgres.New(databaseURL)
	if err != nil {
		t.Fatalf("connect postgres: %v", err)
	}
	defer store.Close()
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("open sql: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	user := &models.User{
		ID: uuid.NewString(), Email: "lease-" + uuid.NewString()[:8] + "@example.com",
		PasswordHash: "not-used", Name: "Lease Test", Role: "student", Locale: "ru",
	}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatalf("create user: %v", err)
	}
	defer store.Users().Delete(ctx, user.ID)

	session := &models.TestSession{
		ID: uuid.NewString(), UserID: user.ID, CandidateName: "Lease Test",
		Status: "IN_PROGRESS", CurrentStage: 13, StageName: "SPEAKING_SAMPLE",
		DifficultyLevel: "B1", Mode: "full",
	}
	if err := store.Sessions().Create(ctx, session); err != nil {
		t.Fatalf("create session: %v", err)
	}

	createJob := func(attempts, maxAttempts int) *models.EvaluationJob {
		evaluation := &models.EvaluationResult{
			ID: uuid.NewString(), SessionID: session.ID, QuestionID: "q-" + uuid.NewString(),
			QuestionType: "SPEAK_PHOTO", Status: "PENDING", FeedbackStatus: "queued",
			CreatedAt: time.Now().UTC(),
		}
		if err := store.Sessions().SaveEvaluation(ctx, evaluation); err != nil {
			t.Fatalf("save evaluation: %v", err)
		}
		job := &models.EvaluationJob{
			ID: uuid.NewString(), SessionID: session.ID, QuestionID: evaluation.QuestionID,
			EvaluationID: evaluation.ID, Status: "processing", Attempts: attempts, MaxAttempts: maxAttempts,
			NextAttemptAt: time.Now().Add(-time.Minute), CreatedAt: time.Now().Add(-10 * time.Minute), UpdatedAt: time.Now().Add(-10 * time.Minute),
		}
		if err := store.Sessions().CreateEvaluationJob(ctx, job); err != nil {
			t.Fatalf("create job: %v", err)
		}
		if _, err := db.ExecContext(ctx, `UPDATE evaluation_jobs SET status='processing', attempts=$2, max_attempts=$3, updated_at=NOW()-INTERVAL '10 minutes' WHERE id=$1`, job.ID, attempts, maxAttempts); err != nil {
			t.Fatalf("seed stale job: %v", err)
		}
		return job
	}

	stale := createJob(1, 3)
	claimed, err := store.Sessions().ClaimEvaluationJob(ctx)
	if err != nil {
		t.Fatalf("claim stale job: %v", err)
	}
	if claimed.ID != stale.ID || claimed.Attempts != 2 {
		t.Fatalf("expected stale job %s attempt 2, got %+v", stale.ID, claimed)
	}
	if err := store.Sessions().CompleteEvaluationJob(ctx, claimed.ID); err != nil {
		t.Fatalf("complete job: %v", err)
	}
	if pending, err := store.Sessions().CountPendingEvaluationJobs(ctx, session.ID); err != nil || pending != 0 {
		t.Fatalf("expected no pending jobs, got %d err=%v", pending, err)
	}

	exhausted := createJob(3, 3)
	reaped, err := store.Sessions().ReapStaleEvaluationJobs(ctx)
	if err != nil || reaped < 1 {
		t.Fatalf("expected reaped job, got %d err=%v", reaped, err)
	}
	if _, err := store.Sessions().ClaimEvaluationJob(ctx); err == nil {
		t.Fatal("exhausted processing job must not be reclaimed")
	}
	var status string
	if err := db.QueryRowContext(ctx, `SELECT status FROM evaluation_jobs WHERE id=$1`, exhausted.ID).Scan(&status); err != nil {
		t.Fatalf("read reaped status: %v", err)
	}
	if status != "permanently_failed" {
		t.Fatalf("expected permanently_failed, got %s", status)
	}
	stats, err := store.Sessions().EvaluationQueueStats(ctx)
	if err != nil {
		t.Fatalf("queue stats: %v", err)
	}
	if stats.PermanentlyFailed < 1 {
		t.Fatalf("expected permanently failed metric, got %+v", stats)
	}
}
