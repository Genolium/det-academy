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
