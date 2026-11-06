package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/models"
)

func TestForgotPasswordReturnsTheSameResponseForKnownAndUnknownEmail(t *testing.T) {
	r, _, _ := setupTestRouter()

	known := fmt.Sprintf("forgot-known-%d@example.com", time.Now().UnixNano())
	registerBody, _ := json.Marshal(models.RegisterRequest{
		Email: known, Password: "strongPassword123!", Name: "Known", Locale: "ru",
	})
	if resp := postJSONWithToken(t, r, "/api/v1/auth/register", "", registerBody); resp.Code != http.StatusCreated {
		t.Fatalf("register: %d %s", resp.Code, resp.Body.String())
	}

	for _, email := range []string{known, "forgot-unknown@example.com"} {
		body, _ := json.Marshal(map[string]string{"email": email})
		resp := postJSONWithToken(t, r, "/api/v1/auth/forgot-password", "", body)
		if resp.Code != http.StatusOK {
			t.Fatalf("forgot %s: %d %s", email, resp.Code, resp.Body.String())
		}
		var payload map[string]interface{}
		if err := json.Unmarshal(resp.Body.Bytes(), &payload); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if payload["status"] != "sent" {
			t.Fatalf("forgot %s returned %v", email, payload)
		}
		if _, exposed := payload["token"]; exposed {
			t.Fatalf("forgot response must not expose a token: %v", payload)
		}
		if _, exposed := payload["link"]; exposed {
			t.Fatalf("forgot response must not expose a link: %v", payload)
		}
	}
}

func TestResetPasswordEndpointIsSingleUse(t *testing.T) {
	r, authService, _ := setupTestRouter()
	ctx := context.Background()

	email := fmt.Sprintf("reset-endpoint-%d@example.com", time.Now().UnixNano())
	registerBody, _ := json.Marshal(models.RegisterRequest{
		Email: email, Password: "oldPassword123!", Name: "Reset Endpoint", Locale: "ru",
	})
	if resp := postJSONWithToken(t, r, "/api/v1/auth/register", "", registerBody); resp.Code != http.StatusCreated {
		t.Fatalf("register: %d %s", resp.Code, resp.Body.String())
	}

	link, err := authService.RequestPasswordReset(ctx, email)
	if err != nil {
		t.Fatalf("request reset: %v", err)
	}
	parsed, err := url.Parse(link)
	if err != nil {
		t.Fatal(err)
	}
	token := strings.TrimPrefix(parsed.Fragment, "token=")
	if token == "" {
		t.Fatalf("no reset token in %q", link)
	}

	resetBody, _ := json.Marshal(map[string]string{"token": token, "password": "newPassword456!"})
	reset := postJSONWithToken(t, r, "/api/v1/auth/reset-password", "", resetBody)
	if reset.Code != http.StatusOK {
		t.Fatalf("reset: %d %s", reset.Code, reset.Body.String())
	}

	login := func(password string) int {
		body, _ := json.Marshal(models.LoginRequest{Email: email, Password: password})
		return postJSONWithToken(t, r, "/api/v1/auth/login", "", body).Code
	}
	if code := login("oldPassword123!"); code != http.StatusUnauthorized {
		t.Fatalf("old password login = %d, want 401", code)
	}
	if code := login("newPassword456!"); code != http.StatusOK {
		t.Fatalf("new password login = %d, want 200", code)
	}

	reuse := postJSONWithToken(t, r, "/api/v1/auth/reset-password", "", resetBody)
	if reuse.Code != http.StatusBadRequest {
		t.Fatalf("reused reset token = %d, want 400", reuse.Code)
	}
	var payload map[string]string
	_ = json.Unmarshal(reuse.Body.Bytes(), &payload)
	if payload["code"] != "invalid_reset_token" {
		t.Fatalf("reuse error code = %q, want invalid_reset_token", payload["code"])
	}
}

func TestResetPasswordEndpointRejectsInvalidAndWeakInput(t *testing.T) {
	r, _, _ := setupTestRouter()

	cases := []struct {
		name string
		body map[string]string
	}{
		{name: "missing token", body: map[string]string{"password": "newPassword456!"}},
		{name: "unknown token", body: map[string]string{"token": "not-a-real-token", "password": "newPassword456!"}},
		{name: "weak password", body: map[string]string{"token": "not-a-real-token", "password": "short"}},
	}
	for _, tc := range cases {
		payload, _ := json.Marshal(tc.body)
		resp := postJSONWithToken(t, r, "/api/v1/auth/reset-password", "", payload)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("%s: status %d %s", tc.name, resp.Code, resp.Body.String())
		}
	}
}
