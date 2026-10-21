#!/usr/bin/env python3
"""Inter-rater calibration report for speaking/writing rubric scores.

Input JSON: {"items":[{"human":0..5,"model":0..5}, ...]}
Outputs quadratic weighted kappa, Pearson correlation and a simple agreement
rate. This is a harness, not proof of calibration: real expert labels are
required before claiming the model is calibrated.
"""
import json
import math
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "backend/tests/fixtures/calibration_labels.json"
payload = json.load(open(path, encoding="utf-8"))
items = payload.get("items", [])
if not items:
    print("no calibration items", file=sys.stderr)
    sys.exit(1)

human = [int(item["human"]) for item in items]
model = [int(item["model"]) for item in items]
labels = sorted(set(human + model))
index = {label: i for i, label in enumerate(labels)}
n = len(labels)
observed = [[0] * n for _ in range(n)]
for h, m in zip(human, model):
    observed[index[h]][index[m]] += 1
total = len(items)

row = [sum(observed[i]) for i in range(n)]
col = [sum(observed[i][j] for i in range(n)) for j in range(n)]
expected = [[row[i] * col[j] / total for j in range(n)] for i in range(n)]

weighted_observed = 0.0
weighted_expected = 0.0
for i in range(n):
    for j in range(n):
        weight = ((i - j) ** 2) / ((n - 1) ** 2) if n > 1 else 0
        weighted_observed += weight * observed[i][j]
        weighted_expected += weight * expected[i][j]
qwk = 1 - (weighted_observed / weighted_expected) if weighted_expected else 0.0

mean_h = sum(human) / total
mean_m = sum(model) / total
cov = sum((h - mean_h) * (m - mean_m) for h, m in zip(human, model))
var_h = sum((h - mean_h) ** 2 for h in human)
var_m = sum((m - mean_m) ** 2 for m in model)
pearson = cov / math.sqrt(var_h * var_m) if var_h and var_m else 0.0
agreement = sum(1 for h, m in zip(human, model) if h == m) / total

print(json.dumps({
    "items": total,
    "quadratic_weighted_kappa": round(qwk, 4),
    "pearson": round(pearson, 4),
    "exact_agreement": round(agreement, 4),
    "status": "fixture_only" if payload.get("fixture", True) else "expert_dataset",
}, indent=2))
