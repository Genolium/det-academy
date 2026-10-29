#!/usr/bin/env python3
"""Regression tests for the calibration import/report/gate workflow."""
from __future__ import annotations

import json
import os
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


class CalibrationExportTest(unittest.TestCase):
    """The exporter must never emit rows without an active consent."""

    def test_export_uses_consent_join_and_anonymizes_ids(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fake_bin = root / "bin"
            fake_bin.mkdir()
            query_file = root / "query.sql"
            rows_file = root / "rows.jsonl"
            audio_source = root / "audio-source"
            audio_source.mkdir()
            (audio_source / "raw-recording.webm").write_bytes(b"audio-bytes")

            rows_file.write_text(
                json.dumps(
                    {
                        "item_id": "11111111-1111-1111-1111-111111111111",
                        "question_id": "WRITING_SAMPLE_1",
                        "question_type": "WRITING_SAMPLE",
                        "prompt": "Write about a photo",
                        "response": "Learner text",
                        "model_score": 4,
                        "model_raw_score": 0.8,
                        "cefr": "B2",
                        "provider": "deepseek",
                        "evaluator_version": "v1",
                        "audio_url": "/uploads/audio/raw-recording.webm",
                        # Fake extras that must never survive the export.
                        "user_id": "user-secret",
                        "email": "learner@example.com",
                        "name": "Learner Name",
                    }
                )
                + "\n",
                encoding="utf-8",
            )
            psql = fake_bin / "psql"
            psql.write_text(
                "#!/bin/sh\n"
                f'printf "%s" "$4" > "{query_file}"\n'
                f'cat "{rows_file}"\n',
                encoding="utf-8",
            )
            psql.chmod(0o755)

            output = root / "pack.jsonl"
            audio_out = root / "audio-out"
            env = {
                **os.environ,
                "PATH": f"{fake_bin}{os.pathsep}{os.environ['PATH']}",
                "DATABASE_URL": "postgres://fake",
            }
            result = subprocess.run(
                [
                    PYTHON,
                    "scripts/calibration_export.py",
                    "--output",
                    str(output),
                    "--salt",
                    "test-salt",
                    "--audio-dir",
                    str(audio_out),
                    "--audio-source",
                    str(audio_source),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                check=False,
                env=env,
            )
            self.assertEqual(result.returncode, 0, result.stderr)

            query = query_file.read_text(encoding="utf-8")
            self.assertIn("JOIN calibration_consents", query)
            self.assertIn("cc.revoked_at IS NULL", query)
            self.assertIn("cc.consent_version = '2026-10-29'", query)
            self.assertNotIn("user_id", query.split("FROM")[0])
            self.assertNotIn("email", query.split("FROM")[0])

            payload = [
                json.loads(line)
                for line in output.read_text(encoding="utf-8").splitlines()
                if line and not line.startswith("#")
            ]
            self.assertEqual(len(payload), 1)
            item = payload[0]
            self.assertNotIn("user_id", item)
            self.assertNotIn("email", item)
            self.assertNotIn("name", item)
            self.assertNotEqual(item["item_id"], "11111111-1111-1111-1111-111111111111")
            self.assertTrue(item["item_id"].startswith("item_"))
            self.assertTrue(item["question_id"].startswith("question_"))
            self.assertEqual(item["audio_file"], f"{item['item_id']}.webm")
            self.assertTrue((audio_out / item["audio_file"]).is_file())
            summary = json.loads(result.stdout)
            self.assertEqual(summary["items"], 1)
            self.assertEqual(summary["audio_copied"], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
