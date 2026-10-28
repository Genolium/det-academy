package service

import (
	"context"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
)

func TestAdaptivePracticeUsesErrorNotebook(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	userID := "adaptive-user"
	if err := store.Users().Create(ctx, &models.User{ID: userID, Email: "adaptive@example.com", Name: "A"}); err != nil && err.Error() != "user already exists" {
		t.Fatal(err)
	}
	for index, questionType := range []string{"READ_SELECT", "C_TEST", "READ_SELECT"} {
		if err := store.Study().SaveError(ctx, &models.UserErrorItem{
			ID: "err-" + questionType + "-" + string(rune('a'+index)), UserID: userID,
			QuestionType: questionType, Prompt: "prompt " + questionType,
			UserAnswer: "wrong", CorrectAnswer: "right",
		}); err != nil {
			t.Fatal(err)
		}
	}

	service := NewStudyService(store, nil, nil)
	plan, err := service.AdaptivePractice(ctx, userID)
	if err != nil {
		t.Fatal(err)
	}
	if plan.FocusType != "READ_SELECT" || plan.ErrorCount != 2 {
		t.Fatalf("plan = %+v", plan)
	}
	if plan.FocusSlug != "read-and-select" || len(plan.ErrorIDs) != 2 {
		t.Fatalf("plan = %+v", plan)
	}
}

func TestAdaptiveSessionUsesExactUnmasteredErrorIDs(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	userID := "adaptive-session-user"
	if err := store.Users().Create(ctx, &models.User{ID: userID, Email: "adaptive-session@example.com", Name: "A"}); err != nil && err.Error() != "user already exists" {
		t.Fatal(err)
	}
	items := []*models.UserErrorItem{
		{ID: "err-active-1", UserID: userID, QuestionType: "READ_SELECT", Prompt: "one", UserAnswer: "x", CorrectAnswer: "y"},
		{ID: "err-active-2", UserID: userID, QuestionType: "READ_SELECT", Prompt: "two", UserAnswer: "x", CorrectAnswer: "y"},
		{ID: "err-mastered", UserID: userID, QuestionType: "READ_SELECT", Prompt: "three", UserAnswer: "x", CorrectAnswer: "y", Mastered: true},
	}
	for _, item := range items {
		if err := store.Study().SaveError(ctx, item); err != nil {
			t.Fatal(err)
		}
	}
	plan, err := NewStudyService(store, nil, nil).AdaptivePractice(ctx, userID)
	if err != nil {
		t.Fatal(err)
	}
	if plan.FocusType != "READ_SELECT" || len(plan.ErrorIDs) != 2 {
		t.Fatalf("plan = %+v", plan)
	}
	if plan.ErrorIDs[0] != "err-active-1" || plan.ErrorIDs[1] != "err-active-2" {
		t.Fatalf("error IDs = %v", plan.ErrorIDs)
	}
}
