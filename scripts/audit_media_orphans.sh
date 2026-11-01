#!/usr/bin/env bash
# Report media_assets rows without files and files without rows. Read-only by
# default; pass --delete-missing-rows to remove DB rows whose file is gone.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DELETE_ROWS=false
if [ "${1:-}" = "--delete-missing-rows" ]; then DELETE_ROWS=true; fi

db_user="$(docker compose exec -T postgres printenv POSTGRES_USER | tr -d '\r')"
db_name="$(docker compose exec -T postgres printenv POSTGRES_DB | tr -d '\r')"

rows="$(mktemp)"
files="$(mktemp)"
trap 'rm -f "$rows" "$files"' EXIT

docker compose exec -T postgres psql -U "$db_user" -d "$db_name" -Atc \
  "SELECT id || '|' || file_path FROM media_assets" >"$rows"

docker run --rm -v det-academy_media_data:/data alpine:3.20 \
  sh -c 'find /data -type f ! -path "/data/tts/*" | sed "s#.*/##"' >"$files"

missing=0
while IFS='|' read -r id path; do
  [ -z "$path" ] && continue
  name="$(basename "$path")"
  if ! grep -qx "$name" "$files"; then
    echo "MISSING_FILE asset=$id path=$path"
    missing=$((missing+1))
    if [ "$DELETE_ROWS" = true ]; then
      docker compose exec -T postgres psql -U "$db_user" -d "$db_name" -Atc \
        "DELETE FROM media_assets WHERE id = '$id'" >/dev/null
    fi
  fi
done <"$rows"

known_names="$(mktemp)"
trap 'rm -f "$rows" "$files" "$known_names"' EXIT
while IFS='|' read -r _ path; do basename "$path"; done <"$rows" | sort -u >"$known_names"
orphans=0
while IFS= read -r name; do
  if ! grep -qx "$name" "$known_names"; then
    echo "ORPHAN_FILE $name"
    orphans=$((orphans+1))
  fi
done <"$files"

echo "media audit: rows_without_files=$missing files_without_rows=$orphans"
