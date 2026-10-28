package tests

import (
	"context"
	"os"
	"testing"
	"time"

	"det-academy-backend/internal/repository/postgres"

	"github.com/google/uuid"
)

// TestPostgresDailyLimitCounterPersists verifies that the migration exists and
// that IP/device counters survive a backend restart (a new connection pool).
func TestPostgresDailyLimitCounterPersists(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	// go test runs the binary from backend/tests.
	migrationsDir := "../db/migrations"

	store, err := postgres.New(databaseURL)
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}
	if err := store.RunMigrations(migrationsDir); err != nil {
		store.Close()
		t.Fatalf("run migrations: %v", err)
	}

	ctx := context.Background()
	scope := "test:" + uuid.NewString()
	subject := "198.51.100.99"
	day := time.Now().UTC().Truncate(24 * time.Hour)

	for attempt := 1; attempt <= 2; attempt++ {
		used, allowed, err := store.Limits().ConsumeDaily(ctx, scope, subject, day, 2)
		if err != nil {
			t.Fatalf("consume %d: %v", attempt, err)
		}
		if !allowed || used != attempt {
			t.Fatalf("consume %d = (%d, %v), want (%d, true)", attempt, used, allowed, attempt)
		}
	}
	used, allowed, err := store.Limits().ConsumeDaily(ctx, scope, subject, day, 2)
	if err != nil {
		t.Fatalf("consume over limit: %v", err)
	}
	if allowed || used != 2 {
		t.Fatalf("over-limit consume = (%d, %v), want (2, false)", used, allowed)
	}

	// A new pool represents a process restart: the counter must still be there.
	if err := store.Close(); err != nil {
		t.Fatalf("close first pool: %v", err)
	}
	restarted, err := postgres.New(databaseURL)
	if err != nil {
		t.Fatalf("reopen postgres: %v", err)
	}
	defer restarted.Close()

	used, allowed, err = restarted.Limits().ConsumeDaily(ctx, scope, subject, day, 2)
	if err != nil {
		t.Fatalf("consume after restart: %v", err)
	}
	if allowed || used != 2 {
		t.Fatalf("after restart = (%d, %v), want (2, false)", used, allowed)
	}

	// The next UTC day is a fresh window.
	nextDay := day.AddDate(0, 0, 1)
	used, allowed, err = restarted.Limits().ConsumeDaily(ctx, scope, subject, nextDay, 2)
	if err != nil {
		t.Fatalf("consume next day: %v", err)
	}
	if !allowed || used != 1 {
		t.Fatalf("next day = (%d, %v), want (1, true)", used, allowed)
	}

	// Opportunistic cleanup removes windows older than the retention period.
	if err := restarted.Limits().PurgeDailyBefore(ctx, nextDay.AddDate(0, 0, 1)); err != nil {
		t.Fatalf("purge: %v", err)
	}
	used, allowed, err = restarted.Limits().ConsumeDaily(ctx, scope, subject, nextDay, 2)
	if err != nil {
		t.Fatalf("consume after purge: %v", err)
	}
	if !allowed || used != 1 {
		t.Fatalf("after purge = (%d, %v), want (1, true)", used, allowed)
	}
}
