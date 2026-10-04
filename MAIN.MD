# ТЕХНИЧЕСКОЕ ЗАДАНИЕ И СИСТЕМНЫЙ ДИЗАЙН-ДОКУМЕНТ (SRS / DESIGN DOC)
**Проект:** «DET Academy» — интерактивная адаптивная платформа подготовки к Duolingo English Test  
**Версия документа:** 1.0 (MVP)  
**Статус:** Согласовано к разработке  
**Модель дистрибуции:** Закрытый коммерческий/условно-бесплатный web-сервис (Proprietary Web App)

---

## 1. ВВЕДЕНИЕ И ЦЕЛИ ПРОЕКТА

### 1.1. Назначение системы
**DET Academy** — специализированная EdTech-платформа для подготовки к сдаче международного языкового экзамена *Duolingo English Test (DET)* по актуальным регламентам. Платформа предоставляет:
1. Теоретический блок и разбор стратегий прохождения экзамена на двух языках (RU / EN).
2. Тренажер адаптивного тестирования (Computer Adaptive Testing, CAT) с эмуляцией реальных не-speaking механик DET.
3. Прогнозирование итогового балла (10–160) и сабскоров (Literacy, Comprehension, Production, Conversation).
4. Автономный тренажер скоропечатания (полноценный клон Monkeytype) на отдельной странице для отработки навыка скоростного ввода без возможности подглядывать на клавиатуру.
5. Автоматическую генерацию и публичную верификацию сертификатов по итогам прохождения курса и контрольного тестирования.
6. Модуль гибкого управления баннерной рекламой через Headless CMS.

#ВСЯ ТЕОРИЯ НАХОДИТСЯ В ПАПКЕ /theory

---

## 2. ТЕХНОЛОГИЧЕСКИЙ СТЕК И АРХИТЕКТУРА

### 2.1. Высокоуровневая архитектура
Выбрана гибридная архитектура: **Headless CMS + Client/SSR Frontend**.

ДИЗАЙН-СИСТЕМА: 
Design a high-impact, modern tech landing page combining an asymmetric editorial Bento grid with clean SaaS micro-components and high-contrast color blocking.

---

### 1. Visual Style & Theme
* **Aesthetic:** High-contrast Neo-Bento UI blended with clean, pastel-tinted SaaS dashboards.
* **Core Surfaces:** 
  * High-contrast cards: Pure dark (`#111315`), bright accent block, and neutral light (`#F3F4F6`).
  * Micro pastel cards: Soft mint (`#E3F8ED`), pale sage (`#EEF5EE`), and muted pistachio tints.
* **Geometry:** Generous rounding (`border-radius: 24px–32px` on cards; full pill `9999px` on badges, buttons, and inline tags).
* **Atmosphere:** Clean white/off-white canvas (`#F8F9FA`) with faint green ambient gradient bleeds (`rgba(196, 245, 84, 0.08)`).

---

### 2. Color Palette (Green Focus)
* **Primary Accent:** Electric Lime / Acid Green (`#D2F544` or `#C4F22C`) for primary CTAs and lead bento cards.
* **Secondary Green:** Deep Forest / Dark Moss (`#0C2418`) for text and icons on bright green surfaces.
* **Pastel Greens (Sub-cards/Tags):** Mint Wash (`#E2F7EB`), Pale Lime (`#F1FCD6`).
* **Neutrals:** Obsidian (`#0E1012`), Slate Gray (`#64748B`), Soft Border Gray (`#E5E7EB`), Pure White (`#FFFFFF`).

---

### 3. Typography Specs
* **Display / Hero Font:** *Clash Grotesk*, *Cabinet Grotesk*, or *Söhne Breit* (Black/Bold, uppercase, tight tracking `-0.03em`).
* **Headline Elements:** Embedded inline pill containers (e.g., `LEARNING [ WITH ] AI`) directly within the text string.
* **Body & UI Font:** *Inter* or *Geist Sans* (Medium/Regular, 14px–16px, high legibility).
* **Metrics & Badges:** Bold geometric figures for KPIs (e.g., `137`, `12k`) paired with subdued uppercase micro-labels.

---

### 4. Bento Grid & Card Architecture
* **Layout:** Asymmetric multi-row bento container:
  * **Lead Hero Block:** Massive typographic statement with embedded inline pills.
  * **Accent Feature Card:** Solid electric green background, dark typography, pill category tags, and a bold directional arrow icon (`↗`).
  * **Dark Media Module:** Pitch-black card featuring abstract 3D textures, glass badge overlays, and status stars (`✦`).
  * **KPI Modules:** Split counter blocks (light gray vs. dark charcoal) displaying high-impact stats.
  * **SaaS Preview Module:** Embedded Kanban/task cards showing pastel task tiles, dot progress bars, and stacked avatar rings.

---

### 5. Micro-Components
* **Inline Header Pills:** Outlined or solid mini-capsules nestled directly inside headline sentences.
* **Status Badges & Tags:** Ultra-compact pill chips (`padding: 4px 10px`, `font-size: 11px`) with hashtag prefixes.
* **Segmented Progress Indicators:** Horizontal dot arrays indicating task/system completion status.
* **Circular Graphic Seals:** Rotating circular text stamps (`"excel with our personalized approach •"`) wrapping a central starburst icon.

```
[ Пользователь / Браузер ]
          │
          ▼
[ Frontend: Next.js (SSR / SSG / SPA) ]
   ├── SEO-лендинг (SSG/ISR)
   ├── Личный кабинет и Курсы (SSR)
   ├── Monkeytype Clone (Client SPA)
   └── Симулятор тестирования (Stateful Engine, Web Audio API)
          │
          ├───────────────────────────────┐
          ▼                               ▼
[ Headless CMS: Strapi / Directus ]   [ Backend API (Next.js Route Handlers / Node.js) ]
   ├── Управление курсами и теорией      ├── Сессии адаптивного тестирования (CAT Engine)
   ├── Банк заданий (Вопросы, медиа)     ├── Аутентификация (NextAuth / Lucia Auth)
   ├── Рекламные баннеры (Header/Footer) ├── Расчет скоринга (10-160) и генерация сертификатов
   └── База медиа (S3/Cloud Storage)     └── База данных пользователей (PostgreSQL + Prisma/Drizzle)
```

### 2.2. Стек технологий
* **Frontend:** Next.js (App Router, React, TypeScript, Tailwind CSS, Zustand/Jotai для стейта экзамена, Framer Motion, `@tanstack/react-query`).
* **Backend & CMS:** 
  * CMS: **Strapi v4/v5** или **Directus** (Headless, REST/GraphQL API, ролевая модель, хранение контента).
  * App Backend: Node.js (Next.js Server Actions / API Routes).
* **База данных:** PostgreSQL (реляционные данные студентов, попытки, сессии адаптивного теста, логи).
* **Хранилище медиа (S3-compatible):** MinIO / AWS S3 / Cloudflare R2 (аудиофайлы для Listen and Type, картинки для Write About Photo).
* **Интернационализация (i18n):** `next-intl` (RU / EN для UI и теории; задания — строго EN).
* **PDF-генерация:** `@react-pdf/renderer` или `Puppeteer` для формирования сертификатов.

---

## 3. РОЛЕВАЯ МОДЕЛЬ И АВТОРИЗАЦИЯ

### 3.1. Роли пользователей
1. **Гость (Unauthenticated):** Просмотр лендинга, использование тренажера скоропечатания (без сохранения истории), просмотр страницы проверки сертификатов.
2. **Студент (Student):** Прохождение уроков, тренажеров, пробных экзаменов, сохранение прогресса, получение сертификата.
3. **Контент-менеджер (CMS Editor):** Наполнение теории, создание и редактирование заданий, загрузка картинок/аудио.
4. **Администратор (SuperAdmin):** Управление пользователями, баннерной сеткой рекламы, системными настройками.

### 3.2. Аутентификация
* **OAuth 2.0 провайдеры:** Google, Apple ID, Yandex ID, VK ID.
* **Email / Password:** Fallback-авторизация с подтверждением email (Magic Link или 6-значный OTP).
* Сессии на защищенных `HttpOnly`, `SameSite=Lax` JWT/Cookie.
* **Cookie Consent Banner:** Модальное окно внизу экрана (RU/EN) с фиксацией согласия в `localStorage` до момента закрытия.

---

## 4. ФУНКЦИОНАЛЬНЫЕ МОДУЛИ

### 4.1. Публичная часть (Лендинг)
* Интегрирован в приложение по корневому адресу `/`.
* Полноценная SSR/SSG оптимизация для поисковых систем (метатеги OpenGraph, Schema.org).
* **Структура лендинга:**
  * **Hero Screen:** УТП, статус платформы, динамический счетчик практики, CTA («Начать бесплатно»).
  * **Что такое DET:** Инфографика преимуществ перед IELTS/TOEFL (дешевле, онлайн, результат за 48 часов, признание 5000+ вузов).
  * **Структура заданий:** Превью доступных тренажеров платформы.
  * **Встроенный виджет тренажера:** Демо-версия задания *Read and Select* на 3 слова без регистрации.
  * **Инструкция и правила:** Акцент на правила (no notes, eye tracking, американское правописание).
  * **Footer:** Переключатель языка (RU/EN), ссылки на верификацию сертификатов, контакты, Ad-блок.

---

### 4.2. Модуль скоропечатания (Monkeytype Clone) — `/practice/typing`
* Полный автономный тренажер слепой печати на английском языке.
* **Режимы:**
  * По времени: 15 / 30 / 60 / 120 секунд.
  * По количеству слов: 10 / 25 / 50 / 100 слов.
* **Словари:** 
  * Английский базовый (Top 200, Top 1000).
  * **DET Vocabulary Pack:** Слова из банка *Read and Select* и академических эссе.
* **Метрики:**
  * WPM (Слов в минуту) = `(Символы / 5) / Минуты`.
  * Accuracy (%) = `(Правильные символы / Всего нажатий) * 100`.
  * Raw WPM, Consistency (стабильность темпа).
* **UI/UX:**
  * Каретка с плавной анимацией.
  * Подсветка ошибок (красный/серый/белый).
  * Звуки механической клавиатуры (опционально вкл/выкл).
  * Сохранение лучшего WPM в профиль студента.

---

### 4.3. Модуль адаптивного тестирования (DET Engine)

#### 4.3.1. Каталог статусов заданий (Реализация)
| Тип задания | Категория | Статус в MVP |
| :--- | :--- | :--- |
| **Read and Select** | Literacy / Comprehension | **Активно** |
| **Fill in the Blanks** | Literacy / Comprehension | **Активно** |
| **Read and Complete** | Literacy / Comprehension | **Активно** |
| **Listen and Type** | Comprehension / Conversation | **Активно** |
| **Interactive Reading** | Literacy / Comprehension | **Активно** |
| **Interactive Listening** (Диалог + Summary) | Comprehension / Conversation / Production | **Активно** |
| **Write About the Photo** | Production / Literacy | **Активно** |
| **Interactive Writing** | Production / Literacy | **Активно** |
| **Writing Sample** | Production / Literacy | **Активно** |
| *Speak About the Photo* | Production / Conversation | **Inactive (В роадмапе)** |
| *Read / Listen, Then Speak* | Production / Conversation | **Inactive (В роадмапе)** |
| *Interactive Speaking* | Production / Conversation | **Inactive (В роадмапе)** |
| *Speaking Sample* | Production / Conversation | **Inactive (В роадмапе)** |

*Задания со статусом Inactive скрыты в тесте или отображаются в тренировочном списке с бейджем «Coming Soon» / «Скоро: Модуль с микрофоном».*

---

#### 4.3.2. Спецификация активных заданий в движке теста

##### 1. Read and Select
* **Механика:** Поочередно выводится 1 слово. 
* **Таймер:** Ровно 5.0 секунд на слово (прогресс-бар). Автопереход по истечению.
* **UI:** Две кнопки: «Yes» (реальное) / «No» (псевдослово). Горячие клавиши: `Y` / `N` или стрелки `←` / `→`.
* **Пул сессии:** 15–18 слов в одном блоке.
* **Логика оценки:** Penalty scoring (Верный выбор = +1, Ошибка = -1, Пропуск = 0). Нормализуется к диапазону [0..1].

##### 2. Fill in the Blanks
* **Механика:** Предложение с пропуском одного слова. Показаны первые 1-2 буквы, остальные заменены на пустые поля ввода фиксированной длины.
* **Таймер:** 20 секунд на одно предложение. Всего сессия из 6–9 предложений подряд.
* **Валидация:** Строго American English. Любая опечатка или несоответствие регистра/окончания = 0 баллов за элемент.

##### 3. Read and Complete (C-Test)
* **Механика:** Текст ~100 слов. Первое и последнее предложения не повреждены. Внутри повреждены 50% букв во вторых половинах ключевых слов (например, `c_l_r` -> `color`).
* **Таймер:** 3 минуты (180 сек) на весь текст.
* **Особенности:** Свободная навигация по полям (Tab, Shift+Tab, стрелки). Автоматический переход фокуса на следующее поле при заполнении букв текущего слова.

##### 4. Listen and Type
* **Механика:** Диктант одного предложения.
* **Таймер:** 60 секунд.
* **Ограничение аудио:** Максимум 3 воспроизведения. 1-е воспроизведение стартует автоматически через 1 сек после загрузки экрана. Кнопка «Повторить» блокируется после 3-го нажатия.
* **Скоринг:** Сравнение строк через расстояние Левенштейна (Levenshtein Distance) с нормализацией. Проверка регистра первой буквы и финального знака препинания (`.` или `?`).

##### 5. Interactive Reading
* **Формат:** 1 общий текст, разделенный на 5 экранов:
  1. *Select missing words:* Заполнение 4-6 пропусков через дропдауны внутри текста.
  2. *Complete the passage:* Выбор 1 из 4 предложений для вставки между частями текста.
  3. *Highlight the answer (2 вопроса подряд):* Студент выделяет мышкой диапазон текста в ответ на вопрос.
  4. *Identify the idea:* Single choice (1 из 4 вариантов).
  5. *Title the passage:* Single choice (1 из 4 вариантов).
* **Таймер:** 7–8 минут на весь блок из 5 шагов.

##### 6. Interactive Listening
* **Формат:**
  * **Этап А (Диалог):** Сценарий (студент + профессор/коллега). Реплика собеседника звучит в аудио. Студент выбирает текстовую реплику из 4-5 вариантов. Диалог длится 4-6 реплик.
  * **Этап Б (Summary):** Фиксация полного текста диалога на экране на 15 секунд для ознакомления, затем переход на поле ввода Summary.
  * **Таймер Summary:** Ровно 75 секунд. Минимум 3 предложения.

##### 7. Write About the Photo
* **Формат:** 3 последовательных экрана.
* **Таймер:** 60 секунд на каждое фото.
* **UI:** Фотография по центру/слева, справа `Textarea` с автоматическим подсчетом введенных слов.

##### 8. Interactive Writing
* **Формат:**
  * Часть 1: Академический промпт, открытый вопрос. Таймер 5 минут.
  * Часть 2: Дополнительный вопрос-продолжение (follow-up). Текст Части 1 отображается в режиме `Read-Only`. Таймер 3 минуты.

##### 9. Writing Sample
* **Формат:** Финальное академическое эссе на заданную тему.
* **Таймер:** 5 минут. Минимально рекомендуемый объем: 100+ слов.

---

### 4.4. Алгоритм адаптивности (CAT) и скоринга

В MVP реализуется **Bucket-Based Multistage Testing (MST)** — ступенчатый алгоритм адаптивности:

1. **Уровни сложности контента (Difficulty Bands):**
   * Все задания в CMS имеют метку сложности по шкале CEFR: `A2` (10–60), `B1` (65–95), `B2` (100–125), `C1/C2` (130–160).
2. **Маршрутизация сложности:**
   * **Stage 1 (Диагностика):** Начинается с уровня B1/B2.
   * Если правильность выполнения шага $\ge 80\%$ -> Следующий блок заданий берется из пула `уровень + 1`.
   * Если правильность от $50\%$ до $79\%$ -> Уровень сохраняется.
   * Если правильность $< 50\%$ -> Следующий блок заданий берется из пула `уровень - 1`.
3. **Расчет финального балла (DET Scale: 10–160, шаг 5):**
   * Каждый правильный ответ взвешивается на коэффициент сложности вопроса.
   * Формируются 4 сабскора:
     $$\text{Overall} = \frac{\text{Literacy} + \text{Comprehension} + \text{Production} + \text{Conversation}}{4}$$
   * *Примечание для MVP:* Так как Speaking отключен, сабскор *Conversation* вычисляется на основе *Listen and Type* и диалоговой части *Interactive Listening*.
   * Результат округляется до ближайшего числа, кратного 5 (например, 105, 110, 115).

---

### 4.5. Личный кабинет, Сертификация и База Знаний

#### 4.5.1. База Знаний / Теория
* Двуязычный контент (RU / EN переключатель на странице).
* Страницы уроков структурированы по шагам (Гайд, Стратегия, Примеры, Разбор ошибок).
* В конце каждого урока — кнопка «Отметить как пройденный». Прогресс сохраняется в БД.

#### 4.5.2. Условия выдачи сертификата
Сертификат генерируется автоматически при одновременном соблюдении условий:
1. `theory_progress_percentage == 100%` (все теоретические блоки закрыты).
2. `best_mock_test_score >= 105` (хотя бы один полный пробный тест пройден с результатом 105 баллов и выше).

#### 4.5.3. Публичная верификация сертификата
* Адрес страницы: `/verify/{UUID}`.
* Доступен без авторизации.
* Содержит:
  * ФИО студента (на латинице).
  * Дату успешной сдачи.
  * Итоговый прогнозируемый балл (Overall Score) и диаграмму сабскоров.
  * Статус: «Verified / Official DET Academy Simulation Certificate».
  * Кнопку «Скачать в PDF».

---

### 4.6. Рекламный модуль (Ad Engine)
* **Позиции:**
  1. `HEADER_BANNER`: Фиксированный или плавающий блок вверху страницы (728x90 или адаптивный).
  2. `FOOTER_BANNER`: Блок над подвалом сайта.
* **Жесткое системное ограничение:** Во время прохождения адаптивного теста и работы таймеров **рекламные блоки скрываются**, чтобы не нарушать концентрацию студента и не вызывать багов отрисовки/layout shifts.
* **Управление в CMS:**
  * Загрузка креатива (JPG, PNG, GIF, WebP).
  * Целевая ссылка (Target URL) с UTM-метками.
  * Параметры: `isActive` (boolean), `startsAt` (datetime), `expiresAt` (datetime).

---

## 5. МОДЕЛЬ ДАННЫХ (DATABASE SCHEMA)

```dbml
// Пользователи и авторизация
Table User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  locale        String    @default("ru")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Прогресс по теории
Table TheoryProgress {
  id          String   @id @default(uuid())
  userId      String
  lessonSlug  String
  isCompleted Boolean  @default(false)
  updatedAt   DateTime @updatedAt

  User        User     @relation(fields: [userId], references: [id])
  @@unique([userId, lessonSlug])
}

// Банк заданий (импортируется в/из CMS)
Table Question {
  id              String       @id @default(uuid())
  type            QuestionType // READ_SELECT, FILL_BLANKS, C_TEST, LISTEN_TYPE, etc.
  difficultyBand  String       // A2, B1, B2, C1, C2
  contentPayload  Json         // Текст, аудиоссылка, картинка, разбивка слов
  correctAnswers  Json         // Массив эталонов, точные строки
  timeLimitSec    Int
  isActive        Boolean      @default(true)
}

// Сессия прохождения экзамена
Table TestSession {
  id              String       @id @default(uuid())
  userId          String
  status          SessionStatus // IN_PROGRESS, COMPLETED, ABANDONED
  currentStage    Int          @default(1)
  overallScore    Int?         // 10-160
  literacyScore   Int?
  comprehensionScore Int?
  productionScore Int?
  conversationScore Int?
  createdAt       DateTime     @default(now())
  completedAt     DateTime?

  User            User         @relation(fields: [userId], references: [id])
}

// Детальные ответы внутри теста
Table QuestionResponse {
  id             String      @id @default(uuid())
  sessionId      String
  questionId     String
  userResponse   Json        // То, что ввел/выбрал пользователь
  isCorrect      Boolean?
  rawScore       Float       // 0.0 - 1.0
  timeSpentSec   Int

  Session        TestSession @relation(fields: [sessionId], references: [id])
  Question       Question    @relation(fields: [questionId], references: [id])
}

// Сертификаты
Table Certificate {
  id             String      @id @default(uuid()) // Используется в /verify/{id}
  userId         String
  testSessionId  String      @unique
  overallScore   Int
  issuedAt       DateTime    @default(now())
  pdfUrl         String?

  User           User        @relation(fields: [userId], references: [id])
  TestSession    TestSession @relation(fields: [testSessionId], references: [id])
}

// Рекламные баннеры
Table AdBanner {
  id          String   @id @default(uuid())
  placement   String   // HEADER, FOOTER
  imageUrl    String
  targetUrl   String
  altText     String
  isActive    Boolean  @default(true)
  impressions Int      @default(0)
  clicks      Int      @default(0)
}
```

---

## 6. НЕФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

1. **Производительность:**
   * Время загрузки лендинга: FCP < 1.2s, LCP < 2.0s по Core Web Vitals.
   * Время переключения вопроса в тесте: < 200ms (все ассеты следующего шага предзагружаются в фоновом режиме).
2. **Таймеры:**
   * Серверная фиксация времени начала и конца теста/шага (`sessionStartTime` + `allowedDuration`). Нельзя обмануть таймер подделкой клиентского времени.
3. **Безопасность ввода:**
   * Санитизация полей ввода эссе во избежание XSS.
   * Rate limiting на API генерации попыток теста и проверки слов (Redis / Upstash).
4. **Отказоустойчивость:**
   * В случае закрытия вкладки студентом сессия сохраняет свое состояние в течение 10 минут. При перезагрузке студент возвращается на текущий незавершенный шаг (без сброса таймера).

---

## 7. ПОШАГОВЫЙ ПЛАН РЕАЛИЗАЦИИ (ROADMAP)

### Спринт 1: Инфраструктура, CMS и Лендинг
* Развертывание PostgreSQL, Strapi/Directus и Next.js.
* Реализация OAuth (Google, Apple, Yandex, VK).
* Интернационализация UI (RU/EN) + Cookie Consent.
* Лендинг (SEO, инфографика DET, адаптивный дизайн).
* Модуль баннерной рекламы (управление в CMS -> показ в Header/Footer).

### Спринт 2: Monkeytype клон и База Знаний
* Страница `/practice/typing`: алгоритм WPM, словарные базы (включая DET слова), кастомный UI каретки.
* Раздел «Теория»: парсинг и перенос контента из гайда в CMS, двуязычные статьи, трекинг прогресса.

### Спринт 3: Движок тестирования (MVP задания)
* Разработка UI-компонентов для каждого типа заданий:
  * Read & Select (5 сек, таймер-бар).
  * Fill in the Blanks & C-Test (фокус полей ввода, автопереходы).
  * Listen & Type (Web Audio API, лимит на 3 прослушивания).
  * Interactive Reading & Listening (комплексные шаги).
  * Writing задания (Write About Photo, Interactive Writing, Writing Sample).
* Маркировка Speaking-заданий бейджем «Inactive / Coming Soon».

### Спринт 4: Адаптивный движок, Скоринг и Сертификаты
* Реализация логики переключения сложности (Multi-Stage Testing).
* Формула подсчета 10–160 и генерация сабскоров.
* Генерация PDF-сертификата (при условии: 100% теории + тест $\ge 105$).
* Страница публичной верификации `/verify/{id}`.
* Тестирование UX, исправление багов американского правописания.

---

Документ готов к передаче проектной команде и формированию задач в трекере (Jira / Linear / YouTrack).