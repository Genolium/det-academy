package observability

import (
	"context"
	"testing"
	"time"

	"github.com/getsentry/sentry-go"
)

type captureTransport struct {
	events []*sentry.Event
}

func (t *captureTransport) Configure(sentry.ClientOptions) {}
func (t *captureTransport) SendEvent(event *sentry.Event) { t.events = append(t.events, event) }
func (t *captureTransport) Flush(time.Duration) bool      { return true }
func (t *captureTransport) FlushWithContext(context.Context) bool { return true }
func (t *captureTransport) Close()                        {}

func TestCaptureClientErrorSendsEventWhenConfigured(t *testing.T) {
	transport := &captureTransport{}
	client, err := sentry.NewClient(sentry.ClientOptions{
		Dsn:       "https://public@example.com/1",
		Transport: transport,
	})
	if err != nil {
		t.Fatalf("new sentry client: %v", err)
	}
	sentry.CurrentHub().BindClient(client)
	CaptureClientError("frontend-test-error", "stack", "/dashboard", "test-agent")
	sentry.Flush(2 * time.Second)
	if len(transport.events) == 0 {
		t.Fatal("expected a captured frontend event")
	}
	event := transport.events[0]
	if event.Message != "frontend-test-error" {
		t.Fatalf("unexpected message: %s", event.Message)
	}
	if event.Tags["source"] != "frontend" {
		t.Fatalf("unexpected source tag: %v", event.Tags)
	}
}
