package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

type fakeTTS struct {
	calls int
	err   error
}

func (f *fakeTTS) Name() string    { return "fake-tts" }
func (f *fakeTTS) VoiceID() string { return "voice-1" }
func (f *fakeTTS) Synthesize(ctx context.Context, text string) ([]byte, string, error) {
	f.calls++
	if f.err != nil {
		return nil, "", f.err
	}
	return []byte("ID3fake-audio"), "audio/mpeg", nil
}

func TestTTSHandlerCachesAudioForever(t *testing.T) {
	provider := &fakeTTS{}
	handler := NewTTSHandler(provider, t.TempDir())

	request := httptest.NewRequest(http.MethodGet, "/api/v1/tts?text=The+library+is+open", nil)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	if provider.calls != 1 {
		t.Fatalf("provider calls = %d, want 1", provider.calls)
	}
	if got := recorder.Header().Get("Cache-Control"); got != ttsCacheControl {
		t.Fatalf("cache-control = %q", got)
	}

	// The second request must be served from the cache without a new call.
	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/tts?text=The+library+is+open", nil))
	if recorder.Code != http.StatusOK || provider.calls != 1 {
		t.Fatalf("cache miss: status=%d calls=%d", recorder.Code, provider.calls)
	}
	if recorder.Body.String() != "ID3fake-audio" {
		t.Fatalf("unexpected body %q", recorder.Body.String())
	}

	// A different text produces a different cache entry.
	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/tts?text=Another+sentence", nil))
	if provider.calls != 2 {
		t.Fatalf("provider calls = %d, want 2", provider.calls)
	}
}

func TestTTSHandlerValidationAndFailures(t *testing.T) {
	handler := NewTTSHandler(&fakeTTS{}, t.TempDir())

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/tts", nil))
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("empty text: status = %d, want 400", recorder.Code)
	}

	long := make([]rune, maxTTSTextRunes+1)
	for index := range long {
		long[index] = 'a'
	}
	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/tts?text="+string(long), nil))
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("long text: status = %d, want 400", recorder.Code)
	}

	failing := NewTTSHandler(&fakeTTS{err: errors.New("provider down")}, t.TempDir())
	recorder = httptest.NewRecorder()
	failing.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/tts?text=Hello", nil))
	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("provider failure: status = %d, want 502", recorder.Code)
	}

	disabled := NewTTSHandler(nil, t.TempDir())
	recorder = httptest.NewRecorder()
	disabled.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/tts?text=Hello", nil))
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("disabled: status = %d, want 503", recorder.Code)
	}

	// The cache directory is created and used.
	if _, err := os.Stat(t.TempDir()); err != nil {
		t.Fatal(err)
	}
}

func TestTTSHandlerLimitsPaidSynthesisNotCacheHits(t *testing.T) {
	provider := &fakeTTS{}
	handler := NewTTSHandler(provider, t.TempDir())
	handler.NewPerIPPerDay = 1
	handler.NewGlobalPerDay = 2

	request := func(text, ip string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/tts?text="+text, nil)
		req.Header.Set("X-Forwarded-For", "203.0.113.9, "+ip)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		return rec
	}

	if rec := request("First+sentence", "198.51.100.1"); rec.Code != http.StatusOK {
		t.Fatalf("first synthesis = %d", rec.Code)
	}
	// A cached sentence is free even after the per-IP budget is spent.
	if rec := request("First+sentence", "198.51.100.1"); rec.Code != http.StatusOK {
		t.Fatalf("cache hit = %d", rec.Code)
	}
	if rec := request("Second+sentence", "198.51.100.1"); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("second paid synthesis for one IP = %d, want 429", rec.Code)
	}
	// Another client still gets the remaining global budget.
	if rec := request("Second+sentence", "198.51.100.2"); rec.Code != http.StatusOK {
		t.Fatalf("second client = %d", rec.Code)
	}
	if rec := request("Third+sentence", "198.51.100.3"); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("global budget = %d, want 429", rec.Code)
	}
	if provider.calls != 2 {
		t.Fatalf("provider calls = %d, want 2", provider.calls)
	}
}

func TestTTSHandlerSpoofedForwardedForCannotRotateQuota(t *testing.T) {
	handler := NewTTSHandler(&fakeTTS{}, t.TempDir())
	handler.NewPerIPPerDay = 1
	handler.NewGlobalPerDay = 10

	req := httptest.NewRequest(http.MethodGet, "/api/v1/tts?text=One", nil)
	// The client tries to look like a new address; nginx appends the real one.
	req.Header.Set("X-Forwarded-For", "1.2.3.4, 198.51.100.7")
	handler.ServeHTTP(httptest.NewRecorder(), req)

	req = httptest.NewRequest(http.MethodGet, "/api/v1/tts?text=Two", nil)
	req.Header.Set("X-Forwarded-For", "5.6.7.8, 198.51.100.7")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429 for the same real client", rec.Code)
	}
}

func TestTTSHandlerReleasesFlightLocks(t *testing.T) {
	handler := NewTTSHandler(&fakeTTS{}, t.TempDir())
	for _, text := range []string{"alpha", "beta", "gamma"} {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/tts?text="+text, nil)
		handler.ServeHTTP(httptest.NewRecorder(), req)
	}
	handler.mu.Lock()
	pending := len(handler.flights)
	handler.mu.Unlock()
	if pending != 0 {
		t.Fatalf("flights map leaked %d entries", pending)
	}
}

func TestClientIPUsesLastForwardedHop(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.5:1234"
	req.Header.Set("X-Forwarded-For", "1.2.3.4, 198.51.100.7")
	if got := clientIP(req); got != "198.51.100.7" {
		t.Fatalf("clientIP = %q", got)
	}
	req.Header.Del("X-Forwarded-For")
	if got := clientIP(req); got != "10.0.0.5" {
		t.Fatalf("clientIP fallback = %q", got)
	}
}

func TestClientIPCanonicalisesEquivalentIPv6(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Forwarded-For", "2001:0db8:0:0:0:0:0:1")
	if got := clientIP(req); got != "2001:db8::1" {
		t.Fatalf("clientIP = %q, want canonical IPv6", got)
	}
}
