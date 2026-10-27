package tests

import (
	"context"
	"errors"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

func newStudyFixture(t *testing.T) (*memory.MemoryStorage, *service.StudyService, string) {
	t.Helper()
	store := memory.New()
	theory := service.NewTheoryService(store.Theory())
	cat := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study(),
	)
	study := service.NewStudyService(store, theory, cat)

	userID := uuid.NewString()
	if err := store.Users().Create(context.Background(), &models.User{
		ID: userID, Email: "personal-" + userID[:8] + "@example.com",
		PasswordHash: "not-used", Name: "Personal", Role: "student", Locale: "ru",
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	return store, study, userID
}

func completedSession(t *testing.T, store *memory.MemoryStorage, userID string, score int) {
	t.Helper()
	now := time.Now().UTC()
	session := &models.TestSession{
		ID: uuid.NewString(), UserID: userID, CandidateName: "Personal",
		Status: "COMPLETED", CurrentStage: 13, StageName: "COMPLETED",
		DifficultyLevel: "B1", Mode: "full", OverallScore: &score,
		ReadingScore: &score, ListeningScore: &score, WritingScore: &score, SpeakingScore: &score,
		CompletedAt: &now,
	}
	if err := store.Sessions().Create(context.Background(), session); err != nil {
		t.Fatalf("create session: %v", err)
	}
}

// TestGoalsMustBeChosenByTheUser protects the onboarding requirement: the
// service never invents a target score, a deadline or a university.
func TestGoalsMustBeChosenByTheUser(t *testing.T) {
	_, study, userID := newStudyFixture(t)

	if _, err := study.GetGoals(context.Background(), userID); !errors.Is(err, service.ErrGoalsNotConfigured) {
		t.Fatalf("expected ErrGoalsNotConfigured, got %v", err)
	}
	if _, err := study.GetStudyPlan(context.Background(), userID); !errors.Is(err, service.ErrGoalsNotConfigured) {
		t.Fatalf("expected the plan to require a goal, got %v", err)
	}

	// Invalid input is rejected instead of being replaced with defaults.
	if _, err := study.UpdateGoals(context.Background(), userID, models.UpdateGoalsRequest{
		TargetScore: 10, TargetDate: "2027-01-01", DailyMinutes: 45,
	}); err == nil {
		t.Fatal("an out-of-range target score must be rejected")
	}
	if _, err := study.UpdateGoals(context.Background(), userID, models.UpdateGoalsRequest{
		TargetScore: 125, TargetDate: "not-a-date", DailyMinutes: 45,
	}); err == nil {
		t.Fatal("an invalid target date must be rejected")
	}

	goal, err := study.UpdateGoals(context.Background(), userID, models.UpdateGoalsRequest{
		TargetScore: 135, TargetDate: "2027-03-01", DailyMinutes: 30,
	})
	if err != nil {
		t.Fatalf("valid goal: %v", err)
	}
	if goal.TargetUniversityID != "" {
		t.Fatalf("a university must not be assigned without the user's choice, got %q", goal.TargetUniversityID)
	}
}

// TestReadinessNeedsTwoAttempts makes the readiness metric honest: a single
// attempt is not evidence.
func TestReadinessNeedsTwoAttempts(t *testing.T) {
	store, study, userID := newStudyFixture(t)
	ctx := context.Background()

	if _, err := study.UpdateGoals(ctx, userID, models.UpdateGoalsRequest{
		TargetScore: 125, TargetDate: "2027-03-01", DailyMinutes: 45,
	}); err != nil {
		t.Fatalf("set goals: %v", err)
	}

	plan, err := study.GetStudyPlan(ctx, userID)
	if err != nil {
		t.Fatalf("plan without attempts: %v", err)
	}
	if plan.ReadinessAvailable {
		t.Fatal("readiness must not be available without attempts")
	}

	completedSession(t, store, userID, 110)
	plan, err = study.GetStudyPlan(ctx, userID)
	if err != nil {
		t.Fatalf("plan with one attempt: %v", err)
	}
	if plan.ReadinessAvailable {
		t.Fatalf("readiness must not be built from one attempt: %d%%", plan.ReadinessPercent)
	}
	if plan.ReadinessBasis == "" {
		t.Fatal("the plan must explain why readiness is unavailable")
	}

	completedSession(t, store, userID, 125)
	plan, err = study.GetStudyPlan(ctx, userID)
	if err != nil {
		t.Fatalf("plan with two attempts: %v", err)
	}
	if !plan.ReadinessAvailable {
		t.Fatal("readiness must be available after two completed attempts")
	}
	if plan.ReadinessBasis == "" {
		t.Fatal("the readiness basis must be explained")
	}
}

// TestDailyPlanFitsTheAvailableTime and every task explains why it exists.
func TestDailyPlanFitsTheAvailableTimeAndExplainsTasks(t *testing.T) {
	_, study, userID := newStudyFixture(t)
	ctx := context.Background()

	if _, err := study.UpdateGoals(ctx, userID, models.UpdateGoalsRequest{
		TargetScore: 125, TargetDate: "2027-03-01", DailyMinutes: 15,
	}); err != nil {
		t.Fatalf("set goals: %v", err)
	}

	plan, err := study.GetStudyPlan(ctx, userID)
	if err != nil {
		t.Fatalf("plan: %v", err)
	}
	if len(plan.TasksToday) == 0 {
		t.Fatal("the plan must contain at least one task that fits the budget")
	}

	total := 0
	for _, task := range plan.TasksToday {
		if task.Reason == "" {
			t.Fatalf("task %s does not explain why it was assigned", task.ID)
		}
		if task.EstimatedMinutes <= 0 {
			t.Fatalf("task %s has no time estimate", task.ID)
		}
		if task.EstimatedMinutes > plan.DailyMinutes {
			t.Fatalf("task %s takes %d minutes of a %d minute day", task.ID, task.EstimatedMinutes, plan.DailyMinutes)
		}
		total += task.EstimatedMinutes
	}
	if total > plan.DailyMinutes {
		t.Fatalf("the plan takes %d minutes but the student has %d", total, plan.DailyMinutes)
	}
}

// TestPlacementComesFromTheDiagnostic is the onboarding level test: the short
// diagnostic is the only source of the estimated level.
func TestPlacementFromDiagnostic(t *testing.T) {
	store, study, userID := newStudyFixture(t)
	ctx := context.Background()

	empty, err := study.GetPlacement(ctx, userID)
	if err != nil {
		t.Fatalf("empty placement: %v", err)
	}
	if empty.Available {
		t.Fatal("a new account has no placement yet")
	}

	completedAt := time.Now().UTC()
	session := &models.TestSession{
		ID: uuid.NewString(), UserID: userID, CandidateName: "Placement",
		Status: "COMPLETED", StageName: "COMPLETED", CurrentStage: 13,
		DifficultyLevel: "B2", Mode: "diagnostic", CompletedAt: &completedAt,
	}
	score := 115
	session.OverallScore = &score
	if err := store.Sessions().Create(ctx, session); err != nil {
		t.Fatalf("create diagnostic: %v", err)
	}

	placement, err := study.GetPlacement(ctx, userID)
	if err != nil {
		t.Fatalf("placement: %v", err)
	}
	if !placement.Available || placement.Level != "B2" || placement.SessionID != session.ID {
		t.Fatalf("unexpected placement: %#v", placement)
	}
}
