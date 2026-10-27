package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

type TestHandler struct {
	catService *service.CATService
}

func NewTestHandler(catService *service.CATService) *TestHandler {
	return &TestHandler{catService: catService}
}

func (h *TestHandler) StartSession(w http.ResponseWriter, r *http.Request) {
	var req models.StartSessionRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "Регистрация или вход обязательны для прохождения симулятора теста")
		return
	}

	session, questions, err := h.catService.StartSession(r.Context(), userID, req.CandidateName, req.DifficultyLevel, req.Mode)
	if err != nil {
		if errors.Is(err, service.ErrDailyLimitReached) {
			RespondError(w, http.StatusTooManyRequests, "Дневной лимит полных пробных тестов исчерпан. Возвращайтесь завтра.")
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"session":   session,
		"questions": questions,
	})
}

func (h *TestHandler) GetMySessions(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	sessions, err := h.catService.GetUserSessions(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to get test sessions")
		return
	}

	if sessions == nil {
		sessions = []models.TestSession{}
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"data":     sessions,
		"sessions": sessions,
	})
}

func (h *TestHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	details, err := h.catService.GetSessionWithDetails(r.Context(), sessionID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "access denied") {
			RespondError(w, http.StatusForbidden, err.Error())
			return
		}
		RespondError(w, http.StatusNotFound, "session not found")
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"session":         details.Session,
		"questions":       details.Questions,
		"responses":       details.Responses,
		"blueprint":       details.Blueprint,
		"id":              details.Session.ID,
		"userId":          details.Session.UserID,
		"status":          details.Session.Status,
		"currentStage":    details.Session.CurrentStage,
		"stageName":       details.Session.StageName,
		"difficultyLevel": details.Session.DifficultyLevel,
		"deadlineAt":      details.Session.DeadlineAt,
	})
}

func (h *TestHandler) GetQuestions(w http.ResponseWriter, r *http.Request) {
	stageType := r.URL.Query().Get("type")
	difficulty := r.URL.Query().Get("difficulty")

	if stageType == "" {
		RespondError(w, http.StatusBadRequest, "type query parameter is required")
		return
	}

	questions, err := h.catService.GetQuestionsForStage(r.Context(), stageType, difficulty)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to get questions")
		return
	}

	RespondJSON(w, http.StatusOK, questions)
}

func (h *TestHandler) RecordResponse(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req models.SubmitResponseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	_, _, err := h.catService.RecordQuestionResponse(r.Context(), sessionID, userID, req)
	if err != nil {
		if strings.Contains(err.Error(), "access denied") {
			RespondError(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrQuestionAlreadyAnswered) {
			RespondError(w, http.StatusConflict, err.Error())
			return
		}
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Correctness is deliberately not returned: it is an oracle that would
	// let a client brute-force the answer key before finalization.
	RespondJSON(w, http.StatusOK, map[string]string{"status": "recorded"})
}

func (h *TestHandler) CompleteStage(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req models.StageCompleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	session, nextQuestions, err := h.catService.SubmitStageResult(r.Context(), sessionID, userID, req)
	if err != nil {
		if strings.Contains(err.Error(), "access denied") {
			RespondError(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrStageAlreadyCompleted) {
			RespondError(w, http.StatusConflict, err.Error())
			return
		}
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"session":       session,
		"nextQuestions": nextQuestions,
	})
}

func (h *TestHandler) CompleteSession(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	var req models.CompleteSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.catService.CompleteSession(r.Context(), sessionID, userID, req)
	if err != nil {
		if errors.Is(err, service.ErrEvaluationPending) {
			RespondJSON(w, http.StatusConflict, map[string]interface{}{
				"error": "evaluation_pending",
				"code":  "evaluation_pending",
			})
			return
		}
		if strings.Contains(err.Error(), "access denied") {
			RespondError(w, http.StatusForbidden, err.Error())
			return
		}
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, result)
}

func (h *TestHandler) GetSessionReview(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	review, err := h.catService.GetSessionReview(r.Context(), sessionID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "access denied") {
			RespondError(w, http.StatusForbidden, err.Error())
			return
		}
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, review)
}

// GetSessionEvaluations retrieves all rubric evaluations and feedback for questions in a session.
func (h *TestHandler) GetSessionEvaluations(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	evals, err := h.catService.GetSessionEvaluations(r.Context(), sessionID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "access denied") {
			RespondError(w, http.StatusForbidden, err.Error())
			return
		}
		RespondError(w, http.StatusNotFound, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"evaluations": evals,
	})
}
