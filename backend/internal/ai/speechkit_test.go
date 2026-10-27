package ai

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// TestSpeechKitSendsChunksAndJoinsResults verifies the request shape and the
// concatenation without depending on ffmpeg.
func TestSpeechKitSendsChunksAndJoinsResults(t *testing.T) {
	var calls []requestQuery
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("method = %s", r.Method)
		}
		if r.Header.Get("Authorization") != "Api-Key test-key" {
			t.Fatalf("authorization = %q", r.Header.Get("Authorization"))
		}
		calls = append(calls, requestQuery{
			folder: r.URL.Query().Get("folderId"),
			lang:   r.URL.Query().Get("lang"),
			format: r.URL.Query().Get("format"),
		})
		body, _ := io.ReadAll(r.Body)
		if len(body) == 0 {
			t.Fatalf("empty audio body")
		}
		text := "first part."
		if len(calls) == 2 {
			text = "second part."
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"result": text})
	}))
	defer server.Close()

	dir := t.TempDir()
	var chunks []string
	for index := 0; index < 2; index++ {
		path := filepath.Join(dir, "chunk.ogg")
		if err := os.WriteFile(path, []byte("audio"), 0o600); err != nil {
			t.Fatalf("write chunk: %v", err)
		}
		chunks = append(chunks, path)
	}

	transcriber := &SpeechKitTranscriber{
		APIKey:   "test-key",
		FolderID: "folder-1",
		Lang:     "en-US",
		Endpoint: server.URL,
		Client:   server.Client(),
		Split: func(context.Context, string) ([]string, func(), error) {
			return chunks, func() {}, nil
		},
	}

	text, err := transcriber.Transcribe(context.Background(), "/tmp/answer.webm", "audio/webm")
	if err != nil {
		t.Fatalf("transcribe: %v", err)
	}
	if text != "first part. second part." {
		t.Fatalf("text = %q", text)
	}
	if len(calls) != 2 {
		t.Fatalf("calls = %d, want 2", len(calls))
	}
	for _, call := range calls {
		if call.folder != "folder-1" || call.lang != "en-US" || call.format != "oggopus" {
			t.Fatalf("unexpected query: %+v", call)
		}
	}
}

// TestSpeechKitConvertsWebMWithFFmpeg covers the real conversion path: a WebM
// recording is transcoded to OggOpus and split into chunks.
func TestSpeechKitConvertsWebMWithFFmpeg(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg is not installed")
	}

	dir := t.TempDir()
	wav := filepath.Join(dir, "tone.wav")
	webm := filepath.Join(dir, "answer.webm")

	// 3 seconds of a quiet sine tone, 16 kHz mono.
	if output, err := exec.Command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
		"-f", "lavfi", "-i", "sine=frequency=440:duration=3",
		"-ac", "1", "-ar", "16000", wav).CombinedOutput(); err != nil {
		t.Fatalf("create wav: %v (%s)", err, output)
	}
	if output, err := exec.Command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
		"-i", wav, "-c:a", "libopus", "-b:a", "32k", webm).CombinedOutput(); err != nil {
		t.Fatalf("create webm: %v (%s)", err, output)
	}

	transcriber := NewSpeechKitTranscriber("key", "folder", "en-US")
	transcriber.ChunkSeconds = 1
	chunks, cleanup, err := transcriber.splitWithFFmpeg(context.Background(), webm)
	if err != nil {
		t.Fatalf("split: %v", err)
	}
	defer cleanup()

	if len(chunks) < 2 {
		t.Fatalf("chunks = %d, want at least 2", len(chunks))
	}
	for _, chunk := range chunks {
		if !strings.HasSuffix(chunk, ".ogg") {
			t.Fatalf("unexpected chunk name %s", chunk)
		}
		info, err := os.Stat(chunk)
		if err != nil || info.Size() == 0 {
			t.Fatalf("empty chunk %s: %v", chunk, err)
		}
	}
}

type requestQuery struct {
	folder string
	lang   string
	format string
}
