package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
)

type BannerService struct {
	bannerRepo repository.BannerRepository
}

func NewBannerService(bannerRepo repository.BannerRepository) *BannerService {
	return &BannerService{bannerRepo: bannerRepo}
}

func (s *BannerService) GetActiveBanners(ctx context.Context, placement string) ([]models.AdBanner, error) {
	if placement == "" {
		placement = "HEADER"
	}
	return s.bannerRepo.GetActiveByPlacement(ctx, placement)
}

func (s *BannerService) RecordClick(ctx context.Context, id string) error {
	return s.bannerRepo.RecordClick(ctx, id)
}

func (s *BannerService) RecordImpression(ctx context.Context, id string) error {
	return s.bannerRepo.RecordImpression(ctx, id)
}
