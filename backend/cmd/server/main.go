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

	// Initialize Storage: Try Postgres, fallback to Memory
	var store repository.Storage
	pgStore, err := postgres.New(cfg.DatabaseURL)
	if err != nil {
		log.Printf("[Storage] PostgreSQL not reachable at %s: %v", cfg.DatabaseURL, err)
		log.Printf("[Storage] Falling back to preloaded In-Memory Storage for MVP / local testing")
		store = memory.New()
	} else {
		log.Println("[Storage] Connected to PostgreSQL successfully")
		store = pgStore
	}
	defer store.Close()

	// Initialize Services
	authService := service.NewAuthService(store.Users(), cfg.JWTSecret)
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

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService)
	theoryHandler := handlers.NewTheoryHandler(theoryService)
	testHandler := handlers.NewTestHandler(catService)
	certHandler := handlers.NewCertificateHandler(certService)
	bannerHandler := handlers.NewBannerHandler(bannerService)
	institutionHandler := handlers.NewInstitutionHandler(institutionService)
	adminHandler := handlers.NewAdminHandler(adminService, authService)

	// Router setup
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.Timeout(60 * time.Second))

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins(),
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

		// Auth routes
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/logout", authHandler.Logout)
			r.Post("/oauth", authHandler.OAuthLogin)

			// Protected auth endpoints
			r.With(handlers.AuthMiddleware(authService)).Get("/me", authHandler.Me)
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
			r.With(handlers.AuthMiddleware(authService)).Post("/sessions", testHandler.StartSession)
			r.Get("/sessions/{id}", testHandler.GetSession)
			r.Post("/sessions/{id}/respond", testHandler.RecordResponse)
			r.Post("/sessions/{id}/stage-complete", testHandler.CompleteStage)
			r.Post("/sessions/{id}/complete", testHandler.CompleteSession)
		})

		// Certificates routes (Public verification and retrieval)
		r.Route("/certificates", func(r chi.Router) {
			r.Get("/{id}", certHandler.GetByID)
			r.With(handlers.OptionalAuthMiddleware(authService)).Post("/", certHandler.IssueCertificate)
			r.With(handlers.AuthMiddleware(authService)).Get("/user/me", certHandler.GetMyCertificates)
		})

		// Ad Banners routes
		r.Route("/banners", func(r chi.Router) {
			r.Get("/", bannerHandler.GetBanners)
			r.Post("/{id}/click", bannerHandler.RecordClick)
		})

		// Universities & Institutions accepting DET
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
