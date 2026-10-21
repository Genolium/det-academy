package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"det-academy-backend/internal/models"
)

func cookieFromResponse(t *testing.T, w *httptest.ResponseRecorder, name string) string {
	t.Helper()
	for _, cookie := range w.Result().Cookies() {
		if cookie.Name == name {
			return cookie.Value
		}
	}
	return ""
}

func postJSONWithToken(t *testing.T, r http.Handler, path, token string, body []byte) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestAuthHardeningNormalizesEmailAndPasswordPolicy(t *testing.T) {
	r, _, _ := setupTestRouter()
	registerBody, _ := json.Marshal(models.RegisterRequest{
		Email: "  Student@Example.COM ", Password: "strongpass1", Name: "Normalized Student",
	})
	register := postJSONWithToken(t, r, "/api/v1/auth/register", "", registerBody)
	if register.Code != http.StatusCreated {
		t.Fatalf("register normalized email: %d %s", register.Code, register.Body.String())
	}
	var auth models.AuthResponse
	_ = json.Unmarshal(register.Body.Bytes(), &auth)
	if auth.User.Email != "student@example.com" {
		t.Fatalf("email was not normalized: %q", auth.User.Email)
	}

	loginBody, _ := json.Marshal(models.LoginRequest{Email: "student@example.com", Password: "strongpass1"})
	login := postJSONWithToken(t, r, "/api/v1/auth/login", "", loginBody)
	if login.Code != http.StatusOK {
		t.Fatalf("login with normalized email: %d %s", login.Code, login.Body.String())
	}

	weakBody, _ := json.Marshal(models.RegisterRequest{Email: "weak@example.com", Password: "short", Name: "Weak"})
	weak := postJSONWithToken(t, r, "/api/v1/auth/register", "", weakBody)
	if weak.Code != http.StatusBadRequest {
		t.Fatalf("weak password must be rejected, got %d %s", weak.Code, weak.Body.String())
	}
}

func TestAuthHardeningRefreshReuseRevokesFamily(t *testing.T) {
	r, _, _ := setupTestRouter()
	loginBody, _ := json.Marshal(models.LoginRequest{Email: "student@det-academy.com", Password: "password123"})
	login := postJSONWithToken(t, r, "/api/v1/auth/login", "", loginBody)
	if login.Code != http.StatusOK {
		t.Fatalf("login: %d %s", login.Code, login.Body.String())
	}
	oldRefresh := cookieFromResponse(t, login, "det_refresh")
	if oldRefresh == "" {
		t.Fatal("login did not set det_refresh")
	}

	firstRefresh := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	firstRefresh.AddCookie(&http.Cookie{Name: "det_refresh", Value: oldRefresh})
	firstW := httptest.NewRecorder()
	r.ServeHTTP(firstW, firstRefresh)
	if firstW.Code != http.StatusOK {
		t.Fatalf("first refresh: %d %s", firstW.Code, firstW.Body.String())
	}
	newRefresh := cookieFromResponse(t, firstW, "det_refresh")
	if newRefresh == "" || newRefresh == oldRefresh {
		t.Fatal("refresh did not rotate the token")
	}

	reuse := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	reuse.AddCookie(&http.Cookie{Name: "det_refresh", Value: oldRefresh})
	reuseW := httptest.NewRecorder()
	r.ServeHTTP(reuseW, reuse)
	if reuseW.Code != http.StatusUnauthorized {
		t.Fatalf("reused refresh token must be rejected, got %d", reuseW.Code)
	}

	family := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	family.AddCookie(&http.Cookie{Name: "det_refresh", Value: newRefresh})
	familyW := httptest.NewRecorder()
	r.ServeHTTP(familyW, family)
	if familyW.Code != http.StatusUnauthorized {
		t.Fatalf("reuse must revoke the whole token family, got %d", familyW.Code)
	}
}

func TestAuthHardeningPasswordChangeRevokesRefresh(t *testing.T) {
	r, _, _ := setupTestRouter()
	loginBody, _ := json.Marshal(models.LoginRequest{Email: "student@det-academy.com", Password: "password123"})
	login := postJSONWithToken(t, r, "/api/v1/auth/login", "", loginBody)
	if login.Code != http.StatusOK {
		t.Fatalf("login: %d %s", login.Code, login.Body.String())
	}
	var auth models.AuthResponse
	_ = json.Unmarshal(login.Body.Bytes(), &auth)
	refresh := cookieFromResponse(t, login, "det_refresh")
	if refresh == "" {
		t.Fatal("login did not set refresh cookie")
	}

	passwordBody, _ := json.Marshal(models.SetPasswordRequest{OldPassword: "password123", NewPassword: "newpassword1"})
	change := postJSONWithToken(t, r, "/api/v1/auth/password", auth.Token, passwordBody)
	if change.Code != http.StatusOK {
		t.Fatalf("change password: %d %s", change.Code, change.Body.String())
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: "det_refresh", Value: refresh})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("password change must revoke old refresh tokens, got %d", w.Code)
	}
}

func TestOAuthHardeningDoesNotLinkUnverifiedVKEmail(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		switch req.URL.Path {
		case "/auth":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"access_token": "vk-token", "user_id": 123})
		case "/user_info":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"user": map[string]interface{}{
					"user_id": 123, "first_name": "Victim", "last_name": "User",
					"email": "victim@example.com", "avatar": "https://example.com/avatar.png",
				},
			})
		default:
			t.Fatalf("unexpected VK path: %s", req.URL.Path)
		}
	}))
	defer server.Close()
	t.Setenv("VK_CLIENT_ID", "client")
	t.Setenv("VK_CLIENT_SECRET", "secret")
	t.Setenv("VK_TOKEN_URL", server.URL+"/auth")
	t.Setenv("VK_USERINFO_URL", server.URL+"/user_info")

	r, authService, store := setupTestRouter()
	victim := &models.User{
		ID: "victim-user", Email: "victim@example.com", PasswordHash: "hash",
		Name: "Victim", Role: "student", Locale: "ru",
	}
	if err := store.Users().Create(context.Background(), victim); err != nil {
		t.Fatalf("create victim: %v", err)
	}

	_, _, err := authService.OAuthLogin(context.Background(), models.OAuthLoginRequest{
		Provider: "vk", Code: "auth-code", RedirectURI: "https://det-academy.ru/auth/callback",
	})
	if err == nil {
		t.Fatal("VK OAuth with an unverified email must not log into an existing password account")
	}
	accounts, _ := store.Users().GetSocialAccounts(context.Background(), victim.ID)
	if len(accounts) != 0 {
		t.Fatalf("victim account was linked: %+v", accounts)
	}
	_ = r
}
