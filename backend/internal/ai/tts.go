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
	"strconv"
	"strings"
	"time"
)

// TTSProvider synthesises speech and returns the audio bytes and MIME type.
type TTSProvider interface {
	Name() string
	Synthesize(ctx context.Context, text string) (audio []byte, contentType string, err error)
}

// YandexTTS uses SpeechKit v1. English voices are limited (jane, omazh,
// marina, zahar, ermil, madirus); jane is the most natural for English.
type YandexTTS struct {
	APIKey   string
	FolderID string
	Voice    string
	Lang     string
	Speed    float64
	Endpoint string
	Client   *http.Client
}

func NewYandexTTS(apiKey, folderID, voice, lang string, speed float64) *YandexTTS {
	if strings.TrimSpace(voice) == "" {
		voice = "jane"
	}
	if strings.TrimSpace(lang) == "" {
		lang = "en-US"
	}
	if speed <= 0 || speed > 2 {
		speed = 0.9
	}
	return &YandexTTS{
		APIKey:   apiKey,
		FolderID: folderID,
		Voice:    voice,
		Lang:     lang,
		Speed:    speed,
		Endpoint: "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
		Client:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (t *YandexTTS) Name() string { return "yandex-speechkit-tts" }

// VoiceID participates in the cache key: changing the voice produces new files.
func (t *YandexTTS) VoiceID() string {
	return t.Voice + "@" + t.Lang + "/" + strconv.FormatFloat(t.Speed, 'f', 2, 64)
}

func (t *YandexTTS) Synthesize(ctx context.Context, text string) ([]byte, string, error) {
	if strings.TrimSpace(t.APIKey) == "" || strings.TrimSpace(t.FolderID) == "" {
		return nil, "", errors.New("tts: API key and folder id are required")
	}
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
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		var apiError struct {
			Code    string `json:"error_code"`
			Message string `json:"error_message"`
		}
		if json.Unmarshal(body, &apiError) == nil && apiError.Message != "" {
			return nil, "", fmt.Errorf("tts returned %d: %s", resp.StatusCode, apiError.Message)
		}
		return nil, "", fmt.Errorf("tts returned %d", resp.StatusCode)
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

// NewTTSFromEnv builds the synthesiser. It returns nil unless AI_TTS_ENABLED
// is true; the provider is selected by AI_TTS_PROVIDER (yandex only for now).
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
	speed := 0.9
	if raw := strings.TrimSpace(os.Getenv("AI_TTS_SPEED")); raw != "" {
		if parsed, err := strconv.ParseFloat(raw, 64); err == nil {
			speed = parsed
		}
	}
	return NewYandexTTS(key, folder, os.Getenv("AI_TTS_VOICE"), os.Getenv("AI_TTS_LANG"), speed)
}
