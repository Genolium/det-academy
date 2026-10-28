package tests

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"det-academy-backend/internal/handlers"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

func TestArenaWebSocketRequiresAuthOriginAndHijack(t *testing.T) {
	store := memory.New()
	authService := service.NewAuthService(store.Users(), "arena-test-secret", store.OAuthTransactions())
	user, err := store.Users().GetByEmail(context.Background(), "student@det-academy.com")
	if err != nil {
		t.Fatalf("load user: %v", err)
	}
	token, err := authService.GenerateToken(user)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}
	hub := handlers.NewArenaHub()
	go hub.Run()
	arenaHandler := handlers.NewArenaHandler(hub, store.Users(), store.Sessions())

	r := chi.NewRouter()
	r.Use(handlers.MetricsMiddleware)
	r.With(handlers.AuthMiddleware(authService)).Get("/arena/ws", arenaHandler.HandleWebSocket)
	server := httptest.NewServer(r)
	defer server.Close()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/arena/ws"

	// No token: the upgrade must never happen.
	_, response, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err == nil {
		t.Fatal("unauthenticated websocket unexpectedly upgraded")
	}
	if response == nil || response.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %#v", response)
	}

	// Authenticated but hostile origin: rejected by CheckOrigin.
	t.Setenv("ALLOWED_ORIGIN", "http://localhost:3000")
	headers := http.Header{}
	headers.Set("Authorization", "Bearer "+token)
	headers.Set("Origin", "http://evil.example")
	_, response, err = websocket.DefaultDialer.Dial(wsURL, headers)
	if err == nil {
		t.Fatal("hostile origin unexpectedly upgraded")
	}
	if response == nil || response.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 for hostile origin, got %#v", response)
	}

	// Trusted origin and token: the MetricsMiddleware wrapper must support
	// Hijack and the handler must accept the connection.
	headers.Set("Origin", "http://localhost:3000")
	conn, response, err := websocket.DefaultDialer.Dial(wsURL, headers)
	if err != nil {
		t.Fatalf("trusted websocket failed: %v response=%#v", err, response)
	}
	defer conn.Close()
	join, _ := json.Marshal(map[string]interface{}{
		"type":    "join_queue",
		"payload": map[string]interface{}{"playerName": "spoofed", "playerElo": 9999},
	})
	if err := conn.WriteMessage(websocket.TextMessage, join); err != nil {
		t.Fatalf("send join_queue: %v", err)
	}
	_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	_, message, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read match message: %v", err)
	}
	if !strings.Contains(string(message), "match_found") {
		t.Fatalf("unexpected websocket message: %s", message)
	}
}
