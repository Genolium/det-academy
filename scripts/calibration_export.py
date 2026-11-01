#!/usr/bin/env python3
"""Export consented speaking/writing responses as an annotation pack.

Only responses from users with an active calibration consent are selected. The
output is JSONL with model scores and empty human labels. Two independent
experts must add one row per item (rater_id + score), then calibration_import.py
builds the dataset and calibration_validate.py gates production use.

Privacy rules enforced here:
  * join calibration_consents on revoked_at IS NULL and the current version;
  * never select user_id, email or name;
  * replace item/question ids with salted hashes;
  * copy audio under hashed filenames into --audio-dir (optional).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from urllib.parse import unquote, urlparse

QUESTION_TYPES = (
    "WRITING_SAMPLE",
    "WRITE_PHOTO",
    "SPEAK_PHOTO",
    "READ_THEN_SPEAK",
    "SPEAKING_SAMPLE",
    "INTERACTIVE_WRITING",
    "INTERACTIVE_SPEAKING",
)

CONSENT_VERSION = "2026-10-29"

SQL = """
WITH candidates AS (
  SELECT
    qr.id AS item_id,
    qr.question_id,
    qr.user_response,
    qr.created_at,
    CASE COALESCE(e.question_type, q.type)
      WHEN 'WRITE_ABOUT_PHOTO' THEN 'WRITE_PHOTO'
      WHEN 'SPEAK_ABOUT_PHOTO' THEN 'SPEAK_PHOTO'
      ELSE COALESCE(e.question_type, q.type)
    END AS question_type,
    COALESCE(
      q.content_payload->>'prompt',
      q.content_payload->>'scenario',
      concat_ws(' ', q.content_payload->>'part1Prompt', q.content_payload->>'part2Prompt'),
      ''
    ) AS prompt,
    e.transcript,
    e.score,
    e.cefr_level,
    e.provider,
    e.evaluator_version,
    COALESCE(e.audio_url, '') AS audio_url
  FROM question_responses qr
  JOIN questions q ON q.id = qr.question_id
  JOIN test_sessions ts ON ts.id = qr.session_id
  JOIN calibration_consents cc ON cc.user_id = ts.user_id
  LEFT JOIN evaluations e
    ON e.session_id = qr.session_id
   AND e.question_id = qr.question_id
  WHERE cc.revoked_at IS NULL
    AND cc.consent_version = '{consent_version}'
    AND qr.created_at >= cc.granted_at
)
SELECT json_build_object(
  'item_id', item_id,
  'question_id', question_id,
  'question_type', question_type,
  'prompt', prompt,
  'response', CASE
    WHEN transcript IS NOT NULL AND btrim(transcript) <> '' THEN transcript
    WHEN question_type = 'INTERACTIVE_WRITING' THEN concat_ws(E'\\n\\n', user_response->>'part1', user_response->>'part2')
    WHEN question_type IN ('WRITE_PHOTO', 'WRITING_SAMPLE') THEN COALESCE(user_response->>'text', '')
    WHEN question_type IN ('SPEAK_PHOTO', 'READ_THEN_SPEAK', 'INTERACTIVE_SPEAKING', 'SPEAKING_SAMPLE') THEN COALESCE(user_response->>'transcript', '')
    ELSE COALESCE(user_response->>'text', user_response->>'response', '')
  END,
  'model_score', CASE WHEN score IS NULL THEN NULL ELSE LEAST(5, GREATEST(0, ROUND(score * 5)::int)) END,
  'model_raw_score', score,
  'cefr', cefr_level,
  'provider', provider,
  'evaluator_version', evaluator_version,
  'audio_url', audio_url
)::text
FROM candidates
WHERE question_type IN ({types})
ORDER BY created_at DESC
LIMIT {limit};
"""


def stable_hash(salt: str, prefix: str, value: str) -> str:
    digest = hashlib.sha256(f"{salt}:{prefix}:{value}".encode("utf-8")).hexdigest()
    return f"{prefix}_{digest[:32]}"


def audio_basename(url: str) -> str:
    parsed = urlparse(url)
    return unquote(os.path.basename(parsed.path))


EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
PHONE_RE = re.compile(r"(?<![\w])\+?\d[\d\s().-]{7,}\d(?![\w])")


def redact_pii(text: str | None) -> str | None:
    """Remove common direct identifiers from learner-authored text.

    The export is still reviewed before release; this is a defense-in-depth
    filter, not a replacement for the consent and review process.
    """
    if not text:
        return text
    redacted = EMAIL_RE.sub("[email]", text)
    redacted = URL_RE.sub("[url]", redacted)
    redacted = PHONE_RE.sub("[phone]", redacted)
    return redacted


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database-url", default=os.environ.get("DATABASE_URL", ""))
    parser.add_argument("--output", default="calibration_annotation_pack.jsonl")
    parser.add_argument("--limit", type=int, default=200)
    parser.add_argument(
        "--salt",
        default=os.environ.get("CALIBRATION_ID_SALT", ""),
        help="Salt for id hashing. Defaults to $CALIBRATION_ID_SALT, or a random value per run.",
    )
    parser.add_argument("--consent-version", default=CONSENT_VERSION)
    parser.add_argument(
        "--audio-dir",
        default="",
        help="Destination directory for exported audio copies.",
    )
    parser.add_argument(
        "--audio-source",
        default="",
        help="Directory containing stored audio files. Defaults to --audio-dir.",
    )
    args = parser.parse_args()

    if not args.database_url:
        print("DATABASE_URL or --database-url is required", file=sys.stderr)
        return 1
    if not shutil.which("psql"):
        print("psql is required", file=sys.stderr)
        return 1

    salt = args.salt or uuid.uuid4().hex
    generated_salt = not args.salt
    types = ", ".join(f"'{value}'" for value in QUESTION_TYPES)
    query = SQL.format(types=types, limit=args.limit, consent_version=args.consent_version)
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
        print(
            "no consented speaking/writing responses found (check calibration_consents)",
            file=sys.stderr,
        )
        return 1

    audio_out = Path(args.audio_dir) if args.audio_dir else None
    source_dir = Path(args.audio_source) if args.audio_source else audio_out
    if audio_out:
        audio_out.mkdir(parents=True, exist_ok=True)
    if source_dir is None:
        source_dir = Path(".")

    exported = []
    copied_audio = 0
    missing_audio = 0
    for row in rows:
        item_id = stable_hash(salt, "item", row["item_id"])
        audio_file = None
        audio_url = row.pop("audio_url", "")
        if audio_out and audio_url:
            source_name = audio_basename(audio_url)
            source = source_dir / source_name
            if source.is_file():
                suffix = source.suffix or ".bin"
                target_name = f"{item_id}{suffix}"
                shutil.copy2(source, audio_out / target_name)
                audio_file = target_name
                copied_audio += 1
            else:
                missing_audio += 1
        exported.append(
            {
                "item_id": item_id,
                "question_id": stable_hash(salt, "question", row.pop("question_id", "")),
                "question_type": row.pop("question_type"),
                "prompt": row.pop("prompt"),
                "response": redact_pii(row.pop("response")),
                "model_score": row.pop("model_score"),
                "model_raw_score": row.pop("model_raw_score"),
                "cefr": row.pop("cefr"),
                "provider": row.pop("provider"),
                "evaluator_version": row.pop("evaluator_version"),
                "audio_file": audio_file,
            }
        )

    with open(args.output, "w", encoding="utf-8") as handle:
        handle.write(
            "# Add two independent rater rows per item: "
            '{"item_id":...,"rater_id":"expert-a","score":0..5}\n'
        )
        for row in exported:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    summary = {
        "output": args.output,
        "items": len(exported),
        "consent_version": args.consent_version,
        "audio_copied": copied_audio,
        "audio_missing": missing_audio,
        "next": "Two raters label every item, then run scripts/calibration_import.py",
    }
    if generated_salt:
        summary["salt_generated"] = salt
        summary["warning"] = (
            "Keep this salt to reproduce item ids. Without it, a new export gets new hashes."
        )
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
