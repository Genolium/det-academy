package service

import (
	"strings"
	"testing"

	"det-academy-backend/internal/models"
)

func TestSpeakingRubricHasFourCriteriaAndNextAction(t *testing.T) {
	result := &models.EvaluationResult{
		Score:            0.72,
		WordCount:        92,
		LexicalDiversity: 0.66,
		AcademicWords:    []string{"significant", "framework"},
		RelevanceScore:   0.8,
		SpeechRate:       74,
		PauseRatio:       0.18,
		FillerCount:      2,
		EvidenceSpans:    []models.EvidenceSpan{{Text: "The main reason is clear.", Label: "structure"}},
	}
	BuildSpeakingRubric(result, "The main reason is clear. However, the example is short.")
	if len(result.Rubric) != 4 {
		t.Fatalf("rubric = %d criteria", len(result.Rubric))
	}
	for _, criterion := range result.Rubric {
		if criterion.Key == "" || criterion.Label == "" || criterion.Evidence == "" || criterion.Suggestion == "" {
			t.Fatalf("incomplete criterion: %+v", criterion)
		}
		if criterion.Score < 0 || criterion.Score > 1 {
			t.Fatalf("score out of range: %+v", criterion)
		}
	}
	if result.NextAction == "" || !strings.Contains(result.NextAction, "темп") {
		t.Fatalf("next action = %q", result.NextAction)
	}
}
