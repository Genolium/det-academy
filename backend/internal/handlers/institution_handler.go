package handlers

import (
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/service"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type InstitutionHandler struct {
	service *service.InstitutionService
}

func NewInstitutionHandler(service *service.InstitutionService) *InstitutionHandler {
	return &InstitutionHandler{service: service}
}

func (h *InstitutionHandler) List(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	country := r.URL.Query().Get("country")
	category := r.URL.Query().Get("category")
	minScoreStr := r.URL.Query().Get("min_score")

	minScore := 0
	if minScoreStr != "" {
		if val, err := strconv.Atoi(minScoreStr); err == nil {
			minScore = val
		}
	}

	institutions, err := h.service.List(r.Context(), search, country, minScore, category)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"institutions": institutions,
		"total":        len(institutions),
	})
}

func (h *InstitutionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		RespondError(w, http.StatusBadRequest, "institution id is required")
		return
	}

	inst, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		RespondError(w, http.StatusNotFound, "institution not found")
		return
	}

	RespondJSON(w, http.StatusOK, inst)
}

func (h *InstitutionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateInstitutionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	inst, err := h.service.Create(r.Context(), req)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, inst)
}

func (h *InstitutionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		RespondError(w, http.StatusBadRequest, "institution id is required")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
