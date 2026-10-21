package ai

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOpenAICompatibleEvaluateParsesRubricJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		content := `{"score":0.72,"cefr":"B2","feedback":"Clear organization, but add specific examples.","evidence":[{"start":0,"end":18,"text":"In my opinion this","label":"vague_claim","suggestion":"Name the mechanism"}]}`
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"choices": []map[string]interface{}{{"message": map[string]string{"content": content}}},
		})
	}))
	defer server.Close()

	provider := &OpenAICompatible{BaseURL: server.URL, Model: "test-model", Client: server.Client()}
	evaluation, err := provider.Evaluate(context.Background(), EnrichInput{
		QuestionType: "WRITING_SAMPLE",
		Prompt:       "Discuss public transport.",
		Response:     "In my opinion this policy is good.",
	})
	if err != nil {
		t.Fatalf("evaluate: %v", err)
	}
	if evaluation.Score != 0.72 || evaluation.CEFR != "B2" {
		t.Fatalf("unexpected evaluation: %+v", evaluation)
	}
	if evaluation.Provider != "openai-compatible" || evaluation.Model != "test-model" {
		t.Fatalf("unexpected provider metadata: %+v", evaluation)
	}
	if len(evaluation.Evidence) != 1 || evaluation.Evidence[0].Label != "vague_claim" {
		t.Fatalf("expected evidence span, got %+v", evaluation.Evidence)
	}
}
