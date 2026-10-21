#!/usr/bin/env python3
"""Gate that prevents a fixture from being presented as production calibration."""
import argparse
import json
import subprocess
import sys

parser = argparse.ArgumentParser()
parser.add_argument("dataset", nargs="?", default="backend/tests/fixtures/calibration_labels.json")
parser.add_argument("--production", action="store_true")
parser.add_argument("--allow-fixture", action="store_true")
parser.add_argument("--min-kappa", type=float, default=0.70)
args = parser.parse_args()

report = subprocess.run(
    [sys.executable, "scripts/calibration_report.py", args.dataset],
    check=True,
    capture_output=True,
    text=True,
)
data = json.loads(report.stdout)
print(json.dumps(data, indent=2))

if data["status"] != "expert_dataset" and args.production and not args.allow_fixture:
    print("BLOCKED: fixture-only dataset cannot be used for production calibration", file=sys.stderr)
    sys.exit(1)
if data["quadratic_weighted_kappa"] < args.min_kappa:
    print(f"BLOCKED: QWK {data['quadratic_weighted_kappa']} is below {args.min_kappa}", file=sys.stderr)
    sys.exit(1)
if args.production and data["items"] < 50 and not args.allow_fixture:
    print(f"BLOCKED: only {data['items']} labeled items; need at least 50", file=sys.stderr)
    sys.exit(1)
print("calibration gate passed")
