package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Evidence struct {
	Start      int    `json:"start"`
	End        int    `json:"end"`
	Text       string `json:"text"`
	Label      string `json:"label"`
	Suggestion string `json:"suggestion,omitempty"`
}

type Enrichment struct {
	Feedback string     `json:"feedback"`
	Evidence []Evidence `json:"evidence"`
	Provider string     `json:"provider"`
	Model    string     `json:"model"`
}

type EnrichInput struct {
	QuestionType string
	Prompt       string
	Response     string
	Transcript   string
	Score        float64
	CEFR         string
	// RuleScore and RuleStatus come from the deterministic rubric and bound
	// what the model is allowed to return (see reconcileEvaluation).
	RuleScore   float64
	RuleStatus  string
	WordCount   int
	DurationSec float64
}

type Evaluation struct {
	Score    float64    `json:"score"`
	CEFR     string     `json:"cefr"`
	Feedback string     `json:"feedback"`
	Evidence []Evidence `json:"evidence"`
	Provider string     `json:"provider"`
	Model    string     `json:"model"`
}

type Provider interface {
	Name() string
	Version() string
	Enrich(ctx context.Context, input EnrichInput) (Enrichment, error)
}

type Evaluator interface {
	Evaluate(ctx context.Context, input EnrichInput) (Evaluation, error)
}

type Transcriber interface {
	Name() string
	Transcribe(ctx context.Context, audioPath, mimeType string) (string, error)
}

// UsageEvent is one billable provider call.
type UsageEvent struct {
	Kind             string
	Model            string
	PromptTokens     int
	CompletionTokens int
}

type OpenAICompatible struct {
	BaseURL   string
	APIKey    string
	Model     string
	FastModel string
	EvalModel string
	// FolderID is sent as x-folder-id for Yandex AI Studio.
	FolderID string
	Client   *http.Client
	// Usage receives token usage for the admin cost dashboard.
	Usage func(UsageEvent)
}

func (p *OpenAICompatible) fastModel() string {
	if p.FastModel != "" {
		return p.FastModel
	}
	return p.Model
}

func (p *OpenAICompatible) evalModel() string {
	if p.EvalModel != "" {
		return p.EvalModel
	}
	return p.Model
}

func (p *OpenAICompatible) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	if p.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.APIKey)
	}
	if p.FolderID != "" {
		req.Header.Set("x-folder-id", p.FolderID)
	}
}

func NewFromEnv() *OpenAICompatible {
	baseURL := strings.TrimRight(os.Getenv("AI_BASE_URL"), "/")
	apiKey := os.Getenv("AI_API_KEY")
	if apiKey == "" {
		apiKey = os.Getenv("OPENAI_API_KEY")
	}
	model := os.Getenv("AI_MODEL")
	if baseURL == "" && apiKey == "" {
		return nil
	}
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	if model == "" {
		model = "gpt-4o-mini"
	}
	return &OpenAICompatible{
		BaseURL:   baseURL,
		APIKey:    apiKey,
		Model:     model,
		FastModel: strings.TrimSpace(os.Getenv("AI_MODEL_FAST")),
		EvalModel: strings.TrimSpace(os.Getenv("AI_MODEL_EVAL")),
		FolderID:  strings.TrimSpace(os.Getenv("AI_FOLDER_ID")),
		Client:    &http.Client{Timeout: 60 * time.Second},
	}
}

func (p *OpenAICompatible) Name() string    { return "openai-compatible" }
func (p *OpenAICompatible) Version() string { return p.Model }

// chatCompletion sends one chat request and reports the answer together with
// the token usage. A shared path keeps the headers (including the Yandex
// folder) and the accounting in one place.
func (p *OpenAICompatible) chatCompletion(ctx context.Context, kind, model, system, user string, temperature float64) (string, error) {
	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": user},
		},
		"temperature":     temperature,
		"response_format": map[string]string{"type": "json_object"},
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, "POST", p.BaseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	p.setHeaders(req)

	resp, err := p.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		payload, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return "", fmt.Errorf("ai provider returned %d: %s", resp.StatusCode, string(payload))
	}

	var completion struct {
		Choices []struct {
			Message struct {
				Content          string `json:"content"`
				ReasoningContent string `json:"reasoning_content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
		} `json:"usage"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&completion); err != nil {
		return "", err
	}
	if len(completion.Choices) == 0 {
		return "", errors.New("ai provider returned no choices")
	}
	if p.Usage != nil {
		p.Usage(UsageEvent{
			Kind:             kind,
			Model:            model,
			PromptTokens:     completion.Usage.PromptTokens,
			CompletionTokens: completion.Usage.CompletionTokens,
		})
	}
	content := strings.TrimSpace(completion.Choices[0].Message.Content)
	// Reasoning models (for example DeepSeek via AI Studio) can put the answer
	// into reasoning_content and leave content empty when the token budget is
	// tight. Prefer the answer, then the reasoning text.
	if content == "" {
		content = strings.TrimSpace(completion.Choices[0].Message.ReasoningContent)
	}
	return cleanJSONContent(content), nil
}

// cleanJSONContent strips markdown code fences that some models add around a
// JSON object even in json_object mode.
func cleanJSONContent(content string) string {
	trimmed := strings.TrimSpace(content)
	if !strings.HasPrefix(trimmed, "```") {
		return trimmed
	}
	trimmed = strings.TrimPrefix(trimmed, "```")
	trimmed = strings.TrimPrefix(trimmed, "json")
	trimmed = strings.TrimPrefix(trimmed, "JSON")
	if index := strings.LastIndex(trimmed, "```"); index >= 0 {
		trimmed = trimmed[:index]
	}
	return strings.TrimSpace(trimmed)
}

func (p *OpenAICompatible) Enrich(ctx context.Context, input EnrichInput) (Enrichment, error) {
	content, err := p.chatCompletion(ctx, "enrich", p.fastModel(), enrichmentSystemPrompt, buildEnrichUserMessage(input), 0.2)
	if err != nil {
		return Enrichment{}, err
	}
	var parsed struct {
		Feedback string     `json:"feedback"`
		Evidence []Evidence `json:"evidence"`
	}
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return Enrichment{}, fmt.Errorf("invalid ai json: %w", err)
	}
	return Enrichment{
		Feedback: parsed.Feedback,
		Evidence: alignEvidence(parsed.Evidence, firstNonEmpty(input.Response, input.Transcript)),
		Provider: p.Name(),
		Model:    shortModelName(p.fastModel()),
	}, nil
}

func (p *OpenAICompatible) Evaluate(ctx context.Context, input EnrichInput) (Evaluation, error) {
	content, err := p.chatCompletion(ctx, "evaluate", p.evalModel(), evaluationSystemPrompt, buildEvaluateUserMessage(input), 0.1)
	if err != nil {
		return Evaluation{}, err
	}
	var parsed struct {
		Score          float64    `json:"score"`
		CEFR           string     `json:"cefr"`
		TaskCompletion *float64   `json:"taskCompletion"`
		OffTopic       *bool      `json:"offTopic"`
		Feedback       string     `json:"feedback"`
		Evidence       []Evidence `json:"evidence"`
	}
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return Evaluation{}, fmt.Errorf("invalid ai evaluation json: %w", err)
	}

	signals := evaluationSignals{taskCompletion: parsed.TaskCompletion, offTopic: parsed.OffTopic}
	score, cefr, feedback, evidence := reconcileEvaluation(parsed.Score, parsed.Feedback, parsed.Evidence, input, signals)
	return Evaluation{
		Score: score, CEFR: cefr, Feedback: feedback,
		Evidence: evidence, Provider: p.Name(), Model: shortModelName(p.evalModel()),
	}, nil
}

func (p *OpenAICompatible) Transcribe(ctx context.Context, audioPath, mimeType string) (string, error) {
	file, err := os.Open(audioPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", filepath.Base(audioPath))
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, file); err != nil {
		return "", err
	}
	_ = writer.WriteField("model", envOr("AI_STT_MODEL", "whisper-1"))
	if err := writer.Close(); err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.BaseURL+"/audio/transcriptions", &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if p.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.APIKey)
	}
	if p.FolderID != "" {
		req.Header.Set("x-folder-id", p.FolderID)
	}
	resp, err := p.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("transcription provider returned %d", resp.StatusCode)
	}
	var payload struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&payload); err != nil {
		return "", err
	}
	if strings.TrimSpace(payload.Text) == "" {
		return "", errors.New("transcription provider returned empty text")
	}
	if p.Usage != nil {
		// Transcription endpoints usually report duration rather than tokens.
		p.Usage(UsageEvent{Kind: "transcribe", Model: envOr("AI_STT_MODEL", "whisper-1")})
	}
	return strings.TrimSpace(payload.Text), nil
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
