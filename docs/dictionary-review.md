# Dictionary review — 2026-10-28

Human-quality review of the generated learner dictionary that powers the vocabulary UI.

## Files

- `scripts/content/dictionary.generated.json` — 1,432 reviewed entries (source of truth).
- `backend/db/10-dictionary.sql` — regenerated from the JSON with `scripts/generate_dictionary.mjs`.
- `scripts/generate_dictionary.mjs` — validation and SQL generation (review exclusions, spelling aliases, leak checks, transactional replace).
- Local PostgreSQL `vocabulary_entries` table — regenerated rows applied and verified.

`src/`, backend handlers and workflows were not changed.

## Method

1. **Structural pass.** Every entry was checked for a real alphabetic headword, unique word, slashed IPA, allowed POS/CEFR values, Cyrillic `meaningRu`, minimum definition/example length, 2–4 unique collocations, and no Cyrillic text in English fields.
2. **Free dictionary validation.** No paid API and no keys were used.
   - `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`: an entry was returned for 1,003 of the 1,446 original headwords (977 of the final 1,432). The API rate-limited 425 final requests (HTTP 429) and was missing 23 words (HTTP 404, mostly basic forms such as `be`, `look`, `read`, and compounds).
   - `https://api.datamuse.com/words?sp=<word>&md=dpr&max=4`: an exact entry was returned for all 1,446 original headwords and all 36 added headwords (1,482 lookups), with definitions, POS tags and ARPAbet pronunciation. This was the fallback and the coverage baseline.
   - POS was compared for the 972 final entries with usable dictionaryapi.dev data: 968 matched. The four differences are taxonomy choices, not errors (`few`/`many` determiner, `nineteen` numeral, `fascinated` adjectival participle).
3. **Frequency sanity check.** Datamuse `f:` frequency (per million) was used to spot gross CEFR outliers. It supported the distribution but was not treated as a level authority, because thematic A2 words (animals, food, sports) are naturally low-frequency.
4. **Entry-by-entry editorial pass.** Every headword, POS, level, Russian gloss and English definition was reviewed, with priority on the 101 B1-core words and the A2/B1 bands. Examples were checked programmatically for target-word use and uniqueness, with manual review of every flagged example and every new/corrected entry. Collocations were checked for duplicates, Russian text and non-collocational phrases.
5. **Regeneration and database verification.** The SQL was regenerated, `--check` was run, the file was applied to PostgreSQL, and the database rows were compared field-by-field with the JSON.

## Results

- Reviewed: **1,446** entries (100% of the generated set).
- Removed: **50** non-headwords.
- Added: **36** base-form headwords.
- Retained but corrected: **88** entries (92 field-level edits).
- Final size: **1,432** real entries (above the 1,300 floor).
- Net change: **−14** entries.

| Level | Before | After | Change |
| --- | ---: | ---: | ---: |
| A2 | 331 | 297 | −34 |
| B1 | 472 | 494 | +22 |
| B2 | 464 | 463 | −1 |
| C1 | 172 | 175 | +3 |
| C2 | 7 | 3 | −4 |
| **Total** | **1,446** | **1,432** | **−14** |

### Removals

- **45 inflected forms** were replaced by a base headword (35) or dropped because the lemma already existed (10):
  - replaced: `Cats→Cat`, `Elephants→Elephant`, `Men→Man`, `Was→Be`, `Believes→Believe`, `Buying→Buy`, `Died→Die`, `Discovered→Discover`, `Doing→Do`, `Gave/Giving→Give`, `Gets→Get`, `Jumps→Jump`, `Kept→Keep`, `Looks→Look`, `Puts→Put`, `Rained→Rain`, `Reads→Read`, `Scored→Score`, `Sees→See`, `Taking→Take`, `Walks/Walking→Walk`, `Wants→Want`, `Works→Work`, `Costs→Cost`, `Returns→Return`, `Loved→Love`, `Thinking→Think`, `Spending→Spend`, `Dancing→Dance`, `Smaller→Small`, `Uses→Use`, `Presents→Present`, `Vegetables→Vegetable`.
  - dropped because the lemma was already present: `Answered`, `Created`, `Explained`, `Waiting`, `Watched`, `Watches`, `Watching`, `Running`, `Assumes`, `Washing`.
- **2 British spelling duplicates:** `analyse` (kept `Analyze`), `organise` (kept `Organize`). The B1-core source words are aliased to the American headwords so their source attribution is preserved.
- **3 over-levelled non-lemmas at C2:** `Amplest` (superlative), `Practician` (archaic), `Contradictive` (rare variant); replaced by `Ample`, `Practitioner`, `Contradictory`.

### Additions

36 base-form entries were written with IPA, POS, level, Russian gloss, definition, example and collocations: `Ample`, `Be`, `Believe`, `Buy`, `Cat`, `Contradictory`, `Cost`, `Dance`, `Die`, `Discover`, `Do`, `Elephant`, `Get`, `Give`, `Jump`, `Keep`, `Look`, `Love`, `Man`, `Practitioner`, `Present`, `Put`, `Rain`, `Read`, `Return`, `Score`, `See`, `Small`, `Spend`, `Take`, `Think`, `Use`, `Vegetable`, `Walk`, `Want`, `Work`.

### Corrections by field

| Field | Entries changed | Examples |
| --- | ---: | --- |
| `meaningRu` | 30 | removed the English word from `Profoundly`; replaced the inappropriate `голодомор` gloss for `Famine`; trimmed long multi-sense glosses |
| `level` | 29 | 24 A2→B1 for B1-core alignment; `Coherence`, `Conclusively`, `Whim` C2→C1; `Indisputable`, `Unattainable` C1→C2 |
| `ipa` | 14 | removed dot-separated syllable notation and fixed malformed strings (`Atom`, `Cellphone`, `Governor`, `However`, `Independently`, `Into`, `Kingdom`, `Presidency`, `Seven`, `Seventeen`, `Valid`, `Wastebasket`, `Blackboard`, `Disorganized`) |
| `definitionEn` | 13 | 8 circular definitions that began with the headword; semantic fixes for `Football`, `Haul`, `Sake`, `Downward`; unique definitions for `Breathtaking`/`Stunning` |
| `collocations` | 5 | removed the duplicated `serial killer`; replaced non-collocations in `Cafe`, `Policewoman`, `Cleaner`, `Retrospect` |
| `pos` | 1 | `Born` verb→adjective |

## B1 core

All 101 core words are represented. After review: 78 are B1, 15 are B2 (e.g. `assess`, `concept`, `significant`), and 8 remain A2 because that is their genuine CEFR level (`choice`, `continue`, `decide`, `describe`, `difference`, `difficult`, `example`, `explain`). No core word is missing; `analyse`/`organise` are represented by `Analyze`/`Organize`.

## Database

Applied with:

```bash
cd /Users/ilyan/Downloads/det-academy/det-academy
PGPASSWORD=postgres psql -h 127.0.0.1 -p 15999 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f backend/db/10-dictionary.sql
```

The generated SQL now wraps a `DELETE FROM vocabulary_entries WHERE id LIKE 'dict-%'` and the insert in one transaction. This is required because sequential `dict-N` ids shift when headwords are removed; without the delete, stale rows survive. Other vocabulary sources are untouched.

Result: 1,432 generated rows. The table contains 1,938 rows in total because 506 Academic Word List rows already existed.

| Source | A2 | B1 | B2 | C1 | C2 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Course vocabulary (theory/HEDWIG-VOCABULARY.docx) | 289 | 416 | 448 | 175 | 3 | 1,331 |
| DET B1 core (platform dataset) | 8 | 78 | 15 | 0 | 0 | 101 |
| Academic Word List (platform dataset) | 0 | 0 | 5 | 196 | 305 | 506 |
| **Total** | **297** | **494** | **468** | **371** | **308** | **1,938** |

A field-by-field comparison of all 1,432 `dict-%` rows against the JSON returned 0 differences.

## Sample corrections

| Headword | Before | After |
| --- | --- | --- |
| `Cat` | `Cats`, A2 noun, “Plural of cat…” | `Cat`, A2 noun, definition and example for the singular; `pet cat`, `stray cat`, `cat food` |
| `Be` | `Was`, A2 verb, “The past tense of 'be'…” | `Be`, A2 verb, “To exist, or to have a particular quality or state.” |
| `Ample` | `Amplest`, C2 adjective, superlative gloss | `Ample`, B2 adjective, “Enough or more than enough in amount or size.” |
| `Practitioner` | `Practician`, C2, archaic | `Practitioner`, C1, “A person who works in a profession, especially medicine or law.” |
| `Contradictory` | `Contradictive`, C2, rare variant | `Contradictory`, C1, “Containing ideas or statements that are opposed to each other.” |
| `Cost` | `Costs`, B1 plural, definition said “plural of cost” | `Cost`, B1 noun, normal singular entry; example keeps “production costs” |
| `Famine` | `голод, голодомор` | `голод, нехватка продовольствия` |
| `Profoundly` | `глубоко, сильно, profoundly` (English leaked into the Russian gloss) | `глубоко, сильно` |
| `Serial` | `["serial number","serial killer","serial killer","serial publication"]` | `["serial number","serial killer","serial publication"]` |
| `Coherence` | C2 | C1 (the word is advanced but not mastery-level) |

Also corrected: `Answered` removed because `Answer` already existed; `Born` changed from verb to adjective; `Football` defined as the game called “soccer” in the US; `Breathtaking` and `Stunning` no longer share an identical definition and example.

## Remaining uncertainty

- **dictionaryapi.dev coverage is partial.** 425 final requests were rate-limited and 23 headwords are absent from that API. Datamuse covered all headwords, but Datamuse definitions are Wiktionary-derived and occasionally archaic or encyclopedic. The final wording was editorially rewritten rather than copied.
- **CEFR is a judgement.** Borderline B2/C1 items were not exhaustively re-levelled. The 24 A2→B1 changes align the B1-core list; the 8 core words left at A2 were judged genuinely A2. C2 is deliberately small (3 entries: `Inconceivable`, `Indisputable`, `Unattainable`). The Academic Word List still supplies 305 C2 rows, so the C2 filter is not empty in the UI.
- **IPA notation is mixed British/American.** Only malformed IPA was fixed; some entries retain a rhotic `r` or an American vowel while others use British forms. A future pass could standardise on one variety.
- **Compound headwords** such as `Cellphone`, `Wastebasket` and `Skateboarding` are kept as single tokens. They are real dictionary headwords but could be split into collocations later.
- **No audio or Russian definitions** were added; `meaningRu` remains a concise gloss, not a full explanatory translation.
- **Academic rows were not reviewed.** The 506 Academic Word List entries are a separate source and were left unchanged; duplicated concepts across sources are possible.

## Reproduce

```bash
cd /Users/ilyan/Downloads/det-academy/det-academy
node scripts/generate_dictionary.mjs           # JSON -> SQL
node scripts/generate_dictionary.mjs --check   # validation + drift check
PGPASSWORD=postgres psql -h 127.0.0.1 -p 15999 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f backend/db/10-dictionary.sql

PGPASSWORD=postgres psql -h 127.0.0.1 -p 15999 -U postgres -d postgres \
  -c "select level, count(*) from vocabulary_entries where id like 'dict-%' group by level order by level;"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 15999 -U postgres -d postgres \
  -c "select source, level, count(*) from vocabulary_entries group by source, level order by source, level;"
```

`--check` output after the review:

```
dictionary ok (1432 entries, sha256 e34335a24e6c)
  levels: {"A2":297,"B2":463,"B1":494,"C1":175,"C2":3}
```
