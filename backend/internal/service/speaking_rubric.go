package service

import (
	"fmt"
	"math"
	"strings"

	"det-academy-backend/internal/models"
)

func roundRubric(value float64) float64 {
	return math.Round(math.Max(0, math.Min(1, value))*100) / 100
}

func rubricBand(score float64) string {
	switch {
	case score >= 0.8:
		return "сильная сторона"
	case score >= 0.6:
		return "уверенно"
	default:
		return "зона роста"
	}
}

func firstSentence(text string) string {
	text = strings.TrimSpace(text)
	if text == "" {
		return ""
	}
	if index := strings.IndexAny(text, ".!?"); index >= 0 && index+1 <= len(text) {
		return strings.TrimSpace(text[:index+1])
	}
	if len(text) > 160 {
		return text[:160] + "…"
	}
	return text
}

// BuildSpeakingRubric turns existing measured signals into four explainable
// criteria. It never invents acoustic evidence: the evidence is the transcript,
// timing metrics or the stored evidence span.
func BuildSpeakingRubric(result *models.EvaluationResult, transcript string) {
	if result == nil {
		return
	}
	quote := firstSentence(transcript)
	if quote == "" && len(result.EvidenceSpans) > 0 {
		quote = result.EvidenceSpans[0].Text
	}
	if quote == "" {
		quote = "Ответ без распознанного текста."
	}

	wpm := result.SpeechRate
	if wpm == 0 {
		wpm = result.WPM
	}
	fluency := 1.0
	switch {
	case wpm == 0:
		fluency = 0.55
	case wpm < 80:
		fluency = 0.45
	case wpm < 110:
		fluency = 0.7
	case wpm > 190:
		fluency = 0.6
	}
	fluency -= math.Min(0.2, result.PauseRatio*0.4)
	fluency -= math.Min(0.15, float64(result.FillerCount)*0.02)

	lexical := result.LexicalDiversity
	if lexical == 0 {
		lexical = 0.5
	}
	lexical += math.Min(0.15, float64(len(result.AcademicWords))*0.03)

	relevance := result.RelevanceScore
	if relevance == 0 {
		relevance = result.Score
	}

	accuracy := result.Score
	if accuracy == 0 {
		accuracy = 0.5
	}

	criteria := []models.RubricCriterion{
		{
			Key: "fluency", Label: "Беглость и темп", Score: roundRubric(fluency), Band: rubricBand(fluency),
			Evidence:   fmt.Sprintf("Темп: %d сл/мин, паузы: %d%%, слов-заполнителей: %d.", int(math.Round(wpm)), int(math.Round(result.PauseRatio*100)), result.FillerCount),
			Suggestion: "Держите темп 110–160 сл/мин и делайте паузы на границах идей, а не внутри фраз.",
		},
		{
			Key: "lexical", Label: "Лексика", Score: roundRubric(lexical), Band: rubricBand(lexical),
			Evidence:   fmt.Sprintf("Разнообразие: %d%%, академических слов: %d.", int(math.Round(result.LexicalDiversity*100)), len(result.AcademicWords)),
			Suggestion: "Добавьте 2–3 точных академических слова и один синоним вместо повтора.",
		},
		{
			Key: "relevance", Label: "Соответствие заданию", Score: roundRubric(relevance), Band: rubricBand(relevance),
			Evidence:   quote,
			Suggestion: "В первом предложении прямо ответьте на вопрос задания, затем приведите пример.",
		},
		{
			Key: "accuracy", Label: "Точность и структура", Score: roundRubric(accuracy), Band: rubricBand(accuracy),
			Evidence:   quote,
			Suggestion: "Проверьте согласование времён и добавьте один связующий маркер (however, therefore, for example).",
		},
	}

	weakest := criteria[0]
	for _, criterion := range criteria[1:] {
		if criterion.Score < weakest.Score {
			weakest = criterion
		}
	}
	result.Rubric = criteria
	result.NextAction = weakest.Suggestion
}
