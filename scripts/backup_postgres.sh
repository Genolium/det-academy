#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
BACKUP_S3_URI="${BACKUP_S3_URI:-}"
DRY_RUN="${DRY_RUN:-false}"
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

if [ -n "$BACKUP_S3_URI" ]; then
  key="${BACKUP_S3_URI%/}/$(basename "$TARGET")"
  if [ "$DRY_RUN" = "true" ]; then
    echo "would upload: $TARGET -> $key"
  elif command -v aws >/dev/null 2>&1; then
    aws s3 cp "$TARGET" "$key" --only-show-errors
    echo "uploaded: $key"
  elif command -v docker >/dev/null 2>&1; then
    : "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required for the S3 upload}"
    : "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required for the S3 upload}"
    docker run --rm       -v "$(cd "$BACKUP_DIR" && pwd):/backup:ro"       -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ru-central1}"       amazon/aws-cli s3 cp "/backup/$(basename "$TARGET")" "$key" --only-show-errors
    echo "uploaded: $key"
  else
    echo "BACKUP_S3_URI is set but neither aws nor docker is available" >&2
    exit 1
  fi
fi
