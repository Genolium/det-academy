package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

type InstitutionService struct {
	repo repository.InstitutionRepository
}

func NewInstitutionService(repo repository.InstitutionRepository) *InstitutionService {
	return &InstitutionService{repo: repo}
}

func (s *InstitutionService) List(ctx context.Context, search, country string, minScore int, category string) ([]models.Institution, error) {
	return s.repo.List(ctx, search, country, minScore, category)
}

func (s *InstitutionService) GetByID(ctx context.Context, id string) (*models.Institution, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *InstitutionService) Create(ctx context.Context, req models.CreateInstitutionRequest) (*models.Institution, error) {
	if req.Name == "" || req.Country == "" {
		return nil, errors.New("name and country are required")
	}
	if req.MinScore == 0 {
		req.MinScore = 115
	}
	if req.Category == "" {
		req.Category = "Top Global"
	}

	inst := &models.Institution{
		ID:             uuid.New().String(),
		Name:           req.Name,
		Country:        req.Country,
		City:           req.City,
		State:          req.State,
		MinScore:       req.MinScore,
		SubscoreReqs:   req.SubscoreReqs,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		WebsiteURL:     req.WebsiteURL,
		LogoURL:        req.LogoURL,
		Category:       req.Category,
		AcceptanceRate: req.AcceptanceRate,
		Programs:       req.Programs,
		CreatedAt:      time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, inst); err != nil {
		return nil, err
	}

	return inst, nil
}

func (s *InstitutionService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *InstitutionService) Count(ctx context.Context) (int, error) {
	return s.repo.Count(ctx)
}
