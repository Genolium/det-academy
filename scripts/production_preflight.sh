#!/usr/bin/env bash
# Mandatory production preflight. Runs on the production host from the repo
# root, before a release is built or containers are recreated.
#
# It checks configuration only; it never prints secret values.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [ ! -f .env ]; then
  echo "production preflight: .env is missing" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

fail=0

require() {
  local key="$1"
  local value="${!key:-}"
  if [ -z "$value" ] || [[ "$value" =~ ^(CHANGE_ME|your[_-]|\.\.\.) ]]; then
    echo "FAIL $key is not configured" >&2
    fail=1
  else
    echo "ok   $key"
  fi
}

require POSTGRES_PASSWORD
require DATABASE_URL
require JWT_SECRET
require AI_BASE_URL
require AI_API_KEY
require AI_MODEL
require AI_STT_ENABLED
require AI_TTS_ENABLED
require DIRECTUS_KEY
require DIRECTUS_SECRET

if [ -n "${POSTBOX_ACCESS_KEY:-}" ] && [ -n "${POSTBOX_SECRET_KEY:-}" ]; then
  echo "ok   Postbox HTTPS credentials"
elif [ -n "${SMTP_HOST:-}" ] && [ -n "${SMTP_USERNAME:-}" ] && [ -n "${SMTP_PASSWORD:-}" ]; then
  echo "ok   SMTP credentials"
else
  echo "FAIL email transport (Postbox or SMTP) is not configured" >&2
  fail=1
fi

if [ -n "${SMTP_FROM:-}" ] || [ -n "${EMAIL_FROM:-}" ] || [ -n "${POSTBOX_FROM:-}" ]; then
  echo "ok   sender identity"
else
  echo "FAIL sender identity is not configured" >&2
  fail=1
fi

if [ -n "${BACKUP_S3_URI:-}" ]; then
  echo "ok   offsite backup target"
elif [ -d /var/backups/det ] && [ -w /var/backups/det ]; then
  echo "ok   local backup directory (offsite artifact workflow expected)"
else
  echo "FAIL backup target is not configured" >&2
  fail=1
fi

if docker compose ps postgres 2>/dev/null | grep -q "Up\|running"; then
  echo "ok   postgres container"
else
  echo "FAIL postgres container is not running" >&2
  fail=1
fi

if curl -fsS --max-time 5 http://127.0.0.1:18080/api/v1/ready >/dev/null 2>&1; then
  echo "ok   backend /ready"
else
  echo "FAIL backend /ready" >&2
  fail=1
fi

if curl -fsS --max-time 5 http://127.0.0.1:18055/server/info >/dev/null 2>&1; then
  echo "ok   Directus CMS"
else
  echo "FAIL Directus CMS" >&2
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "production preflight failed" >&2
  exit 1
fi

echo "production preflight passed"
