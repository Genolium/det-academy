#!/usr/bin/env bash
# Fails if any client chunk exceeds the 1 MB budget. Keeps large JSON/CMS
# payloads on the server instead of shipping them to every visitor.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${NEXT_DIST_DIR:-.next}"
CHUNKS="$ROOT/$DIST/static/chunks"
if [ ! -d "$CHUNKS" ]; then
  echo "FAIL: $CHUNKS does not exist; run npm run build first" >&2
  exit 1
fi
MAX_BYTES=1000000
largest=0
largest_file=""
while IFS= read -r -d '' file; do
  size=$(wc -c < "$file" | tr -d ' ')
  if [ "$size" -gt "$largest" ]; then
    largest=$size
    largest_file=$file
  fi
done < <(find "$CHUNKS" -type f -name '*.js' -print0)
if [ "$largest" -gt "$MAX_BYTES" ]; then
  echo "FAIL: client chunk exceeds 1MB: $largest_file ($largest bytes)" >&2
  exit 1
fi
echo "bundle budget passed: largest client chunk is $largest bytes"
