package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"fmt"
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

// OAuthLogin handles login or registration via OAuth providers (Google, Apple, VK, Yandex)
func (s *AuthService) OAuthLogin(ctx context.Context, req models.OAuthLoginRequest) (*models.User, string, error) {
	provider := req.Provider
	if provider == "" {
		provider = "google"
	}

	email := req.Email
	name := req.Name
	avatarURL := req.AvatarURL

	// If email is not supplied directly, generate deterministic identity for OAuth code or provider
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

	// 1. Try to find existing user by email
	existingUser, err := s.userRepo.GetByEmail(ctx, email)
	if err == nil && existingUser != nil {
		// Update avatar if provided
		if avatarURL != "" && existingUser.AvatarURL == "" {
			existingUser.AvatarURL = avatarURL
			_ = s.userRepo.Update(ctx, existingUser)
		}

		token, err := s.GenerateToken(existingUser)
		if err != nil {
			return nil, "", fmt.Errorf("failed to generate token: %w", err)
		}
		return existingUser, token, nil
	}

	// 2. User does not exist -> Create new OAuth user
	newUser := &models.User{
		ID:           uuid.New().String(),
		Email:        email,
		PasswordHash: "", // OAuth accounts do not have local passwords
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

	token, err := s.GenerateToken(newUser)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return newUser, token, nil
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
