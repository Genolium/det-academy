package tests

import (
	"database/sql"
	"fmt"
	"os"
	"sort"
	"strings"
	"testing"

	"det-academy-backend/internal/repository/postgres"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// legacyMissingTables lists the tables that did not exist in the first
// production database. That database was created from the initial schema of
// 2025-10-05 and was never re-initialised, so every table added later only
// exists in init.sql. The migrations have to create them.
var legacyMissingTables = []string{
	"evaluation_jobs",
	"evaluations",
	"media_assets",
	"oauth_transactions",
	"refresh_tokens",
	"session_events",
	"session_questions",
	"study_plan_task_completions",
	"user_activity",
	"user_errors",
	"user_goals",
	"user_srs_cards",
	"user_srs_stats",
	"vocabulary_entries",
	"learning_events",
	"practice_attempts",
	"practice_assignments",
	"typing_attempts",
	"user_skill_mastery",
}

// legacyMissingColumns lists the columns that were added to the initial
// schema after the first production database was created. They are declared
// in init.sql only, so a migration has to add them to existing databases.
var legacyMissingColumns = []struct {
	table  string
	column string
}{
	{"certificates", "reading_score"},
	{"certificates", "listening_score"},
	{"certificates", "writing_score"},
	{"certificates", "speaking_score"},
	{"test_sessions", "mode"},
	{"test_sessions", "reading_score"},
	{"test_sessions", "listening_score"},
	{"test_sessions", "writing_score"},
	{"test_sessions", "speaking_score"},
	{"test_sessions", "deadline_at"},
	{"test_sessions", "blueprint_version"},
	{"test_sessions", "scoring_version"},
	{"test_sessions", "content_snapshot"},
	{"session_questions", "question_snapshot"},
	{"user_errors", "error_category"},
	{"user_errors", "error_rule"},
	{"user_errors", "context_variants"},
	{"practice_attempts", "question_id"},
	{"users", "token_version"},
	{"users", "email_verified"},
	{"users", "email_verification_token_hash"},
	{"users", "email_verification_expires"},
}

// TestMigrationsConvergeLegacyDatabaseToCanonicalSchema reproduces the
// production situation: a database that was created from an older revision of
// init.sql. After the migrations have run, the database must expose exactly
// the same tables and columns as a database created from the current schema.
//
// Without this test a column that only exists in init.sql silently stays
// missing on production and breaks the feature that uses it.
func TestMigrationsConvergeLegacyDatabaseToCanonicalSchema(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	canonical := newSchema(t, databaseURL)
	defer dropSchema(t, databaseURL, canonical)
	applyInitSQL(t, databaseURL, canonical)
	runMigrations(t, databaseURL, canonical)
	want := schemaSignature(t, databaseURL, canonical)

	legacy := newSchema(t, databaseURL)
	defer dropSchema(t, databaseURL, legacy)
	applyInitSQL(t, databaseURL, legacy)
	downgradeToLegacy(t, databaseURL, legacy)
	runMigrations(t, databaseURL, legacy)
	got := schemaSignature(t, databaseURL, legacy)

	for table, columns := range want {
		gotColumns, ok := got[table]
		if !ok {
			t.Errorf("table %q is missing after the migrations ran", table)
			continue
		}
		for _, column := range columns {
			if !containsString(gotColumns, column) {
				t.Errorf("column %q is missing in table %q after the migrations ran", column, table)
			}
		}
	}
}

func newSchema(t *testing.T, databaseURL string) string {
	t.Helper()
	admin, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("open admin db: %v", err)
	}
	defer admin.Close()

	schema := "schema_" + strings.ReplaceAll(uuid.NewString()[:8], "-", "")
	if _, err := admin.Exec(`CREATE SCHEMA "` + schema + `"`); err != nil {
		t.Fatalf("create schema: %v", err)
	}
	return schema
}

func dropSchema(t *testing.T, databaseURL, schema string) {
	t.Helper()
	admin, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("open admin db: %v", err)
	}
	defer admin.Close()
	if _, err := admin.Exec(`DROP SCHEMA IF EXISTS "` + schema + `" CASCADE`); err != nil {
		t.Logf("drop schema %s: %v", schema, err)
	}
}

func scopedURL(databaseURL, schema string) string {
	separator := "?"
	if strings.Contains(databaseURL, "?") {
		separator = "&"
	}
	return databaseURL + separator + "search_path=" + schema
}

func applyInitSQL(t *testing.T, databaseURL, schema string) {
	t.Helper()
	body, err := os.ReadFile("../db/init.sql")
	if err != nil {
		t.Fatalf("read init.sql: %v", err)
	}
	db, err := sql.Open("postgres", scopedURL(databaseURL, schema))
	if err != nil {
		t.Fatalf("open scoped db: %v", err)
	}
	defer db.Close()
	if _, err := db.Exec(string(body)); err != nil {
		t.Fatalf("apply init.sql: %v", err)
	}
}

func downgradeToLegacy(t *testing.T, databaseURL, schema string) {
	t.Helper()
	db, err := sql.Open("postgres", scopedURL(databaseURL, schema))
	if err != nil {
		t.Fatalf("open scoped db: %v", err)
	}
	defer db.Close()

	for _, table := range legacyMissingTables {
		if _, err := db.Exec(`DROP TABLE IF EXISTS "` + table + `" CASCADE`); err != nil {
			t.Fatalf("drop legacy table %s: %v", table, err)
		}
	}
	for _, column := range legacyMissingColumns {
		statement := fmt.Sprintf(`ALTER TABLE "%s" DROP COLUMN IF EXISTS "%s"`, column.table, column.column)
		if _, err := db.Exec(statement); err != nil {
			t.Fatalf("drop legacy column %s.%s: %v", column.table, column.column, err)
		}
	}
}

func runMigrations(t *testing.T, databaseURL, schema string) {
	t.Helper()
	store, err := postgres.New(scopedURL(databaseURL, schema))
	if err != nil {
		t.Fatalf("open scoped store: %v", err)
	}
	defer store.Close()
	if err := store.RunMigrations("../db/migrations"); err != nil {
		t.Fatalf("run migrations: %v", err)
	}
}

// schemaSignature returns the tables of a schema with their column names.
func schemaSignature(t *testing.T, databaseURL, schema string) map[string][]string {
	t.Helper()
	db, err := sql.Open("postgres", scopedURL(databaseURL, schema))
	if err != nil {
		t.Fatalf("open scoped db: %v", err)
	}
	defer db.Close()

	rows, err := db.Query(`
		SELECT table_name, column_name
		FROM information_schema.columns
		WHERE table_schema = $1 AND table_name <> 'schema_migrations'
		ORDER BY table_name, column_name
	`, schema)
	if err != nil {
		t.Fatalf("read columns: %v", err)
	}
	defer rows.Close()

	signature := map[string][]string{}
	for rows.Next() {
		var table, column string
		if err := rows.Scan(&table, &column); err != nil {
			t.Fatalf("scan column: %v", err)
		}
		signature[table] = append(signature[table], column)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("iterate columns: %v", err)
	}
	for table := range signature {
		sort.Strings(signature[table])
	}
	return signature
}

func containsString(values []string, needle string) bool {
	for _, value := range values {
		if value == needle {
			return true
		}
	}
	return false
}
