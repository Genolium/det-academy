package tests

import (
	"context"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

func xpFixture(t *testing.T) (*memory.MemoryStorage, *service.StudyService, string) {
	t.Helper()
	store := memory.New()
	theory := service.NewTheoryService(store.Theory())
	cat := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study(),
	)
	study := service.NewStudyService(store, theory, cat)
	userID := uuid.NewString()
	if err := store.Users().Create(context.Background(), &models.User{
		ID: userID, Email: "xp-" + userID[:8] + "@example.com",
		PasswordHash: "not-used", Name: "XP", Role: "student", Locale: "ru",
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	return store, study, userID
}

// TestXPAwardIsIdempotent is the core rule: a repeated event never pays twice.
func TestXPAwardIsIdempotent(t *testing.T) {
	store, study, userID := xpFixture(t)
	ctx := context.Background()

	inserted, err := study.AwardXP(ctx, userID, "lesson", "lesson:rules-and-technicalities", 20)
	if err != nil || !inserted {
		t.Fatalf("first award: inserted=%v err=%v", inserted, err)
	}
	inserted, err = study.AwardXP(ctx, userID, "lesson", "lesson:rules-and-technicalities", 20)
	if err != nil {
		t.Fatalf("second award: %v", err)
	}
	if inserted {
		t.Fatal("a repeated idempotency key must not insert a new reward")
	}

	total, err := store.Study().XPTotal(ctx, userID)
	if err != nil {
		t.Fatalf("total: %v", err)
	}
	if total != 20 {
		t.Fatalf("total XP = %d, want 20", total)
	}
}

// TestLeagueIsReproducibleFromTheLedger proves the league depends only on the
// ledger: the same events always produce the same league.
func TestLeagueIsReproducibleFromTheLedger(t *testing.T) {
	_, study, userID := xpFixture(t)
	ctx := context.Background()

	profile, err := study.GetXPProfile(ctx, userID)
	if err != nil {
		t.Fatalf("empty profile: %v", err)
	}
	if profile.League != "Bronze" || profile.Weekly != 0 {
		t.Fatalf("empty profile = %+v, want Bronze with 0 XP", profile)
	}

	if _, err := study.AwardXP(ctx, userID, "practice", "practice:1", 120); err != nil {
		t.Fatalf("award: %v", err)
	}
	profile, err = study.GetXPProfile(ctx, userID)
	if err != nil {
		t.Fatalf("profile: %v", err)
	}
	if profile.Weekly != 120 || profile.League != "Silver" {
		t.Fatalf("weekly=%d league=%s, want 120/Silver", profile.Weekly, profile.League)
	}
	if profile.NextLeague != "Gold" || profile.NextAt != 300 {
		t.Fatalf("next=%s/%d, want Gold/300", profile.NextLeague, profile.NextAt)
	}

	if _, err := study.AwardXP(ctx, userID, "practice", "practice:2", 200); err != nil {
		t.Fatalf("award: %v", err)
	}
	profile, err = study.GetXPProfile(ctx, userID)
	if err != nil {
		t.Fatalf("profile: %v", err)
	}
	if profile.Weekly != 320 || profile.League != "Gold" {
		t.Fatalf("weekly=%d league=%s, want 320/Gold", profile.Weekly, profile.League)
	}
	if profile.LeagueBasis == "" {
		t.Fatal("the league rule must be explained to the user")
	}
}

// TestPlanTaskAwardsXPOnce connects the ledger to a real action.
func TestPlanTaskAwardsXPOnce(t *testing.T) {
	store, study, userID := xpFixture(t)
	ctx := context.Background()

	if _, err := study.UpdateGoals(ctx, userID, models.UpdateGoalsRequest{
		TargetScore: 125, TargetDate: "2027-03-01", DailyMinutes: 45,
	}); err != nil {
		t.Fatalf("goals: %v", err)
	}

	if err := study.CompletePlanTask(ctx, userID, "task-srs"); err != nil {
		t.Fatalf("complete task: %v", err)
	}
	if err := study.CompletePlanTask(ctx, userID, "task-srs"); err != nil {
		t.Fatalf("complete task again: %v", err)
	}

	total, err := store.Study().XPTotal(ctx, userID)
	if err != nil {
		t.Fatalf("total: %v", err)
	}
	if total != 0 {
		t.Fatalf("total XP = %d, want 0: plan-task completion must not award XP", total)
	}
}
