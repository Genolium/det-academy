package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"net/http"

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

	session, questions, err := h.catService.StartSession(r.Context(), userID, req.CandidateName, req.DifficultyLevel)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"session":   session,
		"questions": questions,
	})
}

func (h *TestHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	session, err := h.catService.GetSession(r.Context(), sessionID)
	if err != nil {
		RespondError(w, http.StatusNotFound, "session not found")
		return
	}

	RespondJSON(w, http.StatusOK, session)
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

	var req models.SubmitResponseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.catService.RecordQuestionResponse(r.Context(), sessionID, req); err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to record response")
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"status": "recorded"})
}

func (h *TestHandler) CompleteStage(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		RespondError(w, http.StatusBadRequest, "session id is required")
		return
	}

	var req models.StageCompleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	session, nextQuestions, err := h.catService.SubmitStageResult(r.Context(), sessionID, req)
	if err != nil {
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

	var req models.CompleteSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.catService.CompleteSession(r.Context(), sessionID, req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, result)
}
