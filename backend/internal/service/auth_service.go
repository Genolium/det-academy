package service

import (
	"context"
	"crypto/rsa"
	"det-academy-backend/internal/email"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo  repository.UserRepository
	jwtSecret []byte

	httpClient         *http.Client
	googleClientID     string
	appleClientID      string
	googleTokenInfoURL string
	googleUserInfoURL  string
	appleJWKSURL       string
	isProduction       bool

	appleKeysMu        sync.RWMutex
	appleKeys          map[string]*rsa.PublicKey
	appleKeysFetchedAt time.Time

	oauthRepo          repository.OAuthTransactionRepository
	googleClientSecret string
	googleTokenURL     string
	appleTokenURL      string
	appleTeamID        string
	appleKeyID         string
	applePrivateKey    string

	emailSender              email.Sender
	publicAppURL             string
	requireEmailVerification bool
	refreshRepo              repository.RefreshTokenRepository

	// mailSlots bounds the number of verification emails that are delivered in
	// the background at the same time. A mail server that does not answer must
	// never pile up goroutines or block a registration.
	mailSlots chan struct{}
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string, oauthRepos ...repository.OAuthTransactionRepository) *AuthService {
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if googleClientID == "" {
		googleClientID = os.Getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
	}
	appleClientID := os.Getenv("APPLE_CLIENT_ID")
	if appleClientID == "" {
		appleClientID = os.Getenv("APPLE_SERVICE_ID")
	}
	tokenInfoURL := os.Getenv("GOOGLE_TOKENINFO_URL")
	if tokenInfoURL == "" {
		tokenInfoURL = "https://oauth2.googleapis.com/tokeninfo"
	}
	userInfoURL := os.Getenv("GOOGLE_USERINFO_URL")
	if userInfoURL == "" {
		userInfoURL = "https://www.googleapis.com/oauth2/v3/userinfo"
	}
	appleJWKSURL := os.Getenv("APPLE_JWKS_URL")
	if appleJWKSURL == "" {
		appleJWKSURL = "https://appleid.apple.com/auth/keys"
	}
	env := os.Getenv("ENV")
	if env == "" {
		env = os.Getenv("NODE_ENV")
	}
	mailSender := email.NewFromEnv()
	requireEmailVerification := os.Getenv("REQUIRE_EMAIL_VERIFICATION") == "true"
	if _, noEmailTransport := mailSender.(email.LogSender); noEmailTransport && requireEmailVerification {
		// Requiring verification without a working mail transport locks every
		// new account out of the platform, so the requirement is dropped.
		log.Printf("[Auth] REQUIRE_EMAIL_VERIFICATION ignored: no email transport is configured")
		requireEmailVerification = false
	}
	service := &AuthService{
		userRepo:                 userRepo,
		jwtSecret:                []byte(jwtSecret),
		httpClient:               &http.Client{Timeout: 10 * time.Second},
		googleClientID:           googleClientID,
		appleClientID:            appleClientID,
		googleTokenInfoURL:       tokenInfoURL,
		googleUserInfoURL:        userInfoURL,
		appleJWKSURL:             appleJWKSURL,
		isProduction:             env == "production",
		appleKeys:                make(map[string]*rsa.PublicKey),
		googleClientSecret:       os.Getenv("GOOGLE_CLIENT_SECRET"),
		googleTokenURL:           envOr("GOOGLE_TOKEN_URL", "https://oauth2.googleapis.com/token"),
		appleTokenURL:            envOr("APPLE_TOKEN_URL", "https://appleid.apple.com/auth/token"),
		appleTeamID:              os.Getenv("APPLE_TEAM_ID"),
		appleKeyID:               os.Getenv("APPLE_KEY_ID"),
		applePrivateKey:          strings.ReplaceAll(os.Getenv("APPLE_PRIVATE_KEY"), `\n`, "\n"),
		emailSender:              mailSender,
		publicAppURL:             email.PublicAppURL(),
		requireEmailVerification: requireEmailVerification,
		mailSlots:                make(chan struct{}, 8),
	}
	if len(oauthRepos) > 0 {
		service.oauthRepo = oauthRepos[0]
	}
	return service
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must contain at least 8 characters")
	}
	hasLetter, hasDigit := false, false
	for _, char := range password {
		switch {
		case char >= 'a' && char <= 'z', char >= 'A' && char <= 'Z':
			hasLetter = true
		case char >= '0' && char <= '9':
			hasDigit = true
		}
	}
	if !hasLetter || !hasDigit {
		return errors.New("password must contain at least one letter and one digit")
	}
	return nil
}

func trustedOAuthEmail(provider string) bool {
	return provider == "google" || provider == "apple"
}

type JWTClaims struct {
	UserID       string `json:"userId"`
	Email        string `json:"email"`
	Name         string `json:"name"`
	Role         string `json:"role"`
	TokenVersion int    `json:"ver"`
	jwt.RegisteredClaims
}

func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.User, string, error) {
	if req.Email == "" || req.Password == "" || req.Name == "" {
		return nil, "", errors.New("email, password, and name are required")
	}
	req.Email = normalizeEmail(req.Email)
	if err := validatePassword(req.Password); err != nil {
		return nil, "", err
	}

	// Check if user already exists
	if _, err := s.userRepo.GetByEmail(ctx, req.Email); err == nil {
		return nil, "", errors.New("user with this email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash password: %w", err)
	}

	locale := req.Locale
	if locale == "" {
		locale = "ru"
	}

	user := &models.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
		Role:         "student",
		AvatarURL:    "",
		Locale:       locale,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, "", fmt.Errorf("failed to create user: %w", err)
	}
	link, err := s.prepareVerificationEmail(ctx, user)
	if err != nil {
		log.Printf("[Auth] failed to prepare verification email: %v", err)
	} else {
		s.deliverVerificationEmailAsync(user.Email, link)
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return user, token, nil
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.User, string, error) {
	if req.Email == "" || req.Password == "" {
		return nil, "", errors.New("email and password are required")
	}
	req.Email = normalizeEmail(req.Email)

	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, "", errors.New("invalid email or password")
	}
	if s.requireEmailVerification && !user.EmailVerified {
		return nil, "", ErrEmailNotVerified
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return user, token, nil
}

func parseVKIDTokenPayload(idToken string) (sub, email, name, avatar string) {
	parts := strings.Split(idToken, ".")
	if len(parts) < 2 {
		return "", "", "", ""
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		payloadBytes, err = base64.URLEncoding.DecodeString(parts[1])
	}
	if err != nil {
		return "", "", "", ""
	}

	var claims struct {
		Sub       any    `json:"sub"`
		UserID    any    `json:"user_id"`
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Avatar    string `json:"avatar"`
		Picture   string `json:"picture"`
		User      struct {
			UserID    any    `json:"user_id"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
			Avatar    string `json:"avatar"`
		} `json:"user"`
	}
	if err := json.Unmarshal(payloadBytes, &claims); err == nil {
		if claims.Sub != nil {
			sub = fmt.Sprintf("%v", claims.Sub)
		} else if claims.UserID != nil {
			sub = fmt.Sprintf("%v", claims.UserID)
		} else if claims.User.UserID != nil {
			sub = fmt.Sprintf("%v", claims.User.UserID)
		}

		email = claims.Email
		if email == "" {
			email = claims.User.Email
		}

		fn := claims.FirstName
		if fn == "" {
			fn = claims.User.FirstName
		}
		ln := claims.LastName
		if ln == "" {
			ln = claims.User.LastName
		}
		name = strings.TrimSpace(fn + " " + ln)

		avatar = claims.Avatar
		if avatar == "" {
			avatar = claims.Picture
		}
		if avatar == "" {
			avatar = claims.User.Avatar
		}
	}
	return sub, email, name, avatar
}

// exchangeYandexOAuth exchanges an authorization code or token with Yandex API and retrieves the candidate profile
func (s *AuthService) exchangeYandexOAuth(ctx context.Context, code string) (string, string, string, string, error) {
	clientID := os.Getenv("YANDEX_CLIENT_ID")
	if clientID == "" {
		clientID = os.Getenv("NEXT_PUBLIC_YANDEX_CLIENT_ID")
	}
	clientSecret := os.Getenv("YANDEX_CLIENT_SECRET")

	accessToken := code
	client := &http.Client{Timeout: 10 * time.Second}

	// If client secret is provided and code is an auth code, exchange it for access token
	if clientSecret != "" && clientID != "" && !strings.HasPrefix(code, "yandex_token_") && !strings.HasPrefix(code, "y0_") {
		data := url.Values{}
		data.Set("grant_type", "authorization_code")
		data.Set("code", code)
		data.Set("client_id", clientID)
		data.Set("client_secret", clientSecret)

		req, err := http.NewRequestWithContext(ctx, "POST", envOr("YANDEX_TOKEN_URL", "https://oauth.yandex.ru/token"), strings.NewReader(data.Encode()))
		if err == nil {
			req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			resp, err := client.Do(req)
			if err == nil {
				defer resp.Body.Close()
				if resp.StatusCode == http.StatusOK {
					var tokenResp struct {
						AccessToken string `json:"access_token"`
					}
					if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err == nil && tokenResp.AccessToken != "" {
						accessToken = tokenResp.AccessToken
					}
				} else {
					body, _ := io.ReadAll(resp.Body)
					log.Printf("[YandexOAuth] Token exchange returned status %d: %s", resp.StatusCode, string(body))
				}
			}
		}
	}

	// Fetch user profile from Yandex Login API
	infoReq, err := http.NewRequestWithContext(ctx, "GET", envOr("YANDEX_USERINFO_URL", "https://login.yandex.ru/info?format=json"), nil)
	if err != nil {
		return "", "", "", "", err
	}
	infoReq.Header.Set("Authorization", "OAuth "+accessToken)

	resp, err := client.Do(infoReq)
	if err != nil {
		return "", "", "", "", fmt.Errorf("failed to fetch yandex user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", "", "", "", fmt.Errorf("yandex api returned status %d: %s", resp.StatusCode, string(body))
	}

	var profile struct {
		ID              string   `json:"id"`
		Login           string   `json:"login"`
		DisplayName     string   `json:"display_name"`
		RealName        string   `json:"real_name"`
		FirstName       string   `json:"first_name"`
		LastName        string   `json:"last_name"`
		DefaultEmail    string   `json:"default_email"`
		Emails          []string `json:"emails"`
		DefaultAvatarID string   `json:"default_avatar_id"`
		IsAvatarEmpty   bool     `json:"is_avatar_empty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return "", "", "", "", fmt.Errorf("failed to parse yandex profile: %w", err)
	}

	providerUID := profile.ID
	if providerUID == "" {
		providerUID = profile.Login
	}
	if providerUID == "" {
		return "", "", "", "", errors.New("не удалось определить идентификатор Яндекс профиля")
	}

	email := profile.DefaultEmail
	if email == "" && len(profile.Emails) > 0 {
		email = profile.Emails[0]
	}
	if email == "" {
		email = fmt.Sprintf("yandex_%s@oauth.det-academy.com", providerUID)
	}

	name := strings.TrimSpace(profile.RealName)
	if name == "" {
		name = strings.TrimSpace(profile.DisplayName)
	}
	if name == "" {
		name = strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	}
	if name == "" {
		name = strings.TrimSpace(profile.Login)
	}
	if name == "" {
		name = "Яндекс Студент"
	}

	avatarURL := ""
	if !profile.IsAvatarEmpty && profile.DefaultAvatarID != "" {
		avatarURL = fmt.Sprintf("https://avatars.yandex.net/get-yapic/%s/islands-200", profile.DefaultAvatarID)
	}

	return providerUID, email, name, avatarURL, nil
}

// exchangeVKID exchanges a VK ID authorization code with PKCE and retrieves candidate profile
func (s *AuthService) exchangeVKID(ctx context.Context, code, deviceID, codeVerifier, redirectURI string) (string, string, string, string, error) {
	clientID := os.Getenv("VK_CLIENT_ID")
	if clientID == "" {
		clientID = os.Getenv("NEXT_PUBLIC_VK_CLIENT_ID")
	}
	if clientID == "" {
		clientID = "54805089"
	}
	clientSecret := os.Getenv("VK_CLIENT_SECRET")
	if redirectURI == "" {
		redirectURI = "https://det-academy.ru/auth/callback"
	}

	accessToken := code
	var tokenEmail string
	var tokenUserID any
	var tokenIDToken string

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", clientID)
	data.Set("code", code)
	if redirectURI != "" {
		data.Set("redirect_uri", redirectURI)
	}
	if deviceID != "" {
		data.Set("device_id", deviceID)
	}
	if codeVerifier != "" {
		data.Set("code_verifier", codeVerifier)
	}
	if clientSecret != "" {
		data.Set("client_secret", clientSecret)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "POST", envOr("VK_TOKEN_URL", "https://id.vk.ru/oauth2/auth"), strings.NewReader(data.Encode()))
	if err == nil {
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			bodyBytes, _ := io.ReadAll(resp.Body)
			if resp.StatusCode == http.StatusOK {
				var tokenResp struct {
					AccessToken string `json:"access_token"`
					IDToken     string `json:"id_token"`
					UserID      any    `json:"user_id"`
					Email       string `json:"email"`
					Error       string `json:"error"`
					ErrorDesc   string `json:"error_description"`
				}
				if err := json.Unmarshal(bodyBytes, &tokenResp); err == nil {
					if tokenResp.AccessToken != "" {
						accessToken = tokenResp.AccessToken
					}
					tokenEmail = tokenResp.Email
					tokenUserID = tokenResp.UserID
					tokenIDToken = tokenResp.IDToken
				}
			} else {
				log.Printf("[VKID] Token exchange returned status %d: %s", resp.StatusCode, string(bodyBytes))
			}
		}
	}

	// 1. Try to extract user info from id_token JWT payload
	var sub, jwtEmail, jwtName, jwtAvatar string
	if tokenIDToken != "" {
		sub, jwtEmail, jwtName, jwtAvatar = parseVKIDTokenPayload(tokenIDToken)
	}

	uid := sub
	if uid == "" || uid == "<nil>" || uid == "0" {
		if tokenUserID != nil {
			uid = fmt.Sprintf("%v", tokenUserID)
		}
	}

	resolvedEmail := tokenEmail
	if resolvedEmail == "" {
		resolvedEmail = jwtEmail
	}
	resolvedName := jwtName
	resolvedAvatar := jwtAvatar

	// 2. If access token exists, fetch user info from VK ID /oauth2/user_info
	if accessToken != "" && accessToken != code {
		userData := url.Values{}
		userData.Set("client_id", clientID)
		userData.Set("access_token", accessToken)

		userReq, err := http.NewRequestWithContext(ctx, "POST", envOr("VK_USERINFO_URL", "https://id.vk.ru/oauth2/user_info"), strings.NewReader(userData.Encode()))
		if err == nil {
			userReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			userReq.Header.Set("Authorization", "Bearer "+accessToken)
			resp, err := client.Do(userReq)
			if err == nil {
				defer resp.Body.Close()
				if resp.StatusCode == http.StatusOK {
					var info struct {
						User struct {
							UserID    any    `json:"user_id"`
							FirstName string `json:"first_name"`
							LastName  string `json:"last_name"`
							Email     string `json:"email"`
							Avatar    string `json:"avatar"`
						} `json:"user"`
						FirstName string `json:"first_name"`
						LastName  string `json:"last_name"`
						Email     string `json:"email"`
						Avatar    string `json:"avatar"`
					}
					if err := json.NewDecoder(resp.Body).Decode(&info); err == nil {
						fn := info.User.FirstName
						if fn == "" {
							fn = info.FirstName
						}
						ln := info.User.LastName
						if ln == "" {
							ln = info.LastName
						}
						fetchedName := strings.TrimSpace(fn + " " + ln)
						if fetchedName != "" {
							resolvedName = fetchedName
						}
						fetchedEmail := info.User.Email
						if fetchedEmail == "" {
							fetchedEmail = info.Email
						}
						if fetchedEmail != "" {
							resolvedEmail = fetchedEmail
						}
						fetchedAvatar := info.User.Avatar
						if fetchedAvatar == "" {
							fetchedAvatar = info.Avatar
						}
						if fetchedAvatar != "" {
							resolvedAvatar = fetchedAvatar
						}
						fetchedUID := fmt.Sprintf("%v", info.User.UserID)
						if fetchedUID != "" && fetchedUID != "<nil>" && fetchedUID != "0" {
							uid = fetchedUID
						}
					}
				}
			}
		}
	}

	// 3. Fallback to classic users.get if access token is classic VK token
	if uid == "" || uid == "<nil>" || uid == "0" {
		apiURL := fmt.Sprintf("%s/method/users.get?v=5.131&fields=photo_200&access_token=%s", strings.TrimRight(envOr("VK_API_URL", "https://api.vk.com"), "/"), url.QueryEscape(accessToken))
		reqAPI, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
		if err == nil {
			resp, err := client.Do(reqAPI)
			if err == nil {
				defer resp.Body.Close()
				var classicResp struct {
					Response []struct {
						ID        int64  `json:"id"`
						FirstName string `json:"first_name"`
						LastName  string `json:"last_name"`
						Photo200  string `json:"photo_200"`
					} `json:"response"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&classicResp); err == nil && len(classicResp.Response) > 0 {
					u := classicResp.Response[0]
					resolvedName = strings.TrimSpace(u.FirstName + " " + u.LastName)
					uid = fmt.Sprintf("%d", u.ID)
					resolvedAvatar = u.Photo200
				}
			}
		}
	}

	// 4. Validate that we acquired a permanent VK user id
	if uid == "" || uid == "<nil>" || uid == "0" {
		return "", "", "", "", errors.New("не удалось получить идентификатор пользователя VK ID")
	}

	if resolvedEmail == "" {
		resolvedEmail = fmt.Sprintf("vk_%s@oauth.det-academy.com", uid)
	}
	if resolvedName == "" {
		resolvedName = "VK Пользователь"
	}

	return uid, resolvedEmail, resolvedName, resolvedAvatar, nil
}

// verifyGoogleToken verifies a Google ID token through tokeninfo and checks
// issuer, audience, expiry and email_verified. The userinfo fallback is only
// allowed outside production when no client ID is configured.
func (s *AuthService) verifyGoogleToken(ctx context.Context, token string) (uid, email, name, avatar string, err error) {
	if token == "" {
		return "", "", "", "", errors.New("google token is required")
	}

	reqURL := s.googleTokenInfoURL + "?id_token=" + url.QueryEscape(token)
	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err == nil {
		resp, err := s.httpClient.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				var info struct {
					Sub           string          `json:"sub"`
					Email         string          `json:"email"`
					EmailVerified json.RawMessage `json:"email_verified"`
					Name          string          `json:"name"`
					Picture       string          `json:"picture"`
					Iss           string          `json:"iss"`
					Aud           json.RawMessage `json:"aud"`
					Exp           json.RawMessage `json:"exp"`
				}
				if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&info); err == nil && info.Sub != "" {
					if info.Iss != "accounts.google.com" && info.Iss != "https://accounts.google.com" {
						return "", "", "", "", errors.New("google token has an invalid issuer")
					}
					if s.googleClientID != "" {
						if !claimContains(info.Aud, s.googleClientID) {
							return "", "", "", "", errors.New("google token was issued for another client")
						}
					} else if s.isProduction {
						return "", "", "", "", errors.New("google client id is not configured")
					}
					if exp, ok := claimInt64(info.Exp); ok && time.Now().Unix() >= exp {
						return "", "", "", "", errors.New("google token has expired")
					}
					if !claimBool(info.EmailVerified) {
						info.Email = ""
					}
					return info.Sub, info.Email, info.Name, info.Picture, nil
				}
			}
		}
	}

	// Access-token flow: valid only when no audience can be asserted. In
	// production this path is disabled so a token for another client cannot be
	// used to sign in.
	if s.isProduction || s.googleClientID != "" {
		return "", "", "", "", errors.New("недействительный или неподтверждённый токен Google")
	}
	reqUI, err := http.NewRequestWithContext(ctx, "GET", s.googleUserInfoURL, nil)
	if err != nil {
		return "", "", "", "", errors.New("недействительный или неподтверждённый токен Google")
	}
	reqUI.Header.Set("Authorization", "Bearer "+token)
	respUI, err := s.httpClient.Do(reqUI)
	if err != nil {
		return "", "", "", "", errors.New("не удалось проверить токен Google")
	}
	defer respUI.Body.Close()
	if respUI.StatusCode != http.StatusOK {
		return "", "", "", "", errors.New("недействительный или неподтверждённый токен Google")
	}
	var uiInfo struct {
		Sub     string `json:"sub"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(io.LimitReader(respUI.Body, 1<<20)).Decode(&uiInfo); err != nil || uiInfo.Sub == "" {
		return "", "", "", "", errors.New("недействительный или неподтверждённый токен Google")
	}
	return uiInfo.Sub, uiInfo.Email, uiInfo.Name, uiInfo.Picture, nil
}

func claimContains(raw json.RawMessage, expected string) bool {
	var single string
	if err := json.Unmarshal(raw, &single); err == nil {
		return single == expected
	}
	var multiple []string
	if err := json.Unmarshal(raw, &multiple); err == nil {
		for _, value := range multiple {
			if value == expected {
				return true
			}
		}
	}
	return false
}

func claimBool(raw json.RawMessage) bool {
	var boolean bool
	if err := json.Unmarshal(raw, &boolean); err == nil {
		return boolean
	}
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		return strings.EqualFold(text, "true")
	}
	return false
}

func claimInt64(raw json.RawMessage) (int64, bool) {
	var number json.Number
	if err := json.Unmarshal(raw, &number); err == nil {
		if value, err := number.Int64(); err == nil {
			return value, true
		}
	}
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		if value, err := strconv.ParseInt(text, 10, 64); err == nil {
			return value, true
		}
	}
	return 0, false
}

type appleJWKSResponse struct {
	Keys []struct {
		Kty string `json:"kty"`
		Kid string `json:"kid"`
		Use string `json:"use"`
		Alg string `json:"alg"`
		N   string `json:"n"`
		E   string `json:"e"`
	} `json:"keys"`
}

func (s *AuthService) fetchAppleKeys(ctx context.Context, force bool) (map[string]*rsa.PublicKey, error) {
	s.appleKeysMu.RLock()
	if !force && len(s.appleKeys) > 0 && time.Since(s.appleKeysFetchedAt) < time.Hour {
		copyKeys := make(map[string]*rsa.PublicKey, len(s.appleKeys))
		for keyID, key := range s.appleKeys {
			copyKeys[keyID] = key
		}
		s.appleKeysMu.RUnlock()
		return copyKeys, nil
	}
	s.appleKeysMu.RUnlock()

	req, err := http.NewRequestWithContext(ctx, "GET", s.appleJWKSURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("apple JWKS returned status %d", resp.StatusCode)
	}

	var payload appleJWKSResponse
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode apple JWKS: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey)
	for _, item := range payload.Keys {
		if item.Kty != "RSA" || item.Kid == "" {
			continue
		}
		modulusBytes, err := base64.RawURLEncoding.DecodeString(item.N)
		if err != nil {
			continue
		}
		exponentBytes, err := base64.RawURLEncoding.DecodeString(item.E)
		if err != nil || len(exponentBytes) == 0 {
			continue
		}
		exponent := 0
		for _, b := range exponentBytes {
			exponent = exponent<<8 + int(b)
		}
		if exponent < 3 {
			continue
		}
		keys[item.Kid] = &rsa.PublicKey{
			N: new(big.Int).SetBytes(modulusBytes),
			E: exponent,
		}
	}
	if len(keys) == 0 {
		return nil, errors.New("apple JWKS did not contain usable RSA keys")
	}

	s.appleKeysMu.Lock()
	s.appleKeys = keys
	s.appleKeysFetchedAt = time.Now()
	s.appleKeysMu.Unlock()
	return keys, nil
}

// verifyAppleToken verifies the Apple identity token signature via JWKS and
// checks issuer, audience, expiry and email verification.
func (s *AuthService) verifyAppleToken(ctx context.Context, token, expectedNonce string) (uid, email string, err error) {
	if token == "" {
		return "", "", errors.New("apple identity token is required")
	}
	if s.appleClientID == "" {
		return "", "", errors.New("apple client id is not configured")
	}

	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(parsedToken *jwt.Token) (interface{}, error) {
		keyID, _ := parsedToken.Header["kid"].(string)
		if keyID == "" {
			return nil, errors.New("apple token has no key id")
		}
		keys, keyErr := s.fetchAppleKeys(ctx, false)
		if keyErr == nil {
			if key, ok := keys[keyID]; ok {
				return key, nil
			}
		}
		keys, keyErr = s.fetchAppleKeys(ctx, true)
		if keyErr != nil {
			return nil, keyErr
		}
		key, ok := keys[keyID]
		if !ok {
			return nil, errors.New("apple signing key not found")
		}
		return key, nil
	}, jwt.WithValidMethods([]string{"RS256"}), jwt.WithIssuer("https://appleid.apple.com"), jwt.WithAudience(s.appleClientID), jwt.WithExpirationRequired())
	if err != nil || !parsed.Valid {
		return "", "", errors.New("недействительный или неподтверждённый токен Apple")
	}

	sub, _ := claims["sub"].(string)
	if sub == "" {
		return "", "", errors.New("apple token has no subject")
	}
	if expectedNonce != "" {
		nonce, _ := claims["nonce"].(string)
		if nonce != expectedNonce {
			return "", "", errors.New("apple token nonce mismatch")
		}
	}

	verified := false
	if value, ok := claims["email_verified"].(bool); ok {
		verified = value
	} else if value, ok := claims["email_verified"].(string); ok {
		verified = strings.EqualFold(value, "true")
	}
	if verified {
		email, _ = claims["email"].(string)
	}
	return sub, email, nil
}

// OAuthLogin handles login or registration via OAuth providers (Google, Apple, VK, Yandex)
// Requires genuine server-side verification with the provider. Arbitrary email logins are strictly rejected.
func (s *AuthService) OAuthLogin(ctx context.Context, req models.OAuthLoginRequest) (*models.User, string, error) {
	provider := strings.ToLower(strings.TrimSpace(req.Provider))
	if provider == "" {
		return nil, "", errors.New("провайдер авторизации обязателен")
	}

	authCodeOrToken := strings.TrimSpace(req.Code)
	if authCodeOrToken == "" {
		return nil, "", errors.New("код авторизации или токен провайдера обязателен")
	}

	var providerUID, resolvedEmail, resolvedName, resolvedAvatar string

	var transaction *models.OAuthTransaction
	if req.State != "" {
		consumed, err := s.consumeOAuthTransaction(ctx, req.State, provider)
		if err != nil {
			return nil, "", errors.New("oauth state is invalid or already used")
		}
		if consumed.Action != "login" {
			return nil, "", errors.New("oauth transaction is not for login")
		}
		transaction = consumed
		req.Nonce = consumed.Nonce
		req.RedirectURI = consumed.RedirectURI
		if req.CodeVerifier == "" {
			req.CodeVerifier = consumed.PKCEVerifier
		}
	} else if s.isProduction {
		return nil, "", errors.New("oauth state is required")
	}

	switch provider {
	case "yandex":
		pUID, pEmail, pName, pAvatar, err := s.exchangeYandexOAuth(ctx, authCodeOrToken)
		if err != nil {
			return nil, "", fmt.Errorf("ошибка авторизации через Яндекс ID: %w", err)
		}
		providerUID, resolvedEmail, resolvedName, resolvedAvatar = pUID, pEmail, pName, pAvatar
	case "vk":
		redirectURI := req.RedirectURI
		if redirectURI == "" {
			redirectURI = "https://det-academy.ru/auth/callback"
		}
		pUID, pEmail, pName, pAvatar, err := s.exchangeVKID(ctx, authCodeOrToken, req.DeviceID, req.CodeVerifier, redirectURI)
		if err != nil {
			return nil, "", fmt.Errorf("ошибка авторизации через VK ID: %w", err)
		}
		providerUID, resolvedEmail, resolvedName, resolvedAvatar = pUID, pEmail, pName, pAvatar
	case "google":
		var pUID, pEmail, pName, pAvatar string
		var err error
		if transaction != nil && !strings.Contains(authCodeOrToken, ".") {
			pUID, pEmail, pName, pAvatar, err = s.exchangeGoogleCode(ctx, transaction, authCodeOrToken)
		} else {
			pUID, pEmail, pName, pAvatar, err = s.verifyGoogleToken(ctx, authCodeOrToken)
		}
		if err != nil {
			return nil, "", fmt.Errorf("ошибка авторизации через Google: %w", err)
		}
		providerUID, resolvedEmail, resolvedName, resolvedAvatar = pUID, pEmail, pName, pAvatar
	case "apple":
		var pUID, pEmail string
		var err error
		if transaction != nil && !strings.Contains(authCodeOrToken, ".") {
			pUID, pEmail, err = s.exchangeAppleCode(ctx, transaction, authCodeOrToken)
		} else {
			pUID, pEmail, err = s.verifyAppleToken(ctx, authCodeOrToken, req.Nonce)
		}
		if err != nil {
			return nil, "", fmt.Errorf("ошибка авторизации через Apple ID: %w", err)
		}
		providerUID, resolvedEmail = pUID, pEmail
		resolvedName = "Apple Student"
	default:
		return nil, "", fmt.Errorf("неподдерживаемый провайдер авторизации: %s", provider)
	}

	if providerUID == "" {
		return nil, "", errors.New("не удалось подтвердить личность у внешнего провайдера")
	}

	// Helper to upgrade placeholder names / emails on login
	upgradeUserIfPlaceholder := func(u *models.User) {
		modified := false
		if resolvedName != "" && (u.Name == "" || u.Name == "Яндекс Студент" || u.Name == "VK Пользователь" || u.Name == "VK Студент" || u.Name == "OAuth Student") {
			u.Name = resolvedName
			modified = true
		}
		if resolvedEmail != "" && strings.Contains(u.Email, "@oauth.det-academy.com") && !strings.Contains(resolvedEmail, "@oauth.det-academy.com") {
			u.Email = resolvedEmail
			modified = true
		}
		if resolvedAvatar != "" && (u.AvatarURL == "" || strings.Contains(u.AvatarURL, "unsplash")) {
			u.AvatarURL = resolvedAvatar
			modified = true
		}
		if modified {
			_ = s.userRepo.Update(ctx, u)
		}
	}

	// 1. Try to find user by linked social account first (permanent providerUID)
	if sa, err := s.userRepo.GetSocialAccountByProviderUID(ctx, provider, providerUID); err == nil && sa != nil {
		if user, err := s.userRepo.GetByID(ctx, sa.UserID); err == nil && user != nil {
			upgradeUserIfPlaceholder(user)
			token, err := s.GenerateToken(user)
			if err != nil {
				return nil, "", fmt.Errorf("failed to generate token: %w", err)
			}
			return user, token, nil
		}
	}

	// 2. Fallback email/name normalization from verified provider identity ONLY
	if resolvedEmail == "" {
		resolvedEmail = fmt.Sprintf("%s_%s@oauth.det-academy.com", provider, providerUID)
	}
	if resolvedName == "" {
		switch provider {
		case "google":
			resolvedName = "Google Student"
		case "apple":
			resolvedName = "Apple Student"
		case "vk":
			resolvedName = "VK Пользователь"
		case "yandex":
			resolvedName = "Яндекс Студент"
		default:
			resolvedName = "OAuth Student"
		}
	}

	resolvedEmail = normalizeEmail(resolvedEmail)
	trustedEmail := trustedOAuthEmail(provider)

	// 3. Only Google/Apple currently prove email ownership. For VK/Yandex,
	// matching an existing password account by email would be an account
	// takeover primitive; require an explicit logged-in link instead.
	existingUser, err := s.userRepo.GetByEmail(ctx, resolvedEmail)
	if err == nil && existingUser != nil {
		if !trustedEmail {
			return nil, "", errors.New("email from this provider is not verified; sign in to your existing account to link it")
		}
		upgradeUserIfPlaceholder(existingUser)

		// Ensure social account link is stored
		_ = s.userRepo.LinkSocialAccount(ctx, &models.SocialAccount{
			ID:             uuid.New().String(),
			UserID:         existingUser.ID,
			Provider:       provider,
			ProviderUserID: providerUID,
			Email:          resolvedEmail,
			CreatedAt:      time.Now().UTC(),
		})

		token, err := s.GenerateToken(existingUser)
		if err != nil {
			return nil, "", fmt.Errorf("failed to generate token: %w", err)
		}
		return existingUser, token, nil
	}

	// 4. User does not exist -> Create new OAuth user
	newUser := &models.User{
		ID:            uuid.New().String(),
		Email:         resolvedEmail,
		PasswordHash:  "", // OAuth accounts do not have local passwords initially
		EmailVerified: trustedEmail && resolvedEmail != "",
		Name:          resolvedName,
		Role:          "student",
		AvatarURL:     resolvedAvatar,
		Locale:        "ru",
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}

	if err := s.userRepo.Create(ctx, newUser); err != nil {
		return nil, "", fmt.Errorf("failed to create oauth user: %w", err)
	}

	// Store social account link
	_ = s.userRepo.LinkSocialAccount(ctx, &models.SocialAccount{
		ID:             uuid.New().String(),
		UserID:         newUser.ID,
		Provider:       provider,
		ProviderUserID: providerUID,
		Email:          resolvedEmail,
		CreatedAt:      time.Now().UTC(),
	})

	token, err := s.GenerateToken(newUser)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return newUser, token, nil
}

func (s *AuthService) GetLinkedProviders(ctx context.Context, userID string) (*models.LinkedProvidersResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.New("пользователь не найден")
	}

	accounts, err := s.userRepo.GetSocialAccounts(ctx, userID)
	if err != nil {
		accounts = []models.SocialAccount{}
	}

	return &models.LinkedProvidersResponse{
		Providers:   accounts,
		HasPassword: user.PasswordHash != "",
		Email:       user.Email,
	}, nil
}

func (s *AuthService) SetPassword(ctx context.Context, userID string, req models.SetPasswordRequest) error {
	if err := validatePassword(req.NewPassword); err != nil {
		return err
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.New("пользователь не найден")
	}

	// If user already has a password, verify old password
	if user.PasswordHash != "" {
		if req.OldPassword == "" {
			return errors.New("укажите старый пароль для смены")
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
			return errors.New("неверный текущий пароль")
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("ошибка хеширования пароля: %w", err)
	}

	if err := s.userRepo.UpdatePassword(ctx, userID, string(hashedPassword)); err != nil {
		return err
	}
	if s.refreshRepo != nil {
		_ = s.refreshRepo.RevokeAllForUser(ctx, userID)
	}
	return nil
}

func (s *AuthService) LinkSocialAccount(ctx context.Context, userID string, req models.LinkProviderRequest) error {
	provider := strings.ToLower(strings.TrimSpace(req.Provider))
	if provider == "" {
		return errors.New("провайдер обязателен")
	}

	token := strings.TrimSpace(req.Code)
	if token == "" {
		token = strings.TrimSpace(req.Token)
	}
	if token == "" {
		return errors.New("код подтверждения или токен провайдера обязателен для привязки")
	}

	redirectURI := req.RedirectURI
	if redirectURI == "" {
		redirectURI = "https://det-academy.ru/auth/callback"
	}

	var transaction *models.OAuthTransaction
	if req.State != "" {
		consumed, err := s.consumeOAuthTransaction(ctx, req.State, provider)
		if err != nil {
			return errors.New("oauth state is invalid or already used")
		}
		if consumed.Action != "link" {
			return errors.New("oauth transaction is not for linking")
		}
		if consumed.UserID != "" && consumed.UserID != userID {
			return errors.New("oauth transaction belongs to another user")
		}
		transaction = consumed
		req.Nonce = consumed.Nonce
		redirectURI = consumed.RedirectURI
		if req.CodeVerifier == "" {
			req.CodeVerifier = consumed.PKCEVerifier
		}
	} else if s.isProduction {
		return errors.New("oauth state is required")
	}

	var providerUID, resolvedEmail, resolvedName, resolvedAvatar string
	switch provider {
	case "yandex":
		pUID, pEmail, pName, pAvatar, err := s.exchangeYandexOAuth(ctx, token)
		if err != nil {
			return fmt.Errorf("ошибка авторизации Яндекс ID: %w", err)
		}
		providerUID, resolvedEmail, resolvedName, resolvedAvatar = pUID, pEmail, pName, pAvatar
	case "vk":
		pUID, pEmail, pName, pAvatar, err := s.exchangeVKID(ctx, token, req.DeviceID, req.CodeVerifier, redirectURI)
		if err != nil {
			return fmt.Errorf("ошибка авторизации VK ID: %w", err)
		}
		providerUID, resolvedEmail, resolvedName, resolvedAvatar = pUID, pEmail, pName, pAvatar
	case "google":
		var pUID, pEmail, pName, pAvatar string
		var err error
		if transaction != nil && !strings.Contains(token, ".") {
			pUID, pEmail, pName, pAvatar, err = s.exchangeGoogleCode(ctx, transaction, token)
		} else {
			pUID, pEmail, pName, pAvatar, err = s.verifyGoogleToken(ctx, token)
		}
		if err != nil {
			return fmt.Errorf("ошибка авторизации Google: %w", err)
		}
		providerUID, resolvedEmail, resolvedName, resolvedAvatar = pUID, pEmail, pName, pAvatar
	case "apple":
		var pUID, pEmail string
		var err error
		if transaction != nil && !strings.Contains(token, ".") {
			pUID, pEmail, err = s.exchangeAppleCode(ctx, transaction, token)
		} else {
			pUID, pEmail, err = s.verifyAppleToken(ctx, token, req.Nonce)
		}
		if err != nil {
			return fmt.Errorf("ошибка авторизации Apple ID: %w", err)
		}
		providerUID, resolvedEmail = pUID, pEmail
	default:
		return fmt.Errorf("неподдерживаемый провайдер: %s", provider)
	}

	if providerUID == "" {
		return errors.New("не удалось определить идентификатор внешнего аккаунта")
	}

	// Check if this providerUID is already linked to another user
	if existing, err := s.userRepo.GetSocialAccountByProviderUID(ctx, provider, providerUID); err == nil && existing != nil {
		if existing.UserID != userID {
			return fmt.Errorf("данный аккаунт %s уже привязан к другому профилю", provider)
		}
		return nil // already linked to current user
	}

	// Upgrade user profile if placeholder
	if user, err := s.userRepo.GetByID(ctx, userID); err == nil && user != nil {
		modified := false
		if resolvedName != "" && (user.Name == "" || user.Name == "Яндекс Студент" || user.Name == "VK Пользователь" || user.Name == "VK Студент" || user.Name == "OAuth Student") {
			user.Name = resolvedName
			modified = true
		}
		if resolvedAvatar != "" && (user.AvatarURL == "" || strings.Contains(user.AvatarURL, "unsplash")) {
			user.AvatarURL = resolvedAvatar
			modified = true
		}
		if modified {
			_ = s.userRepo.Update(ctx, user)
		}
	}

	if resolvedEmail == "" {
		resolvedEmail = fmt.Sprintf("%s_%s@oauth.det-academy.com", provider, providerUID)
	}

	sa := &models.SocialAccount{
		ID:             uuid.New().String(),
		UserID:         userID,
		Provider:       provider,
		ProviderUserID: providerUID,
		Email:          resolvedEmail,
		CreatedAt:      time.Now().UTC(),
	}

	return s.userRepo.LinkSocialAccount(ctx, sa)
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID string, req models.UpdateProfileRequest) (*models.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, errors.New("пользователь не найден")
	}

	if strings.TrimSpace(req.Name) != "" {
		user.Name = strings.TrimSpace(req.Name)
	}
	if strings.TrimSpace(req.AvatarURL) != "" {
		user.AvatarURL = strings.TrimSpace(req.AvatarURL)
	}
	user.UpdatedAt = time.Now().UTC()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}

	return user, nil
}

func (s *AuthService) UnlinkSocialAccount(ctx context.Context, userID, provider string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.New("пользователь не найден")
	}

	accounts, err := s.userRepo.GetSocialAccounts(ctx, userID)
	if err != nil {
		return err
	}

	// Check if this provider is linked
	var isLinked bool
	for _, a := range accounts {
		if a.Provider == provider {
			isLinked = true
			break
		}
	}
	if !isLinked {
		return errors.New("аккаунт данного сервиса не привязан")
	}

	// Safety check: Cannot unlink if it's the only login method
	hasPassword := user.PasswordHash != ""
	if !hasPassword && len(accounts) <= 1 {
		return errors.New("нельзя отвязать единственный способ входа. Сначала установите пароль в настройках или привяжите другой аккаунт")
	}

	return s.userRepo.UnlinkSocialAccount(ctx, userID, provider)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

var ErrEmailNotVerified = errors.New("email is not verified")

// prepareVerificationEmail stores a fresh verification token and returns the
// link that has to be delivered. The database write stays synchronous so the
// verification flow is consistent as soon as Register returns; only the
// network delivery is asynchronous.
func (s *AuthService) prepareVerificationEmail(ctx context.Context, user *models.User) (string, error) {
	if user.EmailVerified || user.Email == "" {
		return "", nil
	}
	token, err := randomHex(32)
	if err != nil {
		return "", err
	}
	expires := time.Now().UTC().Add(24 * time.Hour)
	if err := s.userRepo.SetEmailVerification(ctx, user.ID, hashState(token), expires); err != nil {
		return "", err
	}
	return s.publicAppURL + "/auth/verify-email?token=" + token, nil
}

func (s *AuthService) sendVerificationEmail(ctx context.Context, user *models.User) error {
	link, err := s.prepareVerificationEmail(ctx, user)
	if err != nil || link == "" {
		return err
	}
	return s.emailSender.SendVerification(ctx, user.Email, link)
}

// emailDeliveryTimeout bounds one delivery attempt in the background.
const emailDeliveryTimeout = 10 * time.Second

// deliverVerificationEmailAsync sends an already prepared link in the
// background. A mail server that is slow or unreachable must not block the
// registration request, so the delivery runs with its own timeout and a
// bounded number of parallel attempts. It never touches the repository, which
// keeps it free of data races with the request handler.
func (s *AuthService) deliverVerificationEmailAsync(emailAddress, link string) {
	if link == "" || emailAddress == "" {
		return
	}
	select {
	case s.mailSlots <- struct{}{}:
	default:
		log.Printf("[Auth] verification email for %s skipped: too many pending deliveries", emailAddress)
		return
	}

	go func() {
		defer func() { <-s.mailSlots }()
		ctx, cancel := context.WithTimeout(context.Background(), emailDeliveryTimeout)
		defer cancel()
		if err := s.emailSender.SendVerification(ctx, emailAddress, link); err != nil {
			log.Printf("[Auth] failed to send verification email: %v", err)
		}
	}()
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) (*models.User, error) {
	if strings.TrimSpace(token) == "" {
		return nil, errors.New("verification token is required")
	}
	return s.userRepo.MarkEmailVerified(ctx, hashState(strings.TrimSpace(token)))
}

func (s *AuthService) ResendVerification(ctx context.Context, userID string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}
	if user.EmailVerified {
		return nil
	}
	return s.sendVerificationEmail(ctx, user)
}

func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	role := user.Role
	if role == "" {
		role = "student"
	}

	claims := JWTClaims{
		UserID:       user.ID,
		Email:        user.Email,
		Name:         user.Name,
		Role:         role,
		TokenVersion: user.TokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // short-lived access token
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "det-academy",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		user, userErr := s.userRepo.GetByID(context.Background(), claims.UserID)
		if userErr != nil {
			return nil, errors.New("user no longer exists")
		}
		if claims.TokenVersion != user.TokenVersion {
			return nil, errors.New("token has been revoked")
		}
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (s *AuthService) RevokeUserTokens(ctx context.Context, userID string) error {
	if s.refreshRepo != nil {
		_ = s.refreshRepo.RevokeAllForUser(ctx, userID)
	}
	return s.userRepo.IncrementTokenVersion(ctx, userID)
}

func (s *AuthService) SetRefreshTokenRepo(repo repository.RefreshTokenRepository) {
	s.refreshRepo = repo
}

func (s *AuthService) IssueRefreshToken(ctx context.Context, userID string) (string, error) {
	if s.refreshRepo == nil {
		return "", errors.New("refresh token store is not configured")
	}
	raw, err := randomHex(32)
	if err != nil {
		return "", err
	}
	token := &models.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    userID,
		TokenHash: hashState(raw),
		ExpiresAt: time.Now().UTC().Add(30 * 24 * time.Hour),
		CreatedAt: time.Now().UTC(),
	}
	if err := s.refreshRepo.Create(ctx, token); err != nil {
		return "", err
	}
	return raw, nil
}

func (s *AuthService) RefreshSession(ctx context.Context, rawToken string) (*models.User, string, string, error) {
	if s.refreshRepo == nil || strings.TrimSpace(rawToken) == "" {
		return nil, "", "", errors.New("refresh token is invalid")
	}
	hash := hashState(strings.TrimSpace(rawToken))
	stored, err := s.refreshRepo.GetByHash(ctx, hash)
	if err != nil {
		return nil, "", "", errors.New("refresh token is invalid or expired")
	}
	if stored.RevokedAt != nil {
		// Reuse of a revoked token means the family is compromised. Revoke all
		// refresh tokens and invalidate existing access tokens.
		_ = s.refreshRepo.RevokeAllForUser(ctx, stored.UserID)
		_ = s.userRepo.IncrementTokenVersion(ctx, stored.UserID)
		return nil, "", "", errors.New("refresh token is invalid or expired")
	}
	if stored.ExpiresAt.Before(time.Now().UTC()) {
		return nil, "", "", errors.New("refresh token is invalid or expired")
	}
	_ = s.refreshRepo.Revoke(ctx, hash)
	user, err := s.userRepo.GetByID(ctx, stored.UserID)
	if err != nil {
		return nil, "", "", errors.New("user not found")
	}
	access, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", "", err
	}
	refresh, err := s.IssueRefreshToken(ctx, user.ID)
	if err != nil {
		return nil, "", "", err
	}
	return user, access, refresh, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

func (s *AuthService) ListUsers(ctx context.Context, page, limit int, search, role string) ([]models.User, int, error) {
	return s.userRepo.ListAll(ctx, page, limit, search, role)
}

func (s *AuthService) UpdateUserRole(ctx context.Context, id, role string) error {
	if role != "student" && role != "editor" && role != "admin" {
		return errors.New("invalid role: must be student, editor, or admin")
	}
	return s.userRepo.UpdateRole(ctx, id, role)
}

func (s *AuthService) DeleteUser(ctx context.Context, id string) error {
	return s.userRepo.Delete(ctx, id)
}

// EnsureBootstrapAdmin creates the first administrator only when explicitly
// configured. It never promotes an existing user or creates a default account.
func (s *AuthService) EnsureBootstrapAdmin(ctx context.Context, email, password, name string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil
	}
	if len(password) < 12 {
		return errors.New("bootstrap admin password must be at least 12 characters")
	}
	email = normalizeEmail(email)
	if existing, err := s.userRepo.GetByEmail(ctx, email); err == nil && existing != nil {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if name == "" {
		name = "Administrator"
	}
	return s.userRepo.Create(ctx, &models.User{
		ID:           uuid.New().String(),
		Email:        email,
		PasswordHash: string(hash),
		Name:         name,
		Role:         "admin",
		Locale:       "ru",
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	})
}
