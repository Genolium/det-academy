package service

import (
	"context"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"det-academy-backend/internal/repository/memory"

	"github.com/google/uuid"
)

// poolQuestionRepo serves a controlled question pool so the exposure policy can
// be tested with a pool large enough to satisfy the stage twice.
type poolQuestionRepo struct {
	repository.QuestionRepository
	byType map[string][]models.Question
}

func (r *poolQuestionRepo) ListByTypeAndDifficulty(_ context.Context, qType, band string) ([]models.Question, error) {
	all := r.byType[qType]
	if band == "" {
		return all, nil
	}
	filtered := make([]models.Question, 0, len(all))
	for _, question := range all {
		if question.DifficultyBand == band {
			filtered = append(filtered, question)
		}
	}
	return filtered, nil
}

func TestStageSelectionExcludesRecentlyExposed(t *testing.T) {
	const (
		userID = "user-selection"
		stage  = "READ_SELECT"
		pool   = 40
	)

	questions := make([]models.Question, 0, pool)
	for index := 1; index <= pool; index++ {
		questions = append(questions, models.Question{
			ID:             "rs-pool-" + uuid.NewString(),
			Type:           stage,
			DifficultyBand: "B1",
			ContentPayload: []byte(`{"word":"example"}`),
			TimeLimitSec:   5,
			IsActive:       true,
		})
	}

	store := memory.New()
	ctx := context.Background()
	session := &models.TestSession{
		ID:               uuid.NewString(),
		UserID:           userID,
		Status:           "IN_PROGRESS",
		StageName:        stage,
		CurrentStage:     1,
		DifficultyLevel:  "B1",
		BlueprintVersion: "2026.1",
		ScoringVersion:   "irt-2pl-v2",
	}
	if err := store.Sessions().Create(ctx, session); err != nil {
		t.Fatal(err)
	}

	now := time.Now().UTC()
	exposed := make(map[string]bool, 15)
	assignments := make([]models.SessionQuestion, 0, 15)
	for index, question := range questions[:15] {
		exposed[question.ID] = true
		assignments = append(assignments, models.SessionQuestion{
			SessionID:  session.ID,
			QuestionID: question.ID,
			StageName:  stage,
			Position:   index,
			IssuedAt:   now,
			DeadlineAt: now.Add(75 * time.Second),
		})
	}
	if err := store.Sessions().AssignQuestions(ctx, assignments); err != nil {
		t.Fatal(err)
	}

	service := NewCATService(store.Sessions(), &poolQuestionRepo{byType: map[string][]models.Question{stage: questions}}, nil, nil, nil)
	selected, err := service.stageQuestions(ctx, userID, stage, "B1")
	if err != nil {
		t.Fatal(err)
	}
	if len(selected) != 15 {
		t.Fatalf("selected %d questions, want the blueprint size 15", len(selected))
	}
	seen := make(map[string]bool, len(selected))
	for _, question := range selected {
		if exposed[question.ID] {
			t.Fatalf("recently exposed question %s was served again", question.ID)
		}
		if seen[question.ID] {
			t.Fatalf("duplicate question %s in one stage", question.ID)
		}
		seen[question.ID] = true
	}
	if ItemSelectionPolicyVersion != "exclude-recent-v1" {
		t.Fatalf("selection policy = %q", ItemSelectionPolicyVersion)
	}
}
