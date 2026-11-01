package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"det-academy-backend/internal/models"
)

func TestAdminCannotDemoteOrDeleteSelf(t *testing.T) {
	r, _, _ := setupTestRouter()

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:    "admin@det-academy.com",
		Password: "admin123",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)
	if loginW.Code != http.StatusOK {
		t.Fatalf("admin login: %d %s", loginW.Code, loginW.Body.String())
	}
	var auth models.AuthResponse
	if err := json.Unmarshal(loginW.Body.Bytes(), &auth); err != nil {
		t.Fatalf("decode login: %v", err)
	}

	demoteBody, _ := json.Marshal(models.UpdateUserRoleRequest{Role: "student"})
	demoteReq := httptest.NewRequest(http.MethodPatch, "/api/v1/admin/users/"+auth.User.ID+"/role", bytes.NewReader(demoteBody))
	demoteReq.Header.Set("Authorization", "Bearer "+auth.Token)
	demoteReq.Header.Set("Content-Type", "application/json")
	demoteW := httptest.NewRecorder()
	r.ServeHTTP(demoteW, demoteReq)
	if demoteW.Code != http.StatusBadRequest {
		t.Fatalf("self-demotion must be rejected, got %d: %s", demoteW.Code, demoteW.Body.String())
	}

	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/v1/admin/users/"+auth.User.ID, nil)
	deleteReq.Header.Set("Authorization", "Bearer "+auth.Token)
	deleteW := httptest.NewRecorder()
	r.ServeHTTP(deleteW, deleteReq)
	if deleteW.Code != http.StatusBadRequest {
		t.Fatalf("self-deletion must be rejected, got %d: %s", deleteW.Code, deleteW.Body.String())
	}
}
