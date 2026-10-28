package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"det-academy-backend/internal/ai"
)

// TTSHandler synthesises speech and keeps every generated file forever.
//
// The cache key is a hash of the provider, its voice/version and the text, so
// a file is synthesised exactly once. Audio is stored under MEDIA_UPLOAD_DIR
// (a persistent volume) and served with immutable caching headers.
//
// The endpoint is public because the audio is part of the lessons, so two
// guards keep it from becoming a free text-to-speech proxy: cache hits are
// unlimited, while genuinely new sentences are capped per client and globally
// per day. The whole lesson bank is pre-generated on deploy, so a normal
// learner never triggers a paid synthesis.
type TTSHandler struct {
	Provider ai.TTSProvider
	Dir      string

	// NewPerIPPerDay and NewGlobalPerDay limit paid syntheses (0 = unlimited).
	NewPerIPPerDay  int
	NewGlobalPerDay int

	mu      sync.Mutex
	flights map[string]*ttsFlight

	quotaMu   sync.Mutex
	quotaDay  string
	quotaByIP map[string]int
	quotaAll  int
}

type ttsFlight struct {
	mu   sync.Mutex
	refs int
}

const (
	maxTTSTextRunes = 600
	ttsCacheControl = "public, max-age=31536000, immutable"
)

func NewTTSHandler(provider ai.TTSProvider, dir string) *TTSHandler {
	if strings.TrimSpace(dir) == "" {
		dir = "data/media/tts"
	}
	_ = os.MkdirAll(dir, 0o755)
	return &TTSHandler{
		Provider:        provider,
		Dir:             dir,
		NewPerIPPerDay:  envInt("TTS_NEW_PER_IP_PER_DAY", 200),
		NewGlobalPerDay: envInt("TTS_NEW_GLOBAL_PER_DAY", 2000),
		flights:         map[string]*ttsFlight{},
		quotaByIP:       map[string]int{},
	}
}

func (h *TTSHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h == nil || h.Provider == nil {
		RespondError(w, http.StatusServiceUnavailable, "speech synthesis is not configured")
		return
	}

	text := strings.TrimSpace(r.URL.Query().Get("text"))
	if text == "" {
		RespondError(w, http.StatusBadRequest, "text is required")
		return
	}
	if len([]rune(text)) > maxTTSTextRunes {
		RespondError(w, http.StatusBadRequest, "text is too long")
		return
	}

	key := h.cacheKey(text)
	path := filepath.Join(h.Dir, key+".mp3")
	if audio, err := os.ReadFile(path); err == nil {
		writeTTSAudio(w, audio, "hit")
		return
	}

	// One synthesis per key: concurrent players of the same sentence wait for
	// the first result instead of paying for duplicate calls.
	flight := h.acquire(key)
	flight.mu.Lock()
	defer func() {
		flight.mu.Unlock()
		h.release(key, flight)
	}()

	if audio, err := os.ReadFile(path); err == nil {
		writeTTSAudio(w, audio, "hit")
		return
	}

	if wait, ok := h.allowNewSynthesis(clientIP(r)); !ok {
		w.Header().Set("Retry-After", strconv.Itoa(int(wait.Seconds())))
		RespondError(w, http.StatusTooManyRequests, "speech synthesis limit reached")
		return
	}

	audio, _, err := h.Provider.Synthesize(r.Context(), text)
	if err != nil {
		RespondError(w, http.StatusBadGateway, "speech synthesis failed")
		return
	}
	if err := os.MkdirAll(h.Dir, 0o755); err != nil {
		RespondError(w, http.StatusInternalServerError, "speech cache is unavailable")
		return
	}
	tmp, err := os.CreateTemp(h.Dir, "tts-*")
	if err == nil {
		if _, writeErr := tmp.Write(audio); writeErr == nil {
			_ = tmp.Sync()
			_ = tmp.Close()
			_ = os.Rename(tmp.Name(), path)
		} else {
			_ = tmp.Close()
			_ = os.Remove(tmp.Name())
		}
	}
	writeTTSAudio(w, audio, "miss")
}

func (h *TTSHandler) cacheKey(text string) string {
	voice := ""
	version := ""
	if named, ok := h.Provider.(interface{ Name() string }); ok {
		version = named.Name()
	}
	if described, ok := h.Provider.(interface{ VoiceID() string }); ok {
		voice = described.VoiceID()
	}
	sum := sha256.Sum256([]byte(version + "|" + voice + "|" + text))
	return hex.EncodeToString(sum[:])
}

func (h *TTSHandler) acquire(key string) *ttsFlight {
	h.mu.Lock()
	defer h.mu.Unlock()
	flight, ok := h.flights[key]
	if !ok {
		flight = &ttsFlight{}
		h.flights[key] = flight
	}
	flight.refs++
	return flight
}

func (h *TTSHandler) release(key string, flight *ttsFlight) {
	h.mu.Lock()
	defer h.mu.Unlock()
	flight.refs--
	if flight.refs == 0 {
		delete(h.flights, key)
	}
}

// allowNewSynthesis implements a per-client and a global daily budget for paid
// syntheses. Cached audio never reaches this point, so repeated lessons are
// free regardless of traffic.
func (h *TTSHandler) allowNewSynthesis(ip string) (time.Duration, bool) {
	if h.NewGlobalPerDay <= 0 && h.NewPerIPPerDay <= 0 {
		return 0, true
	}
	today := time.Now().UTC().Format("2006-01-02")

	h.quotaMu.Lock()
	defer h.quotaMu.Unlock()

	if h.quotaDay != today {
		h.quotaDay = today
		h.quotaByIP = map[string]int{}
		h.quotaAll = 0
	}

	nextDay := time.Now().UTC().Truncate(24 * time.Hour).Add(24 * time.Hour)
	wait := time.Until(nextDay)

	if h.NewPerIPPerDay > 0 && h.quotaByIP[ip] >= h.NewPerIPPerDay {
		return wait, false
	}
	if h.NewGlobalPerDay > 0 && h.quotaAll >= h.NewGlobalPerDay {
		return wait, false
	}

	h.quotaByIP[ip]++
	h.quotaAll++
	return 0, true
}

func writeTTSAudio(w http.ResponseWriter, audio []byte, cacheState string) {
	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Cache-Control", ttsCacheControl)
	w.Header().Set("Content-Length", strconv.Itoa(len(audio)))
	w.Header().Set("X-TTS-Cache", cacheState)
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(audio)
}

// clientIP resolves the address of the caller behind the reverse proxy. The
// trusted nginx appends the real address to X-Forwarded-For, so the last entry
// is used: the first one can be supplied by the client and would let a script
// rotate its quota. The value is canonicalised so different textual forms of
// the same IPv6 address share one counter.
func clientIP(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		parts := strings.Split(forwarded, ",")
		for index := len(parts) - 1; index >= 0; index-- {
			if candidate := strings.TrimSpace(parts[index]); candidate != "" {
				return canonicalIP(candidate)
			}
		}
	}
	if host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr)); err == nil {
		return canonicalIP(host)
	}
	return canonicalIP(strings.TrimSpace(r.RemoteAddr))
}

func canonicalIP(value string) string {
	if parsed := net.ParseIP(value); parsed != nil {
		return parsed.String()
	}
	return value
}

func envInt(name string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < 0 {
		return fallback
	}
	return value
}
