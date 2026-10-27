package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

// SpeechKitTranscriber recognises speech with Yandex SpeechKit.
//
// WebM/Opus recordings from the browser are not accepted by SpeechKit, so
// ffmpeg converts them to 16 kHz mono OggOpus and splits them into short
// chunks. SpeechKit's synchronous endpoint accepts up to 30 seconds and 1 MB
// per request, while DET answers last up to three minutes, hence the split.
type SpeechKitTranscriber struct {
	APIKey   string
	FolderID string
	Lang     string
	Endpoint string
	// ChunkSeconds is the maximum audio per request (default 20).
	ChunkSeconds int
	Client       *http.Client
	// Split is injectable for tests; by default it runs ffmpeg.
	Split func(ctx context.Context, audioPath string) (chunks []string, cleanup func(), err error)
}

func NewSpeechKitTranscriber(apiKey, folderID, lang string) *SpeechKitTranscriber {
	if strings.TrimSpace(lang) == "" {
		lang = "en-US"
	}
	return &SpeechKitTranscriber{
		APIKey:       apiKey,
		FolderID:     folderID,
		Lang:         lang,
		Endpoint:     "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize",
		ChunkSeconds: 20,
		Client:       &http.Client{Timeout: 90 * time.Second},
	}
}

func (s *SpeechKitTranscriber) Name() string { return "yandex-speechkit" }

// Transcribe returns the concatenated recognition of every chunk.
func (s *SpeechKitTranscriber) Transcribe(ctx context.Context, audioPath, mimeType string) (string, error) {
	if strings.TrimSpace(s.APIKey) == "" || strings.TrimSpace(s.FolderID) == "" {
		return "", errors.New("speechkit: AI_STT_API_KEY/AI_FOLDER_ID are required")
	}
	if strings.TrimSpace(audioPath) == "" {
		return "", errors.New("speechkit: audio path is empty")
	}

	split := s.Split
	if split == nil {
		split = s.splitWithFFmpeg
	}
	chunks, cleanup, err := split(ctx, audioPath)
	if err != nil {
		return "", err
	}
	defer cleanup()

	parts := make([]string, 0, len(chunks))
	for _, chunk := range chunks {
		text, err := s.recognizeChunk(ctx, chunk)
		if err != nil {
			return "", err
		}
		if text != "" {
			parts = append(parts, text)
		}
	}
	transcript := strings.TrimSpace(strings.Join(parts, " "))
	if transcript == "" {
		return "", errors.New("speechkit: empty recognition result")
	}
	return transcript, nil
}

func (s *SpeechKitTranscriber) recognizeChunk(ctx context.Context, chunkPath string) (string, error) {
	file, err := os.Open(chunkPath)
	if err != nil {
		return "", fmt.Errorf("speechkit: open chunk: %w", err)
	}
	defer file.Close()

	endpoint, err := url.Parse(s.Endpoint)
	if err != nil {
		return "", fmt.Errorf("speechkit: invalid endpoint: %w", err)
	}
	query := endpoint.Query()
	query.Set("folderId", s.FolderID)
	query.Set("lang", s.Lang)
	query.Set("format", "oggopus")
	endpoint.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint.String(), file)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Api-Key "+s.APIKey)
	req.Header.Set("Content-Type", "audio/ogg")

	resp, err := s.Client.Do(req)
	if err != nil {
		return "", fmt.Errorf("speechkit: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("speechkit returned %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	var payload struct {
		Result string `json:"result"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "", fmt.Errorf("speechkit: invalid response: %w", err)
	}
	return strings.TrimSpace(payload.Result), nil
}

// splitWithFFmpeg converts any supported input to 16 kHz mono OggOpus and cuts
// it into chunks of at most ChunkSeconds.
func (s *SpeechKitTranscriber) splitWithFFmpeg(ctx context.Context, audioPath string) ([]string, func(), error) {
	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		return nil, func() {}, errors.New("speechkit: ffmpeg is required to convert WebM audio")
	}

	dir, err := os.MkdirTemp("", "speechkit-*")
	if err != nil {
		return nil, func() {}, err
	}
	cleanup := func() { _ = os.RemoveAll(dir) }

	chunkSeconds := s.ChunkSeconds
	if chunkSeconds <= 0 || chunkSeconds > 30 {
		chunkSeconds = 20
	}
	pattern := filepath.Join(dir, "chunk_%03d.ogg")
	args := []string{
		"-hide_banner", "-loglevel", "error", "-y",
		"-i", audioPath,
		"-ac", "1", "-ar", "16000",
		"-c:a", "libopus", "-b:a", "32k",
		"-f", "segment",
		"-segment_time", strconv.Itoa(chunkSeconds),
		"-reset_timestamps", "1",
		pattern,
	}
	cmd := exec.CommandContext(ctx, ffmpegPath, args...)
	if output, err := cmd.CombinedOutput(); err != nil {
		cleanup()
		return nil, func() {}, fmt.Errorf("speechkit: ffmpeg failed: %w (%s)", err, strings.TrimSpace(string(output)))
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		cleanup()
		return nil, func() {}, err
	}
	chunks := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".ogg") {
			chunks = append(chunks, filepath.Join(dir, entry.Name()))
		}
	}
	sort.Strings(chunks)
	if len(chunks) == 0 {
		cleanup()
		return nil, func() {}, errors.New("speechkit: no audio chunks were produced")
	}
	return chunks, cleanup, nil
}

// NewTranscriberFromEnv builds the speech recogniser.
//
// AI_STT_PROVIDER selects the implementation:
//   - yandex_speechkit — Yandex SpeechKit (API key + folder id);
//   - anything else    — the OpenAI-compatible /audio/transcriptions endpoint.
//
// It returns nil when speech recognition is disabled.
func NewTranscriberFromEnv() Transcriber {
	if strings.ToLower(strings.TrimSpace(os.Getenv("AI_STT_ENABLED"))) != "true" {
		return nil
	}

	provider := strings.ToLower(strings.TrimSpace(os.Getenv("AI_STT_PROVIDER")))
	if provider == "yandex_speechkit" || provider == "speechkit" {
		key := strings.TrimSpace(os.Getenv("AI_STT_API_KEY"))
		if key == "" {
			key = strings.TrimSpace(os.Getenv("YANDEX_STT_API_KEY"))
		}
		if key == "" {
			key = strings.TrimSpace(os.Getenv("AI_API_KEY"))
		}
		folder := strings.TrimSpace(os.Getenv("AI_FOLDER_ID"))
		speechkit := NewSpeechKitTranscriber(key, folder, strings.TrimSpace(os.Getenv("AI_STT_LANG")))
		if endpoint := strings.TrimSpace(os.Getenv("AI_STT_ENDPOINT")); endpoint != "" {
			speechkit.Endpoint = endpoint
		}
		if chunk := strings.TrimSpace(os.Getenv("AI_STT_CHUNK_SECONDS")); chunk != "" {
			if parsed, err := strconv.Atoi(chunk); err == nil {
				speechkit.ChunkSeconds = parsed
			}
		}
		return speechkit
	}

	return NewFromEnv()
}
