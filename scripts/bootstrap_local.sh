#!/usr/bin/env bash
# Bootstrap a local PostgreSQL database with the current schema and demo users.
# Production should rely on backend startup migrations instead of demo seeds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@127.0.0.1:15432/det_academy?sslmode=disable}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/backend/db/init.sql"
for migration in "$ROOT"/backend/db/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$migration"
done
if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/backend/db/seed.sql"
  echo "Local demo users: admin@det-academy.com / admin123, student@det-academy.com / password123"
fi
echo "Local database is ready"
