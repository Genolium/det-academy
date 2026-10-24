package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

const TotalTheoryLessons = 16

var ErrUnknownTheoryLesson = errors.New("unknown theory lesson")

var LessonSlugs = []string{
	"rules-and-technicalities",
	"subscores-and-cat-engine",
	"read-and-select",
	"listen-and-select",
	"fill-in-the-blanks",
	"read-and-complete",
	"listen-and-type",
	"read-aloud",
	"interactive-reading",
	"interactive-listening",
	"write-about-photo",
	"interactive-writing",
	"writing-sample",
	"speak-about-photo",
	"read-listen-speak",
	"speaking-sample",
}

func IsValidLessonSlug(slug string) bool {
	for _, valid := range LessonSlugs {
		if valid == slug {
			return true
		}
	}
	return false
}

func ValidCompletedLessons(completed []string) []string {
	seen := make(map[string]struct{}, len(completed))
	valid := make([]string, 0, len(completed))
	for _, slug := range completed {
		if !IsValidLessonSlug(slug) {
			continue
		}
		if _, exists := seen[slug]; exists {
			continue
		}
		seen[slug] = struct{}{}
		valid = append(valid, slug)
	}
	return valid
}

type TheoryService struct {
	theoryRepo repository.TheoryRepository
	studyRepo  repository.StudyRepository
}

func NewTheoryService(theoryRepo repository.TheoryRepository, studyRepos ...repository.StudyRepository) *TheoryService {
	ts := &TheoryService{theoryRepo: theoryRepo}
	if len(studyRepos) > 0 {
		ts.studyRepo = studyRepos[0]
	}
	return ts
}

func (s *TheoryService) GetProgress(ctx context.Context, userID string) (*models.TheoryProgressResponse, error) {
	completed, err := s.theoryRepo.GetUserProgress(ctx, userID)
	if err != nil {
		return nil, err
	}
	if completed == nil {
		completed = []string{}
	}

	valid := ValidCompletedLessons(completed)
	percent := 0
	if len(valid) > 0 {
		percent = (len(valid) * 100) / TotalTheoryLessons
		if percent > 100 {
			percent = 100
		}
	}

	return &models.TheoryProgressResponse{
		CompletedLessons: valid,
		TotalLessons:     TotalTheoryLessons,
		ProgressPercent:  percent,
		IsAllCompleted:   len(valid) >= TotalTheoryLessons,
	}, nil
}

func (s *TheoryService) ToggleCompletion(ctx context.Context, userID, lessonSlug string) (*models.TheoryProgressResponse, error) {
	if !IsValidLessonSlug(lessonSlug) {
		return nil, ErrUnknownTheoryLesson
	}
	completed, err := s.theoryRepo.ToggleProgress(ctx, userID, lessonSlug)
	if err != nil {
		return nil, err
	}

	if completed && s.studyRepo != nil {
		today := time.Now().UTC().Format("2006-01-02")
		_ = s.studyRepo.RecordActivity(ctx, userID, today, "theory")
		_ = s.studyRepo.CompletePlanTask(ctx, userID, "task-theory", today, "theory_lesson")
		_, _ = s.studyRepo.AwardXP(ctx, &models.XPEvent{
			ID:             uuid.NewString(),
			UserID:         userID,
			EventType:      "lesson",
			IdempotencyKey: "lesson:" + lessonSlug,
			XP:             20,
			CreatedAt:      time.Now().UTC(),
		})
		emitLearningEvent(ctx, s.studyRepo, userID, "lesson_completed", "lesson:"+lessonSlug, map[string]any{
			"slug": lessonSlug,
		})
	}

	return s.GetProgress(ctx, userID)
}

func (s *TheoryService) IsTheoryCompleted(ctx context.Context, userID string) bool {
	completed, err := s.theoryRepo.GetUserProgress(ctx, userID)
	if err != nil {
		return false
	}
	return len(ValidCompletedLessons(completed)) >= TotalTheoryLessons
}
