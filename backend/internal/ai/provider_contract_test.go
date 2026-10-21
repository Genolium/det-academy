package ai

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestOpenAICompatibleEnrichParsesFeedbackAndEvidence(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		content := `{"feedback":"Use a concrete example.","evidence":[{"start":0,"end":5,"text":"I think","label":"vague"}]}`
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"choices": []map[string]interface{}{{"message": map[string]string{"content": content}}},
		})
	}))
	defer server.Close()
	provider := &OpenAICompatible{BaseURL: server.URL, Model: "test-model", Client: server.Client()}
	enrichment, err := provider.Enrich(context.Background(), EnrichInput{QuestionType: "WRITING_SAMPLE", Prompt: "p", Response: "r", Score: 0.5, CEFR: "B1"})
	if err != nil {
		t.Fatalf("enrich: %v", err)
	}
	if enrichment.Feedback == "" || len(enrichment.Evidence) != 1 || enrichment.Evidence[0].Label != "vague" {
		t.Fatalf("unexpected enrichment: %+v", enrichment)
	}
}

func TestOpenAICompatibleTranscribeParsesText(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/audio/transcriptions" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"text": "hello world"})
	}))
	defer server.Close()
	audio := filepath.Join(t.TempDir(), "sample.webm")
	if err := os.WriteFile(audio, []byte("not-real-audio"), 0o600); err != nil {
		t.Fatal(err)
	}
	provider := &OpenAICompatible{BaseURL: server.URL, Model: "test-model", Client: server.Client()}
	text, err := provider.Transcribe(context.Background(), audio, "audio/webm")
	if err != nil {
		t.Fatalf("transcribe: %v", err)
	}
	if text != "hello world" {
		t.Fatalf("unexpected transcript: %q", text)
	}
}
