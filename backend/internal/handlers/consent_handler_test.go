package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"det-academy-backend/internal/repository/memory"
)

func consentRequest(method, target, body, userID string) *http.Request {
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	return request.WithContext(context.WithValue(request.Context(), UserIDKey, userID))
}

func TestConsentHandlerRequiresAuth(t *testing.T) {
	handler := NewConsentHandler(memory.New().Users())

	get := httptest.NewRecorder()
	handler.Get(get, httptest.NewRequest("GET", "/api/v1/user/research-consent", nil))
	if get.Code != 401 {
		t.Fatalf("GET status = %d, want 401", get.Code)
	}

	patch := httptest.NewRecorder()
	handler.Update(patch, httptest.NewRequest("PATCH", "/api/v1/user/research-consent", strings.NewReader(`{"consent":true}`)))
	if patch.Code != 401 {
		t.Fatalf("PATCH status = %d, want 401", patch.Code)
	}
}

func TestConsentHandlerGrantAndRevoke(t *testing.T) {
	handler := NewConsentHandler(memory.New().Users())

	initial := httptest.NewRecorder()
	handler.Get(initial, consentRequest("GET", "/api/v1/user/research-consent", "", "user-consent"))
	if initial.Code != 200 {
		t.Fatalf("GET status = %d, body = %s", initial.Code, initial.Body.String())
	}
	if !strings.Contains(initial.Body.String(), `"consent":false`) {
		t.Fatalf("expected consent=false, got %s", initial.Body.String())
	}

	granted := httptest.NewRecorder()
	handler.Update(granted, consentRequest("PATCH", "/api/v1/user/research-consent", `{"consent":true}`, "user-consent"))
	if granted.Code != 200 {
		t.Fatalf("PATCH status = %d, body = %s", granted.Code, granted.Body.String())
	}
	if !strings.Contains(granted.Body.String(), `"consent":true`) {
		t.Fatalf("expected consent=true, got %s", granted.Body.String())
	}

	active := httptest.NewRecorder()
	handler.Get(active, consentRequest("GET", "/api/v1/user/research-consent", "", "user-consent"))
	if !strings.Contains(active.Body.String(), `"consent":true`) {
		t.Fatalf("expected active consent, got %s", active.Body.String())
	}

	revoked := httptest.NewRecorder()
	handler.Update(revoked, consentRequest("PATCH", "/api/v1/user/research-consent", `{"consent":false}`, "user-consent"))
	if revoked.Code != 200 {
		t.Fatalf("revoke status = %d, body = %s", revoked.Code, revoked.Body.String())
	}

	after := httptest.NewRecorder()
	handler.Get(after, consentRequest("GET", "/api/v1/user/research-consent", "", "user-consent"))
	if !strings.Contains(after.Body.String(), `"consent":false`) {
		t.Fatalf("expected revoked consent, got %s", after.Body.String())
	}
}

func TestConsentHandlerRejectsMissingConsent(t *testing.T) {
	handler := NewConsentHandler(memory.New().Users())
	recorder := httptest.NewRecorder()
	handler.Update(recorder, consentRequest("PATCH", "/api/v1/user/research-consent", `{}`, "user-consent"))
	if recorder.Code != 400 {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
}
