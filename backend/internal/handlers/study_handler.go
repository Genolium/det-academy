package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type StudyHandler struct {
	studyService *service.StudyService
}

func NewStudyHandler(studyService *service.StudyService) *StudyHandler {
	return &StudyHandler{studyService: studyService}
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
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, goal)
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
