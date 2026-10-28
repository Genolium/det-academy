package handlers

import (
	"bufio"
	"context"
	"crypto/subtle"
	"det-academy-backend/internal/repository"
	"det-academy-backend/internal/service"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

type rateBucket struct {
	windowStart time.Time
	count       int
}

type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*rateBucket
	limit   int
	window  time.Duration
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{buckets: make(map[string]*rateBucket), limit: limit, window: window}
}

func (l *rateLimiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	// Opportunistically drop expired buckets so a long-running process does
	// not retain one entry per address forever.
	for bucketKey, bucket := range l.buckets {
		if now.Sub(bucket.windowStart) > l.window {
			delete(l.buckets, bucketKey)
		}
	}
	bucket, ok := l.buckets[key]
	if !ok {
		l.buckets[key] = &rateBucket{windowStart: now, count: 1}
		return true
	}
	if bucket.count >= l.limit {
		return false
	}
	bucket.count++
	return true
}

var (
	rateLimitStoreMu sync.RWMutex
	rateLimitStore   repository.LimitRepository
)

// ConfigureRateLimitStore enables the PostgreSQL-backed limiter. Without it
// (unit tests, memory-only runs) the middleware falls back to the per-process
// map, which is only a development convenience.
func ConfigureRateLimitStore(repo repository.LimitRepository) {
	rateLimitStoreMu.Lock()
	defer rateLimitStoreMu.Unlock()
	rateLimitStore = repo
}

// RateLimitMiddleware is a small in-process limiter for auth/expensive routes.
// Production should additionally use nginx limit_req or a distributed limiter.
func RateLimitMiddleware(limit int, window time.Duration) func(http.Handler) http.Handler {
	limiter := newRateLimiter(limit, window)
	scope := fmt.Sprintf("http:%s", window.String())
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := clientIP(r)
			rateLimitStoreMu.RLock()
			store := rateLimitStore
			rateLimitStoreMu.RUnlock()

			if store != nil {
				bucket := scope + ":" + r.URL.Path
				start := time.Now().UTC().Truncate(window)
				if _, allowed, err := store.ConsumeWindow(r.Context(), bucket, key, start, limit); err == nil {
					if !allowed {
						RespondError(w, http.StatusTooManyRequests, "too many requests")
						return
					}
					next.ServeHTTP(w, r)
					return
				}
				// Database hiccup: fall through to the local limiter instead of
				// turning an outage into a total denial of service.
			}

			if !limiter.allow(key) {
				RespondError(w, http.StatusTooManyRequests, "too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

const (
	ClientIPContextKey   contextKey = "client_ip"
	DeviceHashContextKey contextKey = "device_hash"
)

// ClientIdentityMiddleware resolves the caller address and an optional device
// identifier once per request. The X-Device-Id value is untrusted: it is
// validated, then immediately replaced by a keyed hash. The raw identifier is
// never written to the context, a log or the database.
func ClientIdentityMiddleware(guard *service.LimitGuard) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), ClientIPContextKey, clientIP(r))
			if raw := strings.TrimSpace(r.Header.Get("X-Device-Id")); service.ValidDeviceID(raw) {
				if hash := guard.HashDeviceID(raw); hash != "" {
					ctx = context.WithValue(ctx, DeviceHashContextKey, hash)
				}
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequestIP returns the address resolved by ClientIdentityMiddleware. It falls
// back to the header parsing for routes mounted without the middleware (tests).
func RequestIP(r *http.Request) string {
	if value, ok := r.Context().Value(ClientIPContextKey).(string); ok && value != "" {
		return value
	}
	return clientIP(r)
}

// RequestDeviceHash returns the hashed device identifier, or "" when the
// header was absent or invalid.
func RequestDeviceHash(r *http.Request) string {
	if value, ok := r.Context().Value(DeviceHashContextKey).(string); ok {
		return value
	}
	return ""
}

// CheckDailyLimit enforces the IP/device quota for a scope and writes the
// response when the request must stop. A nil guard means "not configured".
func CheckDailyLimit(w http.ResponseWriter, r *http.Request, guard *service.LimitGuard, scope string) bool {
	if guard == nil {
		return true
	}
	err := guard.Allow(r.Context(), scope, RequestIP(r), RequestDeviceHash(r))
	if err == nil {
		return true
	}

	var exceeded *service.LimitExceededError
	if !errors.As(err, &exceeded) {
		RespondError(w, http.StatusServiceUnavailable, "daily limit check is temporarily unavailable")
		return false
	}

	retryAfter := service.SecondsUntilDailyReset()
	if retryAfter < 1 {
		retryAfter = 1
	}
	w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
	message := "daily limit reached for this IP address; try again after 00:00 UTC"
	if exceeded.Kind == "device" {
		message = "daily limit reached for this device; try again after 00:00 UTC"
	}
	RespondJSON(w, http.StatusTooManyRequests, map[string]interface{}{
		"error":         message,
		"code":          "daily_limit_reached",
		"scope":         exceeded.Scope,
		"limit":         exceeded.Kind,
		"limitValue":    exceeded.Limit,
		"retryAfterSec": retryAfter,
	})
	return false
}

// OriginGuardMiddleware rejects browser state-changing requests coming from
// an origin that is not explicitly trusted. Requests without Origin (CLI,
// server-to-server) are allowed and still require a bearer token/cookie.
func OriginGuardMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	allowedHosts := map[string]bool{}
	for _, origin := range allowedOrigins {
		if parsed, err := url.Parse(origin); err == nil && parsed.Hostname() != "" {
			allowedHosts[strings.ToLower(parsed.Hostname())] = true
		}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet, http.MethodHead, http.MethodOptions:
				next.ServeHTTP(w, r)
				return
			}
			origin := r.Header.Get("Origin")
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}
			parsed, err := url.Parse(origin)
			if err != nil || !allowedHosts[strings.ToLower(parsed.Hostname())] {
				RespondError(w, http.StatusForbidden, "origin is not allowed")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

var (
	metricRequests atomic.Int64
	metricErrors   atomic.Int64
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *statusRecorder) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := r.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, fmt.Errorf("underlying ResponseWriter does not support hijacking")
	}
	return hijacker.Hijack()
}

func (r *statusRecorder) Flush() {
	if flusher, ok := r.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(recorder, r)
		metricRequests.Add(1)
		if recorder.status >= 500 {
			metricErrors.Add(1)
		}
		if r.URL.Path != "/metrics" {
			// Keep a compact structured line without query strings or bodies.
			fmt.Printf("{\"level\":\"info\",\"msg\":\"request\",\"method\":%q,\"path\":%q,\"status\":%d,\"duration_ms\":%d,\"request_id\":%q}\n",
				r.Method, r.URL.Path, recorder.status, time.Since(start).Milliseconds(), chimiddleware.GetReqID(r.Context()))
		}
	})
}

// metricsAuthorized accepts a bearer token (or ?token=) when METRICS_TOKEN is
// configured. In production the endpoint is closed when the token is missing:
// metrics reveal traffic volume and queue state, so they must not be public by
// default. Local development keeps the open endpoint for convenience.
func metricsAuthorized(r *http.Request) bool {
	expected := strings.TrimSpace(os.Getenv("METRICS_TOKEN"))
	if expected == "" {
		return strings.ToLower(strings.TrimSpace(os.Getenv("ENV"))) != "production"
	}
	provided := ""
	if header := r.Header.Get("Authorization"); strings.HasPrefix(header, "Bearer ") {
		provided = strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	}
	if provided == "" {
		provided = r.URL.Query().Get("token")
	}
	return subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) == 1
}

func MetricsHandler(w http.ResponseWriter, r *http.Request) {
	if !metricsAuthorized(r) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	fmt.Fprintf(w, "# HELP det_requests_total Total HTTP requests\n")
	fmt.Fprintf(w, "# TYPE det_requests_total counter\n")
	fmt.Fprintf(w, "det_requests_total %d\n", metricRequests.Load())
	fmt.Fprintf(w, "# HELP det_errors_total Total 5xx responses\n")
	fmt.Fprintf(w, "# TYPE det_errors_total counter\n")
	fmt.Fprintf(w, "det_errors_total %d\n", metricErrors.Load())
	queued, processing, retryable, failed, oldest := service.EvaluationQueueMetrics()
	fmt.Fprintf(w, "# HELP det_evaluation_jobs_queued Evaluation jobs waiting to be claimed\n")
	fmt.Fprintf(w, "# TYPE det_evaluation_jobs_queued gauge\n")
	fmt.Fprintf(w, "det_evaluation_jobs_queued %d\n", queued)
	fmt.Fprintf(w, "det_evaluation_jobs_processing %d\n", processing)
	fmt.Fprintf(w, "det_evaluation_jobs_retryable_failed %d\n", retryable)
	fmt.Fprintf(w, "det_evaluation_jobs_permanently_failed %d\n", failed)
	fmt.Fprintf(w, "det_evaluation_jobs_oldest_processing_age_seconds %d\n", oldest)
}
