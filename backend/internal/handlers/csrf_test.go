package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func runCSRFRequest(t *testing.T, method, path string, cookies map[string]string, csrfHeader, bearer string) int {
	t.Helper()
	called := false
	handler := CSRFMiddleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))
	req := httptest.NewRequest(method, path, nil)
	for name, value := range cookies {
		req.AddCookie(&http.Cookie{Name: name, Value: value})
	}
	if csrfHeader != "" {
		req.Header.Set("X-CSRF-Token", csrfHeader)
	}
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	if called {
		t.Logf("%s %s reached the handler", method, path)
	}
	return w.Code
}

func TestCSRFRejectsCookieMutationWithoutToken(t *testing.T) {
	code := runCSRFRequest(t, http.MethodPost, "/api/v1/auth/password", map[string]string{"det_token": "jwt"}, "", "")
	if code != http.StatusForbidden {
		t.Fatalf("cookie mutation without CSRF = %d, want 403", code)
	}
}

func TestCSRFAcceptsMatchingDoubleSubmitToken(t *testing.T) {
	code := runCSRFRequest(t, http.MethodPost, "/api/v1/auth/password", map[string]string{
		"det_token": "jwt",
		"det_csrf":  "token-123",
	}, "token-123", "")
	if code != http.StatusNoContent {
		t.Fatalf("matching CSRF = %d, want 204", code)
	}
}

func TestCSRFRejectsMismatchedToken(t *testing.T) {
	code := runCSRFRequest(t, http.MethodPost, "/api/v1/user/goals", map[string]string{
		"det_token": "jwt",
		"det_csrf":  "token-123",
	}, "token-456", "")
	if code != http.StatusForbidden {
		t.Fatalf("mismatched CSRF = %d, want 403", code)
	}
}

func TestCSRFSkipsBearerClients(t *testing.T) {
	code := runCSRFRequest(t, http.MethodPost, "/api/v1/user/goals", nil, "", "api-token")
	if code != http.StatusNoContent {
		t.Fatalf("Bearer client = %d, want 204", code)
	}
}

func TestCSRFSkipsSafeMethods(t *testing.T) {
	code := runCSRFRequest(t, http.MethodGet, "/api/v1/user/goals", map[string]string{"det_token": "jwt"}, "", "")
	if code != http.StatusNoContent {
		t.Fatalf("GET with cookie = %d, want 204", code)
	}
}

func TestCSRFExemptsLoginAndRefresh(t *testing.T) {
	for _, path := range []string{"/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh", "/api/v1/auth/verify-email", "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password"} {
		code := runCSRFRequest(t, http.MethodPost, path, map[string]string{"det_token": "stale", "det_refresh": "refresh"}, "", "")
		if code != http.StatusNoContent {
			t.Fatalf("%s = %d, want 204", path, code)
		}
	}
}
