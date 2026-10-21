package observability

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestInitWithoutDSNIsNoop(t *testing.T) {
	if err := Init("", "test", "test"); err != nil {
		t.Fatalf("empty DSN should disable Sentry without an error: %v", err)
	}
}

func TestMiddlewarePassesThrough(t *testing.T) {
	if err := Init("", "test", "test"); err != nil {
		t.Fatal(err)
	}
	called := false
	handler := Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/health", nil))
	if !called || response.Code != http.StatusNoContent {
		t.Fatalf("middleware did not pass through: called=%v status=%d", called, response.Code)
	}
}
