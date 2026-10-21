# DET Academy

Next.js 16 + Go + PostgreSQL + Directus платформа подготовки к Duolingo English Test.

## Локальный запуск и база данных

Backend при старте автоматически применяет `backend/db/init.sql` на пустой БД и все миграции из `backend/db/migrations`. Отключается через `RUN_MIGRATIONS=false`.

Для локальной БД с демо-пользователями:

```bash
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:15432/det_academy?sslmode=disable" \
  bash scripts/bootstrap_local.sh
```

Демо-аккаунты после bootstrap:

- `admin@det-academy.com` / `admin123`
- `student@det-academy.com` / `password123`

Если PostgreSQL-контейнер повреждён, поднимите чистый volume/кластер и повторите bootstrap. Production deploy не должен запускать `seed.sql`.

## Проверки

```bash
npm run typecheck
npm run lint
npx playwright test
cd backend && go test ./...
```

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deploy

Production deployment, nginx, Directus and TLS runbook: `docs/production-edge.md` and `docs/RUNBOOK.md`.
