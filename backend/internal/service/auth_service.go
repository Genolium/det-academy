package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo  repository.UserRepository
	jwtSecret []byte
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: []byte(jwtSecret),
	}
}

type JWTClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.User, string, error) {
	if req.Email == "" || req.Password == "" || req.Name == "" {
		return nil, "", errors.New("email, password, and name are required")
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

	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return user, token, nil
}

// exchangeYandexOAuth exchanges an authorization code or token with Yandex API and retrieves the candidate profile
func (s *AuthService) exchangeYandexOAuth(ctx context.Context, code string) (string, string, string, string, error) {
	clientID := os.Getenv("YANDEX_CLIENT_ID")
	if clientID == "" {
		clientID = os.Getenv("NEXT_PUBLIC_YANDEX_CLIENT_ID")
	}
	clientSecret := os.Getenv("YANDEX_CLIENT_SECRET")

	accessToken := code
	// If client secret is provided and code is an auth code, exchange it for access token
	if clientSecret != "" && clientID != "" && !strings.HasPrefix(code, "yandex_token_") {
		data := url.Values{}
		data.Set("grant_type", "authorization_code")
		data.Set("code", code)
		data.Set("client_id", clientID)
		data.Set("client_secret", clientSecret)

		client := &http.Client{Timeout: 10 * time.Second}
		req, err := http.NewRequestWithContext(ctx, "POST", "https://oauth.yandex.ru/token", strings.NewReader(data.Encode()))
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
	client := &http.Client{Timeout: 10 * time.Second}
	infoReq, err := http.NewRequestWithContext(ctx, "GET", "https://login.yandex.ru/info?format=json", nil)
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

	email := profile.DefaultEmail
	if email == "" && len(profile.Emails) > 0 {
		email = profile.Emails[0]
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
	clientSecret := os.Getenv("VK_CLIENT_SECRET")
	if redirectURI == "" {
		redirectURI = "https://det-academy.ru/auth/callback"
	}

	accessToken := code
	var tokenEmail string
	var tokenUserID any

	// If clientID is provided, exchange authorization code with VK ID endpoint
	if clientID != "" {
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
		req, err := http.NewRequestWithContext(ctx, "POST", "https://id.vk.ru/oauth2/auth", strings.NewReader(data.Encode()))
		if err == nil {
			req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			resp, err := client.Do(req)
			if err == nil {
				defer resp.Body.Close()
				if resp.StatusCode == http.StatusOK {
					var tokenResp struct {
						AccessToken string `json:"access_token"`
						IDToken     string `json:"id_token"`
						UserID      any    `json:"user_id"`
						Email       string `json:"email"`
					}
					if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err == nil && tokenResp.AccessToken != "" {
						accessToken = tokenResp.AccessToken
						tokenEmail = tokenResp.Email
						tokenUserID = tokenResp.UserID
					}
				} else {
					body, _ := io.ReadAll(resp.Body)
					log.Printf("[VKID] Token exchange returned status %d: %s", resp.StatusCode, string(body))
				}
			}
		}
	}

	// Fetch user info from VK ID
	client := &http.Client{Timeout: 10 * time.Second}
	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("access_token", accessToken)

	userReq, err := http.NewRequestWithContext(ctx, "POST", "https://id.vk.ru/oauth2/user_info", strings.NewReader(data.Encode()))
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
						Phone     string `json:"phone"`
					} `json:"user"`
					FirstName string `json:"first_name"`
					LastName  string `json:"last_name"`
					Email     string `json:"email"`
					Avatar    string `json:"avatar"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&info); err == nil {
					firstName := info.User.FirstName
					if firstName == "" {
						firstName = info.FirstName
					}
					lastName := info.User.LastName
					if lastName == "" {
						lastName = info.LastName
					}
					email := info.User.Email
					if email == "" {
						email = info.Email
					}
					if email == "" {
						email = tokenEmail
					}
					avatar := info.User.Avatar
					if avatar == "" {
						avatar = info.Avatar
					}
					uid := fmt.Sprintf("%v", info.User.UserID)
					if uid == "" || uid == "<nil>" || uid == "0" {
						uid = fmt.Sprintf("%v", tokenUserID)
					}

					name := strings.TrimSpace(firstName + " " + lastName)
					if name != "" || email != "" {
						return uid, email, name, avatar, nil
					}
				}
			}
		}
	}

	// Fallback to classic VK API users.get
	apiURL := fmt.Sprintf("https://api.vk.com/method/users.get?v=5.131&fields=photo_200&access_token=%s", url.QueryEscape(accessToken))
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
				name := strings.TrimSpace(u.FirstName + " " + u.LastName)
				uid := fmt.Sprintf("%d", u.ID)
				return uid, tokenEmail, name, u.Photo200, nil
			}
		}
	}

	return fmt.Sprintf("%v", tokenUserID), tokenEmail, "", "", errors.New("unable to retrieve vk user details")
}

// OAuthLogin handles login or registration via OAuth providers (Google, Apple, VK, Yandex)
func (s *AuthService) OAuthLogin(ctx context.Context, req models.OAuthLoginRequest) (*models.User, string, error) {
	provider := req.Provider
	if provider == "" {
		provider = "google"
	}

	email := req.Email
	name := req.Name
	avatarURL := req.AvatarURL
	providerUID := req.Code
	if providerUID == "" {
		providerUID = email
	}

	// 1. Try real provider profile fetch if authorization code or token is supplied
	if provider == "yandex" && req.Code != "" {
		if pUID, pEmail, pName, pAvatar, err := s.exchangeYandexOAuth(ctx, req.Code); err == nil {
			if pUID != "" {
				providerUID = pUID
			}
			if pEmail != "" {
				email = pEmail
			}
			if pName != "" {
				name = pName
			}
			if pAvatar != "" {
				avatarURL = pAvatar
			}
		}
	} else if provider == "vk" && req.Code != "" {
		if pUID, pEmail, pName, pAvatar, err := s.exchangeVKID(ctx, req.Code, req.DeviceID, req.CodeVerifier, req.RedirectURI); err == nil {
			if pUID != "" {
				providerUID = pUID
			}
			if pEmail != "" {
				email = pEmail
			}
			if pName != "" {
				name = pName
			}
			if pAvatar != "" {
				avatarURL = pAvatar
			}
		}
	}

	// Helper to upgrade placeholder names / emails on login
	upgradeUserIfPlaceholder := func(u *models.User) {
		modified := false
		if name != "" && (u.Name == "" || u.Name == "Яндекс Студент" || u.Name == "VK Пользователь" || u.Name == "VK Студент" || u.Name == "OAuth Student") {
			u.Name = name
			modified = true
		}
		if email != "" && strings.Contains(u.Email, "@oauth.det-academy.com") && !strings.Contains(email, "@oauth.det-academy.com") {
			u.Email = email
			modified = true
		}
		if avatarURL != "" && (u.AvatarURL == "" || strings.Contains(u.AvatarURL, "unsplash")) {
			u.AvatarURL = avatarURL
			modified = true
		}
		if modified {
			_ = s.userRepo.Update(ctx, u)
		}
	}

	// 2. Try to find user by linked social account first
	if providerUID != "" {
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
	}

	// 3. Check if there is an existing user created with placeholder email for this code
	if req.Code != "" {
		legacyPlaceholderEmail := fmt.Sprintf("%s_%s@oauth.det-academy.com", provider, req.Code[:min(8, len(req.Code))])
		if legacyUser, err := s.userRepo.GetByEmail(ctx, legacyPlaceholderEmail); err == nil && legacyUser != nil {
			upgradeUserIfPlaceholder(legacyUser)
			_ = s.userRepo.LinkSocialAccount(ctx, &models.SocialAccount{
				ID:             uuid.New().String(),
				UserID:         legacyUser.ID,
				Provider:       provider,
				ProviderUserID: providerUID,
				Email:          legacyUser.Email,
				CreatedAt:      time.Now().UTC(),
			})
			token, err := s.GenerateToken(legacyUser)
			if err != nil {
				return nil, "", fmt.Errorf("failed to generate token: %w", err)
			}
			return legacyUser, token, nil
		}
	}

	// 4. If email is not supplied directly, generate deterministic identity for OAuth code or provider
	if email == "" {
		if req.Code != "" {
			email = fmt.Sprintf("%s_%s@oauth.det-academy.com", provider, req.Code[:min(8, len(req.Code))])
		} else {
			return nil, "", errors.New("oauth email or authorization code required")
		}
	}

	if name == "" {
		switch provider {
		case "google":
			name = "Google Student"
		case "apple":
			name = "Apple Student"
		case "vk":
			name = "VK Пользователь"
		case "yandex":
			name = "Яндекс Студент"
		default:
			name = "OAuth Student"
		}
	}

	// 5. Try to find existing user by email
	existingUser, err := s.userRepo.GetByEmail(ctx, email)
	if err == nil && existingUser != nil {
		upgradeUserIfPlaceholder(existingUser)

		// Ensure social account link is stored
		_ = s.userRepo.LinkSocialAccount(ctx, &models.SocialAccount{
			ID:             uuid.New().String(),
			UserID:         existingUser.ID,
			Provider:       provider,
			ProviderUserID: providerUID,
			Email:          email,
			CreatedAt:      time.Now().UTC(),
		})

		token, err := s.GenerateToken(existingUser)
		if err != nil {
			return nil, "", fmt.Errorf("failed to generate token: %w", err)
		}
		return existingUser, token, nil
	}

	// 6. User does not exist -> Create new OAuth user
	newUser := &models.User{
		ID:           uuid.New().String(),
		Email:        email,
		PasswordHash: "", // OAuth accounts do not have local passwords initially
		Name:         name,
		Role:         "student",
		AvatarURL:    avatarURL,
		Locale:       "ru",
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
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
		Email:          email,
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
	if len(req.NewPassword) < 6 {
		return errors.New("новый пароль должен содержать минимум 6 символов")
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

	return s.userRepo.UpdatePassword(ctx, userID, string(hashedPassword))
}

func (s *AuthService) LinkSocialAccount(ctx context.Context, userID string, req models.LinkProviderRequest) error {
	if req.Provider == "" {
		return errors.New("провайдер обязателен")
	}

	providerUID := req.ProviderUserID
	if providerUID == "" {
		providerUID = req.Code
	}
	if providerUID == "" {
		providerUID = req.Email
	}

	var resolvedEmail, resolvedName, resolvedAvatar string
	if req.Provider == "yandex" && req.Code != "" {
		if pUID, pEmail, pName, pAvatar, err := s.exchangeYandexOAuth(ctx, req.Code); err == nil {
			if pUID != "" {
				providerUID = pUID
			}
			resolvedEmail = pEmail
			resolvedName = pName
			resolvedAvatar = pAvatar
		}
	} else if req.Provider == "vk" && req.Code != "" {
		if pUID, pEmail, pName, pAvatar, err := s.exchangeVKID(ctx, req.Code, req.DeviceID, req.CodeVerifier, ""); err == nil {
			if pUID != "" {
				providerUID = pUID
			}
			resolvedEmail = pEmail
			resolvedName = pName
			resolvedAvatar = pAvatar
		}
	}

	if providerUID == "" {
		return errors.New("не удалось определить идентификатор внешнего аккаунта")
	}

	// Check if this providerUID is already linked to another user
	if existing, err := s.userRepo.GetSocialAccountByProviderUID(ctx, req.Provider, providerUID); err == nil && existing != nil {
		if existing.UserID != userID {
			return errors.New("этот социальный аккаунт уже привязан к другому профилю")
		}
		return nil // Already linked to current user
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

	linkEmail := req.Email
	if linkEmail == "" {
		linkEmail = resolvedEmail
	}

	sa := &models.SocialAccount{
		ID:             uuid.New().String(),
		UserID:         userID,
		Provider:       req.Provider,
		ProviderUserID: providerUID,
		Email:          linkEmail,
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

func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	role := user.Role
	if role == "" {
		role = "student"
	}

	claims := JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		Name:   user.Name,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
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
		return claims, nil
	}

	return nil, errors.New("invalid token")
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
