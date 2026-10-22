package email

import (
	"bufio"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"mime/quotedprintable"
	"net"
	"strings"
	"sync"
	"testing"
	"time"
)

// fakeSMTPServer is a minimal SMTP server used to verify the real client
// handshake, envelope and message delivery.
type fakeSMTPServer struct {
	listener net.Listener
	messages chan string
	authUsed chan string
	mu       sync.Mutex
}

func startFakeSMTPServer(t *testing.T) *fakeSMTPServer {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	server := &fakeSMTPServer{
		listener: listener,
		messages: make(chan string, 4),
		authUsed: make(chan string, 4),
	}
	go server.serve()
	t.Cleanup(func() { _ = listener.Close() })
	return server
}

func (s *fakeSMTPServer) hostPort() (string, int) {
	addr := s.listener.Addr().(*net.TCPAddr)
	return addr.IP.String(), addr.Port
}

func (s *fakeSMTPServer) serve() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			return
		}
		go s.handle(conn)
	}
}

func (s *fakeSMTPServer) handle(conn net.Conn) {
	defer conn.Close()
	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	write := func(format string, args ...interface{}) {
		_, _ = writer.WriteString(sprintf(format, args...))
		_ = writer.Flush()
	}

	write("220 fake ESMTP\r\n")

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			return
		}
		command := strings.TrimRight(line, "\r\n")
		upper := strings.ToUpper(command)

		switch {
		case strings.HasPrefix(upper, "EHLO"):
			write("250-fake greets you\r\n250 AUTH PLAIN\r\n")
		case strings.HasPrefix(upper, "HELO"):
			write("250 fake\r\n")
		case strings.HasPrefix(upper, "AUTH PLAIN"):
			parts := strings.Fields(command)
			payload := ""
			if len(parts) >= 3 {
				payload = parts[2]
			}
			decoded, _ := base64.StdEncoding.DecodeString(payload)
			s.mu.Lock()
			s.authUsed <- string(decoded)
			s.mu.Unlock()
			write("235 2.7.0 Authentication successful\r\n")
		case strings.HasPrefix(upper, "MAIL FROM"):
			write("250 2.1.0 Ok\r\n")
		case strings.HasPrefix(upper, "RCPT TO"):
			write("250 2.1.5 Ok\r\n")
		case upper == "DATA":
			write("354 End data with <CR><LF>.<CR><LF>\r\n")
			var body strings.Builder
			for {
				dataLine, err := reader.ReadString('\n')
				if err != nil {
					return
				}
				if strings.TrimRight(dataLine, "\r\n") == "." {
					break
				}
				body.WriteString(dataLine)
			}
			s.mu.Lock()
			s.messages <- body.String()
			s.mu.Unlock()
			write("250 2.0.0 Ok: queued\r\n")
		case upper == "QUIT":
			write("221 2.0.0 Bye\r\n")
			return
		default:
			write("250 2.0.0 Ok\r\n")
		}
	}
}

func sprintf(format string, args ...interface{}) string {
	if len(args) == 0 {
		return format
	}
	return fmt.Sprintf(format, args...)
}

func TestSMTPSenderDeliversVerificationMessage(t *testing.T) {
	server := startFakeSMTPServer(t)
	host, port := server.hostPort()

	sender := &SMTPSender{
		Host:    host,
		Port:    port,
		From:    "DET Academy <noreply@det-academy.ru>",
		Timeout: 5 * time.Second,
	}

	link := "https://det-academy.ru/verify?token=abc123"
	if err := sender.SendVerification(context.Background(), "student@example.com", link); err != nil {
		t.Fatalf("send: %v", err)
	}

	select {
	case body := <-server.messages:
		decoded, err := io.ReadAll(quotedprintable.NewReader(strings.NewReader(body)))
		if err != nil {
			t.Fatalf("decode body: %v", err)
		}
		if !strings.Contains(string(decoded), link) {
			t.Fatalf("message does not contain the verification link: %s", decoded)
		}
		if !strings.Contains(body, "Subject: =?UTF-8?") {
			t.Fatalf("subject is not encoded: %s", body)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("no message received")
	}
}

func TestSMTPSenderAuthenticatesWhenCredentialsAreSet(t *testing.T) {
	server := startFakeSMTPServer(t)
	host, port := server.hostPort()

	sender := &SMTPSender{
		Host:     host,
		Port:     port,
		Username: "mailer@det-academy.ru",
		Password: "secret",
		From:     "DET Academy <noreply@det-academy.ru>",
		Timeout:  5 * time.Second,
	}

	if err := sender.SendVerification(context.Background(), "student@example.com", "https://example.com/verify"); err != nil {
		t.Fatalf("send: %v", err)
	}

	select {
	case auth := <-server.authUsed:
		if !strings.Contains(auth, "mailer@det-academy.ru") {
			t.Fatalf("unexpected auth payload: %q", auth)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("no authentication attempt received")
	}
}

func TestSMTPSenderReportsUnreachableServer(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	addr := listener.Addr().(*net.TCPAddr)
	_ = listener.Close()

	sender := &SMTPSender{
		Host:    addr.IP.String(),
		Port:    addr.Port,
		From:    "DET Academy <noreply@det-academy.ru>",
		Timeout: 2 * time.Second,
	}
	if err := sender.SendVerification(context.Background(), "student@example.com", "https://example.com"); err == nil {
		t.Fatal("expected connection error")
	}
}

func TestNewFromEnvPrefersSMTP(t *testing.T) {
	t.Setenv("SMTP_HOST", "smtp.beget.com")
	t.Setenv("SMTP_PORT", "465")
	t.Setenv("SMTP_USERNAME", "mailer@det-academy.ru")
	t.Setenv("SMTP_PASSWORD", "secret")
	t.Setenv("SMTP_FROM", "DET Academy <noreply@det-academy.ru>")
	t.Setenv("RESEND_API_KEY", "resend-key")

	sender, ok := NewFromEnv().(*SMTPSender)
	if !ok {
		t.Fatalf("expected SMTP sender, got %T", NewFromEnv())
	}
	if sender.Host != "smtp.beget.com" || sender.Port != 465 {
		t.Fatalf("unexpected host/port: %s:%d", sender.Host, sender.Port)
	}
	if !sender.ImplicitTLS {
		t.Fatal("expected implicit TLS for port 465")
	}
}

func TestNewFromEnvFallsBackToResendThenLog(t *testing.T) {
	t.Setenv("SMTP_HOST", "")
	t.Setenv("RESEND_API_KEY", "resend-key")

	if _, ok := NewFromEnv().(*ResendSender); !ok {
		t.Fatalf("expected Resend sender, got %T", NewFromEnv())
	}

	t.Setenv("RESEND_API_KEY", "")
	if _, ok := NewFromEnv().(LogSender); !ok {
		t.Fatalf("expected log sender, got %T", NewFromEnv())
	}
}
