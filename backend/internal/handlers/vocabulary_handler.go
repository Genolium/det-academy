package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
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

func (h *VocabularyHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	entries, err := h.service.ListAll(r.Context())
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load vocabulary")
		return
	}
	RespondJSON(w, http.StatusOK, map[string]interface{}{"entries": entries, "total": len(entries)})
}

func (h *VocabularyHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var payload struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10)).Decode(&payload); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.service.UpdateStatus(r.Context(), id, payload.Status); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, map[string]string{"status": payload.Status})
}
