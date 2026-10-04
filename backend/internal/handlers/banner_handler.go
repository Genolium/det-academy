package handlers

import (
	"det-academy-backend/internal/service"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type BannerHandler struct {
	bannerService *service.BannerService
}

func NewBannerHandler(bannerService *service.BannerService) *BannerHandler {
	return &BannerHandler{bannerService: bannerService}
}

func (h *BannerHandler) GetBanners(w http.ResponseWriter, r *http.Request) {
	placement := r.URL.Query().Get("placement")
	if placement == "" {
		placement = "HEADER"
	}

	banners, err := h.bannerService.GetActiveBanners(r.Context(), placement)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to get banners")
		return
	}

	RespondJSON(w, http.StatusOK, banners)
}

func (h *BannerHandler) RecordClick(w http.ResponseWriter, r *http.Request) {
	bannerID := chi.URLParam(r, "id")
	if bannerID == "" {
		RespondError(w, http.StatusBadRequest, "banner id is required")
		return
	}

	if err := h.bannerService.RecordClick(r.Context(), bannerID); err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to record click")
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"status": "recorded"})
}
