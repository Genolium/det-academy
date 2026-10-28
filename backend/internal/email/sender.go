package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// Message is a single outgoing email.
type Message struct {
	To      string
	Subject string
	HTML    string
}

type Sender interface {
	Send(ctx context.Context, msg Message) error
	SendVerification(ctx context.Context, to, link string) error
}

// verificationHTML renders the account verification email body.
func verificationHTML(link string) string {
	return fmt.Sprintf(
		`<p>Здравствуйте!</p><p>Подтвердите email, чтобы сохранить прогресс и получать отчёты.</p><p><a href="%s">Подтвердить email</a></p><p>Ссылка действует 24 часа.</p>`,
		link,
	)
}

type LogSender struct{}

func (LogSender) Send(_ context.Context, msg Message) error {
	log.Printf("[email] %s (%d bytes)", msg.Subject, len(msg.HTML))
	return nil
}

func (l LogSender) SendVerification(ctx context.Context, to, link string) error {
	// Never log the verification link or the address: the link is a bearer
	// token for the account and mail logs are routinely shipped off-host.
	return l.Send(ctx, Message{To: to, Subject: "Подтвердите email в DET Academy", HTML: verificationHTML(link)})
}

type ResendSender struct {
	APIKey  string
	From    string
	BaseURL string
	Client  *http.Client
}

func (s *ResendSender) Send(ctx context.Context, msg Message) error {
	payload := map[string]interface{}{
		"from":    s.From,
		"to":      []string{msg.To},
		"subject": msg.Subject,
		"html":    msg.HTML,
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

func (s *ResendSender) SendVerification(ctx context.Context, to, link string) error {
	return s.Send(ctx, Message{
		To:      to,
		Subject: "Подтвердите email в DET Academy",
		HTML:    verificationHTML(link),
	})
}

// NewFromEnv builds the mail sender from the environment.
//
// SMTP is preferred because the project is hosted on Beget, where the mail
// account of the domain is provided as an SMTP service. The Resend API is kept
// as a fallback and the log sender is the last resort so that a missing
// configuration never breaks registration.
func NewFromEnv() Sender {
	// The Postbox HTTPS API is preferred when configured: it survives hosting
	// providers that block outbound SMTP ports and uses the same sender domain.
	if accessKey := strings.TrimSpace(os.Getenv("POSTBOX_ACCESS_KEY")); accessKey != "" {
		from := firstNonEmpty(
			os.Getenv("POSTBOX_FROM"),
			os.Getenv("SMTP_FROM"),
			os.Getenv("EMAIL_FROM"),
			"DET Academy <noreply@det-academy.ru>",
		)
		sender := &PostboxSender{
			AccessKey: accessKey,
			SecretKey: os.Getenv("POSTBOX_SECRET_KEY"),
			Region:    firstNonEmpty(os.Getenv("POSTBOX_REGION"), "ru-central1"),
			Endpoint:  firstNonEmpty(os.Getenv("POSTBOX_ENDPOINT"), "https://postbox.cloud.yandex.net"),
			From:      from,
			Client:    &http.Client{Timeout: 10 * time.Second},
		}
		log.Printf("[email] transport: Postbox HTTPS API (%s)", sender.endpoint())
		return sender
	}

	if host := strings.TrimSpace(os.Getenv("SMTP_HOST")); host != "" {
		from := firstNonEmpty(
			os.Getenv("SMTP_FROM"),
			os.Getenv("EMAIL_FROM"),
			"DET Academy <noreply@det-academy.ru>",
		)
		port := 587
		if raw := strings.TrimSpace(os.Getenv("SMTP_PORT")); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
				port = parsed
			}
		}
		sender := &SMTPSender{
			Host:        host,
			Port:        port,
			Username:    strings.TrimSpace(os.Getenv("SMTP_USERNAME")),
			Password:    os.Getenv("SMTP_PASSWORD"),
			From:        from,
			ImplicitTLS: port == 465 || isTruthy(os.Getenv("SMTP_IMPLICIT_TLS")),
			Timeout:     10 * time.Second,
		}
		log.Printf("[email] transport: SMTP %s (%s)", sender.address(), tlsMode(sender.ImplicitTLS))
		return sender
	}

	if apiKey := strings.TrimSpace(os.Getenv("RESEND_API_KEY")); apiKey != "" {
		from := firstNonEmpty(os.Getenv("EMAIL_FROM"), "DET Academy <noreply@det-academy.ru>")
		baseURL := firstNonEmpty(strings.TrimSpace(os.Getenv("RESEND_BASE_URL")), "https://api.resend.com")
		return &ResendSender{APIKey: apiKey, From: from, BaseURL: baseURL, Client: &http.Client{Timeout: 10 * time.Second}}
	}

	return LogSender{}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func isTruthy(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}

func tlsMode(implicit bool) string {
	if implicit {
		return "implicit TLS"
	}
	return "STARTTLS"
}

func PublicAppURL() string {
	value := strings.TrimSpace(os.Getenv("PUBLIC_APP_URL"))
	if value == "" {
		return "https://det-academy.ru"
	}
	return strings.TrimRight(value, "/")
}
