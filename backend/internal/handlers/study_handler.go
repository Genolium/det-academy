package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type StudyHandler struct {
	studyService *service.StudyService
	limits       *service.LimitGuard
}

func NewStudyHandler(studyService *service.StudyService) *StudyHandler {
	return &StudyHandler{studyService: studyService}
}

// SetLimitGuard enables the IP/device quota for speaking submissions.
func (h *StudyHandler) SetLimitGuard(guard *service.LimitGuard) {
	h.limits = guard
}

// --- Goals & Study Plan ---

func (h *StudyHandler) GetGoals(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	goal, err := h.studyService.GetGoals(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrGoalsNotConfigured) {
			RespondJSON(w, http.StatusOK, map[string]interface{}{
				"configured": false,
				"goal":       nil,
			})
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"configured": true,
		"goal":       goal,
	})
}

func (h *StudyHandler) UpdateGoals(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req models.UpdateGoalsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	goal, err := h.studyService.UpdateGoals(r.Context(), userID, req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, goal)
}

func (h *StudyHandler) GetStudyPlan(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	plan, err := h.studyService.GetStudyPlan(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrGoalsNotConfigured) {
			RespondJSON(w, http.StatusOK, models.StudyPlanResponse{Configured: false})
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, plan)
}

// --- Skill Analytics ---

func (h *StudyHandler) GetSkillAnalytics(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	analytics, err := h.studyService.GetSkillAnalytics(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, analytics)
}

// --- Error Notebook ---

func (h *StudyHandler) GetErrors(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	errorsList, err := h.studyService.GetErrors(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"errors": errorsList,
		"total":  len(errorsList),
	})
}

func (h *StudyHandler) SaveError(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req models.SaveErrorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	item, err := h.studyService.SaveError(r.Context(), userID, req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, item)
}

func (h *StudyHandler) RecallError(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	errorID := chi.URLParam(r, "id")
	if errorID == "" {
		RespondError(w, http.StatusBadRequest, "error id is required")
		return
	}

	var req models.RecallErrorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.studyService.RecallError(r.Context(), userID, errorID, req.Answer)
	if err != nil {
		RespondError(w, http.StatusNotFound, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, resp)
}

func (h *StudyHandler) DeleteError(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	errorID := chi.URLParam(r, "id")
	if errorID == "" {
		RespondError(w, http.StatusBadRequest, "error id is required")
		return
	}

	if err := h.studyService.DeleteError(r.Context(), userID, errorID); err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// --- Spaced Repetition (SRS) ---

func (h *StudyHandler) GetStreak(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("utc_offset_minutes"))
	streak, err := h.studyService.GetStreak(r.Context(), userID, offset)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, streak)
}

func (h *StudyHandler) RecordActivity(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	var req models.RecordActivityRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	streak, err := h.studyService.RecordActivity(r.Context(), userID, req.Source, req.UTCOffsetMinutes)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, streak)
}

func (h *StudyHandler) GetSRSState(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	state, err := h.studyService.GetSRSState(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, state)
}

func (h *StudyHandler) ReviewSRSCard(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req models.ReviewSRSCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.studyService.ReviewSRSCard(r.Context(), userID, req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, res)
}

func (h *StudyHandler) GetWeeklyReport(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	report, err := h.studyService.GetWeeklyReport(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, report)
}

func (h *StudyHandler) CompletePlanTask(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	taskID := chi.URLParam(r, "id")
	if err := h.studyService.CompletePlanTask(r.Context(), userID, taskID); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, map[string]string{"status": "completed"})
}

// GetCoachReport returns the speaking/writing coaching view of an attempt.
func (h *StudyHandler) GetCoachReport(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	sessionID := chi.URLParam(r, "sessionId")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	report, err := h.studyService.BuildCoachReport(r.Context(), sessionID, userID)
	if err != nil {
		RespondError(w, http.StatusForbidden, "attempt is not available")
		return
	}
	RespondJSON(w, http.StatusOK, report)
}

// SaveCoachErrors creates repeatable Error Notebook entries from the coaching
// report of an attempt.
func (h *StudyHandler) SaveCoachErrors(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	sessionID := chi.URLParam(r, "sessionId")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	created, err := h.studyService.SaveCoachErrors(r.Context(), sessionID, userID)
	if err != nil {
		RespondError(w, http.StatusForbidden, "attempt is not available")
		return
	}
	RespondJSON(w, http.StatusOK, map[string]int{"created": created})
}

// GetXPProfile returns the XP total, the weekly league and the ledger history.
func (h *StudyHandler) GetXPProfile(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	profile, err := h.studyService.GetXPProfile(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load xp profile")
		return
	}
	RespondJSON(w, http.StatusOK, profile)
}

// GetPracticeAssignment returns a server-issued practice drill assignment without answer keys.
func (h *StudyHandler) GetPracticeAssignment(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	questionType := r.URL.Query().Get("type")
	if questionType == "" {
		RespondError(w, http.StatusBadRequest, "type query parameter is required")
		return
	}

	asgn, err := h.studyService.CreatePracticeAssignment(r.Context(), userID, questionType)
	if err != nil {
		if errors.Is(err, service.ErrDailyLimitReached) {
			RespondError(w, http.StatusTooManyRequests, "Дневной лимит заданий исчерпан. Возвращайтесь завтра.")
			return
		}
		RespondError(w, http.StatusNotFound, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, asgn)
}

// RecordPracticeAttempt records an exercise attempt from Practice Hub.
func (h *StudyHandler) RecordPracticeAttempt(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req struct {
		AssignmentID  string          `json:"assignmentId"`
		QuestionType  string          `json:"questionType"`
		QuestionID    string          `json:"questionId"`
		PromptContext string          `json:"promptContext"`
		UserResponse  json.RawMessage `json:"userResponse"`
		TimeSpentSec  int             `json:"timeSpentSec"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request payload")
		return
	}
	if req.QuestionID == "" && req.AssignmentID != "" {
		if asgn, err := h.studyService.GetPracticeAssignment(r.Context(), req.AssignmentID); err == nil && asgn != nil {
			req.QuestionID = asgn.QuestionID
			if req.QuestionType == "" {
				req.QuestionType = asgn.QuestionType
			}
		}
	}
	if req.QuestionType == "" {
		RespondError(w, http.StatusBadRequest, "questionType is required")
		return
	}

	// Use the type stored on the server so a client cannot label a speaking
	// answer as a reading task to skip the IP/device speaking quota.
	resolvedType := h.studyService.ResolveQuestionType(r.Context(), req.QuestionType, req.QuestionID)
	if service.IsSpeakingQuestionType(resolvedType) {
		if !CheckDailyLimit(w, r, h.limits, service.LimitScopeSpeaking) {
			return
		}
	}

	attempt, err := h.studyService.RecordPracticeAttempt(
		r.Context(), userID, req.QuestionType, req.QuestionID, req.PromptContext,
		req.UserResponse, req.TimeSpentSec,
	)
	if err != nil {
		if errors.Is(err, service.ErrDailyLimitReached) {
			RespondError(w, http.StatusTooManyRequests, "Дневной лимит разговорных заданий исчерпан. Возвращайтесь завтра.")
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, attempt)
}

// RecordTypingAttempt records a completed typing trainer session.
func (h *StudyHandler) RecordTypingAttempt(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req struct {
		WPM         int     `json:"wpm"`
		Accuracy    float64 `json:"accuracy"`
		Mode        string  `json:"mode"`
		DurationSec int     `json:"durationSec"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	attempt, err := h.studyService.RecordTypingAttempt(
		r.Context(), userID, req.WPM, req.Accuracy, req.Mode, req.DurationSec,
	)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, attempt)
}

// GetTypingHistory returns best WPM and recent typing attempts.
func (h *StudyHandler) GetTypingHistory(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	bestWPM, attempts, err := h.studyService.GetTypingHistory(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"bestWpm":  bestWPM,
		"attempts": attempts,
	})
}

// GetSkillMastery returns aggregated mastery scores across skills.
func (h *StudyHandler) GetSkillMastery(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	mastery, err := h.studyService.GetSkillMastery(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, mastery)
}

// GetDailyLimits reports the remaining daily allowance for expensive actions.
func (h *StudyHandler) GetDailyLimits(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	limits, err := h.studyService.GetDailyLimits(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load daily limits")
		return
	}
	RespondJSON(w, http.StatusOK, limits)
}

// GetPlacement returns the level estimated by the onboarding diagnostic.
func (h *StudyHandler) GetPlacement(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	placement, err := h.studyService.GetPlacement(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load placement")
		return
	}
	RespondJSON(w, http.StatusOK, placement)
}

// GetAIUsage reports provider tokens and cost for the admin dashboard.
func (h *StudyHandler) GetAIUsage(w http.ResponseWriter, r *http.Request) {
	days := 7
	if raw := r.URL.Query().Get("days"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			days = parsed
		}
	}
	summary, err := h.studyService.GetAIUsage(r.Context(), days)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load AI usage")
		return
	}
	RespondJSON(w, http.StatusOK, summary)
}
