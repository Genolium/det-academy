package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type AuthHandler struct {
	authService  *service.AuthService
	secureCookie bool
	limits       *service.LimitGuard
}

// SetLimitGuard enables the IP/device quota for login and registration.
func (h *AuthHandler) SetLimitGuard(guard *service.LimitGuard) {
	h.limits = guard
}

func NewAuthHandler(authService *service.AuthService, secureCookie ...bool) *AuthHandler {
	handler := &AuthHandler{authService: authService}
	if len(secureCookie) > 0 {
		handler.secureCookie = secureCookie[0]
	}
	return handler
}

func (h *AuthHandler) setAuthCookies(w http.ResponseWriter, r *http.Request, userID, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "det_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.secureCookie,
	})
	if refresh, err := h.authService.IssueRefreshToken(r.Context(), userID); err == nil && refresh != "" {
		http.SetCookie(w, &http.Cookie{
			Name:     "det_refresh",
			Value:    refresh,
			Path:     "/",
			Expires:  time.Now().Add(30 * 24 * time.Hour),
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
			Secure:   h.secureCookie,
		})
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if !CheckDailyLimit(w, r, h.limits, service.LimitScopeAuth) {
		return
	}
	var req models.RegisterRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10)).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, token, err := h.authService.Register(r.Context(), req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.setAuthCookies(w, r, user.ID, token)

	RespondJSON(w, http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if !CheckDailyLimit(w, r, h.limits, service.LimitScopeAuth) {
		return
	}
	var req models.LoginRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10)).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, token, err := h.authService.Login(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrEmailNotVerified) {
			RespondJSON(w, http.StatusForbidden, map[string]string{
				"error": "Email is not verified",
				"code":  "email_not_verified",
			})
			return
		}
		RespondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	h.setAuthCookies(w, r, user.ID, token)

	RespondJSON(w, http.StatusOK, models.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (h *AuthHandler) StartOAuth(w http.ResponseWriter, r *http.Request) {
	var req models.OAuthStartRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10)).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	userID := GetUserIDFromContext(r.Context())
	response, err := h.authService.StartOAuth(r.Context(), req, userID)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) OAuthLogin(w http.ResponseWriter, r *http.Request) {
	var req models.OAuthLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, token, err := h.authService.OAuthLogin(r.Context(), req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.setAuthCookies(w, r, user.ID, token)

	RespondJSON(w, http.StatusOK, models.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	user, err := h.authService.GetUserByID(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusNotFound, "user not found")
		return
	}

	RespondJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.authService.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("det_refresh")
	if err != nil || cookie.Value == "" {
		RespondError(w, http.StatusUnauthorized, "refresh token is missing")
		return
	}
	user, access, refreshToken, err := h.authService.RefreshSession(r.Context(), cookie.Value)
	if err != nil {
		RespondError(w, http.StatusUnauthorized, "refresh token is invalid or expired")
		return
	}
	h.setAuthCookies(w, r, user.ID, access)
	if refreshToken != "" {
		http.SetCookie(w, &http.Cookie{
			Name: "det_refresh", Value: refreshToken, Path: "/",
			Expires: time.Now().Add(30 * 24 * time.Hour), HttpOnly: true,
			SameSite: http.SameSiteLaxMode, Secure: h.secureCookie,
		})
	}
	RespondJSON(w, http.StatusOK, models.AuthResponse{Token: access, User: *user})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if userID := GetUserIDFromContext(r.Context()); userID != "" {
		_ = h.authService.RevokeUserTokens(r.Context(), userID)
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "det_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "det_refresh",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.secureCookie,
	})

	RespondJSON(w, http.StatusOK, map[string]string{"message": "successfully logged out"})
}

func (h *AuthHandler) GetLinkedProviders(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	resp, err := h.authService.GetLinkedProviders(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) SetPassword(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req models.SetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.authService.SetPassword(r.Context(), userID, req); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"message": "пароль успешно сохранён"})
}

func (h *AuthHandler) LinkProvider(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req models.LinkProviderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.authService.LinkSocialAccount(r.Context(), userID, req); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"message": "социальный аккаунт успешно привязан"})
}

func (h *AuthHandler) UnlinkProvider(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	provider := chi.URLParam(r, "provider")
	if provider == "" {
		RespondError(w, http.StatusBadRequest, "provider parameter is required")
		return
	}

	if err := h.authService.UnlinkSocialAccount(r.Context(), userID, provider); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"message": "привязка успешно удалена"})
}

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&payload); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	user, err := h.authService.VerifyEmail(r.Context(), payload.Token)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "verification link is invalid or expired")
		return
	}
	RespondJSON(w, http.StatusOK, map[string]interface{}{"status": "verified", "user": user})
}

func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	if err := h.authService.ResendVerification(r.Context(), userID); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}
