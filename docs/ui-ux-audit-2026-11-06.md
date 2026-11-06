# UI/UX audit — 2026-11-06

## Method

Reviewed the public and authenticated surfaces in source and in a production
build at 1440×900 and 390×844, plus the existing Playwright, axe and reflow
suites. Ran the Impeccable detector over the changed components. The review
focused on registration/verification, timers, mobile layout, error recovery,
and the speaking flow reported by users.

## What works

- The lime/obsidian visual language is coherent and recognisable; the exam
  screens deliberately switch to a dark, focused palette.
- Server-authoritative attempts, visible stage deadlines and autosaved audio
  drafts are strong foundations.
- Public catalogue pages have clear disclaimers and the certificate language is
  moving away from official-score claims.
- Mobile navigation, focus traps and 320 px reflow are covered by tests.

## Fixed in this pass

### Registration and login recovery

Postbox rejected verification emails with HTTP 403 during the incident window.
The backend was recreated with the current environment; a fresh verification
email was accepted and sent for `mariabogatyreva@icloud.com`.

The dead end itself was also fixed:

- login errors now preserve the `email_not_verified` code and explain it in
  Russian instead of showing `Email is not verified`;
- the login error offers **«Отправить письмо ещё раз»** via the new public
  `POST /api/v1/auth/resend-verification-by-email` endpoint;
- the endpoint is generic for unknown addresses, rate-limited, and suppresses
  repeated sends for 60 seconds so a caller cannot invalidate links endlessly;
- duplicate registration is explained without disclosing whether the account
  exists: the user can switch to login or request a new email;
- auth errors are localised (password policy, duplicate account, wrong
  credentials), the password field has a visibility toggle and a requirements
  hint, and fields have correct `autocomplete` values;
- the error summary receives focus and is announced with `role="alert"`.

### Timers

- Speaking screens now cap their task deadline to the server stage deadline with
  a 15-second safety buffer. If a stage loads late, the recording cannot be cut
  off by the server while the component still shows a longer private timer.
- A stage-limited warning explains that the recording will stop automatically.
- The last 15 seconds show a live warning; the existing countdown turns amber
  and then rose.
- When a speaking stage reaches the server deadline, the test engine shows a
  “saving the recording” overlay for up to 20 seconds instead of silently
  unmounting the recording UI.
- Server practice assignments now have a visible countdown based on
  `timeLimitSec`, disable input at zero, and explain why the task is closed.
- Interactive practice lessons now show a practice countdown derived from the
  task type (read-select, C-test, listening, writing, etc.).
- The typing trainer keeps its existing time mode; flashcards and pronunciation
  remain self-paced by design (a countdown would add pressure without improving
  learning).

### Layout and copy

- The cookie notice no longer paints above the auth modal and its height is
  reserved at the bottom of the page, so the last section stays reachable.
- The long `READ_SELECT` word, `WRITE_PHOTO` header, `LISTEN_TYPE` play label
  and `/practice` CTA fit 320 px.
- Hero bottom spacing was reduced to remove the large empty gap before the
  feature grid.
- Vocabulary fetch failures show a human message and a retry button instead of
  `Failed to fetch`; institution failures use the same pattern.
- Theory progress now excludes the local `start-here` orientation lesson from
  the 16-module denominator, so 16/16 is reachable.
- The Russian institutions stat uses `0 ₽` rather than `0$`.
- The strict-mode label is localized.
- Speaking screens hide the live transcript behind a “Показать расшифровку”
  toggle, reducing visual noise while recording.

## Remaining risks

1. **Verification email observability.** Postbox failures were only visible in
   container logs. Add a delivery metric/alert; a registration should not look
   successful while every email is rejected.
2. **Content trust.** Theory still includes retired Listen and Select, Read
   Aloud and Listen Then Speak modules and omits Interactive Speaking. The
   course count and “13 task types” copy need one editorial pass.
3. **Speaking density.** The stage header still carries difficulty, progress,
   stage timer and skip alongside the task timer. Consider a focused speaking
   header that keeps only the stage timer and an explicit “stop recording”
   control.
4. **Auth security.** The access token still exists in `localStorage` alongside
   the HttpOnly cookie; migrate the client to cookie-only auth + CSRF, then add
   a CSP nonce.
5. **Password recovery.** There is no password-reset flow. A user who forgets
   the password still has no self-service path.
6. **Practice hierarchy.** Mixed Russian/English badges (`SPEED DRILL`,
   `C-TEST PRACTICE`, `AUDIO SPEECH ENGINE`) read as category labels rather than
   product copy. Decide whether the whole hub is bilingual or localize them.
7. **Cookie notice.** The mobile banner still occupies roughly 100 px while
   visible. Reserving space prevents hidden content, but a compact single-row
   mobile variant would be calmer.
8. **Dashboard and results.** The earlier review’s findings remain: client-side
   waterfall, too many simultaneous stats, and a result screen that should lead
   with the next action rather than a dense score surface.

## Timer inventory after this pass

| Surface | Timer | Source |
|---|---|---|
| Read and Select | 5 s per word | item `timeLimitSec` |
| Fill in the Blanks | 20 s per item | item `timeLimitSec` |
| Read and Complete / C-Test | 180 s | item `timeLimitSec` |
| Listen and Type | 60 s | item `timeLimitSec` |
| Interactive Reading | 420 s | task `timeLimitSec` |
| Interactive Listening | 240 s | task `timeLimitSec` |
| Write About Photo | 60 s per photo | item `timeLimitSec` |
| Interactive Writing | 300 s + 180 s | official part limits |
| Speak About Photo | 20 s prep + 90 s speaking | task, capped by stage deadline |
| Read Then Speak | 20 s prep + 90 s speaking | task, capped by stage deadline |
| Interactive Speaking | 35 s per turn | turn deadline |
| Writing Sample | 300 s | task limit |
| Speaking Sample | 30 s prep + 180 s speaking | task, capped by stage deadline |
| Test header | server stage deadline | `test_sessions.deadline_at` |
| Practice assignment | `timeLimitSec` | server assignment |
| Interactive practice lesson | task-type limit | practice catalog |
| Typing trainer | time mode | local setting |
| Strict practice mode | 10 min | local setting |

## Verification

- `tsc --noEmit` — clean.
- `npm run build` — success; bundle budget passed.
- Playwright — 205 passed, 2 skipped, including the new auth recovery tests.
- Go tests with PostgreSQL — green.
- Impeccable detector — no findings on changed UI files.
