package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"det-academy-backend/internal/models"
)

func TestSuperadminSeparatesRoleEscalation(t *testing.T) {
	r, _, store := setupTestRouter()
	ctx := context.Background()

	seed, err := store.Users().GetByEmail(ctx, "admin@det-academy.com")
	if err != nil {
		t.Fatalf("load seed admin: %v", err)
	}
	if err := store.Users().UpdateRole(ctx, seed.ID, "superadmin"); err != nil {
		t.Fatalf("promote seed admin: %v", err)
	}

	login := func(email, password string) models.AuthResponse {
		body, _ := json.Marshal(models.LoginRequest{Email: email, Password: password})
		resp := postJSONWithToken(t, r, "/api/v1/auth/login", "", body)
		if resp.Code != http.StatusOK {
			t.Fatalf("login %s: %d %s", email, resp.Code, resp.Body.String())
		}
		var auth models.AuthResponse
		_ = json.Unmarshal(resp.Body.Bytes(), &auth)
		return auth
	}

	superadmin := login("admin@det-academy.com", "admin123")

	targetEmail := fmt.Sprintf("super-target-%d@example.com", time.Now().UnixNano())
	targetBody, _ := json.Marshal(models.RegisterRequest{
		Email: targetEmail, Password: "strongPassword123!", Name: "Target Admin", Locale: "ru",
	})
	targetResp := postJSONWithToken(t, r, "/api/v1/auth/register", "", targetBody)
	if targetResp.Code != http.StatusCreated {
		t.Fatalf("register target: %d %s", targetResp.Code, targetResp.Body.String())
	}
	var targetAuth models.AuthResponse
	_ = json.Unmarshal(targetResp.Body.Bytes(), &targetAuth)
	if err := store.Users().UpdateRole(ctx, targetAuth.User.ID, "admin"); err != nil {
		t.Fatalf("promote target admin: %v", err)
	}
	admin := login(targetEmail, "strongPassword123!")

	studentEmail := fmt.Sprintf("super-student-%d@example.com", time.Now().UnixNano())
	studentBody, _ := json.Marshal(models.RegisterRequest{
		Email: studentEmail, Password: "strongPassword123!", Name: "Target Student", Locale: "ru",
	})
	studentResp := postJSONWithToken(t, r, "/api/v1/auth/register", "", studentBody)
	if studentResp.Code != http.StatusCreated {
		t.Fatalf("register student: %d %s", studentResp.Code, studentResp.Body.String())
	}
	var studentAuth models.AuthResponse
	_ = json.Unmarshal(studentResp.Body.Bytes(), &studentAuth)

	patchRole := func(token, userID, role string) int {
		body, _ := json.Marshal(models.UpdateUserRoleRequest{Role: role})
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/admin/users/"+userID+"/role", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}

	if code := patchRole(admin.Token, studentAuth.User.ID, "superadmin"); code != http.StatusBadRequest {
		t.Fatalf("admin granted superadmin: got %d, want 400", code)
	}
	if code := patchRole(admin.Token, seed.ID, "student"); code != http.StatusBadRequest {
		t.Fatalf("admin demoted superadmin: got %d, want 400", code)
	}

	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/v1/admin/users/"+seed.ID, nil)
	deleteReq.Header.Set("Authorization", "Bearer "+admin.Token)
	deleteW := httptest.NewRecorder()
	r.ServeHTTP(deleteW, deleteReq)
	if deleteW.Code != http.StatusBadRequest {
		t.Fatalf("admin deleted superadmin: got %d, want 400", deleteW.Code)
	}

	if code := patchRole(superadmin.Token, studentAuth.User.ID, "superadmin"); code != http.StatusOK {
		t.Fatalf("superadmin promotion: got %d, want 200", code)
	}
}
