package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"det-academy-backend/internal/models"
)

func loginIntegrityStudent(t *testing.T, r http.Handler) string {
	t.Helper()
	payload, _ := json.Marshal(models.LoginRequest{
		Email:    "student@det-academy.com",
		Password: "password123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("login failed: %d %s", w.Code, w.Body.String())
	}
	var response models.AuthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode login: %v", err)
	}
	if response.Token == "" {
		t.Fatal("login returned an empty token")
	}
	return response.Token
}

func startIntegritySession(t *testing.T, r http.Handler, token string) string {
	t.Helper()
	payload := []byte(`{"candidateName":"Integrity Candidate","difficultyLevel":"B1"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/test/sessions", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("start session failed: %d %s", w.Code, w.Body.String())
	}
	var response struct {
		Session models.TestSession `json:"session"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode start session: %v", err)
	}
	if response.Session.ID == "" {
		t.Fatal("start session returned an empty id")
	}
	return response.Session.ID
}

func postIntegrityAnswer(t *testing.T, r http.Handler, token, sessionID, questionID, payload string) (int, string) {
	t.Helper()
	body, _ := json.Marshal(models.SubmitResponseRequest{
		QuestionID:   questionID,
		UserResponse: json.RawMessage(payload),
		TimeSpentSec: 3,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/test/sessions/"+sessionID+"/respond", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w.Code, w.Body.String()
}

func readIntegritySession(t *testing.T, r http.Handler, token, sessionID string) map[string]interface{} {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/test/sessions/"+sessionID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("read session failed: %d %s", w.Code, w.Body.String())
	}
	var details map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &details); err != nil {
		t.Fatalf("decode session: %v", err)
	}
	return details
}

func TestResponseIntegrityHidesScoringAndRejectsReplay(t *testing.T) {
	r, _, _ := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	sessionID := startIntegritySession(t, r, token)
	questionIDs := getCurrentQuestionIDs(t, r, token, sessionID)
	if len(questionIDs) == 0 {
		t.Fatal("expected at least one assigned question")
	}
	questionID := questionIDs[0]

	status, body := postIntegrityAnswer(t, r, token, sessionID, questionID, `{"isReal":false}`)
	if status != http.StatusOK {
		t.Fatalf("first answer should be accepted, got %d: %s", status, body)
	}

	details := readIntegritySession(t, r, token, sessionID)
	responses, ok := details["responses"].([]interface{})
	if !ok || len(responses) == 0 {
		t.Fatalf("expected recorded responses in active session, got %#v", details["responses"])
	}
	first := responses[0].(map[string]interface{})
	if _, leaked := first["isCorrect"]; leaked {
		t.Fatal("active session leaked isCorrect before completion")
	}
	if _, leaked := first["rawScore"]; leaked {
		t.Fatal("active session leaked rawScore before completion")
	}

	status, body = postIntegrityAnswer(t, r, token, sessionID, questionID, `{"isReal":true}`)
	if status != http.StatusConflict {
		t.Fatalf("replayed answer should be rejected with 409, got %d: %s", status, body)
	}

	after := readIntegritySession(t, r, token, sessionID)
	afterResponses := after["responses"].([]interface{})
	if len(afterResponses) != 1 {
		t.Fatalf("expected exactly one response after replay, got %d", len(afterResponses))
	}
	recorded := afterResponses[0].(map[string]interface{})
	raw, _ := json.Marshal(recorded["userResponse"])
	if string(raw) != `{"isReal":false}` {
		t.Fatalf("replay changed the recorded answer: %s", raw)
	}
}
