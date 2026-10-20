package config

import (
	"log"
	"os"
)

type Config struct {
	Env           string
	Port          string
	DatabaseURL   string
	JWTSecret     string
	AllowedOrigin string
}

func Load() *Config {
	env := os.Getenv("ENV")
	if env == "" {
		env = os.Getenv("NODE_ENV")
	}
	if env == "" {
		env = "development"
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
