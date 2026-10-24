package tests

import (
	"context"
	"encoding/json"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

func learningEventsFixture(t *testing.T) (*memory.MemoryStorage, *service.StudyService, *service.CATService, *service.TheoryService, string) {
	t.Helper()
	store := memory.New()
	theory := service.NewTheoryService(store.Theory(), store.Study())
	cat := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study(),
	)
	study := service.NewStudyService(store, theory, cat)
	userID := uuid.NewString()
	if err := store.Users().Create(context.Background(), &models.User{
		ID:           userID,
		Email:        "student-" + userID[:8] + "@example.com",
		PasswordHash: "pass",
		Name:         "Student",
		Role:         "student",
		Locale:       "ru",
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	return store, study, cat, theory, userID
}

func TestPracticeAttemptRecordsMasteryAndAwardsXP(t *testing.T) {
	store, study, _, _, userID := learningEventsFixture(t)
	ctx := context.Background()

	rawResp, _ := json.Marshal(map[string]interface{}{"typed": "ambiguous", "isReal": true})
	attempt, err := study.RecordPracticeAttempt(ctx, userID, "READ_SELECT", "word: ambiguous", rawResp, true, 1.0, 4)
	if err != nil {
		t.Fatalf("record practice attempt: %v", err)
	}
	if attempt.ID == "" {
		t.Fatal("expected non-empty attempt ID")
	}

	// Verify mastery
	mastery, err := study.GetSkillMastery(ctx, userID)
	if err != nil {
		t.Fatalf("get mastery: %v", err)
	}
	skill := service.MapQuestionTypeToSkill("READ_SELECT")
	m, ok := mastery[skill]
	if !ok || m.AttemptsCount != 1 || m.MasteryScore != 1.0 {
		t.Fatalf("unexpected mastery: %+v", m)
	}

	// Verify XP awarded: 15 XP for practice attempt + 10 XP for auto-completing daily drill task = 25 XP
	totalXP, err := store.Study().XPTotal(ctx, userID)
	if err != nil {
		t.Fatalf("total xp: %v", err)
	}
	if totalXP != 25 {
		t.Fatalf("expected 25 XP for practice attempt with daily task completion, got %d", totalXP)
	}
}

func TestTypingAttemptRecordsAndAwardsXP(t *testing.T) {
	store, study, _, _, userID := learningEventsFixture(t)
	ctx := context.Background()

	attempt, err := study.RecordTypingAttempt(ctx, userID, 55, 96.5, "time", 30)
	if err != nil {
		t.Fatalf("record typing attempt: %v", err)
	}
	if attempt.WPM != 55 {
		t.Fatalf("expected WPM 55, got %d", attempt.WPM)
	}

	bestWPM, history, err := study.GetTypingHistory(ctx, userID)
	if err != nil {
		t.Fatalf("get typing history: %v", err)
	}
	if bestWPM != 55 || len(history) != 1 {
		t.Fatalf("expected best WPM 55 and 1 item in history, got %d and %d", bestWPM, len(history))
	}

	totalXP, err := store.Study().XPTotal(ctx, userID)
	if err != nil {
		t.Fatalf("total xp: %v", err)
	}
	if totalXP != 10 {
		t.Fatalf("expected 10 XP for typing attempt, got %d", totalXP)
	}
}

func TestTheoryToggleAwardsXPOnce(t *testing.T) {
	store, _, _, theory, userID := learningEventsFixture(t)
	ctx := context.Background()

	// Toggle lesson completion on
	progress, err := theory.ToggleCompletion(ctx, userID, "rules-and-technicalities")
	if err != nil {
		t.Fatalf("toggle completion: %v", err)
	}
	if len(progress.CompletedLessons) != 1 {
		t.Fatalf("expected 1 completed lesson, got %d", len(progress.CompletedLessons))
	}

	totalXP, err := store.Study().XPTotal(ctx, userID)
	if err != nil {
		t.Fatalf("total xp: %v", err)
	}
	if totalXP != 20 {
		t.Fatalf("expected 20 XP for theory lesson, got %d", totalXP)
	}

	// Toggle off and on again: same idempotency key, must not award 20 XP again
	_, _ = theory.ToggleCompletion(ctx, userID, "rules-and-technicalities")
	_, _ = theory.ToggleCompletion(ctx, userID, "rules-and-technicalities")

	totalXP, _ = store.Study().XPTotal(ctx, userID)
	if totalXP != 20 {
		t.Fatalf("re-completing lesson must not duplicate XP, got %d", totalXP)
	}
}
