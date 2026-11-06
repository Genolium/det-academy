package tests

import (
	"context"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/postgres"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func TestPostgresPasswordResetTokensAreSingleUseAndRotated(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	store, err := postgres.New(dbURL)
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}
	defer store.Close()

	ctx := context.Background()
	userID := uuid.NewString()
	user := &models.User{
		ID:           userID,
		Email:        "pg-reset-" + userID[:8] + "@example.com",
		PasswordHash: "not-used",
		Name:         "PG Reset",
		Role:         "student",
		Locale:       "ru",
	}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatalf("create user: %v", err)
	}

	now := time.Now().UTC()
	first := &models.PasswordResetToken{
		TokenHash: "reset-first-" + userID,
		UserID:    userID,
		ExpiresAt: now.Add(30 * time.Minute),
		CreatedAt: now,
	}
	if err := store.Users().CreatePasswordReset(ctx, first); err != nil {
		t.Fatalf("create first token: %v", err)
	}
	consumed, err := store.Users().ConsumePasswordReset(ctx, first.TokenHash)
	if err != nil {
		t.Fatalf("consume first token: %v", err)
	}
	if consumed.UserID != userID {
		t.Fatalf("token owner = %q, want %q", consumed.UserID, userID)
	}
	if _, err := store.Users().ConsumePasswordReset(ctx, first.TokenHash); err == nil {
		t.Fatal("a used token must not be consumed twice")
	}

	second := &models.PasswordResetToken{
		TokenHash: "reset-second-" + userID,
		UserID:    userID,
		ExpiresAt: now.Add(30 * time.Minute),
		CreatedAt: now,
	}
	if err := store.Users().CreatePasswordReset(ctx, second); err != nil {
		t.Fatalf("create second token: %v", err)
	}
	third := &models.PasswordResetToken{
		TokenHash: "reset-third-" + userID,
		UserID:    userID,
		ExpiresAt: now.Add(30 * time.Minute),
		CreatedAt: now.Add(time.Second),
	}
	if err := store.Users().CreatePasswordReset(ctx, third); err != nil {
		t.Fatalf("create third token: %v", err)
	}
	if _, err := store.Users().ConsumePasswordReset(ctx, second.TokenHash); err == nil {
		t.Fatal("requesting a new link must invalidate the previous unused link")
	}
	if _, err := store.Users().ConsumePasswordReset(ctx, third.TokenHash); err != nil {
		t.Fatalf("newest token must work: %v", err)
	}

	expired := &models.PasswordResetToken{
		TokenHash: "reset-expired-" + userID,
		UserID:    userID,
		ExpiresAt: now.Add(-time.Minute),
		CreatedAt: now.Add(-2 * time.Minute),
	}
	if err := store.Users().CreatePasswordReset(ctx, expired); err != nil {
		t.Fatalf("create expired token: %v", err)
	}
	if _, err := store.Users().ConsumePasswordReset(ctx, expired.TokenHash); err == nil {
		t.Fatal("expired token must not be consumable")
	}
}

func TestPostgresPasswordResetServiceFlow(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	store, err := postgres.New(dbURL)
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}
	defer store.Close()

	ctx := context.Background()
	userID := uuid.NewString()
	hash, err := bcrypt.GenerateFromPassword([]byte("oldPassword123!"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}
	user := &models.User{
		ID:            userID,
		Email:         "pg-reset-flow-" + userID[:8] + "@example.com",
		PasswordHash:  string(hash),
		Name:          "PG Reset Flow",
		Role:          "student",
		Locale:        "ru",
		EmailVerified: true,
	}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatalf("create user: %v", err)
	}
	t.Cleanup(func() { _ = store.Users().Delete(context.Background(), userID) })

	auth := service.NewAuthService(store.Users(), "pg-reset-secret", store.OAuthTransactions())
	auth.SetRefreshTokenRepo(store.RefreshTokens())
	refresh, err := auth.IssueRefreshToken(ctx, userID)
	if err != nil {
		t.Fatalf("issue refresh: %v", err)
	}

	if _, _, err := auth.Login(ctx, models.LoginRequest{Email: user.Email, Password: "oldPassword123!"}); err != nil {
		t.Fatalf("old password before reset: %v", err)
	}
	link, err := auth.RequestPasswordReset(ctx, user.Email)
	if err != nil {
		t.Fatalf("request reset: %v", err)
	}
	parsed, err := url.Parse(link)
	if err != nil {
		t.Fatal(err)
	}
	token := strings.TrimPrefix(parsed.Fragment, "token=")
	if token == "" {
		t.Fatalf("no token in reset link %q", link)
	}
	if err := auth.ResetPassword(ctx, token, "newPassword456!"); err != nil {
		t.Fatalf("reset password: %v", err)
	}
	if _, _, err := auth.Login(ctx, models.LoginRequest{Email: user.Email, Password: "oldPassword123!"}); err == nil {
		t.Fatal("old password must fail after reset")
	}
	if _, _, err := auth.Login(ctx, models.LoginRequest{Email: user.Email, Password: "newPassword456!"}); err != nil {
		t.Fatalf("new password must work: %v", err)
	}
	if _, _, _, err := auth.RefreshSession(ctx, refresh); err == nil {
		t.Fatal("refresh token issued before reset must be revoked")
	}
	if err := auth.ResetPassword(ctx, token, "anotherPassword789!"); err == nil {
		t.Fatal("reset token must be single-use")
	}
}
