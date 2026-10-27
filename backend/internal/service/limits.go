package service

import (
	"context"
	"errors"
	"os"
	"strconv"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
)

// ErrDailyLimitReached is returned when the student has used the daily
// allowance for an expensive action (a full mock or a speaking task).
var ErrDailyLimitReached = errors.New("daily limit reached")

// SpeakingQuestionTypes are the server question types that consume the daily
// speaking allowance.
var SpeakingQuestionTypes = []string{
	"SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE",
}

func envLimit(name string, fallback int) int {
	raw := os.Getenv(name)
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	if value <= 0 {
		return 0 // explicitly unlimited
	}
	return value
}

func envFloat(name string, fallback float64) float64 {
	raw := os.Getenv(name)
	if raw == "" {
		return fallback
	}
	value, err := strconv.ParseFloat(raw, 64)
	if err != nil || value < 0 {
		return fallback
	}
	return value
}

func envOrString(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func startOfUTCDay() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}

func isSpeakingType(questionType string) bool {
	for _, speakingType := range SpeakingQuestionTypes {
		if speakingType == questionType {
			return true
		}
	}
	return false
}

// checkMockDailyLimit enforces DAILY_MOCK_LIMIT (default 3) for full mocks.
func checkMockDailyLimit(ctx context.Context, repo repository.TestSessionRepository, userID string) error {
	limit := envLimit("DAILY_MOCK_LIMIT", 3)
	if limit == 0 {
		return nil
	}
	used, err := repo.CountUserSessionsSince(ctx, userID, startOfUTCDay())
	if err != nil {
		return err
	}
	if used >= limit {
		return ErrDailyLimitReached
	}
	return nil
}

// checkSpeakingDailyLimit enforces DAILY_SPEAKING_LIMIT (default 20) for
// speaking practice tasks.
func checkSpeakingDailyLimit(ctx context.Context, repo repository.StudyRepository, userID string) error {
	limit := envLimit("DAILY_SPEAKING_LIMIT", 20)
	if limit == 0 || userID == "" {
		return nil
	}
	used, err := repo.CountPracticeAttemptsSince(ctx, userID, startOfUTCDay(), SpeakingQuestionTypes)
	if err != nil {
		return err
	}
	if used >= limit {
		return ErrDailyLimitReached
	}
	return nil
}

// GetDailyLimits reports the remaining allowance for the UI.
func (s *StudyService) GetDailyLimits(ctx context.Context, userID string) (*models.DailyLimits, error) {
	if s == nil || userID == "" {
		return &models.DailyLimits{Date: startOfUTCDay().Format("2006-01-02")}, nil
	}
	since := startOfUTCDay()
	limits := &models.DailyLimits{Date: since.Format("2006-01-02")}

	if s.catService != nil {
		limits.MockLimit = envLimit("DAILY_MOCK_LIMIT", 3)
		if used, err := s.catService.sessionRepo.CountUserSessionsSince(ctx, userID, since); err == nil {
			limits.MockUsed = used
		}
	}

	limits.SpeakingLimit = envLimit("DAILY_SPEAKING_LIMIT", 20)
	if used, err := s.storage.Study().CountPracticeAttemptsSince(ctx, userID, since, SpeakingQuestionTypes); err == nil {
		limits.SpeakingUsed = used
	}
	return limits, nil
}
