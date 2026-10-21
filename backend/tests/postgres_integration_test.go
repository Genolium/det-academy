package tests

import (
	"context"
	"os"
	"sync"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/postgres"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

// TestPostgresTrustedCompletionIntegrity runs against a real PostgreSQL
// database. It is skipped unless TEST_DATABASE_URL is provided.
func TestPostgresTrustedCompletionIntegrity(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx := context.Background()
	store, err := postgres.New(dbURL)
	if err != nil {
		t.Fatalf("failed to open postgres: %v", err)
	}
	defer store.Close()

	userID := uuid.NewString()
	user := &models.User{
		ID:           userID,
		Email:        "pg-integrity-" + userID[:8] + "@example.com",
		PasswordHash: "not-used",
		Name:         "PG Integrity",
		Role:         "student",
		Locale:       "ru",
	}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Theory completion is required for certificate issuance.
	for i := 1; i <= service.TotalTheoryLessons; i++ {
		if err := store.Theory().SetProgress(ctx, userID, "lesson-"+uuid.NewString()[:6], true); err != nil {
			t.Fatalf("failed to seed theory progress: %v", err)
		}
	}

	cat := service.NewCATService(
		store.Sessions(),
		store.Questions(),
		store.Theory(),
		store.Certificates(),
		service.NewTheoryService(store.Theory()),
	)
	session, _, err := cat.StartSession(ctx, userID, "PG Integrity", "B1")
	if err != nil {
		t.Fatalf("failed to start session: %v", err)
	}

	responses := []struct {
		questionID string
		payload    string
	}{
		{"q-rs-01", `{"isReal":true}`},
		{"q-rs-02", `{"isReal":false}`},
		{"q-rs-03", `{"isReal":true}`},
		{"q-rs-04", `{"isReal":true}`},
		{"q-lt-01", `"The library provides free access to academic journals."`},
		{"q-lt-02", `"Technological innovations are reshaping global transportation networks."`},
		{"q-ws-01", `{"text":"A balanced education combines practical career skills with rigorous academic theory. Practical courses teach collaboration and problem solving, while seminars develop analytical habits that make graduates adaptable over time."}`},
		{"q-ss-01", `{"transcript":"I prefer living in a large city because it offers more educational and professional opportunities. Public transport makes it easier to attend classes and internships, and cultural events expose me to different perspectives.","durationSec":150}`},
	}
	for _, item := range responses {
		if err := store.Sessions().RecordResponse(ctx, &models.QuestionResponse{
			ID:           uuid.NewString(),
			SessionID:    session.ID,
			QuestionID:   item.questionID,
			UserResponse: []byte(item.payload),
			RawScore:     0.9,
			TimeSpentSec: 20,
			CreatedAt:    time.Now().UTC(),
		}); err != nil {
			t.Fatalf("failed to record response %s: %v", item.questionID, err)
		}
	}

	// Replaying the same question must update, not duplicate, the response.
	if err := store.Sessions().RecordResponse(ctx, &models.QuestionResponse{
		ID:           uuid.NewString(),
		SessionID:    session.ID,
		QuestionID:   "q-rs-01",
		UserResponse: []byte(`{"isReal":true}`),
		RawScore:     0.95,
		TimeSpentSec: 22,
		CreatedAt:    time.Now().UTC(),
	}); err != nil {
		t.Fatalf("failed to upsert response: %v", err)
	}
	storedResponses, err := store.Sessions().GetSessionResponses(ctx, session.ID)
	if err != nil {
		t.Fatalf("failed to read responses: %v", err)
	}
	countReadSelect := 0
	for _, response := range storedResponses {
		if response.QuestionID == "q-rs-01" {
			countReadSelect++
			if response.RawScore < 0.94 {
				t.Fatalf("expected upserted raw score, got %.2f", response.RawScore)
			}
		}
	}
	if countReadSelect != 1 {
		t.Fatalf("expected exactly one response per question, got %d", countReadSelect)
	}

	// Simulate the end of the final stage; CompleteSession is not allowed early.
	session.StageName = "COMPLETED"
	session.CurrentStage = 14
	if err := store.Sessions().Update(ctx, session); err != nil {
		t.Fatalf("failed to finish session stage: %v", err)
	}

	// Two concurrent completions must converge on one immutable result.
	type completion struct {
		result *models.SessionCompleteResponse
		err    error
	}
	completions := make([]completion, 2)
	var wg sync.WaitGroup
	for i := range completions {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			result, err := cat.CompleteSession(ctx, session.ID, userID, models.CompleteSessionRequest{})
			completions[index] = completion{result: result, err: err}
		}(i)
	}
	wg.Wait()

	for i, completion := range completions {
		if completion.err != nil {
			t.Fatalf("concurrent completion %d failed: %v", i, completion.err)
		}
		if completion.result == nil || completion.result.Scores.Overall <= 0 {
			t.Fatalf("concurrent completion %d returned no measured overall score", i)
		}
		if !completion.result.CertificateEligible || completion.result.Certificate == nil {
			t.Fatalf("concurrent completion %d did not return the issued certificate", i)
		}
	}
	if completions[0].result.Scores.Overall != completions[1].result.Scores.Overall {
		t.Fatalf(
			"concurrent completions returned different scores: %d vs %d",
			completions[0].result.Scores.Overall,
			completions[1].result.Scores.Overall,
		)
	}

	cert, err := store.Certificates().GetBySessionID(ctx, session.ID)
	if err != nil || cert == nil {
		t.Fatalf("expected one certificate for session, got %v", err)
	}

	// A repeated completion after the fact is idempotent.
	repeated, err := cat.CompleteSession(ctx, session.ID, userID, models.CompleteSessionRequest{})
	if err != nil {
		t.Fatalf("repeated completion failed: %v", err)
	}
	if repeated.Scores.Overall != completions[0].result.Scores.Overall {
		t.Fatalf("repeated completion changed the result")
	}
}
