package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
)

type VocabularyService struct {
	repo repository.VocabularyRepository
}

func NewVocabularyService(repo repository.VocabularyRepository) *VocabularyService {
	return &VocabularyService{repo: repo}
}

func (s *VocabularyService) List(ctx context.Context, search, level, source string, limit, offset int) ([]models.VocabularyEntry, int, error) {
	if limit <= 0 || limit > 200 {
		limit = 60
	}
	if offset < 0 {
		offset = 0
	}
	entries, err := s.repo.List(ctx, search, level, source, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	count, err := s.repo.CountFiltered(ctx, search, level, source)
	if err != nil {
		count = len(entries)
	}
	return entries, count, nil
}

func (s *VocabularyService) ListAll(ctx context.Context) ([]models.VocabularyEntry, error) {
	return s.repo.ListAll(ctx)
}

func (s *VocabularyService) UpdateStatus(ctx context.Context, id, status string) error {
	switch status {
	case "draft", "reviewed", "published", "archived":
	default:
		return errors.New("invalid publication status")
	}
	return s.repo.UpdateStatus(ctx, id, status)
}
