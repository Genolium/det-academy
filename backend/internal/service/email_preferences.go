package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"os"
	"strings"

	"det-academy-backend/internal/repository"
)

const unsubscribeTokenPrefix = "digest-v1"

func unsubscribeSecret() string {
	if value := strings.TrimSpace(os.Getenv("DIGEST_UNSUBSCRIBE_SECRET")); value != "" {
		return value
	}
	return os.Getenv("JWT_SECRET")
}

func digestSignature(userID string) string {
	mac := hmac.New(sha256.New, []byte(unsubscribeSecret()))
	_, _ = mac.Write([]byte(unsubscribeTokenPrefix + ":" + userID))
	return hex.EncodeToString(mac.Sum(nil))
}

// DigestUnsubscribeToken returns a stateless, signed token. Rotating the JWT
// secret invalidates outstanding unsubscribe links, which is acceptable: the
// link is only a preference toggle, never an authentication credential.
func DigestUnsubscribeToken(userID string) string {
	if userID == "" {
		return ""
	}
	return base64.RawURLEncoding.EncodeToString([]byte(userID)) + "." + digestSignature(userID)
}

func ParseDigestUnsubscribeToken(token string) (string, error) {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 2 {
		return "", errors.New("invalid unsubscribe token")
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil || len(raw) == 0 || len(raw) > 128 {
		return "", errors.New("invalid unsubscribe token")
	}
	userID := string(raw)
	expected := digestSignature(userID)
	if !hmac.Equal([]byte(expected), []byte(parts[1])) {
		return "", errors.New("invalid unsubscribe token")
	}
	return userID, nil
}

func EmailDigestEnabled(ctx context.Context, users repository.UserRepository, userID string) (bool, error) {
	if users == nil || userID == "" {
		return false, errors.New("user repository is required")
	}
	return users.GetEmailDigestEnabled(ctx, userID)
}

func SetEmailDigestEnabled(ctx context.Context, users repository.UserRepository, userID string, enabled bool) error {
	if users == nil || userID == "" {
		return errors.New("user repository is required")
	}
	return users.SetEmailDigestEnabled(ctx, userID, enabled)
}

// UnsubscribeEmailDigest verifies the token and disables the weekly digest.
func UnsubscribeEmailDigest(ctx context.Context, users repository.UserRepository, token string) error {
	userID, err := ParseDigestUnsubscribeToken(token)
	if err != nil {
		return err
	}
	return SetEmailDigestEnabled(ctx, users, userID, false)
}
