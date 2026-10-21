# DET Academy runbook

## Required production env

- `POSTGRES_PASSWORD`, `DATABASE_URL`
- `JWT_SECRET` (>=32 random bytes)
- `DIRECTUS_KEY`, `DIRECTUS_SECRET`, `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD`
- `ALLOWED_ORIGIN`
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (one-time)
- `MEDIA_UPLOAD_DIR=/data/media`
- optional: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_STT_ENABLED=true`

## Migrations

Apply every file in `backend/db/migrations/` in order before starting a new
backend version. `init.sql` is only for a fresh database.

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
