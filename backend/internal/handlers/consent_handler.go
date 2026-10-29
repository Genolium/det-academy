package handlers

import (
	"encoding/json"
	"net/http"

	"det-academy-backend/internal/repository"
)

const calibrationConsentVersion = "2026-10-29"

type ConsentHandler struct {
	users repository.UserRepository
}

func NewConsentHandler(users repository.UserRepository) *ConsentHandler {
	return &ConsentHandler{users: users}
}

func (h *ConsentHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	consent, err := h.users.GetCalibrationConsent(r.Context(), userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load consent")
		return
	}
	active := consent.RevokedAt == nil && consent.ConsentVersion == calibrationConsentVersion
	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"consent": active,
		"version": calibrationConsentVersion,
	})
}

func (h *ConsentHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	var payload struct {
		Consent *bool `json:"consent"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Consent == nil {
		RespondError(w, http.StatusBadRequest, "consent is required")
		return
	}
	if err := h.users.SetCalibrationConsent(r.Context(), userID, *payload.Consent, calibrationConsentVersion); err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to save consent")
		return
	}
	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"consent": *payload.Consent,
		"version": calibrationConsentVersion,
	})
}
