package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
)

const TotalTheoryLessons = 16

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

type TheoryService struct {
	theoryRepo repository.TheoryRepository
}

func NewTheoryService(theoryRepo repository.TheoryRepository) *TheoryService {
	return &TheoryService{theoryRepo: theoryRepo}
}

func (s *TheoryService) GetProgress(ctx context.Context, userID string) (*models.TheoryProgressResponse, error) {
	completed, err := s.theoryRepo.GetUserProgress(ctx, userID)
	if err != nil {
		return nil, err
	}
	if completed == nil {
		completed = []string{}
	}

	percent := 0
	if len(completed) > 0 {
		percent = (len(completed) * 100) / TotalTheoryLessons
		if percent > 100 {
			percent = 100
		}
	}

	return &models.TheoryProgressResponse{
		CompletedLessons: completed,
		TotalLessons:     TotalTheoryLessons,
		ProgressPercent:  percent,
		IsAllCompleted:   len(completed) >= TotalTheoryLessons,
	}, nil
}

func (s *TheoryService) ToggleCompletion(ctx context.Context, userID, lessonSlug string) (*models.TheoryProgressResponse, error) {
	_, err := s.theoryRepo.ToggleProgress(ctx, userID, lessonSlug)
	if err != nil {
		return nil, err
	}
	return s.GetProgress(ctx, userID)
}

func (s *TheoryService) IsTheoryCompleted(ctx context.Context, userID string) bool {
	completed, err := s.theoryRepo.GetUserProgress(ctx, userID)
	if err != nil {
		return false
	}
	return len(completed) >= TotalTheoryLessons
}
