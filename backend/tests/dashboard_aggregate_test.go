package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
)

func TestDashboardAggregateReturnsOnePayload(t *testing.T) {
	r, _, store := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	ctx := context.Background()
	user, err := store.Users().GetByEmail(ctx, "student@det-academy.com")
	if err != nil {
		t.Fatalf("load user: %v", err)
	}

	for _, slug := range service.LessonSlugs {
		if err := store.Theory().SetProgress(ctx, user.ID, slug, false); err != nil {
			t.Fatalf("clear theory %s: %v", slug, err)
		}
	}
	if _, err := store.Theory().ToggleProgress(ctx, user.ID, "read-and-select"); err != nil {
		t.Fatalf("complete theory task: %v", err)
	}
	errorPayload, _ := json.Marshal(models.SaveErrorRequest{
		QuestionType:  "READ_SELECT",
		Prompt:        "Is this a real word?",
		UserAnswer:    "no",
		CorrectAnswer: "yes",
		Explanation:   "The word is real.",
	})
	if resp := postJSONWithToken(t, r, "/api/v1/user/errors", token, errorPayload); resp.Code != http.StatusCreated && resp.Code != http.StatusOK {
		t.Fatalf("seed error notebook: %d %s", resp.Code, resp.Body.String())
	}

	overall, reading, listening, writing, speaking := 120, 118, 116, 124, 122
	literacy, comprehension, production, conversation := 117, 115, 123, 121
	session := &models.TestSession{
		ID:                 fmt.Sprintf("dashboard-session-%d", time.Now().UnixNano()),
		UserID:             user.ID,
		CandidateName:      "Dashboard Candidate",
		Status:             "COMPLETED",
		StageName:          "COMPLETED",
		Mode:               "full",
		OverallScore:       &overall,
		ReadingScore:       &reading,
		ListeningScore:     &listening,
		WritingScore:       &writing,
		SpeakingScore:      &speaking,
		LiteracyScore:      &literacy,
		ComprehensionScore: &comprehension,
		ProductionScore:    &production,
		ConversationScore:  &conversation,
		ContentSnapshot:    json.RawMessage(`{"large":"internal-snapshot"}`),
		CompletedAt:        ptrTime(time.Now()),
	}
	if err := store.Sessions().Create(ctx, session); err != nil {
		t.Fatalf("seed completed session: %v", err)
	}
	zero := 0
	for _, session := range []*models.TestSession{
		{
			ID:            fmt.Sprintf("dashboard-progress-%d", time.Now().UnixNano()),
			UserID:        user.ID,
			CandidateName: "Dashboard Candidate",
			Status:        "IN_PROGRESS",
			StageName:     "WRITE_PHOTO",
			Mode:          "full",
			CreatedAt:     time.Now().UTC(),
		},
		{
			ID:            fmt.Sprintf("dashboard-zero-%d", time.Now().UnixNano()),
			UserID:        user.ID,
			CandidateName: "Dashboard Candidate",
			Status:        "COMPLETED",
			StageName:     "COMPLETED",
			Mode:          "full",
			OverallScore:  &zero,
			CreatedAt:     time.Now().UTC(),
			CompletedAt:   ptrTime(time.Now()),
		},
	} {
		if err := store.Sessions().Create(ctx, session); err != nil {
			t.Fatalf("seed excluded session: %v", err)
		}
	}
	if err := store.Study().RecordTypingAttempt(ctx, &models.TypingAttempt{
		ID:          "dashboard-typing-1",
		UserID:      user.ID,
		WPM:         42,
		Accuracy:    0.97,
		Mode:        "practice",
		DurationSec: 60,
		CreatedAt:   time.Now().UTC(),
	}); err != nil {
		t.Fatalf("seed typing attempt: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/user/dashboard?utc_offset_minutes=0", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("dashboard aggregate: %d %s", w.Code, w.Body.String())
	}

	var payload map[string]json.RawMessage
	if err := json.Unmarshal(w.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode aggregate: %v", err)
	}
	if _, exists := payload["contentSnapshot"]; exists {
		t.Fatal("aggregate must not expose contentSnapshot")
	}

	var body models.DashboardResponse
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode typed aggregate: %v", err)
	}
	if body.Theory.TotalLessons != 13 || len(body.Theory.CompletedLessons) != 1 {
		t.Fatalf("theory = %+v, want 1/13", body.Theory)
	}
	if len(body.Sessions) != 1 {
		t.Fatalf("sessions = %d, want 1", len(body.Sessions))
	}
	if body.Sessions[0].ContentSnapshot != nil {
		t.Fatal("session content snapshot was not cleared")
	}
	if body.GoalsConfigured || body.StudyPlan != nil {
		t.Fatalf("unconfigured goals leaked a plan: %+v", body.StudyPlan)
	}
	if body.BestWpm != 42 {
		t.Fatalf("bestWpm = %d, want 42", body.BestWpm)
	}
	if len(body.Errors) != 1 {
		t.Fatalf("errors = %d, want 1", len(body.Errors))
	}

	sessionsJSON, err := json.Marshal(payload["sessions"])
	if err != nil {
		t.Fatal(err)
	}
	if containsJSONKey(sessionsJSON, "contentSnapshot") {
		t.Fatalf("sessions payload contains heavy snapshot: %s", sessionsJSON)
	}
}

func containsJSONKey(raw []byte, key string) bool {
	var items []map[string]json.RawMessage
	if err := json.Unmarshal(raw, &items); err != nil {
		return false
	}
	for _, item := range items {
		if _, ok := item[key]; ok {
			return true
		}
	}
	return false
}
