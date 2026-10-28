package handlers

import (
	"bufio"
	"crypto/subtle"
	"det-academy-backend/internal/service"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
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
	bucket, ok := l.buckets[key]
	if !ok || now.Sub(bucket.windowStart) > l.window {
		l.buckets[key] = &rateBucket{windowStart: now, count: 1}
		return true
	}
	if bucket.count >= l.limit {
		return false
	}
	bucket.count++
	return true
}

// RateLimitMiddleware is a small in-process limiter for auth/expensive routes.
// Production should additionally use nginx limit_req or a distributed limiter.
func RateLimitMiddleware(limit int, window time.Duration) func(http.Handler) http.Handler {
	limiter := newRateLimiter(limit, window)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !limiter.allow(clientIP(r)) {
				RespondError(w, http.StatusTooManyRequests, "too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
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
// configured. Without the variable the endpoint keeps its historical public
// behaviour so existing monitoring is not broken by the upgrade.
func metricsAuthorized(r *http.Request) bool {
	expected := strings.TrimSpace(os.Getenv("METRICS_TOKEN"))
	if expected == "" {
		return true
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
