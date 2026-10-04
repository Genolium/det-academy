package repository

import (
	"context"
	"det-academy-backend/internal/models"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	UpdateRole(ctx context.Context, id, role string) error
	Delete(ctx context.Context, id string) error
	ListAll(ctx context.Context, page, limit int, search, role string) ([]models.User, int, error)
}

type TheoryRepository interface {
	GetUserProgress(ctx context.Context, userID string) ([]string, error)
	ToggleProgress(ctx context.Context, userID, lessonSlug string) (bool, error)
	SetProgress(ctx context.Context, userID, lessonSlug string, completed bool) error
}

type QuestionRepository interface {
	ListByTypeAndDifficulty(ctx context.Context, qType, difficultyBand string) ([]models.Question, error)
	GetByID(ctx context.Context, id string) (*models.Question, error)
	ListAllActive(ctx context.Context) ([]models.Question, error)
	Create(ctx context.Context, q *models.Question) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int, error)
}

type TestSessionRepository interface {
	Create(ctx context.Context, session *models.TestSession) error
	GetByID(ctx context.Context, id string) (*models.TestSession, error)
	Update(ctx context.Context, session *models.TestSession) error
	RecordResponse(ctx context.Context, resp *models.QuestionResponse) error
	GetSessionResponses(ctx context.Context, sessionID string) ([]models.QuestionResponse, error)
	GetUserSessions(ctx context.Context, userID string) ([]models.TestSession, error)
	ListRecent(ctx context.Context, limit int) ([]models.TestSession, error)
	GetStats(ctx context.Context) (total int, completed int, avgScore float64, scoreDist map[string]int, err error)
}

type CertificateRepository interface {
	Create(ctx context.Context, cert *models.Certificate) error
	GetByID(ctx context.Context, id string) (*models.Certificate, error)
	GetByUserID(ctx context.Context, userID string) ([]models.Certificate, error)
	GetBySessionID(ctx context.Context, sessionID string) (*models.Certificate, error)
	Count(ctx context.Context) (int, error)
}

type BannerRepository interface {
	GetActiveByPlacement(ctx context.Context, placement string) ([]models.AdBanner, error)
	ListAll(ctx context.Context) ([]models.AdBanner, error)
	Create(ctx context.Context, b *models.AdBanner) error
	Update(ctx context.Context, b *models.AdBanner) error
	Delete(ctx context.Context, id string) error
	RecordClick(ctx context.Context, id string) error
	RecordImpression(ctx context.Context, id string) error
	GetStats(ctx context.Context) (activeCount int, totalClicks int, err error)
}

type InstitutionRepository interface {
	List(ctx context.Context, search, country string, minScore int, category string) ([]models.Institution, error)
	GetByID(ctx context.Context, id string) (*models.Institution, error)
	Create(ctx context.Context, inst *models.Institution) error
	Update(ctx context.Context, inst *models.Institution) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int, error)
}

type Storage interface {
	Users() UserRepository
	Theory() TheoryRepository
	Questions() QuestionRepository
	Sessions() TestSessionRepository
	Certificates() CertificateRepository
	Banners() BannerRepository
	Institutions() InstitutionRepository
	Close() error
}
