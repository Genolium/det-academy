package handlers

import (
	"context"
	"net/http"
)

// ReadinessHandler reports whether the service can serve traffic. A failing
// dependency or an incomplete schema makes it return 503, so a deployment with
// a broken migration fails instead of passing silently while the API keeps
// answering /health.
func ReadinessHandler(ping func(context.Context) error, schemaErr error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if ping != nil {
			if err := ping(r.Context()); err != nil {
				RespondError(w, http.StatusServiceUnavailable, "storage is not ready")
				return
			}
		}
		if schemaErr != nil {
			RespondError(w, http.StatusServiceUnavailable, "schema migrations failed; see the service log")
			return
		}
		RespondJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	}
}
