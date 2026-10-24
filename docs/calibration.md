# AI calibration protocol

The fixture dataset is a harness smoke test, not evidence that the Speaking/Writing
evaluator is calibrated against the Duolingo English Test. Production claims are
blocked until all of the following are true:

- at least **50** real speaking/writing responses;
- at least **two independent expert raters** per item;
- an adjudicated human score (or a documented median rule);
- human–human quadratic weighted kappa **≥ 0.70**;
- human–model quadratic weighted kappa **≥ 0.70**;
- provenance recorded in the dataset (`fixture: false`, rater IDs, import time).

## Workflow

1. Export real responses from the production/test database:

   ```bash
   DATABASE_URL="postgres://..." python3 scripts/calibration_export.py \
     --limit 200 --output calibration_annotation_pack.jsonl
   ```

   The exporter only selects speaking/writing response types and includes the
   rule-based model score normalized to the 0–5 rubric.

2. Two experts label every item independently. Add one JSONL row per rater:

   ```json
   {"item_id":"...","rater_id":"expert-a","score":4}
   {"item_id":"...","rater_id":"expert-b","score":4}
   ```

   If the raters disagree, add an `adjudicated` score row or record the
   adjudication decision in the study notes.

3. Build the dataset:

   ```bash
   python3 scripts/calibration_import.py calibration_annotation_pack.jsonl \
     --output calibration_dataset.json
   ```

   The importer rejects scores outside 0–5, duplicate rater rows, conflicting
   model scores and (by default) items with fewer than two raters.

4. Report agreement:

   ```bash
   python3 scripts/calibration_report.py calibration_dataset.json
   ```

5. Enforce the production gate:

   ```bash
   python3 scripts/calibration_validate.py calibration_dataset.json --production
   ```

   A fixture or a single-rater draft exits with code 1. CI may use
   `--allow-fixture` only to test the harness itself; it must never be used for a
   production claim.

## Current status

The repository includes:
1. `backend/tests/fixtures/calibration_labels.json`: baseline 20-item smoke fixture.
2. `backend/tests/fixtures/calibration_expert_dataset.json`: synthetic 54-item validation fixture (`fixture: true`) with simulated rater profiles (`expert-rater-1`, `expert-rater-2`) to test inter-rater agreement arithmetic, writing/speaking subscore splitting, and harness mechanics.

> [!IMPORTANT]
> The synthetic 54-item dataset tests pipeline arithmetic and code contracts, but does **not** constitute empirical production calibration against Duolingo English Test standards. Production calibration claims remain **BLOCKED** until authenticated student responses with two accredited external raters are collected under informed consent.

### Synthetic Fixture Metrics (Harness Verification):
- **Items**: 54 (23 Writing items, 31 Speaking items);
- **Raters**: 2 simulated raters;
- **Inter-rater QWK**: **0.9523**;
- **Human–Model QWK (Overall)**: **0.9496**;
- **Writing Human–Model QWK**: **0.9654**;
- **Speaking Human–Model QWK**: **0.9363**;
- **Status**: `fixture_only` (`fixture: true`);
- **Harness gate**: **PASSED** (when evaluated with `--allow-fixture`).
