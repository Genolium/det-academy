package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestYandexOAuthContract(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/token":
			_ = json.NewEncoder(w).Encode(map[string]string{"access_token": "ya-token"})
		case "/info":
			if r.Header.Get("Authorization") != "OAuth ya-token" {
				t.Fatalf("unexpected yandex auth header: %s", r.Header.Get("Authorization"))
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"id": "ya-1", "default_email": "ya@example.com", "real_name": "Yandex User", "default_avatar_id": "avatar-1",
			})
		default:
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
	}))
	defer server.Close()

	t.Setenv("YANDEX_CLIENT_ID", "client")
	t.Setenv("YANDEX_CLIENT_SECRET", "secret")
	t.Setenv("YANDEX_TOKEN_URL", server.URL+"/token")
	t.Setenv("YANDEX_USERINFO_URL", server.URL+"/info")
	service := NewAuthService(nil, "test-secret")
	uid, email, name, avatar, err := service.exchangeYandexOAuth(context.Background(), "auth-code")
	if err != nil {
		t.Fatalf("yandex exchange: %v", err)
	}
	if uid != "ya-1" || email != "ya@example.com" || name != "Yandex User" || avatar == "" {
		t.Fatalf("unexpected yandex profile: %q %q %q %q", uid, email, name, avatar)
	}
}

func TestVKOAuthContract(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/auth":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"access_token": "vk-token", "user_id": 123})
		case "/user_info":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"user": map[string]interface{}{
					"user_id": 123, "first_name": "Ivan", "last_name": "Petrov",
					"email": "ivan@example.com", "avatar": "https://example.com/a.png",
				},
			})
		default:
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
	}))
	defer server.Close()

	t.Setenv("VK_CLIENT_ID", "client")
	t.Setenv("VK_CLIENT_SECRET", "secret")
	t.Setenv("VK_TOKEN_URL", server.URL+"/auth")
	t.Setenv("VK_USERINFO_URL", server.URL+"/user_info")
	service := NewAuthService(nil, "test-secret")
	uid, email, name, _, err := service.exchangeVKID(context.Background(), "code", "device", "verifier", "https://example.com/callback")
	if err != nil {
		t.Fatalf("vk exchange: %v", err)
	}
	if uid != "123" || email != "ivan@example.com" || name != "Ivan Petrov" {
		t.Fatalf("unexpected vk profile: %q %q %q", uid, email, name)
	}
}
