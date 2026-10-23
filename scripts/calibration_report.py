#!/usr/bin/env python3
"""Inter-rater calibration report for speaking/writing rubric scores.

The report distinguishes:
- human-human agreement between at least two expert raters;
- human-model agreement between the adjudicated human score and the model.

Input JSON: {"fixture": false, "items":[{"raters":{"a":4,"b":4},"model":4}, ...]}
The legacy fixture shape {"items":[{"human":4,"model":4}]} is still readable,
but it is always reported as `fixture_only` unless `fixture` is explicitly false.
"""
from __future__ import annotations

import json
import math
import statistics
import sys
from itertools import combinations
from typing import Any


def quadratic_weighted_kappa(human: list[int], model: list[int]) -> float:
    if not human or len(human) != len(model):
        return 0.0
    labels = sorted(set(human + model))
    index = {label: i for i, label in enumerate(labels)}
    n = len(labels)
    observed = [[0] * n for _ in range(n)]
    for h, m in zip(human, model):
        observed[index[h]][index[m]] += 1
    total = len(human)
    row = [sum(observed[i]) for i in range(n)]
    col = [sum(observed[i][j] for i in range(n)) for j in range(n)]
    expected = [[row[i] * col[j] / total for j in range(n)] for i in range(n)]
    weighted_observed = 0.0
    weighted_expected = 0.0
    for i in range(n):
        for j in range(n):
            weight = ((i - j) ** 2) / ((n - 1) ** 2) if n > 1 else 0.0
            weighted_observed += weight * observed[i][j]
            weighted_expected += weight * expected[i][j]
    return 1 - (weighted_observed / weighted_expected) if weighted_expected else 0.0


def pearson(human: list[float], model: list[float]) -> float:
    if len(human) != len(model) or len(human) < 2:
        return 0.0
    mean_h = sum(human) / len(human)
    mean_m = sum(model) / len(model)
    cov = sum((h - mean_h) * (m - mean_m) for h, m in zip(human, model))
    var_h = sum((h - mean_h) ** 2 for h in human)
    var_m = sum((m - mean_m) ** 2 for m in model)
    return cov / math.sqrt(var_h * var_m) if var_h and var_m else 0.0


def item_human_score(item: dict[str, Any]) -> int | None:
    if item.get("adjudicated") is not None:
        return int(item["adjudicated"])
    if item.get("human") is not None:
        return int(item["human"])
    raters = item.get("raters") or {}
    values = [int(value) for value in raters.values()]
    if not values:
        return None
    return int(round(statistics.median(values)))


def build_report(payload: dict[str, Any]) -> dict[str, Any]:
    items = payload.get("items", [])
    if not items:
        raise ValueError("no calibration items")

    human_scores: list[int] = []
    model_scores: list[int] = []
    paired_items: list[dict[str, Any]] = []
    for item in items:
        human = item_human_score(item)
        model = item.get("model")
        if human is None or model is None:
            continue
        human_scores.append(human)
        model_scores.append(int(model))
        paired_items.append(item)

    if not paired_items:
        raise ValueError("no items contain both a human and a model score")

    rater_ids = sorted({rater for item in items for rater in (item.get("raters") or {}).keys()})
    rater_pairs = []
    for left, right in combinations(rater_ids, 2):
        common_human = []
        common_model = []
        for item in items:
            raters = item.get("raters") or {}
            if left in raters and right in raters:
                common_human.append(int(raters[left]))
                common_model.append(int(raters[right]))
        if len(common_human) >= 2:
            rater_pairs.append(
                {
                    "raterA": left,
                    "raterB": right,
                    "items": len(common_human),
                    "qwk": round(quadratic_weighted_kappa(common_human, common_model), 4),
                }
            )

    if rater_pairs:
        total_common = sum(pair["items"] for pair in rater_pairs)
        inter_rater_qwk = round(
            sum(pair["qwk"] * pair["items"] for pair in rater_pairs) / total_common, 4
        )
    else:
        inter_rater_qwk = None

    human_model_qwk = round(quadratic_weighted_kappa(human_scores, model_scores), 4)
    fixture = payload.get("fixture", True)
    if fixture is False and len(rater_ids) >= 2:
        status = "expert_dataset"
    elif fixture is False:
        status = "unverified"
    else:
        status = "fixture_only"

    writing_types = {"WRITING_SAMPLE", "WRITE_ABOUT_PHOTO", "INTERACTIVE_WRITING"}
    speaking_types = {"SPEAK_ABOUT_PHOTO", "READ_THEN_SPEAK", "SPEAKING_SAMPLE", "INTERACTIVE_SPEAKING"}

    writing_human: list[int] = []
    writing_model: list[int] = []
    for item in paired_items:
        q_type = item.get("question_type", "")
        if q_type in writing_types:
            h = item_human_score(item)
            m = item.get("model")
            if h is not None and m is not None:
                writing_human.append(h)
                writing_model.append(int(m))

    speaking_human: list[int] = []
    speaking_model: list[int] = []
    for item in paired_items:
        q_type = item.get("question_type", "")
        if q_type in speaking_types:
            h = item_human_score(item)
            m = item.get("model")
            if h is not None and m is not None:
                speaking_human.append(h)
                speaking_model.append(int(m))

    writing_qwk = (
        round(quadratic_weighted_kappa(writing_human, writing_model), 4)
        if len(writing_human) >= 2
        else None
    )
    speaking_qwk = (
        round(quadratic_weighted_kappa(speaking_human, speaking_model), 4)
        if len(speaking_human) >= 2
        else None
    )

    return {
        "items": len(items),
        "paired_items": len(paired_items),
        "writing_items": len(writing_human),
        "speaking_items": len(speaking_human),
        "raters": len(rater_ids),
        "rater_ids": rater_ids,
        "inter_rater_qwk": inter_rater_qwk,
        "inter_rater_pairs": rater_pairs,
        "human_model_qwk": human_model_qwk,
        "writing_human_model_qwk": writing_qwk,
        "speaking_human_model_qwk": speaking_qwk,
        # Backwards-compatible alias used by the first calibration gate.
        "quadratic_weighted_kappa": human_model_qwk,
        "pearson": round(pearson(human_scores, model_scores), 4),
        "exact_agreement": round(
            sum(1 for h, m in zip(human_scores, model_scores) if h == m) / len(human_scores), 4
        ),
        "status": status,
        "fixture": fixture is not False,
    }


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else "backend/tests/fixtures/calibration_labels.json"
    with open(path, encoding="utf-8") as handle:
        payload = json.load(handle)
    try:
        report = build_report(payload)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
