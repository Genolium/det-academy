package handlers

import (
	"det-academy-backend/internal/service"
	"errors"
	"net/http"
)

type AnalyticsHandler struct {
	service *service.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: analyticsService}
}

func (h *AnalyticsHandler) Overview(w http.ResponseWriter, r *http.Request) {
	window, err := service.ParseAnalyticsWindow(r.URL.Query().Get("range"), "")
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	overview, err := h.service.Overview(r.Context(), window)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load analytics overview")
		return
	}
	RespondJSON(w, http.StatusOK, overview)
}

func (h *AnalyticsHandler) Timeseries(w http.ResponseWriter, r *http.Request) {
	metric := r.URL.Query().Get("metric")
	if metric == "" {
		RespondError(w, http.StatusBadRequest, "metric is required")
		return
	}
	window, err := service.ParseAnalyticsWindow(r.URL.Query().Get("range"), r.URL.Query().Get("bucket"))
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	series, err := h.service.Timeseries(r.Context(), window, metric)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidAnalyticsRange) {
			status = http.StatusBadRequest
		}
		RespondError(w, status, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, series)
}

func (h *AnalyticsHandler) Features(w http.ResponseWriter, r *http.Request) {
	window, err := service.ParseAnalyticsWindow(r.URL.Query().Get("range"), "")
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	features, err := h.service.Features(r.Context(), window)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load feature usage")
		return
	}
	RespondJSON(w, http.StatusOK, features)
}

func (h *AnalyticsHandler) Retention(w http.ResponseWriter, r *http.Request) {
	window, err := service.ParseAnalyticsWindow(r.URL.Query().Get("range"), "")
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	retention, err := h.service.Retention(r.Context(), window)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load retention cohorts")
		return
	}
	RespondJSON(w, http.StatusOK, retention)
}
