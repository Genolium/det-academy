package tests

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

func coachFixture(t *testing.T) (*memory.MemoryStorage, *service.StudyService, string) {
	t.Helper()
	store := memory.New()
	theory := service.NewTheoryService(store.Theory())
	cat := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study(),
	)
	study := service.NewStudyService(store, theory, cat)

	userID := uuid.NewString()
	if err := store.Users().Create(context.Background(), &models.User{
		ID: userID, Email: "coach-" + userID[:8] + "@example.com",
		PasswordHash: "not-used", Name: "Coach", Role: "student", Locale: "ru",
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	return store, study, userID
}

func coachSession(t *testing.T, store *memory.MemoryStorage, userID string, completedAt time.Time) *models.TestSession {
	t.Helper()
	session := &models.TestSession{
		ID: uuid.NewString(), UserID: userID, CandidateName: "Coach",
		Status: "COMPLETED", CurrentStage: 13, StageName: "COMPLETED",
		DifficultyLevel: "B1", Mode: "full", CompletedAt: &completedAt,
	}
	if err := store.Sessions().Create(context.Background(), session); err != nil {
		t.Fatalf("create session: %v", err)
	}
	return session
}

func coachEvaluation(t *testing.T, store *memory.MemoryStorage, sessionID, questionType, status string, score float64) *models.EvaluationResult {
	t.Helper()
	evaluation := &models.EvaluationResult{
		ID: uuid.NewString(), SessionID: sessionID, QuestionID: "q-" + uuid.NewString()[:8],
		QuestionType: questionType, Status: status, Score: score, CEFRLevel: "B2",
		UniqueWords: 40, Provider: "rule-based", EvaluatorVersion: "2026.1",
		Feedback:        "Усильте аргументацию примерами.",
		Recommendations: []string{"Добавьте конкретный пример в каждый абзац."},
		EvidenceSpans: []models.EvidenceSpan{
			{Text: "I think it is good", Label: "academic_register", Suggestion: "Use a precise claim: The policy improves outcomes by..."},
		},
		CreatedAt: time.Now().UTC(),
	}
	if err := store.Sessions().SaveEvaluation(context.Background(), evaluation); err != nil {
		t.Fatalf("save evaluation: %v", err)
	}
	return evaluation
}

// TestCoachReportComparesAttempts proves that the coach shows a concrete
// improvement against the previous attempt of the same task type.
func TestCoachReportComparesAttempts(t *testing.T) {
	store, study, userID := coachFixture(t)
	ctx := context.Background()

	first := coachSession(t, store, userID, time.Now().Add(-48*time.Hour))
	coachEvaluation(t, store, first.ID, "WRITING_SAMPLE", "COMPLETED", 0.55)

	second := coachSession(t, store, userID, time.Now().Add(-1*time.Hour))
	coachEvaluation(t, store, second.ID, "WRITING_SAMPLE", "COMPLETED", 0.72)

	report, err := study.BuildCoachReport(ctx, second.ID, userID)
	if err != nil {
		t.Fatalf("coach report: %v", err)
	}
	if !report.Available || len(report.Items) != 1 {
		t.Fatalf("expected one coaching item, got %#v", report)
	}

	item := report.Items[0]
	if item.PreviousScore == nil || *item.PreviousScore != 0.55 {
		t.Fatalf("previous score is missing: %#v", item.PreviousScore)
	}
	if item.ScoreDelta == nil || *item.ScoreDelta < 0.16 || *item.ScoreDelta > 0.18 {
		t.Fatalf("unexpected delta: %#v", item.ScoreDelta)
	}
	if len(item.Improvements) == 0 {
		t.Fatal("the coach must state what improved")
	}
	if len(item.Evidence) == 0 || item.Evidence[0].Fix == "" {
		t.Fatal("the coach must show evidence with a concrete fix")
	}
	if item.PracticeURL == "" {
		t.Fatal("the coach must link to a repeatable practice task")
	}
}

// TestCoachReportDoesNotTurnProviderFailureIntoZeroSkill makes the failure
// explicit instead of showing a zero score.
func TestCoachReportDoesNotTurnProviderFailureIntoZeroSkill(t *testing.T) {
	store, study, userID := coachFixture(t)
	ctx := context.Background()

	session := coachSession(t, store, userID, time.Now())
	coachEvaluation(t, store, session.ID, "SPEAKING_SAMPLE", "FAILED", 0)

	report, err := study.BuildCoachReport(ctx, session.ID, userID)
	if err != nil {
		t.Fatalf("coach report: %v", err)
	}
	if len(report.Items) != 1 {
		t.Fatalf("expected one item, got %d", len(report.Items))
	}
	if report.Items[0].Status != "FAILED" {
		t.Fatalf("status = %q, want FAILED", report.Items[0].Status)
	}
	if report.Notice == "" {
		t.Fatal("a provider failure must be explained, not hidden")
	}
}

// TestSaveCoachErrorsCreatesRepeatableErrors links the feedback to the Error
// Notebook and keeps the operation idempotent.
func TestSaveCoachErrorsCreatesRepeatableErrors(t *testing.T) {
	store, study, userID := coachFixture(t)
	ctx := context.Background()

	session := coachSession(t, store, userID, time.Now())
	coachEvaluation(t, store, session.ID, "WRITING_SAMPLE", "COMPLETED", 0.5)

	created, err := study.SaveCoachErrors(ctx, session.ID, userID)
	if err != nil {
		t.Fatalf("save coach errors: %v", err)
	}
	if created == 0 {
		t.Fatal("feedback did not create a repeatable error")
	}

	errorsList, err := study.GetErrors(ctx, userID)
	if err != nil {
		t.Fatalf("list errors: %v", err)
	}
	if len(errorsList) == 0 {
		t.Fatal("the error notebook is empty")
	}

	// A second call must not duplicate the active error.
	if _, err := study.SaveCoachErrors(ctx, session.ID, userID); err != nil {
		t.Fatalf("second save: %v", err)
	}
	again, err := study.GetErrors(ctx, userID)
	if err != nil {
		t.Fatalf("list errors again: %v", err)
	}
	if len(again) != len(errorsList) {
		t.Fatalf("errors were duplicated: %d -> %d", len(errorsList), len(again))
	}
}

// TestDeleteSessionAudioRemovesRowsAndFiles covers the retention policy.
func TestDeleteSessionAudioRemovesRowsAndFiles(t *testing.T) {
	store, study, userID := coachFixture(t)
	ctx := context.Background()

	session := coachSession(t, store, userID, time.Now())
	dir := t.TempDir()
	filePath := filepath.Join(dir, "answer.webm")
	if err := os.WriteFile(filePath, []byte("audio"), 0o644); err != nil {
		t.Fatalf("write audio: %v", err)
	}
	if err := store.Sessions().SaveMediaAsset(ctx, &models.MediaAsset{
		ID: uuid.NewString(), UserID: userID, SessionID: session.ID, QuestionID: "q-speak",
		FileType: "audio", FilePath: filePath, URL: "/media/answer.webm", FileSize: 5,
		CreatedAt: time.Now().UTC(),
	}); err != nil {
		t.Fatalf("save asset: %v", err)
	}

	// The study service is not involved; the CAT service owns the session.
	cat := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(),
		service.NewTheoryService(store.Theory()), store.Study(),
	)
	paths, err := cat.DeleteSessionAudioAssets(ctx, session.ID, userID)
	if err != nil {
		t.Fatalf("delete audio: %v", err)
	}
	if len(paths) != 1 || paths[0] != filePath {
		t.Fatalf("unexpected paths: %#v", paths)
	}

	// A different user cannot delete someone else's audio.
	if _, err := cat.DeleteSessionAudioAssets(ctx, session.ID, "someone-else"); err == nil {
		t.Fatal("audio deletion must verify ownership")
	}
	_ = study
}
