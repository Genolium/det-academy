package handlers

import (
	"det-academy-backend/internal/service"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type CertificateHandler struct {
	certService *service.CertificateService
}

func NewCertificateHandler(certService *service.CertificateService) *CertificateHandler {
	return &CertificateHandler{certService: certService}
}

func (h *CertificateHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	certID := chi.URLParam(r, "id")
	if certID == "" {
		RespondError(w, http.StatusBadRequest, "certificate id is required")
		return
	}

	cert, err := h.certService.GetByID(r.Context(), certID)
	if err != nil {
		RespondError(w, http.StatusNotFound, "certificate not found or invalid")
		return
	}

	RespondJSON(w, http.StatusOK, cert)
}

func (h *CertificateHandler) IssueCertificate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TestSessionID string `json:"testSessionId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TestSessionID == "" {
		RespondError(w, http.StatusBadRequest, "testSessionId is required")
		return
	}

	cert, err := h.certService.IssueCertificate(r.Context(), req.TestSessionID)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, cert)
}

func (h *CertificateHandler) GetMyCertificates(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}

	certs, err := h.certService.GetByUserID(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to get certificates")
		return
	}

	RespondJSON(w, http.StatusOK, certs)
}
