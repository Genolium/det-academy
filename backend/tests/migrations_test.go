package tests

import (
	"database/sql"
	"os"
	"strings"
	"testing"

	"det-academy-backend/internal/repository/postgres"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

func TestRunMigrationsCreatesMissingTablesAndIsIdempotent(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	admin, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("open admin db: %v", err)
	}
	defer admin.Close()
	schema := "migrations_" + strings.ReplaceAll(uuid.NewString()[:8], "-", "")
	if _, err := admin.Exec(`CREATE SCHEMA "` + schema + `"`); err != nil {
		t.Fatalf("create schema: %v", err)
	}
	defer admin.Exec(`DROP SCHEMA IF EXISTS "` + schema + `" CASCADE`)

	separator := "?"
	if strings.Contains(databaseURL, "?") {
		separator = "&"
	}
	scopedURL := databaseURL + separator + "search_path=" + schema
	store, err := postgres.New(scopedURL)
	if err != nil {
		t.Fatalf("open scoped store: %v", err)
	}
	defer store.Close()

	if err := store.RunMigrations("../db/migrations"); err != nil {
		t.Fatalf("first migration run: %v", err)
	}
	for _, table := range []string{"oauth_transactions", "vocabulary_entries", "evaluation_jobs", "schema_migrations"} {
		var exists bool
		if err := store.DB().QueryRow(`SELECT to_regclass($1) IS NOT NULL`, schema+"."+table).Scan(&exists); err != nil {
			t.Fatalf("check table %s: %v", table, err)
		}
		if !exists {
			t.Fatalf("missing migrated table %s", table)
		}
	}
	var tokenVersion bool
	if err := store.DB().QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM information_schema.columns
			WHERE table_schema=$1 AND table_name='users' AND column_name='token_version'
		)
	`, schema).Scan(&tokenVersion); err != nil || !tokenVersion {
		t.Fatalf("users.token_version missing: %v", err)
	}
	if err := store.RunMigrations("../db/migrations"); err != nil {
		t.Fatalf("second migration run must be idempotent: %v", err)
	}
	var count int
	if err := store.DB().QueryRow(`SELECT COUNT(*) FROM schema_migrations`).Scan(&count); err != nil {
		t.Fatalf("count migrations: %v", err)
	}
	if count == 0 {
		t.Fatal("no migrations were recorded")
	}
}
