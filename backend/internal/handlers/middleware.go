package handlers

import (
	"context"
	"det-academy-backend/internal/service"
	"encoding/json"
	"net/http"
	"strings"
)

type contextKey string

const (
	UserContextKey contextKey = "user_claims"
	UserIDKey      contextKey = "user_id"
)

func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func RespondError(w http.ResponseWriter, status int, message string) {
	RespondJSON(w, status, map[string]string{"error": message})
}

func AuthMiddleware(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := extractToken(r)
			if tokenStr == "" {
				RespondError(w, http.StatusUnauthorized, "authorization required")
				return
			}

			claims, err := authService.ValidateToken(tokenStr)
			if err != nil {
				RespondError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func AdminMiddleware(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := extractToken(r)
			if tokenStr == "" {
				RespondError(w, http.StatusUnauthorized, "authorization required")
				return
			}

			claims, err := authService.ValidateToken(tokenStr)
			if err != nil {
				RespondError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			if claims.Role != "admin" && claims.Role != "superadmin" {
				RespondError(w, http.StatusForbidden, "access denied: administrator privileges required")
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func OptionalAuthMiddleware(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := extractToken(r)
			if tokenStr != "" {
				if claims, err := authService.ValidateToken(tokenStr); err == nil {
					ctx := context.WithValue(r.Context(), UserContextKey, claims)
					ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func extractToken(r *http.Request) string {
	// 1. Authorization: Bearer <token>
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return parts[1]
		}
	}

	// 2. Cookie: det_token=<token>
	if cookie, err := r.Cookie("det_token"); err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}

func GetUserIDFromContext(ctx context.Context) string {
	if val := ctx.Value(UserIDKey); val != nil {
		if id, ok := val.(string); ok {
			return id
		}
	}
	return ""
}

func GetUserClaimsFromContext(ctx context.Context) *service.JWTClaims {
	if val := ctx.Value(UserContextKey); val != nil {
		if claims, ok := val.(*service.JWTClaims); ok {
			return claims
		}
	}
	return nil
}
