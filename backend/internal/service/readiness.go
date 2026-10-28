package service

import (
	"fmt"
	"math"
	"strings"

	"det-academy-backend/internal/models"
)

// estimateScoreRange turns the completed mock attempts into an honest interval.
// One attempt produces a deliberately wide, low-confidence band; the interval
// narrows only as attempts accumulate and stop contradicting each other.
func estimateScoreRange(sessions []models.TestSession) *models.ScoreRange {
	scores := make([]float64, 0, 5)
	for index, session := range sessions {
		if index >= 5 {
			break
		}
		score := intVal(session.OverallScore)
		if score > 0 {
			scores = append(scores, float64(score))
		}
	}
	if len(scores) == 0 {
		return nil
	}

	latest := scores[0]
	if len(scores) == 1 {
		return &models.ScoreRange{
			Low:        clampScore(latest - 10),
			High:       clampScore(latest + 10),
			Confidence: "low",
			Basis:      fmt.Sprintf("Один завершённый мок: ориентир %d ± 10 баллов. После второго теста диапазон сузится.", int(latest)),
		}
	}

	mean := 0.0
	for _, score := range scores {
		mean += score
	}
	mean /= float64(len(scores))

	variance := 0.0
	for _, score := range scores {
		variance += (score - mean) * (score - mean)
	}
	variance /= float64(len(scores))
	stddev := math.Sqrt(variance)

	margin := int(math.Round(1.645 * stddev))
	if margin < 5 {
		margin = 5
	}
	if margin > 25 {
		margin = 25
	}

	confidence := "high"
	switch {
	case len(scores) < 2 || stddev > 15:
		confidence = "low"
	case len(scores) < 3 || stddev > 8:
		confidence = "medium"
	}

	return &models.ScoreRange{
		Low:        clampScore(latest - float64(margin)),
		High:       clampScore(latest + float64(margin)),
		Confidence: confidence,
		Basis: fmt.Sprintf(
			"%d мока, последний %d, разброс ±%d баллов (σ %.1f). Диапазон 90%%.",
			len(scores), int(latest), margin, stddev,
		),
	}
}

func clampScore(value float64) int {
	if value < 10 {
		return 10
	}
	if value > 160 {
		return 160
	}
	return int(math.Round(value))
}

// projectTrajectory extrapolates the recent mock trend to the exam date. It
// refuses to invent a trend from a single attempt and caps the daily slope so
// one lucky retake cannot promise an unrealistic jump.
func projectTrajectory(sessions []models.TestSession, targetScore, daysRemaining int) *models.ProjectedRange {
	if len(sessions) < 2 || daysRemaining <= 0 {
		return nil
	}
	type point struct {
		day   float64
		score float64
	}
	points := make([]point, 0, 5)
	for index := 0; index < len(sessions) && index < 5; index++ {
		session := sessions[len(sessions)-1-index]
		if session.CompletedAt == nil {
			continue
		}
		points = append(points, point{
			day:   float64(session.CompletedAt.Unix()) / 86400,
			score: float64(intVal(session.OverallScore)),
		})
	}
	if len(points) < 2 {
		return nil
	}
	// points are oldest -> newest after the reverse walk above.
	var sumX, sumY, sumXY, sumXX float64
	for _, p := range points {
		sumX += p.day
		sumY += p.score
		sumXY += p.day * p.score
		sumXX += p.day * p.day
	}
	n := float64(len(points))
	denominator := n*sumXX - sumX*sumX
	if denominator == 0 {
		return nil
	}
	slope := (n*sumXY - sumX*sumY) / denominator
	if slope > 2 {
		slope = 2
	}
	if slope < -2 {
		slope = -2
	}
	latest := points[len(points)-1].score
	projected := latest + slope*float64(daysRemaining)
	if projected < 10 {
		projected = 10
	}
	if projected > 160 {
		projected = 160
	}

	margin := int(math.Round(8 + math.Abs(slope)*float64(daysRemaining)*0.35))
	if margin < 8 {
		margin = 8
	}
	if margin > 25 {
		margin = 25
	}
	confidence := "medium"
	if len(points) >= 3 && math.Abs(slope) < 0.8 {
		confidence = "high"
	}
	if len(points) < 3 || math.Abs(slope) > 1.2 {
		confidence = "low"
	}

	return &models.ProjectedRange{
		Low:         clampScore(projected - float64(margin)),
		High:        clampScore(projected + float64(margin)),
		Target:      targetScore,
		OnTrack:     projected >= float64(targetScore),
		Confidence:  confidence,
		SlopePerDay: math.Round(slope*100) / 100,
		Basis: fmt.Sprintf(
			"Тренд по %d мокам: %+.2f балла в день. К дате экзамена через %d дней: около %d.",
			len(points), slope, daysRemaining, int(math.Round(projected)),
		),
	}
}

var drillByQuestionType = map[string]struct {
	title string
	slug  string
}{
	"READ_SELECT":           {"Read and Select", "read-and-select"},
	"FILL_BLANKS":           {"Fill in the Blanks", "fill-in-the-blanks"},
	"C_TEST":                {"Read and Complete", "read-and-complete"},
	"LISTEN_TYPE":           {"Listen and Type", "listen-and-type"},
	"INTERACTIVE_READING":   {"Interactive Reading", "read-and-complete"},
	"INTERACTIVE_LISTENING": {"Interactive Listening", "listen-and-type"},
	"SPEAK_PHOTO":           {"Speak About Photo", "speak-about-photo"},
	"READ_THEN_SPEAK":       {"Read Then Speak", "speak-about-photo"},
	"INTERACTIVE_SPEAKING":  {"Interactive Speaking", "speaking-sample"},
	"SPEAKING_SAMPLE":       {"Speaking Sample", "speaking-sample"},
	"WRITE_PHOTO":           {"Write About Photo", "write-about-the-photo"},
	"WRITING_SAMPLE":        {"Writing Sample", "writing-inspector"},
	"INTERACTIVE_WRITING":   {"Interactive Writing", "writing-inspector"},
}

// buildNextBestAction picks one concrete 10-minute task instead of a generic
// "practise more" message. Unmastered errors decide the type when any exist;
// otherwise the weakest measured skill does.
func buildNextBestAction(errors []models.UserErrorItem, weakestSkill string) *models.NextBestAction {
	counts := map[string]int{}
	for _, item := range errors {
		if item.Mastered {
			continue
		}
		if _, ok := drillByQuestionType[item.QuestionType]; ok {
			counts[item.QuestionType]++
		}
	}

	bestType := ""
	bestCount := 0
	for questionType, count := range counts {
		if count > bestCount {
			bestType, bestCount = questionType, count
		}
	}
	if bestType != "" {
		drill := drillByQuestionType[bestType]
		return &models.NextBestAction{
			Title:       "Отработать " + drill.title,
			Description: fmt.Sprintf("%d неусвоенных ошибок этого типа: 10 минут точечной практики.", bestCount),
			Href:        "/practice?drill=" + drill.slug,
			Type:        bestType,
			Minutes:     10,
			Reason:      fmt.Sprintf("В тетради ошибок %d неусвоенных заданий типа %s.", bestCount, bestType),
		}
	}

	fallback := "LISTEN_TYPE"
	switch {
	case strings.Contains(weakestSkill, "Speaking"):
		fallback = "SPEAK_PHOTO"
	case strings.Contains(weakestSkill, "Writing"):
		fallback = "WRITING_SAMPLE"
	case strings.Contains(weakestSkill, "Reading"):
		fallback = "READ_SELECT"
	}
	drill := drillByQuestionType[fallback]
	return &models.NextBestAction{
		Title:       "10 минут: " + drill.title,
		Description: "Короткая тренировка слабейшего навыка, чтобы не терять день.",
		Href:        "/practice?drill=" + drill.slug,
		Type:        fallback,
		Minutes:     10,
		Reason:      "Ошибок в тетради нет — тренируем слабейший измеренный навык.",
	}
}
