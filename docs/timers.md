# Task timers

This note records which tasks use one continuous countdown and which keep
separate official limits. The rule is simple: **speaking tasks share one task
countdown; writing tasks keep the exam's separate per-part limits.**

## Speaking

| Component | Countdown | Early check |
|---|---|---|
| `SpeakAboutPhoto` | 1:50 total = 20 s preparation + 90 s speaking | after 30 s of speech |
| `ReadThenSpeak` | 1:50 total = 20 s preparation + 90 s speaking | after 30 s of speech |
| `SpeakingSample` | 3:30 total = 30 s preparation + 180 s speaking | after 60 s of speech |

Why one countdown: preparation is part of the task, not a separate screen.
Previously the clock restarted when recording began, so it looked frozen at the
full speaking duration. A single deadline also makes the remaining time honest:
the user sees the whole task budget, including preparation.

The timer effect must not depend on `startRecording` or the recorder object.
`useAudioRecorder` returns a new object whenever volume or duration changes, so
such a dependency recreates the deadline several times per second. The current
implementation keeps the deadline in a mount-only effect and reads the latest
start/finish callbacks through refs.

## Writing

| Component | Countdown | Why |
|---|---|---|
| `WritingSample` | one 5:00 timer | the task is one graded essay with one official limit |
| `WriteAboutPhoto` | 60 s per photo, reset for each photo | each photo is a separate prompt with its own limit |
| `InteractiveWriting` | 5:00 for Part 1, then 3:00 for Part 2 | the exam gives separate limits per part |

A single total timer for `WriteAboutPhoto` or `InteractiveWriting` would let the
first photo or Part 1 consume the time reserved for the next prompt. That would
misrepresent the exam and make the countdown less useful. These tasks therefore
show the part/photo index and a separate countdown; the transition between parts
is explicit.

## Regression coverage

- `e2e/speaking-timer.spec.ts` — `SpeakAboutPhoto` total timer and early check.
- `e2e/speaking-sample-timer.spec.ts` — `SpeakingSample` total timer and early check.
- `e2e/writing-timers.spec.ts` — `WritingSample`, `WriteAboutPhoto` and
  `InteractiveWriting` countdowns, including the intentional 5:00 → 3:00 reset
  between Interactive Writing parts.
