#!/usr/bin/env python3
"""Build a calibration dataset from one row per (item, rater).

Input is JSONL:
  {"item_id":"resp-1","prompt":"...","response":"...","question_type":"WRITING_SAMPLE",
   "rater_id":"expert-a","score":4,"model_score":4}

Two raters per item are required unless --allow-incomplete is used. Duplicate
(item, rater) rows, out-of-range scores and conflicting model scores are rejected.
"""
from __future__ import annotations

import argparse
import json
import statistics
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"line {line_number}: invalid JSON: {error}") from error
            rows.append(row)
    return rows


def build_dataset(rows: list[dict], rubric: str, version: str, allow_incomplete: bool) -> dict:
    grouped: dict[str, dict] = {}
    for row in rows:
        item_id = str(row.get("item_id", "")).strip()
        rater_id = str(row.get("rater_id", "")).strip()
        if not item_id or not rater_id:
            raise ValueError("every row needs item_id and rater_id")
        score = row.get("score")
        if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 5:
            raise ValueError(f"{item_id}/{rater_id}: score must be an integer from 0 to 5")
        item = grouped.setdefault(
            item_id,
            {
                "id": item_id,
                "prompt": row.get("prompt", ""),
                "response": row.get("response", ""),
                "question_type": row.get("question_type", ""),
                "raters": {},
                "model": None,
                "adjudicated": None,
            },
        )
        if rater_id in item["raters"]:
            raise ValueError(f"{item_id}: duplicate rating from {rater_id}")
        item["raters"][rater_id] = score
        if row.get("model_score") is not None:
            model_score = row["model_score"]
            if not isinstance(model_score, int) or isinstance(model_score, bool) or not 0 <= model_score <= 5:
                raise ValueError(f"{item_id}: model_score must be an integer from 0 to 5")
            if item["model"] is not None and item["model"] != model_score:
                raise ValueError(f"{item_id}: conflicting model_score values")
            item["model"] = model_score
        if row.get("adjudicated") is not None:
            adjudicated = row["adjudicated"]
            if not isinstance(adjudicated, int) or isinstance(adjudicated, bool) or not 0 <= adjudicated <= 5:
                raise ValueError(f"{item_id}: adjudicated must be an integer from 0 to 5")
            if item["adjudicated"] is not None and item["adjudicated"] != adjudicated:
                raise ValueError(f"{item_id}: conflicting adjudicated values")
            item["adjudicated"] = adjudicated

    if not grouped:
        raise ValueError("no rows found")
    if not allow_incomplete:
        incomplete = [item_id for item_id, item in grouped.items() if len(item["raters"]) < 2]
        if incomplete:
            raise ValueError(
                "items with fewer than two raters (use --allow-incomplete for annotation drafts): "
                + ", ".join(incomplete[:10])
            )

    for item in grouped.values():
        if item["adjudicated"] is None:
            item["adjudicated"] = int(round(statistics.median(item["raters"].values())))
        if item["model"] is None:
            item.pop("model")
    rater_ids = sorted({rater for item in grouped.values() for rater in item["raters"]})
    return {
        "rubric": rubric,
        "version": version,
        "fixture": False,
        "provenance": {
            "imported_at": datetime.now(timezone.utc).isoformat(),
            "rows": len(rows),
            "items": len(grouped),
            "raters": rater_ids,
        },
        "items": list(grouped.values()),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="JSONL with one row per item/rater")
    parser.add_argument("--output", type=Path, default=Path("calibration_dataset.json"))
    parser.add_argument("--rubric", default="speaking_writing_0_5")
    parser.add_argument("--version", default="2026.1")
    parser.add_argument("--allow-incomplete", action="store_true")
    args = parser.parse_args()

    try:
        dataset = build_dataset(
            read_jsonl(args.input), args.rubric, args.version, args.allow_incomplete
        )
    except ValueError as error:
        print(f"BLOCKED: {error}", file=sys.stderr)
        return 1

    args.output.write_text(json.dumps(dataset, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(args.output),
                "items": len(dataset["items"]),
                "raters": dataset["provenance"]["raters"],
                "fixture": dataset["fixture"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
