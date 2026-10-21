package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"det-academy-backend/internal/ai"
	"det-academy-backend/internal/config"
	"det-academy-backend/internal/handlers"
	"det-academy-backend/internal/repository"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/repository/postgres"
	"det-academy-backend/internal/service"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// corsOrigins returns explicit origins. A wildcard "*" must not be used together with
// AllowCredentials (browsers reject it), so ALLOWED_ORIGIN is appended instead.
func corsOrigins() []string {
	origins := []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://frontend:3000",
		"http://localhost:13000",
		"http://127.0.0.1:13000",
		"http://localhost:18080",
		"http://127.0.0.1:18080",
		"https://det-academy.ru",
		"http://det-academy.ru",
		"https://www.det-academy.ru",
		"http://www.det-academy.ru",
	}
	if extra := os.Getenv("ALLOWED_ORIGIN"); extra != "" && extra != "*" {
		for _, o := range strings.Split(extra, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}
	return origins
}

func main() {
	cfg := config.Load()
	log.Printf("Starting DET Academy Backend Server on port %s...", cfg.Port)

	// Initialize Storage: Try Postgres, fallback to Memory (strictly disallow fallback in production)
	var store repository.Storage
	pgStore, err := postgres.New(cfg.DatabaseURL)
	if err != nil {
		if cfg.Env == "production" || os.Getenv("ENV") == "production" || os.Getenv("NODE_ENV") == "production" {
			log.Fatalf("[Storage FATAL] PostgreSQL connection failed in production mode, aborting: %v", err)
		}
		if os.Getenv("ALLOW_MEMORY_STORAGE") != "true" {
			log.Fatalf("[Storage FATAL] PostgreSQL is unavailable and ALLOW_MEMORY_STORAGE is not enabled: %v", err)
		}
		log.Printf("[Storage] PostgreSQL not reachable: %v", err)
		log.Printf("[Storage] Explicit in-memory storage enabled by ALLOW_MEMORY_STORAGE=true")
		store = memory.New()
	} else {
		log.Println("[Storage] Connected to PostgreSQL successfully")
		store = pgStore
	}
	defer store.Close()

	// Initialize Services
	authService := service.NewAuthService(store.Users(), cfg.JWTSecret, store.OAuthTransactions())
	if err := authService.EnsureBootstrapAdmin(
		context.Background(),
		os.Getenv("BOOTSTRAP_ADMIN_EMAIL"),
		os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"),
		os.Getenv("BOOTSTRAP_ADMIN_NAME"),
	); err != nil {
		log.Printf("[Bootstrap] Failed to create bootstrap admin: %v", err)
	}
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
	aiProvider := ai.NewFromEnv()
	var transcriber ai.Transcriber
	if aiProvider != nil && os.Getenv("AI_STT_ENABLED") == "true" {
		transcriber = aiProvider
	}
	evaluationQueue := service.NewEvaluationQueue(store.Sessions(), store.Questions(), transcriber, aiProvider)
	catService.SetEvaluationQueue(evaluationQueue)
	queueCtx, queueCancel := context.WithCancel(context.Background())
	defer queueCancel()
	go evaluationQueue.Run(queueCtx)

	studyService := service.NewStudyService(store, theoryService, catService)
	vocabularyService := service.NewVocabularyService(store.Vocabulary())

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService, cfg.Env == "production")
	theoryHandler := handlers.NewTheoryHandler(theoryService)
	testHandler := handlers.NewTestHandler(catService)
	certHandler := handlers.NewCertificateHandler(certService)
	bannerHandler := handlers.NewBannerHandler(bannerService)
	institutionHandler := handlers.NewInstitutionHandler(institutionService)
	adminHandler := handlers.NewAdminHandler(adminService, authService)
	studyHandler := handlers.NewStudyHandler(studyService)
	vocabularyHandler := handlers.NewVocabularyHandler(vocabularyService)

	mediaUploadDir := os.Getenv("MEDIA_UPLOAD_DIR")
	if mediaUploadDir == "" {
		mediaUploadDir = "data/media/audio"
	}
	mediaHandler := handlers.NewMediaHandler(catService, mediaUploadDir)

	arenaHub := handlers.NewArenaHub()
	go arenaHub.Run()
	arenaHandler := handlers.NewArenaHandler(arenaHub, store.Users(), store.Sessions())

	// Router setup
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.RequestSize(30 << 20))
	r.Use(handlers.MetricsMiddleware)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.Timeout(60 * time.Second))

	// CORS configuration: Allow explicit trusted origins with credentials
	allowedOrigins := corsOrigins()
	r.Use(handlers.OriginGuardMiddleware(allowedOrigins))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Base root
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		handlers.RespondJSON(w, http.StatusOK, map[string]interface{}{
			"service": "DET Academy Backend",
			"status":  "running",
			"version": "1.0-mvp",
			"time":    time.Now().UTC(),
		})
	})

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// Health check
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			handlers.RespondJSON(w, http.StatusOK, map[string]string{
				"status": "ok",
				"time":   time.Now().UTC().Format(time.RFC3339),
			})
		})
		r.Get("/ready", func(w http.ResponseWriter, r *http.Request) {
			if err := store.Ping(r.Context()); err != nil {
				handlers.RespondError(w, http.StatusServiceUnavailable, "storage is not ready")
				return
			}
			handlers.RespondJSON(w, http.StatusOK, map[string]string{"status": "ready"})
		})

		// Auth routes
		r.Get("/metrics", handlers.MetricsHandler)

		r.Route("/auth", func(r chi.Router) {
			r.Use(handlers.RateLimitMiddleware(60, time.Minute))
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.With(handlers.OptionalAuthMiddleware(authService)).Post("/logout", authHandler.Logout)
			r.Post("/oauth", authHandler.OAuthLogin)
			r.With(handlers.OptionalAuthMiddleware(authService)).Post("/oauth/start", authHandler.StartOAuth)

			// Protected auth endpoints
			r.With(handlers.AuthMiddleware(authService)).Get("/me", authHandler.Me)
			r.With(handlers.AuthMiddleware(authService)).Patch("/profile", authHandler.UpdateProfile)
			r.With(handlers.AuthMiddleware(authService)).Get("/providers", authHandler.GetLinkedProviders)
			r.With(handlers.AuthMiddleware(authService)).Post("/providers/link", authHandler.LinkProvider)
			r.With(handlers.AuthMiddleware(authService)).Delete("/providers/{provider}", authHandler.UnlinkProvider)
			r.With(handlers.AuthMiddleware(authService)).Post("/password", authHandler.SetPassword)
		})

		// User Study Plan, Error Notebook, SRS, and Skill Analytics
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

		// Theory routes (Strictly authenticated progress)
		r.Route("/theory", func(r chi.Router) {
			r.Get("/lessons", theoryHandler.GetLessons)
			r.With(handlers.AuthMiddleware(authService)).Get("/progress", theoryHandler.GetProgress)
			r.With(handlers.AuthMiddleware(authService)).Post("/toggle", theoryHandler.ToggleCompletion)
		})

		// Test and CAT routes (Strictly authenticated sessions)
		r.Route("/test", func(r chi.Router) {
			r.Get("/questions", testHandler.GetQuestions)

			// Session routes strictly require authentication
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

		// Media serving routes (Audio and uploaded responses)
		r.With(handlers.AuthMiddleware(authService)).Get("/media/audio/{filename}", mediaHandler.ServeAudio)

		// Certificates routes (Public verification and retrieval)
		r.Route("/certificates", func(r chi.Router) {
			r.Get("/{id}", certHandler.GetByID)
			r.With(handlers.AuthMiddleware(authService)).Post("/", certHandler.IssueCertificate)
			r.With(handlers.AuthMiddleware(authService)).Get("/user/me", certHandler.GetMyCertificates)
		})

		// Multiplayer Arena WebSocket & Leaderboard
		r.Get("/arena/ws", arenaHandler.HandleWebSocket)
		r.Get("/arena/leaderboard", arenaHandler.GetLeaderboard)

		// Ad Banners routes
		r.Route("/banners", func(r chi.Router) {
			r.Get("/", bannerHandler.GetBanners)
			r.Post("/{id}/click", bannerHandler.RecordClick)
		})

		// Universities & Institutions accepting DET
		r.Get("/vocabulary", vocabularyHandler.List)

		r.Route("/institutions", func(r chi.Router) {
			r.Get("/", institutionHandler.List)
			r.Get("/{id}", institutionHandler.GetByID)
			r.With(handlers.AdminMiddleware(authService)).Post("/", institutionHandler.Create)
			r.With(handlers.AdminMiddleware(authService)).Delete("/{id}", institutionHandler.Delete)
		})

		// Admin & CRM routes (Strictly admin privileged)
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

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server runner in background
	go func() {
		log.Printf("Server listening on http://0.0.0.0:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server ListenAndServe error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting properly.")
}
