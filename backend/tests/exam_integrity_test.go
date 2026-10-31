package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"det-academy-backend/internal/models"
)

func uploadIntegrityAudio(t *testing.T, r http.Handler, token, sessionID, questionID string) (int, string) {
	t.Helper()
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("audio", "answer.webm")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	_, _ = part.Write([]byte("FAKE_WEBM_AUDIO_DATA_FOR_INTEGRITY_TEST"))
	_ = writer.WriteField("questionId", questionID)
	_ = writer.WriteField("transcript", "This is a spoken answer used only for an integrity test.")
	_ = writer.WriteField("durationSec", "5")
	_ = writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/test/sessions/"+sessionID+"/audio", body)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w.Code, w.Body.String()
}

func TestAudioRequiresAssignedSpeakingQuestion(t *testing.T) {
	r, _, _ := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	sessionID := startIntegritySession(t, r, token)
	questionIDs := getCurrentQuestionIDs(t, r, token, sessionID)
	if len(questionIDs) == 0 {
		t.Fatal("expected assigned questions")
	}

	status, body := uploadIntegrityAudio(t, r, token, sessionID, "sp-1")
	if status != http.StatusConflict {
		t.Fatalf("audio for an unassigned speaking question must be rejected, got %d: %s", status, body)
	}

	status, body = uploadIntegrityAudio(t, r, token, sessionID, questionIDs[0])
	if status != http.StatusBadRequest {
		t.Fatalf("audio for a non-speaking question must be rejected, got %d: %s", status, body)
	}
}

func TestItemDeadlineUsesStageDeadline(t *testing.T) {
	r, _, store := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	sessionID := startIntegritySession(t, r, token)

	session, err := store.Sessions().GetByID(context.Background(), sessionID)
	if err != nil || session.DeadlineAt == nil {
		t.Fatalf("expected a session deadline: %v", err)
	}
	assignments, err := store.Sessions().GetAssignedQuestions(context.Background(), sessionID, session.StageName)
	if err != nil || len(assignments) == 0 {
		t.Fatalf("expected assignments: %v", err)
	}
	for _, assignment := range assignments {
		delta := assignment.DeadlineAt.Sub(*session.DeadlineAt)
		if delta < -time.Second || delta > time.Second {
			t.Fatalf("item %s deadline %s is not aligned with stage deadline %s", assignment.QuestionID, assignment.DeadlineAt, *session.DeadlineAt)
		}
	}
}

func TestStageCompleteReplayDoesNotAdvance(t *testing.T) {
	r, _, _ := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	sessionID := startIntegritySession(t, r, token)

	stagePayload, _ := json.Marshal(models.StageCompleteRequest{
		StageName: "READ_SELECT",
		Accuracy:  0.8,
	})
	first := httptest.NewRequest(http.MethodPost, "/api/v1/test/sessions/"+sessionID+"/stage-complete", bytes.NewReader(stagePayload))
	first.Header.Set("Authorization", "Bearer "+token)
	first.Header.Set("Content-Type", "application/json")
	firstW := httptest.NewRecorder()
	r.ServeHTTP(firstW, first)
	if firstW.Code != http.StatusOK {
		t.Fatalf("first stage-complete failed: %d %s", firstW.Code, firstW.Body.String())
	}

	second := httptest.NewRequest(http.MethodPost, "/api/v1/test/sessions/"+sessionID+"/stage-complete", bytes.NewReader(stagePayload))
	second.Header.Set("Authorization", "Bearer "+token)
	second.Header.Set("Content-Type", "application/json")
	secondW := httptest.NewRecorder()
	r.ServeHTTP(secondW, second)
	if secondW.Code != http.StatusConflict {
		t.Fatalf("replayed stage-complete must return 409, got %d: %s", secondW.Code, secondW.Body.String())
	}

	details := readIntegritySession(t, r, token, sessionID)
	if details["stageName"] != "FILL_BLANKS" {
		t.Fatalf("replayed stage-complete advanced the session to %v", details["stageName"])
	}
}
