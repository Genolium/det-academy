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
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | missing |
| Neural evaluator | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `REQUIRE_NEURAL_EVALUATION=true` | missing; rule-based fallback only |
| Server STT | `AI_STT_ENABLED=true` | missing |
| Error tracking | `SENTRY_DSN`, optional `SENTRY_RELEASE` | missing |

## What is verified without credentials

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
