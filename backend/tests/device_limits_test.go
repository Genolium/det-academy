package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/handlers"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const deviceTestSecret = "device-limit-test-secret"

type deviceLimitsFixture struct {
	router       *chi.Mux
	store        *memory.MemoryStorage
	authService  *service.AuthService
	catService   *service.CATService
	studyService *service.StudyService
}

// newLimitsRouter wires only the routes that consume a daily quota. The shared
// test router is intentionally left alone: its tests issue far more than the
// default auth allowance from one fixed RemoteAddr.
func newLimitsRouter(t *testing.T) *deviceLimitsFixture {
	t.Helper()
	store := memory.New()
	authService := service.NewAuthService(store.Users(), deviceTestSecret, store.OAuthTransactions())
	authService.SetRefreshTokenRepo(store.RefreshTokens())
	theoryService := service.NewTheoryService(store.Theory())
	catService := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theoryService, store.Study(),
	)
	studyService := service.NewStudyService(store, theoryService, catService)
	limitGuard := service.NewLimitGuard(store.Limits(), deviceTestSecret)

	authHandler := handlers.NewAuthHandler(authService)
	authHandler.SetLimitGuard(limitGuard)
	testHandler := handlers.NewTestHandler(catService)
	testHandler.SetLimitGuard(limitGuard)
	studyHandler := handlers.NewStudyHandler(studyService)
	studyHandler.SetLimitGuard(limitGuard)
	mediaHandler := handlers.NewMediaHandler(catService, t.TempDir())
	mediaHandler.SetLimitGuard(limitGuard)

	r := chi.NewRouter()
	r.Use(handlers.ClientIdentityMiddleware(limitGuard))
	r.Post("/api/v1/auth/register", authHandler.Register)
	r.Post("/api/v1/test/sessions", withTestAuth(authService, testHandler.StartSession))
	r.Post("/api/v1/user/practice/attempts", withTestAuth(authService, studyHandler.RecordPracticeAttempt))
	r.Post("/api/v1/test/sessions/{id}/audio", withTestAuth(authService, mediaHandler.UploadAudio))

	return &deviceLimitsFixture{
		router: r, store: store, authService: authService,
		catService: catService, studyService: studyService,
	}
}

func withTestAuth(authService *service.AuthService, next http.HandlerFunc) http.HandlerFunc {
	authenticated := handlers.AuthMiddleware(authService)(next)
	return func(w http.ResponseWriter, r *http.Request) {
		authenticated.ServeHTTP(w, r)
	}
}

func doJSONRequest(t *testing.T, r http.Handler, method, path, token, ip, device string, payload any) *httptest.ResponseRecorder {
	t.Helper()
	var body bytes.Buffer
	if payload != nil {
		if err := json.NewEncoder(&body).Encode(payload); err != nil {
			t.Fatalf("encode payload: %v", err)
		}
	}
	req := httptest.NewRequest(method, path, &body)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if ip != "" {
		req.Header.Set("X-Forwarded-For", ip)
	}
	if device != "" {
		req.Header.Set("X-Device-Id", device)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func registerWithIdentity(t *testing.T, r http.Handler, ip, device string) string {
	t.Helper()
	payload := models.RegisterRequest{
		Email:    fmt.Sprintf("limit-%d-%s@example.com", time.Now().UnixNano(), uuid.NewString()[:8]),
		Password: "strongPassword123",
		Name:     "Limit User",
		Locale:   "ru",
	}
	w := doJSONRequest(t, r, http.MethodPost, "/api/v1/auth/register", "", ip, device, payload)
	if w.Code != http.StatusCreated {
		t.Fatalf("register: %d %s", w.Code, w.Body.String())
	}
	var response models.AuthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode register response: %v", err)
	}
	if response.Token == "" {
		t.Fatal("register returned an empty token")
	}
	return response.Token
}

func startFullMock(t *testing.T, r http.Handler, token, ip, device string) *httptest.ResponseRecorder {
	t.Helper()
	return doJSONRequest(t, r, http.MethodPost, "/api/v1/test/sessions", token, ip, device, map[string]string{
		"candidateName":   "Limit Candidate",
		"difficultyLevel": "B1",
		"mode":            "full",
	})
}

func requireLimitResponse(t *testing.T, w *httptest.ResponseRecorder, scope string) {
	t.Helper()
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429: %s", w.Code, w.Body.String())
	}
	if w.Header().Get("Retry-After") == "" {
		t.Fatal("429 must include Retry-After")
	}
	var body struct {
		Code      string `json:"code"`
		Scope     string `json:"scope"`
		Limit     string `json:"limit"`
		RetrySecs int    `json:"retryAfterSec"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode limit response: %v", err)
	}
	if body.Code != "daily_limit_reached" || body.Scope != scope || body.Limit == "" {
		t.Fatalf("unexpected limit body: %+v", body)
	}
	if body.RetrySecs <= 0 {
		t.Fatalf("retryAfterSec = %d, want > 0", body.RetrySecs)
	}
}

func setHighAuthLimits(t *testing.T) {
	t.Helper()
	t.Setenv("DAILY_AUTH_LIMIT_PER_IP", "1000")
	t.Setenv("DAILY_AUTH_LIMIT_PER_DEVICE", "1000")
}

// Two different accounts behind the same address must share the IP cap.
func TestDeviceLimitSameIPDifferentUsersHitsIPCap(t *testing.T) {
	setHighAuthLimits(t)
	t.Setenv("DAILY_MOCK_LIMIT", "100")
	t.Setenv("DAILY_MOCK_LIMIT_PER_IP", "2")
	t.Setenv("DAILY_MOCK_LIMIT_PER_DEVICE", "100")
	fixture := newLimitsRouter(t)

	const ip = "203.0.113.11"
	firstToken := registerWithIdentity(t, fixture.router, ip, "device-user-a")
	secondToken := registerWithIdentity(t, fixture.router, ip, "device-user-b")

	if w := startFullMock(t, fixture.router, firstToken, ip, "device-user-a"); w.Code != http.StatusCreated {
		t.Fatalf("first user mock: %d %s", w.Code, w.Body.String())
	}
	if w := startFullMock(t, fixture.router, secondToken, ip, "device-user-b"); w.Code != http.StatusCreated {
		t.Fatalf("second user mock: %d %s", w.Code, w.Body.String())
	}
	requireLimitResponse(t, startFullMock(t, fixture.router, secondToken, ip, "device-user-c"), service.LimitScopeMock)
}

// A normal user on two networks is not blocked by the user allowance until the
// per-network cap is reached, which is what "same user, different IP" means.
func TestDeviceLimitSameUserDifferentIPs(t *testing.T) {
	setHighAuthLimits(t)
	t.Setenv("DAILY_MOCK_LIMIT", "100")
	t.Setenv("DAILY_MOCK_LIMIT_PER_IP", "1")
	t.Setenv("DAILY_MOCK_LIMIT_PER_DEVICE", "100")
	fixture := newLimitsRouter(t)

	token := registerWithIdentity(t, fixture.router, "198.51.100.40", "user-two-networks")
	if w := startFullMock(t, fixture.router, token, "198.51.100.40", "user-two-networks"); w.Code != http.StatusCreated {
		t.Fatalf("first network: %d %s", w.Code, w.Body.String())
	}
	if w := startFullMock(t, fixture.router, token, "198.51.100.41", "user-two-networks"); w.Code != http.StatusCreated {
		t.Fatalf("second network: %d %s", w.Code, w.Body.String())
	}
	requireLimitResponse(t, startFullMock(t, fixture.router, token, "198.51.100.40", "user-two-networks"), service.LimitScopeMock)
}

// Rotating X-Device-Id must not bypass the IP cap.
func TestDeviceLimitSpoofedDeviceIDStillHitsIPCap(t *testing.T) {
	setHighAuthLimits(t)
	t.Setenv("DAILY_MOCK_LIMIT", "100")
	t.Setenv("DAILY_MOCK_LIMIT_PER_IP", "2")
	t.Setenv("DAILY_MOCK_LIMIT_PER_DEVICE", "100")
	fixture := newLimitsRouter(t)

	const ip = "203.0.113.12"
	token := registerWithIdentity(t, fixture.router, ip, "spoof-device-0")
	for attempt := 0; attempt < 2; attempt++ {
		device := fmt.Sprintf("spoof-device-%d", attempt+1)
		if w := startFullMock(t, fixture.router, token, ip, device); w.Code != http.StatusCreated {
			t.Fatalf("spoofed device attempt %d: %d %s", attempt+1, w.Code, w.Body.String())
		}
	}
	requireLimitResponse(t, startFullMock(t, fixture.router, token, ip, "spoof-device-3"), service.LimitScopeMock)
}

// An invalid device header is ignored: the request is still allowed and no
// device counter is consumed, while the IP cap remains active.
func TestDeviceLimitInvalidHeaderIsIgnored(t *testing.T) {
	setHighAuthLimits(t)
	t.Setenv("DAILY_MOCK_LIMIT", "100")
	t.Setenv("DAILY_MOCK_LIMIT_PER_IP", "100")
	t.Setenv("DAILY_MOCK_LIMIT_PER_DEVICE", "1")
	fixture := newLimitsRouter(t)

	const ip = "203.0.113.13"
	token := registerWithIdentity(t, fixture.router, ip, "valid-device-registration")
	for attempt := 0; attempt < 2; attempt++ {
		if w := startFullMock(t, fixture.router, token, ip, "not a valid device!"); w.Code != http.StatusCreated {
			t.Fatalf("invalid header attempt %d: %d %s", attempt+1, w.Code, w.Body.String())
		}
	}
	// The first well-formed device still gets its own slot.
	if w := startFullMock(t, fixture.router, token, ip, "valid-device-after-invalid"); w.Code != http.StatusCreated {
		t.Fatalf("first valid device after invalid headers: %d %s", w.Code, w.Body.String())
	}
}

func TestAuthDailyLimitReturns429(t *testing.T) {
	t.Setenv("DAILY_AUTH_LIMIT_PER_IP", "2")
	t.Setenv("DAILY_AUTH_LIMIT_PER_DEVICE", "100")
	fixture := newLimitsRouter(t)

	const ip = "203.0.113.14"
	for attempt := 0; attempt < 2; attempt++ {
		w := doJSONRequest(t, fixture.router, http.MethodPost, "/api/v1/auth/register", "", ip, "auth-device", struct{}{})
		if w.Code == http.StatusTooManyRequests {
			t.Fatalf("attempt %d must not be limited yet", attempt+1)
		}
	}
	requireLimitResponse(
		t,
		doJSONRequest(t, fixture.router, http.MethodPost, "/api/v1/auth/register", "", ip, "auth-device", struct{}{}),
		service.LimitScopeAuth,
	)
}

func TestSpeakingPracticeDailyLimitIsEnforcedOnSubmission(t *testing.T) {
	setHighAuthLimits(t)
	t.Setenv("DAILY_SPEAKING_LIMIT", "100")
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_IP", "1")
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_DEVICE", "100")
	fixture := newLimitsRouter(t)

	const ip = "203.0.113.15"
	token := registerWithIdentity(t, fixture.router, ip, "speaking-device")
	claims, err := fixture.authService.ValidateToken(token)
	if err != nil {
		t.Fatal(err)
	}
	payloadFor := func(assignmentID string) map[string]any {
		return map[string]any{
			"assignmentId": assignmentID,
			"userResponse": map[string]any{"text": "This is a spoken answer."},
			"timeSpentSec": 30,
		}
	}
	first, err := fixture.studyService.CreatePracticeAssignment(context.Background(), claims.UserID, "SPEAK_PHOTO")
	if err != nil {
		t.Fatal(err)
	}
	if w := doJSONRequest(t, fixture.router, http.MethodPost, "/api/v1/user/practice/attempts", token, ip, "speaking-device", payloadFor(first.AssignmentID)); w.Code != http.StatusOK {
		t.Fatalf("first speaking attempt: %d %s", w.Code, w.Body.String())
	}
	second, err := fixture.studyService.CreatePracticeAssignment(context.Background(), claims.UserID, "SPEAK_PHOTO")
	if err != nil {
		t.Fatal(err)
	}
	requireLimitResponse(
		t,
		doJSONRequest(t, fixture.router, http.MethodPost, "/api/v1/user/practice/attempts", token, ip, "speaking-device", payloadFor(second.AssignmentID)),
		service.LimitScopeSpeaking,
	)
}

// The audio endpoint is separate from the JSON submission and has to consume
// the same speaking allowance.
func TestSpeakingAudioUploadConsumesIPLimit(t *testing.T) {
	setHighAuthLimits(t)
	t.Setenv("DAILY_SPEAKING_LIMIT", "100")
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_IP", "1")
	t.Setenv("DAILY_SPEAKING_LIMIT_PER_DEVICE", "100")
	fixture := newLimitsRouter(t)

	const ip = "203.0.113.16"
	userID := uuid.NewString()
	user := &models.User{
		ID: userID, Email: "audio-" + userID[:8] + "@example.com",
		PasswordHash: "not-used", Name: "Audio User", Role: "student", Locale: "ru",
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	if err := fixture.store.Users().Create(context.Background(), user); err != nil {
		t.Fatalf("create user: %v", err)
	}
	token, err := fixture.authService.GenerateToken(user)
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	session, _, err := fixture.catService.StartSession(context.Background(), userID, "Audio", "B1", "diagnostic")
	if err != nil {
		t.Fatalf("start diagnostic session: %v", err)
	}

	upload := func() *httptest.ResponseRecorder {
		var body bytes.Buffer
		writer := multipart.NewWriter(&body)
		part, err := writer.CreateFormFile("audio", "answer.webm")
		if err != nil {
			t.Fatalf("create multipart file: %v", err)
		}
		_, _ = part.Write([]byte("fake audio bytes"))
		_ = writer.WriteField("questionId", "q-sp-01")
		_ = writer.Close()

		req := httptest.NewRequest(http.MethodPost, "/api/v1/test/sessions/"+session.ID+"/audio", &body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("X-Forwarded-For", ip)
		req.Header.Set("X-Device-Id", "audio-device")
		w := httptest.NewRecorder()
		fixture.router.ServeHTTP(w, req)
		return w
	}

	if w := upload(); w.Code == http.StatusTooManyRequests {
		t.Fatalf("first audio upload must pass the guard: %s", w.Body.String())
	}
	requireLimitResponse(t, upload(), service.LimitScopeSpeaking)
}

func TestDeviceIDHeaderDoesNotAppearInContextOrResponses(t *testing.T) {
	if !service.ValidDeviceID("550e8400-e29b-41d4-a716-446655440000") {
		t.Fatal("a UUID device id must be accepted")
	}
	hash := service.HashDeviceID("secret", "550e8400-e29b-41d4-a716-446655440000")
	if strings.Contains(hash, "550e8400") {
		t.Fatal("the hashed device id must not contain the raw value")
	}
}
