# Security audit — DET Academy — 2026-10-28

Status: internal review, no production testing, no destructive actions.
Owner of this document: backend/security agent.

## 1. Scope

Reviewed:

- Go backend (`backend/cmd`, `backend/internal`, migrations in `backend/db`).
- PostgreSQL schema and migration runner (`backend/db/init.sql`,
  `backend/db/migrations/`, `backend/internal/repository/postgres/migrate.go`).
- nginx reverse proxy (`nginx/`).
- Docker Compose and container build files (`docker-compose.yml`,
  `backend/Dockerfile`, root `Dockerfile`).
- GitHub Actions (`.github/workflows/`).
- Operational docs (`docs/RUNBOOK.md`) and the new client contract.

Not reviewed / out of scope:

- Next.js application code in `src/` — owned by the frontend agent. The only
  interface contract added here is the `X-Device-Id` header (section 6).
- The live production host, its TLS configuration, DNS, cloud console, S3
  bucket policy, Directus data and provider dashboards.
- Active exploitation, fuzzing, load testing and browser E2E.

Method: manual code review and threat modelling, targeted grep for dangerous
patterns (`fmt.Sprintf` in SQL, `os/exec`, outbound HTTP, `filepath.Join` with
input, logging of credentials), then automated checks listed in section 7.

Severity scale: **Critical** — direct auth bypass/RCE; **High** — data
disclosure or account takeover with limited preconditions; **Medium** — a
meaningful control is missing or bypassable; **Low** — defense-in-depth or
operational hygiene; **Info** — observation, no immediate action required.

## 2. Findings

| ID | Severity | Area | Evidence | Impact | Status |
|---|---|---|---|---|---|
| F-01 | Medium | Speaking quota bypass | Before this change the user allowance was checked only in `CreatePracticeAssignment` (`backend/internal/service/study_service.go:1461-1469`); `RecordPracticeAttempt` inserted the attempt directly (`study_service.go:1514` and following) | A client could submit speaking answers without requesting an assignment and bypass `DAILY_SPEAKING_LIMIT`, spending AI/STT budget | **Fixed** — the check now runs on submission after the server resolves the real question type (`study_service.go:1559-1566`) |
| F-02 | Medium | Rate limiting | `backend/internal/handlers/security.go:25-50` (in-memory map, never pruned), `security.go:57-64` | Per-process and per-restart only; several replicas each have their own limit; the map grows with every new IP | **Fixed 2026-10-28** — PostgreSQL-backed `rate_limit_counters` + `ConsumeWindow` shared by replicas, with local fallback and expired-bucket pruning. nginx `limit_req` remains as the edge layer |
| F-03 | Medium | WebSocket DoS | `backend/internal/handlers/arena_hub.go:20-22`, `523-572`; no `SetReadLimit`/deadlines | An authenticated client can send an arbitrarily large frame and exhaust memory; idle connections are never timed out | **Fixed 2026-10-28** — `SetReadLimit(16 KiB)`, pong read deadline, write deadline and a 30 s ping loop; oversized or idle clients are closed |
| F-04 | Medium | PII/secrets in logs | `backend/internal/email/sender.go:39` and `:44` log the full HTML and the verification link (with token); `backend/internal/service/auth_service.go:1360` logs the recipient address | If SMTP is not configured or delivery fails, verification tokens and email addresses land in container logs | **Fixed 2026-10-28** — `LogSender` logs only the subject and body size; verification links and recipient addresses are never written. Provider token-exchange bodies are no longer logged |
| F-05 | Medium | CSP / XSS containment | `nginx/det-academy.ru.conf:53`: `script-src 'self' 'unsafe-inline' 'unsafe-eval'` and `connect-src 'self' https:`; Directus: `docker-compose.yml:168-169` (`unsafe-eval`, `connect-src ... *`) | CSP does not meaningfully contain an XSS: inline script and any HTTPS exfiltration endpoint are allowed; Directus is even wider | **Partially fixed 2026-10-28** — `unsafe-eval` removed, `connect-src` narrowed to the APIs the browser uses, `frame-ancestors 'self'` present. `unsafe-inline` remains for the Next.js bootstrap; Directus keeps its own wider policy on a loopback-only port |
| F-06 | Low | CORS trust | `backend/cmd/server/main.go:33-56` (hard-coded `http://det-academy.ru`, `localhost`, `127.0.0.1` with `AllowCredentials: true` at `:259`) | A page served from an HTTP origin or from localhost can make credentialed requests; an active network attacker on HTTP could exploit this | **Fixed 2026-10-28** — production `corsOrigins` filters out every non-HTTPS origin, including localhost |
| F-07 | Low | Account enumeration | `backend/internal/service/auth_service.go:179` returns “user with this email already exists”; `backend/internal/handlers/auth_handler.go:68` returns `err.Error()` | An attacker can test which emails are registered | Open — return a generic response and send an email instead; do not expose repository errors |
| F-08 | Low | Login timing | `backend/internal/service/auth_service.go:228-235` returns immediately for an unknown email and runs bcrypt only for a known one | Timing distinguishes registered emails | Open — always compare against a dummy bcrypt hash |
| F-09 | Low | JWT validation | `backend/internal/service/auth_service.go:1415-1421` accepts any HMAC algorithm and does not pin `iss`/`aud`; tokens are still signed with the server secret | Not exploitable without `JWT_SECRET`, but a stricter parser reduces the attack surface if the secret leaks or a gateway signs other tokens | Open — add `jwt.WithValidMethods([]string{"HS256"})` and `jwt.WithIssuer("det-academy")` |
| F-10 | Low | Token exposure | `backend/internal/handlers/auth_handler.go:65-68`, `:93-96` return the access token in the JSON body in addition to the HttpOnly cookie | If `src/` stores that token in `localStorage`, XSS becomes token theft instead of a cookie-only issue | Open (frontend) — the client should ignore the body token and rely on the cookie |
| F-11 | Low | Brute force | `backend/internal/handlers/security.go:57-64`, `main.go:284-301`; nginx `10r/m` at `nginx/det-academy.ru.conf:82-91` | No per-account lockout/captcha; a distributed attack can still try passwords. The new `DAILY_AUTH_LIMIT_PER_IP/DEVICE` raises the cost | Partially mitigated — add per-account throttling or MFA for admins |
| F-12 | Low | Metrics exposure | `backend/internal/handlers/security.go:229-263`; `main.go:280` | Without `METRICS_TOKEN` anyone can read request/error counts and evaluation queue age | Open — set `METRICS_TOKEN` in production (the runbook documents it) |
| F-13 | Low | Privacy in leaderboard | `backend/internal/handlers/arena_hub.go:456-521`; public route `main.go:377` | Public endpoint returns display names and internal user UUIDs | Open — omit `userId` from the public board or expose a public alias |
| F-14 | Low | Admin safety | `backend/internal/handlers/admin_handler.go:63-100`; `backend/internal/service/auth_service.go:1516-1525` | An admin can demote/delete themselves or the last remaining admin, locking administration out | Open — reject self-deletion and last-admin changes |
| F-15 | Low | Missing ownership on practice assignments | `backend/internal/repository/postgres/postgres.go:1806-1818`; used in `backend/internal/handlers/study_handler.go:406-413` | A known assignment ID can be used to resolve `question_id`/`question_type` server-side for another user. The assignment payload and answer key are not returned, and IDs are random (UUID prefix), so the impact is limited to using a question ID that was not issued to the caller | Open — add `user_id` to the assignment row and check it before resolving |
| F-16 | Low | Upload validation | `backend/internal/handlers/media_handler.go:78-94` trusts the client `Content-Type` when choosing the extension; no magic-byte check | An arbitrary file can be stored as `.webm`; it is served with explicit audio MIME and `nosniff`, outside the web root, so this is disk abuse rather than code execution | Open — verify the container magic bytes for the accepted audio formats |
| F-17 | Low | Token in URL/logs | `backend/internal/service/auth_service.go:1334` builds `/auth/verify-email?token=...`; nginx `location /` logs the request line | Access/error logs, browser history and Referer can retain a single-use, 24-hour verification token | **Fixed 2026-10-28** — nginx disables `access_log` for `/auth/` and `/api/v1/auth/`; the backend logs no verification links. The URL still contains the token by design, but it is no longer persisted in server logs |
| F-18 | Low | nginx fingerprinting | `nginx/det-academy.ru.conf` — no `server_tokens off`, no OCSP stapling | Version disclosure and slightly weaker revocation checking | Open |
| F-19 | Low | Backup handling | `scripts/backup_postgres.sh` has no `umask`/`chmod`; local dumps are written with the process umask; default `BACKUP_DIR=./backups` is not in `.gitignore` | A local copy of the database may be world-readable and could be committed accidentally | Open — out of the editable scope of this task; use `umask 077`, store outside the repo, encrypt at rest |
| F-20 | Low | Nightly backup would fail | `.github/workflows/backup.yml` used `ssh ... \\` inside a block scalar (two backslashes), so the remote command was not executed | The nightly backup job would fail instead of producing a dump | **Fixed** — corrected to a single continuation and explicit `BACKUP_DIR=/var/backups/det` |
| F-21 | Low | Slowloris | `backend/cmd/server/main.go:418-422` had no `ReadHeaderTimeout` | Slow header writes could hold connections | **Fixed** — `ReadHeaderTimeout: 10s` |
| F-22 | Low | Auth body size | `backend/internal/handlers/auth_handler.go:56-85` decoded the body without a per-route limit (only the global 30 MB cap) | A burst of large JSON bodies to `/auth/login` and `/auth/register` wastes memory | **Fixed** — 32 KB `MaxBytesReader` |
| F-23 | Low | CORS header | `backend/cmd/server/main.go:257` did not allow `X-Device-Id` | A browser preflight would block the new device quota header | **Fixed** |
| F-24 | Info | Demo credentials | `backend/internal/repository/memory/memory.go:156-180` seeds `admin@det-academy.com/admin123` and demo users | Weak known credentials exist in the in-memory store | Only reachable with `ALLOW_MEMORY_STORAGE=true`; production refuses the memory fallback (`main.go:102-112`). Never enable in production |
| F-25 | Info | Container hardening | `docker-compose.yml` (no `read_only`, `security_opt`, resource limits, log rotation; images are tags, not digests) | Larger blast radius after a compromise; noisy-neighbour risk | Open — pin digests, set `no-new-privileges`, memory/CPU limits and log rotation |
| F-26 | Info | CI host key | All workflows use `ssh-keyscan -H "$DEPLOY_HOST"` | Trust-on-first-use is vulnerable to a runner-side MITM | Open — pin the host key in a secret |
| F-27 | Info | Sentry query string | `backend/internal/observability/sentry.go:31` calls `SetRequest(r)`; the SDK includes `QueryString` (cookies/headers are excluded while `SendDefaultPII` is false) | Queries such as TTS text or search terms can appear in Sentry | Low; avoid putting secrets in query strings (already true for auth) |
| F-28 | Info | OAuth PKCE coverage | `backend/internal/service/oauth_transaction.go:132-201`: Google/VK use S256 PKCE; Yandex does not send `code_challenge`; Apple uses a nonce | Weaker protection for Yandex if the authorization code leaks | Low; provider-specific. State is still one-time and bound to the provider |
| F-29 | Info | Proxy trust | `backend/internal/handlers/tts_handler.go:218-231` uses the last `X-Forwarded-For` hop; `backend/cmd/server/main.go:240-244` installs `chi.RealIP`; all container ports are bound to `127.0.0.1` in `docker-compose.yml` | The quotas are only as trustworthy as the edge: a direct connection to the backend would let a client choose its own address. Current Compose topology keeps the backend loopback-only | Keep the backend unreachable except through nginx; if a CDN is added, configure a trusted-proxy count instead of taking the last hop |

## 3. Checks that passed (with evidence)

| Control | Result | Evidence |
|---|---|---|
| SQL injection | Pass | All user values are sent as `$n` parameters. Dynamic SQL only adds fixed fragments such as `role = $%d`, `question_type = ANY($3)`; no user string is concatenated (`backend/internal/repository/postgres/postgres.go:280-310`, `:1833-1842`, `:2050-2070`) |
| Password storage | Pass | bcrypt with `bcrypt.DefaultCost` on register, password change and bootstrap (`auth_service.go:182`, `:1115`, `:1541`); policy requires ≥8 chars with a letter and a digit (`:136-153`); bootstrap admin requires ≥12 (`:1534`) |
| JWT signature/expiry/revocation | Pass | HS256, 24 h expiry, HMAC method check, `token_version` compared against the database on every request (`auth_service.go:1392-1439`) |
| Refresh rotation | Pass | Random 32-byte token, only its hash stored, 30-day expiry, revoked on use; reuse revokes the family and increments `token_version` (`auth_service.go:1452-1506`) |
| Cookie flags | Pass | `HttpOnly`, `SameSite=Lax`, `Secure` when `ENV=production` (`auth_handler.go:33-52`, `:185-203`) |
| OAuth state / one-time / redirect | Pass | Random state, stored as SHA-256, consumed atomically with provider binding and 10-minute expiry (`oauth_transaction.go:75-130`, `:203-211`; `postgres.go:2111-2128`); redirect host is allowlisted and HTTP is limited to localhost (`oauth_transaction.go:48-70`) |
| RBAC | Pass | `/admin` group uses `AdminMiddleware`, which checks `role` from a validated token (`main.go:384-402`; `middleware.go:50-75`); every session/media/user route requires `AuthMiddleware` |
| IDOR on sessions/media/coach/certificates | Pass | Ownership checks before reading or mutating (`cat_service.go:417-426`, `:985-1008`, `:1192-1201`; `certificate_service.go:43-51`; `media_handler.go:49-52`, `:156-160`, `:210-214`) |
| Path traversal | Pass | Client filenames are never used for the filesystem path; UUID is generated server-side, `filepath.Base` is applied, and delete checks the upload-root prefix (`media_handler.go:91-95`, `:175`, `:241`; `blob/store.go:47`) |
| SSRF | Pass | No user-supplied URL is fetched. OAuth/AI endpoints are constants or environment settings (`oauth_transaction.go:213-308`; `ai/tts.go:41-42`); redirect validation is host-based |
| CSRF / origin | Pass (with residual) | State-changing requests with a non-trusted `Origin` are rejected (`security.go:149-176`); cookies are `SameSite=Lax`. Requests without `Origin` are allowed for CLI/server-to-server, and they still need a token |
| WebSocket auth | Pass | Upgrade requires a valid session (`arena_hub.go:523-529`) and a browser Origin from `ALLOWED_ORIGIN`/localhost (`arena_hub.go:24-47`) |
| Secrets in git | Pass | `gitleaks detect --source . --redact` scanned 120 commits: “no leaks found”. Only `.env.example` is tracked; `.env` is gitignored; production `JWT_SECRET`/`DATABASE_URL` are mandatory (`config.go:34-47`) |
| Dependency vulnerabilities | Pass | `govulncheck ./...`: “No vulnerabilities found. Your code is affected by 0 vulnerabilities.” `npm audit --omit=dev --audit-level=high`: “found 0 vulnerabilities” |
| Docker exposure | Pass | All host ports are bound to `127.0.0.1` (`docker-compose.yml:11`, `:38`, `:126`, `:152`); backend and frontend run as non-root (`backend/Dockerfile`, root `Dockerfile`); DB credentials are mandatory via `${VAR:?}` |
| TLS | Pass | TLS 1.2/1.3, HSTS with preload, session tickets off (`nginx/det-academy.ru.conf:40-49`, `:52`) |
| Security headers | Pass (CSP weak) | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (`nginx/det-academy.ru.conf:46-54`); CSP limitation is F-05 |
| Logging of request lines | Pass (mostly) | `MetricsMiddleware` logs method/path/status without query or body (`security.go:207-220`); `/api/v1/tts` disables access logging (`nginx/det-academy.ru.conf:71-73`). Exceptions: F-04, F-17, F-27 |
| Backup/restore exposure | Partial | Deploy backup uses `/var/backups/det` (`scripts/deploy_production.sh:75-81`); nightly workflow now uses the same path. Dumps are unencrypted and `restore_postgres.sh` was not exercised (F-19) |

## 4. Fixed in this change

1. **User speaking quota bypass (F-01).** `RecordPracticeAttempt` now enforces
   `DAILY_SPEAKING_LIMIT` on submission, using the type stored on the server
   (`backend/internal/service/study_service.go:1559-1566`).
2. **IP + device daily quotas.** New `LimitGuard`
   (`backend/internal/service/limits.go:196-253`) backed by
   `daily_limit_counters` (migration
   `backend/db/migrations/027_daily_limit_counters.sql`) and the memory
   implementation for tests. Applied to:
   - `POST /api/v1/test/sessions` for full mocks
     (`backend/internal/handlers/test_handler.go:40-43`);
   - practice speaking submissions
     (`backend/internal/handlers/study_handler.go:421-424`);
   - speaking audio uploads
     (`backend/internal/handlers/media_handler.go:60-64`);
   - login/register (`backend/internal/handlers/auth_handler.go:57`, `:81`).
3. **`X-Device-Id` contract.** Validated (≤128 chars,
   `[A-Za-z0-9._:-]`), keyed-hashed with `JWT_SECRET`
   (`service.HashDeviceID`), stored in request context only. Raw values are
   never logged or persisted. Invalid values are ignored and the IP quota
   still applies. Added to CORS allowed headers.
4. **Auth body limit** (`32 KB`) and **`ReadHeaderTimeout`** (F-21, F-22).
5. **Nightly backup workflow** line continuation and backup directory
   (F-20).
6. **Migration/schema.** `daily_limit_counters` is in both
   `backend/db/init.sql` and migration `027`; counters are pruned
   opportunistically (older than 7 days, at most once per 6 hours).
7. **Tests** for the new controls: `backend/internal/service/limits_guard_test.go`,
   `backend/tests/device_limits_test.go`,
   `backend/tests/daily_limit_postgres_test.go`.

## 5. Open risks (priority order)

1. F-02/F-03: distributed rate limiting and WebSocket resource limits.
2. F-05/F-06: CSP still allows inline/eval and any HTTPS connection; CORS
   still trusts HTTP/localhost origins in production.
3. F-04/F-17: verification tokens and email addresses in logs / URLs.
4. F-07/F-08/F-11: account enumeration, login timing, no per-account lockout.
5. F-19: backup encryption and file permissions.
6. F-25/F-26: container hardening and SSH host-key pinning.

## 6. Client contract for the frontend agent

The browser must generate a random UUID once, persist it in `localStorage`
(suggested key `det_device_id_v1`) and send it on API requests as
`X-Device-Id`. It must be sent on `POST /api/v1/auth/login`,
`POST /api/v1/auth/register`, `POST /api/v1/test/sessions`,
`POST /api/v1/user/practice/attempts` and
`POST /api/v1/test/sessions/{id}/audio`.

- Accepted format: `[A-Za-z0-9._:-]{1,128}`.
- Missing or invalid values are ignored; the IP quota still applies.
- Rotating the value does not bypass the IP quota.
- On `429` the response contains `code: "daily_limit_reached"`, `scope`,
  `limit` (`ip`/`device`), `limitValue`, `retryAfterSec` and a `Retry-After`
  header. The UI should show the server message and the reset time.
- Do not edit `src/` from this task; this section is the handoff.

## 7. Commands run (evidence)

```text
cd backend && go build ./...                       # exit 0
cd backend && gofmt -l ./cmd ./internal ./tests    # no output
cd backend && go vet ./...                         # exit 0
cd backend && go test ./... -count=1
?    det-academy-backend/cmd/server        [no test files]
ok   det-academy-backend/internal/ai
ok   det-academy-backend/internal/email
ok   det-academy-backend/internal/handlers
ok   det-academy-backend/internal/observability
ok   det-academy-backend/internal/service
ok   det-academy-backend/internal/storage/blob
ok   det-academy-backend/tests

cd backend && go test ./internal/service -run 'TestLimitGuard|TestDeviceID|TestIsSpeaking' -count=1
PASS

cd backend && go test ./tests -run 'TestDeviceLimit|TestAuthDailyLimit|TestSpeakingPracticeDailyLimitIsEnforced|TestSpeakingAudioUpload|TestDeviceIDHeader' -count=1
PASS

TEST_DATABASE_URL='postgres://postgres:postgres@127.0.0.1:15999/det_academy_test?sslmode=disable' \
  go test ./tests -run 'TestPostgresDailyLimitCounterPersists|TestRunMigrations|TestMigrationsConverge' -count=1
PASS

cd backend && govulncheck ./...
No vulnerabilities found.
Your code is affected by 0 vulnerabilities.
This scan also found 0 vulnerabilities in packages you import and 21
vulnerabilities in modules you require, but your code doesn't appear to call
these vulnerabilities.

npm audit --omit=dev --audit-level=high
found 0 vulnerabilities

gitleaks detect --source . --redact
120 commits scanned ... no leaks found

actionlint .github/workflows/*.yml
exit 0

docker compose config -q
exit 0

cd backend && go test -race ./... -count=1
ok  det-academy-backend/internal/ai
ok  det-academy-backend/internal/email
ok  det-academy-backend/internal/handlers
ok  det-academy-backend/internal/observability
ok  det-academy-backend/internal/service
ok  det-academy-backend/internal/storage/blob
ok  det-academy-backend/tests
```

Not run: nginx container validation (`scripts/validate_nginx_config.sh` needs a
Docker daemon), live TLS scan, E2E and `npm run build` (frontend owned by
another agent). Local PostgreSQL was 14.24 (Homebrew); production compose uses
PostgreSQL 16, and CI applies the same migrations on 16.

## 8. New configuration (see `.env.example` and `docs/RUNBOOK.md`)

| Variable | Default |
|---|---:|
| `DAILY_MOCK_LIMIT` | 3 |
| `DAILY_SPEAKING_LIMIT` | 20 |
| `DAILY_MOCK_LIMIT_PER_IP` | 10 |
| `DAILY_MOCK_LIMIT_PER_DEVICE` | 5 |
| `DAILY_SPEAKING_LIMIT_PER_IP` | 60 |
| `DAILY_SPEAKING_LIMIT_PER_DEVICE` | 40 |
| `DAILY_AUTH_LIMIT_PER_IP` | 20 |
| `DAILY_AUTH_LIMIT_PER_DEVICE` | 10 |

`0` disables one dimension. The window is the UTC day. The user quota remains
table-derived; IP and device quotas are stored in `daily_limit_counters` and
survive a restart. With `ALLOW_MEMORY_STORAGE=true` (development only) the
counters live in process memory and reset on restart; production refuses that
fallback.
