package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"det-academy-backend/internal/ai"
)

// TTSHandler synthesises speech and keeps every generated file forever.
//
// The cache key is a hash of the provider, its voice/version and the text, so
// a file is synthesised exactly once. Audio is stored under MEDIA_UPLOAD_DIR
// (a persistent volume) and served with immutable caching headers.
type TTSHandler struct {
	Provider ai.TTSProvider
	Dir      string

	mu      sync.Mutex
	flights map[string]*sync.Mutex
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
	return &TTSHandler{Provider: provider, Dir: dir, flights: map[string]*sync.Mutex{}}
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
		writeTTSAudio(w, audio)
		return
	}

	// One synthesis per key: concurrent players of the same sentence wait for
	// the first result instead of paying for duplicate calls.
	lock := h.keyLock(key)
	lock.Lock()
	defer lock.Unlock()

	if audio, err := os.ReadFile(path); err == nil {
		writeTTSAudio(w, audio)
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
	writeTTSAudio(w, audio)
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

func (h *TTSHandler) keyLock(key string) *sync.Mutex {
	h.mu.Lock()
	defer h.mu.Unlock()
	lock, ok := h.flights[key]
	if !ok {
		lock = &sync.Mutex{}
		h.flights[key] = lock
	}
	return lock
}

func writeTTSAudio(w http.ResponseWriter, audio []byte) {
	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Cache-Control", ttsCacheControl)
	w.Header().Set("Content-Length", strconv.Itoa(len(audio)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(audio)
}
