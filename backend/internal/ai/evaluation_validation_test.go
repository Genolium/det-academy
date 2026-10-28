package ai

import "testing"

const sampleAnswer = "one two three four five six seven eight nine ten"

func TestReconcileEvaluationClampsRange(t *testing.T) {
	score, cefr, _, _ := reconcileEvaluation(1.8, "ok", nil, EnrichInput{RuleScore: 0.7, Response: sampleAnswer}, evaluationSignals{})
	if score > 1 || cefr != "C2" {
		t.Fatalf("score=%v cefr=%q", score, cefr)
	}
	score, cefr, _, _ = reconcileEvaluation(-1, "ok", nil, EnrichInput{RuleScore: 0.1, Response: sampleAnswer}, evaluationSignals{})
	if score < 0 || cefr != "Pre-A1" {
		t.Fatalf("score=%v cefr=%q", score, cefr)
	}
}

func TestReconcileEvaluationBoundsModelDeviation(t *testing.T) {
	// A model that praises a weak answer may move the score by at most 0.30.
	score, cefr, _, _ := reconcileEvaluation(0.95, "Great", nil, EnrichInput{RuleScore: 0.40, Response: sampleAnswer}, evaluationSignals{})
	if score != 0.70 {
		t.Fatalf("score = %v, want 0.70", score)
	}
	if cefr != "B2" {
		t.Fatalf("cefr = %q, want B2", cefr)
	}

	// A harsher model score is never raised by the heuristic.
	score, _, _, _ = reconcileEvaluation(0.05, "Weak", nil, EnrichInput{RuleScore: 0.60, Response: sampleAnswer}, evaluationSignals{})
	if score != 0.05 {
		t.Fatalf("score = %v, want 0.05", score)
	}
}

func TestReconcileEvaluationBlocksInflatedEmptyAnswers(t *testing.T) {
	score, cefr, _, _ := reconcileEvaluation(0.9, "Perfect", nil, EnrichInput{
		RuleScore:  0,
		RuleStatus: "EMPTY",
		Response:   "",
	}, evaluationSignals{})
	if score > 0.05 {
		t.Fatalf("empty answer scored %v", score)
	}
	if cefr != "Pre-A1" {
		t.Fatalf("cefr = %q", cefr)
	}

	score, _, _, _ = reconcileEvaluation(0.9, "Perfect", nil, EnrichInput{
		RuleScore:  0.05,
		RuleStatus: "INSUFFICIENT",
		Response:   "too short",
	}, evaluationSignals{})
	if score > 0.10 {
		t.Fatalf("insufficient answer scored %v", score)
	}
}

func TestReconcileEvaluationDerivesCEFRFromScore(t *testing.T) {
	cases := []struct {
		score float64
		want  string
	}{
		{0.02, "Pre-A1"}, {0.2, "A1"}, {0.4, "A2"}, {0.55, "B1"},
		{0.75, "B2"}, {0.85, "C1"}, {0.95, "C2"},
	}
	for _, test := range cases {
		score, cefr, _, _ := reconcileEvaluation(test.score, "", nil, EnrichInput{
			RuleScore: test.score,
			Response:  "one two three four five six seven eight nine ten",
		}, evaluationSignals{})
		if cefr != test.want {
			t.Errorf("score %.2f -> %q, want %q", score, cefr, test.want)
		}
	}
}

func TestAlignEvidenceKeepsOnlyRealQuotes(t *testing.T) {
	response := "The library provides free access to journals."
	spans := []Evidence{
		{Start: 999, End: 1000, Text: "invented phrase", Label: "grammar"},
		{Start: 0, End: 3, Text: "The library", Label: "vocabulary"},
		{Start: 4, End: 8, Text: "free access", Label: "coherence"},
	}
	aligned := alignEvidence(spans, response)
	if len(aligned) != 2 {
		t.Fatalf("kept %d spans, want 2: %#v", len(aligned), aligned)
	}
	if response[aligned[0].Start:aligned[0].End] != "The library" {
		t.Fatalf("wrong offsets: %#v", aligned[0])
	}
	if response[aligned[1].Start:aligned[1].End] != "free access" {
		t.Fatalf("wrong offsets: %#v", aligned[1])
	}
}

func TestAlignEvidenceCapsSpans(t *testing.T) {
	response := "one two three four five six seven eight"
	var spans []Evidence
	for _, word := range []string{"one", "two", "three", "four", "five", "six"} {
		spans = append(spans, Evidence{Text: word, Label: "task"})
	}
	if got := len(alignEvidence(spans, response)); got != 5 {
		t.Fatalf("spans = %d, want 5", got)
	}
	if got := len(alignEvidence(spans, "nothing matches")); got != 0 {
		t.Fatalf("unmatched spans = %d, want 0", got)
	}
}

func TestShortModelName(t *testing.T) {
	cases := map[string]string{
		"gpt://b1g9obtep0g2i5l95cqp/deepseek-v4-flash/latest": "deepseek-v4-flash",
		"gpt://b1g9obtep0g2i5l95cqp/yandexgpt/latest":         "yandexgpt",
		"gpt-4o-mini": "gpt-4o-mini",
		"":            "unknown",
	}
	for input, want := range cases {
		if got := shortModelName(input); got != want {
			t.Errorf("shortModelName(%q) = %q, want %q", input, got, want)
		}
	}
	if got := shortModelName("a-very-long-model-name-that-exceeds-thirty-characters"); len(got) > 30 {
		t.Errorf("name is too long for the column: %d", len(got))
	}
}

func TestReconcileEvaluationCapsOffTopicAnswers(t *testing.T) {
	offTopic := true
	weakCompletion := 0.10
	partial := 0.40

	score, _, _, _ := reconcileEvaluation(0.80, "Fluent but irrelevant", nil, EnrichInput{
		RuleScore: 0.80,
		Response:  sampleAnswer,
	}, evaluationSignals{offTopic: &offTopic})
	if score > 0.15 {
		t.Fatalf("off-topic answer scored %v", score)
	}

	score, _, _, _ = reconcileEvaluation(0.80, "Ignores the task", nil, EnrichInput{
		RuleScore: 0.80,
		Response:  sampleAnswer,
	}, evaluationSignals{taskCompletion: &weakCompletion})
	if score > 0.15 {
		t.Fatalf("answer with no task completion scored %v", score)
	}

	score, _, _, _ = reconcileEvaluation(0.80, "Partly answers", nil, EnrichInput{
		RuleScore: 0.80,
		Response:  sampleAnswer,
	}, evaluationSignals{taskCompletion: &partial})
	if score > 0.55 {
		t.Fatalf("partially relevant answer scored %v", score)
	}
}
