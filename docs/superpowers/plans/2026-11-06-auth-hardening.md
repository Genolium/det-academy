# Auth hardening implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Remove the persistent access token from browser storage, protect cookie-authenticated mutations with CSRF, require authentication before OAuth linking, and separate `superadmin` from `admin`.

**Architecture:** The backend already sets HttpOnly `det_token` and `det_refresh` cookies. Add a readable `det_csrf` double-submit cookie and validate `X-CSRF-Token` on unsafe cookie-authenticated requests. The Next client stops writing the access token to localStorage, stores only a non-secret user id/session marker, and relies on cookies. OAuth link transactions require an authenticated starter and a matching user at consume time. A `superadmin` role owns role escalation/deletion of superadmins; `admin` keeps operational access.

**Tech Stack:** Go 1.26, chi, PostgreSQL, Next.js 16, Zustand, Playwright, Go `httptest`.

**Spec:** this request plus `docs/roadmap-2026-11-01.md` Phase 1 security items.

## Global Constraints

- Existing Bearer-token API clients must keep working.
- E2E mocks use a test-only `NEXT_PUBLIC_ALLOW_LEGACY_BEARER=true` escape hatch; production builds must not set it.
- Do not put secrets in localStorage.
- Existing `SameSite=Lax`, `Secure` (production) cookie settings stay.
- Every behavior change gets a failing test first.

## Review Focus

- A browser with only `det_token` and no CSRF header must not mutate data.
- A browser with a stale `det_csrf` cookie must get a clear 403 and recover by logging in again.
- Login/register/refresh must not be blocked by a missing CSRF cookie.
- OAuth link must fail closed when the starter or consumer is anonymous.
- `admin` must not promote itself or anyone to `superadmin`; `superadmin` must not be removable by `admin`.

---

### Task 1: CSRF middleware and cookie

**Files:** create `backend/internal/handlers/csrf.go`, `backend/internal/handlers/csrf_test.go`; modify `auth_handler.go`, `cmd/server/main.go`, `backend/tests/api_test.go`.

- [ ] Write middleware tests: unsafe cookie request without CSRF header → 403; matching header → next handler; Bearer request → next; safe GET → next; login path exempt.
- [ ] Run tests; expect failure because middleware is absent.
- [ ] Implement `CSRFMiddleware` with double-submit check and `setAuthCookies` setting/clearing `det_csrf`.
- [ ] Wire middleware into `/api/v1` in production and test routers.
- [ ] Run Go tests.

### Task 2: Cookie-only client

**Files:** `src/lib/auth-session.ts`, `src/lib/api.ts`, `src/store/useAuthStore.ts`, `playwright.config.ts`, `e2e/auth-session.spec.ts`.

- [ ] Write a test/assertion that login stores no `det_auth_token`, but stores a non-secret user marker and sends `X-CSRF-Token`.
- [ ] Run; expect failure.
- [ ] Add `getCsrfToken`, `setAuthUser`, `clearAuthSession`; make `getAuthToken` return null in production and keep legacy only behind the test env flag.
- [ ] Replace `setAuthToken` calls with `setAuthUser`; add CSRF header; update `checkAuth`/logout.
- [ ] Set `NEXT_PUBLIC_ALLOW_LEGACY_BEARER=true` in the e2e web server env only.
- [ ] Run typecheck, build, auth E2E.

### Task 3: OAuth link fail-closed

**Files:** `backend/internal/service/oauth_transaction.go`, `backend/internal/service/auth_service.go`, tests.

- [ ] Write tests: anonymous `action=link` start → error; link transaction with empty `UserID` cannot be consumed; transaction owned by another user is rejected.
- [ ] Run; expect failure.
- [ ] Require authenticated `userID` for link start and exact `consumed.UserID == userID` on consume.
- [ ] Run tests.

### Task 4: Superadmin separation

**Files:** `backend/internal/service/auth_service.go`, `backend/internal/handlers/admin_handler.go`, `backend/db/migrations/037_superadmin.sql`, admin frontend guards, tests.

- [ ] Write tests: admin cannot grant `superadmin`; admin cannot delete/demote a `superadmin`; superadmin can; last-admin protection counts both roles.
- [ ] Run; expect failure.
- [ ] Add role checks, migration promoting the oldest admin when no superadmin exists, and frontend guard acceptance.
- [ ] Run Go + frontend tests.

### Task 5: CSP nonce for authenticated app routes

Completed after adding `force-dynamic` layouts for `/dashboard`, `/profile`,
`/admin` and `/test`. Next.js now attaches the per-request nonce to every app
chunk and inline bootstrap script.

- [x] Generate a nonce in `src/proxy.ts` and set a strict `script-src` policy.
- [x] Force dynamic rendering for the covered route segments.
- [x] Keep `style-src 'unsafe-inline'` for Next/Tailwind inline styles (script
      inline is no longer allowed).
- [x] Verify the production build: all 17 scripts on `/test` carry the nonce,
      `window.__next_f` exists, and the browser console has no CSP violations.
- [x] Add `e2e/csp-nonce.spec.ts` to the CI suite.
