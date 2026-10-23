package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestReadinessHandler(t *testing.T) {
	healthy := func(context.Context) error { return nil }
	broken := func(context.Context) error { return errors.New("connection refused") }

	tests := []struct {
		name       string
		ping       func(context.Context) error
		schemaErr  error
		wantStatus int
		wantBody   string
	}{
		{"ready", healthy, nil, http.StatusOK, "ready"},
		{"storage down", broken, nil, http.StatusServiceUnavailable, "storage is not ready"},
		{"schema failed", healthy, errors.New("migration 019 failed"), http.StatusServiceUnavailable, "schema migrations failed"},
		{"no ping function", nil, nil, http.StatusOK, "ready"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ReadinessHandler(test.ping, test.schemaErr)(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/ready", nil))
			if recorder.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, test.wantStatus)
			}
			if !strings.Contains(recorder.Body.String(), test.wantBody) {
				t.Fatalf("body = %q, want it to contain %q", recorder.Body.String(), test.wantBody)
			}
		})
	}
}
