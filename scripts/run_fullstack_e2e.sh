#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_URL="${FULLSTACK_DATABASE_URL:-postgres://postgres:postgres@localhost:15432/det_academy_test?sslmode=disable}"
API_PORT="${FULLSTACK_API_PORT:-18081}"
FRONTEND_PORT="${FULLSTACK_FRONTEND_PORT:-3102}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Apply the schema when psql is available. In CI this is done by the workflow.
if command -v psql >/dev/null 2>&1 && [[ "${FULLSTACK_PREPARE_DB:-false}" == "true" ]]; then
  psql "$DATABASE_URL" -f "$ROOT/backend/db/init.sql" >/dev/null
  for migration in "$ROOT"/backend/db/migrations/*.sql; do
    psql "$DATABASE_URL" -f "$migration" >/dev/null
  done
  psql "$DATABASE_URL" -f "$ROOT/backend/db/03-content-seed.sql" >/dev/null
  psql "$DATABASE_URL" -f "$ROOT/backend/db/04-vocabulary-seed.sql" >/dev/null
fi

cd "$ROOT/backend"
PORT="$API_PORT" ENV=development DATABASE_URL="$DATABASE_URL" \
  JWT_SECRET="fullstack-e2e-secret" \
  ALLOWED_ORIGIN="http://localhost:$FRONTEND_PORT" \
  PUBLIC_APP_URL="http://localhost:$FRONTEND_PORT" \
  REQUIRE_EMAIL_VERIFICATION=false ALLOW_CLIENT_TRANSCRIPT=true \
  MEDIA_UPLOAD_DIR="/tmp/det-fullstack-media" \
  go run ./cmd/server >/tmp/det-fullstack-backend.log 2>&1 &
BACKEND_PID=$!

for _ in $(seq 1 60); do
  if curl -fsS "http://localhost:$API_PORT/api/v1/ready" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS "http://localhost:$API_PORT/api/v1/ready" >/dev/null

if lsof -ti tcp:"$FRONTEND_PORT" >/dev/null 2>&1; then
  echo "Port $FRONTEND_PORT is already in use; stop the stale frontend before running this script." >&2
  exit 1
fi

cd "$ROOT"
npx playwright test -c playwright.fullstack.config.ts --reporter=list
