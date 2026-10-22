package email

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"mime"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

// SMTPSender delivers mail through a plain SMTP server. It supports both
// common deployment styles: implicit TLS (port 465) and STARTTLS (port 587).
type SMTPSender struct {
	Host        string
	Port        int
	Username    string
	Password    string
	From        string
	ImplicitTLS bool
	Timeout     time.Duration
}

func (s *SMTPSender) address() string {
	port := s.Port
	if port == 0 {
		port = 587
	}
	return net.JoinHostPort(s.Host, strconv.Itoa(port))
}

func (s *SMTPSender) timeout() time.Duration {
	if s.Timeout > 0 {
		return s.Timeout
	}
	return 10 * time.Second
}

// Send delivers a single message over SMTP.
func (s *SMTPSender) Send(ctx context.Context, msg Message) error {
	if strings.TrimSpace(s.Host) == "" {
		return errors.New("smtp: host is not configured")
	}
	if strings.TrimSpace(msg.To) == "" {
		return errors.New("smtp: recipient is empty")
	}

	from, err := senderAddress(s.From)
	if err != nil {
		return fmt.Errorf("smtp: invalid sender: %w", err)
	}
	recipient, err := mail.ParseAddress(msg.To)
	if err != nil {
		return fmt.Errorf("smtp: invalid recipient: %w", err)
	}

	addr := s.address()
	dialer := &net.Dialer{Timeout: s.timeout()}

	var conn net.Conn
	if s.ImplicitTLS {
		conn, err = tls.DialWithDialer(dialer, "tcp", addr, &tls.Config{
			ServerName: s.Host,
			MinVersion: tls.VersionTLS12,
		})
	} else {
		conn, err = dialer.DialContext(ctx, "tcp", addr)
	}
	if err != nil {
		return fmt.Errorf("smtp: dial %s: %w", addr, err)
	}
	defer conn.Close()

	deadline := time.Now().Add(s.timeout())
	if ctxDeadline, ok := ctx.Deadline(); ok && ctxDeadline.Before(deadline) {
		deadline = ctxDeadline
	}
	_ = conn.SetDeadline(deadline)

	client, err := smtp.NewClient(conn, s.Host)
	if err != nil {
		return fmt.Errorf("smtp: handshake with %s: %w", addr, err)
	}
	defer client.Close()

	if !s.ImplicitTLS {
		if ok, _ := client.Extension("STARTTLS"); ok {
			if err := client.StartTLS(&tls.Config{
				ServerName: s.Host,
				MinVersion: tls.VersionTLS12,
			}); err != nil {
				return fmt.Errorf("smtp: starttls with %s: %w", addr, err)
			}
		}
	}

	if s.Username != "" {
		if err := client.Auth(smtp.PlainAuth("", s.Username, s.Password, s.Host)); err != nil {
			return fmt.Errorf("smtp: authentication failed for %s: %w", s.Username, err)
		}
	}

	if err := client.Mail(from); err != nil {
		return fmt.Errorf("smtp: MAIL FROM rejected: %w", err)
	}
	if err := client.Rcpt(recipient.Address); err != nil {
		return fmt.Errorf("smtp: RCPT TO %s rejected: %w", recipient.Address, err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp: DATA rejected: %w", err)
	}
	if _, err := w.Write(buildRawMessage(s.From, msg)); err != nil {
		_ = w.Close()
		return fmt.Errorf("smtp: write message: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("smtp: close message body: %w", err)
	}

	if err := client.Quit(); err != nil {
		return fmt.Errorf("smtp: quit: %w", err)
	}
	return nil
}

// SendVerification sends the account verification email.
func (s *SMTPSender) SendVerification(ctx context.Context, to, link string) error {
	return s.Send(ctx, Message{
		To:      to,
		Subject: "Подтвердите email в DET Academy",
		HTML:    verificationHTML(link),
	})
}

// senderAddress extracts the bare address from a "Name <mail@host>" string.
func senderAddress(from string) (string, error) {
	trimmed := strings.TrimSpace(from)
	if trimmed == "" {
		return "", errors.New("sender address is empty")
	}
	parsed, err := mail.ParseAddress(trimmed)
	if err != nil {
		return "", err
	}
	return parsed.Address, nil
}

// buildRawMessage renders a MIME message. The subject is RFC 2047 encoded and
// the body is base64 encoded so that UTF-8 content survives every transport.
func buildRawMessage(from string, msg Message) []byte {
	fromHeader := strings.TrimSpace(from)
	if fromHeader == "" {
		fromHeader = "noreply@localhost"
	}

	var buf bytes.Buffer
	buf.WriteString("From: " + fromHeader + "\r\n")
	buf.WriteString("To: " + msg.To + "\r\n")
	buf.WriteString("Subject: " + mime.QEncoding.Encode("UTF-8", msg.Subject) + "\r\n")
	buf.WriteString("Date: " + time.Now().Format(time.RFC1123Z) + "\r\n")
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	buf.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
	buf.WriteString("\r\n")

	qp := quotedprintable.NewWriter(&buf)
	_, _ = qp.Write([]byte(msg.HTML))
	_ = qp.Close()

	return buf.Bytes()
}
