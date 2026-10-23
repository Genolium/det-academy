#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/det_academy_$STAMP.dump"

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$TARGET"
elif command -v docker >/dev/null 2>&1 && docker compose ps postgres 2>/dev/null | grep -q "Up\|running"; then
  db_user="$(docker compose exec -T postgres printenv POSTGRES_USER 2>/dev/null | tr -d '\r')"
  db_name="$(docker compose exec -T postgres printenv POSTGRES_DB 2>/dev/null | tr -d '\r')"
  docker compose exec -T postgres pg_dump -U "${db_user:-postgres}" --format=custom --no-owner --no-acl "${db_name:-det_academy}" > "$TARGET"
else
  echo "neither local pg_dump nor running docker compose postgres container found" >&2
  exit 1
fi
find "$BACKUP_DIR" -name 'det_academy_*.dump' -type f -mtime +"$RETENTION_DAYS" -delete

echo "backup written: $TARGET"
