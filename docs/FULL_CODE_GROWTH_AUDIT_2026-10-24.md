# DET Academy: полный аудит кода, статики и точек роста

Дата проверки: 24 октября 2026 года.

## 1. Вывод

Проект уже имеет рабочее серверное ядро: авторизацию, PostgreSQL, server-authoritative mock test, очередь оценки, восстановление попыток, SRS, XP ledger, недельные лиги, проверку сертификатов и базовую персонализацию. Это больше не статичный макет.

Главный разрыв с продуктовым видением теперь находится вокруг экзаменационного ядра. Practice Hub, теория, readiness, план занятий, университетские требования, typing, часть прогресса и калибровочные доказательства всё ещё зависят от встроенных массивов, эвристик, локального состояния или неподтверждённых данных.

Оценка соответствия долгосрочному видению:

| Контур | Готовность | Комментарий |
|---|---:|---|
| Identity и базовая безопасность | 80% | Надёжная база есть; не хватает управления устройствами, экспорта и удаления данных |
| Server-authoritative mock | 78% | Сервер владеет результатом, но blueprint и контент не версионируются как снимок, выбор вопросов повторяемый |
| Speaking/Writing | 45% | Есть запись, STT/evaluation pipeline и coach; реальная внешняя калибровка не доказана |
| Персональный план и readiness | 48% | Есть серверный план, но он основан на нескольких простых правилах и ручном закрытии задач |
| Practice Hub и Error Intelligence | 42% | Много механик, но основная практика работает в браузере и не формирует единый серверный learning event |
| Theory и content operations | 50% | Есть Directus и 16 уроков, но сохраняются две независимые копии контента и silent fallback |
| Institutions Navigator | 50% | Реестр и координаты работают, но требования и radar частично неподтверждены или hardcoded |
| Motivation и Arena | 62% | Серверные XP/лиги и authoritative arena есть; награду за план можно получить ручным подтверждением |
| Production и QA | 65% | Build, backend tests и audit проходят; lint накопил 134 предупреждения, локальный E2E зависает |
| Teacher/organizations | 5% | Предметной модели и пользовательского контура практически нет |

Итоговая готовность к полному продуктовому видению: **около 59–63%**. Готовность ядра для индивидуального пользователя выше, примерно **70%**, но достоверность персонализации и продуктивных навыков заметно ниже.

## 2. Что проверено

### Git и масштаб изменения

- `master` совпадал с `origin/master` на `e81581a`.
- После предыдущего аудита добавлены security gates, full mock PostgreSQL test, goals onboarding, coach, университетский каталог, XP ledger и calibration dataset.
- Перед созданием этого отчёта рабочее дерево было очищено от временных файлов аудита.

### Автоматические проверки

- `npm run typecheck`: успешно.
- `npm run build`: успешно, 28 маршрутов.
- `go test ./... -count=1`: успешно.
- content lint: 191 вопросов, ошибок нет.
- content review: 226 вопросов, ошибок и предупреждений нет.
- calibration unit tests: 5 из 5 успешно.
- `npm audit --omit=dev --audit-level=high`: 0 уязвимостей.
- ESLint: 0 ошибок, **134 предупреждения**.
- Playwright: полный прогон не завершён. Первый route test завис на `page.goto('/')` и завершился по таймауту 90 секунд; 77 сценариев не были запущены.

Зелёный build подтверждает компиляцию. Он не подтверждает полноценный пользовательский цикл и корректность продуктовых метрик.

## 3. Классификация статики

Не всю статику нужно удалять. Её нужно разделить по ответственности.

### Допустимая статика

- UI-тексты и переводы;
- неизменяемые диапазоны интерфейса, например шкала DET 10–160;
- локальная демо-задача на лендинге, если она явно называется демонстрацией и не сохраняет результат;
- тестовые fixtures, если они маркированы как fixtures и не используются как production evidence;
- fallback offline shell без вымышленных пользовательских данных.

### Статика, которую нужно перенести в серверную предметную модель

- вопросы и правильные ответы;
- exam blueprint и версия формата;
- требования университетов;
- план обучения и основания рекомендаций;
- readiness и forecast;
- пользовательские результаты, WPM, streak, ELO, XP и progress;
- learning events и завершение задач;
- content versions, review status и provenance;
- evaluator version, rubric version и снимок вопроса внутри попытки.

### Статика, которую нужно удалить

- неподтверждённые маркетинговые числа;
- вымышленные пользовательские значения и success states;
- hardcoded требования вузов без источника;
- дубли одного домена в нескольких массивах;
- silent fallback, который скрывает отказ CMS или API;
- «экспертные» данные, происхождение которых нельзя проверить.

## 4. P0: проблемы доверия и целостности

### P0.1. Calibration dataset не доказывает реальную экспертную калибровку

Файлы:

- `backend/tests/fixtures/calibration_expert_dataset.json`
- `docs/calibration.md`
- `scripts/calibration_validate.py`
- `.github/workflows/ci.yml`

Набор из 54 элементов технически проходит QWK gate, но содержит циклически повторяющиеся шаблонные ответы `Sample #...`, общие идентификаторы `expert-rater-1/2` и только декларацию `fixture: false`. В репозитории нет доказуемой связи с реальными ответами, экспертами, rubric sheets или процессом adjudication.

Дополнительно CI запускает:

```text
python3 scripts/calibration_validate.py --production --allow-fixture
```

Команда проверяет 20-item fixture по умолчанию и специально разрешает fixture. Новый `calibration_expert_dataset.json` CI не проверяет.

Риск: продукт может показывать калиброванные Speaking/Writing оценки на основании синтетического self-consistency набора.

Что сделать:

1. Переименовать текущий файл в synthetic gate fixture и установить `fixture: true`.
2. Убрать из документации формулировку о production calibration.
3. Хранить реальный dataset вне публичного репозитория с обезличиванием, consent и audit manifest.
4. Добавить hashed item IDs, rubric version, квалификацию рейтера, дату оценки и adjudication log.
5. В CI проверять manifest реального набора или подписанный агрегированный report; fixture использовать только для unit tests.
6. Считать Writing и Speaking прошедшими gate отдельно, включая out-of-sample holdout.

Критерий готовности: ни один production claim не строится на наборе, происхождение которого нельзя подтвердить.

### P0.2. Practice Hub остаётся клиентским симулятором

Файлы:

- `src/components/practice/InteractiveLessonDrill.tsx`
- `src/lib/generators/*.ts`
- `src/data/questionBank.ts`
- `src/lib/textEvaluator.ts`
- `src/lib/speechEvaluator.ts`
- `src/components/practice/WritingInspector.tsx`

Practice использует встроенные фронтенд-корпусы, `Math.random`, локальную проверку и локальные model answers. Сервер не выдаёт назначение упражнения, не хранит единый факт попытки и не формирует mastery update. Пользователь может обновить страницу, повторять знакомые ответы или менять локальное состояние без влияния на достоверную учебную историю.

Риск: главный ежедневный учебный цикл не связан с персонализацией, readiness и доказуемым прогрессом.

Что сделать:

1. Добавить `PracticeAssignment`, `PracticeAttempt`, `LearningEvent` и `SkillMastery`.
2. Выдавать public payload сервером; правильный ответ и rubric оставлять private.
3. Сохранять ответ, время, hints, retries и evaluator version.
4. Обновлять error notebook и mastery одной серверной транзакцией.
5. Оставить клиентские генераторы только в Storybook/dev fixture или удалить после миграции.
6. Перестроить `/practice` как очередь серверных назначений плюс отдельный свободный режим.

### P0.3. Повторные mock-тесты получают первые вопросы каталога

Файлы:

- `backend/internal/repository/postgres/postgres.go`
- `backend/internal/service/cat_service.go`

Repository возвращает вопросы через `ORDER BY id`. `stageQuestions` берёт `questions[:count]`. Результат детерминирован: пользователь регулярно видит первые элементы нужного типа и difficulty.

Риск: запоминание ответов, контентная утечка, искусственный рост результата, слабая адаптивность.

Что сделать:

1. Создать item exposure ledger.
2. Выбирать задания сервером по blueprint, difficulty, mastery, previous exposure и content status.
3. Не повторять item в пределах окна, кроме явного SRS/retry режима.
4. Добавить random seed и selection policy version в attempt.
5. Контролировать exposure rate и retire слишком узнаваемые вопросы.

### P0.4. Результат mock не полностью воспроизводим после изменения контента

Сессия хранит ссылки на `question_id`, но не immutable snapshot публичного payload, private answer, параметров item и версии scoring policy. `ExamBlueprint` возвращается из Go-константы `GetDefaultExamBlueprint()`, а не из versioned таблицы.

Риск: редактирование вопроса или алгоритма меняет смысл старой попытки и review.

Что сделать:

1. Добавить таблицы `content_items`, `content_versions`, `exam_blueprints`, `exam_blueprint_stages`.
2. В `session_questions` хранить `content_version_id`, snapshot hash и selection metadata.
3. В result хранить blueprint, scoring, rubric и evaluator versions.
4. Запретить изменение published version; исправления публиковать новой версией.

### P0.5. XP за план начисляется по ручной кнопке, а не по учебному событию

Файл: `backend/internal/service/study_service.go`, метод `CompletePlanTask`.

Авторизованный пользователь может закрыть разрешённый `taskId`; backend записывает completion с источником `manual` и начисляет 10 XP. Сервер не проверяет, выполнено ли SRS, упражнение, урок или mock.

Риск: XP и лига отражают клики по чекбоксам, а не обучение.

Что сделать:

- начислять XP из доменных событий `lesson_passed`, `practice_submitted`, `srs_reviewed`, `mock_completed`;
- оставить ручную отметку только для внешней активности без XP;
- связать plan task с конкретным assignment или activity requirement;
- добавить дневные caps и anti-abuse rules.

## 5. P1: функциональные и продуктовые разрывы

### P1.1. Dashboard имеет параллельный локальный источник истины

Файл: `src/store/useProgressStore.ts`.

В `localStorage` сохраняются test results, WPM, target, streak, ELO, name и lesson progress. Несколько серверных ошибок проглатываются через пустой `catch`. `toggleLessonCompleted` сохраняет optimistic completion даже при отказе API. `addTestResult` снова записывает серверный результат в клиентскую историю.

Нужное состояние:

- сервер — единственный источник результатов, goals, streak, XP, rating и completion;
- IndexedDB/localStorage — только явно маркированный cache/outbox;
- у cache есть revision, owner, TTL и sync state;
- mutation failure виден пользователю и откатывает optimistic state при permanent error.

### P1.2. Readiness выглядит точнее, чем используемая модель

Файл: `backend/internal/service/study_service.go`.

После двух mock readiness считается как 40% theory completion плюс 60% отношение последнего overall score к target. Не учитываются стабильность попыток, individual skills, полнота, confidence оценки, давность, тайминги и динамика ошибок. `readinessBasis` при этом говорит о «лучшем ориентире», хотя код использует последнюю попытку.

Нужное состояние:

- возвращать status enum, range и confidence, а не только процент;
- использовать несколько последних попыток и time decay;
- учитывать completeness каждого навыка;
- блокировать `ready`, если Speaking/Writing не прошли trusted evaluation;
- хранить readiness model version и explanation factors.

### P1.3. Study plan пока является набором if/else правил

Файл: `backend/internal/service/study_service.go`.

План смотрит на один самый слабый навык последней попытки, количество ошибок, SRS и первый непройденный урок. Расписание по дням недели, target subscores, prerequisites, нагрузка, пропуски и mastery отсутствуют. `fitTasksToBudget` вызывается дважды. Если SRS ничего не должен, задача «изучить новые слова» создаётся сразу как `Completed: true`.

Нужное состояние:

- `StudySchedule` с доступностью по дням и timezone;
- target overall и target skills;
- versioned plan с причиной выбора каждой активности;
- planned versus completed learning events;
- перерасчёт после результата, пропуска и изменения цели;
- completion только по серверному событию.

### P1.4. Skill Radar содержит неподтверждённые требования вузов

Файл: `src/components/dashboard/SkillRadarChart.tsx`.

`POPULAR_UNIVERSITIES` вручную задаёт overall и четыре subscore thresholds для Toronto, Stanford, MIT, Oxford и других вузов. UI называет их «официальными сабскорами» и сравнивает пользователя с admission requirement без источника и даты.

Это противоречит принципу видения «неизвестное остаётся неизвестным».

Нужно удалить массив и получать requirements из серверной модели `ProgramRequirement`. Пока подтверждённых данных нет, radar должен сравнивать навыки только с пользовательской целью.

### P1.5. Университетский каталог состоит из нескольких расходящихся наборов

Файлы:

- `src/data/duolingoInstitutions.json`
- `src/data/institution-metadata.json`
- `src/data/institution-locations.json`
- `src/data/verified-university-coordinates.json`
- `src/lib/institution-catalog.ts`
- `backend/internal/repository/memory/memory.go`

Frontend registry честно маркирует большую часть thresholds как ориентировочные, но сохраняет статичную дату проверки и локальный metadata overlay. Memory backend содержит отдельные баллы, acceptance rate и программы без provenance.

Нужная модель:

```text
Institution
Program
ProgramRequirement
RequirementSource
VerificationEvent
```

У каждого требования должны быть program/level, score, subscores, source URL, checked_at, reviewer и status. Acceptance rate не показывать без отдельного проверенного источника.

### P1.6. Теория имеет две независимые версии и silent fallback

Файлы:

- `src/data/theoryContent.ts`
- `src/lib/directus.ts`
- `src/app/theory/page.tsx`
- `src/app/theory/[slug]/page.tsx`

Страница сначала показывает bundle-копию 16 уроков, затем может заменить её данными Directus. Ошибка CMS скрывается, и пользователь не знает, что получил резервную версию. Статическая копия и CMS могут расходиться. Completion представляет собой toggle без проверки понимания.

Что сделать:

- опубликовывать versioned lesson через один content API;
- shipping snapshot использовать только с видимой версией и состоянием degraded;
- убрать runtime merge статического и CMS-контента;
- завершать урок после короткого knowledge check;
- хранить content version и learning evidence.

### P1.7. Typing Trainer не формирует доказуемый прогресс

Файлы:

- `src/components/typing/TypingEngine.tsx`
- `src/data/vocabularies.ts`
- `src/store/useProgressStore.ts`

Слова и randomization находятся на клиенте, лучший WPM записывается локально. Нет серверной попытки, нормализованного текста, anti-cheat, consistency history или связи с learning plan.

Сделать отдельный `TypingAttempt` endpoint, серверную валидацию статистики и историю. Не включать typing в readiness, пока метрика не доверенная и её влияние на DET не доказано.

### P1.8. Productive feedback всё ещё имеет rule-based fallback

Файлы:

- `backend/internal/service/evaluator.go`
- `backend/internal/service/evaluation_queue.go`
- `backend/internal/ai/provider.go`

Rule-based evaluator оценивает объём, lexical diversity, keyword hits, connectors и WPM. Такая модель полезна как practice feedback, но не подтверждает grammar, pronunciation, coherence или официальный DET-equivalent score. При неверной production-конфигурации этот fallback может стать итоговой оценкой.

Нужно разделить:

- `practice_feedback`: допускает heuristic provider с явной маркировкой;
- `trusted_assessment`: требует STT, calibrated evaluator, confidence и successful gate;
- `pending/unsupported`: если trusted provider недоступен.

### P1.9. Медиа хранится на локальном диске приложения

Файл: `backend/internal/handlers/media_handler.go`.

Аудио сохраняется в `data/media/audio`. При нескольких replicas, redeploy или потере volume запись становится недоступной. Retention ограничен ручным удалением audio конкретной сессии.

Нужны S3-compatible storage, signed URLs, encryption, retention policy, privacy controls и lifecycle deletion.

### P1.10. Marketing facts и реклама не управляются как проверяемый контент

Файлы:

- `src/components/landing/ComparisonTable.tsx`
- `src/lib/translations.ts`
- `src/components/landing/BentoGrid.tsx`
- `src/components/landing/SparkPromo.tsx`
- `src/components/layout/AdBanner.tsx`

Сравнение DET/IELTS, количества типов, словаря и другие факты зашиты в frontend без источника и checked_at. Spark promo всегда отображается независимо от CMS. AdBanner при отсутствии API показывает hardcoded партнёрский fallback, поэтому отказ CMS превращается в реальную рекламу.

Нужно:

- хранить mutable claims в CMS с source и expiry;
- при отказе CMS скрывать рекламный слот;
- удалить hardcoded campaign и promo code из product bundle;
- автоматически проверять просроченные claims.

## 6. P2: качество, UX и поддерживаемость

### 134 lint warnings

Среди предупреждений много неиспользуемого кода, но важнее `react-hooks/exhaustive-deps` в question components, таймерах, audio recording и интерактивных шагах. Такие предупреждения могут приводить к stale closure, повторной отправке, неправильному таймеру и работе со старым вопросом.

Действия:

1. Сделать warnings blocking после очистки.
2. Сначала исправить `src/components/test-engine/questions/*`.
3. Затем удалить мёртвые imports/state и unused suppressions.

### E2E не воспроизводится локально

`npx playwright test` запустил 79 тестов, но первый `page.goto('/')` завис на 90 секунд. После остановки dev server также не отвечал на `curl`. Это отдельная проблема тестового harness или Next dev/Turbopack на текущем окружении.

Действия:

- использовать production server (`next build && next start`) для browser E2E;
- или закрепить `next dev --webpack` для тестов;
- добавить webServer stdout/stderr artifact;
- начать с health probe, который проверяет реальный HTML, а не только открытый порт.

### Локализация неполная

Многие новые dashboard, coach, institution и error states написаны только по-русски, хотя продукт декларирует RU/EN. Нужен route-level localization coverage test и запрет новых literal UI strings вне translation catalog.

### Service worker кэширует персональные API

`public/sw.js` кэширует profile, sessions, theory progress и другие API по namespace пользователя. Logout очищает caches, что хорошо, но offline data policy остаётся сложной: персональные ответы сохраняются в browser cache без срока хранения и пользовательского управления.

Нужно составить allowlist только для данных, реально необходимых offline, добавить TTL/version и кнопку удаления offline data.

## 7. Отсутствующие фичи относительно видения

### Ближайшая продуктовая ценность

1. **Server-driven daily session**: единая очередь заданий с server assignments и learning events.
2. **Настоящий Error Intelligence**: причина ошибки, связанное правило, новый контекст, SRS и mastery timeline.
3. **Goal model v2**: subscores, timezone, дни недели, ограничения нагрузки, выбранные программы.
4. **Readiness v2**: range, confidence, stability, recency и completeness.
5. **Content versioning**: draft, review, publish, retract, rollback и item statistics.
6. **Attempt review**: evidence по каждому вопросу и связь с конкретной практикой.
7. **Trusted Speaking/Writing**: отдельные status, provider SLA и real calibration.
8. **Institution shortlist**: программы, официальные requirements, reminders о перепроверке.

### Следующий уровень

- streak freeze и reminders;
- достижения по server events;
- item quality dashboard: exposure, difficulty, discrimination, abandon rate;
- пользовательское управление retention аудио и текстов;
- экспорт и удаление аккаунта;
- управление сессиями и устройствами;
- полноценный EN UI;
- teacher review для Speaking/Writing;
- cohorts и assignment workflow;
- notification worker;
- audit event viewer для администраторов.

## 8. План очистки статики по этапам

### Этап 1. Убрать ложную достоверность

- перемаркировать calibration dataset как synthetic fixture;
- удалить hardcoded university thresholds из Skill Radar;
- скрывать ads при отказе CMS;
- убрать неподтверждённые claims и цифры лендинга;
- исправить подписи readiness и productive feedback.

Результат: продукт перестаёт выдавать встроенные числа за измеренные или подтверждённые.

### Этап 2. Один источник истины для прогресса

- удалить authoritative mutations из `useProgressStore`;
- создать серверные typing attempts и learning events;
- связать XP с доменными событиями;
- сделать cache явно offline-only;
- добавить sync/revision/error state.

Результат: пользователь видит одинаковый прогресс на любом устройстве.

### Этап 3. Перенести Practice Hub на backend

- server assignments;
- private answer payload;
- attempt and mastery records;
- error notebook transaction;
- recommended и free practice modes;
- item exposure control.

Результат: ежедневная практика действительно обучает персональную модель.

### Этап 4. Версионировать assessment и content

- database blueprint;
- content versions;
- immutable session snapshots;
- selection policy version;
- scoring/rubric/evaluator version;
- content retraction without rewriting history.

Результат: старый результат можно воспроизвести и объяснить.

### Этап 5. Реальная персонализация

- schedule and timezone;
- target subscores/programs;
- mastery graph;
- readiness range/confidence;
- plan recalculation and missed-day recovery.

Результат: dashboard отвечает на вопрос «что делать сегодня и почему» на основании данных пользователя.

### Этап 6. Доказать productive skills

- собрать реальные consented responses;
- провести независимую двойную разметку;
- holdout evaluation;
- monitoring drift;
- provider and rubric versioning;
- trusted evaluation gate.

Результат: Speaking/Writing можно использовать в readiness и forecast.

## 9. Рекомендуемые четыре спринта

### Спринт 1: Trust cleanup

- исправить calibration claim и CI;
- удалить university hardcodes из Skill Radar;
- убрать рекламные и marketing fallbacks;
- исправить P0/P1 React hook warnings в exam flow;
- перевести E2E на воспроизводимый server mode.

Приёмка: нет неподтверждённых production claims; lint exam flow чистый; smoke E2E стабильно открывает все routes.

### Спринт 2: Learning event foundation

- migrations для `learning_events`, `practice_attempts`, `typing_attempts`, `skill_mastery`;
- API назначения и отправки practice;
- server-derived XP;
- read-only client cache.

Приёмка: два устройства показывают один прогресс; повторная доставка события не удваивает XP/mastery.

### Спринт 3: Practice migration

- перенести objective drills;
- затем Writing/Speaking practice;
- интегрировать error notebook;
- добавить exposure limits и item selection.

Приёмка: browser не получает private answers до submit; каждая активность оставляет серверный learning event.

### Спринт 4: Versioned assessment and plan v2

- content/blueprint versions и snapshots;
- goal subscores/schedule/timezone;
- readiness v2;
- объяснимый daily plan.

Приёмка: результат воспроизводим; план меняется после реальной активности; readiness показывает range, confidence и основания.

## 10. Definition of Done для «вся статика вычищена»

Задача считается выполненной, когда:

- в production UI нет пользовательских чисел, созданных в браузере;
- mutable facts имеют source, checked_at и status;
- CMS/API failure даёт degraded/error, а не скрытую подмену bundle-данными;
- practice и mock получают versioned content с backend;
- correct answers отсутствуют в public payload до завершения;
- progress, XP, streak, rating, mastery и readiness вычисляет сервер;
- результаты воспроизводимы по сохранённым версиям;
- test fixtures явно помечены и не используются как product evidence;
- все learning actions оставляют idempotent events;
- полный путь registration → goal → diagnostic → daily plan → practice → mock → review проходит на PostgreSQL в E2E;
- lint, integration, browser E2E, dependency audit и production preflight блокируют release при ошибке.

## 11. Следующая конкретная задача

Начать нужно с отдельного PR **Trust cleanup**, потому что он устраняет ложную достоверность без тяжёлой перестройки архитектуры:

1. перемаркировать synthetic calibration dataset и исправить CI;
2. заменить Skill Radar на сравнение с пользовательской целью;
3. убрать hardcoded рекламные fallback;
4. исправить hook warnings в test question components;
5. стабилизировать Playwright webServer.

После этого следующий PR должен создавать learning event foundation. Без неё перенос отдельных экранов со статики лишь создаст новую копию локального состояния.
