package postgres

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// RunMigrations applies every *.sql file in dir exactly once. It is safe on an
// existing database because each migration is recorded in schema_migrations
// and the SQL files themselves use IF NOT EXISTS where possible.
func (s *PostgresStorage) RunMigrations(dir string) error {
	dir = strings.TrimSpace(dir)
	if dir == "" {
		return nil
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("read migrations dir %s: %w", dir, err)
	}
	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names)

	// A brand-new database has no base tables yet. Apply the canonical
	// bootstrap schema before the incremental migrations.
	var usersTable bool
	if err := s.db.QueryRow(`SELECT to_regclass('users') IS NOT NULL`).Scan(&usersTable); err != nil {
		return fmt.Errorf("inspect base schema: %w", err)
	}
	if !usersTable {
		initPath := filepath.Join(filepath.Dir(dir), "init.sql")
		body, err := os.ReadFile(initPath)
		if err != nil {
			return fmt.Errorf("base schema %s is required for an empty database: %w", initPath, err)
		}
		if _, err := s.db.Exec(string(body)); err != nil {
			return fmt.Errorf("apply base schema %s: %w", initPath, err)
		}
	}

	if _, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)
	`); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	for _, name := range names {
		var exists bool
		if err := s.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)`, name).Scan(&exists); err != nil {
			return fmt.Errorf("check migration %s: %w", name, err)
		}
		if exists {
			continue
		}
		body, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		tx, err := s.db.Begin()
		if err != nil {
			return fmt.Errorf("begin migration %s: %w", name, err)
		}
		if _, err := tx.Exec(string(body)); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("apply migration %s: %w", name, err)
		}
		if _, err := tx.Exec(`INSERT INTO schema_migrations (version) VALUES ($1)`, name); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("record migration %s: %w", name, err)
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %s: %w", name, err)
		}
	}
	return nil
}

// MigrationsDir resolves the migration directory for local `go run`, tests and
// the container image without requiring every caller to know the CWD.
func MigrationsDir() string {
	if configured := strings.TrimSpace(os.Getenv("MIGRATIONS_DIR")); configured != "" {
		return configured
	}
	for _, candidate := range []string{"db/migrations", "backend/db/migrations", "/app/db/migrations"} {
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate
		}
	}
	return ""
}

// DB exposes the pool for migration and integration tests. It must not be used
// by handlers; repository methods remain the only application data API.
func (s *PostgresStorage) DB() *sql.DB {
	return s.db
}
