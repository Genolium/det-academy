package service

import (
	"context"
	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/memory"
	"strings"
	"testing"
	"time"
)

func TestDeduceErrorCategory(t *testing.T) {
	tests := []struct {
		name         string
		questionType string
		explanation  string
		expectedCat  string
	}{
		{
			name:         "Connector detection from explanation",
			questionType: "FILL_BLANKS",
			explanation:  "Use a contrasting however connector to join the sentences",
			expectedCat:  "connector",
		},
		{
			name:         "Collocation detection",
			questionType: "FILL_BLANKS",
			explanation:  "Look up academic collocation and preposition usage",
			expectedCat:  "collocation",
		},
		{
			name:         "Grammar concord detection",
			questionType: "WRITING",
			explanation:  "Subject and verb agreement error in third person plural",
			expectedCat:  "grammar",
		},
		{
			name:         "Morpheme detection by question type C_TEST",
			questionType: "C_TEST",
			explanation:  "Incomplete stem in academic paragraph",
			expectedCat:  "morpheme",
		},
		{
			name:         "Vocabulary detection by READ_SELECT",
			questionType: "READ_SELECT",
			explanation:  "Determine real English words from invented ones",
			expectedCat:  "vocabulary",
		},
		{
			name:         "Default general error",
			questionType: "SPEAKING",
			explanation:  "Clarify ideas and provide more details",
			expectedCat:  "general",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cat := DeduceErrorCategory(tt.questionType, tt.explanation)
			if cat != tt.expectedCat {
				t.Fatalf("expected category %s, got %s", tt.expectedCat, cat)
			}
		})
	}
}

func TestDeduceErrorRule(t *testing.T) {
	ruleConn := DeduceErrorRule("connector", "")
	if !strings.Contains(ruleConn, "Discourse Markers") {
		t.Errorf("expected discourse markers rule for connector, got %s", ruleConn)
	}

	ruleMorph := DeduceErrorRule("morpheme", "")
	if !strings.Contains(ruleMorph, "Word Formation") {
		t.Errorf("expected word formation rule for morpheme, got %s", ruleMorph)
	}

	ruleGrammar := DeduceErrorRule("grammar", "")
	if !strings.Contains(ruleGrammar, "Subject-Verb") {
		t.Errorf("expected subject-verb rule for grammar, got %s", ruleGrammar)
	}
}

func TestGenerateContextVariants(t *testing.T) {
	variants := GenerateContextVariants("connector", "Initial prompt", "moreover", "Discourse Markers")
	if len(variants) < 2 {
		t.Fatalf("expected at least 2 context variants for connector, got %d", len(variants))
	}
	for _, v := range variants {
		if v.CorrectAnswer != "moreover" {
			t.Errorf("expected correct answer moreover, got %s", v.CorrectAnswer)
		}
		if !strings.Contains(v.Prompt, "moreover") && !strings.Contains(v.Prompt, "_______") {
			t.Errorf("expected blank or target in prompt, got %s", v.Prompt)
		}
	}

	emptyVars := GenerateContextVariants("morpheme", "Prompt", "", "Rule")
	if len(emptyVars) != 0 {
		t.Errorf("expected 0 variants for empty answer, got %d", len(emptyVars))
	}
}

func TestSaveErrorWithAutomaticDeduction(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	study := NewStudyService(store, theory, cat)
	ctx := context.Background()

	item, err := study.SaveError(ctx, "user-123", models.SaveErrorRequest{
		QuestionType:  "FILL_BLANKS",
		Prompt:        "Economic growth was stalled; _______, the new policy failed.",
		UserAnswer:    "because",
		CorrectAnswer: "consequently",
		Explanation:   "Choose the right connector expressing cause and consequence.",
	})
	if err != nil {
		t.Fatalf("failed to save error: %v", err)
	}

	if item.ErrorCategory != "connector" {
		t.Errorf("expected deduced category 'connector', got %s", item.ErrorCategory)
	}
	if !strings.Contains(item.ErrorRule, "Discourse Markers") {
		t.Errorf("expected Discourse Markers in rule, got %s", item.ErrorRule)
	}
	if len(item.ContextVariants) < 2 {
		t.Errorf("expected at least 2 context variants, got %d", len(item.ContextVariants))
	}

	// Verify retrieval
	errorsList, err := study.GetErrors(ctx, "user-123")
	if err != nil {
		t.Fatalf("failed to get errors: %v", err)
	}
	if len(errorsList) != 1 {
		t.Fatalf("expected 1 error item, got %d", len(errorsList))
	}
	if errorsList[0].ErrorCategory != "connector" {
		t.Errorf("persisted error category mismatch: %s", errorsList[0].ErrorCategory)
	}
}

func TestVersionedSessionAndQuestionSnapshots(t *testing.T) {
	store := memory.New()
	theory := NewTheoryService(store.Theory())
	cat := NewCATService(store.Sessions(), store.Questions(), store.Theory(), store.Certificates(), theory, store.Study())
	ctx := context.Background()

	session, _, err := cat.StartSession(ctx, "snap-user", "Snapshot User", "B1")
	if err != nil {
		t.Fatalf("failed to start session: %v", err)
	}

	if session.BlueprintVersion == "" {
		t.Errorf("expected non-empty BlueprintVersion in session")
	}
	if session.ScoringVersion == "" {
		t.Errorf("expected non-empty ScoringVersion in session")
	}

	// Fetch assigned questions
	assigned, err := store.Sessions().GetAssignedQuestions(ctx, session.ID, session.StageName)
	if err != nil {
		t.Fatalf("failed to get assigned questions: %v", err)
	}
	if len(assigned) > 0 {
		for _, aq := range assigned {
			if len(aq.QuestionSnapshot) == 0 {
				t.Errorf("expected non-empty QuestionSnapshot for question %s", aq.QuestionID)
			}
		}
	}

	// Complete the session and verify content snapshot
	session.Status = "COMPLETED"
	now := time.Now().UTC()
	session.CompletedAt = &now
	score := 125
	session.OverallScore = &score

	if err := store.Sessions().Update(ctx, session); err != nil {
		t.Fatalf("failed to update session: %v", err)
	}

	retrieved, err := store.Sessions().GetByID(ctx, session.ID)
	if err != nil {
		t.Fatalf("failed to get session: %v", err)
	}
	if retrieved.BlueprintVersion != session.BlueprintVersion {
		t.Errorf("blueprint version mismatch: got %s, want %s", retrieved.BlueprintVersion, session.BlueprintVersion)
	}
	if retrieved.ScoringVersion != session.ScoringVersion {
		t.Errorf("scoring version mismatch: got %s, want %s", retrieved.ScoringVersion, session.ScoringVersion)
	}
}
