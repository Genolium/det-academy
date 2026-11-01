package service

import (
	"strings"

	"github.com/google/uuid"
)

// newCertificateID returns an unguessable public certificate identifier.
// A certificate lookup is intentionally public, so the id must not be derived
// from a session id or another enumerable value.
func newCertificateID() string {
	return "det-cert-" + strings.ReplaceAll(uuid.NewString(), "-", "")
}
