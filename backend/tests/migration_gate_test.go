package tests

import (
	"os"
	"path/filepath"
	"testing"

	"det-academy-backend/internal/repository/postgres"
)

// TestRunMigrationsFailsOnBrokenMigration is the rollout gate: the deploy
// script runs `server migrate`, so a migration that cannot be applied has to
// return an error instead of being swallowed.
func TestRunMigrationsFailsOnBrokenMigration(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	schema := newSchema(t, databaseURL)
	defer dropSchema(t, databaseURL, schema)
	applyInitSQL(t, databaseURL, schema)

	root := t.TempDir()
	if err := copyDir("../db/migrations", filepath.Join(root, "db", "migrations")); err != nil {
		t.Fatalf("copy migrations: %v", err)
	}
	if err := copyFile("../db/init.sql", filepath.Join(root, "db", "init.sql")); err != nil {
		t.Fatalf("copy init.sql: %v", err)
	}
	broken := filepath.Join(root, "db", "migrations", "999_broken.sql")
	if err := os.WriteFile(broken, []byte("ALTER TABLE definitely_missing_table ADD COLUMN x INT;\n"), 0o644); err != nil {
		t.Fatalf("write broken migration: %v", err)
	}

	store, err := postgres.New(scopedURL(databaseURL, schema))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer store.Close()

	if err := store.RunMigrations(filepath.Join(root, "db", "migrations")); err == nil {
		t.Fatal("a broken migration must return an error so the rollout can abort")
	}
}

func copyDir(from, to string) error {
	if err := os.MkdirAll(to, 0o755); err != nil {
		return err
	}
	entries, err := os.ReadDir(from)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if err := copyFile(filepath.Join(from, entry.Name()), filepath.Join(to, entry.Name())); err != nil {
			return err
		}
	}
	return nil
}

func copyFile(from, to string) error {
	body, err := os.ReadFile(from)
	if err != nil {
		return err
	}
	return os.WriteFile(to, body, 0o644)
}
