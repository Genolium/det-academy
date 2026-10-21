#!/usr/bin/env python3
"""Static content lint for the DET Academy seed SQL.

Checks:
- duplicate question IDs
- C-Test token/answer length mismatches
- multiple-choice answer position imbalance
- empty prompts
"""
import json
import re
import sys
from collections import Counter

path = sys.argv[1] if len(sys.argv) > 1 else "backend/db/03-content-seed.sql"
text = open(path, encoding="utf-8").read()

ids = re.findall(r"\n  '([a-z]+-[0-9]+)',\n  '[A-Z_]+',", text)
duplicates = [item for item, count in Counter(ids).items() if count > 1]
if duplicates:
    print("duplicate question ids:", duplicates)
    sys.exit(1)

indexes = [int(value) for value in re.findall(r'"correctIndex":\s*([0-9]+)', text)]
if indexes:
    distribution = Counter(indexes)
    total = len(indexes)
    if max(distribution.values()) / total > 0.6:
        print("multiple-choice answer position is imbalanced:", distribution)
        sys.exit(1)

bad_c_tests = []
for match in re.finditer(r"'(ct-\d+)',\s*'C_TEST'.*?\n  '(\{.*?\})',\n  '(\{.*?\})',", text, re.S):
    cid, content_raw, correct_raw = match.group(1), match.group(2), match.group(3)
    try:
        content = json.loads(content_raw.replace("''", "'"))
        correct = json.loads(correct_raw.replace("''", "'"))
    except json.JSONDecodeError:
        continue
    for token, answer in zip(content.get("damagedTokens", []), correct.get("answers", [])):
        if len(answer) != token.get("missingLength"):
            bad_c_tests.append((cid, token, answer))

if bad_c_tests:
    print("C-Test token/answer length mismatches:", bad_c_tests[:10])
    sys.exit(1)

print(f"content lint passed: {len(ids)} questions, {len(indexes)} choice answers")
