# Backup and restore

## Current state

- `scripts/backup_postgres.sh` dumps PostgreSQL (custom format) and the GitHub
  workflow stores an encrypted artifact.
- `MEDIA_UPLOAD_DIR` / the `media_data` Docker volume is **not** included in
  that dump. Learner audio and TTS cache must be backed up separately, otherwise
  restored `media_assets` rows point at missing files.
- Local dumps under `/var/backups/det` are plain files; the encrypted copy is
  the GitHub artifact only.

## Required production procedure

1. Dump database and media in the same run, with one timestamp:

   ```bash
   stamp=$(date -u +%Y%m%dT%H%M%SZ)
   ./scripts/backup_postgres.sh
   docker run --rm -v det-academy_media_data:/data -v /var/backups/det:/backup \
     alpine tar -czf "/backup/media-${stamp}.tar.gz" -C /data .
   ```

2. Encrypt both files with the existing `BACKUP_ENCRYPTION_KEY` before they
   leave the host. Never upload a plaintext media archive.
3. Store DB + media with the same timestamp; restore must use a matching pair.
4. Retention: 14 daily local, 30–90 days offsite; keep the encryption key in a
   password manager, not only in GitHub secrets.
5. Restore drill (monthly, into a disposable Postgres container):

   ```bash
   pg_restore --clean --if-exists --dbname="$TEST_DATABASE_URL" dump.dump
   # then verify: users, completed sessions, media_assets count, audio file exists
   ```

## Gaps

- Offsite media target/credentials are not configured yet.
- No automated restore drill exists; `restore_postgres.sh` targets the live
  database and must not be run against production without a confirmed target.
- This document is the activation checklist until those two items are provided.
