package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"fmt"
	"time"
)

type CertificateService struct {
	certRepo    repository.CertificateRepository
	sessionRepo repository.TestSessionRepository
	theoryRepo  repository.TheoryRepository
}

func NewCertificateService(
	certRepo repository.CertificateRepository,
	sessionRepo repository.TestSessionRepository,
	theoryRepo repository.TheoryRepository,
) *CertificateService {
	return &CertificateService{
		certRepo:    certRepo,
		sessionRepo: sessionRepo,
		theoryRepo:  theoryRepo,
	}
}

func (s *CertificateService) GetByID(ctx context.Context, id string) (*models.Certificate, error) {
	cert, err := s.certRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("certificate not found")
	}
	cert.IsVerified = true
	return cert, nil
}

func (s *CertificateService) GetByUserID(ctx context.Context, userID string) ([]models.Certificate, error) {
	return s.certRepo.GetByUserID(ctx, userID)
}

func (s *CertificateService) IssueCertificate(ctx context.Context, sessionID string) (*models.Certificate, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}

	if session.Status != "COMPLETED" || session.OverallScore == nil {
		return nil, errors.New("cannot issue certificate for incomplete session")
	}

	if *session.OverallScore < 105 {
		return nil, errors.New("score must be at least 105 to receive a certificate")
	}

	completedLessons, err := s.theoryRepo.GetUserProgress(ctx, session.UserID)
	if err != nil || len(completedLessons) < TotalTheoryLessons {
		return nil, errors.New("all 12 theory lessons must be completed to receive a certificate")
	}

	// Check if already issued
	existing, err := s.certRepo.GetBySessionID(ctx, sessionID)
	if err == nil && existing != nil {
		return existing, nil
	}

	certID := "det-cert-" + session.ID[:8]
	cert := &models.Certificate{
		ID:                 certID,
		UserID:             session.UserID,
		TestSessionID:      session.ID,
		CandidateName:      session.CandidateName,
		OverallScore:       *session.OverallScore,
		LiteracyScore:      *session.LiteracyScore,
		ComprehensionScore: *session.ComprehensionScore,
		ProductionScore:    *session.ProductionScore,
		ConversationScore:  *session.ConversationScore,
		IssuedAt:           time.Now(),
		PDFURL:             fmt.Sprintf("/api/v1/certificates/%s/pdf", certID),
		IsVerified:         true,
	}

	if err := s.certRepo.Create(ctx, cert); err != nil {
		return nil, err
	}

	return cert, nil
}
