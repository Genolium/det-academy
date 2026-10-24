# Neural answer quality + personalized recommendations

Date: 2026-10-24  
Product: DET Academy  
Thesis: «Разработка обучающей платформы для подготовки к языковому экзамену DET с применением технологий ML для персональных рекомендаций по образовательному процессу»

## 1. Goal

A speaking/writing response is judged as **overall answer quality**: task meaning and language level together. A fluent template on the wrong topic is a weak answer. Poor English on the right topic is a partial answer. Gibberish is not measured.

A second ML contour ranks **what to study today** from server `learning_events`, including these quality dimensions.

Neither contour produces an official Duolingo English Test score.

## 2. Non-goals

- Official DET equivalence, university cutoffs, or “your DET is 125”.
- Teacher portal, billing, Arena expansion, thousands of new items.
- Letting an LLM mutate a numeric score when the local judge is unavailable.
- Using ChatGPT/cloud as the diploma’s required runtime.

## 3. Two ML contours

```text
prompt + response (+ transcript)
        │
        ▼
┌─────────────────────────────┐
│  A. Quality rubric (NLP)    │  task_fulfillment, language_level,
│     local neural judge      │  coherence, fluency → overall_quality
└──────────────┬──────────────┘
               │ written to evaluation + learning_events
               ▼
┌─────────────────────────────┐
│  B. Recommender (ML thesis) │  rank 4–6 daily tasks from events,
│     student state → tasks   │  mastery, SRS, goals, quality dims
└─────────────────────────────┘
```

| Contour | Role in thesis | Role in product |
|---|---|---|
| A. Quality rubric | NLP evidence that productive answers are judged by meaning and language | `practice_feedback` with a visible breakdown |
| B. Recommender | “ML for personalized educational recommendations” | Dashboard “today” queue |

## 4. Quality rubric

All productive items (`WRITE_PHOTO`, `INTERACTIVE_WRITING`, `WRITING_SAMPLE`, `SPEAK_PHOTO`, `READ_THEN_SPEAK`, `INTERACTIVE_SPEAKING`, `SPEAKING_SAMPLE`) receive:

| Dimension | Scale | Meaning |
|---|---|---|
| `task_fulfillment` | 0.0–1.0 | Did the response address **this** prompt/photo? |
| `language_level` | 0.0–1.0 | Range, control, naturalness (CEFR-like, not DET) |
| `coherence` | 0.0–1.0 | Development of ideas vs canned fragments |
| `fluency` | 0.0–1.0 | Speaking only; 0 if not speaking |
| `overall_quality` | 0.0–1.0 | Derived; **cannot exceed `task_fulfillment`** |
| `cefr_band` | label | Derived from `language_level` only, shown as training estimate |
| `status` | enum | `COMPLETED` \| `EMPTY` \| `INSUFFICIENT` \| `OFF_TOPIC` |

Hard rules:

1. Empty / silence → `EMPTY`, all scores 0.
2. Gibberish / non-English → `INSUFFICIENT`, `overall_quality = 0.05`.
3. `task_fulfillment < 0.15` → `OFF_TOPIC`; `overall_quality = min(computed, 0.12)`.
4. **`overall_quality ≤ task_fulfillment`**. Language must not rescue an off-task answer.
5. Suggested combine (versioned, not DET):  
   `raw = 0.45*task + 0.35*language + 0.20*coherence` (+ fluency weight on speaking, renormalized).  
   Then `overall_quality = min(raw, task_fulfillment)`.
6. Existing `Score` field on `EvaluationResult` stores `overall_quality`. Provider stays `practice_feedback` or a more specific local id such as `quality_rubric_v1`. Never `det_official`.

Student UI shows three numbers: **задача / язык / итог**, plus one sentence of evidence. Copy: training estimate, not official DET.

## 5. Neural judge (contour A)

### 5.1 Preferred runtime

Local-first, no cloud required:

1. **CPU path (required for CI and defense laptop):**  
   - Cross-encoder `(prompt, response)` → `task_fulfillment`.  
   - Language-quality head on response text (CEFR/quality classifier or feature net on lexical/syntactic proxies) → `language_level` + `coherence`.  
   - Deterministic fluency from duration/WPM for speaking.  
   - Combine with the formula in §4.

2. **Optional local LLM (Ollama):** same rubric as JSON. Used for **feedback text and evidence spans only** unless `QUALITY_LLM_SCORES=true` **and** a golden-set check passes. Default: LLM explains, numeric scores come from the CPU path.

3. Cloud OpenAI-compatible provider remains the existing enrichment adapter. It must not be the source of truth for scores.

### 5.2 Interfaces (Go)

Extend the existing `internal/ai` package rather than a parallel scorer:

```go
type QualityInput struct {
    QuestionType string
    Prompt       string
    Response     string
    Transcript   string
    DurationSec  float64
}

type QualityRubric struct {
    TaskFulfillment float64
    LanguageLevel   float64
    Coherence       float64
    Fluency         float64
    OverallQuality  float64
    Status          string
    CEFRBand        string
    Feedback        string
    Evidence        []Evidence
    Provider        string
    Model           string
    Version         string
}

type QualityJudge interface {
    Name() string
    Version() string
    Judge(ctx context.Context, in QualityInput) (QualityRubric, error)
}
```

Fallback chain: configured local judge → CPU rubric judge → current rule-based evaluator. Every result records `Provider` + `EvaluatorVersion`.

Python (or ONNX) workers are acceptable behind this interface so the thesis can show a real model file. The API process must still boot and score if the worker is down (rule-based + keyword/embedding gate already in `evaluator.go`).

### 5.3 Prompt construction

`Prompt` is built server-side from the **question snapshot** (not live `GetByID`): photo alt text, speaking prompt, writing part 1/2. The client never supplies the “official meaning” of the item.

### 5.4 Calibration honesty

This rubric is **not** equated to DET. `docs/calibration.md` stays the gate for any DET-scale claim. Diploma metrics for contour A:

- off-topic detection: precision/recall on a labeled set (templates vs on-task);
- language head: agreement with a small CEFR-labeled sample if available, otherwise documented as a training proxy;
- ablation: overall with vs without the `overall ≤ task` cap (show that templates no longer score high).

## 6. Recommender (contour B) — thesis core

### 6.1 Student state

Built only from server data: `learning_events`, skill mastery, SRS due counts, last mock subscores, last N quality rubrics, goal (`target_score`, `daily_minutes`, days left).

Example features:

- mastery per skill and per question type;
- mean `task_fulfillment` / `language_level` on last 5 productive items;
- off-topic rate;
- overdue SRS cards;
- theory lessons remaining;
- minutes budget.

### 6.2 Output

Ranked list of 4–6 `DailyTask` records with:

- `reason` in the user’s locale (“speaking: low task fulfillment on photo prompts”);
- `model_version`;
- never a fake university or invented target score.

If the model is missing, keep today’s heuristic plan and set `planSource = "heuristic_v1"`. If the model ran, `planSource = "ranker_v1"`.

### 6.3 Training

Offline job from exported events. A linear model or gradient boosting is enough for the thesis. Metrics: hit@k / NDCG vs a held-out week, plus comparison to the current heuristic. Do not require online bandits for v1.

## 7. Product integration

| Surface | Change |
|---|---|
| Evaluation payload | Add rubric fields (task, language, coherence, fluency, overall, status `OFF_TOPIC`) |
| Coach / result UI | Breakdown «задача / язык / итог»; hide DET-official wording |
| `learning_events` | Payload includes rubric + `questionType` + `questionId` |
| Study plan | Prefer ranker; explain why |
| Certificate / overall mock | Unchanged: server CAT aggregate, still a training estimate |

Speaking still requires server STT when configured; client transcripts stay untrusted for scoring.

## 8. Files (implementation map)

- `backend/internal/ai/` — `QualityJudge` + CPU implementation + optional LLM explanation
- `backend/internal/service/evaluator.go` — call judge; keep EMPTY/INSUFFICIENT; apply cap
- `backend/internal/service/evaluation_queue.go` — persist rubric; provider/version
- `backend/internal/models/models.go` — rubric fields on `EvaluationResult`
- `backend/internal/service/study_service.go` — plan ranker hook
- `src/components/test-engine/TestResultModal.tsx` and coach UI — three-number breakdown
- `docs/calibration.md` — pointer: quality rubric ≠ DET calibration
- Thesis chapter mapping: contour A = NLP, contour B = recommender

## 9. Success criteria

1. Off-topic OREO essay on a park photo: `task_fulfillment` low, `overall_quality ≤ 0.12`.
2. On-topic weak language: task medium/high, language low, overall between them and ≤ task.
3. Gibberish: `INSUFFICIENT`, ~0.05.
4. Dashboard plan names a real reason tied to events/rubric, not “CAT ENGINE”.
5. App scores without Ollama/OpenAI.
6. No UI string claims official DET from this rubric.

## 10. Diploma wording (use as-is)

> Оценка productive skills — вспомогательный локальный контур качества ответа (выполнение задачи и уровень языка) с запретом компенсации оффтопа беглостью. Вклад ML в тему работы — персонализация учебной траектории по серверным событиям и измерениям качества. Шкала не приравнивается к официальному Duolingo English Test.
