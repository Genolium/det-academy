package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"det-academy-backend/internal/handlers"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/go-chi/chi/v5"
)

func setupTestRouter() (*chi.Mux, *service.AuthService, *memory.MemoryStorage) {
	store := memory.New()
	jwtSecret := "test-secret-key-123456"

	authService := service.NewAuthService(store.Users(), jwtSecret)
	theoryService := service.NewTheoryService(store.Theory())
	catService := service.NewCATService(
		store.Sessions(),
		store.Questions(),
		store.Theory(),
		store.Certificates(),
		theoryService,
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

	r := chi.NewRouter()

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			handlers.RespondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
		})

		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/logout", authHandler.Logout)
			r.With(handlers.AuthMiddleware(authService)).Get("/me", authHandler.Me)
		})

		r.Route("/theory", func(r chi.Router) {
			r.Get("/lessons", theoryHandler.GetLessons)
			r.With(handlers.AuthMiddleware(authService)).Get("/progress", theoryHandler.GetProgress)
			r.With(handlers.AuthMiddleware(authService)).Post("/toggle", theoryHandler.ToggleCompletion)
		})

		r.Route("/test", func(r chi.Router) {
			r.Get("/questions", testHandler.GetQuestions)
			// Strict auth required for test sessions
			r.With(handlers.AuthMiddleware(authService)).Post("/sessions", testHandler.StartSession)
			r.Get("/sessions/{id}", testHandler.GetSession)
			r.Post("/sessions/{id}/respond", testHandler.RecordResponse)
			r.Post("/sessions/{id}/stage-complete", testHandler.CompleteStage)
			r.Post("/sessions/{id}/complete", testHandler.CompleteSession)
		})

		r.Route("/certificates", func(r chi.Router) {
			r.Get("/{id}", certHandler.GetByID)
			r.With(handlers.OptionalAuthMiddleware(authService)).Post("/", certHandler.IssueCertificate)
			r.With(handlers.AuthMiddleware(authService)).Get("/user/me", certHandler.GetMyCertificates)
		})

		r.Route("/banners", func(r chi.Router) {
			r.Get("/", bannerHandler.GetBanners)
			r.Post("/{id}/click", bannerHandler.RecordClick)
		})

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

	// 4. Record question response
	respPayload := models.SubmitResponseRequest{
		QuestionID:   "q-rs-01",
		UserResponse: json.RawMessage(`{"selectedYes":true}`),
		RawScore:     1.0,
		TimeSpentSec: 3,
	}
	respBody, _ := json.Marshal(respPayload)
	respReq := httptest.NewRequest("POST", "/api/v1/test/sessions/"+sessionID+"/respond", bytes.NewReader(respBody))
	respW := httptest.NewRecorder()
	r.ServeHTTP(respW, respReq)

	if respW.Code != http.StatusOK {
		t.Fatalf("expected 200 on submit response, got %d", respW.Code)
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
	compW := httptest.NewRecorder()
	r.ServeHTTP(compW, compReq)

	if compW.Code != http.StatusOK {
		t.Fatalf("expected 200 on complete session, got %d: %s", compW.Code, compW.Body.String())
	}

	var compResult models.SessionCompleteResponse
	_ = json.Unmarshal(compW.Body.Bytes(), &compResult)

	if compResult.Scores.Overall < 100 || compResult.Scores.Overall > 160 {
		t.Fatalf("expected score between 100 and 160, got %d", compResult.Scores.Overall)
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
