package tests

import (
	"database/sql"
	"os"
	"strings"
	"testing"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

func TestPostgresTheoryTaxonomyMigration(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	admin, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("open admin db: %v", err)
	}
	defer admin.Close()

	schema := "theory_taxonomy_" + strings.ReplaceAll(uuid.NewString()[:8], "-", "")
	if _, err := admin.Exec(`CREATE SCHEMA "` + schema + `"`); err != nil {
		t.Fatalf("create schema: %v", err)
	}
	defer admin.Exec(`DROP SCHEMA IF EXISTS "` + schema + `" CASCADE`)

	separator := "?"
	if strings.Contains(databaseURL, "?") {
		separator = "&"
	}
	db, err := sql.Open("postgres", databaseURL+separator+"search_path="+schema)
	if err != nil {
		t.Fatalf("open scoped db: %v", err)
	}
	defer db.Close()

	if _, err := db.Exec(`
		CREATE TABLE theory_lessons (
			id VARCHAR(100) PRIMARY KEY,
			number INT NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			title_ru VARCHAR(255) NOT NULL,
			title_en VARCHAR(255) NOT NULL,
			category VARCHAR(50) NOT NULL,
			category_label_ru VARCHAR(100) NOT NULL,
			category_label_en VARCHAR(100) NOT NULL,
			format TEXT NOT NULL,
			scoring TEXT NOT NULL,
			time_limit TEXT NOT NULL,
			rules JSONB NOT NULL DEFAULT '[]',
			strategy_steps JSONB NOT NULL DEFAULT '[]',
			formula TEXT DEFAULT '',
			examples JSONB NOT NULL DEFAULT '[]',
			pitfalls JSONB NOT NULL DEFAULT '[]',
			publish_status VARCHAR(20) NOT NULL DEFAULT 'published',
			version VARCHAR(20) NOT NULL DEFAULT '2026.2',
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);
		CREATE TABLE theory_progress (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			lesson_slug VARCHAR(100) NOT NULL,
			is_completed BOOLEAN DEFAULT FALSE,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_slug)
		);
	`); err != nil {
		t.Fatalf("create test tables: %v", err)
	}

	tasks := []string{
		"read-and-select", "fill-in-the-blanks", "read-and-complete",
		"listen-and-type", "interactive-reading", "interactive-listening",
		"write-about-photo", "interactive-writing", "speak-about-photo",
		"read-then-speak", "interactive-speaking", "writing-sample",
		"speaking-sample",
	}
	for index, slug := range tasks {
		if _, err := db.Exec(`
			INSERT INTO theory_lessons
				(id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit)
			VALUES ($1, $2, $1, $1, $1, 'test', 'test', 'test', 'test', 'test', 'test')
		`, slug, index+1); err != nil {
			t.Fatalf("insert task %s: %v", slug, err)
		}
	}
	for number, slug := range map[int]string{
		1: "rules-and-technicalities",
		2: "subscores-and-cat-engine",
		4: "listen-and-select",
		8: "read-aloud",
		15: "read-listen-speak",
	} {
		if _, err := db.Exec(`
			INSERT INTO theory_lessons
				(id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit)
			VALUES ($1, $2, $1, $1, $1, 'test', 'test', 'test', 'test', 'test', 'test')
		`, slug, number); err != nil {
			t.Fatalf("insert legacy %s: %v", slug, err)
		}
	}

	userAll := uuid.NewString()
	userCombined := uuid.NewString()
	for _, slug := range []string{"listen-and-select", "read-aloud", "read-listen-speak"} {
		if _, err := db.Exec(`INSERT INTO theory_progress (user_id, lesson_slug, is_completed) VALUES ($1, $2, TRUE)`, userAll, slug); err != nil {
			t.Fatalf("seed progress %s: %v", slug, err)
		}
	}
	if _, err := db.Exec(`INSERT INTO theory_progress (user_id, lesson_slug, is_completed) VALUES ($1, 'read-listen-speak', TRUE)`, userCombined); err != nil {
		t.Fatalf("seed combined progress: %v", err)
	}

	migration, err := os.ReadFile("../db/migrations/039_theory_taxonomy.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}
	if _, err := db.Exec(string(migration)); err != nil {
		t.Fatalf("apply migration: %v", err)
	}

	for _, retired := range []string{"listen-and-select", "read-aloud", "read-listen-speak"} {
		var count int
		if err := db.QueryRow(`SELECT COUNT(*) FROM theory_lessons WHERE slug = $1`, retired).Scan(&count); err != nil {
			t.Fatal(err)
		}
		if count != 0 {
			t.Fatalf("retired lesson %s still exists", retired)
		}
	}
	for _, current := range []string{"read-then-speak", "interactive-speaking"} {
		var count int
		if err := db.QueryRow(`SELECT COUNT(*) FROM theory_lessons WHERE slug = $1`, current).Scan(&count); err != nil {
			t.Fatal(err)
		}
		if count != 1 {
			t.Fatalf("current lesson %s missing", current)
		}
	}
	for _, reference := range []string{"rules-and-technicalities", "subscores-and-cat-engine"} {
		var trackable bool
		if err := db.QueryRow(`SELECT is_trackable FROM theory_lessons WHERE slug = $1`, reference).Scan(&trackable); err != nil {
			t.Fatal(err)
		}
		if trackable {
			t.Fatalf("reference %s must not be trackable", reference)
		}
	}
	var taskCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM theory_lessons WHERE is_trackable AND number BETWEEN 1 AND 13`).Scan(&taskCount); err != nil {
		t.Fatal(err)
	}
	if taskCount != 13 {
		t.Fatalf("trackable task count = %d, want 13", taskCount)
	}

	assertProgress := func(userID, slug string) {
		t.Helper()
		var count int
		if err := db.QueryRow(`SELECT COUNT(*) FROM theory_progress WHERE user_id = $1 AND lesson_slug = $2 AND is_completed`, userID, slug).Scan(&count); err != nil {
			t.Fatal(err)
		}
		if count != 1 {
			t.Fatalf("user %s missing mapped progress %s", userID, slug)
		}
	}
	assertProgress(userAll, "fill-in-the-blanks")
	assertProgress(userAll, "read-then-speak")
	assertProgress(userAll, "interactive-speaking")
	assertProgress(userCombined, "read-then-speak")
	assertProgress(userCombined, "interactive-speaking")

	var retiredProgress int
	if err := db.QueryRow(`SELECT COUNT(*) FROM theory_progress WHERE lesson_slug IN ('listen-and-select', 'read-aloud', 'read-listen-speak')`).Scan(&retiredProgress); err != nil {
		t.Fatal(err)
	}
	if retiredProgress != 0 {
		t.Fatalf("retired progress rows = %d, want 0", retiredProgress)
	}
}
