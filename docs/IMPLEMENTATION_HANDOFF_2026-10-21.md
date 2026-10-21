# DET Academy: план реализации для следующей модели

Дата фиксации состояния: 21 октября 2026.

Этот документ — исполняемый handoff. Его задача — довести DET Academy от функционального прототипа до надёжной платформы подготовки к Duolingo English Test. Не считать задачу выполненной по зелёной сборке: нужно проверять реальный пользовательский путь, серверную целостность данных и отрицательные сценарии.

Связанные документы:

- `docs/PROJECT_AUDIT_2026-10-20.md` — исходный аудит всего проекта;
- `docs/NEXT_STEPS_2026-10-21.md` — состояние после объединения локального и удалённого Git;
- этот файл — порядок реализации для следующего исполнителя.

## 1. Исходное состояние

Ветка `master` синхронизирована с `origin/master`. Базовый merge-коммит:

```text
8d1cc03b0d2a72f66bddf3582adecac8b13a2cc4
merge: synchronize local audit implementation with origin/master
```

На этой точке:

- `npm run build` проходит;
- `npx tsc --noEmit` проходит;
- `go test ./...` проходит;
- `npm run lint` проходит с 129 предупреждениями и без ошибок;
- frontend E2E suite отсутствует;
- backend integration tests в основном используют in-memory repository;
- production OAuth, PostgreSQL, Directus и внешний speech pipeline не проверены end-to-end.

Перед началом работы выполнить:

```bash
git status --short --branch
git fetch --prune origin
git rev-list --left-right --count master...origin/master
npm run lint
npx tsc --noEmit
npm run build
(cd backend && go test ./...)
```

Если рабочая копия содержит пользовательские изменения, не сбрасывать и не перезаписывать их. Сначала определить их назначение и сохранить отдельно.

## 2. Неподлежащие обсуждению правила

1. Браузер не является источником истины для личности, владельца попытки, выданных вопросов, времени, баллов, статуса завершения, сертификата, рейтинга или streak.
2. Ошибка API не должна превращаться в успешный результат. Допустимые состояния: `pending`, `offline`, `failed`, `unsupported`, `expired`, `not_found`.
3. Статический учебный контент допустим. Недопустимы вымышленные изменяемые данные: требования вузов, пользовательские достижения, подтверждённые баллы, live opponents, внешняя доставка и успешная верификация.
4. Сначала исправлять серверный контракт и целостность, затем интерфейс.
5. Один пользовательский процесс должен иметь один источник данных. Не создавать второй store, второй scoring engine или второй API adapter для той же сущности.
6. Все команды изменения состояния должны быть авторизованы, проверять владельца и поддерживать безопасный повтор запроса.
7. Не называть внутренний прогноз официальным баллом DET. До калибровки использовать формулировки «тренировочная оценка», диапазон и уровень уверенности.
8. Не маскировать незавершённую интеграцию fallback-данными. Отсутствующая возможность должна отображаться явно.
9. Не ослаблять тесты ради прохождения CI. Исправлять контракт или реализацию.
10. Каждый этап заканчивать проверкой реального сценария, а не только unit tests.

## 3. Порядок выполнения

Работать строго в следующем порядке:

1. Trusted result path — убрать ложный успех и дубли пользовательских данных.
2. OAuth hardening — криптографически подтверждать внешнюю личность.
3. PostgreSQL integrity — транзакции, идемпотентность и восстановление.
4. Server-driven exam — один движок попытки и четыре навыка.
5. Speaking/Writing pipeline — асинхронная проверка и объяснимый feedback.
6. Static-data cleanup — вузы, Arena, лиги, demo и CMS.
7. Персональная подготовка и аналитика.
8. Production release gate.

Не начинать геймификацию, новые лендинги или расширение банка контента, пока этапы 1–3 не приняты.

---

## Этап 1. Trusted result path

### Цель

Исключить ситуацию, в которой браузер при недоступном backend создаёт балл, сертификат или завершённую попытку.

### Основные файлы

- `src/components/test-engine/TestController.tsx`
- `src/store/useTestStore.ts`
- `src/store/useProgressStore.ts`
- `src/lib/api.ts`
- `src/app/test/session/page.tsx`
- `src/components/test-engine/TestResultModal.tsx`
- `src/app/verify/[id]/page.tsx`
- `src/store/useErrorNotebookStore.ts`
- `src/store/useErrorBankStore.ts`
- `src/components/practice/ErrorBankModal.tsx`
- `src/components/dashboard/ErrorNotebookWidget.tsx`
- `src/store/useAuthStore.ts`

### 1.1. Ввести явную модель состояния попытки

Добавить тип, эквивалентный:

```ts
type AttemptStatus =
  | 'starting'
  | 'in_progress'
  | 'submitting'
  | 'pending_sync'
  | 'pending_evaluation'
  | 'completed'
  | 'failed'
  | 'expired';
```

Хранить отдельно:

- server session ID;
- server revision/version;
- последний подтверждённый stage;
- неподтверждённые ответы;
- причину ошибки;
- время последней синхронизации;
- подтверждённый сервером result ID.

Не использовать наличие локальных scores как признак завершения.

### 1.2. Удалить локальный успешный fallback

В `TestController.tsx` удалить ветки, которые:

- вызывают `finishTestAndCalculateScores()` при ошибке `completeTestSession`;
- создают случайный `det-cert-*`;
- записывают результат в историю без ответа backend;
- завершают тест при отсутствии `backendSessionId`.

Новое поведение:

- при сетевой ошибке сохранить attempt как `pending_sync`;
- показать пользователю, что ответы сохранены локально, но результат не подтверждён;
- дать повторить синхронизацию;
- после reconnect сначала получить серверное состояние сессии;
- отправить только недостающие ответы;
- вызвать idempotent complete;
- добавить историю только из server response.

### 1.3. Убрать фиктивные сертификаты

- Результат без `certificate.id` не получает ссылку `/verify/...`.
- Удалить `/verify/demo` из рабочего пользовательского пути.
- Не использовать случайный ID как ID результата.
- Разделить `resultId` и `certificateId`.
- Проверить, что неизвестный ID даёт `404/not found`, сетевой сбой — отдельное сообщение, отозванный документ — отдельный статус.
- Текст документа должен говорить, что это отчёт или сертификат DET Academy, а не официальный документ Duolingo.

### 1.4. Унифицировать токен

Сейчас в коде встречаются `det_token` и `det_auth_token`.

Нужно:

- определить единственный auth adapter;
- запретить feature stores читать localStorage напрямую;
- перевести API client, Error Notebook, SRS, profile и arena на adapter;
- добавить одноразовую миграцию старого ключа;
- очищать старый ключ после успешной миграции;
- тестировать logout/login двух пользователей в одной вкладке.

Предпочтительное дальнейшее направление — HttpOnly cookie или короткоживущий access token с refresh/revocation. Если это выходит за границы первого PR, сохранить adapter так, чтобы transport можно было заменить без переписывания features.

### 1.5. Объединить Error Bank и Error Notebook

`useErrorBankStore.ts` — новый локальный store. `useErrorNotebookStore.ts` уже связан с backend и пользовательским ID. Оставить одну модель.

Порядок:

1. расширить серверную модель недостающими полями типов упражнений;
2. перевести `ErrorBankModal` на API-backed store;
3. обновить задания, которые вызывают `useErrorBankStore.getState().addError`;
4. добавить миграцию `det_error_bank_v2` в пользовательскую тетрадь;
5. удалить старый store и ключ после миграции;
6. обеспечить дедупликацию на сервере, а не только в браузере.

### 1.6. Минимальные E2E tests

Добавить Playwright и тестовое окружение, если в проекте нет другого принятого E2E-инструмента.

Обязательные сценарии:

1. backend недоступен при финализации — нет балла, сертификата и success screen;
2. backend восстановлен — повторная синхронизация создаёт ровно один результат;
3. неизвестный certificate ID — error/not found;
4. пользователь A выходит, пользователь B входит — данные A не видны;
5. двойной клик завершения — одна финализация.

### Критерий приёмки этапа 1

- В коде полного теста нет генерации локального успешного результата.
- `det-cert-*` не создаётся на клиенте.
- Нет двух активных stores ошибок.
- Нет прямых обращений features к двум разным token keys.
- Offline/error paths покрыты браузерными тестами.
- Build, types, lint, Go tests и E2E проходят.

### Рекомендуемые коммиты

1. `fix(test): remove client-generated completion results`
2. `refactor(auth): centralize client session access`
3. `refactor(practice): merge error bank into server notebook`
4. `test(e2e): cover failed and retried test completion`

---

## Этап 2. OAuth hardening

### Цель

Идентичность пользователя должна подтверждаться провайдером, а не содержимым токена, email из браузера или неподтверждённым provider ID.

### Основные файлы

- `backend/internal/service/auth_service.go`
- `backend/internal/handlers/auth_handler.go`
- `backend/internal/models/models.go`
- `backend/internal/config/config.go`
- `backend/internal/repository/repository.go`
- `backend/internal/repository/postgres/*`
- `backend/db/init.sql`
- `backend/tests/api_test.go`
- `src/components/auth/AuthModal.tsx`
- `src/app/auth/callback/page.tsx`
- `.env.example`

### 2.1. Google

Текущий `verifyGoogleToken` принимает успешный tokeninfo/userinfo response, но не обеспечивает полный контракт.

Нужно проверять:

- cryptographic/provider validation выбранного flow;
- `iss`;
- `aud` против настроенного Google client ID;
- `exp` и при наличии `nbf/iat`;
- nonce для ID token flow;
- `email_verified` перед использованием email;
- одноразовость authorization code;
- redirect URI и PKCE verifier.

Не поддерживать одновременно несколько неявных вариантов, если их нельзя одинаково безопасно проверить. Выбрать один основной flow.

### 2.2. Apple

Текущий код только base64-декодирует payload. Это критическая проблема.

Нужно:

- получить Apple JWKS;
- проверить алгоритм и подпись JWT;
- выбрать ключ по `kid`;
- проверить `iss`, `aud`, `exp`, nonce;
- кешировать JWKS с ограниченным TTL и обновлять при неизвестном `kid`;
- не доверять email при отсутствии нужного подтверждения;
- запретить токены для другого Service ID/client ID.

### 2.3. VK и Yandex

Проверить:

- server-stored state;
- PKCE для поддерживающего его flow;
- redirect URI allowlist;
- одноразовость code;
- отсутствие client-supplied identity после обмена;
- таймауты, ограниченный размер ответов и безопасное логирование.

### 2.4. Связывание аккаунтов

- Основной ключ внешней личности: `provider + provider_subject`.
- Не отнимать связь у другого пользователя автоматически.
- Не создавать связь по домену email.
- Объединение аккаунтов — отдельная операция с повторным подтверждением обеих сторон.
- Все конфликты логировать как security event без токенов и персональных секретов.

### 2.5. Серверное состояние OAuth

Добавить таблицу/хранилище одноразовых OAuth transactions:

- state hash;
- nonce hash;
- PKCE metadata;
- provider;
- redirect target из allowlist;
- expiry;
- consumed_at.

Использовать атомарное consume. Повтор callback должен отклоняться.

### Тесты этапа 2

- валидный provider response;
- отсутствующий token/code;
- токен с изменённым payload;
- неправильная подпись;
- чужой audience;
- неправильный issuer;
- истёкший токен;
- неподтверждённый email;
- повторно использованный code/state;
- занятый provider subject;
- попытка привязки к чужому аккаунту;
- недоступный JWKS/provider timeout.

Для provider HTTP использовать controllable fake server и dependency injection. Не делать unit tests зависимыми от реального Google/Apple.

### Критерий приёмки этапа 2

Одного email, распарсенного JWT payload, произвольного provider ID или токена для другого client ID недостаточно для входа или связывания аккаунта.

---

## Этап 3. PostgreSQL integrity

### Цель

Подтвердить, что серверный жизненный цикл попытки выдерживает конкуренцию, повторы запросов, rollback и перезапуск процесса.

### Основные файлы

- `backend/internal/service/cat_service.go`
- `backend/internal/repository/repository.go`
- `backend/internal/repository/postgres/*`
- `backend/internal/models/models.go`
- `backend/db/init.sql`
- `backend/cmd/server/main.go`
- `backend/tests/api_test.go`
- `docker-compose.yml`

### 3.1. Схема

Проверить или добавить:

- уникальность одной выдачи question/order внутри session;
- уникальность одного accepted response на question с понятной политикой revision;
- один final result на session;
- один certificate на eligible session;
- idempotency key для state-changing commands;
- optimistic version или row lock для session;
- явные timestamps и статусы;
- evaluator/blueprint version;
- constraints допустимых переходов статуса.

Все изменения схемы оформить повторяемыми migrations. Не полагаться только на редактирование `init.sql` для существующей БД.

### 3.2. Транзакционная финализация

В одной транзакции:

1. заблокировать session;
2. проверить owner и статус;
3. проверить полноту обязательных заданий или серверные timeout records;
4. зафиксировать недостающие детерминированные оценки;
5. вычислить result одной versioned функцией;
6. сохранить immutable result;
7. изменить status session;
8. создать certificate/report, если выполнены правила;
9. записать audit event;
10. commit.

Повтор с тем же idempotency key возвращает прежний result. Повтор с другим payload после завершения не меняет итог.

### 3.3. Интеграционные тесты с PostgreSQL

Тесты должны поднимать настоящую БД в изолированном окружении и проверять:

- два конкурентных `complete`;
- повтор `respond`;
- `complete` одновременно с последним `respond`;
- rollback при ошибке создания certificate;
- сохранность после restart backend;
- migration с предыдущей схемы;
- foreign keys и unique constraints;
- owner isolation на уровне реального repository.

### 3.4. Production startup

- Production не запускается без БД и обязательных secrets.
- Readiness падает, если обязательная БД недоступна.
- Development memory mode включается только явно.
- Connection string не попадает в логи.
- CORS использует реальную allowlist.
- Добавлены request body limits, sensible timeouts и rate limits на auth/expensive endpoints.

### Критерий приёмки этапа 3

Конкурентные и повторные запросы создают ровно одну неизменяемую финализацию; данные переживают restart; production не переключается скрыто на память.

---

## Этап 4. Единый server-driven exam engine

### Цель

Убрать второй экзаменационный движок из браузера. Сервер должен выдавать задания, принимать ответы, управлять временем и возвращать единственный результат.

### Основные файлы

- `backend/internal/service/cat_service.go`
- `backend/internal/service/evaluator.go`
- `backend/internal/models/models.go`
- `backend/internal/handlers/test_handler.go`
- `src/components/test-engine/TestController.tsx`
- `src/store/useTestStore.ts`
- `src/lib/scoring.ts`
- `src/lib/irtCatEngine.ts`
- `src/data/questionBank.ts`
- все `src/components/test-engine/questions/*`

### 4.1. Versioned blueprint

Создать явную структуру blueprint:

- version;
- task types;
- min/max counts;
- grouping rules для Interactive Reading/Listening/Speaking;
- time limits;
- eligibility для адаптивной выдачи;
- scoring dimensions;
- experimental flags.

Не зашивать порядок независимо в frontend и backend. Клиент рендерит серверный `taskType` и server state.

### 4.2. Server-issued questions

Каждая выдача содержит:

- assignment ID;
- question version ID;
- task type;
- public prompt payload без ответа;
- issued_at;
- deadline;
- attempt number;
- server stage/revision.

Ответы и model answers не должны попадать в публичный payload до завершения задания.

### 4.3. Server-authoritative timing

- Таймер интерфейса информирует пользователя.
- Допустимость ответа определяет сервер по deadline и правилам grace period.
- Background tab, изменение часов, пауза рендера и повтор запроса не продлевают время.
- Timeout фиксируется отдельным server event.

### 4.4. Scoring model

Возвращать:

- Reading;
- Listening;
- Writing;
- Speaking;
- integrated scores, вычисленные из соответствующих individual scores;
- Overall;
- confidence/range;
- completeness;
- evaluator version.

До калибровки не заявлять точное соответствие официальному DET. Если данных недостаточно, skill получает `not_measured`, а не значение из другого навыка.

### 4.5. Удаление клиентского scoring

- `src/lib/scoring.ts` оставить только для локального coaching, если это явно обозначено, либо удалить;
- `src/lib/irtCatEngine.ts` не должен определять итог полного теста;
- client ratios не передаются в complete request;
- сервер пересчитывает результат из сохранённых ответов/evaluations;
- изменение Zustand/localStorage не влияет на итог.

### Тесты этапа 4

- полный blueprint со всеми обязательными группами;
- forbidden transition;
- ранний complete;
- пропущенный обязательный task;
- server timeout;
- reload/resume;
- две вкладки;
- изменение client score payload;
- одинаковые сохранённые ответы дают одинаковый versioned result;
- skill без данных остаётся `not_measured`.

### Критерий приёмки этапа 4

Клиент нельзя модифицировать так, чтобы повысить балл, пропустить обязательные задания, изменить deadline или завершить чужую попытку.

---

## Этап 5. Speaking/Writing pipeline

### Цель

Дать полезную тренировку productive skills, не выдавая простые эвристики за точную оценку DET.

### 5.1. Модель задания

Хранить:

- исходный prompt/version;
- audio object metadata и checksum;
- transcript;
- transcript provider/version;
- rubric scores;
- evaluator provider/model/version;
- evidence spans;
- processing status;
- retry count;
- timestamps;
- final human override при наличии.

### 5.2. Очередь

Состояния:

```text
uploaded -> queued -> transcribing -> evaluating -> completed
                                      -> retryable_failed
                                      -> permanently_failed
```

API должен возвращать `202`/pending для незавершённой обработки. UI polling или realtime обновляет статус. Нельзя подставлять `0`, `0.75` или модельный transcript как будто проверка состоялась.

### 5.3. Feedback

Разделить:

- task completion/relevance;
- organization/coherence;
- grammar;
- vocabulary;
- fluency;
- pronunciation/intelligibility;
- конкретные доказательства и исправления;
- одно следующее упражнение.

### 5.4. Калибровка

- собрать согласованный обезличенный dataset;
- два независимых эксперта на часть ответов;
- измерять inter-rater agreement;
- сравнивать model vs human;
- отслеживать drift по version;
- не менять evaluator version внутри уже завершённой попытки.

### Критерий приёмки этапа 5

Ошибка микрофона, STT или evaluator отображается как unsupported/pending/failed. Пользователь видит источник каждого замечания и может повторить ответ.

---

## Этап 6. Очистка недостоверной статики

### 6.1. Университеты

Основные файлы:

- `src/data/institutionsData.ts`
- `src/components/institutions/InstitutionsMap.tsx`
- `src/components/institutions/UniversityMatchWidget.tsx`
- `backend/internal/service/institution_service.go`
- `backend/internal/repository/*`

Для каждого требования хранить:

- institution/program;
- requirement type;
- value/range;
- source URL;
- source title;
- checked_at;
- valid_from/valid_until при наличии;
- verification status;
- reviewer/source method.

Удалить эвристики вида «общий балл ≥ 125 означает subscore 120». Если данных нет, показывать `не подтверждено`.

Fallback dataset допустим только как каталог названий/координат, если он явно не выдаёт неподтверждённые admission requirements.

### 6.2. Arena

Основной файл: `src/app/arena/page.tsx`.

Удалить simulated success из рабочего режима. Реализовать:

- серверную очередь;
- match ID и authoritative state;
- серверную проверку каждого раунда;
- disconnect/reconnect;
- timeout/forfeit;
- один rating transaction;
- защиту от повторной доставки;
- явный training bot mode, если нужен одиночный fallback.

### 6.3. Лиги, XP и streak

- Сервер хранит immutable activity ledger.
- Агрегаты вычисляются из событий.
- У события есть уникальный source ID.
- Повтор запроса не начисляет XP повторно.
- Streak учитывает timezone policy и server time.
- Лига строится по серверной таблице периода.

### 6.4. Demo mode

- Отдельные demo users/data namespace.
- Явная маркировка demo на каждом экране.
- Demo не создаёт production certificate, рейтинг и реальные analytics events.
- Demo fallback не включается автоматически при ошибке production API.

### 6.5. Контент и CMS

- Один publishing workflow: draft → reviewed → published → archived.
- Version и reviewer для заданий.
- Ответы не входят в публичную выдачу до submission.
- Контентные генераторы не публикуют результат автоматически.
- Проверка дубликатов, длины, языка, answer validity и медиа.
- Local assets сохраняются; внешние CDN не должны ломать основной тест.

### Критерий приёмки этапа 6

В продукте нет чисел, требований, оппонентов, достижений или успешных состояний, происхождение которых нельзя объяснить пользователю и проверить в серверных данных.

---

## Этап 7. Персональная подготовка и рост

Начинать после принятия этапов 1–4.

### 7.1. Диагностика

- покрывает четыре individual skills;
- возвращает диапазон и confidence;
- показывает `not_measured` при недостатке данных;
- создаёт первый plan только из подтверждённых результатов.

### 7.2. План на день

Единая очередь:

1. слабый навык;
2. короткое объяснение;
3. targeted drill;
4. recall собственной ошибки;
5. mini-check;
6. обновление mastery/confidence.

### 7.3. SRS

- due items выбираются сервером;
- scheduling policy versioned;
- ответы создают события;
- офлайн-события имеют idempotency key;
- пользователь видит причину появления карточки.

### 7.4. Weekly report

Показывать:

- фактическое время занятий;
- объём подтверждённой практики;
- mastery по навыкам;
- прогнозный диапазон и confidence;
- главное узкое место;
- выполненные рекомендации;
- план следующей недели.

### 7.5. Продуктовая аналитика

События должны иметь server/user/session IDs и не содержать полный текст чувствительных ответов без необходимости.

Основная воронка:

```text
registration
-> diagnostic_started
-> diagnostic_completed
-> plan_created
-> first_learning_session_completed
-> day_2_return
-> first_mock_completed
-> second_mock_completed
-> estimated_range_improved
```

Ключевые метрики:

- diagnostic completion;
- time to first useful feedback;
- D1/D7 retention;
- weekly active learners;
- доля выполненных рекомендаций;
- mastery gain;
- изменение прогнозного диапазона;
- completion rate полного теста;
- evaluation failure rate;
- доля пользователей с неподтверждёнными/pending результатами.

---

## Этап 8. Production release gate

Перед выпуском обязательны:

### Автоматические проверки

- frontend lint без ошибок;
- TypeScript;
- production build;
- Go unit tests;
- PostgreSQL integration tests;
- browser E2E;
- migration test;
- dependency/security scan;
- проверка отсутствия секретов в репозитории.

### Ручной critical path

1. регистрация email/password;
2. каждый OAuth provider;
3. logout/login;
4. диагностика;
5. урок;
6. practice task;
7. Error Notebook recall;
8. Speaking upload;
9. полный тест;
10. сетевой сбой и resume;
11. получение результата;
12. публичная проверка существующего ID;
13. проверка неизвестного ID;
14. повторный вход с другого устройства.

### Эксплуатация

- structured logs без секретов;
- request/correlation ID;
- error tracking;
- latency/error dashboards;
- queue depth и age;
- DB backup и restore drill;
- documented rollback;
- alert на evaluation backlog, auth failures и DB readiness;
- privacy/retention policy для audio и written responses.

Релиз блокируется, если любой API outage создаёт успешный fallback, если можно изменить итог с клиента или если production silently переходит на memory storage.

---

## 4. Первая задача следующей модели

Начать с этапа 1 и довести его полностью до критериев приёмки.

Конкретный первый проход:

1. найти все `finishTestAndCalculateScores`, `det-cert-`, `/verify/demo`, `det_auth_token`, `det_token`, `useErrorBankStore`, `useErrorNotebookStore`;
2. нарисовать фактический state transition полного теста;
3. добавить failing E2E или integration regression для offline completion;
4. изменить модель attempt state;
5. удалить client success fallback;
6. реализовать retry/resume;
7. объединить auth access;
8. объединить error stores;
9. прогнать полный набор проверок;
10. вручную пройти happy path и outage path;
11. обновить этот документ фактическим статусом и оставшимися рисками.

Не переходить к OAuth или новым функциям, пока первый этап не завершён и не проверен в браузере.

## 5. Формат отчёта после каждого этапа

Следующая модель должна сообщить:

1. что изменилось в поведении пользователя;
2. какие старые ложные/небезопасные пути удалены;
3. какие серверные инварианты добавлены;
4. какие тесты подтверждают результат;
5. какие команды прошли;
6. какие риски остались;
7. точные файлы и коммиты;
8. можно ли переходить к следующему этапу и почему.

Запрещено писать «готово» только на основании build или unit tests. Для каждого этапа требуется доказательство критического пользовательского сценария и отрицательного пути.

---

## 6. Фактический статус этапа 1 (21 октября 2026)

### 6.1. Что изменилось для пользователя

- Полный тест нельзя завершить локально: при недоступном API показывается экран «Результат ожидает подтверждения», а не балл, сертификат или success screen.
- После восстановления API повторная синхронизация идемпотентно возвращает один и тот же серверный результат; повторный клик не создаёт второй результат.
- Если сервер уже завершил попытку, а ответ потерялся, resume вызывает idempotent complete и показывает прежний результат.
- Ссылка на проверку отчёта появляется только при наличии серверного `certificate.id`; `/verify/demo` удалён из пользовательского пути.
- Неизвестный ID и недоступность реестра теперь разные состояния: `404` — «не найден», сетевой сбой — «реестр недоступен».
- Ошибки из Read & Select, Fill in the Blanks, C-Test и Dictation пишутся в одну серверную тетрадь; локальный `det_error_bank_v2` мигрирует в неё и удаляется.
- Токен хранится в одном адаптере (`src/lib/auth-session.ts`); старый ключ `det_token` мигрирует в `det_auth_token` и удаляется.

### 6.2. Удалённые ложные и небезопасные пути

- Удалён `finishTestAndCalculateScores()` и все ветки локального успешного fallback в `TestController`.
- Удалена генерация `det-cert-*` и случайных ID результатов на клиенте.
- Удалена ссылка `/verify/demo` из `TestResultModal`.
- Удалён второй store ошибок `src/store/useErrorBankStore.ts`.
- Удалены прямые проверки `det_token` / `det_auth_token` из feature stores.
- Удалён локальный вывод «сертификат доступен» на dashboard; вместо него — ссылка на серверный реестр.

### 6.3. Добавленные инварианты

- `AttemptStatus` (`starting`, `in_progress`, `submitting`, `pending_sync`, `pending_evaluation`, `completed`, `failed`, `expired`) и раздельные `resultId` / `certificateId`.
- Попытка не стартует без серверной сессии; вопросы не рендерятся без подтверждённого `backendSessionId`.
- `completeTestSession` на backend идемпотентен: повторный вызов для `COMPLETED` возвращает существующий immutable result и сертификат, не пересчитывая баллы.
- Ошибка сети при финализации переводит попытку в `pending_sync`, а не в `completed`.
- Ошибка 4xx при финализации переводит попытку в `failed`; успешный экран не показывается.
- Error Notebook: серверная дедупликация по `prompt + correctAnswer`, локальные pending-элементы, отдельный кэш на пользователя.

### 6.4. Подтверждающие тесты

- `backend/tests/api_test.go`: повторный `complete` возвращает тот же результат; в списке ровно одна завершённая сессия.
- `e2e/test-completion.spec.ts`:
  - `503` при финализации → нет балла, нет ссылки `/verify/...`, есть «Результат ожидает подтверждения»;
  - двойной клик retry → ровно два HTTP-вызова complete (первый неуспешный, второй успешный) и одна запись истории;
  - resume уже завершённой попытки → один idempotent complete и восстановленный результат.
- `e2e/verify.spec.ts`: `404`, сетевой сбой и существующий отчёт различаются.
- `e2e/auth-session.spec.ts`: миграция legacy-токена; после logout/login пользователя B кэш ошибок пользователя A не отображается.

### 6.5. Выполненные команды

```bash
npx tsc --noEmit
npm run lint          # 0 errors, 119 pre-existing warnings
npm run build
(cd backend && go test ./...)
npx playwright test   # 7 passed
```

### 6.6. Оставшиеся риски (не блокируют этап 1, но обязательны для этапов 3–4)

- Баллы чтения и аудирования всё ещё передаются в complete как клиентские ratio-hints; сервер использует их, если по навыку нет записанных ответов. Этап 4 должен пересчитывать все четыре навыка из server-issued responses.
- Нет общего outbox для ответов на вопросы: ошибка сети при `respond`/`stage-complete` не ставит конкретный ответ в очередь. Финализация защищена, но отдельные ответы могут потеряться до этапа 3/4.
- Транзакционная блокировка сессии, уникальность response/question и конкурентные complete остаются задачей этапа 3. Сейчас идемпотентность проверена последовательными повторами.
- `useProgressStore` продолжает кэшировать часть прогресса в localStorage; сервер остаётся источником результатов теста, но streak/теория будут вынесены на сервер на этапах 3 и 6.
- На dashboard остаётся hydration warning из-за localStorage-имени пользователя при SSR; на trusted result path не влияет.

### 6.7. Решение по gate

Критерии приёмки этапа 1 выполнены: локальный успешный результат удалён, фиктивные сертификаты не создаются, два error store объединены, auth-ключ один, offline/outage-сценарии покрыты браузерными тестами. Можно переходить к этапу 2 (OAuth hardening) без расширения геймификации и контента.

---

## 7. Итерация 2: честный скоринг, server-driven экзамен и UX (21 октября 2026)

### 7.1. Что изменилось в поведении

- Пропущенный навык больше не получает средний балл. Если навык не измерен, сервер возвращает `notMeasured`, `completeness`, `confidence` и `rangeLow/rangeHigh`; при неполном покрытии `overall = 0`.
- Результат с неполными данными показывает «Недостаточно данных» вместо числа, процент завершённости, список пропущенных навыков и не пишется в историю как балл.
- Клиент больше не отправляет `readSelectAccuracy`, `writingScore` и другие ratio-hints. `POST /complete` принимает пустое тело; итог считается только по сохранённым ответам.
- Все объективные этапы используют серверные вопросы: Read & Select, Fill in the Blanks, C-Test, Listen and Type, Interactive Reading, Interactive Listening, Write About the Photo.
- Из `contentPayload` удалены утечки ответов: `fullWord`, `gapSentence.correct`, `correctIndex`, `titleQuestion.correctIndex`, `mainIdeaQuestion.correctIndex`, `turns[].correctIndex`.
- Добавлен outbox ответов: ответ сначала синхронизируется в localStorage, затем отправляется; при сбое повторяется перед stage-complete и complete.
- Сервер отклоняет ответ после дедлайна этапа (с grace 10 секунд) и не принимает ответы в `COMPLETED`/`STAGE=COMPLETED`.
- `question_responses` получил уникальность `(session_id, question_id)` и upsert; повторный `respond` обновляет ответ, а не дублирует.
- Добавлен серверный ledger активности и streak (`/user/streak`, `/user/activity`). Фронтенд синхронизирует streak с сервером, локальное значение остаётся только офлайн-кэшем.
- На экзамене появился постоянный серверный таймер этапа; cookie-баннер скрыт на `/test/session`.
- Добавлены `autocorrect="off"`, `autocapitalize="none"`, `spellcheck=false`, `inputMode` и размеры полей 16px+ для мобильных/планшетных ответов.
- Добавлен открытый каталог `/vocabulary`: Academic Word List, ловушки Read & Select и слова Fill in the Blanks.
- В результате теста появился блок «Что делать дальше»: слабейший измеренный навык, SRS, следующий mock через 7–10 дней.

### 7.2. Серверные инварианты

- `CompleteSession` не читает клиентские баллы; агрегирует только `question_responses` по навыкам.
- Нет fallback «средний балл» и нет переноса балла из другого навыка.
- `certificateEligible` требует измеренного `overall >= 105` и завершённой теории.
- Идемпотентность: повторный `complete` возвращает существующий result; конкурентные `complete` сходятся к одному сертификату.
- `Postgres` интеграционный тест проверяет upsert ответа, два конкурентных `complete`, один сертификат и повторную идемпотентную финализацию.

### 7.3. Тесты и команды

```bash
npx tsc --noEmit
npm run lint                  # 0 errors, 120 warnings
npm run build
(cd backend && go test ./... -count=1)
TEST_DATABASE_URL="postgres://postgres:postgres@localhost:15432/det_academy_test?sslmode=disable" \
  (cd backend && go test ./tests -run TestPostgresTrustedCompletionIntegrity -count=1)
npx playwright test           # 9 passed
```

Добавлены регрессии:

- `TestCompletionDoesNotCreditSkippedSkills` — только writing, `overall = 0`, `notMeasured` содержит reading/listening/speaking/overall, сертификата нет.
- `TestQuestionPayloadsDoNotLeakAnswers` — в публичных payload нет `fullWord`, `correct`, `correctIndex`.
- `TestPostgresTrustedCompletionIntegrity` — реальный PostgreSQL, конкурентные complete, upsert ответа, один сертификат.
- `test-completion.spec.ts` — outage/retry, double-click, incomplete result, resume, server-issued Read & Select → Fill in the Blanks.
- `verify.spec.ts` — 404 vs outage vs existing report.
- `auth-session.spec.ts` — миграция токена и изоляция пользователей.

### 7.4. Оставшиеся риски

- `Interactive Reading`/`Listening` используют первый серверный блок этапа; выборка нескольких блоков и полноценный blueprint — следующий шаг этапа 4.
- `CompleteSession` всё ещё не оборачивает чтение/запись в одну транзакцию с `SELECT ... FOR UPDATE`; конкурентность проверена и сходится, но транзакционная блокировка остаётся желаемой для строгой сериализации.
- `RecordQuestionResponse` не пишет отдельный timeout event; просроченный ответ просто отклоняется.
- Серверный streak использует UTC-день; timezone policy пользователя ещё не реализована.
- Каталог `/vocabulary` — статический срез локальных данных, не CMS-публикация.
- Production OAuth/Apple JWKS, Directus и внешний speech pipeline по-прежнему не проверены end-to-end (этапы 2 и 5).

---

## 8. Итерация 3: blueprint, блокировки, OAuth и публикация словаря (21 октября 2026)

### 8.1. Что сделано

- Blueprint обновлён до `2026.1`; `INTERACTIVE_READING` и `INTERACTIVE_LISTENING` содержат по 2 блока.
- Сервер детерминированно выбирает blueprint-sized набор вопросов для старта, resume и следующего этапа; `ListByTypeAndDifficulty` сортирует по `id`.
- `CompleteSession` обёрнут в session lock: PostgreSQL advisory lock, in-memory per-session mutex. Конкурентные финализации сериализуются.
- Добавлены `session_events`: `ANSWER_REJECTED_DEADLINE`, `STAGE_TIMEOUT`, `STAGE_SKIPPED`. `CompleteSession` считает `timeoutEvents` и отдаёт их в scores.
- Streak принимает `utcOffsetMinutes`; дата активности считается в локальном дне пользователя, а не жёстко в UTC.
- В свободной практике появился `Strict mode` с общим 10-минутным таймером. Экзамен всегда использует серверный дедлайн.
- Vocabulary перенесён в PostgreSQL (`vocabulary_entries`) с полями `status`, `version`, `reviewed_at`, `source`, `source_url`. Публичный API `/api/v1/vocabulary` отдаёт только `published`.
- Добавлен seed `backend/db/04-vocabulary-seed.sql` (506 записей) и embed-набор для in-memory режима.
- Apple ID token теперь проверяется криптографически: JWKS, `kid`, RS256, `iss`, `aud`, `exp`, nonce, `email_verified`.
- Google ID token проверяет `iss`, `aud`, `exp`, `email_verified`. Access-token fallback отключён в production/при заданном client ID.
- Google/Apple frontend flow передаёт `nonce`; callback читает `id_token` из fragment.
- Arena больше не создаёт локального бота и не меняет Elo при недоступном сервере: показывается `OFFLINE`.
- Фильтры вузов по сабскорам используют только явные значения; эвристики «overall ≥ 125 ⇒ subscore 120» удалены.

### 8.2. Новые миграции

```text
backend/db/migrations/003_stage3_integrity.sql
backend/db/migrations/004_vocabulary.sql
backend/db/migrations/005_session_events.sql
backend/db/04-vocabulary-seed.sql
```

### 8.3. Проверки

```bash
npx tsc --noEmit
npm run lint                    # 0 errors, 121 warnings
npm run build
(cd backend && go test ./... -count=1)
TEST_DATABASE_URL="postgres://postgres:postgres@localhost:15432/det_academy_test?sslmode=disable" \
  (cd backend && go test ./tests -run TestPostgresTrustedCompletionIntegrity -count=1)
npx playwright test             # 10 passed
```

Новые регрессии:

- `TestBlueprintSelectionAndTimeoutEvents` — 2 IR/IL блока и событие `ANSWER_REJECTED_DEADLINE`.
- `TestVerifyAppleTokenChecksSignatureAudienceAndEmail` — подпись, aud, unverified email.
- `TestVerifyAppleTokenRejectsTamperedSignature`.
- `TestVerifyGoogleTokenChecksAudienceAndVerifiedEmail`.
- `TestVocabularyPublication` — публикуются только `published` записи.

### 8.4. Что осталось

- Полный OAuth transaction store (server-side state hash, PKCE metadata, atomic consume) для VK/Yandex/Google/Apple ещё не выделен в отдельную таблицу. Текущий nonce проверяется, но state остаётся клиентским.
- Apple `code` flow (обмен authorization code) не реализован; поддерживается identity token.
- Speaking/Writing pipeline с очередью, retry, статусами `queued/transcribing/evaluating` и калибровкой не входил в эту итерацию.
- Directus publishing workflow для vocabulary (draft → reviewed → published) пока представлен таблицей и статусом, но без UI/событий CMS.
- Production release gate: dependency/security scan, backup/restore drill, error tracking, dashboards и ручной critical path.

---

## 9. Итерация 4: Phase A — доверие к экзамену (21 октября 2026)

### 9.1. Экзамен

- Введена таблица `session_questions`: сервер хранит, какие вопросы реально выданы в каждой попытке.
- `RecordQuestionResponse` принимает только выданный вопрос текущей стадии.
- Добавлен per-item deadline (по `timeLimitSec` вопроса) с grace 10 секунд.
- `/respond` больше не возвращает `isCorrect`/`rawScore` — correctness oracle удалён.
- `CompleteSession` запрещён до `StageName = COMPLETED`.
- Overall не выставляется, если отвечено меньше 8 заданий.
- Сертификат требует покрытие выданных вопросов ≥ 30% и отсутствие timeout-событий.
- Ошибки объективных заданий автоматически пишутся в серверную тетрадь ошибок (`recordMistake`).
- Добавлен `GET /test/sessions/{id}/review` и блок «Разбор попытки» в результате.
- `Interactive Reading`/`Listening` проходят по 2 серверных блока.

### 9.2. OAuth

- Добавлена таблица `oauth_transactions`: `state_hash`, `nonce`, PKCE verifier, provider, action, redirect URI, user, expiry, consumed_at.
- `POST /auth/oauth/start` выпускает state/nonce/PKCE и URL провайдера.
- `Consume` атомарный: повторный callback отклоняется.
- Google authorization-code flow: обмен кода + `id_token`, проверка `iss/aud/exp/email_verified`.
- Apple authorization-code flow: ES256 client secret из `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY`, обмен кода, JWKS-проверка `id_token`, nonce.
- Frontend AuthModal переведён на серверный `/auth/oauth/start`; callback передаёт `state`.
- Redirect URI проверяется по allowlist.

### 9.3. Media и production

- Загрузка аудио проверяет владельца сессии **до** записи файла.
- Имя файла — только `assetID + extension`; path traversal из `questionID` невозможен.
- Запись через temp file + atomic rename, файл удаляется при ошибке.
- `/api/v1/media/audio/{filename}` теперь требует авторизацию и ownership.
- `MediaAsset.filePath` больше не отдаётся в JSON.
- Docker: media volume, `MEDIA_UPLOAD_DIR`, `ENV=production`, обязательные секреты, порты на `127.0.0.1`, seed.sql убран из production, `.env` исключён из build context.
- `ALLOW_MEMORY_STORAGE=true` требуется для memory fallback; production fail-closed.
- Secure cookie включается в production.
- `/ready` проверяет доступность storage.
- Добавлены `.github/workflows/ci.yml` и `Makefile`.
- Добавлен admin publishing UI `/admin/vocabulary` (draft/reviewed/published/archived) и API.

### 9.4. AI/ML

Добавлен проектный документ `docs/AI_ML_ARCHITECTURE_2026-10-21.md`: провайдеры, STT, очередь, evidence spans, калибровка, guardrails. Код очереди и провайдера ещё не включён.

### 9.5. Проверки

```bash
npx tsc --noEmit
npm run lint          # 0 errors, 126 warnings
npm run build
(cd backend && go test ./... -count=1)
TEST_DATABASE_URL=... go test ./tests -run TestPostgresTrustedCompletionIntegrity
npx playwright test   # 10 passed
```

### 9.6. Осталось

- Async evaluation queue (`queued/transcribing/evaluating/retry`) и AI provider implementation.
- Server-side STT (Whisper-compatible/Ollama) вместо клиентского transcript.
- Diagnostic + daily plan + SRS recall + weekly report (Phase B).
- Directus schema sync for vocabulary (current admin UI writes the app DB directly).
- Backups/restore drill, Sentry/metrics, branch protection, full-stack E2E.
- Rate limits/CSRF/email verification/refresh tokens.

---

## 10. Итерация 5: STT, evaluation queue и AI-провайдер (21 октября 2026)

### 10.1. Что сделано

- Добавлен `ai` package: `Provider`/`Transcriber`, OpenAI-compatible chat completions и `/audio/transcriptions`.
- Добавлены поля evaluation: `transcript_source`, `provider`, `evaluator_version`, `feedback_status`, `feedback`, `evidence_spans`, `retry_count`, `last_error`.
- Добавлена таблица `evaluation_jobs` и очередь `EvaluationQueue` с claim через `FOR UPDATE SKIP LOCKED`.
- Состояния: `queued → processing/transcribing → evaluating → completed`, а также `retryable_failed` / `permanently_failed` / `unsupported`.
- Аудио-ответ создаёт pending evaluation и job; worker транскрибирует серверным STT, оценивает и обогащает AI-провайдером.
- Без STT и без `ALLOW_CLIENT_TRANSCRIPT=true` speaking получает `unsupported` и 0, а не выдуманный балл.
- `CompleteSession` возвращает `409 evaluation_pending`, пока обязательные оценки не завершены.
- Frontend опрашивает evaluations и показывает статус, feedback и evidence spans.
- Rule-based evaluator проставляет provider/version/evidence spans.
- Исправлен `correctIndex`: распределение теперь 1/2/3, а не 19×0.
- Исправлен `ct-1` (`in` + `novative` вместо `inphotovoltaic`).
- Transcript в Interactive Listening скрыт в exam mode.
- Убраны ложные «1,500 слов», «60 минут», «official» в ключевых текстах.
- Убран тяжёлый JSON-импорт из `SkillRadarChart` и неиспользуемый из `UniversityMatchWidget`.
- Добавлен `scripts/lint_content.py` и шаг в CI.

### 10.2. Переменные

```text
AI_BASE_URL=https://api.openai.com/v1   # или http://localhost:11434/v1 для Ollama
AI_API_KEY=...
AI_MODEL=gpt-4o-mini
AI_STT_ENABLED=true
AI_STT_MODEL=whisper-1
ALLOW_CLIENT_TRANSCRIPT=false           # только dev/test
```

### 10.3. Проверки

```bash
npx tsc --noEmit
npm run lint          # 0 errors, 125 warnings
npm run build
(cd backend && go test ./... -count=1)
TEST_DATABASE_URL=... go test ./tests -run TestPostgresTrustedCompletionIntegrity
npx playwright test   # 10 passed
python3 scripts/lint_content.py
```

### 10.4. Осталось

- Phase B: диагностика, daily queue, SRS recall, weekly report.
- Directus schema/permission sync (сейчас admin UI пишет в app DB).
- Email verification, refresh/revocation, rate limits, CSRF.
- Backups/restore drill, Sentry, metrics, alerts.
- Полный full-stack E2E против реального backend.
- Mobile/PWA и accessibility.
