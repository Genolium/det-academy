package service

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"

	"golang.org/x/crypto/bcrypt"
)

func newPasswordResetFixture(t *testing.T) (*AuthService, *memory.MemoryStorage, *captureSender, *models.User) {
	t.Helper()
	store := memory.New()
	sender := &captureSender{sent: make(chan string, 1)}
	service := NewAuthService(store.Users(), "test-secret", store.OAuthTransactions())
	service.emailSender = sender
	service.publicAppURL = "https://det-academy.test"
	service.SetRefreshTokenRepo(store.RefreshTokens())

	hash, err := bcrypt.GenerateFromPassword([]byte("oldPassword123!"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}
	user := &models.User{
		ID:            "reset-user-1",
		Email:         "reset@example.com",
		PasswordHash:  string(hash),
		Name:          "Reset User",
		Role:          "student",
		Locale:        "ru",
		EmailVerified: true,
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}
	if err := store.Users().Create(context.Background(), user); err != nil {
		t.Fatal(err)
	}
	return service, store, sender, user
}

func tokenFromResetLink(t *testing.T, link string) string {
	t.Helper()
	parsed, err := url.Parse(link)
	if err != nil {
		t.Fatalf("parse reset link: %v", err)
	}
	token := parsed.Fragment
	token = strings.TrimPrefix(token, "token=")
	if token == "" {
		t.Fatalf("reset link has no token: %q", link)
	}
	return token
}

func TestRequestPasswordResetDoesNotRevealUnknownAccounts(t *testing.T) {
	service, _, sender, _ := newPasswordResetFixture(t)
	ctx := context.Background()

	link, err := service.RequestPasswordReset(ctx, "nobody@example.com")
	if err != nil {
		t.Fatalf("unknown address must not fail: %v", err)
	}
	if link != "" {
		t.Fatalf("unknown address must not get a reset link: %q", link)
	}
	sender.mu.Lock()
	resetLink := sender.resetLink
	sender.mu.Unlock()
	if resetLink != "" {
		t.Fatalf("unknown address must not receive email: %q", resetLink)
	}
}

func TestRequestPasswordResetStoresHashAndSendsSingleUseLink(t *testing.T) {
	service, store, sender, user := newPasswordResetFixture(t)
	ctx := context.Background()

	link, err := service.RequestPasswordReset(ctx, " Reset@Example.com ")
	if err != nil {
		t.Fatalf("request reset: %v", err)
	}
	if !strings.HasPrefix(link, "https://det-academy.test/auth/reset-password#token=") {
		t.Fatalf("unexpected reset link: %q", link)
	}
	if delivered := sender.waitForResetLink(t); delivered != link {
		t.Fatalf("delivered link %q, want %q", delivered, link)
	}

	rawToken := tokenFromResetLink(t, link)
	token, err := store.Users().ConsumePasswordReset(ctx, hashState(rawToken))
	if err != nil {
		t.Fatalf("stored token could not be consumed: %v", err)
	}
	if token.UserID != user.ID {
		t.Fatalf("token belongs to %q, want %q", token.UserID, user.ID)
	}
	if _, err := store.Users().ConsumePasswordReset(ctx, hashState(rawToken)); err == nil {
		t.Fatal("a consumed reset token must not be reusable")
	}
}

func TestResetPasswordChangesPasswordAndRevokesSessions(t *testing.T) {
	service, store, _, user := newPasswordResetFixture(t)
	ctx := context.Background()

	refreshToken, err := service.IssueRefreshToken(ctx, user.ID)
	if err != nil {
		t.Fatalf("issue refresh token: %v", err)
	}
	link, err := service.RequestPasswordReset(ctx, user.Email)
	if err != nil {
		t.Fatalf("request reset: %v", err)
	}
	rawToken := tokenFromResetLink(t, link)
	versionBefore := user.TokenVersion

	if _, _, err := service.Login(ctx, models.LoginRequest{Email: user.Email, Password: "oldPassword123!"}); err != nil {
		t.Fatalf("old password should work before reset: %v", err)
	}
	if err := service.ResetPassword(ctx, rawToken, "newPassword456!"); err != nil {
		t.Fatalf("reset password: %v", err)
	}

	if _, _, err := service.Login(ctx, models.LoginRequest{Email: user.Email, Password: "oldPassword123!"}); err == nil {
		t.Fatal("old password must stop working after reset")
	}
	if _, _, err := service.Login(ctx, models.LoginRequest{Email: user.Email, Password: "newPassword456!"}); err != nil {
		t.Fatalf("new password must work after reset: %v", err)
	}

	updated, err := store.Users().GetByID(ctx, user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if updated.TokenVersion <= versionBefore {
		t.Fatalf("token version was not bumped: before=%d after=%d", versionBefore, updated.TokenVersion)
	}
	if _, _, _, err := service.RefreshSession(ctx, refreshToken); err == nil {
		t.Fatal("existing refresh token must be revoked after password reset")
	}
	if err := service.ResetPassword(ctx, rawToken, "anotherPassword789!"); !errors.Is(err, ErrInvalidPasswordReset) {
		t.Fatalf("second use = %v, want ErrInvalidPasswordReset", err)
	}
}

func TestResetPasswordRejectsExpiredAndWeakInput(t *testing.T) {
	service, store, _, user := newPasswordResetFixture(t)
	ctx := context.Background()

	expired := "expired-reset-token"
	if err := store.Users().CreatePasswordReset(ctx, &models.PasswordResetToken{
		TokenHash: hashState(expired),
		UserID:    user.ID,
		ExpiresAt: time.Now().UTC().Add(-time.Minute),
		CreatedAt: time.Now().UTC().Add(-2 * time.Minute),
	}); err != nil {
		t.Fatal(err)
	}
	if err := service.ResetPassword(ctx, expired, "newPassword456!"); !errors.Is(err, ErrInvalidPasswordReset) {
		t.Fatalf("expired token = %v, want ErrInvalidPasswordReset", err)
	}

	link, err := service.RequestPasswordReset(ctx, user.Email)
	if err != nil {
		t.Fatal(err)
	}
	rawToken := tokenFromResetLink(t, link)
	if err := service.ResetPassword(ctx, rawToken, "short"); err == nil {
		t.Fatal("weak password must be rejected")
	}
	// A rejected password must not burn the token.
	if err := service.ResetPassword(ctx, rawToken, "validPassword456!"); err != nil {
		t.Fatalf("valid retry after weak password: %v", err)
	}
}

func TestNewPasswordResetInvalidatesOlderLink(t *testing.T) {
	service, _, _, user := newPasswordResetFixture(t)
	ctx := context.Background()

	first, err := service.RequestPasswordReset(ctx, user.Email)
	if err != nil {
		t.Fatal(err)
	}
	second, err := service.RequestPasswordReset(ctx, user.Email)
	if err != nil {
		t.Fatal(err)
	}
	if first == second {
		t.Fatal("two reset requests returned the same token")
	}
	if err := service.ResetPassword(ctx, tokenFromResetLink(t, first), "newPassword456!"); !errors.Is(err, ErrInvalidPasswordReset) {
		t.Fatalf("older link = %v, want ErrInvalidPasswordReset", err)
	}
	if err := service.ResetPassword(ctx, tokenFromResetLink(t, second), "newPassword456!"); err != nil {
		t.Fatalf("newest link must work: %v", err)
	}
}
