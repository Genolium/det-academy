package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"net/http"
)

type TheoryHandler struct {
	theoryService *service.TheoryService
}

func NewTheoryHandler(theoryService *service.TheoryService) *TheoryHandler {
	return &TheoryHandler{theoryService: theoryService}
}

func (h *TheoryHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		// Return guest empty progress
		RespondJSON(w, http.StatusOK, models.TheoryProgressResponse{
			CompletedLessons: []string{},
			TotalLessons:     service.TotalTheoryLessons,
			ProgressPercent:  0,
			IsAllCompleted:   false,
		})
		return
	}

	progress, err := h.theoryService.GetProgress(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to get theory progress")
		return
	}

	RespondJSON(w, http.StatusOK, progress)
}

func (h *TheoryHandler) ToggleCompletion(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "must be logged in to save theory progress")
		return
	}

	var req models.ToggleTheoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.LessonSlug == "" {
		RespondError(w, http.StatusBadRequest, "valid lessonSlug is required")
		return
	}

	progress, err := h.theoryService.ToggleCompletion(r.Context(), userID, req.LessonSlug)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to toggle lesson completion")
		return
	}

	RespondJSON(w, http.StatusOK, progress)
}

func (h *TheoryHandler) GetLessons(w http.ResponseWriter, r *http.Request) {
	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"total":   service.TotalTheoryLessons,
		"lessons": service.LessonSlugs,
	})
}
