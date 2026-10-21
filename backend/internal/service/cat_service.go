package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Stages in sequence matching official modern DET 13-stage exam structure
var StageSequence = []string{
	"READ_SELECT",
	"FILL_BLANKS",
	"C_TEST",
	"LISTEN_TYPE",
	"INTERACTIVE_READING",
	"INTERACTIVE_LISTENING",
	"WRITE_PHOTO",
	"INTERACTIVE_WRITING",
	"SPEAK_PHOTO",
	"READ_THEN_SPEAK",
	"INTERACTIVE_SPEAKING",
	"WRITING_SAMPLE",
	"SPEAKING_SAMPLE",
}

// StageDefaultDurations defines the time limit in seconds for each exam stage
var StageDefaultDurations = map[string]int{
	"READ_SELECT":           75,  // 15 items * 5s
	"FILL_BLANKS":           120, // 6 items * 20s
	"C_TEST":                180, // 3 minutes
	"LISTEN_TYPE":           180, // 3 items * 60s
	"INTERACTIVE_READING":   420, // 7 minutes
	"INTERACTIVE_LISTENING": 240, // 4 minutes
	"WRITE_PHOTO":           180, // 3 items * 60s
	"INTERACTIVE_WRITING":   480, // 5 min prompt + 3 min follow-up
	"SPEAK_PHOTO":           90,  // 90s speech
	"READ_THEN_SPEAK":       90,  // 90s speech
	"INTERACTIVE_SPEAKING":  210, // 6 turns * 35s
	"WRITING_SAMPLE":        300, // 5 minutes
	"SPEAKING_SAMPLE":       180, // 3 minutes
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
	evaluator     *Evaluator
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
		evaluator:     NewEvaluator(),
	}
}

// sanitizeQuestionsForStudent strips sensitive correct answers before delivering questions to students
func sanitizeQuestionsForStudent(questions []models.Question) []models.Question {
	sanitized := make([]models.Question, len(questions))
	for i := range questions {
		sanitized[i] = questions[i]
		sanitized[i].CorrectAnswers = nil
	}
	return sanitized
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
		return nil, nil, errors.New("authorization required to start test session")
	}

	initialStage := StageSequence[0]
	durationSec := StageDefaultDurations[initialStage]
	if durationSec <= 0 {
		durationSec = 180
	}
	deadline := time.Now().Add(time.Duration(durationSec) * time.Second)

	session := &models.TestSession{
		ID:              uuid.New().String(),
		UserID:          userID,
		CandidateName:   candidateName,
		Status:          "IN_PROGRESS",
		CurrentStage:    1,
		StageName:       initialStage,
		DifficultyLevel: initialDifficulty,
		DeadlineAt:      &deadline,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, nil, fmt.Errorf("failed to create test session: %w", err)
	}

	// Fetch initial questions for Stage 1
	questions, err := s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, session.DifficultyLevel)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch initial questions: %w", err)
	}
	if len(questions) == 0 {
		questions, _ = s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, "")
	}

	return session, sanitizeQuestionsForStudent(questions), nil
}

// GetSession retrieves session by ID with ownership verification
func (s *CATService) GetSession(ctx context.Context, sessionID, userID string) (*models.TestSession, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session.UserID != userID {
		return nil, errors.New("access denied: session does not belong to user")
	}
	return session, nil
}

// GetSessionWithDetails retrieves active session with sanitized questions, recorded responses, and blueprint
func (s *CATService) GetSessionWithDetails(ctx context.Context, sessionID, userID string) (*models.SessionDetailsResponse, error) {
	session, err := s.GetSession(ctx, sessionID, userID)
	if err != nil {
		return nil, err
	}

	var questions []models.Question
	if session.Status == "IN_PROGRESS" && session.StageName != "COMPLETED" {
		questions, _ = s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, session.DifficultyLevel)
		if len(questions) == 0 {
			questions, _ = s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, "")
		}
	}

	responses, _ := s.sessionRepo.GetSessionResponses(ctx, sessionID)
	if responses == nil {
		responses = []models.QuestionResponse{}
	}

	return &models.SessionDetailsResponse{
		Session:   *session,
		Questions: sanitizeQuestionsForStudent(questions),
		Responses: responses,
		Blueprint: models.GetDefaultExamBlueprint(),
	}, nil
}

// GetUserSessions retrieves all test sessions for a given user ordered by created_at DESC
func (s *CATService) GetUserSessions(ctx context.Context, userID string) ([]models.TestSession, error) {
	if userID == "" {
		return []models.TestSession{}, nil
	}
	sessions, err := s.sessionRepo.GetUserSessions(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}
	if sessions == nil {
		sessions = []models.TestSession{}
	}
	return sessions, nil
}

// GetQuestionsForStage retrieves questions for given type and difficulty, sanitizing answers
func (s *CATService) GetQuestionsForStage(ctx context.Context, stageName, difficulty string) ([]models.Question, error) {
	questions, err := s.questionRepo.ListByTypeAndDifficulty(ctx, stageName, difficulty)
	if err != nil {
		return nil, err
	}
	return sanitizeQuestionsForStudent(questions), nil
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
func (s *CATService) SubmitStageResult(ctx context.Context, sessionID, userID string, req models.StageCompleteRequest) (*models.TestSession, []models.Question, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, nil, errors.New("session not found")
	}
	if session.UserID != userID {
		return nil, nil, errors.New("access denied: session does not belong to user")
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
		durationSec := StageDefaultDurations[session.StageName]
		if durationSec <= 0 {
			durationSec = 180
		}
		deadline := time.Now().Add(time.Duration(durationSec) * time.Second)
		session.DeadlineAt = &deadline
	} else {
		session.StageName = "COMPLETED"
		session.DeadlineAt = nil
	}

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, nil, fmt.Errorf("failed to update session stage: %w", err)
	}

	var nextQuestions []models.Question
	if session.StageName != "COMPLETED" {
		nextQuestions, _ = s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, session.DifficultyLevel)
		if len(nextQuestions) == 0 {
			nextQuestions, _ = s.questionRepo.ListByTypeAndDifficulty(ctx, session.StageName, "")
		}
	}

	return session, sanitizeQuestionsForStudent(nextQuestions), nil
}

// RecordQuestionResponse records and grades an individual question answer on the server
func (s *CATService) RecordQuestionResponse(ctx context.Context, sessionID, userID string, req models.SubmitResponseRequest) error {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return errors.New("session not found")
	}
	if session.UserID != userID {
		return errors.New("access denied: session does not belong to user")
	}
	if session.Status == "COMPLETED" {
		return errors.New("session is already completed and cannot be modified")
	}

	trimmedResponse := strings.TrimSpace(string(req.UserResponse))
	// Empty responses always receive 0 score
	if trimmedResponse == "" || trimmedResponse == `""` || trimmedResponse == "null" || trimmedResponse == "{}" || trimmedResponse == "[]" {
		isCorrect := false
		resp := &models.QuestionResponse{
			ID:           uuid.New().String(),
			SessionID:    sessionID,
			QuestionID:   req.QuestionID,
			UserResponse: req.UserResponse,
			IsCorrect:    &isCorrect,
			RawScore:     0.0,
			TimeSpentSec: req.TimeSpentSec,
		}
		return s.sessionRepo.RecordResponse(ctx, resp)
	}

	var calculatedScore float64
	var isCorrect bool

	// Server-side grading based on question answer key
	if q, err := s.questionRepo.GetByID(ctx, req.QuestionID); err == nil && q != nil && len(q.CorrectAnswers) > 0 {
		switch q.Type {
		case "READ_SELECT":
			var ca struct {
				IsReal bool `json:"isReal"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil {
				var userBool bool
				var userObj struct {
					Selected bool `json:"selected"`
					IsReal   bool `json:"isReal"`
				}
				if err := json.Unmarshal(req.UserResponse, &userObj); err == nil && (userObj.Selected || userObj.IsReal) {
					userBool = userObj.Selected || userObj.IsReal
				} else if err := json.Unmarshal(req.UserResponse, &userBool); err == nil {
					// parsed as bool
				} else {
					userBool = strings.EqualFold(trimmedResponse, "true") || strings.EqualFold(trimmedResponse, "real")
				}
				if userBool == ca.IsReal {
					isCorrect = true
					calculatedScore = 1.0
				} else {
					isCorrect = false
					calculatedScore = 0.0
				}
			}
		case "FILL_BLANKS":
			var ca struct {
				Answer string `json:"answer"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil {
				var userText string
				var userObj struct {
					Answer string `json:"answer"`
				}
				if err := json.Unmarshal(req.UserResponse, &userObj); err == nil && userObj.Answer != "" {
					userText = userObj.Answer
				} else if err := json.Unmarshal(req.UserResponse, &userText); err == nil {
					// parsed as string
				} else {
					userText = strings.Trim(trimmedResponse, `"'`)
				}
				if strings.EqualFold(strings.TrimSpace(userText), strings.TrimSpace(ca.Answer)) {
					isCorrect = true
					calculatedScore = 1.0
				} else {
					isCorrect = false
					calculatedScore = 0.0
				}
			}
		case "LISTEN_TYPE":
			var ca struct {
				Text string `json:"text"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil {
				var userText string
				if err := json.Unmarshal(req.UserResponse, &userText); err != nil {
					userText = strings.Trim(trimmedResponse, `"'`)
				}
				sim := StringSimilarity(userText, ca.Text)
				calculatedScore = sim
				isCorrect = sim >= 0.85
			}
		case "C_TEST":
			var ca struct {
				Answers []string `json:"answers"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil && len(ca.Answers) > 0 {
				var userAnswers []string
				if err := json.Unmarshal(req.UserResponse, &userAnswers); err == nil && len(userAnswers) > 0 {
					matched := 0
					for i, a := range ca.Answers {
						if i < len(userAnswers) && strings.EqualFold(strings.TrimSpace(userAnswers[i]), strings.TrimSpace(a)) {
							matched++
						}
					}
					calculatedScore = float64(matched) / float64(len(ca.Answers))
					isCorrect = calculatedScore >= 0.7
				}
			}
		case "WRITE_PHOTO", "INTERACTIVE_WRITING", "WRITING_SAMPLE":
			userText, _, _, _ := extractUserText(req.UserResponse)
			keywords := extractContextKeywords(q.ContentPayload)
			eval := s.evaluator.EvaluateWriting(sessionID, req.QuestionID, q.Type, userText, keywords)
			_ = s.sessionRepo.SaveEvaluation(ctx, &eval)
			calculatedScore = eval.Score
			isCorrect = eval.Score >= 0.6
		case "SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE":
			_, transcript, audioURL, durationSec := extractUserText(req.UserResponse)
			keywords := extractContextKeywords(q.ContentPayload)
			eval := s.evaluator.EvaluateSpeaking(sessionID, req.QuestionID, q.Type, transcript, durationSec, keywords)
			if audioURL != "" {
				eval.AudioURL = audioURL
			}
			_ = s.sessionRepo.SaveEvaluation(ctx, &eval)
			calculatedScore = eval.Score
			isCorrect = eval.Score >= 0.6
		default:
			// Generic text evaluation for open-ended items
			userText, _, _, _ := extractUserText(req.UserResponse)
			keywords := extractContextKeywords(q.ContentPayload)
			eval := s.evaluator.EvaluateWriting(sessionID, req.QuestionID, q.Type, userText, keywords)
			_ = s.sessionRepo.SaveEvaluation(ctx, &eval)
			calculatedScore = eval.Score
			isCorrect = eval.Score >= 0.6
		}
	} else {
		// Fallback when question details not in repo: evaluate text directly without trusting client raw score
		userText, transcript, audioURL, durationSec := extractUserText(req.UserResponse)
		var eval models.EvaluationResult
		if audioURL != "" || durationSec > 0 {
			eval = s.evaluator.EvaluateSpeaking(sessionID, req.QuestionID, "SPEAKING_SAMPLE", transcript, durationSec, nil)
			eval.AudioURL = audioURL
		} else {
			eval = s.evaluator.EvaluateWriting(sessionID, req.QuestionID, "WRITING_SAMPLE", userText, nil)
		}
		_ = s.sessionRepo.SaveEvaluation(ctx, &eval)
		calculatedScore = eval.Score
		isCorrect = eval.Score >= 0.6
	}

	resp := &models.QuestionResponse{
		ID:           uuid.New().String(),
		SessionID:    sessionID,
		QuestionID:   req.QuestionID,
		UserResponse: req.UserResponse,
		IsCorrect:    &isCorrect,
		RawScore:     calculatedScore,
		TimeSpentSec: req.TimeSpentSec,
	}

	return s.sessionRepo.RecordResponse(ctx, resp)
}

// RecordAudioResponse records uploaded audio speech, evaluates it, and stores the response.
func (s *CATService) RecordAudioResponse(
	ctx context.Context, sessionID, userID, questionID, audioURL, transcript string, durationSec float64, fileSize int64, asset *models.MediaAsset,
) (*models.EvaluationResult, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}
	if session.UserID != userID {
		return nil, errors.New("access denied: session does not belong to user")
	}
	if session.Status == "COMPLETED" {
		return nil, errors.New("session is already completed and cannot be modified")
	}

	if err := s.sessionRepo.SaveMediaAsset(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to save media asset: %w", err)
	}

	qType := "SPEAKING_SAMPLE"
	var keywords []string
	if questionID != "" {
		if q, err := s.questionRepo.GetByID(ctx, questionID); err == nil && q != nil {
			qType = q.Type
			keywords = extractContextKeywords(q.ContentPayload)
		}
	}

	eval := s.evaluator.EvaluateSpeaking(sessionID, questionID, qType, transcript, durationSec, keywords)
	eval.AudioURL = audioURL
	_ = s.sessionRepo.SaveEvaluation(ctx, &eval)

	userResponseJSON, _ := json.Marshal(map[string]interface{}{
		"audioUrl":    audioURL,
		"transcript":  transcript,
		"durationSec": durationSec,
		"fileSize":    fileSize,
	})

	isCorrect := eval.Score >= 0.6
	resp := &models.QuestionResponse{
		ID:           uuid.New().String(),
		SessionID:    sessionID,
		QuestionID:   questionID,
		UserResponse: userResponseJSON,
		IsCorrect:    &isCorrect,
		RawScore:     eval.Score,
		TimeSpentSec: int(durationSec),
		CreatedAt:    time.Now().UTC(),
	}
	if err := s.sessionRepo.RecordResponse(ctx, resp); err != nil {
		return nil, fmt.Errorf("failed to record question response: %w", err)
	}

	return &eval, nil
}

// GetSessionEvaluations returns rubric feedback and recommendations for all evaluated questions in a session.
func (s *CATService) GetSessionEvaluations(ctx context.Context, sessionID, userID string) ([]models.EvaluationResult, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}
	if session.UserID != userID {
		return nil, errors.New("access denied: session does not belong to user")
	}
	return s.sessionRepo.GetSessionEvaluations(ctx, sessionID)
}

func extractContextKeywords(contentPayload json.RawMessage) []string {
	var payload map[string]interface{}
	if err := json.Unmarshal(contentPayload, &payload); err != nil {
		return nil
	}
	var keywords []string
	if kws, ok := payload["expectedKeywords"].([]interface{}); ok {
		for _, kw := range kws {
			if s, ok := kw.(string); ok {
				keywords = append(keywords, s)
			}
		}
	}
	if prompt, ok := payload["prompt"].(string); ok {
		keywords = append(keywords, TokenizeWords(prompt)...)
	}
	if p1, ok := payload["part1Prompt"].(string); ok {
		keywords = append(keywords, TokenizeWords(p1)...)
	}
	if p2, ok := payload["part2Prompt"].(string); ok {
		keywords = append(keywords, TokenizeWords(p2)...)
	}
	if alt, ok := payload["altText"].(string); ok {
		keywords = append(keywords, TokenizeWords(alt)...)
	}
	return keywords
}

func extractUserText(userResponse json.RawMessage) (text string, transcript string, audioURL string, durationSec float64) {
	trimmed := strings.TrimSpace(string(userResponse))
	var obj map[string]interface{}
	if err := json.Unmarshal(userResponse, &obj); err == nil {
		if t, ok := obj["text"].(string); ok {
			text = t
		}
		if p1, ok := obj["part1"].(string); ok {
			p2, _ := obj["part2"].(string)
			text = strings.TrimSpace(p1 + " " + p2)
		}
		if tr, ok := obj["transcript"].(string); ok {
			transcript = tr
		}
		if aURL, ok := obj["audioUrl"].(string); ok {
			audioURL = aURL
		}
		if d, ok := obj["durationSec"].(float64); ok {
			durationSec = d
		} else if dStr, ok := obj["durationSec"].(string); ok {
			if parsedD, err := strconv.ParseFloat(dStr, 64); err == nil {
				durationSec = parsedD
			}
		}
		if text == "" && transcript != "" {
			text = transcript
		}
		return
	}

	var str string
	if err := json.Unmarshal(userResponse, &str); err == nil {
		text = str
		transcript = str
		return
	}

	text = strings.Trim(trimmed, `"'`)
	transcript = text
	return
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

// MapQuestionTypeToSkill maps a question type to one of the four fundamental DET skills:
// "reading", "listening", "writing", "speaking"
func MapQuestionTypeToSkill(qType string) string {
	switch qType {
	case "READ_SELECT", "FILL_BLANKS", "C_TEST", "INTERACTIVE_READING":
		return "reading"
	case "LISTEN_TYPE", "INTERACTIVE_LISTENING":
		return "listening"
	case "WRITE_PHOTO", "INTERACTIVE_WRITING", "WRITING_SAMPLE":
		return "writing"
	case "SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE":
		return "speaking"
	default:
		return "reading"
	}
}

func deduceQuestionTypeFromID(id string) string {
	lower := strings.ToLower(id)
	switch {
	case strings.Contains(lower, "-rs-") || strings.HasPrefix(lower, "rs-"):
		return "READ_SELECT"
	case strings.Contains(lower, "-fb-") || strings.HasPrefix(lower, "fb-"):
		return "FILL_BLANKS"
	case strings.Contains(lower, "-ct-") || strings.HasPrefix(lower, "ct-"):
		return "C_TEST"
	case strings.Contains(lower, "-lt-") || strings.HasPrefix(lower, "lt-"):
		return "LISTEN_TYPE"
	case strings.Contains(lower, "-ir-") || strings.HasPrefix(lower, "ir-"):
		return "INTERACTIVE_READING"
	case strings.Contains(lower, "-il-") || strings.HasPrefix(lower, "il-"):
		return "INTERACTIVE_LISTENING"
	case strings.Contains(lower, "-wp-") || strings.HasPrefix(lower, "wp-"):
		return "WRITE_PHOTO"
	case strings.Contains(lower, "-iw-") || strings.HasPrefix(lower, "iw-"):
		return "INTERACTIVE_WRITING"
	case strings.Contains(lower, "-sp-") || strings.HasPrefix(lower, "sp-"):
		return "SPEAK_PHOTO"
	case strings.Contains(lower, "-rts-") || strings.HasPrefix(lower, "rts-"):
		return "READ_THEN_SPEAK"
	case strings.Contains(lower, "-is-") || strings.HasPrefix(lower, "is-"):
		return "INTERACTIVE_SPEAKING"
	case strings.Contains(lower, "-ws-") || strings.HasPrefix(lower, "ws-"):
		return "WRITING_SAMPLE"
	case strings.Contains(lower, "-ss-") || strings.HasPrefix(lower, "ss-"):
		return "SPEAKING_SAMPLE"
	default:
		return "READ_SELECT"
	}
}

// ComputeFinalScores calculates overall and 8 subscores (4 individual skills + 4 integrated subscores)
// in accordance with official Duolingo English Test scoring specifications.
func ComputeFinalScores(req models.CompleteSessionRequest) models.CalculatedScores {
	ratioToTheta := func(ratio float64) float64 {
		clampedRatio := math.Max(0.05, math.Min(0.95, ratio))
		return math.Log(clampedRatio/(1.0-clampedRatio)) / 1.2
	}

	readingRatio := (req.ReadSelectAccuracy + req.FillBlanksAccuracy + req.CTestAccuracy + req.InteractiveReadingScore) / 4.0
	if readingRatio <= 0 {
		readingRatio = 0.5
	}
	listeningRatio := (req.ListenTypeAccuracy + req.InteractiveListeningScore) / 2.0
	if listeningRatio <= 0 {
		listeningRatio = 0.5
	}
	writingRatio := req.WritingScore
	if writingRatio <= 0 {
		writingRatio = 0.5
	}
	speakingRatio := req.SpeakingScore
	if speakingRatio <= 0 {
		speakingRatio = (listeningRatio + writingRatio) / 2.0
	}

	reading := ThetaToDetScore(ratioToTheta(readingRatio))
	listening := ThetaToDetScore(ratioToTheta(listeningRatio))
	writing := ThetaToDetScore(ratioToTheta(writingRatio))
	speaking := ThetaToDetScore(ratioToTheta(speakingRatio))

	literacy := RoundToDetScale(float64(reading+writing) / 2.0)
	comprehension := RoundToDetScale(float64(reading+listening) / 2.0)
	production := RoundToDetScale(float64(writing+speaking) / 2.0)
	conversation := RoundToDetScale(float64(listening+speaking) / 2.0)

	overall := RoundToDetScale(float64(reading+listening+writing+speaking) / 4.0)

	return models.CalculatedScores{
		Overall:       overall,
		Reading:       reading,
		Listening:     listening,
		Writing:       writing,
		Speaking:      speaking,
		Literacy:      literacy,
		Comprehension: comprehension,
		Production:    production,
		Conversation:  conversation,
	}
}


// completedSessionResponse rebuilds the canonical response for an already
// finalized attempt. It never recalculates or mutates scores.
func (s *CATService) completedSessionResponse(ctx context.Context, session *models.TestSession) (*models.SessionCompleteResponse, error) {
	intValue := func(value *int) int {
		if value == nil {
			return 0
		}
		return *value
	}

	scores := models.CalculatedScores{
		Overall:       intValue(session.OverallScore),
		Reading:       intValue(session.ReadingScore),
		Listening:     intValue(session.ListeningScore),
		Writing:       intValue(session.WritingScore),
		Speaking:      intValue(session.SpeakingScore),
		Literacy:      intValue(session.LiteracyScore),
		Comprehension: intValue(session.ComprehensionScore),
		Production:    intValue(session.ProductionScore),
		Conversation:  intValue(session.ConversationScore),
	}

	cert, _ := s.certRepo.GetBySessionID(ctx, session.ID)
	eligible := cert != nil
	if !eligible {
		eligible = s.theoryService.IsTheoryCompleted(ctx, session.UserID) && scores.Overall >= 105
	}

	return &models.SessionCompleteResponse{
		Session:             *session,
		Scores:              scores,
		CertificateEligible: eligible,
		Certificate:         cert,
	}, nil
}

// CompleteSession finishes test, calculates scores, updates session, and generates certificate if eligible.
// Requires ownership verification and non-empty verified responses. Repeated
// calls for a completed attempt return the existing immutable result.
func (s *CATService) CompleteSession(ctx context.Context, sessionID, userID string, req models.CompleteSessionRequest) (*models.SessionCompleteResponse, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}
	if session.UserID != userID {
		return nil, errors.New("access denied: session does not belong to user")
	}
	if session.Status == "COMPLETED" {
		// Finalization is idempotent: a lost response or a double click must
		// return the immutable result instead of creating a second one.
		return s.completedSessionResponse(ctx, session)
	}

	// Verify that the session has actual recorded question responses
	responses, err := s.sessionRepo.GetSessionResponses(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve session responses: %w", err)
	}
	if len(responses) == 0 {
		return nil, errors.New("cannot complete session: no question responses recorded")
	}

	// Calculate average recorded accuracy from real responses
	var totalScore float64
	for _, r := range responses {
		totalScore += r.RawScore
	}
	avgAccuracy := totalScore / float64(len(responses))

	// Aggregate verified question responses by skill category
	type skillStats struct {
		sum   float64
		count int
	}
	stats := map[string]*skillStats{
		"reading":   {},
		"listening": {},
		"writing":   {},
		"speaking":  {},
	}

	for _, r := range responses {
		qType := ""
		if q, err := s.questionRepo.GetByID(ctx, r.QuestionID); err == nil && q != nil {
			qType = q.Type
		} else {
			qType = deduceQuestionTypeFromID(r.QuestionID)
		}
		skill := MapQuestionTypeToSkill(qType)
		stats[skill].sum += r.RawScore
		stats[skill].count++
	}

	getSkillRatio := func(skill string, clientReqRatio float64) float64 {
		st := stats[skill]
		if st.count > 0 {
			return st.sum / float64(st.count)
		}
		if clientReqRatio > 0 && clientReqRatio <= 1.0 {
			return math.Min(clientReqRatio, avgAccuracy+0.25)
		}
		return math.Max(0.05, avgAccuracy)
	}

	readingClientRatio := (req.ReadSelectAccuracy + req.FillBlanksAccuracy + req.CTestAccuracy + req.InteractiveReadingScore) / 4.0
	listeningClientRatio := (req.ListenTypeAccuracy + req.InteractiveListeningScore) / 2.0

	readingRatio := getSkillRatio("reading", readingClientRatio)
	listeningRatio := getSkillRatio("listening", listeningClientRatio)
	writingRatio := getSkillRatio("writing", req.WritingScore)
	speakingRatio := getSkillRatio("speaking", req.SpeakingScore)

	ratioToTheta := func(ratio float64) float64 {
		clampedRatio := math.Max(0.05, math.Min(0.95, ratio))
		return math.Log(clampedRatio/(1.0-clampedRatio)) / 1.2
	}

	readingScore := ThetaToDetScore(ratioToTheta(readingRatio))
	listeningScore := ThetaToDetScore(ratioToTheta(listeningRatio))
	writingScore := ThetaToDetScore(ratioToTheta(writingRatio))
	speakingScore := ThetaToDetScore(ratioToTheta(speakingRatio))

	literacy := RoundToDetScale(float64(readingScore+writingScore) / 2.0)
	comprehension := RoundToDetScale(float64(readingScore+listeningScore) / 2.0)
	production := RoundToDetScale(float64(writingScore+speakingScore) / 2.0)
	conversation := RoundToDetScale(float64(listeningScore+speakingScore) / 2.0)

	overall := RoundToDetScale(float64(readingScore+listeningScore+writingScore+speakingScore) / 4.0)

	scores := models.CalculatedScores{
		Overall:       overall,
		Reading:       readingScore,
		Listening:     listeningScore,
		Writing:       writingScore,
		Speaking:      speakingScore,
		Literacy:      literacy,
		Comprehension: comprehension,
		Production:    production,
		Conversation:  conversation,
	}

	now := time.Now()

	session.Status = "COMPLETED"
	session.StageName = "COMPLETED"
	session.CurrentStage = len(StageSequence) + 1
	session.OverallScore = &scores.Overall
	session.ReadingScore = &scores.Reading
	session.ListeningScore = &scores.Listening
	session.WritingScore = &scores.Writing
	session.SpeakingScore = &scores.Speaking
	session.LiteracyScore = &scores.Literacy
	session.ComprehensionScore = &scores.Comprehension
	session.ProductionScore = &scores.Production
	session.ConversationScore = &scores.Conversation
	session.DeadlineAt = nil
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
		prefixLen := 8
		if len(session.ID) < prefixLen {
			prefixLen = len(session.ID)
		}
		certID := "det-cert-" + session.ID[:prefixLen]
		cert = &models.Certificate{
			ID:                 certID,
			UserID:             session.UserID,
			TestSessionID:      session.ID,
			CandidateName:      session.CandidateName,
			OverallScore:       scores.Overall,
			ReadingScore:       scores.Reading,
			ListeningScore:     scores.Listening,
			WritingScore:       scores.Writing,
			SpeakingScore:      scores.Speaking,
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
