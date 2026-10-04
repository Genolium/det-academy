package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

type AdminService struct {
	userRepo  repository.UserRepository
	testRepo  repository.TestSessionRepository
	qRepo     repository.QuestionRepository
	certRepo  repository.CertificateRepository
	bRepo     repository.BannerRepository
	instRepo  repository.InstitutionRepository
}

func NewAdminService(
	userRepo repository.UserRepository,
	testRepo repository.TestSessionRepository,
	qRepo repository.QuestionRepository,
	certRepo repository.CertificateRepository,
	bRepo repository.BannerRepository,
	instRepo repository.InstitutionRepository,
) *AdminService {
	return &AdminService{
		userRepo: userRepo,
		testRepo: testRepo,
		qRepo:    qRepo,
		certRepo: certRepo,
		bRepo:    bRepo,
		instRepo: instRepo,
	}
}

func (s *AdminService) GetStats(ctx context.Context) (*models.AdminStats, error) {
	users, totalUsers, err := s.userRepo.ListAll(ctx, 1, 10, "", "")
	if err != nil {
		return nil, err
	}

	totalSessions, completedSessions, avgScore, scoreDist, err := s.testRepo.GetStats(ctx)
	if err != nil {
		return nil, err
	}

	totalCerts, err := s.certRepo.Count(ctx)
	if err != nil {
		totalCerts = 0
	}

	activeBanners, totalClicks, err := s.bRepo.GetStats(ctx)
	if err != nil {
		activeBanners = 0
		totalClicks = 0
	}

	totalQuestions, err := s.qRepo.Count(ctx)
	if err != nil {
		totalQuestions = 0
	}

	totalInstitutions, err := s.instRepo.Count(ctx)
	if err != nil {
		totalInstitutions = 0
	}

	return &models.AdminStats{
		TotalUsers:          totalUsers,
		TotalSessions:       totalSessions,
		CompletedSessions:   completedSessions,
		AverageScore:        avgScore,
		TotalCertificates:   totalCerts,
		ActiveBanners:       activeBanners,
		TotalBannerClicks:   totalClicks,
		TotalQuestions:      totalQuestions,
		TotalInstitutions:   totalInstitutions,
		ScoreDistribution:   scoreDist,
		RecentRegistrations: users,
	}, nil
}

func (s *AdminService) ListRecentSessions(ctx context.Context, limit int) ([]models.TestSession, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.testRepo.ListRecent(ctx, limit)
}

func (s *AdminService) ListQuestions(ctx context.Context) ([]models.Question, error) {
	return s.qRepo.ListAllActive(ctx)
}

func (s *AdminService) CreateQuestion(ctx context.Context, req models.CreateQuestionRequest) (*models.Question, error) {
	if req.Type == "" || req.DifficultyBand == "" {
		return nil, errors.New("type and difficulty band are required")
	}

	q := &models.Question{
		ID:             uuid.New().String(),
		Type:           req.Type,
		DifficultyBand: req.DifficultyBand,
		ContentPayload: req.ContentPayload,
		CorrectAnswers: req.CorrectAnswers,
		TimeLimitSec:   req.TimeLimitSec,
		IsActive:       req.IsActive,
		CreatedAt:      time.Now().UTC(),
	}

	if err := s.qRepo.Create(ctx, q); err != nil {
		return nil, err
	}

	return q, nil
}

func (s *AdminService) DeleteQuestion(ctx context.Context, id string) error {
	return s.qRepo.Delete(ctx, id)
}

func (s *AdminService) ListBanners(ctx context.Context) ([]models.AdBanner, error) {
	return s.bRepo.ListAll(ctx)
}

func (s *AdminService) CreateBanner(ctx context.Context, req models.CreateBannerRequest) (*models.AdBanner, error) {
	if req.TargetURL == "" || req.AltText == "" {
		return nil, errors.New("target url and alt text are required")
	}
	if req.Placement == "" {
		req.Placement = "HEADER"
	}

	b := &models.AdBanner{
		ID:          uuid.New().String(),
		Placement:   req.Placement,
		ImageURL:    req.ImageURL,
		TargetURL:   req.TargetURL,
		AltText:     req.AltText,
		IsActive:    req.IsActive,
		Impressions: 0,
		Clicks:      0,
		CreatedAt:   time.Now().UTC(),
	}

	if err := s.bRepo.Create(ctx, b); err != nil {
		return nil, err
	}

	return b, nil
}

func (s *AdminService) UpdateBanner(ctx context.Context, b *models.AdBanner) error {
	return s.bRepo.Update(ctx, b)
}

func (s *AdminService) DeleteBanner(ctx context.Context, id string) error {
	return s.bRepo.Delete(ctx, id)
}
