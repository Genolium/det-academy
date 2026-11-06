# Theory taxonomy implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the retired 16-module theory catalogue with the current 13 DET task types, keep the two orientation guides as non-trackable reference pages, and preserve user progress through explicit slug remapping.

**Architecture:** The backend and frontend each get one task-slug list. The database stores `is_trackable` on every catalogue row. Only the 13 task rows count toward progress, certificates and the dashboard. Three retired slugs are mapped to their current successors before being removed.

**Tech Stack:** Go 1.26, chi, PostgreSQL, Next.js 16, Zustand, Playwright.

**Spec:** `docs/theory/det-task-taxonomy.md`

## Global Constraints

- Exactly 13 trackable task slugs:
  `read-and-select`, `fill-in-the-blanks`, `read-and-complete`, `listen-and-type`,
  `interactive-reading`, `interactive-listening`, `write-about-photo`,
  `interactive-writing`, `speak-about-photo`, `read-then-speak`,
  `interactive-speaking`, `writing-sample`, `speaking-sample`.
- Two non-trackable reference slugs: `rules-and-technicalities`,
  `subscores-and-cat-engine`.
- `start-here` remains a local-only introduction and never counts toward progress.
- Retired slugs must not appear in the visible curriculum:
  `listen-and-select`, `read-aloud`, `read-listen-speak`.
- Existing completed progress must survive:
  - `listen-and-select` → `fill-in-the-blanks`
  - `read-aloud` → `read-then-speak`
  - `read-listen-speak` → `read-then-speak` and `interactive-speaking`
- No billing, paywalls, official-score claims or new question-bank work.
- Legacy scoring branches for historical `READ_ALOUD` / `LISTEN_SELECT` sessions
  may remain, but retired slugs must not appear in the visible curriculum or
  new drill paths.
- Public copy must call the training result a platform estimate, not an official DET score.

## Review Focus

- A user who completed old lessons opens `/theory` and still sees credit for the mapped current lessons.
- A user with only reference-guide progress sees `0/13`, not `2/13`.
- A user with a stale browser cache containing retired slugs does not get more than `13/13`.
- A certificate is refused at 12/13 and issued at 13/13 with a qualifying mock score.
- Old bookmarks redirect instead of returning 404.
- The theory page, dashboard and certificate copy all show the same denominator.
- The backend catalogue and static fallback show the same 15 rows (13 tasks + 2 references).

---

### Task 1: Backend taxonomy and progress semantics

**Files:**
- Modify: `backend/internal/service/theory_service.go`
- Modify: `backend/internal/service/certificate_service.go`
- Modify: `backend/internal/service/study_service.go`
- Test: `backend/tests/theory_taxonomy_test.go`

**Interfaces:**
- Produces:
  - `service.LessonSlugs []string` — 13 trackable task slugs in official order.
  - `service.ReferenceLessonSlugs []string` — 2 reference slugs.
  - `service.TotalTheoryLessons = 13`.
  - `service.IsTrackableLessonSlug(slug string) bool`.
  - `service.IsValidLessonSlug(slug string) bool` — trackable or reference.

- [ ] **Step 1: Write the failing taxonomy tests**

Create `backend/tests/theory_taxonomy_test.go`:

```go
package tests

import (
    "context"
    "testing"

    "det-academy-backend/internal/repository/memory"
    "det-academy-backend/internal/service"
)

func TestTheoryTaxonomyMatchesOfficialTaskList(t *testing.T) {
    want := []string{
        "read-and-select", "fill-in-the-blanks", "read-and-complete",
        "listen-and-type", "interactive-reading", "interactive-listening",
        "write-about-photo", "interactive-writing", "speak-about-photo",
        "read-then-speak", "interactive-speaking", "writing-sample",
        "speaking-sample",
    }
    if len(service.LessonSlugs) != 13 || service.TotalTheoryLessons != 13 {
        t.Fatalf("got %d slugs / total %d, want 13", len(service.LessonSlugs), service.TotalTheoryLessons)
    }
    for i, slug := range want {
        if service.LessonSlugs[i] != slug {
            t.Fatalf("slug %d = %q, want %q", i, service.LessonSlugs[i], slug)
        }
    }
    for _, retired := range []string{"listen-and-select", "read-aloud", "read-listen-speak"} {
        if service.IsValidLessonSlug(retired) {
            t.Fatalf("retired slug %q is still valid", retired)
        }
    }
    for _, reference := range service.ReferenceLessonSlugs {
        if service.IsTrackableLessonSlug(reference) {
            t.Fatalf("reference %q must not be trackable", reference)
        }
    }
}

func TestTheoryProgressIgnoresReferenceAndRetiredSlugs(t *testing.T) {
    store := memory.New()
    ctx := context.Background()
    userID := "theory-taxonomy-user"
    for _, slug := range []string{
        "rules-and-technicalities", "subscores-and-cat-engine",
        "listen-and-select", "read-aloud", "read-listen-speak",
    } {
        if _, err := store.Theory().ToggleProgress(ctx, userID, slug); err != nil {
            t.Fatalf("seed %s: %v", slug, err)
        }
    }
    service := service.NewTheoryService(store.Theory())
    progress, err := service.GetProgress(ctx, userID)
    if err != nil {
        t.Fatal(err)
    }
    if progress.TotalLessons != 13 || progress.ProgressPercent != 0 || progress.IsAllCompleted {
        t.Fatalf("progress = %+v, want 0/13", *progress)
    }
}
```

- [ ] **Step 2: Run the tests and confirm the taxonomy fails**

Run: `cd backend && go test ./tests -run 'TestTheoryTaxonomy|TestTheoryProgressIgnores' -count=1 -v`
Expected: FAIL because the current list has 16 entries and retired slugs are valid.

- [ ] **Step 3: Replace the hardcoded lists and add trackable filtering**

In `theory_service.go`:

- Bump the catalogue fallback version from `2026.2` to `2026.3`.

```go
const TotalTheoryLessons = 13

var LessonSlugs = []string{ /* the 13 official slugs above */ }

var ReferenceLessonSlugs = []string{
    "rules-and-technicalities",
    "subscores-and-cat-engine",
}

func IsTrackableLessonSlug(slug string) bool { /* check LessonSlugs */ }
func IsValidLessonSlug(slug string) bool { return IsTrackableLessonSlug(slug) || isReference(slug) }
```

- `ValidCompletedLessons` must keep only `IsTrackableLessonSlug` entries and deduplicate.
- `ToggleCompletion` must reject `!IsTrackableLessonSlug(slug)`.
- `study_service.go` must use `LessonSlugs` instead of its local 16-item literal.
- `certificate_service.go` message becomes `"all 13 theory lessons must be completed to receive a certificate"`.

- [ ] **Step 4: Update existing tests that toggle the reference guide**

Replace `"rules-and-technicalities"` with `"read-and-select"` in:
- `backend/tests/api_test.go`
- `backend/tests/learning_events_test.go`

Keep `xp_ledger_test.go` untouched; it uses the string as an arbitrary idempotency key, not as a theory toggle.

- [ ] **Step 5: Run the backend theory tests**

Run: `cd backend && go test ./tests -run 'TestTheory|TestManualCertificate|TestLearningEvents' -count=1 -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/service/theory_service.go backend/internal/service/certificate_service.go backend/internal/service/study_service.go backend/tests/theory_taxonomy_test.go backend/tests/api_test.go backend/tests/learning_events_test.go
git commit -m "refactor: define the 13 current DET theory tasks"
```

---

### Task 2: Catalogue schema, seed and progress migration

**Files:**
- Modify: `backend/db/init.sql`
- Modify: `backend/internal/models/models.go`
- Modify: `backend/internal/repository/postgres/postgres.go`
- Modify: `backend/db/03-content-seed.sql`
- Modify: `backend/db/seed.sql`
- Create: `backend/db/migrations/039_theory_taxonomy.sql`
- Test: `backend/tests/theory_taxonomy_postgres_test.go`

**Interfaces:**
- Produces: `models.TheoryCatalogLesson.IsTrackable bool` with JSON key `is_trackable`.
- Produces: `theory_lessons.is_trackable BOOLEAN NOT NULL DEFAULT TRUE`.

- [ ] **Step 1: Write the migration integration test**

Create a disposable schema test that:
1. Creates `theory_lessons` and `theory_progress` with the columns used by migration 039.
2. Inserts a `read-listen-speak` row, a `listen-and-select` row, a `read-aloud` row, the two reference rows, and progress rows for each retired slug.
3. Executes `../db/migrations/039_theory_taxonomy.sql`.
4. Asserts:
   - retired lessons are gone;
   - `read-then-speak` and `interactive-speaking` exist;
   - the two reference rows have `is_trackable = false`;
   - task rows have `is_trackable = true` and numbers 1–13;
   - progress contains `fill-in-the-blanks` and `read-then-speak` for the mapped user;
   - progress contains `interactive-speaking` for the `read-listen-speak` user;
   - retired progress rows are gone.

Run: `cd backend && TEST_DATABASE_URL="postgres://localhost:5432/det_backend_test?sslmode=disable" go test ./tests -run TestPostgresTheoryTaxonomyMigration -count=1 -v`
Expected: FAIL because migration 039 and `is_trackable` do not exist.

- [ ] **Step 2: Add the column and model field**

- `init.sql`: add `is_trackable BOOLEAN NOT NULL DEFAULT TRUE` to `theory_lessons`.
- `models.go`: add `IsTrackable bool \`json:"is_trackable"\`` to `TheoryCatalogLesson`.
- `postgres.go`: select `is_trackable` in `ListCatalog` and scan it into the new field.

- [ ] **Step 3: Rewrite the seed catalogue**

In `03-content-seed.sql`:
- Remove the `listen-and-select`, `read-aloud`, and `read-listen-speak` insert blocks.
- Rename the combined lesson block to `read-then-speak` (task #10) and rewrite its copy:
  - one written prompt;
  - 20 seconds to read/plan;
  - 90 seconds to speak;
  - no audio-prompt variant.
- Add `interactive-speaking` (task #11):
  - 6–8 adaptive turns, 3–4 per topic;
  - 35 seconds per answer;
  - no preparation time;
  - adaptive follow-ups based on previous answers;
  - contributes to Speaking and overall score.
- Renumber:
  1 Read and Select, 2 Fill in the Blanks, 3 Read and Complete, 4 Listen and Type,
  5 Interactive Reading, 6 Interactive Listening, 7 Write About the Photo,
  8 Interactive Writing, 9 Speak About the Photo, 10 Read, Then Speak,
  11 Interactive Speaking, 12 Writing Sample, 13 Speaking Sample.
- Set the two guides to numbers 14 and 15.
- At the end of the seed, set `is_trackable = FALSE` for the two reference slugs
  and `TRUE` for the 13 tasks; set `version = '2026.3'` for every row.
- Update the Interactive Listening copy to the expanded format: 2 sets of 8–10
  questions, Listen and Complete, Listen and Respond, then a 75-second summary.
- Update `scripts/seed_cms_content.ts` to skip `start-here`, write
  `is_trackable`, `number`, `format`, `scoring` and `time_limit`, and upsert the
  current 15 catalogue rows.

- [ ] **Step 4: Implement migration 039**

The migration must be safe for both an existing production database and a fresh
database:
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS is_trackable ...`.
- Map progress rows before deleting retired lessons:
  - `listen-and-select` → `fill-in-the-blanks`
  - `read-aloud` → `read-then-speak`
  - `read-listen-speak` → `read-then-speak` and `interactive-speaking`
  - use `ON CONFLICT (user_id, lesson_slug) DO UPDATE SET is_completed = TRUE, updated_at = NOW()`.
- Convert the old `read-listen-speak` row to `read-then-speak` when the new row
  does not exist, then delete any remaining old row.
- Upsert `read-then-speak` and `interactive-speaking` with the full lesson payload.
- Delete `listen-and-select` and `read-aloud`.
- Renumber tasks 1–13 and guides 14–15; set `is_trackable`; set `version = '2026.3'`.
- Delete retired `theory_progress` rows only after the mapped rows are inserted.

- [ ] **Step 5: Update demo seed progress**

In `backend/db/seed.sql`, replace old demo lesson slugs with current ones:
- `write-about-the-photo` → `write-about-photo`
- `speak-about-the-photo` → `speak-about-photo`
- `read-listen-speak` → `read-then-speak`
- remove `rules-and-technicalities` from the tracked demo list; add
  `interactive-speaking` so the demo still has a realistic 12/13.

- [ ] **Step 6: Run the migration test and the Postgres suite**

Run:
```bash
cd backend
TEST_DATABASE_URL="postgres://localhost:5432/det_backend_test?sslmode=disable" \
  go test ./tests -run 'TestPostgresTheoryTaxonomyMigration|TestRunMigrationsCreatesMissingTablesAndIsIdempotent' -count=1 -v
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/db/init.sql backend/db/03-content-seed.sql backend/db/seed.sql backend/db/migrations/039_theory_taxonomy.sql backend/internal/models/models.go backend/internal/repository/postgres/postgres.go backend/tests/theory_taxonomy_postgres_test.go
git commit -m "feat: migrate theory catalogue to 13 DET task types"
```

---

### Task 3: Shared frontend taxonomy and static course content

**Files:**
- Create: `src/data/theoryTaxonomy.ts`
- Modify: `src/data/theoryContent.ts`
- Modify: `src/data/theoryIndex.ts`
- Modify: `theory/THEORY.MD`
- Modify: `src/store/useProgressStore.ts`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Produces: `THEORY_TASK_SLUGS`, `THEORY_REFERENCE_SLUGS`, `THEORY_TASK_COUNT`,
  `isTheoryTaskSlug(slug)`, `normalizeTheoryCompletedLessons(slugs)`.
- Produces: `LessonGuide.isTrackable?: boolean`.

- [ ] **Step 1: Add the shared frontend taxonomy module**

`src/data/theoryTaxonomy.ts` must contain the same 13 slugs and the same retired
mapping as the backend. `normalizeTheoryCompletedLessons` maps retired slugs to
their successors, removes duplicates and filters to trackable slugs.

- [ ] **Step 2: Update the static course**

In `theoryContent.ts`:
- Add `isTrackable?: boolean` to `LessonGuide`.
- Keep `start-here` number 0 and non-trackable.
- Remove the three retired lesson objects.
- Replace `read-listen-speak` with `read-then-speak`.
- Add `interactive-speaking`.
- Mark `rules-and-technicalities` and `subscores-and-cat-engine` with
  `isTrackable: false` and numbers 14/15.
- Update every mention of retired task names in the remaining lessons:
  - `subscores-and-cat-engine` must describe current task contributions only.
  - `start-here` links to current tasks only.
  - any “16 modules/lessons” copy becomes “13 task types”.
- Update `Interactive Listening` copy to the expanded format.
- Keep the total static array at 16 objects: `start-here` + 13 tasks + 2 references.
- Update `theory/THEORY.MD`: replace the combined “Read / Listen, Then Speak”
  section with separate “Read, Then Speak” and “Interactive Speaking” sections,
  remove the “3 times per test / 2 read / 1 listen” claim, and renumber the
  thirteen task sections in official order.

- [ ] **Step 3: Make `theoryIndex` the 13-task index**

`src/data/theoryIndex.ts` must contain only the 13 trackable tasks, in official
order, typed as a lightweight `TheoryIndexLesson` instead of the full
`LessonGuide`. Dashboard category filters must not include a `rules` category
after this change.

- [ ] **Step 4: Normalize progress in the store**

In `useProgressStore.ts`:
- Import `THEORY_TASK_COUNT`, `normalizeTheoryCompletedLessons`.
- `export const TOTAL_LESSONS = THEORY_TASK_COUNT`.
- Normalize local stored `completedLessons` on load, on backend sync, and on the
  offline fallback path.
- `toggleLessonCompleted` must ignore non-task slugs.

- [ ] **Step 5: Remove dashboard hardcoded 16s**

In `dashboard/page.tsx`:
- Replace all three theory `16` literals (readiness condition, remaining-count
  line, roadmap heading/`studiedOf` line) with `TOTAL_LESSONS`.
- Keep the 10–160 score `/ 160` values untouched.
- Update the `lessons16` translation text to “13 уроков” / “13 lessons”; the key
  name may stay for compatibility.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/data/theoryTaxonomy.ts src/data/theoryContent.ts src/data/theoryIndex.ts src/store/useProgressStore.ts src/app/dashboard/page.tsx
git commit -m "feat: align static theory course with current DET tasks"
```

---

### Task 4: Theory catalogue page and lesson page

**Files:**
- Modify: `src/app/theory/page.tsx`
- Modify: `src/app/theory/[slug]/page.tsx`
- Modify: `src/lib/translations.ts`
- Modify: `next.config.ts`
- Test: `e2e/theory-taxonomy.spec.ts`

- [ ] **Step 1: Write the failing Playwright test**

Create `e2e/theory-taxonomy.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('theory catalogue exposes 13 tasks and separate references', async ({ page }) => {
  await page.goto('/theory');
  await expect(page.getByText(/13 типов заданий/)).toBeVisible();
  await expect(page.getByTestId('theory-task-card')).toHaveCount(13);
  await expect(page.getByTestId('theory-reference-card')).toHaveCount(3); // start-here + 2 guides
  await expect(page.getByText('Listen and Select')).toHaveCount(0);
  await expect(page.getByText('Read Aloud')).toHaveCount(0);
  await expect(page.getByText('Listen, Then Speak')).toHaveCount(0);
  await expect(page.getByText('Read / Listen, Then Speak')).toHaveCount(0);
});

test('interactive speaking and read then speak are current lessons', async ({ page }) => {
  await page.goto('/theory/interactive-speaking');
  await expect(page.getByRole('heading', { name: /Interactive Speaking/ })).toBeVisible();
  await expect(page.getByText(/6–8/)).toBeVisible();
  await expect(page.getByText(/35 секунд/)).toBeVisible();

  await page.goto('/theory/read-then-speak');
  await expect(page.getByRole('heading', { name: /Read, Then Speak/ })).toBeVisible();
  await expect(page.getByText(/Listen, Then Speak/)).toHaveCount(0);
});

test('retired lesson URLs redirect', async ({ page }) => {
  for (const [from, to] of [
    ['/theory/listen-and-select', '/theory/fill-in-the-blanks'],
    ['/theory/read-aloud', '/theory/read-then-speak'],
    ['/theory/read-listen-speak', '/theory/read-then-speak'],
  ]) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
  }
});
```

Run: `npx playwright test e2e/theory-taxonomy.spec.ts --workers=1`
Expected: FAIL because the page still shows 16/15 and lacks the new lessons.

- [ ] **Step 2: Split the catalogue into intro, tasks and references**

In `src/app/theory/page.tsx`:
- `trackableLessons` = `lessons.filter((l) => l.slug !== 'start-here' && l.isTrackable !== false)`.
- `referenceLessons` = `lessons.filter((l) => l.slug === 'start-here' || l.isTrackable === false)`.
- Progress denominator = `trackableLessons.length` (must be 13).
- Render the `start-here` card first, then the 13 task cards with
  `data-testid="theory-task-card"`, then a reference section with
  `data-testid="theory-reference-card"`.
- Reference cards show “Справочник” / “Reference”, never a completion toggle.
- Add `is_trackable` to the mapped `LessonGuide`.

- [ ] **Step 3: Update the lesson detail page**

In `src/app/theory/[slug]/page.tsx`:
- Show `УРОК NN / 13` for tasks and `СПРАВОЧНИК` for non-trackable pages.
- Hide the interactive drill and completion card for `isTrackable === false`.
- Hide the generic drill for `interactive-speaking` and show a `/test` CTA
  instead; there is no standalone adaptive-conversation drill yet.
- Remove retired practice links/sources.
- Add:
  - `read-then-speak` → `/practice?drill=read-then-speak`
  - `interactive-speaking` → `/test`
- Keep `interactive-reading` and `interactive-listening` practice links pointing
  at their existing drills.
- Update `INTERACTIVE_EXAMPLE_SLUGS` to remove `listen-and-select`.

- [ ] **Step 4: Add redirects and translations**

In `next.config.ts`, add permanent redirects for the three retired slugs.
In `src/lib/translations.ts`, replace all theory “16” counts with “13” and add
reference-section labels for RU/EN. Update:
- `lessonsCount`
- `theoryDesc`
- `guardSubtitle`
- `theoryLabel`
- `curriculum`
- `lessons16` text

- [ ] **Step 5: Run the new test**

Run: `npx playwright test e2e/theory-taxonomy.spec.ts --workers=1`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/theory/page.tsx src/app/theory/[slug]/page.tsx src/lib/translations.ts next.config.ts e2e/theory-taxonomy.spec.ts
git commit -m "feat: show 13 task lessons plus reference guides"
```

---

### Task 5: Remove retired practice paths and update mocks

**Files:**
- Modify: `src/components/practice/InteractiveLessonDrill.tsx`
- Modify: `src/components/theory/InteractiveTheoryExample.tsx`
- Modify: `src/app/practice/page.tsx`
- Modify: `e2e/mocks.ts`
- Modify: `e2e/admin-analytics.spec.ts`
- Modify: `e2e/i18n-interface.spec.ts` only if its theory route list needs the new lesson.

- [ ] **Step 1: Remove retired drill branches**

In `InteractiveLessonDrill.tsx`:
- Delete `isListenSelect`, `isReadAloud`, and their state/handlers/render blocks.
- Rename `isReadListenSpeak` to `isReadThenSpeak`; map it to
  `READ_THEN_SPEAK`.
- Keep the speaking recorder mechanics for `read-then-speak` and
  `speaking-sample`.
- Do not add a new Interactive Speaking standalone drill; the theory lesson
  links to `/test`.

In `InteractiveTheoryExample.tsx`:
- Delete the `listen-and-select` branch and its “Select / Do not select” UI.
- Keep `read-and-select`, `fill-in-the-blanks`, and `listen-and-type`.

- [ ] **Step 2: Update the practice hub**

In `src/app/practice/page.tsx`:
- Add `read-then-speak` to the valid `drill` query-param set.
- Use the canonical `write-about-photo` slug for the photo-writing drill.
- Remove any retired drill references.
- Keep the pronunciation warm-up page, but label it as supplementary rather
  than a DET task.

- [ ] **Step 3: Update test mocks and counts**

- `e2e/mocks.ts`: `totalLessons: 13`.
- `e2e/admin-analytics.spec.ts`: `totalLessons: 13`.
- Update any test fixture that toggles `rules-and-technicalities` to a task slug.

- [ ] **Step 4: Run the focused suite**

```bash
npx tsc --noEmit
npx playwright test e2e/theory-taxonomy.spec.ts e2e/theory-start.spec.ts e2e/theory-interactive.spec.ts e2e/theory-audio-examples.spec.ts e2e/dashboard-subscores.spec.ts --workers=1
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/InteractiveLessonDrill.tsx src/components/theory/InteractiveTheoryExample.tsx src/app/practice/page.tsx e2e/mocks.ts e2e/admin-analytics.spec.ts
git commit -m "chore: remove retired theory drill paths"
```

---

### Task 6: Full verification and documentation

**Files:**
- Modify: `docs/roadmap-2026-11-01.md`
- Modify: `docs/theory/det-task-taxonomy.md` with final counts if needed.

- [ ] **Step 1: Run the complete backend suite**

```bash
cd backend
go vet ./...
TEST_DATABASE_URL="postgres://localhost:5432/det_backend_test?sslmode=disable" \
  go test -race ./... -count=1
```
Expected: PASS.

- [ ] **Step 2: Run the frontend checks**

```bash
npx tsc --noEmit
npm run lint
npm run build
```
Expected: 0 TypeScript errors, 0 lint errors, successful build.

- [ ] **Step 3: Run the full Playwright suite**

```bash
lsof -ti tcp:3101 | xargs kill 2>/dev/null || true
CI=true npx playwright test --workers=1
```
Expected: all tests pass except the documented skips.

- [ ] **Step 4: Run the fullstack suite**

```bash
psql -d det_fullstack_test -c "TRUNCATE daily_limit_counters; TRUNCATE rate_limit_counters;"
CI=true FULLSTACK_DATABASE_URL="postgres://localhost:5432/det_fullstack_test?sslmode=disable" \
  FULLSTACK_PREPARE_DB=false bash scripts/run_fullstack_e2e.sh
```
Expected: all fullstack tests pass.

- [ ] **Step 5: Verify the production catalogue after deploy**

After the tag deploy, run on the server:

```sql
SELECT number, slug, is_trackable FROM theory_lessons ORDER BY number;
SELECT count(*) FROM theory_progress WHERE lesson_slug IN
  ('listen-and-select', 'read-aloud', 'read-listen-speak');
```

Expected: 13 task rows with `is_trackable = true`, 2 reference rows with
`is_trackable = false`, and zero retired progress rows.

- [ ] **Step 6: Update the roadmap and commit**

Mark the curriculum item closed in `docs/roadmap-2026-11-01.md` with the exact
verification evidence.

```bash
git add docs/roadmap-2026-11-01.md docs/theory/det-task-taxonomy.md
git commit -m "docs: record theory taxonomy migration"
```

## Verification evidence

- Go `go vet ./...` + `go test -race ./...` with `TEST_DATABASE_URL` — green.
- Playwright full suite — `219 passed / 2 skipped`.
- Fullstack real backend + PostgreSQL — `9 passed`.
- `npx tsc --noEmit` — clean.
- `npm run build` — success.
- `npm run lint` — 0 errors, 114 pre-existing warnings.
- Fresh-schema bootstrap test applies `init.sql` + `03-content-seed.sql` without migrations and sees 15 catalogue rows / 13 trackable.
- Empty-catalogue migration test proves the migration itself creates all 15 rows and is idempotent.
- Certificate test proves 12/13 is refused and 13/13 is issued.
