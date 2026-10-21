package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
)

type VocabularyService struct {
	repo repository.VocabularyRepository
}

func NewVocabularyService(repo repository.VocabularyRepository) *VocabularyService {
	return &VocabularyService{repo: repo}
}

func (s *VocabularyService) List(ctx context.Context, search, level string) ([]models.VocabularyEntry, int, error) {
	entries, err := s.repo.List(ctx, search, level)
	if err != nil {
		return nil, 0, err
	}
	count, err := s.repo.Count(ctx)
	if err != nil {
		count = len(entries)
	}
	return entries, count, nil
}
