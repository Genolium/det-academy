# External integrations readiness

The preflight never calls paid providers and never prints secret values:

```bash
npm run preflight:external
npm run preflight:external -- --require
```

Exit codes: `0` all configured, `2` missing (BLOCKED), `1` missing with
`--require` (for CI/deploy gates).

## Required configuration

| Area | Variables | Current local state |
|---|---|---|
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | present in local `.env`; real browser flow not verified |
| Apple OAuth | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | missing |
| VK ID | `VK_CLIENT_SECRET` (+ public client ID) | missing secret |
| Yandex ID | `YANDEX_CLIENT_SECRET` (+ public client ID) | missing |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` (or `RESEND_API_KEY`, `EMAIL_FROM`) | missing |
| Neural evaluator | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `REQUIRE_NEURAL_EVALUATION=true` | missing; rule-based fallback only |
| Server STT | `AI_STT_ENABLED=true` | missing |
| Error tracking | `SENTRY_DSN`, optional `SENTRY_RELEASE` | missing |

## Email delivery (SMTP on Beget)

The project is hosted on Beget, where the domain mail account is provided as an
SMTP service. The backend sends through it when `SMTP_HOST` is set:

| Variable | Example | Notes |
|---|---|---|
| `SMTP_HOST` | `smtp.beget.com` | enables the SMTP sender |
| `SMTP_PORT` | `587` | `587` = STARTTLS, `465` = implicit TLS |
| `SMTP_USERNAME` | `mailer@det-academy.ru` | full mailbox address |
| `SMTP_PASSWORD` | — | mailbox password |
| `SMTP_FROM` | `DET Academy <noreply@det-academy.ru>` | falls back to `EMAIL_FROM` |
| `SMTP_IMPLICIT_TLS` | `false` | forced to `true` on port `465` |

Selection order in `email.NewFromEnv()`: **SMTP → Resend → log sender**. The log
sender only writes the message to the service log, so without any of these
variables the verification email never reaches an inbox.

The SMTP client is verified by `backend/internal/email/smtp_test.go` against a
local fake SMTP server (handshake, envelope, MIME body, authentication).

## Directus CMS reachability

The browser never calls a separate CMS hostname. The application proxies
`/directus/*` to the CMS through the route handler in
`src/app/directus/[...path]/route.ts`, which reads `DIRECTUS_INTERNAL_URL` at
request time (`http://directus:8055` inside Docker). Only read requests for
public collections (`theory_lessons`, `questions`, `institutions`, `ad_banners`,
`vocabulary_publication`) and static assets are proxied.

Consequences:

- the site works even when the nginx server block for the CMS subdomain is not
  deployed;
- no browser TLS warning for a hostname outside the certificate SAN;
- the CMS stays private behind the application origin.

If the CMS is unreachable the proxy answers `502` after 4 seconds and the
frontend falls back to the bundled content instead of blocking the page.



- Apple/Google token validation has local JWKS tests.
- OAuth transaction replay protection is covered by backend tests.
- The evaluation queue has tests for missing STT and provider failures.
- The backend Sentry middleware is a safe no-op without `SENTRY_DSN` and captures
  panics when a DSN is configured.
- The frontend global error reporter posts bounded reports to
  `/api/v1/client-errors`; the backend forwards them to Sentry.
- Local contract tests cover Google/Apple token validation, VK/Yandex exchange,
  OpenAI-compatible evaluation/STT, Resend email delivery and Sentry capture:
  `npm run test:contracts`.
- Real provider delivery, real OAuth redirects and real email inboxes are **not**
  verified without credentials.

## What requires a decision or credentials

1. Provide the missing secrets through the deployment environment, never in git.
2. Run `npm run preflight:external -- --require` on the target environment.
3. Perform one real login per provider, one real verification email, one real
   speaking response with STT, and one deliberate backend error to confirm Sentry.
4. Record the evidence in the release checklist before claiming the integrations
   are production-ready.

## AI evaluation and speech recognition

Any OpenAI-compatible provider works (OpenAI, OpenRouter, Groq, a local Ollama):

| Variable | Purpose |
|---|---|
| `AI_BASE_URL` | endpoint root, e.g. `https://api.openai.com/v1` |
| `AI_API_KEY` | provider key (empty for a local Ollama) |
| `AI_MODEL` | chat model used for enrichment and rubric evaluation |
| `AI_STT_ENABLED` | `true` enables server-side transcription |
| `AI_STT_MODEL` | transcription model, default `whisper-1` |
| `REQUIRE_NEURAL_EVALUATION` | `true` makes the provider authoritative; a failure stays `failed`, never a zero |

Check the configuration without spending meaningful tokens:

```bash
npm run preflight:ai
```

Exit codes: `2` missing configuration, `1` the provider did not answer, `0` chat
(and STT when enabled) work. The probe sends an 8-token chat request and, with
STT enabled, a 0.25 s silent WAV.

Score provenance is always visible: `provider`, `evaluatorVersion` and
`transcriptSource` are stored on every evaluation, and the browser-transcript
path is labelled practice-grade in the coach.

### Yandex AI Studio model routing

Yandex AI Studio exposes an OpenAI-compatible endpoint
(`https://llm.api.cloud.yandex.net/v1`). Model identifiers look like
`gpt://<folder_id>/<model>`, and the folder is also sent as `x-folder-id`.

| Variable | Purpose |
|---|---|
| `AI_MODEL` | fallback model for every call |
| `AI_MODEL_FAST` | enrichment: hints and short feedback (cheap/fast) |
| `AI_MODEL_EVAL` | authoritative speaking/writing evaluation (stronger) |
| `AI_FOLDER_ID` | Yandex folder id (`x-folder-id` header) |
| `AI_PRICE_INPUT_PER_1M`, `AI_PRICE_OUTPUT_PER_1M`, `AI_PRICE_CURRENCY` | cost shown in the admin dashboard |

Verified routing (AI Studio, 2026-10-27):

```bash
AI_BASE_URL=https://llm.api.cloud.yandex.net/v1
AI_FOLDER_ID=<folder>
AI_MODEL=gpt://<folder>/deepseek-v4-flash/latest      # fallback
AI_MODEL_FAST=gpt://<folder>/deepseek-v4-flash/latest # enrichment
AI_MODEL_EVAL=gpt://<folder>/deepseek-v4-flash/latest # rubric evaluation
AI_PRICE_INPUT_PER_1M=...                             # Yandex tariff
AI_PRICE_OUTPUT_PER_1M=...
AI_PRICE_CURRENCY=RUB
```

`deepseek-v4-flash` answers strict JSON in 1-3 seconds and handled every
calibration case correctly (see below). It occasionally returns the answer in
`reasoning_content`, so the client reads that field too and strips markdown
fences. `npm run preflight:ai` verifies chat (and STT when enabled).

### Evaluation prompts and calibration

Both prompts live in `backend/internal/ai/prompts.go` and are covered by unit
tests, so a prompt change is a reviewable code change rather than a string edit
in a handler.

The rater prompt (`evaluationSystemPrompt`) contains:

- the DET productive rubric with weights: task completion 35%, coherence 25%,
  lexical sophistication 20%, grammatical accuracy 20% (for speaking, task
  completion becomes delivery/fluency);
- explicit score-to-CEFR band anchors from Pre-A1 to C2;
- hard rules: fewer than five words ≤ 0.05, off-topic or memorised template
  ≤ 0.15, non-English ≤ 0.05, no credit for length alone;
- an explicit statement that the learner response is untrusted data, and the
  response is wrapped in `<<<RESPONSE ... RESPONSE>>>` delimiters (prompt
  injection in a test answer is treated as off-topic, verified live);
- a request for `taskCompletion` (0..1) and `offTopic` in addition to the score;
- Russian feedback with one concrete next step, and evidence that must be an
  exact substring of the response.

The code does not trust the model blindly (`evaluation_validation.go`):

- the score may not exceed the deterministic rubric by more than 0.30, but it
  may be lower — a harsher, better-informed model score is kept;
- `offTopic=true` or `taskCompletion < 0.25` caps the score at 0.15, and
  `taskCompletion < 0.50` caps it at 0.55, so fluent prose that ignores the
  question cannot score well;
- empty or insufficient answers are capped at 0.10 (and at 0.05 below five
  words) regardless of what the model returns;
- CEFR is derived from the final score, so `{"score":0.9,"cefr":"A1"}` is
  impossible;
- evidence spans are re-anchored to real substrings; invented quotes are
  dropped (a wrong highlight is worse than none).

If the provider is unavailable the queue keeps the deterministic rubric result
and logs the failure instead of losing the submission; with
`REQUIRE_NEURAL_EVALUATION=true` the job stays failed and is retried instead.

Calibration is checked against reference answers with an opt-in live test:

```bash
cd backend
AI_API_KEY=... AI_BASE_URL=https://llm.api.cloud.yandex.net/v1 \
AI_MODEL="gpt://<folder>/deepseek-v4-flash/latest" AI_FOLDER_ID=<folder> \
go test ./internal/ai -tags live -run TestLiveEvaluationCalibration -v
```

Verified bands: A1 answer 0.28, B1 0.55, C1 0.78, off-topic recipe 0.10,
prompt-injection answer 0.05, empty answer 0.05. `evaluator_version` stores the
short model name (`deepseek-v4-flash`), not the full `gpt://` URI, because the
column is `varchar(30)`.

Every call records `kind`, `model`, `prompt_tokens` and `completion_tokens` in
`ai_usage_events`; `GET /api/v1/admin/ai-usage?days=7` aggregates them and the
admin dashboard renders the tokens and cost. The key lives only in the server
`.env` and is never committed.

### Yandex SpeechKit speech recognition

SpeechKit is not OpenAI-compatible, so the backend ships a dedicated adapter
(`internal/ai/speechkit.go`):

1. `ffmpeg` converts the browser recording (WebM/Opus) to 16 kHz mono OggOpus;
2. long answers are split into 20-second chunks (SpeechKit's synchronous
   endpoint accepts up to 30 seconds and 1 MB per request);
3. every chunk is sent to `POST /speech/v1/stt:recognize` with
   `format=oggopus`, `lang=en-US` and `Authorization: Api-Key <key>`.

```bash
AI_STT_ENABLED=true
AI_STT_PROVIDER=yandex_speechkit
AI_STT_API_KEY=<SpeechKit API key>      # falls back to AI_API_KEY
AI_FOLDER_ID=<Yandex folder id>
AI_STT_LANG=en-US
AI_STT_CHUNK_SECONDS=20
ALLOW_CLIENT_TRANSCRIPT=false           # server transcript is authoritative
```

Verified on 2026-10-28: a synthesised sentence was recognised verbatim in
0.47 s. `ffmpeg` is installed in the backend image (`apk add ffmpeg`), and
`TestSpeechKitConvertsWebMWithFFmpeg` covers the real conversion path.

### Text-to-speech and permanent audio cache

`GET /api/v1/tts?text=...` synthesises speech through Yandex SpeechKit and
stores the result under `MEDIA_UPLOAD_DIR/tts` as a content-addressed MP3
(`sha256(model|voice|lang|text)`). Files are kept forever, served with
`Cache-Control: public, max-age=31536000, immutable`, and a concurrent request
for the same sentence waits for the first synthesis instead of paying twice.

```bash
AI_TTS_ENABLED=true
AI_TTS_PROVIDER=yandex
AI_TTS_API_KEY=<SpeechKit key>   # falls back to AI_API_KEY
AI_FOLDER_ID=<folder>
AI_TTS_MODEL=general             # general (native English) | livetts (ru voices)
AI_TTS_VOICE=john                # the only native en-US voice in the catalogue
AI_TTS_LANG=en-US
AI_TTS_SPEED=0.9                 # deliberate dictation pace (general only)
NEXT_PUBLIC_TTS_PROVIDER=server  # browser = device voice fallback
```

**Why `general` + `john`.** Every candidate was benchmarked objectively:
synthesise a sentence, recognise it back with SpeechKit STT, compare words.

| Model / voice | Round-trip accuracy | Notes |
|---|---|---|
| `general` / `john` | **0.99** | Native en-US male; supports `speed` |
| `livetts` / `sofia` | 0.77–0.90 | LiveTTS voices are **ru-RU**; English has an accent |
| `general` / `jane` | 0.40–0.46 | "The library" came out as "Ze ly brerri" |
| `general` / `marina`, `omazh`, `ermil` | 0.32–0.44 | Also Russian speakers |

The v1 voices `jane`, `marina`, `omazh`, `ermil` are Russian speakers reading
English, which is exactly what users heard as "funny" dictations. `john` is
listed as `en-US` in the voice catalogue and scored 0.99 across ten real
dictation sentences.

LiveTTS (`AI_TTS_MODEL=livetts`) remains available for Russian UI prompts:

* voices are `sofia`, `vera`, `vasily`, `sergey`, `denis`, `irina`;
* the model accepts **≤250 characters** per request, so longer texts are split
  on sentence boundaries (240 runes) and joined with `ffmpeg`; the endpoint
  itself still accepts up to 600 characters;
* `speed` is not supported by this model — dictation pacing is then applied in
  the browser with `playbackRate` (pitch preserved);
* the v3 endpoint streams newline-delimited JSON with base64 `audioChunk`s.

Changing `AI_TTS_MODEL` or `AI_TTS_VOICE` changes the cache key, so old files
stay valid and new ones are generated next to them.

Warm the whole dictation bank once after a deploy:

```bash
TTS_PREGEN_BASE_URL=http://127.0.0.1:18080 node scripts/pregenerate_tts.mjs
# or, inside the deploy script:
./scripts/deploy_production.sh --tts
```

The client calls the server voice first and falls back to the ranked browser
voice (Google US English, Microsoft Aria/Jenny, Samantha) on any failure, so a
provider outage never blocks a lesson.

#### Is a public TTS endpoint safe?

The audio is lesson content, so the endpoint is intentionally anonymous: a
learner should not need an account to hear a dictation. That is safe for
confidentiality (the response is only `audio/mpeg` synthesized from text the
client already has) but it used to be an open text-to-speech proxy, which is a
cost and disk-abuse problem. The following guards are in place:

- **Cache hits are unlimited and free.** The deploy pre-generates the whole
  dictation and vocabulary bank, so normal traffic never calls the provider.
- **Paid synthesis is budgeted.** `TTS_NEW_PER_IP_PER_DAY` (default 20) and
  `TTS_NEW_GLOBAL_PER_DAY` (default 500) cap new sentences per UTC day; the
  response is `429` with `Retry-After`. Worst case is bounded to 500 × 600
  characters per day instead of unbounded spend.
- **The client address cannot be rotated.** `X-Forwarded-For` is read from the
  last hop (the one nginx appends), not the first, so a caller cannot invent a
  new IP per request. The same helper is used by the request rate limiter.
- **Request text never reaches the logs.** The application logger writes only
  `r.URL.Path` (no query string), and nginx disables `access_log` for
  `/api/v1/tts`.
- **Memory does not grow per sentence.** The single-flight map used to keep one
  mutex per cache key forever; flights are now reference-counted and removed
  when the last waiter leaves.
- **Response hardening:** `X-Content-Type-Options: nosniff`, explicit
  `audio/mpeg`, no HTML, no user-supplied filename, 600-rune input limit, and
  the route is covered by the 120 requests/minute limiter.

If the product ever synthesizes text written by a learner, do not put it in a
query string: use an authenticated `POST`, keep the text out of access logs and
out of browser history, and document retention. Today the endpoint only serves
fixed course content, which is why `GET` is acceptable.
 Dictation pacing is not applied twice:
the synthesiser already speaks at `AI_TTS_SPEED`, and the client only adjusts
`playbackRate` relative to the browser default.
