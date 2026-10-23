# DET Academy: текущее состояние и план разработки по спринтам

Дата проверки: 23 октября 2026.

База сравнения: `docs/PRODUCT_VISION_AND_ROADMAP.md`.

## 1. Итоговая оценка

Проект прошёл путь от демонстрационного приложения к рабочему single-user MVP с реальным backend, PostgreSQL-контрактами, серверным тестовым движком, диагностикой, учебным планом, SRS, тетрадью ошибок, async evaluation queue, E2E-набором и production deployment scripts.

До долгосрочной финальной версии выполнено примерно **57%**.

Эта цифра не означает, что продукт на 57% готов к публичному масштабированию:

- функциональная готовность single-user MVP: **70–75%**;
- доверие к полному тесту и данным: **65–75%**;
- production readiness: **40–45%**;
- Speaking/Writing как калиброванный продукт: **30–40%**;
- B2B, монетизация и teacher portal: **5–10%**.

Проект уже можно использовать как контролируемую beta-версию для внутреннего тестирования. Считать его готовым полноценным аналогом подготовки к DET пока нельзя: production-интеграции не настроены, оценивание не откалибровано на реальных экспертных данных, есть критическая уязвимость зависимости, а часть внешних фактов и readiness-логики всё ещё статична или эвристична.

## 2. Что проверено

### Git

- `master` совпадает с `origin/master`;
- текущий коммит: `6aa1d70`;
- рабочая директория до создания этого отчёта была чистой;
- после продуктового видения добавлено 25 коммитов с auth, evaluation, learning, offline, a11y, deployment и map hardening.

### Локальные проверки

Прошли:

- `npm run lint`;
- `npm run typecheck`;
- `npm run build` — 28 маршрутов;
- `go test ./... -count=1`, включая `backend/tests`;
- content lint — 191 вопрос, 19 choice answers;
- content review — 226 вопросов, 0 ошибок и 0 предупреждений;
- calibration workflow unit tests — 5/5.

Не подтверждены локально:

- Playwright E2E: dev server не стартовал на macOS ARM из-за отсутствующего native SWC; конфигурация принудительно использует Turbopack;
- PostgreSQL integration tests с `TEST_DATABASE_URL`: Docker daemon не запущен;
- состояние последнего GitHub Actions run: `gh` отсутствует, публичный GitHub API исчерпал rate limit.

### Живой production

На момент проверки:

- `https://det-academy.ru/api/v1/health` — `200`;
- `https://det-academy.ru/api/v1/ready` — `200`;
- vocabulary API — `200` и возвращает данные;
- institutions API — `200` и возвращает данные;
- metrics endpoint доступен и показывает работающий процесс;
- основной сайт работает по HTTPS/HTTP2.

Production preflight заблокирован:

- отсутствуют основные security headers;
- `directus.det-academy.ru` использует сертификат без этого hostname;
- не подтверждены Apple OAuth secrets;
- не подтверждены VK/Yandex client secrets;
- neural evaluator и server STT не настроены;
- Sentry не настроен;
- SMTP/Resend не настроен.

## 3. Матрица готовности относительно финального видения

| Область | Вес | Готовность | Что уже работает | Что мешает финальной версии |
|---|---:|---:|---|---|
| Identity, безопасность и доверие | 15% | 75% | OAuth transactions, state/nonce/PKCE, Apple JWKS, refresh tokens, revocation, email verification, rate limits | Внешние провайдеры не прошли production preflight; email verification отключается без транспорта; dependency vulnerability |
| Персональное обучение | 15% | 55% | Диагностика, цели, daily tasks, SRS, Error Notebook, weekly report | Default goal создаётся без выбора пользователя; readiness — простая формула 40/60; нет полноценной mastery model и расписания по доступному времени |
| Практика и контент | 10% | 70% | 13 типов, 191 вопрос, 226 проверенных content items, теория, vocabulary, CMS-контур | Малый банк относительно регулярного использования; generators остаются шаблонными; provenance и psychometric statistics неполны |
| Server-driven mock test | 20% | 75% | Серверные сессии, owner checks, deadlines, outbox, resume, идемпотентная финализация, четыре навыка | Локальный UI всё ещё хранит собственную theta/difficulty; production neural evaluation отсутствует; реальный full-path с Postgres не перепроверен локально |
| Speaking/Writing Coach | 15% | 40% | Audio upload, queue, leases, retries, STT/provider adapter, rubric UI, evidence model | Production использует rule-based fallback; STT/provider отсутствуют; только 20-item fixture; нет 50+ реальных ответов и двойной экспертной разметки |
| Университеты | 5% | 45% | 12.5k official registry, verified coordinates, no fake map fallback | `UniversityMatchWidget` содержит ручные пороги; backend seed возвращает неподтверждённые требования; нет program-level source/check date workflow |
| Мотивация и Arena | 5% | 45% | Server WebSocket, leaderboard, reconnect, server result, bot marked as Bot | Рейтинг против бот-соперника можно использовать как игровую механику; нет полноценного activity ledger, league periods и anti-abuse analytics |
| Production/operations | 10% | 45% | Health/readiness, metrics, migrations, backups, deploy script, CI, a11y tests, PWA/offline | Critical Next.js advisory; audits non-blocking; migration errors ignored; security headers absent; Directus TLS broken; no Sentry/external provider verification |
| Teacher/B2B/monetization | 5% | 10% | Admin dashboard and roles foundation | Нет organizations, cohorts, teacher review, subscriptions, billing, entitlements и seat licensing |

Взвешенная оценка: около **57%**.

## 4. Что действительно закрыто относительно аудита 20 октября

### Доверенный результат

- Полный тест не создаёт успешный local fallback.
- Клиент не генерирует случайный certificate ID при сетевой ошибке.
- Есть `pending_sync`, `pending_evaluation`, `failed`, `expired`, `completed`.
- Ответы сохраняются через outbox.
- Сервер вычисляет итог из сохранённых ответов.
- Повторный complete возвращает immutable result.
- PostgreSQL-тест проверяет конкурентную финализацию.

### Авторизация

- Есть server-side OAuth transaction.
- State хранится в хешированном виде и потребляется один раз.
- Добавлены nonce и PKCE.
- Google работает через code exchange.
- Apple проверяет подписанный token через JWKS и audience.
- Добавлены refresh token rotation и token version/revocation.
- Пользовательские session routes защищены owner check.

### Учебный контур

- Появилась отдельная диагностика.
- Учебные задачи сохраняются сервером.
- Тетрадь ошибок унифицирована.
- SRS имеет серверную очередь и offline outbox.
- Есть недельный отчёт.
- Vocabulary опубликован через backend и поддерживает offline cache.

### Эксплуатация

- Есть CI jobs для frontend, backend, E2E, full-stack, nginx и security.
- Есть PostgreSQL migration/convergence tests.
- Есть backup/restore scripts и runbook.
- Production отказывается переходить на memory storage без явного флага.
- Есть client error reporting и queue metrics.

## 5. Блокеры, которые нужно закрыть первыми

### P0-1. Critical Next.js vulnerability

Установлен Next.js `16.3.8`. `npm audit` сообщает critical advisories и предлагает `16.4.2`.

Проблема усилена тем, что CI выполняет:

```text
npm audit ... || true
govulncheck ./... || true
```

То есть security job остаётся зелёным при критической уязвимости.

### P0-2. Миграции fail-open

Backend продолжает запуск после неуспешной migration, а deployment script выполняет `server migrate || true`. Это создаёт ситуацию, когда `/health` отвечает `200`, но новая версия работает со старой схемой.

Production должен:

- применять миграции до переключения трафика;
- блокировать rollout при ошибке;
- проверять schema version в readiness;
- выполнять rollback или оставлять прежнюю версию работающей.

### P0-3. Edge security и Directus TLS

На основном домене отсутствуют:

- HSTS;
- CSP;
- `X-Content-Type-Options`;
- `X-Frame-Options` или `frame-ancestors`;
- Referrer-Policy;
- Permissions-Policy.

`directus.det-academy.ru` не входит в SAN действующего сертификата.

### P0-4. Внешние production-интеграции не подтверждены

Preflight не видит рабочие конфигурации Apple, VK, Yandex, AI/STT, Sentry и SMTP/Resend. Код интеграций есть, но продуктовая возможность не доказана.

### P0-5. Speaking/Writing не калиброваны

Репозиторий содержит только fixture из 20 элементов. Production gate требует минимум 50 реальных ответов, двух независимых экспертов и QWK ≥ 0.70. Пока это не выполнено, точный прогноз DET и authoritative productive-skill score заявлять нельзя.

## 6. Значимые P1-проблемы

### Персонализация ещё эвристическая

Если цели пользователя нет, backend автоматически создаёт цель 125, 45 минут в день и University of Toronto. Readiness считается как:

```text
theory progress × 40% + latest mock / target × 60%
```

Это рабочий placeholder, но не финальная модель готовности.

### Университетский matching содержит неподтверждённые числа

Карта стала честнее и помечает неподтверждённые значения. Однако `UniversityMatchWidget` всё ещё содержит ручной список elite institutions с порогами и текстовыми заявлениями без source/check date. Живой backend `/institutions` также возвращает старые seed-требования.

### Arena использует рейтинговых ботов

Бот теперь явно маркируется и результат подтверждается сервером, что лучше прежней симуляции. Но победа над случайно сгенерированным ботом изменяет ELO. Для честного рейтинга bot practice нужно отделить от ranked human matches.

### E2E плохо воспроизводится локально

Playwright config запускает `next dev`, который требует native SWC/Turbopack. На проверяемом macOS ARM окружении E2E не стартовал. CI на Linux может быть зелёным, но локальная разработка остаётся хрупкой.

### Нет коммерческого и teacher-контура

В продукте нет subscriptions, payments, entitlements, organizations, cohorts и teacher review. Это соответствует текущему этапу, но составляет заметную часть финального видения.

## 7. План разработки: 10 двухнедельных спринтов

План рассчитан на последовательную работу небольшой команды. При наличии отдельных backend/frontend/content потоков часть задач можно вести параллельно, но gates каждого спринта сохраняются.

---

## Спринт 1. Release safety

### Цель

Убрать угрозы, при которых текущий production нельзя безопасно обновлять.

### Работы

1. Обновить Next.js до исправленной версии, рекомендованной audit report.
2. Пересобрать lockfile и проверить breaking changes по локальной документации Next.js.
3. Сделать `npm audit --audit-level=high` блокирующим.
4. Сделать `govulncheck` блокирующим или ввести проверенный allowlist с expiry.
5. Удалить `|| true` у production migration.
6. Прерывать startup/rollout при неуспешной migration в production.
7. Добавить schema version в readiness.
8. Перевести E2E dev server на воспроизводимый режим (`next dev --webpack`) либо гарантировать native SWC установку.
9. Добавить smoke test, который специально ломает migration и ожидает отказ rollout.

### Приёмка

- `npm audit` не содержит high/critical vulnerabilities;
- security CI падает на новой high/critical зависимости;
- backend с несовместимой схемой не считается ready;
- E2E запускается локально на macOS ARM и в Linux CI;
- build, lint, typecheck, Go tests и Playwright проходят.

---

## Спринт 2. Production edge и observability

### Цель

Сделать публичный контур безопасным и наблюдаемым.

### Работы

1. Добавить HSTS после проверки всех поддоменов.
2. Добавить CSP с allowlist используемых media/API/map endpoints.
3. Добавить `X-Content-Type-Options`, Referrer-Policy и Permissions-Policy.
4. Закрыть framing через CSP `frame-ancestors`.
5. Выпустить сертификат для `directus.det-academy.ru` или окончательно убрать внешний поддомен в пользу same-origin proxy.
6. Отключить `X-Powered-By`.
7. Настроить Sentry release/environment.
8. Ограничить публичный metrics endpoint либо отделить публичные безопасные метрики.
9. Добавить uptime checks на app, ready, auth callback, Directus proxy и evaluation queue age.

### Приёмка

- `npm run preflight:edge` проходит;
- Directus TLS hostname совпадает;
- security headers проверяются автоматическим тестом;
- production error появляется в Sentry с release и request ID;
- внутренние метрики не раскрываются анонимному пользователю.

---

## Спринт 3. Реальные внешние интеграции

### Цель

Доказать end-to-end работу auth, email и AI-контуров в staging.

### Работы

1. Настроить Google, Apple, VK и Yandex приложения для staging/production callback URLs.
2. Настроить SMTP или Resend.
3. Не отключать обязательную email verification молча: readiness должен показывать degraded/blocked конфигурацию.
4. Настроить AI provider и server STT.
5. Включить `REQUIRE_NEURAL_EVALUATION=true` только в staging.
6. Проверить timeout, retry, permanently_failed и recovery.
7. Выполнить manual critical path каждого OAuth provider.
8. Добавить synthetic tests без хранения provider secrets в репозитории.

### Приёмка

- `npm run preflight:external` проходит в staging;
- письмо регистрации реально доставляется;
- каждый OAuth provider проходит login/link/unlink;
- аудио транскрибируется сервером;
- недоступный AI не создаёт score и возвращает pending/failed;
- secrets отсутствуют в logs и Git history.

---

## Спринт 4. Assessment integrity и full-stack proof

### Цель

Подтвердить полный тест на реальной PostgreSQL, включая сбои и конкуренцию.

### Работы

1. Запустить весь PostgreSQL integration suite в локальном/staging окружении.
2. Расширить full-stack E2E до полного 13-stage mock.
3. Проверить refresh token во время длинной попытки.
4. Проверить offline → reconnect → ровно один result.
5. Проверить две вкладки и повторные stage/complete requests.
6. Проверить queue jobs при restart worker.
7. Удалить остаточную клиентскую theta как источник изменения интерфейсного difficulty либо синхронизировать её только с сервером.
8. Добавить contract test public question payload: correct answers отсутствуют.
9. Добавить load test на start/respond/complete.

### Приёмка

- полный mock проходит на real PostgreSQL;
- клиентская модификация state не меняет score;
- retry не создаёт дубликаты;
- restart не теряет evaluation job;
- server deadlines остаются источником истины;
- 95-й percentile API latency соответствует согласованному бюджету.

---

## Спринт 5. Calibration pilot

### Цель

Получить первые честные данные о качестве Speaking/Writing evaluator.

### Работы

1. Утвердить rubric и инструкцию эксперта.
2. Собрать минимум 50 реальных обезличенных ответов; целевой объём пилота — 100–150.
3. Назначить двух независимых экспертов на каждый ответ.
4. Добавить adjudication process.
5. Запустить calibration import/report/gate.
6. Разделить метрики Writing и Speaking.
7. Проанализировать ошибки по уровню, типу задания, длине и акценту.
8. Определить сегменты, где score нельзя показывать.
9. Сформулировать user-facing confidence и ограничения.

### Приёмка

- fixture не используется как production evidence;
- минимум 50 реальных items и два эксперта;
- inter-rater QWK ≥ 0.70 либо задокументирован план исправления rubric;
- human-model QWK измерен отдельно по навыкам;
- evaluator version и dataset version закреплены.

---

## Спринт 6. Настоящая персонализация

### Цель

Заменить дефолты и простую readiness-формулу на пользовательскую траекторию.

### Работы

1. Добавить обязательный onboarding цели вместо автоматических 125/Toronto.
2. Хранить target subscores, timezone, доступные дни и минуты.
3. Ввести mastery по skill/task/pattern.
4. Строить daily plan из due SRS, ошибок, weakest skill и доступного времени.
5. Учитывать freshness и стабильность нескольких attempts.
6. Разделить readiness и predicted score.
7. Показывать `недостаточно данных` вместо искусственного процента.
8. Добавить объяснение, почему назначена каждая задача.
9. Проверить пересчёт после пропущенного дня.

### Приёмка

- новый пользователь сам задаёт цель;
- пустой аккаунт не получает фиктивный университет;
- readiness не строится по одной попытке;
- задача дня укладывается в доступное время;
- пользователь видит причину рекомендации;
- план воспроизводим из server events.

---

## Спринт 7. Speaking/Writing Coach

### Цель

Превратить evaluation pipeline в повторяемый учебный цикл.

### Работы

1. Добавить сравнение двух версий ответа.
2. Показывать evidence span → правило → исправление → повтор.
3. Привязать feedback к Error Notebook.
4. Создавать targeted follow-up drill.
5. Отображать provider/version/confidence в служебных данных результата.
6. Разделить быстрый coaching feedback и mock score.
7. Добавить retention controls для аудио и удаление данных.
8. Улучшить accessibility записи, playback и transcript correction.

### Приёмка

- пользователь может переписать/перезаписать ответ;
- интерфейс показывает конкретное улучшение;
- feedback создаёт повторяемую ошибку/упражнение;
- ошибка provider не отображается как нулевой навык;
- удаление аудио выполняется по политике.

---

## Спринт 8. Достоверные университеты и content operations

### Цель

Удалить последние неподтверждённые внешние факты.

### Работы

1. Удалить ручной `ELITE_INSTITUTIONS_BENCHMARKS` из пользовательского matching.
2. Добавить `ProgramRequirement` и `RequirementSource`.
3. Хранить source URL, checked_at, reviewer и verification status.
4. Не использовать общий university threshold для всех программ.
5. Перевести backend seed institutions в source-backed данные или убрать score.
6. Добавить recheck queue для устаревших требований.
7. Ввести CMS draft/review/publish/archive.
8. Добавить content version, reviewer и rollback.
9. Собирать item difficulty/discrimination из реальных попыток.

### Приёмка

- каждое показанное admission requirement имеет источник и дату;
- неизвестный score отображается как неизвестный;
- карта и matching используют одну модель данных;
- unpublished content не попадает в test API;
- проблемный вопрос можно отозвать по версии.

---

## Спринт 9. Retention, Arena и честная геймификация

### Цель

Увеличивать регулярность, не позволяя игре подменять обучение.

### Работы

1. Ввести единый activity/XP ledger.
2. Добавить idempotency key всем reward events.
3. Перевести streak на server timezone policy.
4. Создать weekly league periods и finalization.
5. Отделить Arena practice bot от ranked human queue.
6. Не изменять ELO в bot practice.
7. Добавить anti-abuse signals и match audit.
8. Настроить reminders с quiet hours и opt-out.
9. Сравнивать experiments по learning gain и D7, а не только sessions.

### Приёмка

- повтор события не начисляет награду;
- бот не влияет на human ELO;
- streak объясним пользователю;
- лига воспроизводится из ledger;
- retention experiment не ухудшает completion/mastery.

---

## Спринт 10. Commercial beta и выпускной gate

### Цель

Подготовить продукт к ограниченной платной beta и следующему этапу B2B.

### Работы

1. Добавить subscriptions, entitlements и webhook ledger.
2. Разделить Free/Premium без ограничения безопасности и доступа к своим данным.
3. Подготовить organization/cohort data model.
4. Сделать минимальный teacher progress view и review queue.
5. Провести privacy review текстов и аудио.
6. Провести внешний security review.
7. Выполнить backup/restore drill.
8. Выполнить load test и capacity plan.
9. Пройти ручной critical path на телефоне и компьютере.
10. Выпустить beta только после прохождения release checklist.

### Приёмка

- entitlement нельзя получить изменением клиента;
- payment webhook идемпотентен;
- teacher видит только свой cohort;
- restore проверен на отдельной БД;
- P0/P1 security findings закрыты;
- production preflight, calibration gate и critical path зелёные.

## 8. Рекомендуемый порядок первых четырёх недель

### Неделя 1

- Next.js upgrade;
- security CI fail-closed;
- migration/deploy fail-closed;
- Playwright reproducibility.

### Неделя 2

- security headers;
- Directus TLS;
- Sentry;
- metrics access control;
- повторный edge preflight.

### Неделя 3

- SMTP/Resend;
- OAuth staging applications;
- AI/STT staging provider;
- external integration smoke tests.

### Неделя 4

- полный real-Postgres mock E2E;
- offline/reconnect;
- concurrency/restart;
- assessment integrity report.

До завершения этих четырёх недель не расширять банк функций. Текущая ценность проекта сильнее вырастет от доказанной надёжности уже реализованного пути, чем от нового экрана.

## 9. Метрики ближайших спринтов

### Engineering

- high/critical vulnerabilities: 0;
- failed migrations accepted by deploy: 0;
- E2E reproducibility on supported developer platforms: 100%;
- duplicate results/certificates: 0;
- evaluation jobs older SLA: 0;
- production preflight failures: 0.

### Product

- diagnostic completion;
- plan creation after diagnostic;
- first recommended session completion;
- D1/D7 retention;
- mock completion;
- offline resume success;
- time to Speaking/Writing feedback;
- Error Notebook recall completion;
- mastery gain.

### Assessment

- inter-rater QWK;
- human-model QWK;
- score confidence coverage;
- insufficient/not-measured rate;
- model failure/retry rate;
- stability across repeated mocks.

## 10. Следующая конкретная задача

Начать со Спринта 1 одним PR `release-safety`:

1. обновить Next.js;
2. сделать dependency audits блокирующими;
3. сделать migration/deploy fail-closed;
4. починить локальный Playwright через поддерживаемый Next.js режим;
5. добавить regression tests;
6. прогнать CI и production preflight;
7. не включать новые продуктовые функции в этот PR.

Это самый высокий по ценности следующий шаг: он устраняет известную critical-уязвимость, предотвращает запуск приложения на несовместимой схеме и возвращает доверие к автоматическим проверкам.
