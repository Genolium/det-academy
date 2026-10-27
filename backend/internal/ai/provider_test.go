package ai

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestProviderParsesFencedAndReasoningJSON covers the two response shapes seen
// in AI Studio: a JSON object wrapped in a markdown fence, and an answer placed
// into reasoning_content when the model spends its budget on reasoning.
func TestProviderParsesFencedAndReasoningJSON(t *testing.T) {
	tests := []struct {
		name      string
		content   string
		reasoning string
	}{
		{
			name:    "fenced json",
			content: "```json\n{\"score\":0.8,\"cefr\":\"B2\",\"feedback\":\"Good\",\"evidence\":[]}\n```",
		},
		{
			name:      "reasoning only",
			reasoning: "{\"score\":0.6,\"cefr\":\"B1\",\"feedback\":\"OK\",\"evidence\":[]}",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != "/chat/completions" {
					t.Fatalf("unexpected path %s", r.URL.Path)
				}
				if r.Header.Get("x-folder-id") != "folder-1" {
					t.Fatalf("missing x-folder-id header")
				}
				var payload struct {
					Model string `json:"model"`
				}
				_ = json.NewDecoder(r.Body).Decode(&payload)
				if payload.Model != "eval-model" {
					t.Fatalf("evaluate must use AI_MODEL_EVAL, got %q", payload.Model)
				}
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"choices": []map[string]interface{}{
						{"message": map[string]interface{}{"content": test.content, "reasoning_content": test.reasoning}},
					},
					"usage": map[string]int{"prompt_tokens": 12, "completion_tokens": 7},
				})
			}))
			defer server.Close()

			provider := &OpenAICompatible{
				BaseURL:   server.URL,
				Model:     "fallback",
				EvalModel: "eval-model",
				FolderID:  "folder-1",
				Client:    server.Client(),
			}
			var usage []UsageEvent
			provider.Usage = func(event UsageEvent) { usage = append(usage, event) }

			evaluation, err := provider.Evaluate(context.Background(), EnrichInput{
				QuestionType: "WRITING_SAMPLE",
				Prompt:       "Write an essay",
				Response:     "Some response",
			})
			if err != nil {
				t.Fatalf("evaluate: %v", err)
			}
			if evaluation.Score <= 0 || evaluation.CEFR == "" {
				t.Fatalf("unexpected evaluation: %#v", evaluation)
			}
			if evaluation.Model != "eval-model" {
				t.Fatalf("model = %q, want eval-model", evaluation.Model)
			}
			if len(usage) != 1 || usage[0].PromptTokens != 12 || usage[0].CompletionTokens != 7 {
				t.Fatalf("usage was not recorded: %#v", usage)
			}
			if usage[0].Kind != "evaluate" {
				t.Fatalf("usage kind = %q, want evaluate", usage[0].Kind)
			}
		})
	}
}
