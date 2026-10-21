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
	"det-academy-backend/internal/service"
)

func toggleTheoryLesson(t *testing.T, r http.Handler, token, slug string) (int, string) {
	t.Helper()
	payload, _ := json.Marshal(map[string]string{"lessonSlug": slug})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/theory/toggle", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w.Code, w.Body.String()
}

func TestTheoryRejectsUnknownLessonAndIgnoresLegacyInvalidSlugs(t *testing.T) {
	r, _, store := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	user, err := store.Users().GetByEmail(context.Background(), "student@det-academy.com")
	if err != nil {
		t.Fatalf("load user: %v", err)
	}

	status, body := toggleTheoryLesson(t, r, token, "lesson-<uuid>")
	if status != http.StatusBadRequest {
		t.Fatalf("unknown theory slug must be rejected with 400, got %d: %s", status, body)
	}

	for _, slug := range service.LessonSlugs {
		if err := store.Theory().SetProgress(context.Background(), user.ID, slug, false); err != nil {
			t.Fatalf("clear theory progress: %v", err)
		}
	}
	// Legacy rows may already contain arbitrary slugs. They must not count
	// toward completion even if they are present in the repository.
	for index := 0; index < service.TotalTheoryLessons; index++ {
		if _, err := store.Theory().ToggleProgress(context.Background(), user.ID, fmt.Sprintf("legacy-invalid-%d", index)); err != nil {
			t.Fatalf("seed legacy theory progress: %v", err)
		}
	}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/theory/progress", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("read theory progress: %d %s", w.Code, w.Body.String())
	}
	var progress models.TheoryProgressResponse
	if err := json.Unmarshal(w.Body.Bytes(), &progress); err != nil {
		t.Fatalf("decode theory progress: %v", err)
	}
	if progress.IsAllCompleted || progress.ProgressPercent != 0 {
		t.Fatalf("legacy invalid slugs counted as theory completion: %+v", progress)
	}
}

func TestManualCertificateCopiesAllScores(t *testing.T) {
	r, _, store := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	user, err := store.Users().GetByEmail(context.Background(), "student@det-academy.com")
	if err != nil {
		t.Fatalf("load user: %v", err)
	}
	for _, slug := range service.LessonSlugs {
		if err := store.Theory().SetProgress(context.Background(), user.ID, slug, false); err != nil {
			t.Fatalf("clear theory progress: %v", err)
		}
	}
	for _, slug := range service.LessonSlugs {
		status, body := toggleTheoryLesson(t, r, token, slug)
		if status != http.StatusOK {
			t.Fatalf("toggle valid lesson %s: %d %s", slug, status, body)
		}
	}

	overall, reading, listening, writing, speaking := 120, 118, 116, 124, 122
	literacy, comprehension, production, conversation := 117, 115, 123, 121
	session := &models.TestSession{
		ID:                 fmt.Sprintf("integrity-cert-%d", time.Now().UnixNano()),
		UserID:             user.ID,
		CandidateName:      "Certificate Candidate",
		Status:             "COMPLETED",
		StageName:          "COMPLETED",
		Mode:               "full",
		OverallScore:       &overall,
		ReadingScore:       &reading,
		ListeningScore:     &listening,
		WritingScore:       &writing,
		SpeakingScore:      &speaking,
		LiteracyScore:      &literacy,
		ComprehensionScore: &comprehension,
		ProductionScore:    &production,
		ConversationScore:  &conversation,
		CompletedAt:        ptrTime(time.Now()),
	}
	if err := store.Sessions().Create(context.Background(), session); err != nil {
		t.Fatalf("seed completed session: %v", err)
	}

	payload, _ := json.Marshal(map[string]string{"testSessionId": session.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/certificates/", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("issue certificate: %d %s", w.Code, w.Body.String())
	}
	var cert models.Certificate
	if err := json.Unmarshal(w.Body.Bytes(), &cert); err != nil {
		t.Fatalf("decode certificate: %v", err)
	}
	if cert.ReadingScore != reading || cert.ListeningScore != listening || cert.WritingScore != writing || cert.SpeakingScore != speaking {
		t.Fatalf("certificate lost skill scores: %+v", cert)
	}
	if cert.LiteracyScore != literacy || cert.ComprehensionScore != comprehension || cert.ProductionScore != production || cert.ConversationScore != conversation {
		t.Fatalf("certificate lost integrated scores: %+v", cert)
	}
}

func TestDiagnosticCannotIssueCertificate(t *testing.T) {
	r, _, store := setupTestRouter()
	token := loginIntegrityStudent(t, r)
	user, err := store.Users().GetByEmail(context.Background(), "student@det-academy.com")
	if err != nil {
		t.Fatalf("load user: %v", err)
	}
	for _, slug := range service.LessonSlugs {
		if err := store.Theory().SetProgress(context.Background(), user.ID, slug, true); err != nil {
			t.Fatalf("seed theory progress: %v", err)
		}
	}

	overall, reading, listening, writing, speaking := 125, 120, 121, 126, 128
	literacy, comprehension, production, conversation := 121, 120, 127, 127
	session := &models.TestSession{
		ID:                 fmt.Sprintf("diagnostic-cert-%d", time.Now().UnixNano()),
		UserID:             user.ID,
		CandidateName:      "Diagnostic Candidate",
		Status:             "COMPLETED",
		StageName:          "COMPLETED",
		Mode:               "diagnostic",
		OverallScore:       &overall,
		ReadingScore:       &reading,
		ListeningScore:     &listening,
		WritingScore:       &writing,
		SpeakingScore:      &speaking,
		LiteracyScore:      &literacy,
		ComprehensionScore: &comprehension,
		ProductionScore:    &production,
		ConversationScore:  &conversation,
		CompletedAt:        ptrTime(time.Now()),
	}
	if err := store.Sessions().Create(context.Background(), session); err != nil {
		t.Fatalf("seed diagnostic session: %v", err)
	}

	payload, _ := json.Marshal(map[string]string{"testSessionId": session.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/certificates/", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("diagnostic session must not receive a certificate, got %d: %s", w.Code, w.Body.String())
	}
}

func ptrTime(value time.Time) *time.Time {
	return &value
}
