package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// TTSProvider synthesises speech and returns the audio bytes and MIME type.
type TTSProvider interface {
	Name() string
	Synthesize(ctx context.Context, text string) (audio []byte, contentType string, err error)
}

// Model names accepted by Yandex SpeechKit.
const (
	// TTSModelLive is SpeechKit LiveTTS. Its stock voices are Russian
	// (sofia, vera, vasily...): English text is read with an accent, measured at
	// 0.67-0.90 round-trip accuracy. Kept for Russian UI prompts.
	TTSModelLive = "livetts"
	// TTSModelGeneral is the classic v1 synthesiser. Its English voice "john"
	// is a native speaker: a round-trip benchmark measured 0.99 word accuracy,
	// and v1 also supports the "speed" parameter used for dictation pacing.
	TTSModelGeneral = "general"
)

const (
	yandexV1Endpoint = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"
	yandexV3Endpoint = "https://tts.api.cloud.yandex.net/tts/v3/utteranceSynthesis"

	// LiveTTS rejects anything longer than 250 characters, so longer texts are
	// split on sentence boundaries and the MP3 parts are joined with ffmpeg.
	maxLiveTTSChunkRunes = 240
)

// YandexTTS synthesises speech with Yandex SpeechKit.
//
// The live model speaks through the v3 REST endpoint, which streams
// newline-delimited JSON with base64 audio chunks. The general model keeps
// using v1, where speed and the older voices are available.
type YandexTTS struct {
	APIKey   string
	FolderID string
	Model    string
	Voice    string
	Lang     string
	Speed    float64
	Endpoint string
	Client   *http.Client

	// FfmpegPath is injectable for tests; by default ffmpeg is looked up in PATH.
	FfmpegPath string
}

func NewYandexTTS(apiKey, folderID, voice, lang string, speed float64) *YandexTTS {
	return NewYandexTTSWithModel(apiKey, folderID, TTSModelGeneral, voice, lang, speed)
}

func NewYandexTTSWithModel(apiKey, folderID, model, voice, lang string, speed float64) *YandexTTS {
	model = strings.ToLower(strings.TrimSpace(model))
	if model == "" {
		model = TTSModelGeneral
	}
	if strings.TrimSpace(voice) == "" {
		if model == TTSModelGeneral {
			// john is the only native English voice in the catalogue.
			voice = "john"
		} else {
			voice = "sofia"
		}
	}
	if strings.TrimSpace(lang) == "" {
		lang = "en-US"
	}
	if speed <= 0 || speed > 2 {
		speed = 0.9
	}
	endpoint := yandexV3Endpoint
	if model == TTSModelGeneral {
		endpoint = yandexV1Endpoint
	}
	return &YandexTTS{
		APIKey:   apiKey,
		FolderID: folderID,
		Model:    model,
		Voice:    voice,
		Lang:     lang,
		Speed:    speed,
		Endpoint: endpoint,
		Client:   &http.Client{Timeout: 60 * time.Second},
	}
}

func (t *YandexTTS) Name() string { return "yandex-speechkit-tts" }

// VoiceID participates in the cache key: changing the model or voice produces
// new files instead of silently serving the previous voice.
func (t *YandexTTS) VoiceID() string {
	return t.Model + "/" + t.Voice + "@" + t.Lang + "/" + strconv.FormatFloat(t.Speed, 'f', 2, 64)
}

func (t *YandexTTS) Synthesize(ctx context.Context, text string) ([]byte, string, error) {
	if strings.TrimSpace(t.APIKey) == "" || strings.TrimSpace(t.FolderID) == "" {
		return nil, "", errors.New("tts: API key and folder id are required")
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, "", errors.New("tts: text is required")
	}
	if t.Model == TTSModelGeneral {
		return t.synthesizeGeneral(ctx, text)
	}
	return t.synthesizeLive(ctx, text)
}

// synthesizeLive calls the v3 endpoint. Long texts are split because the model
// accepts at most 250 characters per request.
func (t *YandexTTS) synthesizeLive(ctx context.Context, text string) ([]byte, string, error) {
	chunks := splitText(text, maxLiveTTSChunkRunes)
	parts := make([][]byte, 0, len(chunks))
	for _, chunk := range chunks {
		audio, err := t.synthesizeLiveChunk(ctx, chunk)
		if err != nil {
			return nil, "", err
		}
		parts = append(parts, audio)
	}
	if len(parts) == 1 {
		return parts[0], "audio/mpeg", nil
	}
	joined, err := t.concatMP3(ctx, parts)
	if err != nil {
		return nil, "", err
	}
	return joined, "audio/mpeg", nil
}

func (t *YandexTTS) synthesizeLiveChunk(ctx context.Context, text string) ([]byte, error) {
	payload := map[string]any{
		"text":            text,
		"model":           t.Model,
		"outputAudioSpec": map[string]any{"containerAudio": map[string]any{"containerAudioType": "MP3"}},
		"hints":           []map[string]any{{"voice": t.Voice}},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, t.Endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Api-Key "+t.APIKey)
	req.Header.Set("x-folder-id", t.FolderID)

	resp, err := t.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("tts: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, yandexError(resp)
	}

	// The endpoint streams one JSON object per line; each object may carry a
	// base64 audio chunk, and the stream ends with an empty result.
	var audio bytes.Buffer
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 8<<20)
	for scanner.Scan() {
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}
		var event struct {
			Result *struct {
				AudioChunk *struct {
					Data string `json:"data"`
				} `json:"audioChunk"`
			} `json:"result"`
		}
		if err := json.Unmarshal(line, &event); err != nil {
			return nil, fmt.Errorf("tts: invalid stream chunk: %w", err)
		}
		if event.Result == nil || event.Result.AudioChunk == nil || event.Result.AudioChunk.Data == "" {
			continue
		}
		decoded, err := base64.StdEncoding.DecodeString(event.Result.AudioChunk.Data)
		if err != nil {
			return nil, fmt.Errorf("tts: invalid audio chunk: %w", err)
		}
		audio.Write(decoded)
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("tts: read failed: %w", err)
	}
	if audio.Len() == 0 {
		return nil, errors.New("tts: empty audio")
	}
	return audio.Bytes(), nil
}

// synthesizeGeneral uses SpeechKit v1 (form encoded, raw audio response).
func (t *YandexTTS) synthesizeGeneral(ctx context.Context, text string) ([]byte, string, error) {
	form := url.Values{}
	form.Set("text", text)
	form.Set("lang", t.Lang)
	form.Set("voice", t.Voice)
	form.Set("format", "mp3")
	form.Set("speed", strconv.FormatFloat(t.Speed, 'f', 2, 64))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, t.Endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Api-Key "+t.APIKey)
	req.Header.Set("x-folder-id", t.FolderID)

	resp, err := t.Client.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("tts: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", yandexError(resp)
	}
	audio, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, "", err
	}
	if len(audio) == 0 {
		return nil, "", errors.New("tts: empty audio")
	}
	return audio, "audio/mpeg", nil
}

func yandexError(resp *http.Response) error {
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	var apiError struct {
		Code    string `json:"error_code"`
		Message string `json:"error_message"`
		Error   struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if json.Unmarshal(body, &apiError) == nil {
		message := apiError.Message
		if message == "" {
			message = apiError.Error.Message
		}
		if message != "" {
			return fmt.Errorf("tts returned %d: %s", resp.StatusCode, message)
		}
	}
	return fmt.Errorf("tts returned %d", resp.StatusCode)
}

// splitText breaks text into chunks of at most limit runes, preferring
// sentence boundaries and then word boundaries so the prosody stays natural.
func splitText(text string, limit int) []string {
	text = strings.TrimSpace(text)
	if limit < 40 {
		limit = 40
	}
	if len([]rune(text)) <= limit {
		return []string{text}
	}

	var chunks []string
	remaining := text
	for len([]rune(remaining)) > limit {
		runes := []rune(remaining)
		cut := -1
		// Prefer the last sentence end inside the window.
		for _, mark := range []string{". ", "! ", "? ", "; ", ": "} {
			if idx := strings.LastIndex(string(runes[:limit]), mark); idx >= 0 {
				if idx+1 > cut {
					cut = idx + 1
				}
			}
		}
		if cut < limit/3 {
			// Fall back to the last word boundary.
			if idx := strings.LastIndex(string(runes[:limit]), " "); idx >= limit/3 {
				cut = idx
			}
		}
		if cut <= 0 {
			cut = limit
		}
		chunks = append(chunks, strings.TrimSpace(string(runes[:cut])))
		remaining = strings.TrimSpace(string(runes[cut:]))
	}
	if remaining != "" {
		chunks = append(chunks, remaining)
	}
	return chunks
}

// concatMP3 joins separately synthesised parts into one MP3 file with ffmpeg.
func (t *YandexTTS) concatMP3(ctx context.Context, parts [][]byte) ([]byte, error) {
	ffmpeg := t.FfmpegPath
	if ffmpeg == "" {
		path, err := exec.LookPath("ffmpeg")
		if err != nil {
			return nil, errors.New("tts: ffmpeg is required to join long texts")
		}
		ffmpeg = path
	}

	dir, err := os.MkdirTemp("", "tts-join-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(dir)

	listing := &strings.Builder{}
	for index, part := range parts {
		name := filepath.Join(dir, fmt.Sprintf("part-%02d.mp3", index))
		if err := os.WriteFile(name, part, 0o600); err != nil {
			return nil, err
		}
		fmt.Fprintf(listing, "file '%s'\n", name)
	}
	listPath := filepath.Join(dir, "list.txt")
	if err := os.WriteFile(listPath, []byte(listing.String()), 0o600); err != nil {
		return nil, err
	}
	output := filepath.Join(dir, "joined.mp3")

	args := []string{
		"-hide_banner", "-loglevel", "error", "-y",
		"-f", "concat", "-safe", "0", "-i", listPath,
		"-ac", "1", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "64k",
		output,
	}
	if out, err := exec.CommandContext(ctx, ffmpeg, args...).CombinedOutput(); err != nil {
		return nil, fmt.Errorf("tts: ffmpeg failed: %w (%s)", err, strings.TrimSpace(string(out)))
	}
	return os.ReadFile(output)
}

// NewTTSFromEnv builds the synthesiser. It returns nil unless AI_TTS_ENABLED
// is true. AI_TTS_MODEL selects general (default, native English "john") or
// livetts (Russian voices).
func NewTTSFromEnv() TTSProvider {
	if strings.ToLower(strings.TrimSpace(os.Getenv("AI_TTS_ENABLED"))) != "true" {
		return nil
	}
	provider := strings.ToLower(strings.TrimSpace(os.Getenv("AI_TTS_PROVIDER")))
	if provider != "" && provider != "yandex" && provider != "yandex_speechkit" {
		return nil
	}
	key := strings.TrimSpace(os.Getenv("AI_TTS_API_KEY"))
	if key == "" {
		key = strings.TrimSpace(os.Getenv("AI_API_KEY"))
	}
	folder := strings.TrimSpace(os.Getenv("AI_FOLDER_ID"))
	if folder == "" {
		folder = strings.TrimSpace(os.Getenv("AI_TTS_FOLDER_ID"))
	}
	model := strings.TrimSpace(os.Getenv("AI_TTS_MODEL"))
	if model == "" {
		model = TTSModelGeneral
	}
	speed := 0.9
	if raw := strings.TrimSpace(os.Getenv("AI_TTS_SPEED")); raw != "" {
		if parsed, err := strconv.ParseFloat(raw, 64); err == nil {
			speed = parsed
		}
	}
	return NewYandexTTSWithModel(key, folder, model, os.Getenv("AI_TTS_VOICE"), os.Getenv("AI_TTS_LANG"), speed)
}
