#!/usr/bin/env python3
"""Export real speaking/writing responses as an annotation pack.

The output is JSONL with model scores and empty human labels. Two independent
experts must add one row per item (rater_id + score), then calibration_import.py
builds the dataset and calibration_validate.py gates production use.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

QUESTION_TYPES = (
    "WRITING_SAMPLE",
    "WRITE_ABOUT_PHOTO",
    "SPEAK_ABOUT_PHOTO",
    "READ_THEN_SPEAK",
    "SPEAKING_SAMPLE",
    "INTERACTIVE_WRITING",
    "INTERACTIVE_SPEAKING",
)

SQL = """
SELECT json_build_object(
  'item_id', qr.id,
  'question_id', qr.question_id,
  'question_type', COALESCE(e.question_type, q.type),
  'prompt', COALESCE(q.content_payload->>'prompt', q.content_payload->>'scenario', ''),
  'response', COALESCE(e.transcript, qr.user_response->>'text', qr.user_response->>'response', qr.user_response::text),
  'model_score', CASE WHEN e.score IS NULL THEN NULL ELSE LEAST(5, GREATEST(0, ROUND(e.score * 5)::int)) END,
  'model_raw_score', e.score,
  'cefr', e.cefr_level,
  'provider', e.provider,
  'evaluator_version', e.evaluator_version
)::text
FROM question_responses qr
JOIN questions q ON q.id = qr.question_id
LEFT JOIN evaluations e ON e.response_id = qr.id
WHERE COALESCE(e.question_type, q.type) IN ({types})
ORDER BY qr.created_at DESC
LIMIT {limit};
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database-url", default=os.environ.get("DATABASE_URL", ""))
    parser.add_argument("--output", default="calibration_annotation_pack.jsonl")
    parser.add_argument("--limit", type=int, default=200)
    args = parser.parse_args()

    if not args.database_url:
        print("DATABASE_URL or --database-url is required", file=sys.stderr)
        return 1
    if not shutil.which("psql"):
        print("psql is required", file=sys.stderr)
        return 1

    types = ", ".join(f"'{value}'" for value in QUESTION_TYPES)
    query = SQL.format(types=types, limit=args.limit)
    result = subprocess.run(
        ["psql", args.database_url, "-At", "-c", query],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        print(result.stderr.strip() or "psql export failed", file=sys.stderr)
        return 1

    rows = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
    if not rows:
        print("no speaking/writing responses found", file=sys.stderr)
        return 1

    with open(args.output, "w", encoding="utf-8") as handle:
        handle.write("# Add two independent rater rows per item: {\"item_id\":...,\"rater_id\":\"expert-a\",\"score\":0..5}\n")
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(
        json.dumps(
            {
                "output": args.output,
                "items": len(rows),
                "next": "Two raters label every item, then run scripts/calibration_import.py",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
