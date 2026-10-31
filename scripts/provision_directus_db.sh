#!/usr/bin/env bash
# Create a dedicated non-superuser Postgres role for Directus.
# Reads DIRECTUS_DB_PASSWORD from .env; never prints it.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [ ! -f .env ]; then
  echo "provision_directus_db: .env is missing" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
. ./.env
set +a

: "${DIRECTUS_DB_PASSWORD:?DIRECTUS_DB_PASSWORD is required}"
db_user="${POSTGRES_USER:-postgres}"
db_name="${POSTGRES_DB:-det_academy}"

docker compose exec -T postgres psql -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -v pw="$DIRECTUS_DB_PASSWORD" -v dbname="$db_name" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'directus', :'pw')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'directus')
\gexec

ALTER ROLE directus WITH LOGIN PASSWORD :'pw';
GRANT CONNECT ON DATABASE :"db_name" TO directus;
GRANT USAGE, CREATE ON SCHEMA public TO directus;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO directus;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO directus;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO directus;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO directus;
SQL

echo "directus role is ready (non-superuser)"
