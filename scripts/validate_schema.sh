#!/usr/bin/env bash
# Verifies that the docker-compose bootstrap schema (init.sql) contains every
# column and index the backend expects before migrations are applied.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@127.0.0.1:15432/det_academy_test?sslmode=disable}"
SCHEMA="schema_validate_$(date +%s)_$$"

cleanup() {
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "DROP SCHEMA IF EXISTS \"$SCHEMA\" CASCADE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "CREATE SCHEMA \"$SCHEMA\"" >/dev/null

# Apply only the bootstrap file, exactly like a fresh docker-compose volume.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "SET search_path TO \"$SCHEMA\"" -f "$ROOT/backend/db/init.sql" >/dev/null

columns=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "
  SELECT string_agg(column_name, ',' ORDER BY column_name)
  FROM information_schema.columns
  WHERE table_schema = '$SCHEMA'
    AND table_name = 'users'
    AND column_name IN ('token_version', 'email_verified', 'email_verification_token_hash', 'email_verification_expires')
")

index=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "
  SELECT indexname
  FROM pg_indexes
  WHERE schemaname = '$SCHEMA' AND indexname = 'idx_refresh_tokens_user'
")

if [ "$columns" != "email_verification_expires,email_verification_token_hash,email_verified,token_version" ]; then
  echo "FAIL: init.sql is missing required users columns: $columns" >&2
  exit 1
fi
if [ "$index" != "idx_refresh_tokens_user" ]; then
  echo "FAIL: init.sql is missing idx_refresh_tokens_user" >&2
  exit 1
fi

echo "schema validation passed: init.sql matches backend auth schema"
