package email

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestPostboxSenderPostsSignedSESRequest(t *testing.T) {
	var captured postboxRequest
	var authorization string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v2/email/outbound-emails" {
			t.Errorf("path = %s", r.URL.Path)
		}
		authorization = r.Header.Get("Authorization")
		if !strings.HasPrefix(authorization, "AWS4-HMAC-SHA256 Credential=test-key/") {
			t.Errorf("authorization = %q", authorization)
		}
		if r.Header.Get("X-Amz-Date") == "" {
			t.Error("missing X-Amz-Date")
		}
		body, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(body, &captured); err != nil {
			t.Errorf("payload: %v", err)
		}
		w.Header().Set("content-type", "application/json")
		_, _ = w.Write([]byte(`{"MessageId":"msg-1"}`))
	}))
	defer server.Close()

	sender := &PostboxSender{
		AccessKey: "test-key",
		SecretKey: "test-secret",
		Endpoint:  server.URL,
		From:      "DET Academy <noreply@det-academy.example>",
		Client:    server.Client(),
	}
	if err := sender.Send(context.Background(), Message{
		To:      "student@example.com",
		Subject: "Weekly digest",
		HTML:    "<p>Hello <strong>student</strong></p>",
	}); err != nil {
		t.Fatalf("send: %v", err)
	}
	if captured.FromEmailAddress != "noreply@det-academy.example" {
		t.Fatalf("from = %q", captured.FromEmailAddress)
	}
	if len(captured.Destination.ToAddresses) != 1 || captured.Destination.ToAddresses[0] != "student@example.com" {
		t.Fatalf("to = %#v", captured.Destination.ToAddresses)
	}
	if captured.Content.Simple.Subject.Data != "Weekly digest" {
		t.Fatalf("subject = %q", captured.Content.Simple.Subject.Data)
	}
	if captured.Content.Simple.Body.HTML == nil || !strings.Contains(captured.Content.Simple.Body.HTML.Data, "student") {
		t.Fatalf("html body missing")
	}
	if captured.Content.Simple.Body.Text == nil || !strings.Contains(captured.Content.Simple.Body.Text.Data, "Hello") {
		t.Fatalf("text body = %#v", captured.Content.Simple.Body.Text)
	}
}

func TestPostboxSenderReportsHTTPError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"Code":"MessageRejected"}`, http.StatusBadRequest)
	}))
	defer server.Close()
	sender := &PostboxSender{AccessKey: "k", SecretKey: "s", Endpoint: server.URL, From: "noreply@example.com", Client: server.Client()}
	if err := sender.Send(context.Background(), Message{To: "student@example.com", Subject: "x"}); err == nil {
		t.Fatal("expected an error")
	}
}

func TestPostboxSignatureUsesExpectedScope(t *testing.T) {
	headers, err := signPostboxRequest(
		"key", "secret", "ru-central1", "postbox.cloud.yandex.net",
		"/v2/email/outbound-emails", []byte(`{}`),
		time.Date(2026, 10, 28, 12, 0, 0, 0, time.UTC),
	)
	if err != nil {
		t.Fatal(err)
	}
	if headers["X-Amz-Date"] != "20261028T120000Z" {
		t.Fatalf("date = %q", headers["X-Amz-Date"])
	}
	if !strings.Contains(headers["Authorization"], "/20261028/ru-central1/ses/aws4_request") {
		t.Fatalf("scope = %q", headers["Authorization"])
	}
}
