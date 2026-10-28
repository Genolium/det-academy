package handlers

import (
	"encoding/json"
	"net/http"

	"det-academy-backend/internal/repository"
	"det-academy-backend/internal/service"
)

// EmailHandler owns the weekly-digest preference and the public unsubscribe
// link embedded in every digest email.
type EmailHandler struct {
	users repository.UserRepository
}

func NewEmailHandler(users repository.UserRepository) *EmailHandler {
	return &EmailHandler{users: users}
}

func (h *EmailHandler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	enabled, err := service.EmailDigestEnabled(r.Context(), h.users, userID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to load email preferences")
		return
	}
	RespondJSON(w, http.StatusOK, map[string]bool{"digestEnabled": enabled})
}

func (h *EmailHandler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	userID := GetUserIDFromContext(r.Context())
	if userID == "" {
		RespondError(w, http.StatusUnauthorized, "authorization required")
		return
	}
	var payload struct {
		DigestEnabled *bool `json:"digestEnabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.DigestEnabled == nil {
		RespondError(w, http.StatusBadRequest, "digestEnabled is required")
		return
	}
	if err := service.SetEmailDigestEnabled(r.Context(), h.users, userID, *payload.DigestEnabled); err != nil {
		RespondError(w, http.StatusInternalServerError, "failed to save email preferences")
		return
	}
	RespondJSON(w, http.StatusOK, map[string]bool{"digestEnabled": *payload.DigestEnabled})
}

func (h *EmailHandler) Unsubscribe(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if err := service.UnsubscribeEmailDigest(r.Context(), h.users, token); err != nil {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`<!doctype html><html lang="ru"><meta charset="utf-8"><title>Ссылка недействительна</title><body style="font-family:Arial,sans-serif;max-width:560px;margin:48px auto;color:#111"><h1>Ссылка недействительна</h1><p>Откройте настройки профиля, чтобы изменить подписку на недельный дайджест.</p></body></html>`))
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`<!doctype html><html lang="ru"><meta charset="utf-8"><title>Подписка отключена</title><body style="font-family:Arial,sans-serif;max-width:560px;margin:48px auto;color:#111"><h1>Недельный дайджест отключён</h1><p>Вы больше не будете получать еженедельные письма. Включить их снова можно в настройках профиля.</p><p><a href="https://det-academy.ru/profile">Открыть профиль</a></p></body></html>`))
}
