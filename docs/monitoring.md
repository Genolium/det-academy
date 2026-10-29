# Error monitoring

## Current state

The application already has the wiring; delivery is off because production has
no credentials.

- Backend Sentry is initialised in `backend/cmd/server/main.go` through
  `observability.Init(os.Getenv("SENTRY_DSN"), ...)`. An empty DSN is a no-op.
- Panics and request context are captured by `observability.Middleware`.
- Frontend errors go to `POST /api/v1/client-errors`, which forwards the message
  and stack to the same Sentry hub (`source=frontend`).
- Production currently has **no** `SENTRY_DSN` and **no** Telegram alert
  configuration. Nothing is silently pretending to monitor.

## Activate Sentry

1. Create a project in Sentry and copy its DSN.
2. Add it to the production `.env` on the server (never commit it):

   ```bash
   SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
   SENTRY_RELEASE=<short-git-sha>
   ```

3. Recreate the backend so it picks up the environment:

   ```bash
   cd /root/det-academy
   docker compose up -d backend
   ```

4. Send a test event through the same path the frontend uses:

   ```bash
   curl -fsS -X POST https://det-academy.ru/api/v1/client-errors \
     -H 'Content-Type: application/json' \
     -d '{"message":"monitoring smoke test","url":"https://det-academy.ru/","userAgent":"curl"}'
   ```

   The response is `202 Accepted`; the event must appear in Sentry with the
   `source: frontend` tag.

## Activate Telegram alerts

Sentry owns alert routing, so there is no second alert transport to maintain.

1. Create a bot with `@BotFather` and copy the bot token.
2. Send the bot a message, then read the chat id:

   ```bash
   curl -fsS "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```

3. In Sentry, open **Settings → Integrations → Telegram**, connect the bot and
   choose the chat.
4. Add an alert rule for the project: **When a new issue is created**, notify
   the Telegram integration. Keep the rule narrow (error level, production
   environment) so feedback messages do not become noise.

## What is deliberately not done

- No custom Telegram client in the backend. Sentry already captures panics,
  client errors and release context; duplicating that path would create two
  sources of truth.
- No secrets in the repository, `.env.example` only lists the variable name.
