# Dashboard aggregate endpoint implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Load the authenticated dashboard with one request instead of a waterfall of streak, theory, sessions, plan, typing and error-notebook calls.

**Architecture:** Add `GET /api/v1/user/dashboard` behind auth. It returns only the fields the dashboard needs: streak, theory progress, completed sessions, study plan, goals flag and best typing WPM. The client uses it first and keeps the existing endpoints as a fallback for old backends/offline.

**Tech Stack:** Go 1.26, chi, PostgreSQL, Next.js 16, Zustand, Playwright.

**Spec:** this request plus `docs/roadmap-2026-11-01.md` P1 scale item “dashboard waterfall”.

## Global Constraints

- Keep the existing per-resource endpoints for mutations and fallback.
- Do not change the server-authoritative session core, scoring, certificates or theory catalog.
- The aggregate is authenticated; anonymous visitors keep local-only state.
- Do not return `contentSnapshot` or other heavy session internals.
- Dashboard still renders when the aggregate returns `404` or the network is offline.

## Review Focus

- A real dashboard load makes exactly one aggregate request when the endpoint exists.
- An old backend without the endpoint falls back to the legacy calls.
- `goalsConfigured=false` renders onboarding, not fabricated target values.
- Only completed scored sessions appear in history.
- The aggregate carries all fields the dashboard already used.
- Mutations after load (`completeDailyTask`, `toggleLessonCompleted`) still refresh correctly.

---

### Task 1: Backend aggregate

**Files:**
- Modify: `backend/internal/models/models.go`
- Modify: `backend/internal/service/study_service.go`
- Modify: `backend/internal/handlers/study_handler.go`
- Modify: `backend/cmd/server/main.go`
- Modify: `backend/tests/api_test.go`
- Test: `backend/tests/dashboard_aggregate_test.go`

**Interfaces:**
- Produces `models.DashboardResponse` with `streak`, `theory`, `sessions`, `studyPlan`, `goalsConfigured`, `bestWpm`.
- Produces `StudyService.GetDashboard(ctx, userID, utcOffsetMinutes) (*models.DashboardResponse, error)`.
- Produces `StudyHandler.GetDashboard`.

- [ ] **Step 1: Write the failing handler test**

Create `backend/tests/dashboard_aggregate_test.go`:
- login as the seed student;
- clear theory and complete one task;
- create one completed full session with scores;
- record a typing attempt if the memory repo supports it;
- call `GET /api/v1/user/dashboard?utc_offset_minutes=0`;
- assert status 200, theory total 13, one completed session, `goalsConfigured=false`, `studyPlan=null`, and no `contentSnapshot` key.

Run: `cd backend && go test ./tests -run TestDashboardAggregate -count=1 -v`
Expected: FAIL (404).

- [ ] **Step 2: Add the response model**

```go
type DashboardResponse struct {
    Streak          UserStreak              `json:"streak"`
    Theory          TheoryProgressResponse  `json:"theory"`
    Sessions        []TestSession           `json:"sessions"`
    StudyPlan       *StudyPlanResponse      `json:"studyPlan,omitempty"`
    GoalsConfigured bool                    `json:"goalsConfigured"`
    BestWpm         int                     `json:"bestWpm"`
}
```

When building `Sessions`, copy each `TestSession`, clear `ContentSnapshot`, and keep only `COMPLETED` sessions with a positive overall score.

- [ ] **Step 3: Implement `GetDashboard`**

In `study_service.go`:
- `GetStreak(ctx, userID, utcOffsetMinutes)`.
- `theoryService.GetProgress`.
- `catService.GetUserSessions`, filter and sanitize.
- `GetStudyPlan`; treat `ErrGoalsNotConfigured` as `goalsConfigured=false`, `studyPlan=nil`.
- `storage.Study().GetBestTypingWPM`.
- Return a 500 only for unexpected repository errors on required fields.

- [ ] **Step 4: Wire handler and route**

Add `GetDashboard` to `StudyHandler`; parse `utc_offset_minutes` with the same rules as `GetStreak`.
Register `r.With(AuthMiddleware).Get("/dashboard", studyHandler.GetDashboard)` in both `main.go` and the test router.

- [ ] **Step 5: Run backend tests**

Run: `cd backend && go test ./tests -run 'TestDashboardAggregate|TestTheory|TestStudy' -count=1 -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/models/models.go backend/internal/service/study_service.go backend/internal/handlers/study_handler.go backend/cmd/server/main.go backend/tests/api_test.go backend/tests/dashboard_aggregate_test.go
git commit -m "feat: add dashboard aggregate endpoint"
```

---

### Task 2: Client aggregate with legacy fallback

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/store/useProgressStore.ts`
- Modify: `src/app/dashboard/page.tsx`
- Test: `e2e/dashboard-aggregate.spec.ts`

- [ ] **Step 1: Write the failing request-count test**

Create `e2e/dashboard-aggregate.spec.ts`:
- seed `det_auth_token=token-user-a`;
- count requests to `/api/v1/user/dashboard`, `/user/streak`, `/theory/progress`, `/test/sessions/me`, `/user/plan`, `/user/typing/history`, `/user/errors`;
- override the aggregate route with a realistic payload;
- goto `/dashboard`;
- assert the dashboard renders, exactly one aggregate call happened, and the five legacy endpoints were not called.

Run: `npx playwright test e2e/dashboard-aggregate.spec.ts --workers=1`
Expected: FAIL because the aggregate method does not exist.

- [ ] **Step 2: Add the API type and method**

In `src/lib/api.ts`:
```ts
export interface DashboardResponse {
  streak: { streakDays: number; lastActiveDate: string };
  theory: TheoryProgressResponse;
  sessions: BackendTestSession[];
  studyPlan: StudyPlanResponse | null;
  goalsConfigured: boolean;
  bestWpm: number;
}

async getDashboard(utcOffsetMinutes = 0): Promise<DashboardResponse>
```
Use `authFetch` and `/api/v1/user/dashboard?utc_offset_minutes=...`.

- [ ] **Step 3: Use aggregate first in `syncWithBackend`**

After local cache and the anonymous guard:
- call `api.getDashboard(offset)`;
- apply streak, theory, sessions, plan, `bestWpm`;
- persist the same localStorage keys as the legacy path;
- set `progressStatus` and return;
- on any error, continue into the existing legacy calls.

Extract the session-to-`TestResult` mapping into a helper so aggregate and legacy paths cannot drift.

- [ ] **Step 4: Remove the dashboard-only error-notebook fetch**

In `src/app/dashboard/page.tsx`, remove `loadErrorsForUser` from the dashboard effect and import. The dashboard does not read the error list; the error bank still loads when its own page/modal opens.

- [ ] **Step 5: Run focused tests**

```bash
npx tsc --noEmit
npx playwright test e2e/dashboard-aggregate.spec.ts e2e/dashboard-subscores.spec.ts e2e/auth-session.spec.ts --workers=1
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts src/store/useProgressStore.ts src/app/dashboard/page.tsx e2e/dashboard-aggregate.spec.ts
git commit -m "perf: load dashboard through one aggregate request"
```

---

### Task 3: Fullstack and verification

**Files:**
- Create: `e2e-fullstack/dashboard-aggregate.spec.ts`
- Modify: `docs/roadmap-2026-11-01.md` if the item closes.

- [ ] **Step 1: Write the fullstack contract test**

Register a user, create goals through `PUT /user/goals`, call `/user/dashboard`, and assert:
- `theory.totalLessons === 13`;
- `goalsConfigured === true`;
- `studyPlan.configured === true`;
- `sessions` is an array;
- no `contentSnapshot` is present.

- [ ] **Step 2: Run the full checks**

```bash
cd backend
go vet ./...
TEST_DATABASE_URL="postgres://localhost:5432/det_backend_test?sslmode=disable" go test -race ./... -count=1

cd ..
npx tsc --noEmit
npm run lint
npm run build
CI=true npx playwright test --workers=1
CI=true FULLSTACK_DATABASE_URL="postgres://localhost:5432/det_fullstack_test?sslmode=disable" FULLSTACK_PREPARE_DB=false bash scripts/run_fullstack_e2e.sh
```

- [ ] **Step 3: Update docs and commit**

Record the request-count result and dashboard payload contract in `docs/roadmap-2026-11-01.md`.

```bash
git add e2e-fullstack/dashboard-aggregate.spec.ts docs/roadmap-2026-11-01.md
git commit -m "docs: record dashboard aggregate verification"
```


## Verification evidence

- Backend `go vet` + `go test -race ./...` with PostgreSQL — green.
- Playwright full suite — `221 passed / 2 skipped`.
- Fullstack real backend + PostgreSQL — `10 passed`.
- Playwright request-count test: exactly one `/user/dashboard` call and zero legacy dashboard calls.
- Legacy fallback test: aggregate 404 falls back to `/user/streak`.
- `npx tsc --noEmit` — clean.
- `npm run build` — success.
- `npm run lint` — 0 errors, 114 pre-existing warnings.
