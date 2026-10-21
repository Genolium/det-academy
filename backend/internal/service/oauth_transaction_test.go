package service

import (
	"context"
	"strings"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
)

func TestOAuthTransactionIsOneTimeAndChecksRedirect(t *testing.T) {
	t.Setenv("GOOGLE_CLIENT_ID", "google-client-id")
	store := memory.New()
	service := NewAuthService(store.Users(), "test-secret", store.OAuthTransactions())
	ctx := context.Background()

	response, err := service.StartOAuth(ctx, models.OAuthStartRequest{
		Provider:    "google",
		Action:      "login",
		RedirectURI: "https://det-academy.ru/auth/callback",
	}, "")
	if err != nil {
		t.Fatalf("failed to start oauth: %v", err)
	}
	if response.State == "" || response.URL == "" {
		t.Fatal("expected state and authorization url")
	}
	if !strings.Contains(response.URL, "code_challenge") || !strings.Contains(response.URL, response.State) {
		t.Fatalf("expected PKCE challenge and state in url: %s", response.URL)
	}

	transaction, err := service.consumeOAuthTransaction(ctx, response.State, "google")
	if err != nil {
		t.Fatalf("failed to consume transaction: %v", err)
	}
	if transaction.Nonce == "" || transaction.PKCEVerifier == "" {
		t.Fatal("expected nonce and pkce verifier to be stored server-side")
	}
	if _, err := service.consumeOAuthTransaction(ctx, response.State, "google"); err == nil {
		t.Fatal("expected second consume to fail")
	}

	if _, err := service.StartOAuth(ctx, models.OAuthStartRequest{
		Provider:    "google",
		Action:      "login",
		RedirectURI: "https://evil.example/callback",
	}, ""); err == nil {
		t.Fatal("expected non-allowlisted redirect to fail")
	}
}
