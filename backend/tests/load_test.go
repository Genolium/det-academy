package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strconv"
	"testing"
	"time"

	"det-academy-backend/internal/models"
	"det-academy-backend/internal/repository/postgres"
	"det-academy-backend/internal/service"

	"github.com/google/uuid"
)

// TestLoadStartRespondCompleteP95 is an opt-in latency check against a real
// PostgreSQL database. Run it with:
//
//	LOAD_TEST=1 TEST_DATABASE_URL=... go test ./tests -run TestLoadStartRespondCompleteP95 -v
//
// It reports the p95 latency of start, respond and stage-complete. The budget
// is intentionally generous so the test is stable on a developer machine; the
// numbers are meant to be compared between runs, not to replace a load test
// against the production topology.
func TestLoadStartRespondCompleteP95(t *testing.T) {
	if os.Getenv("LOAD_TEST") != "1" {
		t.Skip("set LOAD_TEST=1 to run the latency check")
	}
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	iterations := 30
	if raw := os.Getenv("LOAD_ITERATIONS"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			iterations = parsed
		}
	}
	budget := 750 * time.Millisecond
	if raw := os.Getenv("LOAD_P95_BUDGET_MS"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			budget = time.Duration(parsed) * time.Millisecond
		}
	}

	ctx := context.Background()
	store, err := postgres.New(dbURL)
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}
	defer store.Close()

	cat := service.NewCATService(
		store.Sessions(), store.Questions(), store.Theory(), store.Certificates(),
		service.NewTheoryService(store.Theory()), store.Study(),
	)
	payload := json.RawMessage(`{"text":"answer","transcript":"answer","answer":"answer","isReal":true,"answers":["a"]}`)

	var startLatencies, respondLatencies, completeLatencies []time.Duration

	for i := 0; i < iterations; i++ {
		userID := uuid.NewString()
		if err := store.Users().Create(ctx, &models.User{
			ID: userID, Email: fmt.Sprintf("load-%d-%s@example.com", i, userID[:8]),
			PasswordHash: "not-used", Name: "Load", Role: "student", Locale: "ru",
		}); err != nil {
			t.Fatalf("create user: %v", err)
		}

		started := time.Now()
		session, _, err := cat.StartSession(ctx, userID, "Load", "B1")
		startLatencies = append(startLatencies, time.Since(started))
		if err != nil {
			t.Fatalf("start session: %v", err)
		}

		assigned, err := store.Sessions().GetAssignedQuestions(ctx, session.ID, session.StageName)
		if err != nil || len(assigned) == 0 {
			t.Fatalf("assigned questions: %v", err)
		}
		for index, question := range assigned {
			if index >= 3 {
				break
			}
			begin := time.Now()
			if _, _, err := cat.RecordQuestionResponse(ctx, session.ID, userID, models.SubmitResponseRequest{
				QuestionID: question.QuestionID, UserResponse: payload, TimeSpentSec: 1,
			}); err != nil {
				t.Fatalf("respond: %v", err)
			}
			respondLatencies = append(respondLatencies, time.Since(begin))
		}

		begin := time.Now()
		if _, _, err := cat.SubmitStageResult(ctx, session.ID, userID, models.StageCompleteRequest{StageName: session.StageName}); err != nil {
			t.Fatalf("complete stage: %v", err)
		}
		completeLatencies = append(completeLatencies, time.Since(begin))

		_ = store.Users().Delete(ctx, userID)
	}

	report := func(name string, samples []time.Duration) time.Duration {
		p95 := percentile(samples, 0.95)
		t.Logf("%-18s n=%3d p50=%6.1fms p95=%6.1fms max=%6.1fms",
			name, len(samples), float64(percentile(samples, 0.50).Microseconds())/1000,
			float64(p95.Microseconds())/1000, float64(percentile(samples, 1.0).Microseconds())/1000)
		return p95
	}

	worst := report("start session", startLatencies)
	if candidate := report("respond", respondLatencies); candidate > worst {
		worst = candidate
	}
	if candidate := report("stage complete", completeLatencies); candidate > worst {
		worst = candidate
	}

	if worst > budget {
		t.Fatalf("p95 latency %s exceeds the budget %s", worst, budget)
	}
}

func percentile(samples []time.Duration, ratio float64) time.Duration {
	if len(samples) == 0 {
		return 0
	}
	sorted := append([]time.Duration(nil), samples...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i] < sorted[j] })
	index := int(float64(len(sorted)-1) * ratio)
	return sorted[index]
}
