package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

const demoStudentID = "00000000-0000-0000-0000-000000000002"

func loginToken(t *testing.T, r http.Handler, email, password string) string {
	t.Helper()
	body, _ := json.Marshal(models.LoginRequest{Email: email, Password: password})
	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("login %s: %d %s", email, w.Code, w.Body.String())
	}
	var resp models.AuthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode login: %v", err)
	}
	return resp.Token
}

func getJSON(t *testing.T, r http.Handler, token, path string, out any) int {
	t.Helper()
	req := httptest.NewRequest("GET", path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if out != nil && w.Code == http.StatusOK {
		if err := json.Unmarshal(w.Body.Bytes(), out); err != nil {
			t.Fatalf("decode %s: %v (%s)", path, err, w.Body.String())
		}
	}
	return w.Code
}

func seedAnalyticsActivity(t *testing.T, store *memory.MemoryStorage) {
	t.Helper()
	ctx := context.Background()
	now := time.Now().UTC()
	today := now.Format("2006-01-02")

	if err := store.Study().RecordActivity(ctx, demoStudentID, today, "test"); err != nil {
		t.Fatalf("record activity: %v", err)
	}
	if _, err := store.Study().AwardXP(ctx, &models.XPEvent{
		ID:             uuid.NewString(),
		UserID:         demoStudentID,
		EventType:      "test_reward",
		IdempotencyKey: "analytics-test",
		XP:             42,
		CreatedAt:      now,
	}); err != nil {
		t.Fatalf("award xp: %v", err)
	}
	if err := store.Study().RecordAIUsage(ctx, &models.AIUsageEvent{
		ID:        uuid.NewString(),
		Kind:      "tts",
		Model:     "test-voice",
		CreatedAt: now,
	}); err != nil {
		t.Fatalf("record tts: %v", err)
	}
	if _, err := store.Study().RecordLearningEvent(ctx, &models.LearningEvent{
		ID:             uuid.NewString(),
		UserID:         demoStudentID,
		EventType:      "lesson_completed",
		IdempotencyKey: "analytics-lesson",
		CreatedAt:      now,
	}); err != nil {
		t.Fatalf("record learning event: %v", err)
	}
	if err := store.Study().RecordPracticeAttempt(ctx, &models.PracticeAttempt{
		ID:           uuid.NewString(),
		UserID:       demoStudentID,
		QuestionType: "FILL_BLANKS",
		CreatedAt:    now,
	}); err != nil {
		t.Fatalf("record practice attempt: %v", err)
	}
	if err := store.Sessions().SaveEvaluation(ctx, &models.EvaluationResult{
		ID:           uuid.NewString(),
		SessionID:    "analytics-session",
		QuestionID:   "q-sp-01",
		QuestionType: "SPEAK_PHOTO",
		Status:       "FAILED",
		CreatedAt:    now,
	}); err != nil {
		t.Fatalf("save evaluation: %v", err)
	}
}

func TestAdminAnalyticsAggregates(t *testing.T) {
	r, _, store := setupTestRouter()
	seedAnalyticsActivity(t, store)

	adminToken := loginToken(t, r, "admin@det-academy.com", "admin123")

	var overview models.AnalyticsOverview
	if code := getJSON(t, r, adminToken, "/api/v1/admin/analytics/overview?range=7d", &overview); code != http.StatusOK {
		t.Fatalf("overview status = %d", code)
	}
	if overview.TotalUsers == 0 {
		t.Fatal("expected total users > 0")
	}
	if overview.Active.DAU < 1 {
		t.Fatalf("expected DAU >= 1, got %d", overview.Active.DAU)
	}
	if overview.XPAwarded != 42 {
		t.Fatalf("xp awarded = %d, want 42", overview.XPAwarded)
	}
	if overview.TTSCalls != 1 {
		t.Fatalf("tts calls = %d, want 1", overview.TTSCalls)
	}
	if overview.Evaluations != 1 || overview.SpeakingCount != 1 {
		t.Fatalf("evaluations = %d speaking = %d, want 1/1", overview.Evaluations, overview.SpeakingCount)
	}
	if overview.ErrorCount != 1 {
		t.Fatalf("error count = %d, want 1 (failed evaluation)", overview.ErrorCount)
	}
	if overview.Range != "7d" {
		t.Fatalf("range = %q, want 7d", overview.Range)
	}

	var users models.AnalyticsSeries
	if code := getJSON(t, r, adminToken, "/api/v1/admin/analytics/timeseries?metric=users&range=7d&bucket=day", &users); code != http.StatusOK {
		t.Fatalf("users series status = %d", code)
	}
	if len(users.Points) < 7 {
		t.Fatalf("expected at least 7 daily buckets, got %d", len(users.Points))
	}
	if !users.Cumulative {
		t.Fatal("users series must be cumulative")
	}
	if users.Total != overview.TotalUsers {
		t.Fatalf("series total = %d, overview total = %d", users.Total, overview.TotalUsers)
	}
	last := users.Points[len(users.Points)-1]
	if last.Value != overview.TotalUsers {
		t.Fatalf("last cumulative point = %d, want %d", last.Value, overview.TotalUsers)
	}

	var mocks models.AnalyticsSeries
	if code := getJSON(t, r, adminToken, "/api/v1/admin/analytics/timeseries?metric=mocks&range=24h&bucket=hour", &mocks); code != http.StatusOK {
		t.Fatalf("mocks series status = %d", code)
	}
	if len(mocks.Points) < 24 || len(mocks.Points) > 25 {
		t.Fatalf("expected 24-25 hourly buckets, got %d", len(mocks.Points))
	}

	var features models.AnalyticsFeatures
	if code := getJSON(t, r, adminToken, "/api/v1/admin/analytics/features?range=7d", &features); code != http.StatusOK {
		t.Fatalf("features status = %d", code)
	}
	if features.PageViewsAvailable {
		t.Fatal("page views must be reported as unavailable")
	}
	if len(features.Items) == 0 {
		t.Fatal("expected at least one derived feature row")
	}
	keys := map[string]bool{}
	for _, item := range features.Items {
		if item.Count <= 0 {
			t.Fatalf("feature %s has non-positive count", item.Key)
		}
		keys[item.Source+"|"+item.Key] = true
	}
	if !keys["learning_events|lesson_completed"] || !keys["practice_attempts|FILL_BLANKS"] || !keys["evaluations|SPEAK_PHOTO"] {
		t.Fatalf("missing derived feature rows: %#v", keys)
	}

	var retention models.AnalyticsRetention
	if code := getJSON(t, r, adminToken, "/api/v1/admin/analytics/retention?range=7d", &retention); code != http.StatusOK {
		t.Fatalf("retention status = %d", code)
	}
	if len(retention.Cohorts) == 0 {
		t.Fatal("expected at least one cohort")
	}
	found := false
	for _, cohort := range retention.Cohorts {
		if cohort.Size > 0 && cohort.D1 != nil {
			found = true
		}
	}
	if !found {
		t.Fatal("expected an eligible D1 cohort rate")
	}
}

func TestAdminAnalyticsRBAC(t *testing.T) {
	r, _, _ := setupTestRouter()
	studentToken := loginToken(t, r, "student@det-academy.com", "password123")

	paths := []string{
		"/api/v1/admin/analytics/overview?range=7d",
		"/api/v1/admin/analytics/timeseries?metric=signups&range=7d",
		"/api/v1/admin/analytics/features?range=7d",
		"/api/v1/admin/analytics/retention?range=7d",
	}
	for _, path := range paths {
		if code := getJSON(t, r, studentToken, path, nil); code != http.StatusForbidden {
			t.Fatalf("%s: student status = %d, want 403", path, code)
		}
	}
	for _, path := range paths {
		if code := getJSON(t, r, "", path, nil); code != http.StatusUnauthorized {
			t.Fatalf("%s: anonymous status = %d, want 401", path, code)
		}
	}
}

func TestAdminAnalyticsValidation(t *testing.T) {
	r, _, _ := setupTestRouter()
	adminToken := loginToken(t, r, "admin@det-academy.com", "admin123")

	cases := []string{
		"/api/v1/admin/analytics/overview?range=365d",
		"/api/v1/admin/analytics/timeseries?metric=signups&range=7d&bucket=week",
		"/api/v1/admin/analytics/timeseries?metric=signups&range=90d&bucket=hour",
		"/api/v1/admin/analytics/timeseries?metric=secrets&range=7d",
		"/api/v1/admin/analytics/timeseries?range=7d",
	}
	for _, path := range cases {
		if code := getJSON(t, r, adminToken, path, nil); code != http.StatusBadRequest {
			t.Fatalf("%s: status = %d, want 400", path, code)
		}
	}

	if _, err := service.ParseAnalyticsWindow("", ""); err != nil {
		t.Fatalf("default window: %v", err)
	}
	window, err := service.ParseAnalyticsWindow("24h", "")
	if err != nil {
		t.Fatalf("24h window: %v", err)
	}
	if window.Bucket != "hour" {
		t.Fatalf("24h default bucket = %q, want hour", window.Bucket)
	}
}
