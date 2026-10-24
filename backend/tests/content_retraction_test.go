package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"
)

// TestRetractedQuestionIsNotServed proves that a retracted question keeps the
// history of finished attempts but never appears in a new one.
func TestRetractedQuestionIsNotServed(t *testing.T) {
	store := memory.New()
	admin := service.NewAdminService(
		store.Users(), store.Sessions(), store.Questions(), store.Certificates(), store.Banners(), store.Institutions(),
	)
	ctx := t.Context()

	before, err := store.Questions().ListByTypeAndDifficulty(ctx, "READ_SELECT", "")
	if err != nil {
		t.Fatalf("list questions: %v", err)
	}
	if len(before) == 0 {
		t.Fatal("the fixture must contain READ_SELECT questions")
	}
	victim := before[0].ID

	if err := admin.DeleteQuestion(ctx, victim); err != nil {
		t.Fatalf("retract question: %v", err)
	}

	after, err := store.Questions().ListByTypeAndDifficulty(ctx, "READ_SELECT", "")
	if err != nil {
		t.Fatalf("list questions after retraction: %v", err)
	}
	for _, question := range after {
		if question.ID == victim {
			t.Fatalf("retracted question %s is still served", victim)
		}
	}

	// The question itself still exists for history and can be restored.
	stored, err := store.Questions().GetByID(ctx, victim)
	if err != nil || stored == nil {
		t.Fatalf("retracted question must still exist: %v", err)
	}
	if stored.IsActive {
		t.Fatal("retracted question must be inactive")
	}
	if err := store.Questions().SetActive(ctx, victim, true); err != nil {
		t.Fatalf("restore question: %v", err)
	}
	restored, _ := store.Questions().ListByTypeAndDifficulty(ctx, "READ_SELECT", "")
	found := false
	for _, question := range restored {
		if question.ID == victim {
			found = true
		}
	}
	if !found {
		t.Fatal("restored question must be served again")
	}
}

// TestPublicQuestionEndpointExcludesInactive is the API-level guarantee: the
// public endpoint never leaks an inactive or unpublished item.
func TestPublicQuestionEndpointExcludesInactive(t *testing.T) {
	router, _, store := setupTestRouter()

	questions, err := store.Questions().ListByTypeAndDifficulty(t.Context(), "READ_SELECT", "")
	if err != nil || len(questions) == 0 {
		t.Fatalf("fixture questions: %v", err)
	}
	retracted := questions[0].ID
	if err := store.Questions().SetActive(t.Context(), retracted, false); err != nil {
		t.Fatalf("retract: %v", err)
	}

	token := registerAuthToken(t, router)
	request := httptest.NewRequest(http.MethodGet, "/api/v1/test/questions?type=READ_SELECT", nil)
	request.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: %d", recorder.Code)
	}

	var served []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &served); err != nil {
		t.Fatalf("decode: %v", err)
	}
	for _, question := range served {
		if question.ID == retracted {
			t.Fatalf("the public endpoint served the retracted question %s", retracted)
		}
	}

}
