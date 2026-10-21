#!/usr/bin/env python3
"""Regression tests for the calibration import/report/gate workflow."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [PYTHON, *args], cwd=ROOT, capture_output=True, text=True, check=False
    )


def write_pack(path: Path, items: int, low_agreement: bool = False) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for index in range(items):
            human = index % 6
            partner = (5 - human) if low_agreement else human
            model = human
            for rater, score in (("expert-a", human), ("expert-b", partner)):
                handle.write(
                    json.dumps(
                        {
                            "item_id": f"item-{index}",
                            "prompt": "Academic prompt",
                            "response": "Learner response",
                            "question_type": "WRITING_SAMPLE",
                            "rater_id": rater,
                            "score": score,
                            "model_score": model,
                            "adjudicated": human,
                        }
                    )
                    + "\n"
                )


class CalibrationWorkflowTest(unittest.TestCase):
    def test_fixture_is_reported_as_fixture(self) -> None:
        result = run("scripts/calibration_report.py")
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report["status"], "fixture_only")
        self.assertTrue(report["fixture"])

    def test_production_gate_blocks_fixture(self) -> None:
        blocked = run("scripts/calibration_validate.py", "--production")
        self.assertEqual(blocked.returncode, 1)
        allowed = run(
            "scripts/calibration_validate.py", "--production", "--allow-fixture"
        )
        self.assertEqual(allowed.returncode, 0, allowed.stderr)

    def test_two_rater_dataset_reports_agreement_and_passes_gate(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            pack = Path(directory) / "pack.jsonl"
            dataset = Path(directory) / "dataset.json"
            write_pack(pack, 60)
            imported = run(
                "scripts/calibration_import.py", str(pack), "--output", str(dataset)
            )
            self.assertEqual(imported.returncode, 0, imported.stderr)
            report = json.loads(
                run("scripts/calibration_report.py", str(dataset)).stdout
            )
            self.assertEqual(report["status"], "expert_dataset")
            self.assertEqual(report["raters"], 2)
            self.assertGreaterEqual(report["inter_rater_qwk"], 0.70)
            self.assertGreaterEqual(report["human_model_qwk"], 0.70)
            gate = run("scripts/calibration_validate.py", str(dataset), "--production")
            self.assertEqual(gate.returncode, 0, gate.stderr)

    def test_production_gate_blocks_weak_inter_rater_agreement(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            pack = Path(directory) / "pack.jsonl"
            dataset = Path(directory) / "dataset.json"
            write_pack(pack, 60, low_agreement=True)
            imported = run(
                "scripts/calibration_import.py", str(pack), "--output", str(dataset)
            )
            self.assertEqual(imported.returncode, 0, imported.stderr)
            gate = run("scripts/calibration_validate.py", str(dataset), "--production")
            self.assertEqual(gate.returncode, 1)
            self.assertIn("inter-rater QWK", gate.stderr)

    def test_import_rejects_single_rater_draft_by_default(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            pack = Path(directory) / "pack.jsonl"
            pack.write_text(
                json.dumps(
                    {
                        "item_id": "one",
                        "rater_id": "expert-a",
                        "score": 4,
                        "model_score": 4,
                    }
                )
                + "\n",
                encoding="utf-8",
            )
            result = run("scripts/calibration_import.py", str(pack))
            self.assertEqual(result.returncode, 1)
            self.assertIn("fewer than two raters", result.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
