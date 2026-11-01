# Backup and restore

## Current state

- `scripts/backup_postgres.sh` dumps PostgreSQL in custom format.
- The nightly GitHub Actions workflow (`backup.yml`) also archives the
  `det-academy_media_data` volume (learner audio, TTS cache) and pairs it with
  the database dump using one `BACKUP_STAMP`.
- Before encryption, the runner restores the dump into a disposable
  `postgres:16-alpine` container and verifies that every `media_assets.file_path`
  exists in the media archive.
- Both files are encrypted with `BACKUP_ENCRYPTION_KEY` and uploaded as one
  GitHub Actions artifact with a shared `sha256` file.
- Local plaintext dumps live under `/var/backups/det`; the offsite copy is the
  encrypted artifact only.

## Required production procedure

1. Dump database and media in the same run, with one timestamp:

   ```bash
   cd /root/det-academy
   set -a && . ./.env && set +a
   export BACKUP_DIR=/var/backups/det
   export BACKUP_STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
   ./scripts/backup_postgres.sh
   docker run --rm -v det-academy_media_data:/data -v "$BACKUP_DIR:/backup" \
     alpine:3.20 tar -czf "/backup/media-$BACKUP_STAMP.tar.gz" -C /data .
   ```

2. Never separate the pair. The restore drill must use
   `det_academy_<stamp>.dump` and `media-<stamp>.tar.gz` from the same stamp.
3. Encrypt both files with `BACKUP_ENCRYPTION_KEY` before they leave the host.
4. Retention: 14 daily local files, 14 days offsite artifacts. Keep the
   encryption key in a password manager, not only in GitHub secrets.
5. Restore drill (also automated nightly in `backup.yml`):

   ```bash
   docker run -d --name det-restore-test -e POSTGRES_PASSWORD=restore \
     -e POSTGRES_DB=restore postgres:16-alpine
   # wait for the second "database system is ready to accept connections"
   docker cp det_academy_<stamp>.dump det-restore-test:/tmp/restore.dump
   docker exec det-restore-test pg_restore -U postgres -d restore \
     --no-owner --no-acl /tmp/restore.dump
   docker exec det-restore-test psql -U postgres -d restore -tAc \
     "SELECT count(*) FROM users; SELECT count(*) FROM test_sessions;"
   docker rm -f det-restore-test
   ```

   Then compare `SELECT file_path FROM media_assets` with the media archive
   contents (strip `/data/media/` from the database path).

## Verified drill

On 2026-11-01 the production dump restored into a disposable Postgres with:

- users = 90
- test sessions = 110
- question responses = 1193
- media assets = 44

All 44 media rows had a matching file in the archive. The archive also contains
TTS cache objects that are not referenced by `media_assets`; those are harmless
and can be restored as-is.

## Gaps

- Offsite storage is GitHub Actions artifacts (encrypted, 14 days). A second
  offsite target (object storage) is not configured.
- No independent restore drill on a different host; the nightly drill runs in
  the same GitHub Actions job that creates the backup.
- `restore_postgres.sh` targets the live database and must not be run against
  production without a confirmed target.
