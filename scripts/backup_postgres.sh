#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/det_academy_$STAMP.dump"

pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$TARGET"
find "$BACKUP_DIR" -name 'det_academy_*.dump' -type f -mtime +"$RETENTION_DAYS" -delete

echo "backup written: $TARGET"
