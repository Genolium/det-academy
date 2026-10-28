package ai

import (
	"math"
	"strings"
)

// maxNeuralDeviation bounds how far the model may move the score away from the
// deterministic rubric. The rule-based score is based on observable signals
// (length, topic overlap, fluency), so a large disagreement usually means the
// model hallucinated quality rather than found something the rules missed.
const maxNeuralDeviation = 0.30

// cefrForScore is the single source of truth for the score-to-CEFR mapping used
// by the neural evaluator. Deriving the band from the final score prevents
// responses like {"score":0.9,"cefr":"A1"}.
func cefrForScore(score float64) string {
	switch {
	case score >= 0.91:
		return "C2"
	case score >= 0.81:
		return "C1"
	case score >= 0.66:
		return "B2"
	case score >= 0.46:
		return "B1"
	case score >= 0.26:
		return "A2"
	case score >= 0.06:
		return "A1"
	default:
		return "Pre-A1"
	}
}

// reconcileEvaluation applies the hard rules that a language model can ignore:
// clamped range, bounded deviation from the rule-based baseline, empty and
// insufficient answers, and valid evidence offsets.
// evaluationSignals are the structured judgements requested from the model in
// addition to the score. They make it impossible to praise a fluent answer that
// ignores the task while still returning a high number.
type evaluationSignals struct {
	taskCompletion *float64
	offTopic       *bool
}

func reconcileEvaluation(score float64, feedback string, evidence []Evidence, input EnrichInput, signals evaluationSignals) (float64, string, string, []Evidence) {
	score = math.Min(1, math.Max(0, score))

	// The model may be harsher than the rule-based baseline (it can see
	// off-topic content and weak grammar), but it may not inflate the score:
	// flattering a weak answer is the failure mode that damages trust.
	if input.RuleScore > 0 {
		high := math.Min(1, input.RuleScore+maxNeuralDeviation)
		score = math.Min(high, score)
	}

	if signals.offTopic != nil && *signals.offTopic {
		score = math.Min(score, 0.15)
	}
	if signals.taskCompletion != nil {
		completion := math.Min(1, math.Max(0, *signals.taskCompletion))
		if completion < 0.25 {
			score = math.Min(score, 0.15)
		} else if completion < 0.50 {
			score = math.Min(score, 0.55)
		}
	}

	switch strings.ToUpper(strings.TrimSpace(input.RuleStatus)) {
	case "EMPTY", "INSUFFICIENT":
		// Silence, a single phrase, a non-English answer or an off-topic
		// template never earns a model score above the floor.
		score = math.Min(score, 0.10)
	}

	if countWords(firstNonEmpty(input.Response, input.Transcript)) < 5 {
		score = math.Min(score, 0.05)
	}

	score = math.Round(score*100) / 100
	return score, cefrForScore(score), strings.TrimSpace(feedback), alignEvidence(evidence, firstNonEmpty(input.Response, input.Transcript))
}

// alignEvidence keeps only quotes that really occur in the response. Models
// occasionally invent evidence or return approximate offsets; a wrong highlight
// is worse than no highlight, so unmatched spans are dropped and matched ones
// get the true offsets.
func alignEvidence(spans []Evidence, response string) []Evidence {
	if len(spans) == 0 || response == "" {
		return nil
	}
	out := make([]Evidence, 0, len(spans))
	for _, span := range spans {
		quote := strings.TrimSpace(span.Text)
		if quote == "" {
			continue
		}
		index := strings.Index(response, quote)
		if index < 0 {
			continue
		}
		span.Text = quote
		span.Start = index
		span.End = index + len(quote)
		span.Label = strings.TrimSpace(span.Label)
		out = append(out, span)
		if len(out) == 5 {
			break
		}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func countWords(text string) int {
	return len(strings.Fields(strings.TrimSpace(text)))
}

// shortModelName turns a provider URI into a stable label for the
// evaluator_version column (varchar(30)):
//
//	gpt://b1g.../deepseek-v4-flash/latest -> deepseek-v4-flash
//	gpt-4o-mini                           -> gpt-4o-mini
func shortModelName(model string) string {
	name := strings.TrimSpace(model)
	if strings.HasPrefix(name, "gpt://") {
		parts := strings.Split(strings.TrimPrefix(name, "gpt://"), "/")
		switch {
		case len(parts) >= 3 && parts[len(parts)-1] == "latest":
			name = parts[len(parts)-2]
		case len(parts) >= 2:
			name = parts[len(parts)-1]
		}
	}
	name = strings.TrimSuffix(name, "/latest")
	if len(name) > 30 {
		name = name[:30]
	}
	if name == "" {
		name = "unknown"
	}
	return name
}
