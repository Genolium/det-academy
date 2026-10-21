#!/usr/bin/env python3
"""Production gate for AI calibration.

It refuses to present a fixture, a single-rater dataset, or a dataset with weak
inter-rater agreement as evidence that the model is calibrated against DET.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys


def run_report(dataset: str) -> dict:
    result = subprocess.run(
        [sys.executable, "scripts/calibration_report.py", dataset],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr.strip() or "calibration report failed", file=sys.stderr)
        raise SystemExit(result.returncode)
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", nargs="?", default="backend/tests/fixtures/calibration_labels.json")
    parser.add_argument("--production", action="store_true")
    parser.add_argument("--allow-fixture", action="store_true")
    parser.add_argument("--min-items", type=int, default=50)
    parser.add_argument("--min-raters", type=int, default=2)
    parser.add_argument("--min-kappa", type=float, default=0.70)
    parser.add_argument("--min-inter-rater-kappa", type=float, default=0.70)
    args = parser.parse_args()

    data = run_report(args.dataset)
    print(json.dumps(data, indent=2, ensure_ascii=False))

    if args.production and not args.allow_fixture:
        if data["status"] != "expert_dataset":
            print(
                "BLOCKED: fixture/single-rater data cannot be used for production calibration",
                file=sys.stderr,
            )
            return 1
        if data["items"] < args.min_items:
            print(
                f"BLOCKED: only {data['items']} labeled items; need at least {args.min_items}",
                file=sys.stderr,
            )
            return 1
        if data["raters"] < args.min_raters:
            print(
                f"BLOCKED: only {data['raters']} raters; need at least {args.min_raters}",
                file=sys.stderr,
            )
            return 1
        if data["inter_rater_qwk"] is None or data["inter_rater_qwk"] < args.min_inter_rater_kappa:
            print(
                "BLOCKED: inter-rater QWK "
                f"{data['inter_rater_qwk']} is below {args.min_inter_rater_kappa}",
                file=sys.stderr,
            )
            return 1

    if data["human_model_qwk"] < args.min_kappa:
        print(
            f"BLOCKED: human-model QWK {data['human_model_qwk']} is below {args.min_kappa}",
            file=sys.stderr,
        )
        return 1

    print("calibration gate passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
