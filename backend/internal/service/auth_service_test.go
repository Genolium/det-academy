package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
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
