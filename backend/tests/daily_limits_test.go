package tests

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

func limitsFixture(t *testing.T) (*memory.MemoryStorage, *service.StudyService, *service.CATService, string) {
	t.Helper()
	store := memory.New()
	theory := service.NewTheoryService(store.Theory())
	cat := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study(),
	)
	study := service.NewStudyService(store, theory, cat)
	userID := uuid.NewString()
	if err := store.Users().Create(context.Background(), &models.User{
		ID: userID, Email: "limits-" + userID[:8] + "@example.com",
		PasswordHash: "not-used", Name: "Limits", Role: "student", Locale: "ru",
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	return store, study, cat, userID
}

// TestMockDailyLimit protects the expensive full mock from unlimited attempts.
func TestMockDailyLimit(t *testing.T) {
	t.Setenv("DAILY_MOCK_LIMIT", "2")
	_, _, cat, userID := limitsFixture(t)
	ctx := context.Background()

	for attempt := 0; attempt < 2; attempt++ {
		if _, _, err := cat.StartSession(ctx, userID, "Limits", "B1", "full"); err != nil {
			t.Fatalf("attempt %d must be allowed: %v", attempt+1, err)
		}
	}

	if _, _, err := cat.StartSession(ctx, userID, "Limits", "B1", "full"); !errors.Is(err, service.ErrDailyLimitReached) {
		t.Fatalf("third mock must hit the daily limit, got %v", err)
	}

	// Diagnostics are unlimited: they are short and used for placement.
	if _, _, err := cat.StartSession(ctx, userID, "Limits", "B1", "diagnostic"); err != nil {
		t.Fatalf("diagnostic must not be limited: %v", err)
	}
}

// TestSpeakingPracticeDailyLimit protects the speaking allowance.
func TestSpeakingPracticeDailyLimit(t *testing.T) {
	t.Setenv("DAILY_SPEAKING_LIMIT", "2")
	store, study, _, userID := limitsFixture(t)
	ctx := context.Background()

	for attempt := 0; attempt < 2; attempt++ {
		if err := store.Study().RecordPracticeAttempt(ctx, &models.PracticeAttempt{
			ID: uuid.NewString(), UserID: userID, QuestionType: "SPEAK_PHOTO",
			PromptContext: "practice", UserResponse: json.RawMessage(`{"text":"answer"}`),
		}); err != nil {
			t.Fatalf("record attempt: %v", err)
		}
	}

	if _, err := study.CreatePracticeAssignment(ctx, userID, "SPEAK_PHOTO"); !errors.Is(err, service.ErrDailyLimitReached) {
		t.Fatalf("speaking practice must hit the daily limit, got %v", err)
	}

	// Reading practice is not part of the speaking allowance.
	if _, err := study.CreatePracticeAssignment(ctx, userID, "READ_SELECT"); err != nil {
		t.Fatalf("reading practice must stay available: %v", err)
	}
}

// TestDailyLimitsReport keeps the UI numbers in sync with the enforcement.
func TestDailyLimitsReport(t *testing.T) {
	t.Setenv("DAILY_MOCK_LIMIT", "3")
	t.Setenv("DAILY_SPEAKING_LIMIT", "5")
	_, study, cat, userID := limitsFixture(t)
	ctx := context.Background()

	if _, _, err := cat.StartSession(ctx, userID, "Limits", "B1", "full"); err != nil {
		t.Fatalf("start session: %v", err)
	}

	limits, err := study.GetDailyLimits(ctx, userID)
	if err != nil {
		t.Fatalf("limits: %v", err)
	}
	if limits.MockLimit != 3 || limits.MockUsed != 1 {
		t.Fatalf("mock limits = %d/%d, want 1/3", limits.MockUsed, limits.MockLimit)
	}
	if limits.SpeakingLimit != 5 || limits.SpeakingUsed != 0 {
		t.Fatalf("speaking limits = %d/%d, want 0/5", limits.SpeakingUsed, limits.SpeakingLimit)
	}
	if limits.Date == "" {
		t.Fatal("the limits report must include its date")
	}
}
