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

`--seed` re-applies `03-content-seed.sql`, `04-vocabulary-seed.sql`, the
question banks (`05`–`09`) and the generated dictionary (`10`). It is opt-in
because the vocabulary seed resets the publication status of the
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

## Daily quotas and client identity

Expensive actions are capped on three independent dimensions: the account, the
client IP and the client device. The per-user allowance keeps using the
activity tables (`test_sessions`, `practice_attempts`). The IP and device
allowances use `daily_limit_counters`, so they survive a restart and cannot be
reset by creating another account or clearing cookies.

| Variable | Default | Applies to |
|---|---:|---|
| `DAILY_MOCK_LIMIT` | 3 | full mocks per user |
| `DAILY_SPEAKING_LIMIT` | 20 | speaking answers per user |
| `DAILY_MOCK_LIMIT_PER_IP` | 10 | full mocks per client IP |
| `DAILY_MOCK_LIMIT_PER_DEVICE` | 5 | full mocks per device |
| `DAILY_SPEAKING_LIMIT_PER_IP` | 60 | speaking answers/audio uploads per IP |
| `DAILY_SPEAKING_LIMIT_PER_DEVICE` | 40 | speaking answers/audio uploads per device |
| `DAILY_AUTH_LIMIT_PER_IP` | 20 | login/register attempts per IP |
| `DAILY_AUTH_LIMIT_PER_DEVICE` | 10 | login/register attempts per device |

`0` disables one dimension. The window is the UTC day. A request that exceeds a
dimension receives `429` with `Retry-After` and a JSON body:

```json
{"error":"daily limit reached for this IP address; try again after 00:00 UTC",
 "code":"daily_limit_reached","scope":"mock","limit":"ip","limitValue":10,"retryAfterSec":43200}
```

`scope` is `mock`, `speaking` or `auth`. Cache-friendly `GET` routes never
consume a quota. The counters are pruned opportunistically (windows older than
seven days, at most once every six hours). If the counter table cannot be read
the endpoint fails closed with `503` instead of silently removing the cap.

Counters live in PostgreSQL and contain the client IP and a keyed device hash
only — no name or email. Rows are retained for at most seven days. The
in-memory store used only with `ALLOW_MEMORY_STORAGE=true` keeps them in
process memory, so they reset on restart; production refuses that fallback. A shared campus NAT can reach
`DAILY_AUTH_LIMIT_PER_IP=20` quickly — raise it for such a deployment instead of
disabling the limit.

### Frontend contract: `X-Device-Id`

The browser must generate a random UUID once, keep it in `localStorage` (for
example under `det_device_id_v1`) and send it on API requests as
`X-Device-Id`. The server accepts `[A-Za-z0-9._:-]` up to 128 characters,
replaces the value with an HMAC-SHA-256 keyed by `JWT_SECRET`, and never logs or
stores the raw identifier. A missing or malformed header is ignored, so the IP
allowance still applies; rotating the header does not bypass the IP cap.
`X-Device-Id` is included in the CORS allowed headers.

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
migration cannot take the API down. The failure is also reported by
`GET /api/v1/ready`, which returns `503` until the schema is repaired — the
deploy script checks that endpoint, so a deployment with a broken migration
fails loudly instead of passing silently. Migrations that need attention are
visible in the container log.

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
- `GET /api/v1/metrics` — request/error counters. Set `METRICS_TOKEN` to
  require `Authorization: Bearer <token>` (or `?token=<token>`); without the
  variable the endpoint stays public.

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

## Learning, coaching and retention endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/user/xp` | total and weekly XP, league derived from the ledger, next threshold and the rule |
| `GET /api/v1/user/coach/{sessionId}` | speaking/writing coaching: comparison with the previous attempt, evidence → rule → fix, provider and evaluator version |
| `POST /api/v1/user/coach/{sessionId}/errors` | copies the coaching observations into the Error Notebook (idempotent) |
| `DELETE /api/v1/user/coach/{sessionId}/audio` | deletes the recordings of the student's own attempt (rows first, files only inside the upload directory) |

Rules that the tests enforce:

- an account without a goal gets `configured: false` and never a fabricated
  target score, deadline, daily budget or university;
- readiness is reported only after at least two completed mock tests and always
  explains its basis;
- the daily plan is trimmed to the available minutes and every task states why
  it was assigned;
- a provider failure is reported as "оценка недоступна", never as a zero skill;
- XP is awarded once per `(user, idempotency key)`;
- bot duels are unranked and never change the rating;
- a retracted question (`is_active = false`) is not served to students but its
  history stays intact.

## Content retraction

`DELETE /api/v1/admin/questions/{id}` retracts a question instead of deleting
it: the row is kept (so finished attempts keep their integrity) and
`is_active = false` removes it from every new attempt. The public question
endpoint only serves active items, which is covered by
`TestPublicQuestionEndpointExcludesInactive`.

## Interactive content and mock variety

`backend/db/09-interactive-bank.sql` is generated, never edited by hand:

```bash
node scripts/generate_interactive_bank.mjs          # write the seed
node scripts/generate_interactive_bank.mjs --check  # CI gate: drift and validation
```

It produces 380 tasks: 100 `INTERACTIVE_READING`, 100 `C_TEST`, 60
`INTERACTIVE_LISTENING`, 60 `READ_THEN_SPEAK`, 60 `INTERACTIVE_SPEAKING`, all
derived from original passages and dialogues. The validator rejects duplicate
options, an answer missing from the option list, a highlight that is not an
exact substring, a C-Test prefix/suffix mismatch, or a dialogue turn without
audio text. The same command runs in CI.

Mock variety is enforced by `exclude-recent-v1`: a stage skips every question
that the student saw in the last eight sessions when the fresh pool is large
enough. `TestStageSelectionExcludesRecentlyExposed` covers the policy.

## Readiness, score range and next action

`GET /api/v1/user/plan` now also returns:

- `estimatedRange`: `low`, `high`, `confidence` (`low|medium|high`) and a
  human-readable `basis`. One completed mock produces a wide ±10 band with low
  confidence; consistent attempts narrow it, volatile ones widen it. Without a
  completed mock the field is absent rather than invented.
- `nextBestAction`: one concrete task with `href`, `type` and `minutes` (always
  10). Unmastered Error Notebook entries choose the type; without errors the
  weakest measured skill does. The dashboard button opens
  `/practice?drill=<slug>` and the practice hub starts that drill directly.

## Speaking delivery metrics

For every speaking answer with an audio file the evaluation queue runs
`ai.AnalyzeSpeech` (ffmpeg) and stores:

- `speechRate` — words per minute;
- `pauseRatio`, `pauseCount`, `pauses[]` — silences ≥0.3 s below −35 dB;
- `fillerCount` — um / uh / erm / hmm / "you know" / "i mean";
- `pronunciationStability` — **delivery stability** measured as the consistency
  of voiced RMS energy. This is not phoneme-level pronunciation scoring; that
  would require a reference pronunciation model. The UI labels it
  «Стабильность подачи» so the number is not over-claimed.

The result card renders a speech/pause timeline and the four metrics; the
speaking studio offers a model recording of the prompt («Эталон»).

## Deploy, alerts and backups

Production deploys from a tag, with a health gate:

- `.github/workflows/deploy.yml` — on `v*`: SSH deploy, rebuild backend and
  frontend, then poll `https://det-academy.ru/api/v1/ready` for up to 150 s.
  Requires `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.
- `.github/workflows/uptime.yml` — every 15 minutes; a failure sends a Telegram
  message when `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are configured.
- `.github/workflows/backup.yml` — nightly at 02:00 UTC: SSH to the host, run
  `scripts/backup_postgres.sh`, upload to `BACKUP_S3_URI` (Yandex Object
  Storage). The server `.env` needs `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` and `BACKUP_S3_URI`.

Dry-run the backup without network access:

```bash
DATABASE_URL=... BACKUP_S3_URI=s3://bucket/prefix DRY_RUN=true \
  bash scripts/backup_postgres.sh
```

## OAuth providers

The backend already implements state, PKCE, redirect validation and
provider-specific token exchange; contract tests cover the flow. Real sign-in
stays disabled until the provider applications exist and their client IDs and
secrets are set in `.env` (`GOOGLE_CLIENT_ID/SECRET`, `VK_CLIENT_ID/SECRET`,
`YANDEX_CLIENT_ID/SECRET`) and the redirect URI is registered with each
provider.

## Onboarding, intro lesson and the dictionary

- `/welcome` is a three-step onboarding: what the exam measures, the goal form,
  and a 12-item Read & Select level check (about two minutes). The estimate is
  stored in `localStorage` (`det_onboarding_placement`) and shown by
  `PlacementCard` while the server diagnostic is still missing. It is labelled
  as a vocabulary estimate, never as an official DET score.
- The dashboard shows a one-time `OnboardingPrompt` until the wizard is
  completed or postponed (`det_onboarding_done_v1`). This is how existing
  accounts get the same explanation as new ones.
- The course starts with `/theory/start-here`, a non-graded lesson that explains
  the exam, the typing requirement and maps each exam problem to a concrete
  trainer. It counts as lesson 0 of 17; `TOTAL_LESSONS`, the backend readiness
  denominator and the dashboard progress all use 17.
- `/vocabulary` is a dictionary, not a word cloud: alphabetical cards with IPA,
  part of speech, CEFR level, Russian meaning, English definition, example,
  collocations and pronunciation. Filters: level and source (AWL, course
  vocabulary, B1 core). Data comes from `backend/db/04-vocabulary-seed.sql` and
  the generated `backend/db/10-dictionary.sql` (1,432 entries).
- The dictionary generator is deterministic after the one-time fetch:

```bash
node scripts/generate_dictionary.mjs --fetch   # model call, writes JSON
node scripts/generate_dictionary.mjs           # JSON -> SQL
node scripts/generate_dictionary.mjs --check   # CI
```

  The fetched JSON (`scripts/content/dictionary.generated.json`) is committed,
  so CI never calls the model. `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` and
  `AI_FOLDER_ID` are required only for `--fetch`.

## Product analytics

- Yandex Metrika counter **113844701** is installed in the root layout and
  documented in `docs/metrika.md`. By default it loads only after the visitor
  accepts cookies (`det_cookie_consent === 'true'`); "Только необходимое"
  leaves `mc.yandex.ru` untouched. `NEXT_PUBLIC_YM_CONSENT_MODE=always` is the
  explicit legal escape hatch.
- The admin analytics dashboard reads only server-side aggregates (users,
  activity, mocks, evaluations, TTS) through `/api/v1/admin/analytics`; no PII
  is returned. Metrika remains the source for page views and acquisition.
- Verification: `npm run test:seo`, `playwright.mjs` Metrika config, and a
  `mc.yandex.ru` network check after accepting the banner.

## Admin analytics

The `/admin` area has an **Analytics** tab backed by `/api/v1/admin/analytics`
(admin role only):

- `overview?range=24h|7d|30d|90d` — users, new users, DAU/WAU/MAU, sessions,
  completed mocks, evaluations, speaking/writing, TTS, XP, pipeline errors;
- `timeseries?metric=...&bucket=hour|day` — continuous buckets (hour is disabled
  for 30d/90d);
- `features` — top actions from `learning_events`, `practice_attempts` and
  `evaluations`;
- `retention` — D1/D7/D30 cohorts; `null` means the cohort is too young.

Queries are parameterised, ranges capped at 90 days, and the response contains
aggregates only. The cache is per-process for 45 seconds; multiple replicas do
not share it. There is no page-view table, so page views and acquisition come
from Yandex Metrika, while the admin tab covers product activity. TTS is counted
only for new syntheses after `OnSynthesis` was introduced; historical calls are
not backfilled.
