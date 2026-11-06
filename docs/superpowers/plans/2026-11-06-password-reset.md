# Password reset implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use `- [x]` checkboxes.

**Goal:** Let a user recover access when they forget the password without exposing account existence, leaking the reset token, or keeping old sessions alive.

**Architecture:** `POST /api/v1/auth/forgot-password` creates a single-use reset token for an existing account and emails a link whose token sits in the URL fragment, so access logs never receive it. The database stores only the SHA-256 hash, older unused links are invalidated, and the raw token exists only in the email. `POST /api/v1/auth/reset-password` consumes the token, validates the new password, bumps `token_version`, revokes all refresh tokens, and clears the browser cookies. Unknown addresses get the same `200 {"status":"sent"}` response.

**Tech Stack:** Go 1.26, chi, PostgreSQL, memory repository, Next.js 16, Playwright.

**Spec:** this request plus `docs/roadmap-2026-11-01.md` P1 recovery gap.

## Global Constraints

- Reset links are single-use and expire after 30 minutes.
- Only a SHA-256 hash is persisted; the raw token is never logged or returned by an HTTP handler.
- Responses must not reveal whether an email is registered.
- A successful reset invalidates all old sessions for the account.
- Password rules stay identical to registration: at least 8 characters, one letter, one digit.
- No billing, paywalls, or official-score claims are involved.

## Review Focus

- Unknown email and known email produce the same public response.
- A second use of the same link fails.
- Requesting a new link invalidates the previous unused link.
- An expired link fails.
- A weak password does not consume the token.
- Old password stops working; new password works.
- Refresh tokens issued before reset stop working.

---

### Task 1: Persistence

**Files:** `backend/db/migrations/038_password_reset.sql`, `backend/internal/models/models.go`, `backend/internal/repository/repository.go`, `backend/internal/repository/memory/memory.go`, `backend/internal/repository/postgres/postgres.go`.

- [x] Add the `password_reset_tokens` table with a hashed primary key, user FK, expiry and `used_at`.
- [x] Add repository methods to create (and rotate) and atomically consume a token.
- [x] Add a Postgres integration test for single-use, rotation and expiry.

### Task 2: Email delivery

**Files:** `backend/internal/email/sender.go`, `smtp.go`, `postbox.go`, `auth_service_test.go`, `digest_test.go`.

- [x] Extend `email.Sender` with `SendPasswordReset`.
- [x] Implement the message for Log, Resend, SMTP and Postbox senders.
- [x] Deliver asynchronously with the existing bounded mail slots and timeout.
- [x] Update every test fake so the backend compiles.

### Task 3: Service flow

**Files:** `backend/internal/service/auth_service.go`, `backend/internal/service/password_reset_test.go`.

- [x] Request a token, store its hash, invalidate older links, and return the link only to the caller for tests.
- [x] Reset the password, bump `token_version`, and revoke refresh tokens.
- [x] Test unknown email, delivery, single-use, expiry, rotation and old-password failure.

### Task 4: HTTP API and UI

**Files:** `backend/internal/handlers/auth_handler.go`, `backend/cmd/server/main.go`, `backend/tests/api_test.go`, `backend/tests/password_reset_test.go`, `backend/internal/handlers/csrf.go`, `src/lib/api.ts`, `src/app/auth/forgot-password/page.tsx`, `src/app/auth/reset-password/page.tsx`, `src/components/auth/AuthModal.tsx`, `src/lib/translations.ts`.

- [x] Add `POST /auth/forgot-password` and `POST /auth/reset-password` with auth-scope limits.
- [x] Exempt both public endpoints from CSRF; keep mutations protected everywhere else.
- [x] Clear auth cookies after a successful reset.
- [x] Add the client API methods, recovery pages and the “Забыли пароль?” entry point.
- [x] Add Playwright tests for the UI and fullstack tests for the real backend.

## Verification evidence

- Go `go vet ./...` + `go test -race ./...` with `TEST_DATABASE_URL` — green.
- Playwright full suite — `213 passed / 2 skipped`.
- Fullstack real backend + PostgreSQL — `7 passed`.
- `npx tsc --noEmit` — clean.
- `npm run build` — success.
- `npm run lint` — 0 errors (pre-existing warnings only).
