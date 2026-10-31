package service

import (
	"context"
	"strconv"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
)

func TestSRSXPAwardsAreCappedPerDay(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	study := NewStudyService(store, theory, cat)
	ctx := context.Background()
	userID := "srs-cap-user"

	for i := 0; i < 25; i++ {
		if _, err := study.ReviewSRSCard(ctx, userID, models.ReviewSRSCardRequest{
			CardID:  "card-" + strconv.Itoa(i),
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
