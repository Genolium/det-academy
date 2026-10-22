# DET Academy runbook

## Deploying to production

The production host is `5.42.220.14`. The deploy is a git pull plus a Docker
rebuild; the repository ships an idempotent script for it:

```bash
cd /path/to/det-academy
./scripts/deploy_production.sh --backup     # backup, pull, rebuild, migrate, verify
./scripts/deploy_production.sh --with-nginx # additionally install nginx/det-academy.ru.conf
./scripts/deploy_production.sh --seed       # additionally re-apply the content and vocabulary seeds
```

The script pulls `origin/master`, rebuilds the stack, applies the migrations
through the backend container (`docker compose exec backend /app/server migrate`),
waits for `/api/v1/health` and verifies `/api/v1/ready` and `/api/v1/vocabulary`.
It never drops the database.

`--seed` re-applies `03-content-seed.sql` and `04-vocabulary-seed.sql`. It is
opt-in because the vocabulary seed resets the publication status of the
vocabulary entries, which is managed by the editorial workflow.

Manual equivalent:

```bash
git fetch origin master && git reset --hard origin/master
docker compose up -d --build --remove-orphans
docker compose logs --tail=100 backend   # look for "[Migrations] applied"
curl -fsS https://det-academy.ru/api/v1/health
```

The backend applies pending migrations on start-up. A failing migration is
logged but never stops the service, so a broken migration cannot take the API
down. Migrations that need attention are visible in the container log.

## Required production env

- `POSTGRES_PASSWORD`, `DATABASE_URL`
- `JWT_SECRET` (>=32 random bytes)
- `DIRECTUS_KEY`, `DIRECTUS_SECRET`, `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD`
- `ALLOWED_ORIGIN`
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (one-time)
- `MEDIA_UPLOAD_DIR=/data/media`
- optional: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_STT_ENABLED=true`
- optional: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`
  (see `docs/external-integrations.md`)

## Migrations

Apply every file in `backend/db/migrations/` in order before starting a new
backend version. `init.sql` is only for a fresh database. The backend container
applies them on start-up and records them in `schema_migrations`; the same can
be triggered manually with `docker compose exec backend /app/server migrate`.

The canonical schema in `backend/db/init.sql` is applied on every start as
well. It is idempotent (`CREATE ... IF NOT EXISTS`, `ON CONFLICT DO NOTHING`),
so a database that was created from an older revision of the schema gets the
tables that were added later. Columns that were added to `init.sql` after a
database was created need an explicit migration — the regression test
`TestMigrationsConvergeLegacyDatabaseToCanonicalSchema` in
`backend/tests/schema_convergence_test.go` fails when that is forgotten.

A failing migration is logged but never stops the service, so a broken
migration cannot take the API down. Migrations that need attention are visible
in the container log.

## Backup

```bash
DATABASE_URL=... BACKUP_DIR=/var/backups/det ./scripts/backup_postgres.sh
```

Back up the `media_data` volume separately. Test restore monthly:

```bash
DATABASE_URL=... ./scripts/restore_postgres.sh /var/backups/det/det_academy_....dump
```

## Readiness

- `GET /api/v1/health` — process is alive.
- `GET /api/v1/ready` — storage is reachable.
- `GET /api/v1/metrics` — request/error counters.

## Rollback

1. Stop backend.
2. Restore the previous database dump if a migration was destructive.
3. Deploy the previous backend image.
4. Verify `/ready` and the critical path: register -> diagnostic -> mock -> report.

## Critical path checklist

- register/login/logout
- each OAuth provider
- diagnostic
- practice + error notebook
- SRS recall
- full mock including audio
- network outage + resume
- result + review
- certificate lookup (known/unknown)
- second device login
