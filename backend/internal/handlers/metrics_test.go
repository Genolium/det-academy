package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMetricsHandlerExposesEvaluationQueue(t *testing.T) {
	t.Setenv("METRICS_TOKEN", "")
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	w := httptest.NewRecorder()
	MetricsHandler(w, req)
	body := w.Body.String()
	for _, metric := range []string{
		"det_evaluation_jobs_queued",
		"det_evaluation_jobs_processing",
		"det_evaluation_jobs_retryable_failed",
		"det_evaluation_jobs_permanently_failed",
		"det_evaluation_jobs_oldest_processing_age_seconds",
	} {
		if !strings.Contains(body, metric) {
			t.Fatalf("metrics output is missing %s:\n%s", metric, body)
		}
	}
}

func TestMetricsHandlerRequiresTokenWhenConfigured(t *testing.T) {
	t.Setenv("METRICS_TOKEN", "scrape-secret")

	unauthenticated := httptest.NewRecorder()
	MetricsHandler(unauthenticated, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if unauthenticated.Code != http.StatusForbidden {
		t.Fatalf("expected 403 without a token, got %d", unauthenticated.Code)
	}

	wrong := httptest.NewRecorder()
	wrongRequest := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	wrongRequest.Header.Set("Authorization", "Bearer nope")
	MetricsHandler(wrong, wrongRequest)
	if wrong.Code != http.StatusForbidden {
		t.Fatalf("expected 403 with a wrong token, got %d", wrong.Code)
	}

	bearer := httptest.NewRecorder()
	bearerRequest := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	bearerRequest.Header.Set("Authorization", "Bearer scrape-secret")
	MetricsHandler(bearer, bearerRequest)
	if bearer.Code != http.StatusOK {
		t.Fatalf("expected 200 with the bearer token, got %d", bearer.Code)
	}

	query := httptest.NewRecorder()
	MetricsHandler(query, httptest.NewRequest(http.MethodGet, "/metrics?token=scrape-secret", nil))
	if query.Code != http.StatusOK {
		t.Fatalf("expected 200 with ?token=, got %d", query.Code)
	}
}
