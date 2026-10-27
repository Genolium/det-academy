package ai

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"strings"
	"testing"
)

// makeSilentMP3 produces a short valid MP3 used as a stub synthesis response.
func makeSilentMP3(ctx context.Context) ([]byte, error) {
	dir, err := os.MkdirTemp("", "tts-fixture-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(dir)
	output := dir + "/silence.mp3"
	cmd := exec.CommandContext(ctx, "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
		"-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.3",
		"-c:a", "libmp3lame", "-b:a", "64k", output)
	if out, err := cmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("ffmpeg: %w (%s)", err, out)
	}
	return os.ReadFile(output)
}

func TestSplitText(t *testing.T) {
	if got := splitText("Short sentence.", 240); len(got) != 1 || got[0] != "Short sentence." {
		t.Fatalf("short text = %#v", got)
	}

	long := strings.Repeat("This is a sentence about languages. ", 20)
	chunks := splitText(long, 100)
	if len(chunks) < 2 {
		t.Fatalf("expected several chunks, got %d", len(chunks))
	}
	for _, chunk := range chunks {
		if len([]rune(chunk)) > 100 {
			t.Fatalf("chunk longer than limit: %d", len([]rune(chunk)))
		}
		if chunk == "" {
			t.Fatal("empty chunk")
		}
	}
	// No text may be lost or duplicated by the split.
	joined := strings.Join(chunks, " ")
	if len(strings.Fields(joined)) != len(strings.Fields(long)) {
		t.Fatalf("word count changed: %d != %d", len(strings.Fields(joined)), len(strings.Fields(long)))
	}

	// A single very long word still has to be cut, not looped on.
	chunks = splitText(strings.Repeat("a", 250), 100)
	if len(chunks) != 3 {
		t.Fatalf("long word chunks = %d, want 3", len(chunks))
	}
}

func TestYandexLiveSynthesisParsesStream(t *testing.T) {
	var received map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Api-Key test-key" {
			t.Errorf("authorization = %q", got)
		}
		if got := r.Header.Get("x-folder-id"); got != "folder" {
			t.Errorf("folder = %q", got)
		}
		if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		chunk := base64.StdEncoding.EncodeToString([]byte("ID3audio"))
		fmt.Fprintf(w, "%s\n", `{"result":{"audioChunk":{"data":"`+chunk+`"}}}`)
		fmt.Fprintf(w, "%s\n", `{"result":{"audioChunk":{"data":"`+chunk+`"}}}`)
		fmt.Fprintf(w, "%s\n", `{"result":null}`)
	}))
	defer server.Close()

	provider := NewYandexTTSWithModel("test-key", "folder", TTSModelLive, "sofia", "en-US", 0.9)
	provider.Endpoint = server.URL
	provider.Client = server.Client()

	audio, contentType, err := provider.Synthesize(context.Background(), "Hello world")
	if err != nil {
		t.Fatalf("synthesize: %v", err)
	}
	if contentType != "audio/mpeg" {
		t.Fatalf("content type = %q", contentType)
	}
	if string(audio) != "ID3audioID3audio" {
		t.Fatalf("audio = %q", audio)
	}
	if received["model"] != TTSModelLive {
		t.Fatalf("model = %v", received["model"])
	}
	hints, _ := received["hints"].([]any)
	if len(hints) != 1 {
		t.Fatalf("hints = %v", hints)
	}
	if voice := hints[0].(map[string]any)["voice"]; voice != "sofia" {
		t.Fatalf("voice = %v", voice)
	}
}

func TestYandexLiveSynthesisSplitsLongText(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg is not installed")
	}

	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		var payload struct {
			Text string `json:"text"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Errorf("decode: %v", err)
		}
		if len([]rune(payload.Text)) > maxLiveTTSChunkRunes {
			t.Errorf("chunk too long: %d", len([]rune(payload.Text)))
		}
		// A real MP3 frame is not needed for the join: ffmpeg gets valid input
		// only in production, so use a tiny generated file via ffmpeg instead.
		audio, err := makeSilentMP3(r.Context())
		if err != nil {
			t.Errorf("fixture: %v", err)
			return
		}
		chunk := base64.StdEncoding.EncodeToString(audio)
		fmt.Fprintf(w, "%s\n", `{"result":{"audioChunk":{"data":"`+chunk+`"}}}`)
	}))
	defer server.Close()

	provider := NewYandexTTSWithModel("test-key", "folder", TTSModelLive, "sofia", "en-US", 0.9)
	provider.Endpoint = server.URL
	provider.Client = server.Client()

	text := strings.Repeat("The library provides free access to academic journals. ", 8)
	audio, _, err := provider.Synthesize(context.Background(), text)
	if err != nil {
		t.Fatalf("synthesize: %v", err)
	}
	if calls < 2 {
		t.Fatalf("expected the text to be split, calls = %d", calls)
	}
	if len(audio) == 0 {
		t.Fatal("empty joined audio")
	}
}

func TestYandexErrorReporting(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, `{"error":{"message":"Feature permission denied model=general"}}`)
	}))
	defer server.Close()

	provider := NewYandexTTSWithModel("test-key", "folder", TTSModelLive, "sofia", "en-US", 0.9)
	provider.Endpoint = server.URL
	provider.Client = server.Client()

	_, _, err := provider.Synthesize(context.Background(), "Hello")
	if err == nil || !strings.Contains(err.Error(), "Feature permission denied") {
		t.Fatalf("err = %v", err)
	}
}

func TestSyncGeneralUsesForm(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			t.Fatalf("form: %v", err)
		}
		if r.Form.Get("voice") != "john" || r.Form.Get("speed") != "0.90" {
			t.Errorf("form = %v", r.Form)
		}
		w.Write([]byte("ID3general"))
	}))
	defer server.Close()

	provider := NewYandexTTSWithModel("test-key", "folder", TTSModelGeneral, "", "en-US", 0.9)
	provider.Endpoint = server.URL
	provider.Client = server.Client()

	audio, _, err := provider.Synthesize(context.Background(), "Hello")
	if err != nil {
		t.Fatalf("synthesize: %v", err)
	}
	if string(audio) != "ID3general" {
		t.Fatalf("audio = %q", audio)
	}
}

func TestVoiceIDChangesWithModel(t *testing.T) {
	live := NewYandexTTSWithModel("k", "f", TTSModelLive, "sofia", "en-US", 0.9)
	general := NewYandexTTSWithModel("k", "f", TTSModelGeneral, "john", "en-US", 0.9)
	if live.VoiceID() == general.VoiceID() {
		t.Fatal("cache key must differ between models")
	}
	if !strings.Contains(live.VoiceID(), "livetts/sofia") {
		t.Fatalf("voice id = %q", live.VoiceID())
	}
}
