# DET Academy: AI/ML architecture

## 1. Principle

AI must improve feedback, not silently manufacture a score. Until calibration
exists, the training estimate stays rule-based and versioned. Any model output
is labeled with provider, model, version and confidence, and is shown as
feedback next to evidence, not as an official DET score.

## 2. Layers

```text
audio -> transcription -> rubric evaluation -> feedback enrichment -> report
text  -> normalization  -> rubric evaluation -> feedback enrichment -> report
```

- **Transcription**: server-side STT provider (Whisper-compatible or self-hosted).
  Client transcripts are never trusted as the source of a speaking score.
- **Rubric evaluation**: deterministic features (task completion, length,
  lexical diversity, connectors, grammar proxies, fluency from audio duration
  and pauses). Produces a bounded score and `not_measured` when evidence is
  insufficient.
- **Feedback enrichment**: optional LLM/embedding provider that returns
  sentence-level evidence, corrections and a model answer. It never mutates the
  score until a calibrated evaluator version is promoted.
- **Report**: individual skills, integrated indices, range, coverage, evaluator
  version, evidence spans and human-readable next steps.

## 3. Provider abstraction

```go
type Provider interface {
    Name() string
    Version() string
    Enrich(ctx context.Context, input EvaluationInput) (Enrichment, error)
}

type Transcriber interface {
    Name() string
    Transcribe(ctx context.Context, audio []byte, mime string) (Transcript, error)
}
```

Implementations:

- `RuleBasedProvider` — always available, deterministic, no network. Extracts
  evidence spans, repeated words, long sentences, missing connectors.
- `OpenAICompatibleProvider` — works with OpenAI, Azure OpenAI, Ollama, vLLM or
  any `/chat/completions` endpoint. Configured by `AI_BASE_URL`, `AI_MODEL`,
  `AI_API_KEY`.
- `WhisperCompatibleTranscriber` — `/audio/transcriptions`, optional.

Fallback chain: configured provider -> rule-based. Every result records which
provider actually answered.

## 4. Queue and states

```text
uploaded -> queued -> transcribing -> evaluating -> completed
                                         -> retryable_failed
                                         -> permanently_failed
```

- `evaluation_jobs`: id, session_id, question_id, provider, status, attempts,
  max_attempts, next_attempt_at, last_error, created_at, updated_at.
- Worker uses `FOR UPDATE SKIP LOCKED`; retries with exponential backoff.
- `GET /test/sessions/{id}/evaluations` returns `pending` for unfinished jobs.
- `POST /test/sessions/{id}/complete` returns `409 pending_evaluation` until all
  mandatory jobs finish or permanently fail; permanently failed speaking items
  are reported as `unsupported`, never as a high score.

## 5. Evidence spans

Each feedback item stores:

```json
{
  "start": 42,
  "end": 71,
  "text": "this policy is very good",
  "label": "vague_claim",
  "suggestion": "Replace with a specific mechanism or example"
}
```

Evidence is generated for writing (sentence offsets) and speaking (transcript
timestamps when STT provides them).

## 6. Calibration

- Collect anonymized responses with item exposure, timing and version.
- Two independent raters on a stratified sample; measure quadratic weighted
  kappa / ICC.
- Fit Rasch/2PL item parameters for objective items; fit a rubric model for
  productive skills.
- Equate the internal scale to DET anchors; do not use `105 + 18.5*theta` as a
  permanent mapping.
- Report SEM and a range. Recalibrate when evaluator version changes.
- Never change an evaluator version inside a completed attempt.

## 7. Guardrails

- Prompt injection: treat learner text as data, never as instructions; strip
  system-like markers; cap input length.
- PII: redact emails/phones/URLs before sending to external providers; retention
  policy for audio and transcripts.
- Cost: per-user daily budget, max tokens, timeout, circuit breaker.
- Security: provider keys only server-side; no client LLM calls.
- Observability: latency, failure rate, retry count, provider mix, cost per
  evaluation.

## 8. Rollout

1. Rule-based evidence spans + versioned evaluator (no external dependency).
2. Async job queue and `pending` UI.
3. Optional self-hosted Ollama/Whisper in staging.
4. Human review for a sample; compare model vs human.
5. Promote a calibrated evaluator version; keep the old version for replay.
6. Only then consider showing an AI-generated "coach" explanation as default.

## 9. What not to do

- Do not call a length/keyword heuristic "AI".
- Do not let an LLM change the numeric score before calibration.
- Do not trust a client transcript for speaking.
- Do not expose raw model output without evidence and disclaimer.
- Do not claim official DET equivalence.
