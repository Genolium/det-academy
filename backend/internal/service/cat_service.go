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
var ErrQuestionAlreadyAnswered = errors.New("question has already been answered")
var ErrStageAlreadyCompleted = errors.New("stage has already been completed")

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
	sessionRepo     repository.TestSessionRepository
	questionRepo    repository.QuestionRepository
	theoryRepo      repository.TheoryRepository
	certRepo        repository.CertificateRepository
	theoryService   *TheoryService
	evaluator       *Evaluator
	studyRepo       repository.StudyRepository
	evaluationQueue *EvaluationQueue
}

func NewCATService(
	sessionRepo repository.TestSessionRepository,
	questionRepo repository.QuestionRepository,
	theoryRepo repository.TheoryRepository,
	certRepo repository.CertificateRepository,
	theoryService *TheoryService,
	studyRepos ...repository.StudyRepository,
) *CATService {
	service := &CATService{
		sessionRepo:   sessionRepo,
		questionRepo:  questionRepo,
		theoryRepo:    theoryRepo,
		certRepo:      certRepo,
		theoryService: theoryService,
		evaluator:     NewEvaluator(),
	}
	if len(studyRepos) > 0 {
		service.studyRepo = studyRepos[0]
	}
	return service
}

func (s *CATService) SetEvaluationQueue(queue *EvaluationQueue) {
	s.evaluationQueue = queue
}

// sanitizeContentPayload removes answer-bearing fields that some question
// payloads used to expose next to the public prompt.
func sanitizeContentPayload(questionType string, raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return raw
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return raw
	}
	switch questionType {
	case "FILL_BLANKS":
		delete(payload, "fullWord")
	case "INTERACTIVE_READING":
		if gap, ok := payload["gapSentence"].(map[string]interface{}); ok {
			delete(gap, "correct")
		}
		for _, key := range []string{"titleQuestion", "mainIdeaQuestion"} {
			if question, ok := payload[key].(map[string]interface{}); ok {
				delete(question, "correctIndex")
			}
		}
	case "INTERACTIVE_LISTENING":
		if turns, ok := payload["turns"].([]interface{}); ok {
			for _, turn := range turns {
				if turnMap, ok := turn.(map[string]interface{}); ok {
					delete(turnMap, "correctIndex")
				}
			}
		}
	}
	sanitized, err := json.Marshal(payload)
	if err != nil {
		return raw
	}
	return sanitized
}

// sanitizeQuestionsForStudent strips sensitive correct answers before delivering questions to students
func sanitizeQuestionsForStudent(questions []models.Question) []models.Question {
	sanitized := make([]models.Question, len(questions))
	for i := range questions {
		sanitized[i] = questions[i]
		sanitized[i].CorrectAnswers = nil
		sanitized[i].ContentPayload = sanitizeContentPayload(questions[i].Type, questions[i].ContentPayload)
	}
	return sanitized
}

// StartSession creates a new CAT session
func (s *CATService) StartSession(ctx context.Context, userID, candidateName, initialDifficulty string, modes ...string) (*models.TestSession, []models.Question, error) {
	if initialDifficulty == "" {
		initialDifficulty = "B1"
	}
	if candidateName == "" {
		candidateName = "Candidate"
	}
	mode := "full"
	if len(modes) > 0 && modes[0] != "" {
		mode = modes[0]
	}
	if mode != "diagnostic" {
		mode = "full"
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
		Mode:            mode,
		DeadlineAt:      &deadline,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, nil, fmt.Errorf("failed to create test session: %w", err)
	}

	// Fetch a deterministic blueprint-sized initial question set.
	questions, err := s.stageQuestions(ctx, session.StageName, session.DifficultyLevel, session.Mode)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch initial questions: %w", err)
	}
	if err := s.assignSessionQuestions(ctx, session, questions); err != nil {
		return nil, nil, fmt.Errorf("failed to assign initial questions: %w", err)
	}

	return session, sanitizeQuestionsForStudent(questions), nil
}

// stageItemCount returns the blueprint-defined number of items for a stage.
func stageItemCount(stageName string) int {
	blueprint := models.GetDefaultExamBlueprint()
	for _, stage := range blueprint.Stages {
		if stage.StageName == stageName && stage.ItemCount > 0 {
			return stage.ItemCount
		}
	}
	return 1
}

var DiagnosticItemCount = map[string]int{
	"READ_SELECT": 6, "FILL_BLANKS": 3, "C_TEST": 1, "LISTEN_TYPE": 1,
	"INTERACTIVE_READING": 1, "INTERACTIVE_LISTENING": 1, "WRITE_PHOTO": 1,
	"INTERACTIVE_WRITING": 1, "SPEAK_PHOTO": 1, "READ_THEN_SPEAK": 1,
	"INTERACTIVE_SPEAKING": 1, "WRITING_SAMPLE": 1, "SPEAKING_SAMPLE": 1,
}

// stageQuestions returns a deterministic, blueprint-sized question set for a
// stage. If the exact difficulty band has too few items, it falls back to the
// full type pool instead of silently shrinking the stage.
func (s *CATService) stageQuestions(ctx context.Context, stageName, difficulty string, modes ...string) ([]models.Question, error) {
	count := stageItemCount(stageName)
	if len(modes) > 0 && modes[0] == "diagnostic" {
		if diagnosticCount, ok := DiagnosticItemCount[stageName]; ok {
			count = diagnosticCount
		}
	}
	questions, err := s.questionRepo.ListByTypeAndDifficulty(ctx, stageName, difficulty)
	if err != nil {
		return nil, err
	}
	if len(questions) < count {
		fallback, fallbackErr := s.questionRepo.ListByTypeAndDifficulty(ctx, stageName, "")
		if fallbackErr == nil && len(fallback) > len(questions) {
			questions = fallback
		}
	}
	if len(questions) > count {
		questions = questions[:count]
	}
	return questions, nil
}

func (s *CATService) assignSessionQuestions(ctx context.Context, session *models.TestSession, questions []models.Question) error {
	if len(questions) == 0 {
		return nil
	}
	now := time.Now().UTC()
	assignments := make([]models.SessionQuestion, 0, len(questions))
	for index, question := range questions {
		limit := question.TimeLimitSec
		if limit <= 0 {
			limit = StageDefaultDurations[session.StageName]
		}
		if limit <= 0 {
			limit = 120
		}
		// The stage is the authoritative clock. Per-item deadlines derived from
		// a single assignment timestamp would expire every item at once and
		// reject legitimate answers after the first few seconds.
		deadlineAt := now.Add(time.Duration(limit) * time.Second)
		if session.DeadlineAt != nil {
			deadlineAt = *session.DeadlineAt
		}
		assignments = append(assignments, models.SessionQuestion{
			SessionID:  session.ID,
			QuestionID: question.ID,
			StageName:  session.StageName,
			Position:   index,
			IssuedAt:   now,
			DeadlineAt: deadlineAt,
		})
	}
	return s.sessionRepo.AssignQuestions(ctx, assignments)
}

func (s *CATService) questionsForAssignments(ctx context.Context, assignments []models.SessionQuestion) ([]models.Question, error) {
	questions := make([]models.Question, 0, len(assignments))
	for _, assignment := range assignments {
		question, err := s.questionRepo.GetByID(ctx, assignment.QuestionID)
		if err == nil && question != nil {
			questions = append(questions, *question)
		}
	}
	return questions, nil
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

func isSpeakingQuestionType(questionType string) bool {
	switch questionType {
	case "SPEAK_PHOTO", "READ_THEN_SPEAK", "INTERACTIVE_SPEAKING", "SPEAKING_SAMPLE":
		return true
	default:
		return false
	}
}

// sanitizeResponsesForStudent removes grading metadata from an active attempt.
// Correctness and raw scores are returned only through the review endpoint after
// the session is completed.
func sanitizeResponsesForStudent(responses []models.QuestionResponse) []models.QuestionResponse {
	sanitized := make([]models.QuestionResponse, 0, len(responses))
	for _, response := range responses {
		response.IsCorrect = nil
		response.RawScore = 0
		sanitized = append(sanitized, response)
	}
	return sanitized
}

// GetSessionWithDetails retrieves active session with sanitized questions, recorded responses, and blueprint
func (s *CATService) GetSessionWithDetails(ctx context.Context, sessionID, userID string) (*models.SessionDetailsResponse, error) {
	session, err := s.GetSession(ctx, sessionID, userID)
	if err != nil {
		return nil, err
	}

	var questions []models.Question
	if session.Status == "IN_PROGRESS" && session.StageName != "COMPLETED" {
		assignments, assignmentErr := s.sessionRepo.GetAssignedQuestions(ctx, session.ID, session.StageName)
		if assignmentErr == nil && len(assignments) > 0 {
			questions, _ = s.questionsForAssignments(ctx, assignments)
		}
		if len(questions) == 0 {
			questions, _ = s.stageQuestions(ctx, session.StageName, session.DifficultyLevel, session.Mode)
			_ = s.assignSessionQuestions(ctx, session, questions)
		}
	}

	responses, _ := s.sessionRepo.GetSessionResponses(ctx, sessionID)
	if responses == nil {
		responses = []models.QuestionResponse{}
	}

	return &models.SessionDetailsResponse{
		Session:   *session,
		Questions: sanitizeQuestionsForStudent(questions),
		Responses: sanitizeResponsesForStudent(responses),
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
	var session *models.TestSession
	var questions []models.Question
	err := s.sessionRepo.WithSessionLock(ctx, sessionID, func() error {
		var innerErr error
		session, questions, innerErr = s.submitStageResultLocked(ctx, sessionID, userID, req)
		return innerErr
	})
	return session, questions, err
}

func (s *CATService) submitStageResultLocked(ctx context.Context, sessionID, userID string, req models.StageCompleteRequest) (*models.TestSession, []models.Question, error) {
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
	if req.StageName == "" {
		return nil, nil, errors.New("stageName is required")
	}
	if req.StageName != session.StageName {
		return nil, nil, ErrStageAlreadyCompleted
	}

	// Prefer server-verified responses for difficulty adaptation. A client
	// accuracy hint is used only when the stage produced no recorded answers.
	stageAccuracy := math.Max(0, math.Min(1, req.Accuracy))
	stageTypes := QuestionTypesForStage(session.StageName)
	stageResponseCount := 0
	if len(stageTypes) > 0 {
		if responses, err := s.sessionRepo.GetSessionResponses(ctx, sessionID); err == nil {
			sum, count := 0.0, 0
			for _, response := range responses {
				qType := deduceQuestionTypeFromID(response.QuestionID)
				if q, qErr := s.questionRepo.GetByID(ctx, response.QuestionID); qErr == nil && q != nil {
					qType = q.Type
				}
				for _, stageType := range stageTypes {
					if qType == stageType {
						sum += math.Max(0, math.Min(1, response.RawScore))
						count++
						break
					}
				}
			}
			stageResponseCount = count
			if count > 0 {
				stageAccuracy = sum / float64(count)
			}
		}
	}
	if session.DeadlineAt != nil && time.Now().After(session.DeadlineAt.Add(10*time.Second)) {
		s.recordEvent(ctx, session, "STAGE_TIMEOUT", "", map[string]interface{}{
			"deadlineAt": session.DeadlineAt,
			"responded":  stageResponseCount,
		})
	} else if stageResponseCount == 0 {
		s.recordEvent(ctx, session, "STAGE_SKIPPED", "", map[string]interface{}{
			"reason": "no recorded answers for stage",
		})
	}

	// Adjust difficulty based on IRT
	nextDiff := ComputeNextDifficulty(session.DifficultyLevel, stageAccuracy)
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
		nextQuestions, _ = s.stageQuestions(ctx, session.StageName, session.DifficultyLevel, session.Mode)
		_ = s.assignSessionQuestions(ctx, session, nextQuestions)
	}

	return session, sanitizeQuestionsForStudent(nextQuestions), nil
}

func (s *CATService) recordEvent(ctx context.Context, session *models.TestSession, eventType, questionID string, payload map[string]interface{}) {
	raw, _ := json.Marshal(payload)
	_ = s.sessionRepo.RecordEvent(ctx, &models.SessionEvent{
		ID:         uuid.New().String(),
		SessionID:  session.ID,
		EventType:  eventType,
		StageName:  session.StageName,
		QuestionID: questionID,
		Payload:    raw,
		CreatedAt:  time.Now().UTC(),
	})
}

// RecordQuestionResponse records and grades an individual question answer on the server
func (s *CATService) RecordQuestionResponse(ctx context.Context, sessionID, userID string, req models.SubmitResponseRequest) (bool, float64, error) {
	var isCorrect bool
	var score float64
	err := s.sessionRepo.WithSessionLock(ctx, sessionID, func() error {
		var innerErr error
		isCorrect, score, innerErr = s.recordQuestionResponseLocked(ctx, sessionID, userID, req)
		return innerErr
	})
	return isCorrect, score, err
}

func (s *CATService) recordQuestionResponseLocked(ctx context.Context, sessionID, userID string, req models.SubmitResponseRequest) (bool, float64, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return false, 0, errors.New("session not found")
	}
	if session.UserID != userID {
		return false, 0, errors.New("access denied: session does not belong to user")
	}
	if session.Status == "COMPLETED" || session.StageName == "COMPLETED" {
		return false, 0, errors.New("session is already completed and cannot be modified")
	}
	// The server owns time. A short grace period absorbs network latency, but
	// a background tab or a changed client clock cannot extend the stage.
	if session.DeadlineAt != nil && time.Now().After(session.DeadlineAt.Add(10*time.Second)) {
		s.recordEvent(ctx, session, "ANSWER_REJECTED_DEADLINE", req.QuestionID, map[string]interface{}{
			"deadlineAt": session.DeadlineAt,
		})
		return false, 0, errors.New("stage deadline exceeded: answer was not accepted")
	}

	assignment, err := s.sessionRepo.GetAssignedQuestion(ctx, sessionID, req.QuestionID)
	if err != nil {
		return false, 0, errors.New("question was not issued for this attempt")
	}
	if assignment.StageName != session.StageName {
		return false, 0, errors.New("question belongs to another stage")
	}
	if time.Now().After(assignment.DeadlineAt.Add(10 * time.Second)) {
		s.recordEvent(ctx, session, "ANSWER_REJECTED_DEADLINE", req.QuestionID, map[string]interface{}{
			"itemDeadlineAt": assignment.DeadlineAt,
		})
		return false, 0, errors.New("item deadline exceeded: answer was not accepted")
	}

	// First write wins. The client may retry a response after a lost network
	// acknowledgement, but it must never be able to replace the graded answer.
	if existingResponses, existingErr := s.sessionRepo.GetSessionResponses(ctx, sessionID); existingErr == nil {
		for _, existing := range existingResponses {
			if existing.QuestionID == req.QuestionID {
				return false, 0, ErrQuestionAlreadyAnswered
			}
		}
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
		return false, 0, s.sessionRepo.RecordResponse(ctx, resp)
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
				Answer         string `json:"answer"`
				FullWord       string `json:"fullWord"`
				MissingLetters string `json:"missingLetters"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil {
				expected := ca.MissingLetters
				if expected == "" {
					expected = ca.Answer
				}
				if expected == "" {
					expected = ca.FullWord
				}
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
				userText = strings.TrimSpace(userText)
				calculatedScore = 0
				if expected != "" && strings.EqualFold(userText, strings.TrimSpace(expected)) {
					calculatedScore = 1.0
				} else if ca.FullWord != "" && strings.EqualFold(userText, strings.TrimSpace(ca.FullWord)) {
					calculatedScore = 1.0
				}
				isCorrect = calculatedScore >= 0.99
			}
		case "LISTEN_TYPE":
			var ca struct {
				Text             string `json:"text"`
				ExpectedSentence string `json:"expectedSentence"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil {
				expected := ca.ExpectedSentence
				if expected == "" {
					expected = ca.Text
				}
				var userText string
				if err := json.Unmarshal(req.UserResponse, &userText); err != nil {
					userText = strings.Trim(trimmedResponse, `"'`)
				}
				sim := StringSimilarity(userText, expected)
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
		case "INTERACTIVE_READING":
			var ca struct {
				GapCorrect                string `json:"gapCorrect"`
				SentenceCorrectIndex      *int   `json:"sentenceCorrectIndex"`
				MainIdeaCorrectIndex      *int   `json:"mainIdeaCorrectIndex"`
				TitleCorrectIndex         *int   `json:"titleCorrectIndex"`
				HighlightCorrectSubstring string `json:"highlightCorrectSubstring"`
				HighlightCorrect          string `json:"highlightCorrect"`
			}
			var ur struct {
				Gap               string `json:"gap"`
				SentenceIndex     *int   `json:"sentenceIndex"`
				HighlightSentence string `json:"highlightSentence"`
				MainIdeaIndex     *int   `json:"mainIdeaIndex"`
				TitleIndex        *int   `json:"titleIndex"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil {
				if err := json.Unmarshal(req.UserResponse, &ur); err == nil {
					const subtaskCount = 5
					correct := 0
					if strings.EqualFold(strings.TrimSpace(ur.Gap), strings.TrimSpace(ca.GapCorrect)) && ur.Gap != "" {
						correct++
					}
					if ur.SentenceIndex != nil && ca.SentenceCorrectIndex != nil && *ur.SentenceIndex == *ca.SentenceCorrectIndex {
						correct++
					}
					if ur.MainIdeaIndex != nil && ca.MainIdeaCorrectIndex != nil && *ur.MainIdeaIndex == *ca.MainIdeaCorrectIndex {
						correct++
					}
					if ur.TitleIndex != nil && ca.TitleCorrectIndex != nil && *ur.TitleIndex == *ca.TitleCorrectIndex {
						correct++
					}
					normalizeSentence := func(value string) string {
						value = strings.ToLower(strings.TrimSpace(value))
						value = strings.Trim(value, `".!?`)
						return strings.Join(strings.Fields(value), " ")
					}
					highlightExpected := ca.HighlightCorrectSubstring
					if highlightExpected == "" {
						highlightExpected = ca.HighlightCorrect
					}
					highlightCorrect := normalizeSentence(highlightExpected)
					highlightUser := normalizeSentence(ur.HighlightSentence)
					if highlightUser != "" && highlightCorrect != "" &&
						(strings.Contains(highlightCorrect, highlightUser) || strings.Contains(highlightUser, highlightCorrect)) {
						correct++
					}
					calculatedScore = float64(correct) / float64(subtaskCount)
					isCorrect = calculatedScore >= 0.75
				}
			}
		case "INTERACTIVE_LISTENING":
			var ca struct {
				TurnsAnswers []int `json:"turnsAnswers"`
			}
			var ur struct {
				Turns []int `json:"turns"`
			}
			if err := json.Unmarshal(q.CorrectAnswers, &ca); err == nil && len(ca.TurnsAnswers) > 0 {
				if err := json.Unmarshal(req.UserResponse, &ur); err == nil {
					matched := 0
					for i, expected := range ca.TurnsAnswers {
						if i < len(ur.Turns) && ur.Turns[i] == expected {
							matched++
						}
					}
					calculatedScore = float64(matched) / float64(len(ca.TurnsAnswers))
					isCorrect = calculatedScore >= 0.75
				}
			}
		case "WRITE_PHOTO", "INTERACTIVE_WRITING", "WRITING_SAMPLE":
			userText, _, _, _ := extractUserText(req.UserResponse)
			if s.evaluationQueue != nil {
				eval := models.EvaluationResult{
					ID: uuid.New().String(), SessionID: sessionID, QuestionID: req.QuestionID,
					QuestionType: q.Type, Status: "PENDING", FeedbackStatus: "queued",
					Provider: "pending", EvaluatorVersion: "2026.1", CreatedAt: time.Now().UTC(),
				}
				if err := s.sessionRepo.SaveEvaluation(ctx, &eval); err == nil {
					_ = s.evaluationQueue.EnqueueWritingEvaluation(ctx, sessionID, req.QuestionID, eval.ID, userText)
				}
				calculatedScore = 0
				isCorrect = false
			} else {
				keywords := extractContextKeywords(q.ContentPayload)
				eval := s.evaluator.EvaluateWriting(sessionID, req.QuestionID, q.Type, userText, keywords)
				_ = s.sessionRepo.SaveEvaluation(ctx, &eval)
				calculatedScore = eval.Score
				isCorrect = eval.Score >= 0.6
			}
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
		if !isCorrect {
			s.recordMistake(ctx, session.UserID, q, req)
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

	return isCorrect, calculatedScore, s.sessionRepo.RecordResponse(ctx, resp)
}

func questionPromptText(questionType string, payload json.RawMessage, fallback string) string {
	var content map[string]interface{}
	if err := json.Unmarshal(payload, &content); err != nil {
		return fallback
	}
	toString := func(key string) string {
		if value, ok := content[key].(string); ok {
			return value
		}
		return ""
	}
	switch questionType {
	case "READ_SELECT":
		return `Read and Select: "` + toString("word") + `"`
	case "FILL_BLANKS":
		return strings.TrimSpace(toString("sentenceBefore") + " " + toString("givenPrefix") + "[...] " + toString("sentenceAfter"))
	case "C_TEST":
		if title := toString("title"); title != "" {
			return "C-Test: " + title
		}
		return strings.TrimSpace(toString("firstSentence") + " " + toString("lastSentence"))
	case "LISTEN_TYPE":
		return `Dictation: "` + toString("audioSentence") + `"`
	case "INTERACTIVE_READING":
		return "Interactive Reading: " + toString("passageTitle")
	case "INTERACTIVE_LISTENING":
		return "Interactive Listening: " + toString("scenario")
	default:
		return fallback
	}
}

func correctAnswerText(questionType string, correct json.RawMessage) string {
	var payload map[string]interface{}
	if err := json.Unmarshal(correct, &payload); err != nil {
		return ""
	}
	stringValue := func(key string) string {
		if value, ok := payload[key].(string); ok {
			return value
		}
		return ""
	}
	switch questionType {
	case "READ_SELECT":
		if value, ok := payload["isReal"].(bool); ok {
			if value {
				return "Yes"
			}
			return "No"
		}
	case "FILL_BLANKS":
		if value := stringValue("missingLetters"); value != "" {
			return value
		}
		if value := stringValue("fullWord"); value != "" {
			return value
		}
		return stringValue("answer")
	case "LISTEN_TYPE":
		if value := stringValue("expectedSentence"); value != "" {
			return value
		}
		return stringValue("text")
	case "C_TEST":
		if values, ok := payload["answers"].([]interface{}); ok {
			parts := make([]string, 0, len(values))
			for _, value := range values {
				if text, ok := value.(string); ok {
					parts = append(parts, text)
				}
			}
			return strings.Join(parts, " / ")
		}
	case "INTERACTIVE_READING":
		return stringValue("gapCorrect")
	case "INTERACTIVE_LISTENING":
		if values, ok := payload["turnsAnswers"].([]interface{}); ok {
			parts := make([]string, 0, len(values))
			for _, value := range values {
				parts = append(parts, fmt.Sprintf("%v", value))
			}
			return strings.Join(parts, ", ")
		}
	}
	return ""
}

func (s *CATService) recordMistake(ctx context.Context, userID string, question *models.Question, req models.SubmitResponseRequest) {
	if s.studyRepo == nil || userID == "" {
		return
	}
	prompt := questionPromptText(question.Type, question.ContentPayload, req.QuestionID)
	correct := correctAnswerText(question.Type, question.CorrectAnswers)
	if prompt == "" || correct == "" {
		return
	}
	userAnswer := strings.TrimSpace(string(req.UserResponse))
	if len(userAnswer) > 1000 {
		userAnswer = userAnswer[:1000]
	}
	existing, _ := s.studyRepo.GetErrors(ctx, userID)
	for index := range existing {
		item := &existing[index]
		if item.Prompt == prompt && item.CorrectAnswer == correct && !item.Mastered {
			item.UserAnswer = userAnswer
			item.AttemptsCount++
			item.ConsecutiveSuccesses = 0
			_ = s.studyRepo.SaveError(ctx, item)
			return
		}
	}
	now := time.Now().UTC()
	_ = s.studyRepo.SaveError(ctx, &models.UserErrorItem{
		ID:                   "err-" + uuid.New().String()[:8],
		UserID:               userID,
		QuestionType:         question.Type,
		Prompt:               prompt,
		UserAnswer:           userAnswer,
		CorrectAnswer:        correct,
		Explanation:          "Ответ на задание экзаменационного тренажёра. Повторите его в тетради ошибок.",
		ConsecutiveSuccesses: 0,
		AttemptsCount:        1,
		Mastered:             false,
		CreatedAt:            now,
	})
}

func (s *CATService) VerifySessionOwner(ctx context.Context, sessionID, userID string) error {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return errors.New("session not found")
	}
	if session.UserID != userID {
		return errors.New("access denied: session does not belong to user")
	}
	return nil
}

func (s *CATService) GetMediaAssetForUser(ctx context.Context, assetID, userID string) (*models.MediaAsset, error) {
	if assetID == "" || userID == "" {
		return nil, errors.New("asset not found")
	}
	asset, err := s.sessionRepo.GetMediaAssetByID(ctx, assetID)
	if err != nil || asset == nil {
		return nil, errors.New("asset not found")
	}
	if asset.UserID != userID {
		return nil, errors.New("access denied: asset does not belong to user")
	}
	return asset, nil
}

func (s *CATService) GetSessionReview(ctx context.Context, sessionID, userID string) (*models.SessionReviewResponse, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}
	if session.UserID != userID {
		return nil, errors.New("access denied: session does not belong to user")
	}
	if session.Status != "COMPLETED" && session.StageName != "COMPLETED" {
		return nil, errors.New("review is available only after the attempt is completed")
	}

	assignments, _ := s.sessionRepo.GetAllAssignedQuestions(ctx, sessionID)
	responses, _ := s.sessionRepo.GetSessionResponses(ctx, sessionID)
	responseByQuestion := map[string]models.QuestionResponse{}
	for _, response := range responses {
		responseByQuestion[response.QuestionID] = response
	}

	items := []models.ReviewItem{}
	for _, assignment := range assignments {
		question, qErr := s.questionRepo.GetByID(ctx, assignment.QuestionID)
		if qErr != nil || question == nil {
			continue
		}
		response, answered := responseByQuestion[assignment.QuestionID]
		userAnswer := ""
		isCorrect := false
		rawScore := 0.0
		if answered {
			userAnswer = strings.TrimSpace(string(response.UserResponse))
			if len(userAnswer) > 500 {
				userAnswer = userAnswer[:500]
			}
			if response.IsCorrect != nil {
				isCorrect = *response.IsCorrect
			}
			rawScore = response.RawScore
		}
		items = append(items, models.ReviewItem{
			QuestionID:    assignment.QuestionID,
			QuestionType:  question.Type,
			StageName:     assignment.StageName,
			Prompt:        questionPromptText(question.Type, question.ContentPayload, assignment.QuestionID),
			UserAnswer:    userAnswer,
			CorrectAnswer: correctAnswerText(question.Type, question.CorrectAnswers),
			IsCorrect:     isCorrect,
			RawScore:      rawScore,
		})
	}
	return &models.SessionReviewResponse{SessionID: sessionID, Items: items}, nil
}

// RecordAudioResponse records uploaded audio speech, evaluates it, and stores the response.
func (s *CATService) RecordAudioResponse(
	ctx context.Context, sessionID, userID, questionID, audioURL, transcript string, durationSec float64, fileSize int64, asset *models.MediaAsset,
) (*models.EvaluationResult, error) {
	var evaluation *models.EvaluationResult
	err := s.sessionRepo.WithSessionLock(ctx, sessionID, func() error {
		var innerErr error
		evaluation, innerErr = s.recordAudioResponseLocked(ctx, sessionID, userID, questionID, audioURL, transcript, durationSec, fileSize, asset)
		return innerErr
	})
	return evaluation, err
}

func (s *CATService) recordAudioResponseLocked(
	ctx context.Context, sessionID, userID, questionID, audioURL, transcript string, durationSec float64, fileSize int64, asset *models.MediaAsset,
) (*models.EvaluationResult, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}
	if session.UserID != userID {
		return nil, errors.New("access denied: session does not belong to user")
	}
	if session.Status == "COMPLETED" || session.StageName == "COMPLETED" {
		return nil, errors.New("session is already completed and cannot be modified")
	}
	if questionID == "" {
		return nil, errors.New("questionId is required for an audio response")
	}
	if session.DeadlineAt != nil && time.Now().After(session.DeadlineAt.Add(10*time.Second)) {
		return nil, errors.New("stage deadline exceeded: audio was not accepted")
	}
	assignment, err := s.sessionRepo.GetAssignedQuestion(ctx, sessionID, questionID)
	if err != nil {
		return nil, errors.New("question was not issued for this attempt")
	}
	if assignment.StageName != session.StageName {
		return nil, errors.New("question belongs to another stage")
	}
	if time.Now().After(assignment.DeadlineAt.Add(10 * time.Second)) {
		return nil, errors.New("item deadline exceeded: audio was not accepted")
	}
	question, err := s.questionRepo.GetByID(ctx, questionID)
	if err != nil || question == nil {
		return nil, errors.New("question not found")
	}
	if !isSpeakingQuestionType(question.Type) {
		return nil, errors.New("audio responses are only accepted for speaking questions")
	}
	if existingResponses, existingErr := s.sessionRepo.GetSessionResponses(ctx, sessionID); existingErr == nil {
		for _, existing := range existingResponses {
			if existing.QuestionID == questionID {
				return nil, ErrQuestionAlreadyAnswered
			}
		}
	}

	if err := s.sessionRepo.SaveMediaAsset(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to save media asset: %w", err)
	}

	qType := question.Type
	keywords := extractContextKeywords(question.ContentPayload)

	var eval models.EvaluationResult
	if s.evaluationQueue != nil {
		eval = models.EvaluationResult{
			ID:               uuid.New().String(),
			SessionID:        sessionID,
			QuestionID:       questionID,
			QuestionType:     qType,
			Status:           "PENDING",
			Score:            0,
			SpeakingDuration: durationSec,
			AudioURL:         audioURL,
			TranscriptSource: "none",
			Provider:         "pending",
			EvaluatorVersion: "2026.1",
			FeedbackStatus:   "queued",
			CreatedAt:        time.Now().UTC(),
		}
		if err := s.sessionRepo.SaveEvaluation(ctx, &eval); err != nil {
			return nil, fmt.Errorf("failed to save evaluation: %w", err)
		}
		if err := s.evaluationQueue.EnqueueAudioEvaluation(ctx, sessionID, questionID, eval.ID, asset.FilePath, asset.FileType, transcript); err != nil {
			return nil, fmt.Errorf("failed to enqueue evaluation: %w", err)
		}
	} else {
		eval = s.evaluator.EvaluateSpeaking(sessionID, questionID, qType, transcript, durationSec, keywords)
		eval.AudioURL = audioURL
		eval.TranscriptSource = "client"
		_ = s.sessionRepo.SaveEvaluation(ctx, &eval)
	}

	userResponseJSON, _ := json.Marshal(map[string]interface{}{
		"audioUrl":         audioURL,
		"durationSec":      durationSec,
		"fileSize":         fileSize,
		"transcriptSource": eval.TranscriptSource,
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
// DeleteSessionAudioAssets removes the audio rows of an attempt and returns
// the file paths so the caller can delete the files themselves.
func (s *CATService) DeleteSessionAudioAssets(ctx context.Context, sessionID, userID string) ([]string, error) {
	if err := s.VerifySessionOwner(ctx, sessionID, userID); err != nil {
		return nil, err
	}
	return s.sessionRepo.DeleteMediaAssetsBySession(ctx, sessionID)
}

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
// QuestionTypesForStage returns the server question types belonging to a stage.
func QuestionTypesForStage(stage string) []string {
	switch stage {
	case "READ_SELECT":
		return []string{"READ_SELECT"}
	case "FILL_BLANKS":
		return []string{"FILL_BLANKS"}
	case "C_TEST":
		return []string{"C_TEST"}
	case "LISTEN_TYPE":
		return []string{"LISTEN_TYPE"}
	case "INTERACTIVE_READING":
		return []string{"INTERACTIVE_READING"}
	case "INTERACTIVE_LISTENING":
		return []string{"INTERACTIVE_LISTENING"}
	case "WRITE_PHOTO":
		return []string{"WRITE_PHOTO"}
	case "INTERACTIVE_WRITING":
		return []string{"INTERACTIVE_WRITING"}
	case "SPEAK_PHOTO":
		return []string{"SPEAK_PHOTO"}
	case "READ_THEN_SPEAK":
		return []string{"READ_THEN_SPEAK"}
	case "INTERACTIVE_SPEAKING":
		return []string{"INTERACTIVE_SPEAKING"}
	case "WRITING_SAMPLE":
		return []string{"WRITING_SAMPLE"}
	case "SPEAKING_SAMPLE":
		return []string{"SPEAKING_SAMPLE"}
	default:
		return nil
	}
}

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

	notMeasured := []string{}
	for _, skill := range []struct {
		name  string
		value int
	}{
		{"reading", scores.Reading},
		{"listening", scores.Listening},
		{"writing", scores.Writing},
		{"speaking", scores.Speaking},
	} {
		if skill.value <= 0 {
			notMeasured = append(notMeasured, skill.name)
		}
	}
	scores.Completeness = float64(4-len(notMeasured)) / 4.0
	if scores.Overall > 0 && len(notMeasured) == 0 {
		scores.Confidence = "low"
		scores.RangeLow = int(math.Max(10, float64(scores.Overall-10)))
		scores.RangeHigh = int(math.Min(160, float64(scores.Overall+10)))
	} else {
		scores.Confidence = "low"
		notMeasured = append(notMeasured, "overall")
	}
	scores.NotMeasured = notMeasured

	assignments, _ := s.sessionRepo.GetAllAssignedQuestions(ctx, session.ID)
	responses, _ := s.sessionRepo.GetSessionResponses(ctx, session.ID)
	answeredQuestionIDs := map[string]bool{}
	for _, response := range responses {
		answeredQuestionIDs[response.QuestionID] = true
	}
	answerCoverage := 1.0
	if len(assignments) > 0 {
		answerCoverage = float64(len(answeredQuestionIDs)) / float64(len(assignments))
		if answerCoverage > 1 {
			answerCoverage = 1
		}
	}
	timeoutEvents := 0
	if events, eventErr := s.sessionRepo.GetSessionEvents(ctx, session.ID); eventErr == nil {
		for _, event := range events {
			switch event.EventType {
			case "ANSWER_REJECTED_DEADLINE", "STAGE_TIMEOUT", "STAGE_SKIPPED":
				timeoutEvents++
			}
		}
	}
	scores.AnsweredQuestions = len(responses)
	scores.AnswerCoverage = answerCoverage
	scores.TimeoutEvents = timeoutEvents

	cert, _ := s.certRepo.GetBySessionID(ctx, session.ID)
	eligible := cert != nil
	if !eligible {
		eligible = s.theoryService.IsTheoryCompleted(ctx, session.UserID) && scores.Overall >= 105 && answerCoverage >= 0.3 && timeoutEvents == 0
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
	var result *models.SessionCompleteResponse
	var operationErr error
	lockErr := s.sessionRepo.WithSessionLock(ctx, sessionID, func() error {
		result, operationErr = s.completeSessionLocked(ctx, sessionID, userID, req)
		return operationErr
	})
	if lockErr != nil {
		return nil, lockErr
	}
	return result, operationErr
}

func (s *CATService) completeSessionLocked(ctx context.Context, sessionID, userID string, req models.CompleteSessionRequest) (*models.SessionCompleteResponse, error) {
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
	if session.StageName != "COMPLETED" {
		return nil, errors.New("cannot complete session before all stages are finished")
	}
	if s.evaluationQueue != nil {
		pending, pendingErr := s.evaluationQueue.PendingForSession(ctx, sessionID)
		if pendingErr == nil && pending > 0 {
			return nil, ErrEvaluationPending
		}
	}

	// Verify that the session has actual recorded question responses
	responses, err := s.sessionRepo.GetSessionResponses(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve session responses: %w", err)
	}
	if len(responses) == 0 {
		return nil, errors.New("cannot complete session: no question responses recorded")
	}

	assignments, _ := s.sessionRepo.GetAllAssignedQuestions(ctx, sessionID)
	answeredQuestionIDs := map[string]bool{}
	for _, response := range responses {
		answeredQuestionIDs[response.QuestionID] = true
	}
	answerCoverage := 1.0
	if len(assignments) > 0 {
		answerCoverage = float64(len(answeredQuestionIDs)) / float64(len(assignments))
		if answerCoverage > 1 {
			answerCoverage = 1
		}
	}
	timeoutEvents := 0
	if events, eventErr := s.sessionRepo.GetSessionEvents(ctx, sessionID); eventErr == nil {
		for _, event := range events {
			switch event.EventType {
			case "ANSWER_REJECTED_DEADLINE", "STAGE_TIMEOUT", "STAGE_SKIPPED":
				timeoutEvents++
			}
		}
	}

	// Aggregate server-verified question responses by skill. There is no
	// fallback to a client ratio or to another skill's average: a skipped
	// skill stays not measured.
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
		st := stats[skill]
		if st == nil {
			st = &skillStats{}
			stats[skill] = st
		}
		st.sum += math.Max(0, math.Min(1, r.RawScore))
		st.count++
	}

	ratioToTheta := func(ratio float64) float64 {
		clampedRatio := math.Max(0.02, math.Min(0.98, ratio))
		return math.Log(clampedRatio/(1.0-clampedRatio)) / 1.2
	}

	ratio := func(skill string) (float64, bool) {
		st := stats[skill]
		if st == nil || st.count == 0 {
			return 0, false
		}
		return st.sum / float64(st.count), true
	}
	scoreFor := func(skill string) int {
		value, measured := ratio(skill)
		if !measured {
			return 0
		}
		return ThetaToDetScore(ratioToTheta(value))
	}

	readingScore := scoreFor("reading")
	listeningScore := scoreFor("listening")
	writingScore := scoreFor("writing")
	speakingScore := scoreFor("speaking")

	_, readingMeasured := ratio("reading")
	_, listeningMeasured := ratio("listening")
	_, writingMeasured := ratio("writing")
	_, speakingMeasured := ratio("speaking")

	notMeasured := []string{}
	for _, skill := range []string{"reading", "listening", "writing", "speaking"} {
		if _, measured := ratio(skill); !measured {
			notMeasured = append(notMeasured, skill)
		}
	}
	completeness := float64(4-len(notMeasured)) / 4.0

	literacy := 0
	if readingMeasured && writingMeasured {
		literacy = RoundToDetScale(float64(readingScore+writingScore) / 2.0)
	}
	comprehension := 0
	if readingMeasured && listeningMeasured {
		comprehension = RoundToDetScale(float64(readingScore+listeningScore) / 2.0)
	}
	production := 0
	if writingMeasured && speakingMeasured {
		production = RoundToDetScale(float64(writingScore+speakingScore) / 2.0)
	}
	conversation := 0
	if listeningMeasured && speakingMeasured {
		conversation = RoundToDetScale(float64(listeningScore+speakingScore) / 2.0)
	}

	overall := 0
	meetsMinimumItems := len(answeredQuestionIDs) >= 8
	if len(notMeasured) == 0 && meetsMinimumItems {
		overall = RoundToDetScale(float64(readingScore+listeningScore+writingScore+speakingScore) / 4.0)
	} else {
		notMeasured = append(notMeasured, "overall")
	}

	confidence := "low"
	if len(notMeasured) == 0 {
		if len(responses) >= 20 {
			confidence = "high"
		} else if len(responses) >= 8 {
			confidence = "medium"
		}
	}
	rangeDelta := 20
	if confidence == "high" {
		rangeDelta = 5
	} else if confidence == "medium" {
		rangeDelta = 10
	}
	rangeLow, rangeHigh := 0, 0
	if overall > 0 {
		rangeLow = int(math.Max(10, float64(overall-rangeDelta)))
		rangeHigh = int(math.Min(160, float64(overall+rangeDelta)))
	}

	scores := models.CalculatedScores{
		Overall:           overall,
		Reading:           readingScore,
		Listening:         listeningScore,
		Writing:           writingScore,
		Speaking:          speakingScore,
		Literacy:          literacy,
		Comprehension:     comprehension,
		Production:        production,
		Conversation:      conversation,
		Completeness:      completeness,
		Confidence:        confidence,
		RangeLow:          rangeLow,
		RangeHigh:         rangeHigh,
		NotMeasured:       notMeasured,
		AnsweredQuestions: len(responses),
		TimeoutEvents:     timeoutEvents,
		AnswerCoverage:    answerCoverage,
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
	eligible := session.Mode == "full" && isTheoryComplete && scores.Overall >= 105 && answerCoverage >= 0.3 && timeoutEvents == 0

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

		if err := s.certRepo.Create(ctx, cert); err != nil {
			// A concurrent finalization may have created the same certificate.
			if existing, getErr := s.certRepo.GetBySessionID(ctx, session.ID); getErr == nil {
				cert = existing
			}
		}
	}

	if s.studyRepo != nil {
		today := now.UTC().Format("2006-01-02")
		_ = s.studyRepo.RecordActivity(ctx, session.UserID, today, "mock_test")
		_ = s.studyRepo.CompletePlanTask(ctx, session.UserID, "task-mock", today, "mock_test")
		// Award XP for completing an official CAT mock simulation (100 XP)
		_, _ = s.studyRepo.AwardXP(ctx, &models.XPEvent{
			ID:             uuid.NewString(),
			UserID:         session.UserID,
			EventType:      "mock_test",
			IdempotencyKey: "mock:" + session.ID,
			XP:             100,
			CreatedAt:      now,
		})
	}

	return &models.SessionCompleteResponse{
		Session:             *session,
		Scores:              scores,
		CertificateEligible: eligible,
		Certificate:         cert,
	}, nil
}
