package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Sender interface {
	SendVerification(ctx context.Context, to, link string) error
}

type LogSender struct{}

func (LogSender) SendVerification(ctx context.Context, to, link string) error {
	log.Printf("[email] verification link for %s: %s", to, link)
	return nil
}

type ResendSender struct {
	APIKey  string
	From    string
	BaseURL string
	Client  *http.Client
}

func (s *ResendSender) SendVerification(ctx context.Context, to, link string) error {
	payload := map[string]interface{}{
		"from":    s.From,
		"to":      []string{to},
		"subject": "Подтвердите email в DET Academy",
		"html": fmt.Sprintf(
			`<p>Здравствуйте!</p><p>Подтвердите email, чтобы сохранить прогресс и получать отчёты.</p><p><a href="%s">Подтвердить email</a></p><p>Ссылка действует 24 часа.</p>`,
			link,
		),
	}
	body, _ := json.Marshal(payload)
	baseURL := strings.TrimRight(s.BaseURL, "/")
	if baseURL == "" {
		baseURL = "https://api.resend.com"
	}
	req, err := http.NewRequestWithContext(ctx, "POST", baseURL+"/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("resend returned status %d", resp.StatusCode)
	}
	return nil
}

func NewFromEnv() Sender {
	if apiKey := strings.TrimSpace(os.Getenv("RESEND_API_KEY")); apiKey != "" {
		from := strings.TrimSpace(os.Getenv("EMAIL_FROM"))
		if from == "" {
			from = "DET Academy <noreply@det-academy.ru>"
		}
		baseURL := strings.TrimSpace(os.Getenv("RESEND_BASE_URL"))
		if baseURL == "" {
			baseURL = "https://api.resend.com"
		}
		return &ResendSender{APIKey: apiKey, From: from, BaseURL: baseURL, Client: &http.Client{Timeout: 10 * time.Second}}
	}
	return LogSender{}
}

func PublicAppURL() string {
	value := strings.TrimSpace(os.Getenv("PUBLIC_APP_URL"))
	if value == "" {
		return "https://det-academy.ru"
	}
	return strings.TrimRight(value, "/")
}
