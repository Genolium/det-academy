package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"net/http"
)

type VocabularyHandler struct {
	service *service.VocabularyService
}

func NewVocabularyHandler(service *service.VocabularyService) *VocabularyHandler {
	return &VocabularyHandler{service: service}
}

func (h *VocabularyHandler) List(w http.ResponseWriter, r *http.Request) {
	entries, total, err := h.service.List(
		r.Context(),
		r.URL.Query().Get("search"),
		r.URL.Query().Get("level"),
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load vocabulary")
		return
	}
	if entries == nil {
		entries = []models.VocabularyEntry{}
	}
	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"entries": entries,
		"total":   total,
	})
}
