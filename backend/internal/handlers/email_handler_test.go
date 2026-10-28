package handlers

import (
	"context"
	"net/http/httptest"
	"testing"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"
)

func TestUnsubscribeHandlerDisablesDigest(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	user := &models.User{ID: "unsub-user", Email: "unsub@example.com", Name: "Unsub"}
	if err := store.Users().Create(ctx, user); err != nil {
		t.Fatal(err)
	}
	handler := NewEmailHandler(store.Users())
	token := service.DigestUnsubscribeToken(user.ID)
	recorder := httptest.NewRecorder()
	handler.Unsubscribe(recorder, httptest.NewRequest("GET", "/api/v1/email/unsubscribe?token="+token, nil))
	if recorder.Code != 200 {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	enabled, err := store.Users().GetEmailDigestEnabled(ctx, user.ID)
	if err != nil || enabled {
		t.Fatalf("enabled = %v, err = %v", enabled, err)
	}
}

func TestUnsubscribeHandlerRejectsTamperedToken(t *testing.T) {
	handler := NewEmailHandler(memory.New().Users())
	recorder := httptest.NewRecorder()
	handler.Unsubscribe(recorder, httptest.NewRequest("GET", "/api/v1/email/unsubscribe?token=bad", nil))
	if recorder.Code != 400 {
		t.Fatalf("status = %d", recorder.Code)
	}
}
