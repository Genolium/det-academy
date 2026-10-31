package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	Env           string
	Port          string
	DatabaseURL   string
	JWTSecret     string
	AllowedOrigin string
}

func Load() *Config {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("ENV")))
	if env == "" {
		env = strings.ToLower(strings.TrimSpace(os.Getenv("NODE_ENV")))
	}
	if env == "" {
		env = "development"
	}
	switch env {
	case "production", "prod":
		env = "production"
	case "development", "dev", "local":
		env = "development"
	case "test":
		env = "test"
	default:
		log.Fatalf("[Config FATAL] unknown ENV %q; use development, test or production", env)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DB_URL")
	}
	if dbURL == "" {
		if env == "production" {
			log.Fatal("[Config FATAL] DATABASE_URL is mandatory in production mode")
		}
		dbURL = "postgres://postgres:postgres@localhost:5432/det_academy?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		if env == "production" {
			log.Fatal("[Config FATAL] JWT_SECRET environment variable is mandatory in production mode")
		}
		jwtSecret = "det-academy-super-secure-jwt-secret-key-2026"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "https://det-academy.ru,http://localhost:3000"
	}

	return &Config{
		Env:           env,
		Port:          port,
		DatabaseURL:   dbURL,
		JWTSecret:     jwtSecret,
		AllowedOrigin: allowedOrigin,
	}
}
