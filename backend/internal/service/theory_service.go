package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

const TotalTheoryLessons = 13

var ErrUnknownTheoryLesson = errors.New("unknown theory lesson")

// LessonSlugs is the single backend list of trackable DET task lessons, in the
// order the tasks appear on the test.
var LessonSlugs = []string{
	"read-and-select",
	"fill-in-the-blanks",
	"read-and-complete",
	"listen-and-type",
	"interactive-reading",
	"interactive-listening",
	"write-about-photo",
	"interactive-writing",
	"speak-about-photo",
	"read-then-speak",
	"interactive-speaking",
	"writing-sample",
	"speaking-sample",
}

// ReferenceLessonSlugs are useful orientation pages, not graded DET tasks.
// They stay visible but never count toward progress or a certificate.
var ReferenceLessonSlugs = []string{
	"rules-and-technicalities",
	"subscores-and-cat-engine",
}

func IsTrackableLessonSlug(slug string) bool {
	for _, valid := range LessonSlugs {
		if valid == slug {
			return true
		}
	}
	return false
}

func isReferenceLessonSlug(slug string) bool {
	for _, valid := range ReferenceLessonSlugs {
		if valid == slug {
			return true
		}
	}
	return false
}

func IsValidLessonSlug(slug string) bool {
	return IsTrackableLessonSlug(slug) || isReferenceLessonSlug(slug)
}

func ValidCompletedLessons(completed []string) []string {
	seen := make(map[string]struct{}, len(completed))
	valid := make([]string, 0, len(completed))
	for _, slug := range completed {
		if !IsTrackableLessonSlug(slug) {
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
	if !IsTrackableLessonSlug(lessonSlug) {
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

// GetCatalog returns the single versioned theory catalogue. The frontend uses
// this instead of merging a CMS response with a static array.
func (s *TheoryService) GetCatalog(ctx context.Context) (*models.TheoryCatalogResponse, error) {
	lessons, err := s.theoryRepo.ListCatalog(ctx)
	if err != nil {
		return nil, err
	}
	version := "2026.3"
	updatedAt := time.Time{}
	for _, lesson := range lessons {
		if lesson.Version != "" {
			version = lesson.Version
		}
		if lesson.UpdatedAt.After(updatedAt) {
			updatedAt = lesson.UpdatedAt
		}
	}
	return &models.TheoryCatalogResponse{
		Version: version, UpdatedAt: updatedAt, Status: "published", Lessons: lessons,
	}, nil
}
