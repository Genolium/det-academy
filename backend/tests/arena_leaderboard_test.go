package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"det-academy-backend/internal/handlers"
	"det-academy-backend/internal/repository/memory"
)

// TestLeaderboardDoesNotInventUsersOrWinRates guards the honesty of the arena
// board: it must only report real accounts, must not fabricate a win rate and
// must state where the rating comes from.
func TestLeaderboardDoesNotInventUsersOrWinRates(t *testing.T) {
	store := memory.New()
	users, _, err := store.Users().ListAll(t.Context(), 1, 50, "", "")
	if err != nil {
		t.Fatalf("list users: %v", err)
	}
	if len(users) == 0 {
		t.Fatal("the fixture store must contain at least one user")
	}

	hub := handlers.NewArenaHub()
	go hub.Run()
	handler := handlers.NewArenaHandler(hub, store.Users(), store.Sessions())

	recorder := httptest.NewRecorder()
	handler.GetLeaderboard(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/arena/leaderboard", nil))
	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: %d", recorder.Code)
	}

	var payload struct {
		Leaderboard []struct {
			UserID       string `json:"userId"`
			Name         string `json:"name"`
			WinRate      string `json:"winRate"`
			RatingSource string `json:"ratingSource"`
			BestScore    int    `json:"bestScore"`
		} `json:"leaderboard"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode leaderboard: %v", err)
	}
	if len(payload.Leaderboard) != len(users) {
		t.Fatalf("expected %d real users, got %d entries", len(users), len(payload.Leaderboard))
	}

	known := make(map[string]bool, len(users))
	for _, user := range users {
		known[user.ID] = true
	}
	for _, entry := range payload.Leaderboard {
		if !known[entry.UserID] {
			t.Fatalf("leaderboard contains an unknown user %q (%s)", entry.Name, entry.UserID)
		}
		if entry.WinRate != "" {
			t.Fatalf("win rate for %s is fabricated: %q", entry.Name, entry.WinRate)
		}
		if entry.RatingSource != "practice" {
			t.Fatalf("rating source for %s is not stated: %q", entry.Name, entry.RatingSource)
		}
	}
}
