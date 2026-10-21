package service

import (
	"context"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"det-academy-backend/internal/models"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func randomHex(bytesCount int) (string, error) {
	buffer := make([]byte, bytesCount)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return hex.EncodeToString(buffer), nil
}

func randomBase64URL(bytesCount int) (string, error) {
	buffer := make([]byte, bytesCount)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func hashState(state string) string {
	sum := sha256.Sum256([]byte(state))
	return hex.EncodeToString(sum[:])
}

func isAllowedOAuthRedirect(raw string) bool {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return false
	}
	if parsed.Scheme != "https" && !(parsed.Scheme == "http" && (parsed.Hostname() == "localhost" || parsed.Hostname() == "127.0.0.1")) {
		return false
	}
	allowed := []string{"det-academy.ru", "www.det-academy.ru", "localhost", "127.0.0.1"}
	if extra := os.Getenv("ALLOWED_ORIGIN"); extra != "" {
		for _, origin := range strings.Split(extra, ",") {
			if parsedOrigin, err := url.Parse(strings.TrimSpace(origin)); err == nil && parsedOrigin.Hostname() != "" {
				allowed = append(allowed, parsedOrigin.Hostname())
			}
		}
	}
	for _, host := range allowed {
		if strings.EqualFold(parsed.Hostname(), host) {
			return true
		}
	}
	return false
}

// StartOAuth creates a one-time server-side transaction and returns the
// provider authorization URL. State, nonce and PKCE verifier never leave the
// server except for the state value sent through the provider.
func (s *AuthService) StartOAuth(ctx context.Context, req models.OAuthStartRequest, userID string) (*models.OAuthStartResponse, error) {
	provider := strings.ToLower(strings.TrimSpace(req.Provider))
	if provider == "" {
		return nil, errors.New("provider is required")
	}
	action := strings.ToLower(strings.TrimSpace(req.Action))
	if action == "" {
		action = "login"
	}
	if action != "login" && action != "link" {
		return nil, errors.New("unsupported oauth action")
	}
	if req.RedirectURI == "" || !isAllowedOAuthRedirect(req.RedirectURI) {
		return nil, errors.New("redirect uri is not allowed")
	}
	if s.oauthRepo == nil {
		return nil, errors.New("oauth transaction store is not configured")
	}

	state, err := randomHex(32)
	if err != nil {
		return nil, err
	}
	nonce, err := randomHex(32)
	if err != nil {
		return nil, err
	}
	verifier, err := randomBase64URL(48)
	if err != nil {
		return nil, err
	}
	challengeBytes := sha256.Sum256([]byte(verifier))
	challenge := base64.RawURLEncoding.EncodeToString(challengeBytes[:])

	transaction := &models.OAuthTransaction{
		ID:           uuid.New().String(),
		StateHash:    hashState(state),
		Nonce:        nonce,
		PKCEVerifier: verifier,
		Provider:     provider,
		Action:       action,
		RedirectURI:  req.RedirectURI,
		UserID:       userID,
		ExpiresAt:    time.Now().UTC().Add(10 * time.Minute),
		CreatedAt:    time.Now().UTC(),
	}
	if err := s.oauthRepo.Create(ctx, transaction); err != nil {
		return nil, fmt.Errorf("failed to create oauth transaction: %w", err)
	}

	authURL, err := s.buildAuthorizationURL(provider, req.RedirectURI, state, nonce, challenge)
	if err != nil {
		return nil, err
	}
	return &models.OAuthStartResponse{URL: authURL, State: state}, nil
}

func (s *AuthService) buildAuthorizationURL(provider, redirectURI, state, nonce, challenge string) (string, error) {
	switch provider {
	case "google":
		if s.googleClientID == "" {
			return "", errors.New("google client id is not configured")
		}
		values := url.Values{
			"client_id":             {s.googleClientID},
			"redirect_uri":          {redirectURI},
			"response_type":         {"code"},
			"scope":                 {"openid email profile"},
			"state":                 {state},
			"nonce":                 {nonce},
			"code_challenge":        {challenge},
			"code_challenge_method": {"S256"},
			"access_type":           {"online"},
			"prompt":                {"select_account"},
		}
		return "https://accounts.google.com/o/oauth2/v2/auth?" + values.Encode(), nil
	case "apple":
		if s.appleClientID == "" {
			return "", errors.New("apple client id is not configured")
		}
		values := url.Values{
			"client_id":     {s.appleClientID},
			"redirect_uri":  {redirectURI},
			"response_type": {"code id_token"},
			"scope":         {"name email"},
			"response_mode": {"fragment"},
			"state":         {state},
			"nonce":         {nonce},
		}
		return "https://appleid.apple.com/auth/authorize?" + values.Encode(), nil
	case "vk":
		clientID := os.Getenv("VK_CLIENT_ID")
		if clientID == "" {
			clientID = os.Getenv("NEXT_PUBLIC_VK_CLIENT_ID")
		}
		if clientID == "" {
			return "", errors.New("vk client id is not configured")
		}
		values := url.Values{
			"response_type":         {"code"},
			"client_id":             {clientID},
			"redirect_uri":          {redirectURI},
			"state":                 {state},
			"code_challenge":        {challenge},
			"code_challenge_method": {"s256"},
			"scope":                 {"vkid.personal_info email"},
		}
		return "https://id.vk.ru/authorize?" + values.Encode(), nil
	case "yandex":
		clientID := os.Getenv("YANDEX_CLIENT_ID")
		if clientID == "" {
			clientID = os.Getenv("NEXT_PUBLIC_YANDEX_CLIENT_ID")
		}
		if clientID == "" {
			return "", errors.New("yandex client id is not configured")
		}
		values := url.Values{
			"response_type": {"code"},
			"client_id":     {clientID},
			"redirect_uri":  {redirectURI},
			"state":         {state},
		}
		return "https://oauth.yandex.ru/authorize?" + values.Encode(), nil
	default:
		return "", errors.New("unsupported oauth provider")
	}
}

func (s *AuthService) consumeOAuthTransaction(ctx context.Context, state, provider string) (*models.OAuthTransaction, error) {
	if s.oauthRepo == nil {
		return nil, errors.New("oauth transaction store is not configured")
	}
	if state == "" {
		return nil, errors.New("oauth state is required")
	}
	return s.oauthRepo.Consume(ctx, hashState(state), provider)
}

func (s *AuthService) exchangeGoogleCode(ctx context.Context, transaction *models.OAuthTransaction, code string) (string, string, string, string, error) {
	if s.googleClientSecret == "" {
		return "", "", "", "", errors.New("google client secret is not configured")
	}
	values := url.Values{
		"code":          {code},
		"client_id":     {s.googleClientID},
		"client_secret": {s.googleClientSecret},
		"redirect_uri":  {transaction.RedirectURI},
		"grant_type":    {"authorization_code"},
		"code_verifier": {transaction.PKCEVerifier},
	}
	req, err := http.NewRequestWithContext(ctx, "POST", s.googleTokenURL, strings.NewReader(values.Encode()))
	if err != nil {
		return "", "", "", "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", "", "", "", errors.New("google token exchange failed")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", "", "", errors.New("google token exchange rejected")
	}
	var payload struct {
		IDToken string `json:"id_token"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&payload); err != nil || payload.IDToken == "" {
		return "", "", "", "", errors.New("google token response did not include id_token")
	}
	return s.verifyGoogleToken(ctx, payload.IDToken)
}

func (s *AuthService) appleClientSecret() (string, error) {
	if s.appleTeamID == "" || s.appleKeyID == "" || s.applePrivateKey == "" {
		return "", errors.New("apple code flow is not configured")
	}
	block, _ := pem.Decode([]byte(s.applePrivateKey))
	if block == nil {
		return "", errors.New("apple private key is not valid PEM")
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", errors.New("apple private key must be PKCS8")
	}
	privateKey, ok := parsed.(*ecdsa.PrivateKey)
	if !ok {
		return "", errors.New("apple private key must be ECDSA")
	}
	now := time.Now()
	claims := jwt.MapClaims{
		"iss": s.appleTeamID,
		"iat": now.Unix(),
		"exp": now.Add(5 * time.Minute).Unix(),
		"aud": "https://appleid.apple.com",
		"sub": s.appleClientID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	token.Header["kid"] = s.appleKeyID
	return token.SignedString(privateKey)
}

func (s *AuthService) exchangeAppleCode(ctx context.Context, transaction *models.OAuthTransaction, code string) (string, string, error) {
	secret, err := s.appleClientSecret()
	if err != nil {
		return "", "", err
	}
	values := url.Values{
		"client_id":     {s.appleClientID},
		"client_secret": {secret},
		"code":          {code},
		"grant_type":    {"authorization_code"},
		"redirect_uri":  {transaction.RedirectURI},
	}
	req, err := http.NewRequestWithContext(ctx, "POST", s.appleTokenURL, strings.NewReader(values.Encode()))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", "", errors.New("apple token exchange failed")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", errors.New("apple token exchange rejected")
	}
	var payload struct {
		IDToken string `json:"id_token"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&payload); err != nil || payload.IDToken == "" {
		return "", "", errors.New("apple token response did not include id_token")
	}
	return s.verifyAppleToken(ctx, payload.IDToken, transaction.Nonce)
}
