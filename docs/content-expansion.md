# Interactive bank content expansion

This note describes the content pool behind `backend/db/09-interactive-bank.sql`
and the checks that keep it usable for a no-repeat exam policy.

## Counts

Source pools:

| Pool | Before | After |
| --- | ---: | ---: |
| Academic passages (`readingPassages`) | 16 | 60 |
| Short C-Test-only texts (`cTestPassages`) | 0 | 60 |
| Listening dialogues | 12 | 36 |
| Read-then-speak topics | 20 | 26 |
| Interactive-speaking scenarios | 15 | 20 |

Generated rows:

| Type | Before | After | How the rows are derived |
| --- | ---: | ---: | --- |
| `INTERACTIVE_READING` | 100 | 120 | two variants per academic passage |
| `C_TEST` | 100 | 120 | one item per unique source text |
| `INTERACTIVE_LISTENING` | 60 | 108 | three variants per dialogue |
| `READ_THEN_SPEAK` | 60 | 78 | three angles per topic |
| `INTERACTIVE_SPEAKING` | 60 | 80 | four tasks per scenario |

The C-Test pool contains 120 distinct texts: the 60 academic passages plus 60
short academic texts written only for the C-Test. Every C-Test row uses a
different text, so two candidates cannot receive the same passage in that stage.

The local Postgres instance (`127.0.0.1:15999`) also contains older seed rows
outside this bank. After loading the file, totals are:
`C_TEST 133`, `INTERACTIVE_LISTENING 114`, `INTERACTIVE_READING 128`,
`INTERACTIVE_SPEAKING 101`, `READ_THEN_SPEAK 99`.

## Content rules

- Passages are original prose, 90-140 words, B1-C1, one distinct topic each.
- Every passage has three gap words with three grammatical distractors each,
  two exact highlight sentences, four title options and four main-idea options.
- The correct option is stored first in the content module; the generator
  rotates it to a deterministic position in the payload.
- Listening dialogues have exactly three turns, four options per turn, one
  unambiguous answer and two summary prompts. Scenarios are campus or academic
  situations and no two share a scenario.
- Read-then-speak and interactive-speaking prompts are distinct strings.

## Validation and pool checks

`node scripts/generate_interactive_bank.mjs` rejects:

- duplicate or near-duplicate source texts (normalised text and 8-word shingle
  overlap above 0.35);
- duplicate titles, gap words that are not whole words in the passage, missing
  or duplicate distractors, highlights that are not exact substrings, and
  option lists that are not four unique values;
- duplicate dialogue scenarios and malformed turns;
- duplicate C-Test texts, wrong blank counts, answer-length mismatches, and any
  C-Test whose prefix plus answer does not rebuild the source text exactly or
  whose completed word is not present in that text;
- duplicate read-then-speak prompts and duplicate speaking scenario/prompt
  pairs;
- repeated correct-option patterns (a single pattern repeating more than 12% of
  a type, or eight identical correct positions in a row) and an imbalanced
  answer-position distribution;
- generated counts below the minimums (100 reading, 100 C-Test, 60 of each
  spoken type) and fewer than 100 unique C-Test texts.

`node scripts/check_interactive_pool.mjs` reads the per-stage `ItemCount` from
`backend/internal/models/models.go` and the generated row counts from the SQL.
It asserts every interactive type has at least three times the per-stage item
count. Current ratios are 60x (reading), 120x (C-Test), 54x (listening), 78x
(read-then-speak) and 13.3x (interactive speaking). It also asserts that the
number of C-Test rows equals the number of unique source texts.

## Commands

```bash
node scripts/generate_interactive_bank.mjs
node scripts/generate_interactive_bank.mjs --check
node scripts/check_interactive_pool.mjs
python3 scripts/lint_content.py backend/db/09-interactive-bank.sql
cd backend && go test ./...
```

Load locally:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 15999 -U postgres -d postgres \
  -f backend/db/09-interactive-bank.sql
```

## Remaining gaps

- `INTERACTIVE_READING` uses two variants of each passage. The variants ask
  different gap, title, main-idea and highlight questions, but the passage text
  is shared. Raising the reading pool above 120 unique passages would remove
  that repetition.
- `INTERACTIVE_LISTENING` produces three option rotations per dialogue, so the
  scenario and transcript are shared across variants. A larger dialogue pool is
  the next step if listening needs 200+ unique scenarios.
- The C-Test is capped at one item per text. Adding more short texts is the only
  way to grow it without reusing a passage.
- The stage item counts are read from Go models; if the blueprint changes, the
  pool check may fail until the content pool is expanded.
