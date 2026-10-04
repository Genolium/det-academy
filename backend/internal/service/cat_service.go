package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Stages in sequence matching MAIN.MD and TestEngine
var StageSequence = []string{
	"READ_SELECT",
	"FILL_BLANKS",
	"C_TEST",
	"LISTEN_TYPE",
	"INTERACTIVE_READING",
	"INTERACTIVE_LISTENING",
	"WRITE_PHOTO",
	"INTERACTIVE_WRITING",
	"WRITING_SAMPLE",
}

type CATService struct {
	sessionRepo   repository.TestSessionRepository
	questionRepo  repository.QuestionRepository
	theoryRepo    repository.TheoryRepository
	certRepo      repository.CertificateRepository
	theoryService *TheoryService
}

func NewCATService(
	sessionRepo repository.TestSessionRepository,
	questionRepo repository.QuestionRepository,
	theoryRepo repository.TheoryRepository,
	certRepo repository.CertificateRepository,
	theoryService *TheoryService,
) *CATService {
	return &CATService{
		sessionRepo:   sessionRepo,
		questionRepo:  questionRepo,
		theoryRepo:    theoryRepo,
		certRepo:      certRepo,
		theoryService: theoryService,
	}
}

// StartSession creates a new CAT session
func (s *CATService) StartSession(ctx context.Context, userID, candidateName, initialDifficulty string) (*models.TestSession, []models.Question, error) {
	if initialDifficulty == "" {
		initialDifficulty = "B1"
	}
	if candidateName == "" {
		candidateName = "Candidate"
	}
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000002" // default guest user
	}

	session := &models.TestSession{
		ID:              uuid.New().String(),
		UserID:          userID,
		CandidateName:   candidateName,
		Status:          "IN_PROGRESS",
		CurrentStage:    1,
		StageName:       StageSequence[0],
		DifficultyLevel: initialDifficulty,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, nil, fmt.Errorf("failed to create test session: %w", err)
	}

	// Fetch initial questions for Stage 1
	questions, err := s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, session.DifficultyLevel)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch initial questions: %w", err)
	}

	return session, questions, nil
}

// GetSession retrieves session by ID
func (s *CATService) GetSession(ctx context.Context, sessionID string) (*models.TestSession, error) {
	return s.sessionRepo.GetByID(ctx, sessionID)
}

// GetQuestionsForStage retrieves questions for given type and difficulty
func (s *CATService) GetQuestionsForStage(ctx context.Context, stageName, difficulty string) ([]models.Question, error) {
	return s.questionRepo.ListByTypeAndDifficulty(ctx, stageName, difficulty)
}

// ComputeNextDifficulty implements CAT Multi-Stage Testing transition
func ComputeNextDifficulty(currentDiff string, accuracy float64) string {
	diffLevels := []string{"A2", "B1", "B2", "C1"}
	currIdx := 1 // default B1
	for i, d := range diffLevels {
		if d == currentDiff {
			currIdx = i
			break
		}
	}

	if accuracy >= 0.80 {
		if currIdx < len(diffLevels)-1 {
			currIdx++
		}
	} else if accuracy < 0.50 {
		if currIdx > 0 {
			currIdx--
		}
	}

	return diffLevels[currIdx]
}

// SubmitStageResult completes a stage, adjusts CAT difficulty, and advances to next stage
func (s *CATService) SubmitStageResult(ctx context.Context, sessionID string, req models.StageCompleteRequest) (*models.TestSession, []models.Question, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, nil, errors.New("session not found")
	}

	if session.Status != "IN_PROGRESS" {
		return nil, nil, errors.New("session is not in progress")
	}

	// Adjust difficulty based on accuracy
	nextDiff := ComputeNextDifficulty(session.DifficultyLevel, req.Accuracy)
	session.DifficultyLevel = nextDiff

	// Advance stage
	if session.CurrentStage < len(StageSequence) {
		session.CurrentStage++
		session.StageName = StageSequence[session.CurrentStage-1]
	} else {
		session.StageName = "COMPLETED"
	}

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, nil, fmt.Errorf("failed to update session stage: %w", err)
	}

	var nextQuestions []models.Question
	if session.StageName != "COMPLETED" {
		nextQuestions, _ = s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, session.DifficultyLevel)
	}

	return session, nextQuestions, nil
}

// RecordQuestionResponse records an individual question answer
func (s *CATService) RecordQuestionResponse(ctx context.Context, sessionID string, req models.SubmitResponseRequest) error {
	isCorrect := req.RawScore >= 0.7
	resp := &models.QuestionResponse{
		ID:           uuid.New().String(),
		SessionID:    sessionID,
		QuestionID:   req.QuestionID,
		UserResponse: req.UserResponse,
		IsCorrect:    &isCorrect,
		RawScore:     req.RawScore,
		TimeSpentSec: req.TimeSpentSec,
	}

	return s.sessionRepo.RecordResponse(ctx, resp)
}

// Levenshtein distance calculation
func LevenshteinDistance(a, b string) int {
	la := len(a)
	lb := len(b)
	if la == 0 {
		return lb
	}
	if lb == 0 {
		return la
	}

	matrix := make([][]int, lb+1)
	for i := range matrix {
		matrix[i] = make([]int, la+1)
		matrix[i][0] = i
	}
	for j := 0; j <= la; j++ {
		matrix[0][j] = j
	}

	for i := 1; i <= lb; i++ {
		for j := 1; j <= la; j++ {
			cost := 1
			if b[i-1] == a[j-1] {
				cost = 0
			}
			matrix[i][j] = int(math.Min(
				float64(matrix[i-1][j-1]+cost),
				math.Min(float64(matrix[i][j-1]+1), float64(matrix[i-1][j]+1)),
			))
		}
	}

	return matrix[lb][la]
}

// StringSimilarity returns normalized similarity [0.0 .. 1.0]
func StringSimilarity(source, target string) float64 {
	s := strings.TrimSpace(source)
	t := strings.TrimSpace(target)
	maxLen := math.Max(float64(len(s)), float64(len(t)))
	if maxLen == 0 {
		return 1.0
	}
	dist := LevenshteinDistance(s, t)
	sim := (maxLen - float64(dist)) / maxLen
	if sim < 0 {
		return 0
	}
	return sim
}

// RoundToDetScale rounds score to nearest multiple of 5 between 10 and 160
func RoundToDetScale(score float64) int {
	clamped := math.Max(10, math.Min(160, score))
	rounded := int(math.Round(clamped/5.0) * 5.0)
	return rounded
}

// ComputeFinalScores calculates overall and 4 subscores matching MAIN.MD specifications
func ComputeFinalScores(req models.CompleteSessionRequest) models.CalculatedScores {
	toScale := func(ratio float64) float64 {
		return 30.0 + ratio*130.0
	}

	// Literacy = Reading + Writing (Read & Select, C-Test, Interactive Reading, Writing)
	literacyRatio := req.ReadSelectAccuracy*0.25 +
		req.CTestAccuracy*0.25 +
		req.InteractiveReadingScore*0.25 +
		req.WritingScore*0.25

	// Comprehension = Reading + Listening
	compRatio := req.ReadSelectAccuracy*0.20 +
		req.FillBlanksAccuracy*0.20 +
		req.InteractiveReadingScore*0.20 +
		req.ListenTypeAccuracy*0.20 +
		req.InteractiveListeningScore*0.20

	// Production = Writing + Speaking (In non-speaking MVP: Writing + C-Test + Fill in Blanks)
	prodRatio := req.WritingScore*0.70 +
		req.CTestAccuracy*0.15 +
		req.FillBlanksAccuracy*0.15

	// Conversation = Listening + Speaking (In non-speaking MVP: Listen & Type + Interactive Listening)
	convRatio := req.ListenTypeAccuracy*0.50 +
		req.InteractiveListeningScore*0.50

	literacy := RoundToDetScale(toScale(literacyRatio))
	comprehension := RoundToDetScale(toScale(compRatio))
	production := RoundToDetScale(toScale(prodRatio))
	conversation := RoundToDetScale(toScale(convRatio))

	avg := float64(literacy+comprehension+production+conversation) / 4.0
	overall := RoundToDetScale(avg)

	return models.CalculatedScores{
		Overall:       overall,
		Literacy:      literacy,
		Comprehension: comprehension,
		Production:    production,
		Conversation:  conversation,
	}
}

// CompleteSession finishes test, calculates scores, updates session, and generates certificate if eligible
func (s *CATService) CompleteSession(ctx context.Context, sessionID string, req models.CompleteSessionRequest) (*models.SessionCompleteResponse, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}

	scores := ComputeFinalScores(req)
	now := time.Now()

	session.Status = "COMPLETED"
	session.StageName = "COMPLETED"
	session.CurrentStage = len(StageSequence) + 1
	session.OverallScore = &scores.Overall
	session.LiteracyScore = &scores.Literacy
	session.ComprehensionScore = &scores.Comprehension
	session.ProductionScore = &scores.Production
	session.ConversationScore = &scores.Conversation
	session.CompletedAt = &now

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to update completed session: %w", err)
	}

	// Check certificate eligibility:
	// Rule from MAIN.MD: theory_progress_percentage == 100% AND best_mock_test_score >= 105
	isTheoryComplete := s.theoryService.IsTheoryCompleted(ctx, session.UserID)
	eligible := isTheoryComplete && scores.Overall >= 105

	var cert *models.Certificate
	if eligible {
		// Generate certificate ID
		certID := "det-cert-" + session.ID[:8]
		cert = &models.Certificate{
			ID:                 certID,
			UserID:             session.UserID,
			TestSessionID:      session.ID,
			CandidateName:      session.CandidateName,
			OverallScore:       scores.Overall,
			LiteracyScore:      scores.Literacy,
			ComprehensionScore: scores.Comprehension,
			ProductionScore:    scores.Production,
			ConversationScore:  scores.Conversation,
			IssuedAt:           now,
			PDFURL:             fmt.Sprintf("/api/v1/certificates/%s/pdf", certID),
			IsVerified:         true,
		}

		_ = s.certRepo.Create(ctx, cert)
	}

	return &models.SessionCompleteResponse{
		Session:             *session,
		Scores:              scores,
		CertificateEligible: eligible,
		Certificate:         cert,
	}, nil
}
