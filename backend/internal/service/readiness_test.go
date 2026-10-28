package service

import (
	"testing"
	"time"

	"det-academy-backend/internal/models"
)

func sessionWithScore(score int) models.TestSession {
	return models.TestSession{OverallScore: intPtr(score)}
}

func intPtr(value int) *int { return &value }

func TestEstimateScoreRangeRequiresData(t *testing.T) {
	if estimateScoreRange(nil) != nil {
		t.Fatal("no sessions must not produce a range")
	}
}

func TestEstimateScoreRangeSingleAttempt(t *testing.T) {
	result := estimateScoreRange([]models.TestSession{sessionWithScore(120)})
	if result == nil {
		t.Fatal("missing range")
	}
	if result.Low != 110 || result.High != 130 {
		t.Fatalf("range = %d-%d, want 110-130", result.Low, result.High)
	}
	if result.Confidence != "low" {
		t.Fatalf("confidence = %q, want low", result.Confidence)
	}
	if result.Basis == "" {
		t.Fatal("missing basis")
	}
}

func TestEstimateScoreRangeNarrowsWithConsistentAttempts(t *testing.T) {
	result := estimateScoreRange([]models.TestSession{
		sessionWithScore(120), sessionWithScore(122), sessionWithScore(119),
	})
	if result == nil {
		t.Fatal("missing range")
	}
	if result.Confidence != "high" {
		t.Fatalf("confidence = %q, want high", result.Confidence)
	}
	if result.High-result.Low > 11 {
		t.Fatalf("range too wide: %d-%d", result.Low, result.High)
	}
}

func TestEstimateScoreRangeWidensWithVolatileAttempts(t *testing.T) {
	result := estimateScoreRange([]models.TestSession{
		sessionWithScore(140), sessionWithScore(95), sessionWithScore(135),
	})
	if result == nil {
		t.Fatal("missing range")
	}
	if result.Confidence != "low" {
		t.Fatalf("confidence = %q, want low", result.Confidence)
	}
	if result.High-result.Low < 30 {
		t.Fatalf("range should be wide, got %d-%d", result.Low, result.High)
	}
}

func TestNextBestActionPrefersErrorNotebook(t *testing.T) {
	errors := []models.UserErrorItem{
		{QuestionType: "READ_SELECT"},
		{QuestionType: "READ_SELECT"},
		{QuestionType: "C_TEST"},
		{QuestionType: "READ_SELECT", Mastered: true},
	}
	action := buildNextBestAction(errors, "Не определено")
	if action == nil {
		t.Fatal("missing action")
	}
	if action.Type != "READ_SELECT" || action.Minutes != 10 {
		t.Fatalf("action = %+v", action)
	}
	if action.Href != "/practice?drill=read-and-select" {
		t.Fatalf("href = %q", action.Href)
	}
	if action.Title == "" || action.Reason == "" {
		t.Fatalf("incomplete action: %+v", action)
	}
}

func TestNextBestActionFallsBackToWeakestSkill(t *testing.T) {
	action := buildNextBestAction(nil, "Speaking (Устная речь)")
	if action == nil || action.Type != "SPEAK_PHOTO" {
		t.Fatalf("action = %+v", action)
	}
	fallback := buildNextBestAction(nil, "Не определено")
	if fallback == nil || fallback.Type == "" || fallback.Href == "" {
		t.Fatalf("fallback = %+v", fallback)
	}
}

func TestProjectTrajectoryNeedsHistory(t *testing.T) {
	if projectTrajectory(nil, 125, 30) != nil {
		t.Fatal("no sessions must not produce a projection")
	}
	one := []models.TestSession{{OverallScore: intPtr(110), CompletedAt: timePtr(time.Now().Add(-24 * time.Hour))}}
	if projectTrajectory(one, 125, 30) != nil {
		t.Fatal("one session must not produce a trend")
	}
}

func TestProjectTrajectoryExtrapolatesRecentTrend(t *testing.T) {
	now := time.Now().UTC()
	sessions := []models.TestSession{
		{OverallScore: intPtr(120), CompletedAt: timePtr(now.Add(-2 * 24 * time.Hour))},
		{OverallScore: intPtr(112), CompletedAt: timePtr(now.Add(-12 * 24 * time.Hour))},
		{OverallScore: intPtr(104), CompletedAt: timePtr(now.Add(-22 * 24 * time.Hour))},
	}
	result := projectTrajectory(sessions, 125, 20)
	if result == nil {
		t.Fatal("missing projection")
	}
	if result.Low >= result.High {
		t.Fatalf("range = %d-%d", result.Low, result.High)
	}
	if result.SlopePerDay <= 0 {
		t.Fatalf("slope = %v", result.SlopePerDay)
	}
	if result.Low < 100 {
		t.Fatalf("projection too low: %d-%d", result.Low, result.High)
	}
}

func timePtr(value time.Time) *time.Time { return &value }
