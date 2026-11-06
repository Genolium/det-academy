package tests

import (
	"context"
	"database/sql"
	"os"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/repository/postgres"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

func TestPostgresAnalyticsExcludesStaffAndBreaksDownErrors(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	admin, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("open admin db: %v", err)
	}
	defer admin.Close()

	schema := "analytics_" + strings.ReplaceAll(uuid.NewString()[:8], "-", "")
	if _, err := admin.Exec(`CREATE SCHEMA "` + schema + `"`); err != nil {
		t.Fatalf("create schema: %v", err)
	}
	defer admin.Exec(`DROP SCHEMA IF EXISTS "` + schema + `" CASCADE`)

	separator := "?"
	if strings.Contains(databaseURL, "?") {
		separator = "&"
	}
	db, err := sql.Open("postgres", databaseURL+separator+"search_path="+schema)
	if err != nil {
		t.Fatalf("open scoped db: %v", err)
	}
	defer db.Close()

	if _, err := db.Exec(`
		CREATE TABLE users (id UUID PRIMARY KEY, role VARCHAR(20), created_at TIMESTAMPTZ);
		CREATE TABLE user_activity (user_id UUID, activity_date DATE);
		CREATE TABLE test_sessions (
			id VARCHAR(100), user_id UUID, status VARCHAR(20), mode VARCHAR(20),
			created_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
		);
		CREATE TABLE evaluations (
			id VARCHAR(100), question_type VARCHAR(50), status VARCHAR(20),
			last_error TEXT, created_at TIMESTAMPTZ
		);
		CREATE TABLE session_events (event_type VARCHAR(50), created_at TIMESTAMPTZ);
		CREATE TABLE ai_usage_events (kind VARCHAR(20), created_at TIMESTAMPTZ);
		CREATE TABLE xp_events (xp INT, created_at TIMESTAMPTZ);
	`); err != nil {
		t.Fatalf("create tables: %v", err)
	}

	now := time.Now().UTC()
	studentID := uuid.NewString()
	adminID := uuid.NewString()
	if _, err := db.Exec(`INSERT INTO users (id, role, created_at) VALUES ($1, 'student', $2), ($3, 'superadmin', $2)`, studentID, now, adminID); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`INSERT INTO user_activity (user_id, activity_date) VALUES ($1, CURRENT_DATE), ($2, CURRENT_DATE)`, studentID, adminID); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`INSERT INTO test_sessions (id, user_id, status, mode, created_at, completed_at) VALUES ('s1', $1, 'COMPLETED', 'full', $2, $2)`, studentID, now); err != nil {
		t.Fatal(err)
	}
	for _, row := range []struct {
		status, errText string
	}{
		{"COMPLETED", ""},
		{"FAILED", "speechkit: empty recognition result"},
		{"EMPTY", ""},
		{"INSUFFICIENT", ""},
	} {
		if _, err := db.Exec(`INSERT INTO evaluations (id, question_type, status, last_error, created_at) VALUES ($1, 'SPEAK_PHOTO', $2, $3, $4)`, uuid.NewString(), row.status, row.errText, now); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := db.Exec(`INSERT INTO session_events (event_type, created_at) VALUES ('ANSWER_REJECTED_DEADLINE', $1), ('STAGE_TIMEOUT', $1)`, now); err != nil {
		t.Fatal(err)
	}

	store, err := postgres.New(databaseURL + separator + "search_path=" + schema)
	if err != nil {
		t.Fatalf("open analytics store: %v", err)
	}
	defer store.Close()

	from := now.Add(-24 * time.Hour)
	to := now.Add(time.Hour)
	overview, err := store.Analytics().AnalyticsOverview(context.Background(), from, to, now)
	if err != nil {
		t.Fatalf("overview: %v", err)
	}
	if overview.TotalUsers != 1 || overview.Active.DAU != 1 {
		t.Fatalf("students = %d, DAU = %d; staff must be excluded", overview.TotalUsers, overview.Active.DAU)
	}
	if overview.CompletedEvaluations != 1 || overview.FailedEvaluations != 1 || overview.EmptyEvaluations != 1 || overview.InsufficientEvaluations != 1 {
		t.Fatalf("evaluation statuses = completed %d / failed %d / empty %d / insufficient %d",
			overview.CompletedEvaluations, overview.FailedEvaluations, overview.EmptyEvaluations, overview.InsufficientEvaluations)
	}
	if overview.ErrorBreakdown.EmptyRecognition != 1 {
		t.Fatalf("empty recognition = %d, want 1", overview.ErrorBreakdown.EmptyRecognition)
	}
	if overview.ErrorBreakdown.DeadlineRejections != 1 || overview.ErrorBreakdown.StageTimeouts != 1 {
		t.Fatalf("event breakdown = deadline %d / timeout %d", overview.ErrorBreakdown.DeadlineRejections, overview.ErrorBreakdown.StageTimeouts)
	}
	if overview.ErrorCount != 3 {
		t.Fatalf("error count = %d, want 3 (failed + deadline + timeout)", overview.ErrorCount)
	}

	signups, err := store.Analytics().AnalyticsTimeseries(context.Background(), "signups", from, to, "day")
	if err != nil {
		t.Fatalf("signups timeseries: %v", err)
	}
	signupTotal := 0
	for _, point := range signups {
		signupTotal += point.Value
	}
	if signupTotal != 1 {
		t.Fatalf("signup series = %d, want 1 student", signupTotal)
	}
}
