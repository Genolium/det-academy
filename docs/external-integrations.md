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
