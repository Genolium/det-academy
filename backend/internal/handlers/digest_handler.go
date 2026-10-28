package handlers

import (
	"net/http"

	"det-academy-backend/internal/service"
)

// DigestHandler exposes the weekly email digest to admins. A dry run renders
// every eligible message and reports the counts without sending or claiming
// the week, so it can be used to verify the content safely in production.
type DigestHandler struct {
	digestService *service.DigestService
}

func NewDigestHandler(digestService *service.DigestService) *DigestHandler {
	return &DigestHandler{digestService: digestService}
}

func (h *DigestHandler) SendWeekly(w http.ResponseWriter, r *http.Request) {
	dryRun := r.URL.Query().Get("dryRun") == "true"
	sent, skipped, err := h.digestService.SendWeekly(r.Context(), dryRun)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"dryRun":  dryRun,
		"sent":    sent,
		"skipped": skipped,
	})
}
