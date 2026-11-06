# DET task taxonomy audit — November 2026

**Status:** implemented, deployed and verified in production as `v2026.11.06-6`.

## Official baseline

The current Duolingo English Test has **13 graded task types**. The official Test
Structure page lists them in this order:

| # | Official task | Frequency | What it checks |
|---|---|---|---|
| 1 | Read and Select | 15–18 words | Real-word recognition |
| 2 | Fill in the Blanks | 6–9 sentences | Sentence context and spelling |
| 3 | Read and Complete | 3–6 passages | C-test text reconstruction |
| 4 | Listen and Type | 6–9 sentences | Dictation |
| 5 | Interactive Reading | 2 sets of 6 questions | Five reading sub-tasks |
| 6 | Interactive Listening | 2 sets of 8–10 questions | Listen and Complete, Listen and Respond, Summarize the Conversation |
| 7 | Write About the Photo | 3 photos | Written description |
| 8 | Interactive Writing | 1 set of 2 questions | Two-stage writing |
| 9 | Speak About the Photo | 1 photo | Spoken description |
| 10 | Read, Then Speak | 1 prompt | Extended spoken response |
| 11 | Interactive Speaking | 1 set of 6–8 questions | Adaptive simulated conversation, 35 s per turn |
| 12 | Writing Sample | 1 prompt | Extended essay |
| 13 | Speaking Sample | 1 prompt | Extended spoken sample |

Sources:

- <https://testcenter.zendesk.com/hc/en-us/articles/39104891663245-Test-Structure>
- <https://testcenter.zendesk.com/hc/en-us/sections/39104552844557-Test-Structure-and-Questions>
- <https://testcenter.zendesk.com/hc/en-us/articles/36094897057421-Test-Update-New-Interactive-Speaking-questions>
- <https://testcenter.zendesk.com/hc/en-us/articles/36094888038029-Test-Update-Expanded-Interactive-Listening-question>

## Retired / removed formats

| Old format | Status | Effective | Replacement |
|---|---|---|---|
| Listen and Select | Not in the current official list; legacy platform module | Retired before the 2025 update | Fill in the Blanks for vocabulary-in-context practice |
| Read Aloud | Removed from the test | July 1, 2025 | No direct replacement; closest current task is Read, Then Speak |
| Listen, Then Speak | Replaced by Interactive Speaking | July 1, 2025 | Interactive Speaking |
| Read / Listen, Then Speak (combined platform lesson) | Split into current tasks | July 1, 2025 | Read, Then Speak + Interactive Speaking |

The official July 2025 update is explicit: Interactive Speaking replaces Listen,
Then Speak, and Read Aloud is removed to keep the test length stable.

## Current catalogue vs target

The database and static course currently contain 16 rows: 2 orientation guides
and 14 task lessons (the old 14-type model). Target model:

- **13 trackable task lessons** — exactly the official list above.
- **2 reference guides** — `rules-and-technicalities` and
  `subscores-and-cat-engine`. They stay available, but are marked
  `is_trackable = false` and never count toward theory progress or certificates.
- **1 local intro** — `start-here`, already outside the progress denominator.

### Row mapping

| Current slug | Target | Action |
|---|---|---|
| `rules-and-technicalities` | same | Keep, `is_trackable = false`, number 14 |
| `subscores-and-cat-engine` | same | Keep, `is_trackable = false`, number 15 |
| `read-and-select` | same | Keep, task #1 |
| `listen-and-select` | `fill-in-the-blanks` | Remove lesson; copy completed progress to `fill-in-the-blanks` |
| `fill-in-the-blanks` | same | Keep, task #2 |
| `read-and-complete` | same | Keep, task #3 |
| `listen-and-type` | same | Keep, task #4 |
| `read-aloud` | `read-then-speak` | Remove lesson; copy completed progress to `read-then-speak` |
| `interactive-reading` | same | Keep, task #5 |
| `interactive-listening` | same | Keep, task #6; update copy to the expanded 8–10 question format |
| `write-about-photo` | same | Keep, task #7 |
| `interactive-writing` | same | Keep, task #8 |
| `writing-sample` | same | Keep, task #12 |
| `speak-about-photo` | same | Keep, task #9 |
| `read-listen-speak` | `read-then-speak` + `interactive-speaking` | Remove combined lesson; copy completed progress to both current tasks |
| `speaking-sample` | same | Keep, task #13 |
| — | `interactive-speaking` | New task #11 |

Task order in the catalogue follows the official test order, not the old
platform order.

## Data and progress migration

- Add `theory_lessons.is_trackable BOOLEAN NOT NULL DEFAULT TRUE`.
- Mark the two reference guides false; all 13 task lessons true.
- Delete retired task rows after progress migration.
- Preserve completed progress:
  - `listen-and-select` → `fill-in-the-blanks`
  - `read-aloud` → `read-then-speak`
  - `read-listen-speak` → `read-then-speak` and `interactive-speaking`
- Keep progress rows for the reference guides, but they are ignored by the
  progress denominator and certificate check.
- Add permanent redirects:
  - `/theory/listen-and-select` → `/theory/fill-in-the-blanks`
  - `/theory/read-aloud` → `/theory/read-then-speak`
  - `/theory/read-listen-speak` → `/theory/read-then-speak`

## Source-of-truth rules

- Backend task slugs live in one Go list; services must not hardcode their own
  16/13-element copies.
- Frontend task slugs live in one TypeScript taxonomy module; the progress
  store, dashboard and theory page must use it instead of `16`.
- The seed file and migration must agree on slugs, numbers and `is_trackable`.
- The static course copy and the server catalogue must expose the same 15 rows
  (13 tasks + 2 references); `start-here` remains local-only.
- Legacy slugs may remain only in migration/redirect/compatibility code, never
  in the visible curriculum.

## Out of scope

- Rebuilding the question bank or adding new Interactive Speaking questions.
- Turning the pronunciation warm-up into a scored DET task.
- A full content rewrite of every lesson; only stale task names, counts and
  official-format facts are corrected.
- Directus schema redesign; `theory_lessons.is_trackable` is the only new
  catalogue column.
- Removing legacy scoring branches for historical `READ_ALOUD` / `LISTEN_SELECT`
  sessions. They may remain in scoring compatibility code, but must never be
  offered as current theory lessons or new drills.

## Acceptance criteria

1. `/theory` shows 13 trackable task lessons, progress denominator 13, and the
   two reference guides in a separate non-trackable section.
2. No visible theory surface contains “Listen and Select”, “Read Aloud”,
   “Listen, Then Speak” or “Read / Listen, Then Speak”.
3. `/theory/interactive-speaking` exists and explains the 6–8 turn, 35-second
   adaptive conversation.
4. `/theory/read-then-speak` exists and no longer describes the retired
   combined format.
5. Old URLs redirect permanently.
6. Existing completed progress survives the migration.
7. Certificate issuance requires all 13 task lessons, not 16.
8. Backend and frontend counts agree; no hardcoded `16` remains in theory,
   dashboard or certificate copy.
9. Backend tests, Playwright, fullstack and production build pass.
