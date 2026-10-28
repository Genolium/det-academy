# University data audit — DET thresholds

**Audited:** 2026-10-28
**Dataset:** working tree, `src/data/*.json` (no external re-scrape)
**Command:** `node scripts/verify_institutions.mjs --check`
**Result:** 0 structural errors, 33 warnings, exit code 0

This audit answers one question honestly: **which DET thresholds in the catalogue are backed by evidence, and which are platform estimates or unknown?** It does not replace missing thresholds with new numbers, and it does not treat the DET registry as a threshold source — the registry publishes acceptance, not minimum scores.

## Summary

| Item | Count |
| --- | ---: |
| Registry institutions (rows) | 4,087 |
| Unique registry ids | 4,087 |
| Unique institution names | 4,083 |
| Registry-listed as accepting DET | 4,087 |
| Programs that fulfil the DET requirement | 3,960 |
| Institutions with supplementary-only programs | 127 |
| **Thresholds verified by an institution-specific source** | **0** |
| **Platform estimates (registry rows)** | **1,399** |
| **Platform estimates (unique metadata keys)** | **1,398** |
| **Unknown — no threshold** | **2,688 rows / 2,685 names** |
| **Thresholds backed by the DET registry page** | **0** |
| `acceptanceRate` values with a source | 0 / 1,398 |
| `category` values with a source | 0 / 1,398 |
| Rows with a location row | 2,187 / 4,087 |
| Rows with a verified coordinate | 2,187 / 4,087 |
| Rows with a city | 1,980 / 4,087 |
| Duplicate name + country groups | 3 |
| Structural errors | 0 |

The one-row difference between 1,398 metadata keys and 1,399 covered rows is `University of Indianapolis`, which appears twice in the registry with two different ids. Both rows inherit the same metadata key.

### What the numbers mean

- **0 thresholds are verified.** No row has an institution-specific URL plus a checked date. The registry URL proves only that the institution is listed and whether its programs fulfil the requirement.
- **1,398 threshold records are platform estimates.** They have `minScore` values but no threshold evidence. They are now explicitly stamped as estimates in the data.
- **2,688 rows are unknown.** They have no `minScore`; they must stay unknown, not `0` and not an invented band. No metadata entry stores `minScore: 0`; absence is the only unknown representation.
- **The registry is not a threshold source.** A live check of the registry endpoint (`/data/institution_search`) returns `account_id`, `account_name`, `programs[]`, `use_case`, and links. It contains no minimum score.
- **127 institutions are listed with supplementary-only programs.** Their `fulfillsRequirement` is `false`; this must not be presented as “DET fulfils the requirement here.”

## Provenance now stored in the data

Every one of the 1,398 entries in `src/data/institution-metadata.json` now carries:

```json
"requirementVerified": false,
"requirementStatus": "platform-estimate",
"requirementSource": null,
"requirementCheckedAt": null
```

Rules enforced by `scripts/verify_institutions.mjs`:

1. `requirementVerified: true` requires **all** of:
   - a valid `http(s)` `requirementSource` URL;
   - a real `YYYY-MM-DD` `requirementCheckedAt` date, not in the future;
   - a source that is **not** the DET registry, because the registry does not publish thresholds.
2. A verified claim with a missing/invalid source or date is a structural error.
3. A registry URL stored as `requirementSource` never counts as threshold evidence.
4. `platform-estimate` means `minScore > 0` without complete evidence.
5. `unknown` means no `minScore`; it is never an error.
6. Dates older than two years produce a warning, not a failure.

No entry in the data files was marked `requirementVerified: true` before this audit, so there was no false “verified” flag to downgrade. What was missing was explicit provenance; that is now recorded.

## Remaining honesty leak in the runtime catalogue (not edited here)

The data is honest, but `src/lib/institution-catalog.ts` still stamps every row with:

```ts
requirementSource: DET_REGISTRY_URL,
requirementCheckedAt: REQUIREMENT_CHECKED_AT,
requirementVerified: false,
```

`UniversityMatchWidget.tsx` then renders “checked 2026-10-21” and a **Source** link whenever those fields exist, even when `requirementVerified` is `false` (around lines 341–344 and 362–370). A reader can therefore see an unverified estimate next to a registry link and a checked date.

Recommended follow-up by the owner of that file:

- read `requirementSource`, `requirementCheckedAt`, and `requirementVerified` from `institution-metadata.json`;
- do not use the registry URL as the threshold source;
- show the source link only when `requirementVerified === true`, or label it explicitly as “registry listing, not a threshold source”;
- keep the existing “platform reference” copy for estimates.

This file was outside this subagent’s ownership, so it was not changed.

## Score data quality

All 1,398 scores are valid 5-point DET bands between 10 and 160. No invalid value, negative value, or 0 was found. The distribution is narrow:

| `minScore` | Entries |
| ---: | ---: |
| 95 | 1 |
| 100 | 2 |
| 105 | 248 |
| 110 | 341 |
| 115 | 351 |
| 120 | 350 |
| 125 | 97 |
| 130 | 8 |

There are no values above 130. This pattern is consistent with a platform heuristic, not with a collection of institution-published thresholds. The audit cannot establish where the numbers came from; it only establishes that no source is recorded.

- All 1,398 entries have `subscoreReqs` prose: 1,397 Russian, 1 English (`Johns Hopkins University`).
- All 1,398 entries have at least one numeric subscore.
- In 14 entries every subscore equals `minScore`.
- The prose occasionally names a higher competitive score than `minScore` (8 entries, e.g. Stanford says 125+ while `minScore` is 120). Prose is display copy, not structured evidence.

## Acceptance rates and categories are also unsourced

These are not DET thresholds, but they are displayed in the same cards and must not be mistaken for verified facts.

- **1,398 `acceptanceRate` values**, no source field, no checked date. The values range from 3.4% to 88%. Some conflict sharply with widely published figures, but this audit did not substitute another unsourced number. Treat all of them as editorial estimates; remove them or source them individually.
- **1,398 `category` values** across nine labels (`National University` 497, `Liberal Arts` 432, `Public University` 180, `Top Global` 149, `Public Research` 121, `Top STEM` 7, `Ivy League` 6, `Community College` 5, `Private Research` 1). These are editorial labels, not registry facts; for example MIT is classified as `National University`, not `Top STEM`.
- The script warns on both fields on every run so they cannot silently become “verified”.

## Geography and identity checks

### Coordinates

All 2,185 coordinate rows have a title, Wikipedia source URL, and Wikidata id. Latitude/longitude are finite, inside valid ranges, and none is `0,0`.

Problems that remain:

- **23 coordinate titles share no distinctive word with the institution name.** Most are translations or renames (`University of Padova` → `University of Padua`), but at least these five point at a place rather than a campus:
  - `Mayen` — registry country Turkey; coordinate and location point to Mayen, Germany. This is a wrong-entity match, not just a city-centre coordinate.
  - `New Garden Friends School` — title `Greensboro, North Carolina` (city centre).
  - `Mount Hutt College` — title `Methven, New Zealand` (town).
  - `Eikei University of Hiroshima` — title `Hiroshima Prefecture` (prefecture centroid).
  - `Fei Tian College` — title `Dragon Springs` (site, not the college article).
- **7 coordinate pairs are shared by two institutions** (usually an old and a new name, e.g. `Mount Marty College` / `Mount Marty University`). This is reported as a note, not an error.
- Coordinates were not edited: they live in `verified-university-coordinates.json`, which is outside this subagent’s files and needs human confirmation.

### Registry country vs English location

All 4,087 registry country values are Russian (e.g. `Соединенные Штаты`) because the registry was scraped with `ui_language=ru`. This is allowed for the registry field, but it must never be rendered as an English-only field. The English display map already exists in `src/lib/countryNames.ts`.

- **12 location rows were Cyrillic and have been fixed** to the same English names used by the rest of the file: `Италия` → `Italy`, `Сингапур` → `Singapore`, `Польша` → `Poland`, `Швейцария` → `Switzerland`.
- **42 institutions have a registry country that differs from the English location country.** Some are legitimate multi-country programmes (Georgetown Qatar vs US main campus, Puerto Rico vs United States, Hong Kong vs mainland China); others are data errors. Examples: `Cornell University` (registry China, location United States), `Mayen` (registry Turkey, location Germany), `Queen's University Belfast` (registry China, location United Kingdom). These need a human decision about which campus the row describes.

### Locations and names

- 1,900 institutions have no location row and no coordinate, so they cannot appear on the map.
- 207 location rows have an empty city.
- 3 groups share a name in the same country: `CUNY School of Professional Studies`, `University of Indianapolis`, `Fulbright University Vietnam`. Ids are unique, so all rows are preserved. Fixing this requires a registry-side merge, not deletion.
- 4 names repeat overall; `Capital College` appears in Canada and Australia and is legitimately different.

These duplicate names are warnings, not CI failures: ids are unique and no row is lost, and a merge would require a human/registry decision. `--check` keeps the warning visible without blocking unrelated CI work.

### Websites

- 3,863 rows have a website URL; 224 do not.
- 3,845 unique URLs.
- 97 values have no scheme (e.g. `www.csulb.edu/international`); the catalogue normalizer adds `https://`.
- 1 value was malformed (`https:www.westminster.edu/...`); it normalizes to a valid URL, but the raw value should be corrected at the source.
- An online sample of 25 URLs on 2026-10-28 found **16 ok, 2 blocked (bot protection or method restrictions), 5 dead 404, 2 unreachable (503/timeout)**. Dead examples: `admissions.tamu.edu/apply/international/international-freshman`, `wqu.org/apply`, `plymouthart.ac.uk/international-students/`. A sample is not proof about all 3,845 URLs; run `--online --all` for a full pass.

## Fields that still need a human

| Field / area | Rows | Why a human is needed | Acceptable evidence |
| --- | ---: | --- | --- |
| `minScore` + four subscores | 1,398 | Platform estimates with no source | Institution admissions page that states the DET requirement, URL + `YYYY-MM-DD` |
| `subscoreReqs` prose | 1,398 | Free text, mixed languages, sometimes mentions a different score | Same page, or remove the claim |
| Unknown thresholds | 2,688 | No score at all; must not be invented | Only add after a source is captured |
| `acceptanceRate` | 1,398 | No source; several values implausible | Official admissions statistics, or remove |
| `category` | 1,398 | Editorial label, not a registry fact | Keep as editorial or remove |
| Location city/state/country | 2,185 rows; 1,900 missing | 207 empty cities; 42 registry/location country conflicts | Campus address or official contact page |
| Coordinates | 2,185 | 23 title mismatches, 5 place-like matches, 7 shared pairs | Campus coordinate from the institution or a verified map source |
| Duplicate names | 3 groups | Cannot merge or delete without a source decision | Registry confirmation of the surviving id |
| Supplementary-only programmes | 127 | Listing does not mean the DET fulfils the requirement | Program-level `use_case` check |
| Website URLs | 3,863 | 224 missing; sampled 404s | Working official URL |

The minimum acceptable evidence format is: **source URL + checked date + a short note of what the page says.** A link to the DET registry alone is not evidence for a threshold.

## Top 50 institutions to verify first

**Method.** There is no product search-analytics export in the repo, so this list uses a public-attention proxy:

1. Candidate pool: the 90 institutions with the most Wikidata sitelinks among the 2,178 rows that have a verified coordinate/Wikidata item.
2. Rank: **median monthly English Wikipedia pageviews** over 2025-10-01…2026-09-30. Median is used instead of the 12-month total so a single viral month cannot dominate the list. (For example, Brown University’s total is inflated by a 518,903-view December 2025 spike; its median is 47,077.)
3. Known place-article matches were excluded from consideration. Three were inside this candidate pool: New Garden Friends School (Greensboro), Mount Hutt College (Methven), and Eikei University (Hiroshima Prefecture). Mayen (Mayen, Germany) and Fei Tian College (Dragon Springs) were outside the top 90 but are also known place matches.
4. This is **not** app traffic and **not** an institutional-quality ranking. Replace it with real product search analytics when available.

Of these 50, **41 have a platform estimate and 9 have no threshold at all**. None is verified.

| # | Institution | Country | Current DET | Status | Median monthly views |
| ---: | --- | --- | ---: | --- | ---: |
| 1 | Harvard University | United States | 125+ | platform estimate | 125,137 |
| 2 | Stanford University | United States | 120+ | platform estimate | 78,644 |
| 3 | Columbia University in the City of New York | United States | unknown | unknown | 69,975 |
| 4 | Yale University | United States | 120+ | platform estimate | 66,013 |
| 5 | University of Pennsylvania | United States | 115+ | platform estimate | 62,170 |
| 6 | Massachusetts Institute of Technology | United States | 105+ | platform estimate | 61,231 |
| 7 | Princeton University | United States | 125+ | platform estimate | 57,464 |
| 8 | Dartmouth College | United States | 130+ | platform estimate | 51,757 |
| 9 | University of California, Berkeley | United States | 120+ | platform estimate | 49,885 |
| 10 | Northwestern University | United States | 110+ | platform estimate | 48,793 |
| 11 | Cornell University | United States | 130+ | platform estimate | 47,077 |
| 12 | Brown University | United States | 130+ | platform estimate | 47,077 |
| 13 | University of Southern California | United States | 105+ | platform estimate | 44,051 |
| 14 | New York University | United States | 105+ | platform estimate | 43,860 |
| 15 | Duke University | United States | 130+ | platform estimate | 42,297 |
| 16 | University of Notre Dame | United States | 120+ | platform estimate | 42,259 |
| 17 | University of Michigan - Ann Arbor | United States | 110+ | platform estimate | 41,967 |
| 18 | Carnegie Mellon University | United States | 120+ | platform estimate | 41,005 |
| 19 | United States Military Academy | United States | 125+ | platform estimate | 40,228 |
| 20 | University of California, Los Angeles | United States | 110+ | platform estimate | 39,096 |
| 21 | Texas A&M University | United States | 110+ | platform estimate | 38,266 |
| 22 | Georgetown University | United States | 130+ | platform estimate | 35,438 |
| 23 | Johns Hopkins University | United States | 130+ | platform estimate | 32,291 |
| 24 | Purdue University | United States | 105+ | platform estimate | 32,276 |
| 25 | University of Texas - Austin | United States | unknown | unknown | 31,189 |
| 26 | Vanderbilt University | United States | 130+ | platform estimate | 31,170 |
| 27 | The University of Chicago | United States | unknown | unknown | 30,822 |
| 28 | University College London | United Kingdom | unknown | unknown | 30,454 |
| 29 | London School of Economics and Political Science | United Kingdom | unknown | unknown | 30,271 |
| 30 | California Institute of Technology | United States | 120+ | platform estimate | 28,285 |
| 31 | The Pennsylvania State University | United States | unknown | unknown | 28,039 |
| 32 | The Ohio State University | United States | unknown | unknown | 27,957 |
| 33 | Boston University | United States | 120+ | platform estimate | 26,984 |
| 34 | University of Washington | United States | 105+ | platform estimate | 26,150 |
| 35 | University of Florida | United States | 120+ | platform estimate | 25,265 |
| 36 | University of Virginia | United States | 120+ | platform estimate | 23,992 |
| 37 | Syracuse University | United States | 115+ | platform estimate | 22,890 |
| 38 | Trinity College Dublin | Ireland | 120+ | platform estimate | 21,497 |
| 39 | Rice University | United States | 130+ | platform estimate | 21,078 |
| 40 | University of Toronto | Canada | 120+ | platform estimate | 19,162 |
| 41 | University of Wisconsin - Madison | United States | 120+ | platform estimate | 17,327 |
| 42 | University of Minnesota - Twin Cities | United States | 110+ | platform estimate | 17,309 |
| 43 | The University of Arizona | United States | unknown | unknown | 16,438 |
| 44 | York University | Canada | 110+ | platform estimate | 15,853 |
| 45 | University of California - San Diego | United States | 110+ | platform estimate | 15,643 |
| 46 | Durham University | United Kingdom | unknown | unknown | 14,651 |
| 47 | Peking University | People's Republic of China | 110+ | platform estimate | 14,194 |
| 48 | University of California - Davis | United States | 115+ | platform estimate | 13,862 |
| 49 | University of British Columbia | Canada | 110+ | platform estimate | 13,399 |
| 50 | Georgia Institute of Technology | United States | 110+ | platform estimate | 13,248 |

Note that the dataset does not contain a row named “University of Oxford”, “University of Cambridge”, “ETH Zurich”, or several other globally known universities; it contains constituent colleges such as `Lady Margaret Hall, University of Oxford`. This audit does not conclude that those universities reject the DET — only that they are not present under those names in this registry snapshot.

## Reproduce

Offline structural check (CI-safe, no network):

```bash
node scripts/verify_institutions.mjs --check
```

Full human-readable report with counts:

```bash
node scripts/verify_institutions.mjs
```

Machine-readable output:

```bash
node scripts/verify_institutions.mjs --check --json > /tmp/institution-audit.json
```

Opt-in network check (sample, then all):

```bash
node scripts/verify_institutions.mjs --check --online --sample=50
node scripts/verify_institutions.mjs --check --online --all --concurrency=12
```

Exit codes:

| Code | Meaning |
| ---: | --- |
| 0 | No structural errors. Unknown thresholds are not an error. |
| 1 | Structural errors, or dead URLs when `--online` was explicitly enabled. Only returned with `--check`. |
| 2 | Inputs could not be read/parsed, or invalid arguments. |

Minimal CI step:

```yaml
- name: Verify institution data
  run: node scripts/verify_institutions.mjs --check
```

`--online` is deliberately not part of the default CI step: it needs network access and some sites block bots. If a nightly job is added, use a sample and treat blocked/timeout as warnings; only 404/410 are dead URL errors.

## Files changed by this audit

| File | Change |
| --- | --- |
| `src/data/institution-metadata.json` | Added explicit provenance (`requirementVerified: false`, `requirementStatus: "platform-estimate"`, `requirementSource: null`, `requirementCheckedAt: null`) to all 1,398 entries. Scores were not changed. |
| `src/data/institution-locations.json` | Replaced 12 Cyrillic country labels with English (`Italy`, `Singapore`, `Poland`, `Switzerland`). No rows added or removed. |
| `scripts/verify_institutions.mjs` | New structural/provenance audit with `--check` and opt-in `--online` modes. |
| `docs/university-data-audit.md` | This document. |

`src/data/duolingoInstitutions.json` was not changed: it is the registry snapshot (acceptance/program data), and adding per-row threshold flags would duplicate the metadata keyed by name. No institution was deleted. No threshold, ranking, acceptance rate, or source URL was invented.

## Known limitations

- The registry was not re-scraped; this audit validates the committed snapshot, not today’s live registry.
- No threshold was checked against an institution website. That is the work the human verification queue above describes.
- Acceptance rates and categories were not sourced; they are flagged, not corrected.
- The online check uses HEAD (with a GET fallback) and cannot distinguish “dead” from “blocks bots”; 401/403/405/429 are warnings, 404/410 are errors, timeouts/5xx are warnings unless `--strict-online` is passed.
- The country comparison uses the Russian→English mapping in `src/lib/countryNames.ts`; if that map is missing, the comparison is skipped rather than guessed.
- Wikipedia pageviews are a public-attention proxy, not product analytics. The priority list covers the top 90 Wikidata sitelinks only, so a high-traffic institution outside that pool would not appear.
