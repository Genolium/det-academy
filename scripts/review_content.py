#!/usr/bin/env python3
"""Editorial review checks for the seeded question bank."""
import json
import re
import sys
from collections import Counter, defaultdict

path = sys.argv[1] if len(sys.argv) > 1 else "backend/db/03-content-seed.sql"
text = open(path, encoding="utf-8").read()
errors = []
warnings = []

rows = []
for block in text.split("INSERT INTO questions")[1:]:
    lines = block.splitlines()
    try:
        values_index = next(i for i, line in enumerate(lines) if line.strip().startswith("VALUES"))
    except StopIteration:
        continue
    payload_lines = []
    for line in lines[values_index + 1:]:
        stripped = line.strip()
        if stripped.startswith("'") and stripped.endswith("',"):
            payload_lines.append(stripped[1:-2].replace("''", "'"))
        elif stripped.startswith("'") and stripped.endswith("'"):
            payload_lines.append(stripped[1:-1].replace("''", "'"))
        if len(payload_lines) >= 3 and stripped.rstrip(',').isdigit():
            limit = int(stripped.rstrip(','))
            active = "TRUE" in block
            rows.append((payload_lines[0], payload_lines[1], payload_lines[2], payload_lines[3], payload_lines[4], str(limit), "TRUE" if active else "FALSE"))
            break
if not rows:
    errors.append("no question rows found")

ids = [row[0] for row in rows]
for item, count in Counter(ids).items():
    if count > 1:
        errors.append(f"duplicate question id: {item}")

by_type = defaultdict(int)
for qid, qtype, difficulty, payload_raw, correct_raw, limit, active in rows:
    by_type[qtype] += 1
    try:
        payload = json.loads(payload_raw.replace("''", "'"))
        correct = json.loads(correct_raw.replace("''", "'"))
    except json.JSONDecodeError as exc:
        errors.append(f"{qid}: invalid JSON: {exc}")
        continue
    if not payload:
        errors.append(f"{qid}: empty content payload")
    if qtype == "C_TEST":
        tokens = payload.get("damagedTokens", [])
        answers = correct.get("answers", [])
        if len(tokens) != len(answers):
            errors.append(f"{qid}: C-Test token/answer count mismatch")
        for index, (token, answer) in enumerate(zip(tokens, answers)):
            word = f"{token.get('prefix','')}{answer}"
            if len(answer) != token.get("missingLength"):
                errors.append(f"{qid}: token {index} length mismatch")
            if not re.match(r"^[A-Za-z][A-Za-z'-]*$", word):
                errors.append(f"{qid}: token {index} forms invalid word {word!r}")
    if qtype == "INTERACTIVE_READING":
        for key in ("titleQuestion", "mainIdeaQuestion"):
            question = payload.get(key)
            if not isinstance(question, dict):
                continue
            options = question.get("options", [])
            idx = question.get("correctIndex")
            if not options or idx is None or idx < 0 or idx >= len(options):
                errors.append(f"{qid}: {key} has invalid correctIndex")
            if len(set(options)) != len(options):
                warnings.append(f"{qid}: {key} has duplicate options")
    if qtype == "INTERACTIVE_LISTENING":
        turns = payload.get("turns", [])
        answers = correct.get("turnsAnswers", [])
        if len(turns) != len(answers):
            errors.append(f"{qid}: listening turn/answer mismatch")
        for index, turn in enumerate(turns):
            options = turn.get("options", [])
            idx = turn.get("correctIndex")
            if not options or idx is None or idx < 0 or idx >= len(options):
                errors.append(f"{qid}: turn {index} has invalid correctIndex")
    if int(limit) <= 0:
        errors.append(f"{qid}: non-positive time limit")

required = {
    "READ_SELECT": 6, "FILL_BLANKS": 3, "C_TEST": 1, "LISTEN_TYPE": 1,
    "INTERACTIVE_READING": 2, "INTERACTIVE_LISTENING": 2, "WRITE_PHOTO": 1,
    "INTERACTIVE_WRITING": 1, "SPEAK_PHOTO": 1, "READ_THEN_SPEAK": 1,
    "INTERACTIVE_SPEAKING": 1, "WRITING_SAMPLE": 1, "SPEAKING_SAMPLE": 1,
}
for qtype, minimum in required.items():
    if by_type[qtype] < minimum:
        errors.append(f"{qtype}: only {by_type[qtype]} questions, need {minimum}")

for warning in warnings:
    print(f"WARN: {warning}")
for error in errors:
    print(f"ERROR: {error}")
print(f"reviewed {len(rows)} questions; errors={len(errors)} warnings={len(warnings)}")
sys.exit(1 if errors else 0)
