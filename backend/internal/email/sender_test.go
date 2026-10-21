package email

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResendSenderPostsExpectedEnvelope(t *testing.T) {
	var received map[string]interface{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/emails" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer test-key" {
			t.Fatalf("unexpected authorization header")
		}
		if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
			t.Fatalf("decode body: %v", err)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	sender := &ResendSender{APIKey: "test-key", From: "DET <noreply@example.com>", BaseURL: server.URL, Client: server.Client()}
	if err := sender.SendVerification(context.Background(), "student@example.com", "https://example.com/verify?token=abc"); err != nil {
		t.Fatalf("send: %v", err)
	}
	if received["from"] != "DET <noreply@example.com>" {
		t.Fatalf("unexpected from: %v", received["from"])
	}
	to, ok := received["to"].([]interface{})
	if !ok || len(to) != 1 || to[0] != "student@example.com" {
		t.Fatalf("unexpected recipients: %v", received["to"])
	}
}

func TestResendSenderReportsNon2xx(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "provider down", http.StatusBadGateway)
	}))
	defer server.Close()
	sender := &ResendSender{APIKey: "test-key", From: "DET <noreply@example.com>", BaseURL: server.URL, Client: server.Client()}
	if err := sender.SendVerification(context.Background(), "student@example.com", "https://example.com"); err == nil {
		t.Fatal("expected provider error")
	}
}
