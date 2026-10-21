package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMetricsHandlerExposesEvaluationQueue(t *testing.T) {
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
