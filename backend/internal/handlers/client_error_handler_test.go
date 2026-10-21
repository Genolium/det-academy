package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestClientErrorRejectsEmptyMessage(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/api/v1/client-errors", strings.NewReader(`{}`))
	response := httptest.NewRecorder()
	ClientError(response, request)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", response.Code)
	}
}

func TestClientErrorAcceptsBoundedReport(t *testing.T) {
	payload := `{"message":"frontend-test-error","stack":"at test","url":"/dashboard","userAgent":"test"}`
	request := httptest.NewRequest(http.MethodPost, "/api/v1/client-errors", strings.NewReader(payload))
	response := httptest.NewRecorder()
	ClientError(response, request)
	if response.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d", response.Code)
	}
}
