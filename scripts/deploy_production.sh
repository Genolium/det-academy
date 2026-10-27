#!/usr/bin/env bash
# Deploy the current master branch to the production Docker stack.
#
# The script is idempotent: it can be re-run after a failure. It never drops
# the database, applies migrations through the backend container and verifies
# the critical endpoints before it reports success.
#
# Usage:
#   ./scripts/deploy_production.sh [--with-nginx] [--backup] [--seed] [--force]
#
#   --with-nginx  also install nginx/det-academy.ru.conf and reload nginx
#   --backup      create a PostgreSQL backup before deploying
#   --seed        re-apply the content and vocabulary seeds
#   --force       deploy even when the working tree has local modifications
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

WITH_NGINX=false
BACKUP=false
SEED=false
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --with-nginx) WITH_NGINX=true ;;
    --backup) BACKUP=true ;;
    --seed) SEED=true ;;
    --force) FORCE=true ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\n==> %s\n' "$1"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "required command not found: $1" >&2
    exit 1
  fi
}

require_cmd git
require_cmd docker
require_cmd curl

if [ ! -f .env ]; then
  echo ".env is missing in $REPO_ROOT" >&2
  exit 1
fi

log "Deploying"
echo "repository: $REPO_ROOT"
echo "branch:     $(git rev-parse --abbrev-ref HEAD)"
echo "commit:     $(git rev-parse --short HEAD)"

log "Pulling origin/master"
# Only tracked modifications are a problem. Untracked files such as backups or
# build artefacts on the server must not block a deployment.
if [ "$FORCE" != true ] && [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "the working tree has local modifications:" >&2
  git status --short --untracked-files=no >&2
  echo "commit or stash them, or re-run with --force" >&2
  exit 1
fi
git fetch --quiet origin master
git checkout --quiet master
git merge --ff-only --quiet origin/master
git log --oneline -1

if [ "$BACKUP" = true ]; then
  log "Backing up PostgreSQL"
  # The effective connection string is taken from the running container, so the
  # script never has to parse the .env file itself.
  DATABASE_URL="$(docker compose exec -T backend printenv DATABASE_URL | tr -d '\r')"
  export DATABASE_URL
  BACKUP_DIR="${BACKUP_DIR:-/var/backups/det}" ./scripts/backup_postgres.sh
fi

log "Rebuilding and restarting the stack"
docker compose up -d --build --remove-orphans

log "Applying migrations (a failed migration aborts the deployment)"
docker compose exec -T backend /app/server migrate

if [ "$SEED" = true ]; then
  log "Applying the content and vocabulary seeds"
  db_user="$(docker compose exec -T postgres printenv POSTGRES_USER | tr -d '\r')"
  db_name="$(docker compose exec -T postgres printenv POSTGRES_DB | tr -d '\r')"
  for seed in 03-content-seed.sql 04-vocabulary-seed.sql 05-productive-question-bank.sql 06-level-bank.sql; do
    docker compose exec -T postgres psql -U "$db_user" -d "$db_name" \
      -v ON_ERROR_STOP=1 -f "/docker-entrypoint-initdb.d/$seed"
  done
fi

log "Waiting for the backend to become healthy"
healthy=false
for _ in $(seq 1 60); do
  if curl -fsS --max-time 3 http://127.0.0.1:18080/api/v1/health >/dev/null 2>&1; then
    healthy=true
    break
  fi
  sleep 2
done

if [ "$healthy" != true ]; then
  echo "backend did not become healthy; last 60 log lines:" >&2
  docker compose logs --tail=60 backend >&2 || true
  exit 1
fi

log "Verifying the critical endpoints"
curl -fsS --max-time 5 http://127.0.0.1:18080/api/v1/health && echo
curl -fsS --max-time 5 http://127.0.0.1:18080/api/v1/ready && echo
curl -fsS --max-time 5 http://127.0.0.1:18080/api/v1/vocabulary -o /dev/null && echo "vocabulary ok"

if [ "$WITH_NGINX" = true ]; then
  log "Installing the nginx configuration"
  sudo cp nginx/det-academy.ru.conf /etc/nginx/sites-available/det-academy.ru
  sudo ln -sf /etc/nginx/sites-available/det-academy.ru /etc/nginx/sites-enabled/det-academy.ru
  sudo nginx -t
  sudo systemctl reload nginx
fi

log "Current container state"
docker compose ps

log "Done. Public check:"
echo "  curl -fsS https://det-academy.ru/api/v1/health"
