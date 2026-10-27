package tests

import (
	"context"
	"testing"
	"time"

	"det-academy-backend/internal/models"
)

// TestAIUsageSummaryComputesCost verifies the admin accounting: tokens are
// aggregated per day/model and the cost follows the configured prices.
func TestAIUsageSummaryComputesCost(t *testing.T) {
	t.Setenv("AI_PRICE_INPUT_PER_1M", "100")
	t.Setenv("AI_PRICE_OUTPUT_PER_1M", "200")
	t.Setenv("AI_PRICE_CURRENCY", "RUB")

	store, study, userID := xpFixture(t)
	ctx := context.Background()
	_ = userID

	events := []models.AIUsageEvent{
		{Kind: "evaluate", Model: "aliceai-llm", PromptTokens: 1000, CompletionTokens: 500},
		{Kind: "enrich", Model: "yandexgpt-5-lite", PromptTokens: 3000, CompletionTokens: 0},
	}
	for index := range events {
		events[index].ID = "usage-" + time.Now().Format("150405.000000000") + "-" + string(rune('a'+index))
		events[index].CreatedAt = time.Now().UTC()
		if err := store.Study().RecordAIUsage(ctx, &events[index]); err != nil {
			t.Fatalf("record usage: %v", err)
		}
	}

	summary, err := study.GetAIUsage(ctx, 7)
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if summary.Calls != 2 {
		t.Fatalf("calls = %d, want 2", summary.Calls)
	}
	if summary.PromptTokens != 4000 || summary.CompletionTokens != 500 {
		t.Fatalf("tokens = %d/%d, want 4000/500", summary.PromptTokens, summary.CompletionTokens)
	}
	// 4000 input tokens * 100 / 1M + 500 output tokens * 200 / 1M = 0.4 + 0.1
	if summary.Cost < 0.499 || summary.Cost > 0.501 {
		t.Fatalf("cost = %f, want 0.5", summary.Cost)
	}
	if summary.Currency != "RUB" {
		t.Fatalf("currency = %q, want RUB", summary.Currency)
	}
	if len(summary.Rows) != 2 {
		t.Fatalf("rows = %d, want 2", len(summary.Rows))
	}
}
