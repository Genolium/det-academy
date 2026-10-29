package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"encoding/json"
	"testing"
	"time"
)

func TestLevenshteinDistance(t *testing.T) {
	tests := []struct {
		s1       string
		s2       string
		expected int
	}{
		{"", "", 0},
		{"a", "", 1},
		{"", "b", 1},
		{"kitten", "sitting", 3},
		{"book", "back", 2},
		{"Duolingo", "Duolingo", 0},
		{"academy", "academi", 1},
		{"тест", "тост", 1}, // Unicode multi-byte test
	}

	for _, tt := range tests {
		actual := LevenshteinDistance(tt.s1, tt.s2)
		if actual != tt.expected {
			t.Errorf("LevenshteinDistance(%q, %q) = %d; expected %d", tt.s1, tt.s2, actual, tt.expected)
		}
	}
}

func TestStringSimilarity(t *testing.T) {
	sim := StringSimilarity("university", "university")
	if sim != 1.0 {
		t.Errorf("expected 1.0 for identical strings, got %f", sim)
	}

	diff := StringSimilarity("university", "univercity")
	if diff < 0.85 {
		t.Errorf("expected high similarity for single typo, got %f", diff)
	}
}

func TestIRT2PLAndThetaScoring(t *testing.T) {
	// P(θ) at θ = b should be exactly 0.5
	p := ProbabilityCorrect2PL(0.0, 0.0, 1.2)
	if p < 0.49 || p > 0.51 {
		t.Errorf("expected P(0|b=0) ~ 0.5, got %f", p)
	}

	// ThetaToDetScore: θ = 0.0 should be ~105
	score0 := ThetaToDetScore(0.0)
	if score0 != 105 {
		t.Errorf("expected θ=0 to map to 105, got %d", score0)
	}

	// ThetaToDetScore: θ = 2.0 should be >= 140
	scoreHigh := ThetaToDetScore(2.0)
	if scoreHigh < 140 {
		t.Errorf("expected θ=2.0 to be >= 140, got %d", scoreHigh)
	}

	// ComputeNextDifficulty transitions
	if diff := ComputeNextDifficulty("B1", 0.95); diff != "B2" && diff != "C1" {
		t.Errorf("expected promotion from B1 with 95%% accuracy, got %s", diff)
	}
}

func TestBlueprintSelectionAndTimeoutEvents(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	ctx := context.Background()

	blueprint := models.GetDefaultExamBlueprint()
	if blueprint.Version != "2026.1" {
		t.Fatalf("expected versioned blueprint, got %s", blueprint.Version)
	}
	for _, stage := range blueprint.Stages {
		if stage.StageName == "INTERACTIVE_READING" && stage.ItemCount != 2 {
			t.Fatalf("expected 2 interactive reading blocks, got %d", stage.ItemCount)
		}
		if stage.StageName == "INTERACTIVE_LISTENING" && stage.ItemCount != 2 {
			t.Fatalf("expected 2 interactive listening blocks, got %d", stage.ItemCount)
		}
	}

	reading, err := cat.stageQuestions(ctx, "", "INTERACTIVE_READING", "B1")
	if err != nil {
		t.Fatalf("failed to select reading blocks: %v", err)
	}
	if len(reading) != 2 {
		t.Fatalf("expected 2 reading blocks, got %d", len(reading))
	}
	listening, err := cat.stageQuestions(ctx, "", "INTERACTIVE_LISTENING", "B1")
	if err != nil {
		t.Fatalf("failed to select listening blocks: %v", err)
	}
	if len(listening) != 2 {
		t.Fatalf("expected 2 listening blocks, got %d", len(listening))
	}

	session, _, err := cat.StartSession(ctx, "timeout-user", "Timeout User", "B1")
	if err != nil {
		t.Fatalf("failed to start session: %v", err)
	}
	expired := time.Now().Add(-time.Minute)
	session.DeadlineAt = &expired
	if err := store.Sessions().Update(ctx, session); err != nil {
		t.Fatalf("failed to expire session: %v", err)
	}

	_, _, err = cat.RecordQuestionResponse(ctx, session.ID, "timeout-user", models.SubmitResponseRequest{
		QuestionID:   "q-rs-01",
		UserResponse: json.RawMessage(`{"isReal":true}`),
	})
	if err == nil {
		t.Fatal("expected late answer to be rejected")
	}
	events, err := store.Sessions().GetSessionEvents(ctx, session.ID)
	if err != nil {
		t.Fatalf("failed to read events: %v", err)
	}
	found := false
	for _, event := range events {
		if event.EventType == "ANSWER_REJECTED_DEADLINE" && event.QuestionID == "q-rs-01" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected ANSWER_REJECTED_DEADLINE event, got %+v", events)
	}
}

func TestGradingUsesQuestionSnapshotNotLiveKey(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory(), store.Study())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	ctx := context.Background()
	userID := "snapshot-user"

	session, _, err := cat.StartSession(ctx, userID, "Snapshot User", "B1")
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	assigned, err := store.Sessions().GetAssignedQuestions(ctx, session.ID, session.StageName)
	if err != nil || len(assigned) == 0 {
		t.Fatalf("assignments: %v %d", err, len(assigned))
	}

	var item models.SessionQuestion
	found := false
	for _, assignment := range assigned {
		q := questionFromSnapshot(assignment)
		if q != nil && q.Type == "READ_SELECT" && len(q.CorrectAnswers) > 0 {
			item = assignment
			found = true
			break
		}
	}
	if !found {
		t.Fatal("expected a READ_SELECT snapshot")
	}

	live, err := store.Questions().GetByID(ctx, item.QuestionID)
	if err != nil {
		t.Fatalf("live question: %v", err)
	}
	flipped := *live
	if string(live.CorrectAnswers) == `{"isReal":true}` {
		flipped.CorrectAnswers = json.RawMessage(`{"isReal":false}`)
	} else {
		flipped.CorrectAnswers = json.RawMessage(`{"isReal":true}`)
	}
	if err := store.Questions().Delete(ctx, item.QuestionID); err != nil {
		t.Fatalf("delete live: %v", err)
	}
	if err := store.Questions().Create(ctx, &flipped); err != nil {
		t.Fatalf("recreate live: %v", err)
	}

	correct, score, err := cat.RecordQuestionResponse(ctx, session.ID, userID, models.SubmitResponseRequest{
		QuestionID:   item.QuestionID,
		UserResponse: questionFromSnapshot(item).CorrectAnswers,
	})
	if err != nil {
		t.Fatalf("grade snapshot answer: %v", err)
	}
	if !correct || score != 1 {
		t.Fatalf("snapshot key should still score 1, got correct=%v score=%v", correct, score)
	}
}

func TestStartSessionSetsCreatedAt(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	userID := "created-at-user"
	if err := store.Users().Create(ctx, &models.User{ID: userID, Email: "created-at@example.com", Name: "Created At"}); err != nil {
		t.Fatal(err)
	}
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	session, _, err := cat.StartSession(ctx, userID, "Created At", "B1", "diagnostic")
	if err != nil {
		t.Fatal(err)
	}
	if session.CreatedAt.IsZero() {
		t.Fatal("createdAt must be set when starting a session")
	}
}
