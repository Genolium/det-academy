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
(`https://ai.api.cloud.yandex.net/v1`). Model identifiers look like
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
AI_BASE_URL=https://ai.api.cloud.yandex.net/v1
AI_FOLDER_ID=<folder>
AI_MODEL=gpt://<folder>/aliceai-llm/latest          # fallback
AI_MODEL_FAST=gpt://<folder>/yandexgpt-5-lite/latest # enrichment
AI_MODEL_EVAL=gpt://<folder>/aliceai-llm/latest      # rubric evaluation
AI_PRICE_INPUT_PER_1M=...                            # Yandex tariff
AI_PRICE_OUTPUT_PER_1M=...
AI_PRICE_CURRENCY=RUB
```

`aliceai-llm` answers strict JSON in about two seconds; `yandexgpt-5-lite`
is the fastest and is used for hints. DeepSeek V4.1 Flash via AI Studio returns
reasoning in `reasoning_content`, so the client also reads that field and strips
markdown fences. `npm run preflight:ai` verifies chat (and STT when enabled).
Server-side speech recognition needs a Yandex SpeechKit adapter (SpeechKit is
not OpenAI-compatible); until then the browser transcript path stays active.

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

`GET /api/v1/tts?text=...` synthesises speech through SpeechKit and stores the
result under `MEDIA_UPLOAD_DIR/tts` as a content-addressed MP3
(`sha256(provider|voice|text)`). Files are kept forever, served with
`Cache-Control: public, max-age=31536000, immutable`, and a concurrent request
for the same sentence waits for the first synthesis instead of paying twice.

```bash
AI_TTS_ENABLED=true
AI_TTS_PROVIDER=yandex
AI_TTS_API_KEY=<SpeechKit key>   # falls back to AI_API_KEY
AI_FOLDER_ID=<folder>
AI_TTS_VOICE=jane                # English: jane, omazh, marina, zahar
AI_TTS_LANG=en-US
AI_TTS_SPEED=0.9
NEXT_PUBLIC_TTS_PROVIDER=server  # browser = device voice fallback
```

Warm the whole dictation bank once after a deploy:

```bash
TTS_PREGEN_BASE_URL=http://127.0.0.1:18080 node scripts/pregenerate_tts.mjs
```

Quality note: a round-trip benchmark (synthesise → recognise) showed SpeechKit's
English voices at 0.32–0.46 word accuracy, so the client falls back to the
ranked browser voice when server synthesis fails. ElevenLabs or OpenAI TTS can
replace the provider behind the same endpoint without touching the cache.
