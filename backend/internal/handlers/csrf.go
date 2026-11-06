package handlers

import (
	"crypto/subtle"
	"net/http"
	"strings"
)

// CSRFMiddleware protects cookie-authenticated mutations with a double-submit
// token. The token is readable by the same-origin client (so it can be echoed
// in X-CSRF-Token) but is not the access credential. Bearer-token API clients
// are exempt because a cross-site form cannot set an Authorization header.
func CSRFMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if isSafeMethod(r.Method) || hasBearerAuthorization(r) || csrfExemptPath(r.URL.Path) {
				next.ServeHTTP(w, r)
				return
			}

			// Only enforce CSRF when the request actually carries an access or
			// refresh cookie. Anonymous public POSTs have nothing to protect.
			_, accessErr := r.Cookie("det_token")
			_, refreshErr := r.Cookie("det_refresh")
			if accessErr != nil && refreshErr != nil {
				next.ServeHTTP(w, r)
				return
			}

			cookie, err := r.Cookie("det_csrf")
			header := r.Header.Get("X-CSRF-Token")
			if err != nil || cookie.Value == "" || header == "" ||
				subtle.ConstantTimeCompare([]byte(cookie.Value), []byte(header)) != 1 {
				RespondErrorCode(w, http.StatusForbidden, "csrf_invalid", "request verification failed; refresh the page and try again")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func isSafeMethod(method string) bool {
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return true
	default:
		return false
	}
}

func hasBearerAuthorization(r *http.Request) bool {
	return strings.HasPrefix(strings.ToLower(strings.TrimSpace(r.Header.Get("Authorization"))), "bearer ")
}

func csrfExemptPath(path string) bool {
	switch path {
	case "/api/v1/auth/login",
		"/api/v1/auth/register",
		"/api/v1/auth/oauth",
		"/api/v1/auth/oauth/start",
		"/api/v1/auth/verify-email",
		"/api/v1/auth/resend-verification-by-email",
		"/api/v1/auth/forgot-password",
		"/api/v1/auth/reset-password",
		"/api/v1/auth/refresh",
		"/api/v1/auth/logout",
		"/api/v1/client-errors":
		return true
	default:
		return false
	}
}
