package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"det-academy-backend/internal/email"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func rsaJWKS(t *testing.T, key *rsa.PrivateKey, kid string) http.HandlerFunc {
	t.Helper()
	exponent := big.NewInt(int64(key.PublicKey.E)).Bytes()
	n := base64.RawURLEncoding.EncodeToString(key.PublicKey.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(exponent)
	return func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"keys": []map[string]string{{
				"kty": "RSA",
				"kid": kid,
				"use": "sig",
				"alg": "RS256",
				"n":   n,
				"e":   e,
			}},
		})
	}
}

func signedAppleToken(t *testing.T, key *rsa.PrivateKey, kid string, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = kid
	signed, err := token.SignedString(key)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func TestVerifyAppleTokenChecksSignatureAudienceAndEmail(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}
	jwks := httptest.NewServer(rsaJWKS(t, key, "apple-kid"))
	defer jwks.Close()

	t.Setenv("APPLE_CLIENT_ID", "com.detacademy.web")
	t.Setenv("APPLE_JWKS_URL", jwks.URL)
	service := NewAuthService(nil, "test-secret")
	ctx := context.Background()

	valid := signedAppleToken(t, key, "apple-kid", jwt.MapClaims{
		"iss":            "https://appleid.apple.com",
		"aud":            "com.detacademy.web",
		"sub":            "apple-user-1",
		"email":          "student@example.com",
		"email_verified": "true",
		"exp":            time.Now().Add(time.Hour).Unix(),
		"nonce":          "nonce-1",
	})
	uid, email, err := service.verifyAppleToken(ctx, valid, "nonce-1")
	if err != nil {
		t.Fatalf("expected valid apple token, got %v", err)
	}
	if uid != "apple-user-1" || email != "student@example.com" {
		t.Fatalf("unexpected claims: uid=%s email=%s", uid, email)
	}

	wrongAudience := signedAppleToken(t, key, "apple-kid", jwt.MapClaims{
		"iss": "https://appleid.apple.com",
		"aud": "com.another.app",
		"sub": "apple-user-1",
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	if _, _, err := service.verifyAppleToken(ctx, wrongAudience, ""); err == nil {
		t.Fatal("expected audience mismatch to fail")
	}

	unverified := signedAppleToken(t, key, "apple-kid", jwt.MapClaims{
		"iss":            "https://appleid.apple.com",
		"aud":            "com.detacademy.web",
		"sub":            "apple-user-1",
		"email":          "student@example.com",
		"email_verified": "false",
		"exp":            time.Now().Add(time.Hour).Unix(),
	})
	_, email, err = service.verifyAppleToken(ctx, unverified, "")
	if err != nil {
		t.Fatalf("expected unverified email token to parse, got %v", err)
	}
	if email != "" {
		t.Fatalf("unverified email must not be trusted, got %s", email)
	}
}

func TestVerifyAppleTokenRejectsTamperedSignature(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	otherKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	jwks := httptest.NewServer(rsaJWKS(t, key, "apple-kid"))
	defer jwks.Close()

	t.Setenv("APPLE_CLIENT_ID", "com.detacademy.web")
	t.Setenv("APPLE_JWKS_URL", jwks.URL)
	service := NewAuthService(nil, "test-secret")

	tampered := signedAppleToken(t, otherKey, "apple-kid", jwt.MapClaims{
		"iss": "https://appleid.apple.com",
		"aud": "com.detacademy.web",
		"sub": "attacker",
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	if _, _, err := service.verifyAppleToken(context.Background(), tampered, ""); err == nil {
		t.Fatal("expected tampered signature to fail")
	}
}

func TestVerifyGoogleTokenChecksAudienceAndVerifiedEmail(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"iss":            "https://accounts.google.com",
			"aud":            "google-client-id",
			"sub":            "google-user-1",
			"email":          "student@example.com",
			"email_verified": "true",
			"name":           "Student",
			"exp":            strconv.FormatInt(time.Now().Add(time.Hour).Unix(), 10),
		})
	}))
	defer server.Close()

	t.Setenv("GOOGLE_CLIENT_ID", "google-client-id")
	t.Setenv("GOOGLE_TOKENINFO_URL", server.URL)
	service := NewAuthService(nil, "test-secret")

	uid, email, _, _, err := service.verifyGoogleToken(context.Background(), "id-token")
	if err != nil {
		t.Fatalf("expected valid google token, got %v", err)
	}
	if uid != "google-user-1" || email != "student@example.com" {
		t.Fatalf("unexpected google claims: uid=%s email=%s", uid, email)
	}
}

type captureSender struct {
	mu        sync.Mutex
	link      string
	resetLink string
	sent      chan string
}

func (s *captureSender) Send(ctx context.Context, msg email.Message) error {
	return nil
}

func (s *captureSender) SendVerification(ctx context.Context, to, link string) error {
	s.mu.Lock()
	s.link = link
	s.mu.Unlock()
	select {
	case s.sent <- link:
	default:
	}
	return nil
}

func (s *captureSender) SendPasswordReset(ctx context.Context, to, link string) error {
	s.mu.Lock()
	s.resetLink = link
	s.mu.Unlock()
	return nil
}

func (s *captureSender) waitForResetLink(t *testing.T) string {
	t.Helper()
	deadline := time.After(5 * time.Second)
	for {
		s.mu.Lock()
		link := s.resetLink
		s.mu.Unlock()
		if link != "" {
			return link
		}
		select {
		case <-deadline:
			t.Fatal("expected password reset link")
			return ""
		case <-time.After(10 * time.Millisecond):
		}
	}
}

// waitForLink waits for the background delivery of the verification email.
func (s *captureSender) waitForLink(t *testing.T) string {
	t.Helper()
	deadline := time.After(5 * time.Second)
	for {
		s.mu.Lock()
		link := s.link
		s.mu.Unlock()
		if link != "" {
			return link
		}
		select {
		case <-deadline:
			t.Fatal("expected verification link")
			return ""
		case <-time.After(10 * time.Millisecond):
		}
	}
}

// slowSender simulates a mail server that does not answer.
type slowSender struct {
	delay time.Duration
}

func (s *slowSender) Send(ctx context.Context, msg email.Message) error {
	time.Sleep(s.delay)
	return nil
}

func (s *slowSender) SendVerification(ctx context.Context, to, link string) error {
	time.Sleep(s.delay)
	return nil
}

func (s *slowSender) SendPasswordReset(ctx context.Context, to, link string) error {
	time.Sleep(s.delay)
	return nil
}

// TestRegisterDoesNotBlockOnSlowMailServer protects the registration request
// from a mail server that is slow or unreachable. The delivery runs in the
// background, so the response must not wait for it.
func TestRegisterDoesNotBlockOnSlowMailServer(t *testing.T) {
	register := func(sender email.Sender) time.Duration {
		store := memory.New()
		service := NewAuthService(store.Users(), "test-secret", store.OAuthTransactions())
		service.emailSender = sender
		service.publicAppURL = "https://det-academy.test"

		started := time.Now()
		if _, _, err := service.Register(context.Background(), models.RegisterRequest{
			Email: "slow-mail@example.com", Password: "strongPassword123!", Name: "Slow", Locale: "ru",
		}); err != nil {
			t.Fatalf("register: %v", err)
		}
		return time.Since(started)
	}

	// The baseline contains the password hashing, the slow run must not add
	// the mail delay on top of it.
	baseline := register(&captureSender{sent: make(chan string, 1)})
	slow := register(&slowSender{delay: 2 * time.Second})

	if slow > baseline+500*time.Millisecond {
		t.Fatalf("registration waited %s (baseline %s) for the mail delivery", slow, baseline)
	}
}

// TestEmailVerificationRequirementNeedsAMailTransport makes sure the platform
// can never lock new accounts out by requiring verification while no email
// transport is configured.
func TestEmailVerificationRequirementNeedsAMailTransport(t *testing.T) {
	t.Setenv("SMTP_HOST", "")
	t.Setenv("RESEND_API_KEY", "")
	t.Setenv("REQUIRE_EMAIL_VERIFICATION", "true")

	store := memory.New()
	service := NewAuthService(store.Users(), "test-secret", store.OAuthTransactions())
	if service.requireEmailVerification {
		t.Fatal("verification must be disabled when no email transport is configured")
	}

	t.Setenv("SMTP_HOST", "smtp.example.com")
	service = NewAuthService(memory.New().Users(), "test-secret")
	if !service.requireEmailVerification {
		t.Fatal("verification must stay enabled when a transport is configured")
	}
}

func TestEmailVerificationFlow(t *testing.T) {
	store := memory.New()
	sender := &captureSender{sent: make(chan string, 1)}
	service := NewAuthService(store.Users(), "test-secret", store.OAuthTransactions())
	service.emailSender = sender
	service.publicAppURL = "https://det-academy.test"

	user, _, err := service.Register(context.Background(), models.RegisterRequest{
		Email: "verify@example.com", Password: "strongPassword123!", Name: "Verify", Locale: "ru",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if user.EmailVerified {
		t.Fatal("new user must start unverified")
	}
	senderLink := sender.waitForLink(t)
	const prefix = "https://det-academy.test/auth/verify-email?token="
	if !strings.HasPrefix(senderLink, prefix) {
		t.Fatalf("unexpected link: %s", senderLink)
	}
	token := strings.TrimPrefix(senderLink, prefix)
	verified, err := service.VerifyEmail(context.Background(), token)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if !verified.EmailVerified {
		t.Fatal("expected email to be verified")
	}
}

func newRefreshTestService(t *testing.T, verified bool) (*AuthService, *memory.MemoryStorage, *models.User) {
	t.Helper()
	store := memory.New()
	user := &models.User{
		ID:            uuid.NewString(),
		Email:         "refresh-" + uuid.NewString()[:8] + "@example.com",
		PasswordHash:  "not-used",
		Name:          "Refresh Test",
		Role:          "student",
		Locale:        "ru",
		EmailVerified: verified,
	}
	if err := store.Users().Create(context.Background(), user); err != nil {
		t.Fatalf("create user: %v", err)
	}
	auth := NewAuthService(store.Users(), "refresh-test-secret")
	auth.SetRefreshTokenRepo(store.RefreshTokens())
	return auth, store, user
}

func TestRefreshSessionAllowsImmediateRetryAfterRotation(t *testing.T) {
	ctx := context.Background()
	auth, store, user := newRefreshTestService(t, true)
	first, err := auth.IssueRefreshToken(ctx, user.ID)
	if err != nil {
		t.Fatalf("issue first token: %v", err)
	}

	if _, _, second, err := auth.RefreshSession(ctx, first); err != nil || second == "" {
		t.Fatalf("first refresh: %q %v", second, err)
	}

	// A concurrent tab may replay the token it just lost. Inside the grace
	// window this must not revoke the newly issued family.
	if _, _, _, err := auth.RefreshSession(ctx, first); err == nil {
		t.Fatal("expected a replayed token to be rejected")
	}
	reloaded, err := store.Users().GetByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("reload user: %v", err)
	}
	if reloaded.TokenVersion != 0 {
		t.Fatalf("benign replay revoked the family: token version %d", reloaded.TokenVersion)
	}
}

func TestUnverifiedUserRefreshDoesNotBurnToken(t *testing.T) {
	ctx := context.Background()
	auth, store, user := newRefreshTestService(t, false)
	auth.requireEmailVerification = true
	refresh, err := auth.IssueRefreshToken(ctx, user.ID)
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}

	if _, _, _, err := auth.RefreshSession(ctx, refresh); !errors.Is(err, ErrEmailNotVerified) {
		t.Fatalf("expected ErrEmailNotVerified, got %v", err)
	}
	if _, err := store.RefreshTokens().GetActiveByHash(ctx, hashState(refresh)); err != nil {
		t.Fatalf("unverified refresh must not consume the token: %v", err)
	}
}

func TestStaleRefreshReuseRevokesFamily(t *testing.T) {
	ctx := context.Background()
	auth, store, user := newRefreshTestService(t, true)
	first, err := auth.IssueRefreshToken(ctx, user.ID)
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	if _, _, _, err := auth.RefreshSession(ctx, first); err != nil {
		t.Fatalf("first refresh: %v", err)
	}

	previous := refreshReuseGrace
	refreshReuseGrace = 0
	defer func() { refreshReuseGrace = previous }()

	if _, _, _, err := auth.RefreshSession(ctx, first); err == nil {
		t.Fatal("expected stale reuse to be rejected")
	}
	reloaded, err := store.Users().GetByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("reload user: %v", err)
	}
	if reloaded.TokenVersion == 0 {
		t.Fatal("stale reuse outside the grace window must revoke the family")
	}
}
