package service

import (
	"context"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
)

func TestSRSRejectsUnknownCardID(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	study := NewStudyService(store, theory, cat)
	if _, err := study.ReviewSRSCard(context.Background(), "srs-invalid-user", models.ReviewSRSCardRequest{
		CardID:  "fabricated-card-id",
		Quality: 5,
	}); err == nil {
		t.Fatal("unknown cardId must be rejected")
	}
}

func TestSRSXPAwardsAreCappedPerDay(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	study := NewStudyService(store, theory, cat)
	ctx := context.Background()
	userID := "srs-cap-user"
	entries, err := store.Vocabulary().ListAll(ctx)
	if err != nil || len(entries) < 25 {
		t.Fatalf("need vocabulary entries: %v (got %d)", err, len(entries))
	}

	for i := 0; i < 25; i++ {
		if _, err := study.ReviewSRSCard(ctx, userID, models.ReviewSRSCardRequest{
			CardID:  entries[i].ID,
			Quality: 5,
		}); err != nil {
			t.Fatalf("review %d: %v", i, err)
		}
	}

	total, err := store.Study().XPTotal(ctx, userID)
	if err != nil {
		t.Fatalf("xp total: %v", err)
	}
	if total > 20*5 {
		t.Fatalf("SRS XP exceeded daily cap: got %d, want <= %d", total, 20*5)
	}
}
