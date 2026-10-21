package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"det-academy-backend/internal/observability"
)

type clientErrorPayload struct {
	Message   string `json:"message"`
	Stack     string `json:"stack"`
	URL       string `json:"url"`
	UserAgent string `json:"userAgent"`
}

// ClientError accepts a bounded, unauthenticated frontend error report and
// forwards it to the same Sentry hub used by the backend. It never returns
// error details to the client.
func ClientError(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 32<<10)
	var payload clientErrorPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	payload.Message = strings.TrimSpace(payload.Message)
	if payload.Message == "" || len(payload.Message) > 2000 {
		RespondError(w, http.StatusBadRequest, "message is required")
		return
	}
	if len(payload.Stack) > 8000 {
		payload.Stack = payload.Stack[:8000]
	}
	observability.CaptureClientError(payload.Message, payload.Stack, payload.URL, payload.UserAgent)
	RespondJSON(w, http.StatusAccepted, map[string]string{"status": "accepted"})
}
