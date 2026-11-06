package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestResendVerificationByEmailIsGeneric(t *testing.T) {
	r, _, store := setupTestRouter()
	email := "recovery-" + time.Now().Format("150405.000000") + "@example.com"
	registerBody, _ := json.Marshal(map[string]string{
		"email":    email,
		"password": "strongPassword123!",
		"name":     "Recovery User",
	})
	registerReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(registerBody))
	registerReq.Header.Set("Content-Type", "application/json")
	registerW := httptest.NewRecorder()
	r.ServeHTTP(registerW, registerReq)
	if registerW.Code != http.StatusCreated {
		t.Fatalf("register: %d %s", registerW.Code, registerW.Body.String())
	}

	before, err := store.Users().GetByEmail(context.Background(), email)
	if err != nil || before.EmailVerified {
		t.Fatalf("expected unverified user: %v %+v", err, before)
	}
	beforeHash := before.EmailVerificationTokenHash
	// Simulate a link issued more than the 60-second resend cooldown ago.
	olderExpiry := time.Now().Add(23 * time.Hour)
	before.EmailVerificationExpires = &olderExpiry

	resendBody, _ := json.Marshal(map[string]string{"email": email})
	resendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/resend-verification-by-email", bytes.NewReader(resendBody))
	resendReq.Header.Set("Content-Type", "application/json")
	resendW := httptest.NewRecorder()
	r.ServeHTTP(resendW, resendReq)
	if resendW.Code != http.StatusOK {
		t.Fatalf("resend existing: %d %s", resendW.Code, resendW.Body.String())
	}

	after, err := store.Users().GetByEmail(context.Background(), email)
	if err != nil {
		t.Fatalf("reload user: %v", err)
	}
	if after.EmailVerificationTokenHash == "" || after.EmailVerificationTokenHash == beforeHash {
		t.Fatal("resend must rotate the verification token")
	}
	if after.EmailVerificationExpires == nil || !after.EmailVerificationExpires.After(time.Now()) {
		t.Fatal("resend must extend the verification expiry")
	}

	unknownBody, _ := json.Marshal(map[string]string{"email": "nobody-" + email})
	unknownReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/resend-verification-by-email", bytes.NewReader(unknownBody))
	unknownReq.Header.Set("Content-Type", "application/json")
	unknownW := httptest.NewRecorder()
	r.ServeHTTP(unknownW, unknownReq)
	if unknownW.Code != http.StatusOK || unknownW.Body.String() != resendW.Body.String() {
		t.Fatalf("unknown email must look identical: %d %s", unknownW.Code, unknownW.Body.String())
	}
}
