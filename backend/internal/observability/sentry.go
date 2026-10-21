package observability

import (
	"fmt"
	"net/http"
	"time"

	"github.com/getsentry/sentry-go"
)

// Init enables Sentry only when a DSN is configured. An empty DSN is a no-op,
// which keeps local development and tests independent from the provider.
func Init(dsn, environment, release string) error {
	if dsn == "" {
		return nil
	}
	if environment == "" {
		environment = "development"
	}
	return sentry.Init(sentry.ClientOptions{
		Dsn:              dsn,
		Environment:      environment,
		Release:          release,
		TracesSampleRate: 0,
	})
}

// Middleware attaches the request to the Sentry scope and captures panics.
// It re-panics so the outer chi Recoverer still returns the normal HTTP error.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub := sentry.CurrentHub().Clone()
		hub.Scope().SetRequest(r)
		ctx := sentry.SetHubOnContext(r.Context(), hub)
		defer func() {
			if recovered := recover(); recovered != nil {
				hub.CaptureException(fmt.Errorf("panic: %v", recovered))
				panic(recovered)
			}
		}()
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func Flush(timeout time.Duration) {
	sentry.Flush(timeout)
}

func CaptureClientError(message, stack, url, userAgent string) {
	hub := sentry.CurrentHub().Clone()
	hub.WithScope(func(scope *sentry.Scope) {
		scope.SetTag("source", "frontend")
		scope.SetExtra("stack", stack)
		scope.SetExtra("url", url)
		scope.SetExtra("user_agent", userAgent)
		hub.CaptureMessage(message)
	})
}
