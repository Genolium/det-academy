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

type OpenAICompatible struct {
	BaseURL string
	APIKey  string
	Model   string
	Client  *http.Client
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
		BaseURL: baseURL,
		APIKey:  apiKey,
		Model:   model,
		Client:  &http.Client{Timeout: 45 * time.Second},
	}
}

func (p *OpenAICompatible) Name() string    { return "openai-compatible" }
func (p *OpenAICompatible) Version() string { return p.Model }

func (p *OpenAICompatible) Enrich(ctx context.Context, input EnrichInput) (Enrichment, error) {
	system := `You are an English assessment coach for the Duolingo English Test.
Return strict JSON: {"feedback": string, "evidence": [{"start": number, "end": number, "text": string, "label": string, "suggestion": string}]}.
Use only evidence present in the learner response. Do not change the numeric score.`
	user := fmt.Sprintf("Task: %s\nPrompt: %s\nLearner response: %s\nTranscript: %s\nCurrent rule-based score: %.2f (%s)",
		input.QuestionType, input.Prompt, input.Response, input.Transcript, input.Score, input.CEFR)
	payload := map[string]interface{}{
		"model": p.Model,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": user},
		},
		"temperature":     0.2,
		"response_format": map[string]string{"type": "json_object"},
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, "POST", p.BaseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return Enrichment{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	if p.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.APIKey)
	}
	resp, err := p.Client.Do(req)
	if err != nil {
		return Enrichment{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		payload, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return Enrichment{}, fmt.Errorf("ai provider returned %d: %s", resp.StatusCode, string(payload))
	}
	var completion struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&completion); err != nil {
		return Enrichment{}, err
	}
	if len(completion.Choices) == 0 {
		return Enrichment{}, errors.New("ai provider returned no choices")
	}
	var parsed struct {
		Feedback string     `json:"feedback"`
		Evidence []Evidence `json:"evidence"`
	}
	if err := json.Unmarshal([]byte(completion.Choices[0].Message.Content), &parsed); err != nil {
		return Enrichment{}, fmt.Errorf("invalid ai json: %w", err)
	}
	return Enrichment{
		Feedback: parsed.Feedback,
		Evidence: parsed.Evidence,
		Provider: p.Name(),
		Model:    p.Model,
	}, nil
}

func (p *OpenAICompatible) Evaluate(ctx context.Context, input EnrichInput) (Evaluation, error) {
	system := `You are a calibrated DET rubric evaluator. Return strict JSON:
{"score": 0..1, "cefr": "Pre-A1|A1|A2|B1|B2|C1|C2", "feedback": string,
 "evidence": [{"start": number, "end": number, "text": string, "label": string, "suggestion": string}]}.
Judge task completion, organization, grammar, vocabulary and fluency. Use only the response.
Never reward silence, empty text or off-topic content.`
	user := fmt.Sprintf("Task: %s\nPrompt: %s\nResponse: %s\nTranscript: %s",
		input.QuestionType, input.Prompt, input.Response, input.Transcript)
	payload := map[string]interface{}{
		"model": p.Model,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": user},
		},
		"temperature":     0.1,
		"response_format": map[string]string{"type": "json_object"},
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, "POST", p.BaseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return Evaluation{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	if p.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.APIKey)
	}
	resp, err := p.Client.Do(req)
	if err != nil {
		return Evaluation{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		payload, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return Evaluation{}, fmt.Errorf("ai evaluator returned %d: %s", resp.StatusCode, string(payload))
	}
	var completion struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&completion); err != nil {
		return Evaluation{}, err
	}
	if len(completion.Choices) == 0 {
		return Evaluation{}, errors.New("ai evaluator returned no choices")
	}
	var parsed struct {
		Score    float64    `json:"score"`
		CEFR     string     `json:"cefr"`
		Feedback string     `json:"feedback"`
		Evidence []Evidence `json:"evidence"`
	}
	if err := json.Unmarshal([]byte(completion.Choices[0].Message.Content), &parsed); err != nil {
		return Evaluation{}, fmt.Errorf("invalid ai evaluation json: %w", err)
	}
	if parsed.Score < 0 {
		parsed.Score = 0
	}
	if parsed.Score > 1 {
		parsed.Score = 1
	}
	if parsed.CEFR == "" {
		parsed.CEFR = "B1"
	}
	return Evaluation{
		Score: parsed.Score, CEFR: parsed.CEFR, Feedback: parsed.Feedback,
		Evidence: parsed.Evidence, Provider: p.Name(), Model: p.Model,
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
	return strings.TrimSpace(payload.Text), nil
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
