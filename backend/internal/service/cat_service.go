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

// IRT Difficulty Theta Map matching CEFR bands on latent trait scale [-3.0 .. +3.0]
var DifficultyThetaMap = map[string]float64{
	"A2": -1.8,
	"B1": -0.6,
	"B2": 0.5,
	"C1": 1.6,
	"C2": 2.4,
}

const (
	ScalingConstantD = 1.702 // Item Response Theory scaling factor
	DefaultDiscrimA  = 1.2   // Default item discrimination parameter
)

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

// ProbabilityCorrect2PL calculates logistic probability P(θ) of answering correctly
func ProbabilityCorrect2PL(theta, b, a float64) float64 {
	exponent := -ScalingConstantD * a * (theta - b)
	return 1.0 / (1.0 + math.Exp(exponent))
}

// UpdateTheta2PL updates candidate latent ability trait θ using Bayesian EAP step
func UpdateTheta2PL(currentTheta, itemDifficulty, scoreRatio, discrimination float64) float64 {
	if discrimination <= 0 {
		discrimination = DefaultDiscrimA
	}
	expectedProb := ProbabilityCorrect2PL(currentTheta, itemDifficulty, discrimination)
	residual := scoreRatio - expectedProb

	learningRate := 0.45
	delta := learningRate * discrimination * residual

	// Clamp single step change to prevent divergence
	clampedDelta := math.Max(-0.6, math.Min(0.6, delta))
	newTheta := currentTheta + clampedDelta

	// Bounded latent trait [-3.0 .. +3.0]
	return math.Max(-3.0, math.Min(3.0, newTheta))
}

// ThetaToDetScore maps latent trait [-3.0 .. +3.0] to official DET scale [10 .. 160]
func ThetaToDetScore(theta float64) int {
	raw := 105.0 + theta*18.5
	clamped := math.Max(10.0, math.Min(160.0, raw))
	return int(math.Round(clamped/5.0) * 5.0)
}

// DetScoreToTheta maps official DET score to latent trait
func DetScoreToTheta(score int) float64 {
	clamped := math.Max(10.0, math.Min(160.0, float64(score)))
	return math.Max(-3.0, math.Min(3.0, (clamped-105.0)/18.5))
}

// ComputeNextDifficulty determines next stage CEFR difficulty band using IRT ability
func ComputeNextDifficulty(currentDiff string, accuracy float64) string {
	currTheta, ok := DifficultyThetaMap[currentDiff]
	if !ok {
		currTheta = DifficultyThetaMap["B1"]
	}

	// Dynamic sensitivity scaling for multi-stage transitions
	learningRate := 0.75
	expectedProb := ProbabilityCorrect2PL(currTheta, currTheta, DefaultDiscrimA)
	residual := accuracy - expectedProb
	updatedTheta := currTheta + learningRate*DefaultDiscrimA*residual

	if updatedTheta < -1.2 {
		return "A2"
	} else if updatedTheta < -0.2 {
		return "B1"
	} else if updatedTheta < 0.9 {
		return "B2"
	}
	return "C1"
}

// SubmitStageResult completes a stage, adjusts CAT difficulty using IRT, and advances to next stage
func (s *CATService) SubmitStageResult(ctx context.Context, sessionID string, req models.StageCompleteRequest) (*models.TestSession, []models.Question, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, nil, errors.New("session not found")
	}

	if session.Status != "IN_PROGRESS" {
		return nil, nil, errors.New("session is not in progress")
	}

	// Adjust difficulty based on IRT
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

// LevenshteinDistance calculates edit distance with O(min(N,M)) space optimization (No 2D slice allocations)
func LevenshteinDistance(a, b string) int {
	if a == b {
		return 0
	}
	ra := []rune(a)
	rb := []rune(b)

	la := len(ra)
	lb := len(rb)

	if la == 0 {
		return lb
	}
	if lb == 0 {
		return la
	}

	// Ensure rb is the shorter slice to minimize memory buffer allocation
	if la < lb {
		ra, rb = rb, ra
		la, lb = lb, la
	}

	// Fast-path: Common prefix and suffix stripping
	start := 0
	for start < lb && ra[start] == rb[start] {
		start++
	}
	for la > start && lb > start && ra[la-1] == rb[lb-1] {
		la--
		lb--
	}

	ra = ra[start:la]
	rb = rb[start:lb]
	la = len(ra)
	lb = len(rb)

	if lb == 0 {
		return la
	}

	// Single 1D rolling array of size lb + 1
	row := make([]int, lb+1)
	for j := 0; j <= lb; j++ {
		row[j] = j
	}

	for i := 1; i <= la; i++ {
		prevDiag := row[0]
		row[0] = i
		for j := 1; j <= lb; j++ {
			temp := row[j]
			cost := 1
			if ra[i-1] == rb[j-1] {
				cost = 0
			}
			ins := row[j] + 1
			del := row[j-1] + 1
			rep := prevDiag + cost
			minVal := ins
			if del < minVal {
				minVal = del
			}
			if rep < minVal {
				minVal = rep
			}
			row[j] = minVal
			prevDiag = temp
		}
	}

	return row[lb]
}

// StringSimilarity returns normalized similarity [0.0 .. 1.0]
func StringSimilarity(source, target string) float64 {
	s := strings.TrimSpace(source)
	t := strings.TrimSpace(target)
	if s == t {
		return 1.0
	}
	maxLen := math.Max(float64(len([]rune(s))), float64(len([]rune(t))))
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

// ComputeFinalScores calculates overall and 4 subscores using calibrated IRT scaling
func ComputeFinalScores(req models.CompleteSessionRequest) models.CalculatedScores {
	// Ratio to theta latent ability trait mapping [-2.5 .. +2.5]
	ratioToTheta := func(ratio float64) float64 {
		clampedRatio := math.Max(0.05, math.Min(0.95, ratio))
		return math.Log(clampedRatio/(1.0-clampedRatio)) / 1.2
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

	// Production = Writing + Speaking (In current pipeline: Writing + C-Test + Fill in Blanks)
	prodRatio := req.WritingScore*0.70 +
		req.CTestAccuracy*0.15 +
		req.FillBlanksAccuracy*0.15

	// Conversation = Listening + Speaking (In current pipeline: Listen & Type + Interactive Listening)
	convRatio := req.ListenTypeAccuracy*0.50 +
		req.InteractiveListeningScore*0.50

	literacy := ThetaToDetScore(ratioToTheta(literacyRatio))
	comprehension := ThetaToDetScore(ratioToTheta(compRatio))
	production := ThetaToDetScore(ratioToTheta(prodRatio))
	conversation := ThetaToDetScore(ratioToTheta(convRatio))

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
