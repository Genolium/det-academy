package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/handlers"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/go-chi/chi/v5"
)

func setupTestRouter() (*chi.Mux, *service.AuthService, *memory.MemoryStorage) {
	store := memory.New()
	testSigningValue := "unit-test-only"

	authService := service.NewAuthService(store.Users(), testSigningValue, store.OAuthTransactions())
	authService.SetRefreshTokenRepo(store.RefreshTokens())
	theoryService := service.NewTheoryService(store.Theory())
	catService := service.NewCATService(
		store.Sessions(),
		store.Questions(),
		store.Theory(),
		store.Certificates(),
		theoryService,
		store.Study(),
	)
	certService := service.NewCertificateService(
		store.Certificates(),
		store.Sessions(),
		store.Theory(),
	)
	bannerService := service.NewBannerService(store.Banners())
	institutionService := service.NewInstitutionService(store.Institutions())
	adminService := service.NewAdminService(
		store.Users(),
		store.Sessions(),
		store.Questions(),
		store.Certificates(),
		store.Banners(),
		store.Institutions(),
	)

	authHandler := handlers.NewAuthHandler(authService)
	theoryHandler := handlers.NewTheoryHandler(theoryService)
	testHandler := handlers.NewTestHandler(catService)
	certHandler := handlers.NewCertificateHandler(certService)
	bannerHandler := handlers.NewBannerHandler(bannerService)
	institutionHandler := handlers.NewInstitutionHandler(institutionService)
	adminHandler := handlers.NewAdminHandler(adminService, authService)
	studyService := service.NewStudyService(store, theoryService, catService)
	studyHandler := handlers.NewStudyHandler(studyService)
	vocabularyService := service.NewVocabularyService(store.Vocabulary())
	vocabularyHandler := handlers.NewVocabularyHandler(vocabularyService)

	tempAudioDir, _ := os.MkdirTemp("", "det_test_media_*")
	mediaHandler := handlers.NewMediaHandler(catService, tempAudioDir)

	r := chi.NewRouter()

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			handlers.RespondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
		})

		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.With(handlers.OptionalAuthMiddleware(authService)).Post("/logout", authHandler.Logout)
			r.Post("/oauth", authHandler.OAuthLogin)
			r.With(handlers.OptionalAuthMiddleware(authService)).Post("/oauth/start", authHandler.StartOAuth)
			r.Post("/verify-email", authHandler.VerifyEmail)
			r.Post("/refresh", authHandler.Refresh)
			r.With(handlers.AuthMiddleware(authService)).Get("/me", authHandler.Me)
		})

		r.Route("/user", func(r chi.Router) {
			r.Use(handlers.AuthMiddleware(authService))
			r.Get("/goals", studyHandler.GetGoals)
			r.Put("/goals", studyHandler.UpdateGoals)
			r.Get("/plan", studyHandler.GetStudyPlan)
			r.Get("/report/weekly", studyHandler.GetWeeklyReport)
			r.Post("/plan/tasks/{id}/complete", studyHandler.CompletePlanTask)
			r.Get("/analytics/skills", studyHandler.GetSkillAnalytics)
			r.Get("/errors", studyHandler.GetErrors)
			r.Post("/errors", studyHandler.SaveError)
			r.Post("/errors/{id}/recall", studyHandler.RecallError)
			r.Delete("/errors/{id}", studyHandler.DeleteError)
			r.Get("/streak", studyHandler.GetStreak)
			r.Post("/activity", studyHandler.RecordActivity)
			r.Get("/srs", studyHandler.GetSRSState)
			r.Post("/srs/review", studyHandler.ReviewSRSCard)
		})

		r.Route("/theory", func(r chi.Router) {
			r.Get("/lessons", theoryHandler.GetLessons)
			r.With(handlers.AuthMiddleware(authService)).Get("/progress", theoryHandler.GetProgress)
			r.With(handlers.AuthMiddleware(authService)).Post("/toggle", theoryHandler.ToggleCompletion)
		})

		r.Route("/test", func(r chi.Router) {
			r.Get("/questions", testHandler.GetQuestions)
			// Strict auth required for all test session operations
			r.Group(func(r chi.Router) {
				r.Use(handlers.AuthMiddleware(authService))
				r.Post("/sessions", testHandler.StartSession)
				r.Get("/sessions/me", testHandler.GetMySessions)
				r.Get("/sessions/{id}", testHandler.GetSession)
				r.Post("/sessions/{id}/respond", testHandler.RecordResponse)
				r.Post("/sessions/{id}/stage-complete", testHandler.CompleteStage)
				r.Post("/sessions/{id}/complete", testHandler.CompleteSession)
				r.Post("/sessions/{id}/audio", mediaHandler.UploadAudio)
				r.Get("/sessions/{id}/evaluations", testHandler.GetSessionEvaluations)
				r.Get("/sessions/{id}/review", testHandler.GetSessionReview)
			})
		})

		r.With(handlers.AuthMiddleware(authService)).Get("/media/audio/{filename}", mediaHandler.ServeAudio)

		r.Route("/certificates", func(r chi.Router) {
			r.Get("/{id}", certHandler.GetByID)
			r.With(handlers.AuthMiddleware(authService)).Post("/", certHandler.IssueCertificate)
			r.With(handlers.AuthMiddleware(authService)).Get("/user/me", certHandler.GetMyCertificates)
		})

		r.Route("/banners", func(r chi.Router) {
			r.Get("/", bannerHandler.GetBanners)
			r.Post("/{id}/click", bannerHandler.RecordClick)
		})

		r.Get("/vocabulary", vocabularyHandler.List)

		r.Route("/institutions", func(r chi.Router) {
			r.Get("/", institutionHandler.List)
			r.Get("/{id}", institutionHandler.GetByID)
			r.With(handlers.AdminMiddleware(authService)).Post("/", institutionHandler.Create)
			r.With(handlers.AdminMiddleware(authService)).Delete("/{id}", institutionHandler.Delete)
		})

		r.Route("/admin", func(r chi.Router) {
			r.Use(handlers.AdminMiddleware(authService))
			r.Get("/stats", adminHandler.GetStats)
			r.Get("/users", adminHandler.ListUsers)
			r.Patch("/users/{id}/role", adminHandler.UpdateUserRole)
			r.Delete("/users/{id}", adminHandler.DeleteUser)
			r.Get("/sessions", adminHandler.ListSessions)
			r.Get("/questions", adminHandler.ListQuestions)
			r.Post("/questions", adminHandler.CreateQuestion)
			r.Delete("/questions/{id}", adminHandler.DeleteQuestion)
			r.Get("/vocabulary", vocabularyHandler.ListAll)
			r.Put("/vocabulary/{id}/status", vocabularyHandler.UpdateStatus)
			r.Get("/banners", adminHandler.ListBanners)
			r.Post("/banners", adminHandler.CreateBanner)
			r.Put("/banners/{id}", adminHandler.UpdateBanner)
			r.Delete("/banners/{id}", adminHandler.DeleteBanner)
		})
	})

	return r, authService, store
}

func TestHealthCheck(t *testing.T) {
	r, _, _ := setupTestRouter()
	req := httptest.NewRequest("GET", "/api/v1/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func submitTestAnswer(t *testing.T, r http.Handler, token, sessionID, questionID string, payload string) {
	t.Helper()
	body, _ := json.Marshal(models.SubmitResponseRequest{
		QuestionID:   questionID,
		UserResponse: json.RawMessage(payload),
		TimeSpentSec: 20,
	})
	req := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/respond", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("failed to submit answer for %s: %d %s", questionID, w.Code, w.Body.String())
	}
}

func getCurrentQuestionIDs(t *testing.T, r http.Handler, token, sessionID string) []string {
	t.Helper()
	req := httptest.NewRequest("GET", "/api/v1/test/sessions/"+sessionID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("failed to read session: %d %s", w.Code, w.Body.String())
	}
	var details models.SessionDetailsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &details); err != nil {
		t.Fatalf("failed to decode session: %v", err)
	}
	ids := make([]string, 0, len(details.Questions))
	for _, question := range details.Questions {
		ids = append(ids, question.ID)
	}
	return ids
}

func completeCurrentStage(t *testing.T, r http.Handler, token, sessionID, stage string) {
	t.Helper()
	payload, _ := json.Marshal(models.StageCompleteRequest{StageName: stage, Accuracy: 0.5})
	req := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/stage-complete", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("failed to complete stage %s: %d %s", stage, w.Code, w.Body.String())
	}
}

func stageAnswer(stage string) (string, string) {
	switch stage {
	case "READ_SELECT":
		return "q-rs-01", `{"isReal":true}`
	case "FILL_BLANKS":
		return "q-fb-01", `{"answer":"ergy"}`
	case "C_TEST":
		return "q-ct-01", `{"answers":["orporate","nimize","eated"]}`
	case "LISTEN_TYPE":
		return "q-lt-01", `"The library provides free access to academic journals."`
	case "INTERACTIVE_READING":
		return "q-ir-01", `{"gap":"protection","highlightSentence":"Coral reefs provide vital coastal protection against severe storms","mainIdeaIndex":0,"titleIndex":0,"sentenceIndex":0}`
	case "INTERACTIVE_LISTENING":
		return "q-il-01", `{"turns":[0]}`
	case "WRITE_PHOTO":
		return "q-wp-01", `{"text":"A scientist in a white laboratory coat is carefully examining a test tube while colleagues record measurements in a modern research facility."}`
	case "INTERACTIVE_WRITING":
		return "q-iw-01", `{"part1":"University students should explore a broad range of general education courses because interdisciplinary knowledge improves critical thinking and long-term career adaptability.","part2":"Universities should provide academic advisors, manageable deadlines, and mental health support so students are not overwhelmed by courses outside their primary field."}`
	case "SPEAK_PHOTO":
		return "q-sp-01", `{"transcript":"In this photo a group of people is gathering in a park on a sunny afternoon. Some are talking while others are preparing food. The environment looks calm and welcoming.","durationSec":75}`
	case "READ_THEN_SPEAK":
		return "q-rts-01", `{"transcript":"A memorable journey I took was a train trip through the mountains. I traveled with my sister and we watched the landscape change from green valleys to snowy peaks. The experience was unforgettable because we met local families and learned about their traditions.","durationSec":80}`
	case "INTERACTIVE_SPEAKING":
		return "q-is-01", `{"transcript":"I would like to change my elective because the current schedule conflicts with my statistics laboratory, and the alternative course better supports my major requirements.","durationSec":30}`
	case "WRITING_SAMPLE":
		return "q-ws-01", `{"text":"Practical career skills and theoretical academic subjects both matter, but I believe a balanced education is most beneficial. Practical courses teach students how to communicate, collaborate, and solve real problems, while theoretical subjects develop the analytical habits that make those skills adaptable. A university that combines internships with rigorous seminars prepares graduates for long-term success."}`
	case "SPEAKING_SAMPLE":
		return "q-ss-01", `{"transcript":"I prefer living in a large city because it offers more educational and professional opportunities. Public transport makes it easier to attend classes and internships, and cultural events expose me to different perspectives. However, I also value quiet green spaces, so a well-designed city with accessible parks would be ideal for me.","durationSec":150}`
	default:
		return "q-rs-01", `{"isReal":true}`
	}
}

func TestAuthRegisterAndLogin(t *testing.T) {
	r, _, _ := setupTestRouter()

	// 1. Register new user
	regPayload := models.RegisterRequest{
		Email:    "newstudent@det-academy.com",
		Password: "strongPassword123!",
		Name:     "Test Student",
		Locale:   "ru",
	}
	body, _ := json.Marshal(regPayload)
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 on register, got %d: %s", w.Code, w.Body.String())
	}

	var regResp models.AuthResponse
	_ = json.Unmarshal(w.Body.Bytes(), &regResp)

	if regResp.Token == "" {
		t.Fatal("expected non-empty token")
	}
	if regResp.User.Email != "newstudent@det-academy.com" {
		t.Fatalf("expected email match, got %s", regResp.User.Email)
	}
	if regResp.User.Role != "student" {
		t.Fatalf("expected student role by default, got %s", regResp.User.Role)
	}

	// 2. Login with correct credentials
	loginPayload := models.LoginRequest{
		Email:    "newstudent@det-academy.com",
		Password: "strongPassword123!",
	}
	loginBody, _ := json.Marshal(loginPayload)
	loginReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	if loginW.Code != http.StatusOK {
		t.Fatalf("expected 200 on login, got %d", loginW.Code)
	}

	var loginResp models.AuthResponse
	_ = json.Unmarshal(loginW.Body.Bytes(), &loginResp)

	// 3. Access protected /me endpoint
	meReq := httptest.NewRequest("GET", "/api/v1/auth/me", nil)
	meReq.Header.Set("Authorization", "Bearer "+loginResp.Token)
	meW := httptest.NewRecorder()
	r.ServeHTTP(meW, meReq)

	if meW.Code != http.StatusOK {
		t.Fatalf("expected 200 on /me with valid token, got %d", meW.Code)
	}

	// 4. Access protected /me without token should be 401
	unauthReq := httptest.NewRequest("GET", "/api/v1/auth/me", nil)
	unauthW := httptest.NewRecorder()
	r.ServeHTTP(unauthW, unauthReq)

	if unauthW.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on /me without token, got %d", unauthW.Code)
	}
}

func TestTheoryAuthenticationProtection(t *testing.T) {
	r, _, _ := setupTestRouter()

	// Theory lessons list is public
	req := httptest.NewRequest("GET", "/api/v1/theory/lessons", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 for lessons list, got %d", w.Code)
	}

	// Theory progress requires authentication
	progReq := httptest.NewRequest("GET", "/api/v1/theory/progress", nil)
	progW := httptest.NewRecorder()
	r.ServeHTTP(progW, progReq)
	if progW.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated theory progress, got %d", progW.Code)
	}

	// Theory toggle requires authentication
	togglePayload := models.ToggleTheoryRequest{LessonSlug: "rules-and-technicalities"}
	toggleBody, _ := json.Marshal(togglePayload)
	togReq := httptest.NewRequest("POST", "/api/v1/theory/toggle", bytes.NewReader(toggleBody))
	togW := httptest.NewRecorder()
	r.ServeHTTP(togW, togReq)
	if togW.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated theory toggle, got %d", togW.Code)
	}
}

func TestTestSessionLifecycle(t *testing.T) {
	r, _, _ := setupTestRouter()

	// 1. Unauthenticated start session must return 401
	startPayload := models.StartSessionRequest{
		CandidateName:   "Unauth Candidate",
		DifficultyLevel: "B1",
	}
	body, _ := json.Marshal(startPayload)
	unauthReq := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader(body))
	unauthW := httptest.NewRecorder()
	r.ServeHTTP(unauthW, unauthReq)

	if unauthW.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated start session, got %d", unauthW.Code)
	}

	// 2. Login as student
	loginPayload := models.LoginRequest{
		Email:    "student@det-academy.com",
		Password: "password123",
	}
	loginBody, _ := json.Marshal(loginPayload)
	loginReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	var loginResp models.AuthResponse
	_ = json.Unmarshal(loginW.Body.Bytes(), &loginResp)
	token := loginResp.Token

	// Register a second user to test ownership authorization
	otherPayload := models.RegisterRequest{
		Email:    "other-student@det-academy.com",
		Password: "password123",
		Name:     "Other Student",
		Locale:   "ru",
	}
	otherBody, _ := json.Marshal(otherPayload)
	otherReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(otherBody))
	otherW := httptest.NewRecorder()
	r.ServeHTTP(otherW, otherReq)
	var otherResp models.AuthResponse
	_ = json.Unmarshal(otherW.Body.Bytes(), &otherResp)
	otherToken := otherResp.Token

	// 3. Start test session as authenticated student
	authStartReq := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader(body))
	authStartReq.Header.Set("Authorization", "Bearer "+token)
	authStartW := httptest.NewRecorder()
	r.ServeHTTP(authStartW, authStartReq)

	if authStartW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on start session, got %d: %s", authStartW.Code, authStartW.Body.String())
	}

	var startResp struct {
		Session   models.TestSession `json:"session"`
		Questions []models.Question  `json:"questions"`
	}
	_ = json.Unmarshal(authStartW.Body.Bytes(), &startResp)

	sessionID := startResp.Session.ID
	if sessionID == "" {
		t.Fatal("expected session ID to be non-empty")
	}

	// 3a. Verify that questions returned do NOT include correct answers
	for _, q := range startResp.Questions {
		if len(q.CorrectAnswers) > 0 {
			t.Fatalf("security violation: correct answers leaked in question response: %s", string(q.CorrectAnswers))
		}
	}

	// 3b. Verify unauthenticated access to session returns 401
	unauthGet := httptest.NewRequest("GET", "/api/v1/test/sessions/"+sessionID, nil)
	unauthGetW := httptest.NewRecorder()
	r.ServeHTTP(unauthGetW, unauthGet)
	if unauthGetW.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated GET session, got %d", unauthGetW.Code)
	}

	// 3c. Verify unauthorized user (other token) receives 403 Forbidden
	otherGet := httptest.NewRequest("GET", "/api/v1/test/sessions/"+sessionID, nil)
	otherGet.Header.Set("Authorization", "Bearer "+otherToken)
	otherGetW := httptest.NewRecorder()
	r.ServeHTTP(otherGetW, otherGet)
	if otherGetW.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on other user's session access, got %d", otherGetW.Code)
	}

	// 3d. Verify completing session without ANY recorded responses is strictly rejected
	compEmptyPayload := models.CompleteSessionRequest{
		ReadSelectAccuracy: 0.95,
	}
	compEmptyBody, _ := json.Marshal(compEmptyPayload)
	compEmptyReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/complete", bytes.NewReader(compEmptyBody))
	compEmptyReq.Header.Set("Authorization", "Bearer "+token)
	compEmptyW := httptest.NewRecorder()
	r.ServeHTTP(compEmptyW, compEmptyReq)
	if compEmptyW.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on completing empty test session without responses, got %d: %s", compEmptyW.Code, compEmptyW.Body.String())
	}

	// 4. Record question response as authenticated owner
	respPayload := models.SubmitResponseRequest{
		QuestionID:   "q-rs-01",
		UserResponse: json.RawMessage(`{"isReal":true}`),
		RawScore:     1.0,
		TimeSpentSec: 3,
	}
	respBody, _ := json.Marshal(respPayload)
	respReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/respond", bytes.NewReader(respBody))
	respReq.Header.Set("Authorization", "Bearer "+token)
	respW := httptest.NewRecorder()
	r.ServeHTTP(respW, respReq)

	if respW.Code != http.StatusOK {
		t.Fatalf("expected 200 on submit response, got %d: %s", respW.Code, respW.Body.String())
	}

	// Answer one issued question per stage so the overall score is measured.
	// Skipped skills must not borrow another skill's score.
	completeCurrentStage(t, r, token, sessionID, "READ_SELECT")
	for index, stage := range service.StageSequence {
		if index == 0 {
			continue
		}
		ids := getCurrentQuestionIDs(t, r, token, sessionID)
		if len(ids) == 0 {
			t.Fatalf("no assigned questions for stage %s", stage)
		}
		_, payload := stageAnswer(stage)
		submitTestAnswer(t, r, token, sessionID, ids[0], payload)
		completeCurrentStage(t, r, token, sessionID, stage)
	}

	// 5. Complete session
	compPayload := models.CompleteSessionRequest{
		ReadSelectAccuracy:        0.9,
		FillBlanksAccuracy:        0.85,
		CTestAccuracy:             0.8,
		ListenTypeAccuracy:        0.85,
		InteractiveReadingScore:   0.85,
		InteractiveListeningScore: 0.8,
		WritingScore:              0.85,
	}
	compBody, _ := json.Marshal(compPayload)
	compReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/complete", bytes.NewReader(compBody))
	compReq.Header.Set("Authorization", "Bearer "+token)
	compW := httptest.NewRecorder()
	r.ServeHTTP(compW, compReq)

	if compW.Code != http.StatusOK {
		t.Fatalf("expected 200 on complete session, got %d: %s", compW.Code, compW.Body.String())
	}

	var compResult models.SessionCompleteResponse
	_ = json.Unmarshal(compW.Body.Bytes(), &compResult)

	if compResult.Scores.Overall < 60 || compResult.Scores.Overall > 160 {
		t.Fatalf("expected score between 60 and 160, got %d", compResult.Scores.Overall)
	}

	// Verify all 4 individual skill scores and 4 integrated subscores are calculated
	if compResult.Scores.Reading == 0 || compResult.Scores.Listening == 0 ||
		compResult.Scores.Writing == 0 || compResult.Scores.Speaking == 0 {
		t.Fatalf("expected non-zero individual skill scores: reading=%d, listening=%d, writing=%d, speaking=%d",
			compResult.Scores.Reading, compResult.Scores.Listening, compResult.Scores.Writing, compResult.Scores.Speaking)
	}
	if compResult.Scores.Literacy == 0 || compResult.Scores.Comprehension == 0 ||
		compResult.Scores.Production == 0 || compResult.Scores.Conversation == 0 {
		t.Fatalf("expected non-zero integrated subscores: literacy=%d, comp=%d, prod=%d, conv=%d",
			compResult.Scores.Literacy, compResult.Scores.Comprehension, compResult.Scores.Production, compResult.Scores.Conversation)
	}

	// 6. Verify completing the already completed session again is idempotent:
	// the same immutable result is returned and no second result is created.
	compAgainReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/complete", bytes.NewReader(compBody))
	compAgainReq.Header.Set("Authorization", "Bearer "+token)
	compAgainW := httptest.NewRecorder()
	r.ServeHTTP(compAgainW, compAgainReq)
	if compAgainW.Code != http.StatusOK {
		t.Fatalf("expected 200 on repeated completion, got %d: %s", compAgainW.Code, compAgainW.Body.String())
	}
	var repeatedResult models.SessionCompleteResponse
	_ = json.Unmarshal(compAgainW.Body.Bytes(), &repeatedResult)
	if repeatedResult.Session.ID != compResult.Session.ID || repeatedResult.Scores.Overall != compResult.Scores.Overall {
		t.Fatalf(
			"expected repeated completion to return the same result, got session %s overall %d, want session %s overall %d",
			repeatedResult.Session.ID, repeatedResult.Scores.Overall,
			compResult.Session.ID, compResult.Scores.Overall,
		)
	}

	sessionsAfter := getUserSessionsForTest(t, r, token)
	completedCount := 0
	for _, session := range sessionsAfter {
		if session.ID == sessionID && session.Status == "COMPLETED" {
			completedCount++
		}
	}
	if completedCount != 1 {
		t.Fatalf("expected exactly one completed session after repeated completion, got %d", completedCount)
	}
}

func getUserSessionsForTest(t *testing.T, r http.Handler, token string) []models.TestSession {
	t.Helper()
	req := httptest.NewRequest("GET", "/api/v1/test/sessions/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 when listing sessions, got %d: %s", w.Code, w.Body.String())
	}
	var payload struct {
		Sessions []models.TestSession `json:"sessions"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to decode sessions: %v", err)
	}
	return payload.Sessions
}

func TestCompletionDoesNotCreditSkippedSkills(t *testing.T) {
	r, _, _ := setupTestRouter()

	regBody, _ := json.Marshal(models.RegisterRequest{
		Email:    "skip-skills@det-academy.com",
		Password: "strongPassword123!",
		Name:     "Skip Skills",
		Locale:   "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on register, got %d: %s", regW.Code, regW.Body.String())
	}
	var regResp models.AuthResponse
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)

	startReq := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader([]byte(`{"candidateName":"Skip Skills","difficultyLevel":"B2"}`)))
	startReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	startW := httptest.NewRecorder()
	r.ServeHTTP(startW, startReq)
	if startW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on start, got %d: %s", startW.Code, startW.Body.String())
	}
	var startResp models.SessionDetailsResponse
	_ = json.Unmarshal(startW.Body.Bytes(), &startResp)
	sessionID := startResp.Session.ID

	// Only writing is answered. Reading, listening and speaking are skipped.
	for _, stage := range service.StageSequence {
		if stage == "WRITING_SAMPLE" {
			ids := getCurrentQuestionIDs(t, r, regResp.Token, sessionID)
			if len(ids) == 0 {
				t.Fatalf("no assigned writing question")
			}
			submitTestAnswer(t, r, regResp.Token, sessionID, ids[0], `{"text":"A balanced education combines practical career skills with rigorous academic theory. Practical courses teach collaboration and problem solving, while seminars develop analytical habits that make graduates adaptable over time."}`)
		}
		completeCurrentStage(t, r, regResp.Token, sessionID, stage)
	}

	compReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/complete", bytes.NewReader([]byte("{}")))
	compReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	compW := httptest.NewRecorder()
	r.ServeHTTP(compW, compReq)
	if compW.Code != http.StatusOK {
		t.Fatalf("expected 200 on complete, got %d: %s", compW.Code, compW.Body.String())
	}
	var result models.SessionCompleteResponse
	_ = json.Unmarshal(compW.Body.Bytes(), &result)

	if result.Scores.Overall != 0 {
		t.Fatalf("expected no overall score when skills are missing, got %d", result.Scores.Overall)
	}
	if result.Scores.Completeness >= 1.0 {
		t.Fatalf("expected incomplete attempt, got completeness %.2f", result.Scores.Completeness)
	}
	missing := strings.Join(result.Scores.NotMeasured, ",")
	for _, skill := range []string{"reading", "listening", "speaking", "overall"} {
		if !strings.Contains(missing, skill) {
			t.Fatalf("expected %s to be not measured, got %s", skill, missing)
		}
	}
	if result.CertificateEligible || result.Certificate != nil {
		t.Fatalf("skipped attempt must not receive a certificate")
	}
	if result.Scores.AnsweredQuestions != 1 {
		t.Fatalf("expected 1 answered question, got %d", result.Scores.AnsweredQuestions)
	}
}

func TestQuestionPayloadsDoNotLeakAnswers(t *testing.T) {
	r, _, _ := setupTestRouter()

	for _, questionType := range []string{"FILL_BLANKS", "INTERACTIVE_READING", "INTERACTIVE_LISTENING"} {
		req := httptest.NewRequest("GET", "/api/v1/test/questions?type="+questionType, nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for %s, got %d", questionType, w.Code)
		}
		var questions []models.Question
		if err := json.Unmarshal(w.Body.Bytes(), &questions); err != nil {
			t.Fatalf("failed to decode %s questions: %v", questionType, err)
		}
		if len(questions) == 0 {
			t.Fatalf("expected seeded %s questions", questionType)
		}
		payload := string(questions[0].ContentPayload)
		for _, forbidden := range []string{`"fullWord"`, `"correct"`, `"correctIndex"`} {
			if strings.Contains(payload, forbidden) {
				t.Fatalf("%s payload leaks %s: %s", questionType, forbidden, payload)
			}
		}
	}
}

func TestServerOwnedStreak(t *testing.T) {
	r, _, _ := setupTestRouter()

	regBody, _ := json.Marshal(models.RegisterRequest{
		Email:    "streak@det-academy.com",
		Password: "strongPassword123!",
		Name:     "Streak User",
		Locale:   "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on register, got %d", regW.Code)
	}
	var regResp models.AuthResponse
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)

	streakReq := httptest.NewRequest("GET", "/api/v1/user/streak", nil)
	streakReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	streakW := httptest.NewRecorder()
	r.ServeHTTP(streakW, streakReq)
	if streakW.Code != http.StatusOK {
		t.Fatalf("expected 200 on empty streak, got %d: %s", streakW.Code, streakW.Body.String())
	}
	var empty models.UserStreak
	_ = json.Unmarshal(streakW.Body.Bytes(), &empty)
	if empty.StreakDays != 0 {
		t.Fatalf("expected 0 initial streak, got %d", empty.StreakDays)
	}

	activityReq := httptest.NewRequest("POST", "/api/v1/user/activity", bytes.NewReader([]byte(`{"source":"test"}`)))
	activityReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	activityW := httptest.NewRecorder()
	r.ServeHTTP(activityW, activityReq)
	if activityW.Code != http.StatusOK {
		t.Fatalf("expected 200 on activity, got %d: %s", activityW.Code, activityW.Body.String())
	}
	var streak models.UserStreak
	_ = json.Unmarshal(activityW.Body.Bytes(), &streak)
	if streak.StreakDays != 1 {
		t.Fatalf("expected streak 1 after activity, got %d", streak.StreakDays)
	}
	if streak.LastActiveDate != time.Now().UTC().Format("2006-01-02") {
		t.Fatalf("expected today's date, got %s", streak.LastActiveDate)
	}
}

func TestVocabularyPublication(t *testing.T) {
	r, _, _ := setupTestRouter()

	req := httptest.NewRequest("GET", "/api/v1/vocabulary?search=substan&level=C1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 on vocabulary, got %d: %s", w.Code, w.Body.String())
	}
	var payload struct {
		Entries []models.VocabularyEntry `json:"entries"`
		Total   int                      `json:"total"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to decode vocabulary: %v", err)
	}
	if payload.Total == 0 || len(payload.Entries) == 0 {
		t.Fatalf("expected seeded published vocabulary")
	}
	if payload.Entries[0].Status != "published" {
		t.Fatalf("expected only published entries, got %s", payload.Entries[0].Status)
	}
}

func TestWrongAnswerPopulatesErrorNotebook(t *testing.T) {
	r, _, _ := setupTestRouter()

	regBody, _ := json.Marshal(models.RegisterRequest{
		Email:    "notebook@det-academy.com",
		Password: "strongPassword123!",
		Name:     "Notebook User",
		Locale:   "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on register, got %d", regW.Code)
	}
	var regResp models.AuthResponse
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)

	startBody, _ := json.Marshal(map[string]string{"candidateName": "Notebook User", "difficultyLevel": "B2"})
	startReq := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader(startBody))
	startReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	startW := httptest.NewRecorder()
	r.ServeHTTP(startW, startReq)
	if startW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on start, got %d", startW.Code)
	}
	var startResp models.SessionDetailsResponse
	_ = json.Unmarshal(startW.Body.Bytes(), &startResp)
	sessionID := startResp.Session.ID

	completeCurrentStage(t, r, regResp.Token, sessionID, "READ_SELECT")
	ids := getCurrentQuestionIDs(t, r, regResp.Token, sessionID)
	if len(ids) == 0 {
		t.Fatal("expected assigned FILL_BLANKS question")
	}
	submitTestAnswer(t, r, regResp.Token, sessionID, ids[0], `{"answer":"zzzz"}`)

	req := httptest.NewRequest("GET", "/api/v1/user/errors", nil)
	req.Header.Set("Authorization", "Bearer "+regResp.Token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 on errors, got %d: %s", w.Code, w.Body.String())
	}
	var payload struct {
		Errors []models.UserErrorItem `json:"errors"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &payload)
	if len(payload.Errors) == 0 {
		t.Fatal("expected wrong exam answer to populate the error notebook")
	}
	if payload.Errors[0].CorrectAnswer == "" {
		t.Fatal("expected a correct answer in the error notebook")
	}
}

func TestAdminVocabularyPublishing(t *testing.T) {
	r, _, _ := setupTestRouter()

	loginBody, _ := json.Marshal(models.LoginRequest{Email: "admin@det-academy.com", Password: "admin123"})
	loginReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)
	if loginW.Code != http.StatusOK {
		t.Fatalf("expected admin login, got %d", loginW.Code)
	}
	var loginResp models.AuthResponse
	_ = json.Unmarshal(loginW.Body.Bytes(), &loginResp)

	listReq := httptest.NewRequest("GET", "/api/v1/admin/vocabulary", nil)
	listReq.Header.Set("Authorization", "Bearer "+loginResp.Token)
	listW := httptest.NewRecorder()
	r.ServeHTTP(listW, listReq)
	if listW.Code != http.StatusOK {
		t.Fatalf("expected admin vocabulary list, got %d: %s", listW.Code, listW.Body.String())
	}
	var payload struct {
		Entries []models.VocabularyEntry `json:"entries"`
	}
	_ = json.Unmarshal(listW.Body.Bytes(), &payload)
	if len(payload.Entries) == 0 {
		t.Fatal("expected seeded vocabulary entries")
	}
	entry := payload.Entries[0]

	statusBody, _ := json.Marshal(map[string]string{"status": "archived"})
	statusReq := httptest.NewRequest("PUT", "/api/v1/admin/vocabulary/"+entry.ID+"/status", bytes.NewReader(statusBody))
	statusReq.Header.Set("Authorization", "Bearer "+loginResp.Token)
	statusW := httptest.NewRecorder()
	r.ServeHTTP(statusW, statusReq)
	if statusW.Code != http.StatusOK {
		t.Fatalf("expected status update, got %d: %s", statusW.Code, statusW.Body.String())
	}

	publicReq := httptest.NewRequest("GET", "/api/v1/vocabulary?search="+entry.Word, nil)
	publicW := httptest.NewRecorder()
	r.ServeHTTP(publicW, publicReq)
	var publicPayload struct {
		Entries []models.VocabularyEntry `json:"entries"`
	}
	_ = json.Unmarshal(publicW.Body.Bytes(), &publicPayload)
	for _, item := range publicPayload.Entries {
		if item.ID == entry.ID {
			t.Fatal("archived entry must not be returned by the public API")
		}
	}
}

func TestWeeklyReport(t *testing.T) {
	r, _, _ := setupTestRouter()
	regBody, _ := json.Marshal(models.RegisterRequest{
		Email: "weekly@det-academy.com", Password: "strongPassword123!", Name: "Weekly User", Locale: "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	var regResp models.AuthResponse
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)

	activityReq := httptest.NewRequest("POST", "/api/v1/user/activity", bytes.NewReader([]byte(`{"source":"test"}`)))
	activityReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	activityW := httptest.NewRecorder()
	r.ServeHTTP(activityW, activityReq)

	reportReq := httptest.NewRequest("GET", "/api/v1/user/report/weekly", nil)
	reportReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	reportW := httptest.NewRecorder()
	r.ServeHTTP(reportW, reportReq)
	if reportW.Code != http.StatusOK {
		t.Fatalf("expected 200 on weekly report, got %d: %s", reportW.Code, reportW.Body.String())
	}
	var report models.WeeklyReport
	_ = json.Unmarshal(reportW.Body.Bytes(), &report)
	if report.StudyDays != 1 {
		t.Fatalf("expected 1 study day, got %d", report.StudyDays)
	}
	if len(report.Recommendations) == 0 {
		t.Fatal("expected at least one recommendation")
	}
}

func TestDiagnosticSessionUsesShortBlueprint(t *testing.T) {
	r, _, _ := setupTestRouter()
	regBody, _ := json.Marshal(models.RegisterRequest{
		Email: "diagnostic@det-academy.com", Password: "strongPassword123!", Name: "Diag", Locale: "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	var regResp models.AuthResponse
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)

	body, _ := json.Marshal(models.StartSessionRequest{CandidateName: "Diag", DifficultyLevel: "B1", Mode: "diagnostic"})
	req := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+regResp.Token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var payload struct {
		Session   models.TestSession `json:"session"`
		Questions []models.Question  `json:"questions"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &payload)
	if payload.Session.Mode != "diagnostic" {
		t.Fatalf("expected diagnostic mode, got %s", payload.Session.Mode)
	}
	if len(payload.Questions) > 6 {
		t.Fatalf("expected short diagnostic set, got %d questions", len(payload.Questions))
	}
}

func TestPlanTaskCompletionPersists(t *testing.T) {
	r, _, _ := setupTestRouter()
	regBody, _ := json.Marshal(models.RegisterRequest{
		Email: "tasks@det-academy.com", Password: "strongPassword123!", Name: "Tasks", Locale: "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	var regResp models.AuthResponse
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)

	completeReq := httptest.NewRequest("POST", "/api/v1/user/plan/tasks/task-srs/complete", nil)
	completeReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	completeW := httptest.NewRecorder()
	r.ServeHTTP(completeW, completeReq)
	if completeW.Code != http.StatusOK {
		t.Fatalf("expected 200 on task completion, got %d: %s", completeW.Code, completeW.Body.String())
	}

	planReq := httptest.NewRequest("GET", "/api/v1/user/plan", nil)
	planReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	planW := httptest.NewRecorder()
	r.ServeHTTP(planW, planReq)
	if planW.Code != http.StatusOK {
		t.Fatalf("expected 200 on plan, got %d", planW.Code)
	}
	var plan models.StudyPlanResponse
	_ = json.Unmarshal(planW.Body.Bytes(), &plan)
	for _, task := range plan.TasksToday {
		if task.ID == "task-srs" {
			if !task.Completed || task.CompletedAt == "" {
				t.Fatalf("expected completed task-srs, got %+v", task)
			}
			return
		}
	}
	t.Fatal("task-srs missing from plan")
}

func TestLogoutRevokesExistingToken(t *testing.T) {
	r, _, _ := setupTestRouter()
	regBody, _ := json.Marshal(models.RegisterRequest{
		Email: "revoke@det-academy.com", Password: "strongPassword123!", Name: "Revoke", Locale: "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	var regResp models.AuthResponse
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)

	meReq := httptest.NewRequest("GET", "/api/v1/auth/me", nil)
	meReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	meW := httptest.NewRecorder()
	r.ServeHTTP(meW, meReq)
	if meW.Code != http.StatusOK {
		t.Fatalf("expected token to work before logout, got %d", meW.Code)
	}

	logoutReq := httptest.NewRequest("POST", "/api/v1/auth/logout", nil)
	logoutReq.Header.Set("Authorization", "Bearer "+regResp.Token)
	logoutW := httptest.NewRecorder()
	r.ServeHTTP(logoutW, logoutReq)
	if logoutW.Code != http.StatusOK {
		t.Fatalf("expected logout 200, got %d", logoutW.Code)
	}

	meAgain := httptest.NewRequest("GET", "/api/v1/auth/me", nil)
	meAgain.Header.Set("Authorization", "Bearer "+regResp.Token)
	meAgainW := httptest.NewRecorder()
	r.ServeHTTP(meAgainW, meAgain)
	if meAgainW.Code != http.StatusUnauthorized {
		t.Fatalf("expected revoked token to be rejected, got %d", meAgainW.Code)
	}
}

func TestRefreshTokenRotation(t *testing.T) {
	r, _, _ := setupTestRouter()
	regBody, _ := json.Marshal(models.RegisterRequest{
		Email: "refresh@det-academy.com", Password: "strongPassword123!", Name: "Refresh", Locale: "ru",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("register: %d %s", regW.Code, regW.Body.String())
	}
	var refreshCookie *http.Cookie
	for _, cookie := range regW.Result().Cookies() {
		if cookie.Name == "det_refresh" {
			refreshCookie = cookie
		}
	}
	if refreshCookie == nil || refreshCookie.Value == "" {
		t.Fatal("expected det_refresh cookie")
	}

	refreshReq := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	refreshReq.AddCookie(refreshCookie)
	refreshW := httptest.NewRecorder()
	r.ServeHTTP(refreshW, refreshReq)
	if refreshW.Code != http.StatusOK {
		t.Fatalf("refresh: %d %s", refreshW.Code, refreshW.Body.String())
	}
	var refreshed models.AuthResponse
	_ = json.Unmarshal(refreshW.Body.Bytes(), &refreshed)
	if refreshed.Token == "" {
		t.Fatal("expected new access token")
	}

	replayReq := httptest.NewRequest("POST", "/api/v1/auth/refresh", nil)
	replayReq.AddCookie(refreshCookie)
	replayW := httptest.NewRecorder()
	r.ServeHTTP(replayW, replayReq)
	if replayW.Code != http.StatusUnauthorized {
		t.Fatalf("expected refresh replay to fail, got %d", replayW.Code)
	}
}

func TestInstitutionsCatalog(t *testing.T) {
	r, _, _ := setupTestRouter()

	// 1. List all institutions
	req := httptest.NewRequest("GET", "/api/v1/institutions", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 for institutions, got %d", w.Code)
	}

	var res struct {
		Institutions []models.Institution `json:"institutions"`
		Total        int                  `json:"total"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &res)

	if res.Total < 10 {
		t.Fatalf("expected at least 10 institutions, got %d", res.Total)
	}

	// 2. Filter by search query
	searchReq := httptest.NewRequest("GET", "/api/v1/institutions?search=Harvard", nil)
	searchW := httptest.NewRecorder()
	r.ServeHTTP(searchW, searchReq)

	var searchRes struct {
		Institutions []models.Institution `json:"institutions"`
		Total        int                  `json:"total"`
	}
	_ = json.Unmarshal(searchW.Body.Bytes(), &searchRes)

	if searchRes.Total == 0 || searchRes.Institutions[0].Name != "Harvard University" {
		t.Fatalf("expected to find Harvard University, got %v", searchRes)
	}

	// 3. Filter by country
	ukReq := httptest.NewRequest("GET", "/api/v1/institutions?country=United%20Kingdom", nil)
	ukW := httptest.NewRecorder()
	r.ServeHTTP(ukW, ukReq)

	var ukRes struct {
		Institutions []models.Institution `json:"institutions"`
		Total        int                  `json:"total"`
	}
	_ = json.Unmarshal(ukW.Body.Bytes(), &ukRes)

	if ukRes.Total == 0 {
		t.Fatal("expected UK institutions")
	}
}

func TestAdminCRM(t *testing.T) {
	r, _, _ := setupTestRouter()

	// 1. Login as admin
	loginPayload := models.LoginRequest{
		Email:    "admin@det-academy.com",
		Password: "admin123",
	}
	loginBody, _ := json.Marshal(loginPayload)
	loginReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	var loginResp models.AuthResponse
	_ = json.Unmarshal(loginW.Body.Bytes(), &loginResp)
	adminToken := loginResp.Token

	// 2. Non-admin student accessing admin should be 403 Forbidden
	studentLogin := models.LoginRequest{
		Email:    "student@det-academy.com",
		Password: "password123",
	}
	sBody, _ := json.Marshal(studentLogin)
	sReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(sBody))
	sW := httptest.NewRecorder()
	r.ServeHTTP(sW, sReq)
	var studentResp models.AuthResponse
	_ = json.Unmarshal(sW.Body.Bytes(), &studentResp)

	forbReq := httptest.NewRequest("GET", "/api/v1/admin/stats", nil)
	forbReq.Header.Set("Authorization", "Bearer "+studentResp.Token)
	forbW := httptest.NewRecorder()
	r.ServeHTTP(forbW, forbReq)

	if forbW.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for student in admin, got %d", forbW.Code)
	}

	// 3. Admin accessing stats
	statsReq := httptest.NewRequest("GET", "/api/v1/admin/stats", nil)
	statsReq.Header.Set("Authorization", "Bearer "+adminToken)
	statsW := httptest.NewRecorder()
	r.ServeHTTP(statsW, statsReq)

	if statsW.Code != http.StatusOK {
		t.Fatalf("expected 200 on admin stats, got %d: %s", statsW.Code, statsW.Body.String())
	}

	var stats models.AdminStats
	_ = json.Unmarshal(statsW.Body.Bytes(), &stats)
	if stats.TotalUsers == 0 {
		t.Fatal("expected total users > 0")
	}

	// 4. Admin listing users
	usersReq := httptest.NewRequest("GET", "/api/v1/admin/users", nil)
	usersReq.Header.Set("Authorization", "Bearer "+adminToken)
	usersW := httptest.NewRecorder()
	r.ServeHTTP(usersW, usersReq)

	if usersW.Code != http.StatusOK {
		t.Fatalf("expected 200 on admin users list, got %d", usersW.Code)
	}

	// 5. Admin updating user role
	rolePayload := models.UpdateUserRoleRequest{Role: "editor"}
	roleBody, _ := json.Marshal(rolePayload)
	roleReq := httptest.NewRequest("PATCH", "/api/v1/admin/users/00000000-0000-0000-0000-000000000002/role", bytes.NewReader(roleBody))
	roleReq.Header.Set("Authorization", "Bearer "+adminToken)
	roleW := httptest.NewRecorder()
	r.ServeHTTP(roleW, roleReq)

	if roleW.Code != http.StatusOK {
		t.Fatalf("expected 200 on update user role, got %d: %s", roleW.Code, roleW.Body.String())
	}
}

func TestOAuthSecurityEnforcement(t *testing.T) {
	r, _, _ := setupTestRouter()

	// P0-01: Attempting OAuth login with arbitrary email without code/token must be rejected
	spoofPayload := models.OAuthLoginRequest{
		Provider: "google",
		Email:    "student@det-academy.com", // targeted victim email
	}
	body, _ := json.Marshal(spoofPayload)
	req := httptest.NewRequest("POST", "/api/v1/auth/oauth", bytes.NewReader(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest && w.Code != http.StatusUnauthorized {
		t.Fatalf("security violation: expected 400 or 401 when attempting OAuth login without valid code/token, got %d", w.Code)
	}

	// Attempting OAuth login with fake/unverified code for google
	fakeTokenPayload := models.OAuthLoginRequest{
		Provider: "google",
		Code:     "fake_unverified_token_12345",
	}
	bodyFake, _ := json.Marshal(fakeTokenPayload)
	reqFake := httptest.NewRequest("POST", "/api/v1/auth/oauth", bytes.NewReader(bodyFake))
	wFake := httptest.NewRecorder()
	r.ServeHTTP(wFake, reqFake)

	if wFake.Code != http.StatusBadRequest && wFake.Code != http.StatusUnauthorized {
		t.Fatalf("expected failure for unverified google token, got %d", wFake.Code)
	}
}

func TestSocialAccountLinkConflictProtection(t *testing.T) {
	_, authService, store := setupTestRouter()
	ctx := context.Background()

	// User 1
	u1 := &models.User{
		ID:        "user-1-uuid",
		Email:     "user1@det-academy.com",
		Name:      "User 1",
		Role:      "student",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	_ = store.Users().Create(ctx, u1)

	// User 2
	u2 := &models.User{
		ID:        "user-2-uuid",
		Email:     "user2@det-academy.com",
		Name:      "User 2",
		Role:      "student",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	_ = store.Users().Create(ctx, u2)

	// Link VK ID to User 1
	sa := &models.SocialAccount{
		ID:             "sa-1",
		UserID:         u1.ID,
		Provider:       "vk",
		ProviderUserID: "vk_user_12345",
		Email:          u1.Email,
		CreatedAt:      time.Now(),
	}
	_ = store.Users().LinkSocialAccount(ctx, sa)

	// User 2 attempts to link the same external VK account - must be rejected (cannot steal identity)
	err := authService.LinkSocialAccount(ctx, u2.ID, models.LinkProviderRequest{
		Provider: "vk",
		Code:     "",
	})
	if err == nil {
		t.Fatal("security violation: expected error when linking without code/token")
	}

	// Verify User 1's link is still intact
	linked, err := store.Users().GetSocialAccounts(ctx, u1.ID)
	if err != nil || len(linked) == 0 {
		t.Fatal("expected User 1's social account to remain linked")
	}
	if linked[0].ProviderUserID != "vk_user_12345" {
		t.Fatalf("expected provider user ID to remain vk_user_12345, got %s", linked[0].ProviderUserID)
	}
}

func TestExamBlueprintAndStageTransitions(t *testing.T) {
	// 1. Verify default exam blueprint conforms to the official 13-stage DET structure
	bp := models.GetDefaultExamBlueprint()
	if bp.TotalStages != 13 || len(bp.Stages) != 13 {
		t.Fatalf("expected 13 blueprint stages, got %d", bp.TotalStages)
	}

	expectedStages := []string{
		"READ_SELECT",
		"FILL_BLANKS",
		"C_TEST",
		"LISTEN_TYPE",
		"INTERACTIVE_READING",
		"INTERACTIVE_LISTENING",
		"WRITE_PHOTO",
		"INTERACTIVE_WRITING",
		"SPEAK_PHOTO",
		"READ_THEN_SPEAK",
		"INTERACTIVE_SPEAKING",
		"WRITING_SAMPLE",
		"SPEAKING_SAMPLE",
	}

	for i, expected := range expectedStages {
		if bp.Stages[i].StageName != expected {
			t.Fatalf("stage %d mismatch: expected %s, got %s", i+1, expected, bp.Stages[i].StageName)
		}
		if bp.Stages[i].TimeLimitSec <= 0 {
			t.Fatalf("stage %s has invalid time limit: %d", bp.Stages[i].StageName, bp.Stages[i].TimeLimitSec)
		}
	}

	// 2. Start a test session and verify stage advancement through multiple stages with IRT adaptation
	r, _, _ := setupTestRouter()

	loginPayload := models.LoginRequest{
		Email:    "student@det-academy.com",
		Password: "password123",
	}
	loginBody, _ := json.Marshal(loginPayload)
	loginReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	var loginResp models.AuthResponse
	_ = json.Unmarshal(loginW.Body.Bytes(), &loginResp)
	token := loginResp.Token

	startReq := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader([]byte(`{"candidateName":"Adaptive Candidate","difficultyLevel":"B1"}`)))
	startReq.Header.Set("Authorization", "Bearer "+token)
	startW := httptest.NewRecorder()
	r.ServeHTTP(startW, startReq)

	if startW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on start, got %d: %s", startW.Code, startW.Body.String())
	}

	var startRes struct {
		Session   models.TestSession `json:"session"`
		Questions []models.Question  `json:"questions"`
	}
	_ = json.Unmarshal(startW.Body.Bytes(), &startRes)
	sessionID := startRes.Session.ID

	if startRes.Session.StageName != "READ_SELECT" {
		t.Fatalf("expected stage READ_SELECT, got %s", startRes.Session.StageName)
	}
	if startRes.Session.DeadlineAt == nil {
		t.Fatal("expected non-nil deadlineAt on started session")
	}

	// 3. Verify GET session returns details with active questions and blueprint
	getReq := httptest.NewRequest("GET", "/api/v1/test/sessions/"+sessionID, nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getW := httptest.NewRecorder()
	r.ServeHTTP(getW, getReq)

	if getW.Code != http.StatusOK {
		t.Fatalf("expected 200 on get session, got %d", getW.Code)
	}

	var getRes struct {
		Session   models.TestSession   `json:"session"`
		Questions []models.Question    `json:"questions"`
		Blueprint models.ExamBlueprint `json:"blueprint"`
	}
	_ = json.Unmarshal(getW.Body.Bytes(), &getRes)

	if getRes.Blueprint.TotalStages != 13 {
		t.Fatalf("expected 13 stages in blueprint, got %d", getRes.Blueprint.TotalStages)
	}
	if len(getRes.Questions) == 0 {
		t.Fatal("expected sanitized questions in get session response")
	}

	// 4. Advance through stages and verify stage progression
	for stageIdx := 1; stageIdx <= 3; stageIdx++ {
		stagePayload := models.StageCompleteRequest{
			StageName:        expectedStages[stageIdx-1],
			Accuracy:         0.9,
			TotalQuestions:   5,
			CorrectQuestions: 5,
		}
		stageBody, _ := json.Marshal(stagePayload)
		stageReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/stage-complete", bytes.NewReader(stageBody))
		stageReq.Header.Set("Authorization", "Bearer "+token)
		stageW := httptest.NewRecorder()
		r.ServeHTTP(stageW, stageReq)

		if stageW.Code != http.StatusOK {
			t.Fatalf("expected 200 on stage complete for stage %d, got %d: %s", stageIdx, stageW.Code, stageW.Body.String())
		}

		var stageRes struct {
			Session   models.TestSession `json:"session"`
			Questions []models.Question  `json:"nextQuestions"`
		}
		_ = json.Unmarshal(stageW.Body.Bytes(), &stageRes)

		expectedNextStage := expectedStages[stageIdx]
		if stageRes.Session.StageName != expectedNextStage {
			t.Fatalf("expected next stage %s, got %s", expectedNextStage, stageRes.Session.StageName)
		}
		if stageRes.Session.CurrentStage != stageIdx+1 {
			t.Fatalf("expected current stage %d, got %d", stageIdx+1, stageRes.Session.CurrentStage)
		}
		if stageRes.Session.DeadlineAt == nil {
			t.Fatalf("expected deadlineAt to be updated for stage %s", expectedNextStage)
		}
	}
}

func TestSpeakingAudioUploadAndEvaluation(t *testing.T) {
	r, _, _ := setupTestRouter()

	// 1. Login student 1
	loginPayload := models.LoginRequest{
		Email:    "student@det-academy.com",
		Password: "password123",
	}
	loginBody, _ := json.Marshal(loginPayload)
	loginReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	var loginResp models.AuthResponse
	_ = json.Unmarshal(loginW.Body.Bytes(), &loginResp)
	token1 := loginResp.Token

	// 2. Start session for student 1
	startReq := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader([]byte(`{"candidateName":"Speaking Candidate","difficultyLevel":"B2"}`)))
	startReq.Header.Set("Authorization", "Bearer "+token1)
	startW := httptest.NewRecorder()
	r.ServeHTTP(startW, startReq)

	var startRes struct {
		Session models.TestSession `json:"session"`
	}
	_ = json.Unmarshal(startW.Body.Bytes(), &startRes)
	sessionID := startRes.Session.ID

	// Audio is only valid for an assigned speaking question in the current
	// stage. Advance the attempt through the non-speaking stages first.
	for _, stage := range service.StageSequence {
		details := readIntegritySession(t, r, token1, sessionID)
		if details["stageName"] == "SPEAK_PHOTO" {
			break
		}
		if details["stageName"] != stage {
			t.Fatalf("expected stage %s, got %v", stage, details["stageName"])
		}
		completeCurrentStage(t, r, token1, sessionID, stage)
	}
	speakingQuestionIDs := getCurrentQuestionIDs(t, r, token1, sessionID)
	if len(speakingQuestionIDs) == 0 {
		t.Fatal("expected assigned SPEAK_PHOTO question")
	}
	speakingQuestionID := speakingQuestionIDs[0]

	// 3. Upload multipart audio
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("audio", "speech_sample.webm")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	// Simulate recorded webm bytes
	audioData := []byte("FAKE_WEBM_AUDIO_DATA_FOR_SPEAKING_TEST_1234567890")
	_, _ = part.Write(audioData)

	_ = writer.WriteField("questionId", speakingQuestionID)
	_ = writer.WriteField("transcript", "The photograph depicts a group of engineering students collaborating inside a modern technical laboratory. In the foreground, two researchers appear to be analyzing experimental data on high resolution monitors, demonstrating remarkable teamwork. Furthermore, the academic environment is equipped with sophisticated technological infrastructure. On the other hand, the individuals in the background are discussing project blueprints, illustrating a productive educational atmosphere.")
	_ = writer.WriteField("durationSec", "45.0")
	_ = writer.Close()

	uploadReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/audio", body)
	uploadReq.Header.Set("Content-Type", writer.FormDataContentType())
	uploadReq.Header.Set("Authorization", "Bearer "+token1)
	uploadW := httptest.NewRecorder()
	r.ServeHTTP(uploadW, uploadReq)

	if uploadW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on audio upload, got %d: %s", uploadW.Code, uploadW.Body.String())
	}

	var uploadRes struct {
		Asset      models.MediaAsset       `json:"asset"`
		URL        string                  `json:"url"`
		Evaluation models.EvaluationResult `json:"evaluation"`
	}
	_ = json.Unmarshal(uploadW.Body.Bytes(), &uploadRes)

	if uploadRes.URL == "" || !strings.HasPrefix(uploadRes.URL, "/api/v1/media/audio/") {
		t.Fatalf("expected audio url starting with /api/v1/media/audio/, got %s", uploadRes.URL)
	}
	if uploadRes.Evaluation.Score < 0.6 {
		t.Fatalf("expected high score for descriptive spoken response, got %f", uploadRes.Evaluation.Score)
	}
	if uploadRes.Evaluation.CEFRLevel == "" || uploadRes.Evaluation.CEFRLevel == "Pre-A1" {
		t.Fatalf("expected valid CEFR level, got %s", uploadRes.Evaluation.CEFRLevel)
	}
	if uploadRes.Evaluation.SpeakingDuration != 45.0 {
		t.Fatalf("expected duration 45.0, got %f", uploadRes.Evaluation.SpeakingDuration)
	}

	// 4. Verify audio file retrieval via GET /api/v1/media/audio/{filename}
	audioPath := uploadRes.URL
	unauthAudioReq := httptest.NewRequest("GET", audioPath, nil)
	unauthAudioW := httptest.NewRecorder()
	r.ServeHTTP(unauthAudioW, unauthAudioReq)
	if unauthAudioW.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated audio access, got %d", unauthAudioW.Code)
	}

	getAudioReq := httptest.NewRequest("GET", audioPath, nil)
	getAudioReq.Header.Set("Authorization", "Bearer "+token1)
	getAudioW := httptest.NewRecorder()
	r.ServeHTTP(getAudioW, getAudioReq)

	if getAudioW.Code != http.StatusOK {
		t.Fatalf("expected 200 on owner audio access, got %d", getAudioW.Code)
	}
	if getAudioW.Header().Get("Accept-Ranges") != "bytes" {
		t.Fatalf("expected Accept-Ranges: bytes header, got %s", getAudioW.Header().Get("Accept-Ranges"))
	}
	if !bytes.Equal(getAudioW.Body.Bytes(), audioData) {
		t.Fatalf("audio bytes mismatch")
	}

	// 5. Verify GET evaluations for session
	getEvalsReq := httptest.NewRequest("GET", "/api/v1/test/sessions/"+sessionID+"/evaluations", nil)
	getEvalsReq.Header.Set("Authorization", "Bearer "+token1)
	getEvalsW := httptest.NewRecorder()
	r.ServeHTTP(getEvalsW, getEvalsReq)

	if getEvalsW.Code != http.StatusOK {
		t.Fatalf("expected 200 on get evaluations, got %d: %s", getEvalsW.Code, getEvalsW.Body.String())
	}

	var evalsRes struct {
		Evaluations []models.EvaluationResult `json:"evaluations"`
	}
	_ = json.Unmarshal(getEvalsW.Body.Bytes(), &evalsRes)

	if len(evalsRes.Evaluations) != 1 {
		t.Fatalf("expected 1 evaluation, got %d", len(evalsRes.Evaluations))
	}
	if evalsRes.Evaluations[0].QuestionID != speakingQuestionID {
		t.Fatalf("expected questionId %s, got %s", speakingQuestionID, evalsRes.Evaluations[0].QuestionID)
	}

	// 6. Security Check: Admin / User 2 attempts to upload audio to User 1's session -> must be rejected
	loginAdminPayload := models.LoginRequest{
		Email:    "admin@det-academy.com",
		Password: "admin123",
	}
	loginAdminBody, _ := json.Marshal(loginAdminPayload)
	adminLoginReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(loginAdminBody))
	adminLoginW := httptest.NewRecorder()
	r.ServeHTTP(adminLoginW, adminLoginReq)

	var adminLoginResp models.AuthResponse
	_ = json.Unmarshal(adminLoginW.Body.Bytes(), &adminLoginResp)
	tokenAdmin := adminLoginResp.Token

	secBody := &bytes.Buffer{}
	secWriter := multipart.NewWriter(secBody)
	secPart, _ := secWriter.CreateFormFile("audio", "hack.webm")
	_, _ = secPart.Write([]byte("malicious"))
	_ = secWriter.Close()

	secReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/audio", secBody)
	secReq.Header.Set("Content-Type", secWriter.FormDataContentType())
	secReq.Header.Set("Authorization", "Bearer "+tokenAdmin)
	secW := httptest.NewRecorder()
	r.ServeHTTP(secW, secReq)

	if secW.Code != http.StatusBadRequest && secW.Code != http.StatusForbidden {
		t.Fatalf("expected 400 or 403 on cross-user audio upload, got %d", secW.Code)
	}
}

func TestStudyPlanAndSRSEngine(t *testing.T) {
	r, _, _ := setupTestRouter()

	// 1. Register User A
	userA := models.RegisterRequest{
		Email:    "student_a@det-academy.com",
		Password: "password123",
		Name:     "Student A",
	}
	bodyA, _ := json.Marshal(userA)
	reqA := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(bodyA))
	wA := httptest.NewRecorder()
	r.ServeHTTP(wA, reqA)
	if wA.Code != http.StatusCreated {
		t.Fatalf("expected 201 on user A register, got %d", wA.Code)
	}
	var respA models.AuthResponse
	_ = json.Unmarshal(wA.Body.Bytes(), &respA)
	tokenA := respA.Token

	// 2. Register User B
	userB := models.RegisterRequest{
		Email:    "student_b@det-academy.com",
		Password: "password123",
		Name:     "Student B",
	}
	bodyB, _ := json.Marshal(userB)
	reqB := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(bodyB))
	wB := httptest.NewRecorder()
	r.ServeHTTP(wB, reqB)
	if wB.Code != http.StatusCreated {
		t.Fatalf("expected 201 on user B register, got %d", wB.Code)
	}
	var respB models.AuthResponse
	_ = json.Unmarshal(wB.Body.Bytes(), &respB)
	tokenB := respB.Token

	// 3. Test Isolation: User A sets goals, User B checks goals
	updateGoalReq := models.UpdateGoalsRequest{
		TargetScore:        135,
		TargetDate:         "2026-12-15",
		DailyMinutes:       60,
		TargetUniversityID: "stanford",
	}
	goalBody, _ := json.Marshal(updateGoalReq)
	putGoalReq := httptest.NewRequest("PUT", "/api/v1/user/goals", bytes.NewReader(goalBody))
	putGoalReq.Header.Set("Authorization", "Bearer "+tokenA)
	putGoalW := httptest.NewRecorder()
	r.ServeHTTP(putGoalW, putGoalReq)
	if putGoalW.Code != http.StatusOK {
		t.Fatalf("expected 200 on put goals, got %d: %s", putGoalW.Code, putGoalW.Body.String())
	}

	// User B gets goals: should receive default goals, NOT User A's goals!
	getGoalBReq := httptest.NewRequest("GET", "/api/v1/user/goals", nil)
	getGoalBReq.Header.Set("Authorization", "Bearer "+tokenB)
	getGoalBW := httptest.NewRecorder()
	r.ServeHTTP(getGoalBW, getGoalBReq)
	if getGoalBW.Code != http.StatusOK {
		t.Fatalf("expected 200 on get goals for user B, got %d", getGoalBW.Code)
	}
	var goalB models.UserGoal
	_ = json.Unmarshal(getGoalBW.Body.Bytes(), &goalB)
	if goalB.TargetScore != 125 || goalB.DailyMinutes != 45 {
		t.Fatalf("expected default goals for user B, got targetScore=%d, dailyMinutes=%d", goalB.TargetScore, goalB.DailyMinutes)
	}

	// 4. Test Study Plan for User A
	getPlanReq := httptest.NewRequest("GET", "/api/v1/user/plan", nil)
	getPlanReq.Header.Set("Authorization", "Bearer "+tokenA)
	getPlanW := httptest.NewRecorder()
	r.ServeHTTP(getPlanW, getPlanReq)
	if getPlanW.Code != http.StatusOK {
		t.Fatalf("expected 200 on get plan, got %d: %s", getPlanW.Code, getPlanW.Body.String())
	}
	var plan models.StudyPlanResponse
	_ = json.Unmarshal(getPlanW.Body.Bytes(), &plan)
	if plan.TargetScore != 135 || plan.DailyMinutes != 60 {
		t.Fatalf("expected plan targetScore 135 and dailyMinutes 60, got %d, %d", plan.TargetScore, plan.DailyMinutes)
	}
	if len(plan.TasksToday) < 3 {
		t.Fatalf("expected at least 3 daily tasks in study plan, got %d", len(plan.TasksToday))
	}

	// 5. Test Error Notebook with 2-Recall Cycle
	addErrReq := models.SaveErrorRequest{
		QuestionType:  "c-test",
		Prompt:        "Metropolitan planners are prioriti___ sustainable elect___ transit",
		UserAnswer:    "prioritiz",
		CorrectAnswer: "prioritizing",
		Explanation:   "Present continuous participle required after 'are'",
	}
	addErrBody, _ := json.Marshal(addErrReq)
	postErrReq := httptest.NewRequest("POST", "/api/v1/user/errors", bytes.NewReader(addErrBody))
	postErrReq.Header.Set("Authorization", "Bearer "+tokenA)
	postErrW := httptest.NewRecorder()
	r.ServeHTTP(postErrW, postErrReq)
	if postErrW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on save error, got %d: %s", postErrW.Code, postErrW.Body.String())
	}
	var createdErr models.UserErrorItem
	_ = json.Unmarshal(postErrW.Body.Bytes(), &createdErr)
	if createdErr.ID == "" || createdErr.Mastered || createdErr.ConsecutiveSuccesses != 0 {
		t.Fatalf("invalid initial error item state: %+v", createdErr)
	}

	// Verify User B cannot see User A's errors
	getErrBReq := httptest.NewRequest("GET", "/api/v1/user/errors", nil)
	getErrBReq.Header.Set("Authorization", "Bearer "+tokenB)
	getErrBW := httptest.NewRecorder()
	r.ServeHTTP(getErrBW, getErrBReq)
	var listB struct {
		Errors []models.UserErrorItem `json:"errors"`
		Total  int                    `json:"total"`
	}
	_ = json.Unmarshal(getErrBW.Body.Bytes(), &listB)
	if listB.Total != 0 {
		t.Fatalf("expected 0 errors for user B, got %d", listB.Total)
	}

	// User A attempts recall with WRONG answer
	recallWrongReq := models.RecallErrorRequest{Answer: "wrong_answer"}
	recallWrongBody, _ := json.Marshal(recallWrongReq)
	pWrongReq := httptest.NewRequest("POST", "/api/v1/user/errors/"+createdErr.ID+"/recall", bytes.NewReader(recallWrongBody))
	pWrongReq.Header.Set("Authorization", "Bearer "+tokenA)
	pWrongW := httptest.NewRecorder()
	r.ServeHTTP(pWrongW, pWrongReq)
	var recallWrongResp models.RecallErrorResponse
	_ = json.Unmarshal(pWrongW.Body.Bytes(), &recallWrongResp)
	if recallWrongResp.Success || recallWrongResp.Mastered || recallWrongResp.ConsecutiveSuccesses != 0 {
		t.Fatalf("expected failed recall on wrong answer, got %+v", recallWrongResp)
	}

	// User A attempts recall with CORRECT answer 1st time (1/2)
	recall1Req := models.RecallErrorRequest{Answer: "prioritizing"}
	recall1Body, _ := json.Marshal(recall1Req)
	p1Req := httptest.NewRequest("POST", "/api/v1/user/errors/"+createdErr.ID+"/recall", bytes.NewReader(recall1Body))
	p1Req.Header.Set("Authorization", "Bearer "+tokenA)
	p1W := httptest.NewRecorder()
	r.ServeHTTP(p1W, p1Req)
	var recall1Resp models.RecallErrorResponse
	_ = json.Unmarshal(p1W.Body.Bytes(), &recall1Resp)
	if !recall1Resp.Success || recall1Resp.Mastered || recall1Resp.ConsecutiveSuccesses != 1 {
		t.Fatalf("expected 1st consecutive success without mastered, got %+v", recall1Resp)
	}

	// User A attempts recall with CORRECT answer 2nd time (2/2) -> now MASTERED!
	p2Req := httptest.NewRequest("POST", "/api/v1/user/errors/"+createdErr.ID+"/recall", bytes.NewReader(recall1Body))
	p2Req.Header.Set("Authorization", "Bearer "+tokenA)
	p2W := httptest.NewRecorder()
	r.ServeHTTP(p2W, p2Req)
	var recall2Resp models.RecallErrorResponse
	_ = json.Unmarshal(p2W.Body.Bytes(), &recall2Resp)
	if !recall2Resp.Success || !recall2Resp.Mastered || recall2Resp.ConsecutiveSuccesses != 2 {
		t.Fatalf("expected mastered item after 2 consecutive successes, got %+v", recall2Resp)
	}

	// 6. Test SuperMemo SM-2 Spaced Repetition (SRS)
	reviewCardReq := models.ReviewSRSCardRequest{
		CardID:  "awl-001",
		Quality: 4, // Good
	}
	reviewBody, _ := json.Marshal(reviewCardReq)
	revReq := httptest.NewRequest("POST", "/api/v1/user/srs/review", bytes.NewReader(reviewBody))
	revReq.Header.Set("Authorization", "Bearer "+tokenA)
	revW := httptest.NewRecorder()
	r.ServeHTTP(revW, revReq)
	if revW.Code != http.StatusOK {
		t.Fatalf("expected 200 on SRS review, got %d: %s", revW.Code, revW.Body.String())
	}
	var revResp models.ReviewSRSCardResponse
	_ = json.Unmarshal(revW.Body.Bytes(), &revResp)
	if revResp.IntervalDays != 1 || revResp.Repetitions != 1 || revResp.StreakDays != 1 || revResp.TotalReviewed != 1 {
		t.Fatalf("unexpected SRS review 1 result: %+v", revResp)
	}

	// Review 2nd time with Good (Quality 4) -> interval should become 6
	revReq2 := httptest.NewRequest("POST", "/api/v1/user/srs/review", bytes.NewReader(reviewBody))
	revReq2.Header.Set("Authorization", "Bearer "+tokenA)
	revW2 := httptest.NewRecorder()
	r.ServeHTTP(revW2, revReq2)
	var revResp2 models.ReviewSRSCardResponse
	_ = json.Unmarshal(revW2.Body.Bytes(), &revResp2)
	if revResp2.IntervalDays != 6 || revResp2.Repetitions != 2 || revResp2.TotalReviewed != 2 {
		t.Fatalf("unexpected SRS review 2 result: %+v", revResp2)
	}

	// User B checks SRS: should be empty / 0 reviews
	srsBReq := httptest.NewRequest("GET", "/api/v1/user/srs", nil)
	srsBReq.Header.Set("Authorization", "Bearer "+tokenB)
	srsBW := httptest.NewRecorder()
	r.ServeHTTP(srsBW, srsBReq)
	var srsB models.SRSStateResponse
	_ = json.Unmarshal(srsBW.Body.Bytes(), &srsB)
	if srsB.Stats.TotalReviewed != 0 || srsB.Stats.StreakDays != 0 || len(srsB.Cards) != 0 {
		t.Fatalf("user B SRS progress must be clean and isolated, got %+v", srsB)
	}

	// 7. Test Skill Analytics: User with no completed test has hasData = false
	analyticsReq := httptest.NewRequest("GET", "/api/v1/user/analytics/skills", nil)
	analyticsReq.Header.Set("Authorization", "Bearer "+tokenA)
	analyticsW := httptest.NewRecorder()
	r.ServeHTTP(analyticsW, analyticsReq)
	if analyticsW.Code != http.StatusOK {
		t.Fatalf("expected 200 on skill analytics, got %d", analyticsW.Code)
	}
	var analyticsResp models.SkillAnalyticsResponse
	_ = json.Unmarshal(analyticsW.Body.Bytes(), &analyticsResp)
	if analyticsResp.HasData {
		t.Fatalf("expected hasData=false before any test is taken, got true")
	}
}

func TestCompletePlatformEndToEndJourney(t *testing.T) {
	r, authSvc, store := setupTestRouter()
	_ = authSvc

	// 1. Register student
	regBody, _ := json.Marshal(map[string]string{
		"email":    "student_e2e@det-academy.com",
		"password": "Password123!",
		"name":     "Elena Rostova",
	})
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on registration, got %d: %s", regW.Code, regW.Body.String())
	}
	var regResp map[string]interface{}
	_ = json.Unmarshal(regW.Body.Bytes(), &regResp)
	token := regResp["token"].(string)
	userMap := regResp["user"].(map[string]interface{})
	userID := userMap["id"].(string)

	// Complete theory curriculum for the candidate to meet DET Academy certification eligibility
	for _, slug := range service.LessonSlugs {
		_ = store.Theory().SetProgress(context.Background(), userID, slug, true)
	}

	// 2. Set Goals (Target 130, date 2026-11-15, 60 minutes)
	goalsBody, _ := json.Marshal(models.UpdateGoalsRequest{
		TargetScore:        130,
		TargetDate:         "2026-11-15",
		DailyMinutes:       60,
		TargetUniversityID: "inst-harvard",
	})
	goalsReq := httptest.NewRequest("PUT", "/api/v1/user/goals", bytes.NewReader(goalsBody))
	goalsReq.Header.Set("Authorization", "Bearer "+token)
	goalsReq.Header.Set("Content-Type", "application/json")
	goalsW := httptest.NewRecorder()
	r.ServeHTTP(goalsW, goalsReq)
	if goalsW.Code != http.StatusOK {
		t.Fatalf("expected 200 on goals update, got %d", goalsW.Code)
	}

	// 3. Verify Personalized Study Plan
	planReq := httptest.NewRequest("GET", "/api/v1/user/plan", nil)
	planReq.Header.Set("Authorization", "Bearer "+token)
	planW := httptest.NewRecorder()
	r.ServeHTTP(planW, planReq)
	if planW.Code != http.StatusOK {
		t.Fatalf("expected 200 on study plan, got %d", planW.Code)
	}
	var plan models.StudyPlanResponse
	_ = json.Unmarshal(planW.Body.Bytes(), &plan)
	if plan.TargetScore != 130 || plan.DailyMinutes != 60 || len(plan.TasksToday) == 0 {
		t.Fatalf("unexpected study plan: %+v", plan)
	}

	// 4. Start Exam Session with 13-stage blueprint
	startBody, _ := json.Marshal(map[string]string{
		"candidateName":   "Elena Rostova",
		"difficultyLevel": "B2",
	})
	startReq := httptest.NewRequest("POST", "/api/v1/test/sessions", bytes.NewReader(startBody))
	startReq.Header.Set("Authorization", "Bearer "+token)
	startReq.Header.Set("Content-Type", "application/json")
	startW := httptest.NewRecorder()
	r.ServeHTTP(startW, startReq)
	if startW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on test start, got %d: %s", startW.Code, startW.Body.String())
	}
	var startResp map[string]interface{}
	_ = json.Unmarshal(startW.Body.Bytes(), &startResp)
	sessionMap := startResp["session"].(map[string]interface{})
	sessionID := sessionMap["id"].(string)

	// Questions delivered to student must be sanitized (no correct answers exposed)
	questionsSlice := startResp["questions"].([]interface{})
	if len(questionsSlice) == 0 {
		t.Fatalf("expected questions in test start response")
	}
	firstQ := questionsSlice[0].(map[string]interface{})
	if _, hasCorrect := firstQ["correctAnswers"]; hasCorrect {
		t.Fatalf("CRITICAL SECURITY: correctAnswers leaked in student question payload: %+v", firstQ)
	}

	// 5. Submit responses and advance through all 13 stages to simulate a realistic full test
	stages := service.StageSequence
	for i, stage := range stages {
		stageNum := i + 1
		ids := getCurrentQuestionIDs(t, r, token, sessionID)
		if len(ids) == 0 {
			t.Fatalf("no assigned questions for stage %s", stage)
		}
		_, answerPayload := stageAnswer(stage)
		submitTestAnswer(t, r, token, sessionID, ids[0], answerPayload)
		completeCurrentStage(t, r, token, sessionID, stage)
		_ = stageNum
	}

	// 6. Complete Session
	compReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/complete", bytes.NewReader([]byte("{}")))
	compReq.Header.Set("Authorization", "Bearer "+token)
	compReq.Header.Set("Content-Type", "application/json")
	compW := httptest.NewRecorder()
	r.ServeHTTP(compW, compReq)
	if compW.Code != http.StatusOK {
		t.Fatalf("expected 200 on complete session, got %d: %s", compW.Code, compW.Body.String())
	}
	var compResp map[string]interface{}
	_ = json.Unmarshal(compW.Body.Bytes(), &compResp)
	finalSession := compResp["session"].(map[string]interface{})
	if finalSession["status"] != "COMPLETED" {
		t.Fatalf("expected COMPLETED status, got %v", finalSession["status"])
	}
	overallScore := int(finalSession["overallScore"].(float64))
	if overallScore <= 0 || overallScore > 160 {
		t.Fatalf("invalid overall score: %d", overallScore)
	}

	// 7. Verify Certificate Security
	certMap, hasCert := compResp["certificate"].(map[string]interface{})
	if !hasCert || certMap == nil {
		t.Fatalf("expected certificate to be issued upon exam completion")
	}
	certID := certMap["id"].(string)

	// Valid certificate verification returns 200 with full details
	verReq := httptest.NewRequest("GET", "/api/v1/certificates/"+certID, nil)
	verW := httptest.NewRecorder()
	r.ServeHTTP(verW, verReq)
	if verW.Code != http.StatusOK {
		t.Fatalf("expected 200 on valid certificate verification, got %d", verW.Code)
	}

	// Non-existent certificate returns 404 (prevents fake certificate generation)
	fakeVerReq := httptest.NewRequest("GET", "/api/v1/certificates/fraudulent-cert-9999", nil)
	fakeVerW := httptest.NewRecorder()
	r.ServeHTTP(fakeVerW, fakeVerReq)
	if fakeVerW.Code != http.StatusNotFound {
		t.Fatalf("expected 404 on fraudulent certificate verification, got %d", fakeVerW.Code)
	}

	// 8. Error Notebook Active Recall Cycle
	saveErrBody, _ := json.Marshal(models.SaveErrorRequest{
		QuestionType:  "FILL_BLANKS",
		Prompt:        "The professor asked the students to cl___fy their thesis argument.",
		UserAnswer:    "claryfy",
		CorrectAnswer: "clarify",
		Explanation:   "Latin root clarus (clear) forms the suffix -ify (clarify).",
	})
	saveErrReq := httptest.NewRequest("POST", "/api/v1/user/errors", bytes.NewReader(saveErrBody))
	saveErrReq.Header.Set("Authorization", "Bearer "+token)
	saveErrReq.Header.Set("Content-Type", "application/json")
	saveErrW := httptest.NewRecorder()
	r.ServeHTTP(saveErrW, saveErrReq)
	if saveErrW.Code != http.StatusCreated {
		t.Fatalf("expected 201 on save error, got %d: %s", saveErrW.Code, saveErrW.Body.String())
	}
	var savedError models.UserErrorItem
	_ = json.Unmarshal(saveErrW.Body.Bytes(), &savedError)
	errorID := savedError.ID

	// Recall Attempt 1 (Correct) -> consecutiveSuccesses = 1, mastered = false
	recall1Body, _ := json.Marshal(models.RecallErrorRequest{Answer: "clarify"})
	recall1Req := httptest.NewRequest("POST", "/api/v1/user/errors/"+errorID+"/recall", bytes.NewReader(recall1Body))
	recall1Req.Header.Set("Authorization", "Bearer "+token)
	recall1Req.Header.Set("Content-Type", "application/json")
	recall1W := httptest.NewRecorder()
	r.ServeHTTP(recall1W, recall1Req)
	var recall1Resp models.RecallErrorResponse
	_ = json.Unmarshal(recall1W.Body.Bytes(), &recall1Resp)
	if !recall1Resp.Success || recall1Resp.ConsecutiveSuccesses != 1 || recall1Resp.Mastered {
		t.Fatalf("recall 1 failed to record progress properly: %+v", recall1Resp)
	}

	// Recall Attempt 2 (Correct) -> consecutiveSuccesses = 2, mastered = TRUE
	recall2Body, _ := json.Marshal(models.RecallErrorRequest{Answer: "clarify"})
	recall2Req := httptest.NewRequest("POST", "/api/v1/user/errors/"+errorID+"/recall", bytes.NewReader(recall2Body))
	recall2Req.Header.Set("Authorization", "Bearer "+token)
	recall2Req.Header.Set("Content-Type", "application/json")
	recall2W := httptest.NewRecorder()
	r.ServeHTTP(recall2W, recall2Req)
	var recall2Resp models.RecallErrorResponse
	_ = json.Unmarshal(recall2W.Body.Bytes(), &recall2Resp)
	if !recall2Resp.Success || recall2Resp.ConsecutiveSuccesses != 2 || !recall2Resp.Mastered {
		t.Fatalf("recall 2 failed to achieve mastery: %+v", recall2Resp)
	}

	// 9. SuperMemo SM-2 Spaced Repetition Review
	srsRevBody, _ := json.Marshal(models.ReviewSRSCardRequest{
		CardID:  "card-ambiguous",
		Quality: 4, // Good
	})
	srsRevReq := httptest.NewRequest("POST", "/api/v1/user/srs/review", bytes.NewReader(srsRevBody))
	srsRevReq.Header.Set("Authorization", "Bearer "+token)
	srsRevReq.Header.Set("Content-Type", "application/json")
	srsRevW := httptest.NewRecorder()
	r.ServeHTTP(srsRevW, srsRevReq)
	if srsRevW.Code != http.StatusOK {
		t.Fatalf("expected 200 on SRS card review, got %d", srsRevW.Code)
	}
	var srsRevResp models.ReviewSRSCardResponse
	_ = json.Unmarshal(srsRevW.Body.Bytes(), &srsRevResp)
	if srsRevResp.IntervalDays != 1 || srsRevResp.Repetitions != 1 || srsRevResp.StreakDays != 1 {
		t.Fatalf("unexpected SRS review result: %+v", srsRevResp)
	}

	// 10. Admin Management verification
	adminLoginBody, _ := json.Marshal(map[string]string{
		"email":    "admin@det-academy.com",
		"password": "admin123",
	})
	adminLogReq := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(adminLoginBody))
	adminLogReq.Header.Set("Content-Type", "application/json")
	adminLogW := httptest.NewRecorder()
	r.ServeHTTP(adminLogW, adminLogReq)
	var adminLogResp map[string]interface{}
	_ = json.Unmarshal(adminLogW.Body.Bytes(), &adminLogResp)
	adminToken := adminLogResp["token"].(string)

	adminStatsReq := httptest.NewRequest("GET", "/api/v1/admin/stats", nil)
	adminStatsReq.Header.Set("Authorization", "Bearer "+adminToken)
	adminStatsW := httptest.NewRecorder()
	r.ServeHTTP(adminStatsW, adminStatsReq)
	if adminStatsW.Code != http.StatusOK {
		t.Fatalf("expected 200 on admin stats, got %d", adminStatsW.Code)
	}

	adminQuestionsReq := httptest.NewRequest("GET", "/api/v1/admin/questions", nil)
	adminQuestionsReq.Header.Set("Authorization", "Bearer "+adminToken)
	adminQuestionsW := httptest.NewRecorder()
	r.ServeHTTP(adminQuestionsW, adminQuestionsReq)
	if adminQuestionsW.Code != http.StatusOK {
		t.Fatalf("expected 200 on admin questions, got %d", adminQuestionsW.Code)
	}
	var adminQResp map[string]interface{}
	_ = json.Unmarshal(adminQuestionsW.Body.Bytes(), &adminQResp)
	qList := adminQResp["questions"].([]interface{})
	if len(qList) < 13 {
		t.Fatalf("expected at least 13 active questions in bank, got %d", len(qList))
	}
	_ = store
}
