import type { LessonGuide } from '@/data/theoryContent';

// Lightweight SSR-safe lesson index: no lesson bodies in the client bundle.
export const theoryIndex: LessonGuide[] = [
  {
    "slug": "rules-and-technicalities",
    "number": 1,
    "titleRu": "Регламент тестирования и технические требования",
    "titleEn": "Testing Protocol & Technical Requirements",
    "category": "rules",
    "categoryLabelRu": "Регламент",
    "categoryLabelEn": "Protocol",
    "format": "Закрытое десктопное приложение Duolingo English Test с видео- и аудиозаписью экрана и помещения.",
    "formatEn": "Закрытое десктопное приложение Duolingo English Test с видео- и аудиозаписью экрана и помещения."
  },
  {
    "slug": "subscores-and-cat-engine",
    "number": 2,
    "titleRu": "Структура сабскоров и адаптивный алгоритм",
    "titleEn": "Subscores Structure & Adaptive Engine",
    "category": "rules",
    "categoryLabelRu": "Оценивание",
    "categoryLabelEn": "Scoring",
    "format": "Адаптивное компьютерное тестирование (CAT) по модели теории тестирования (Item Response Theory).",
    "formatEn": "Адаптивное компьютерное тестирование (CAT) по модели теории тестирования (Item Response Theory)."
  },
  {
    "slug": "read-and-select",
    "number": 3,
    "titleRu": "Read and Select: определение реальных слов",
    "titleEn": "Read and Select: Real Word Recognition",
    "category": "vocab",
    "categoryLabelRu": "Лексика",
    "categoryLabelEn": "Vocabulary",
    "format": "Последовательный показ отдельных слов. Лимит 5 секунд на слово. Выбор с помощью кнопок или клавиш Y и N.",
    "formatEn": "Последовательный показ отдельных слов. Лимит 5 секунд на слово. Выбор с помощью кнопок или клавиш Y и N."
  },
  {
    "slug": "listen-and-select",
    "number": 4,
    "titleRu": "Listen and Select: восприятие слов на слух",
    "titleEn": "Listen and Select: Spoken Word Recognition",
    "category": "vocab",
    "categoryLabelRu": "Аудирование",
    "categoryLabelEn": "Audio Vocabulary",
    "format": "Сетка из 9 аудиокнопок. Допускается повторное воспроизведение каждой дорожки в пределах общего времени.",
    "formatEn": "Сетка из 9 аудиокнопок. Допускается повторное воспроизведение каждой дорожки в пределах общего времени."
  },
  {
    "slug": "fill-in-the-blanks",
    "number": 5,
    "titleRu": "Fill in the Blanks: заполнение пропусков в предложениях",
    "titleEn": "Fill in the Blanks: Single-Sentence Completion",
    "category": "vocab",
    "categoryLabelRu": "Грамматика",
    "categoryLabelEn": "Grammar & Vocab",
    "format": "Отдельные предложения, в каждом из которых пропущено одно слово. Даны начальные буквы и фиксированное число пустых позиций.",
    "formatEn": "Отдельные предложения, в каждом из которых пропущено одно слово. Даны начальные буквы и фиксированное число пустых позиций."
  },
  {
    "slug": "read-and-complete",
    "number": 6,
    "titleRu": "Read and Complete: восстановление текста",
    "titleEn": "Read and Complete: C-Test Text Reconstruction",
    "category": "vocab",
    "categoryLabelRu": "Чтение",
    "categoryLabelEn": "Reading & Literacy",
    "format": "Связный отрывок текста объемом около 90–110 слов. В каждом втором или третьем слове пропущена вторая половина букв.",
    "formatEn": "Связный отрывок текста объемом около 90–110 слов. В каждом втором или третьем слове пропущена вторая половина букв."
  },
  {
    "slug": "listen-and-type",
    "number": 7,
    "titleRu": "Listen and Type: запись предложений под диктовку",
    "titleEn": "Listen and Type: Audio Dictation",
    "category": "listening",
    "categoryLabelRu": "Аудирование",
    "categoryLabelEn": "Listening",
    "format": "Аудиозапись предложения. Первое воспроизведение запускается автоматически. Доступны 2 дополнительных повтора.",
    "formatEn": "Аудиозапись предложения. Первое воспроизведение запускается автоматически. Доступны 2 дополнительных повтора."
  },
  {
    "slug": "read-aloud",
    "number": 8,
    "titleRu": "Read Aloud: чтение предложения вслух",
    "titleEn": "Read Aloud: Oral Reading",
    "category": "speaking",
    "categoryLabelRu": "Говорение",
    "categoryLabelEn": "Speaking",
    "format": "Текстовое предложение на экране. Лимит 20 секунд на чтение в микрофон.",
    "formatEn": "Текстовое предложение на экране. Лимит 20 секунд на чтение в микрофон."
  },
  {
    "slug": "interactive-reading",
    "number": 9,
    "titleRu": "Interactive Reading: комплексный анализ текста",
    "titleEn": "Interactive Reading: Multi-Stage Analysis",
    "category": "interactive",
    "categoryLabelRu": "Интерактивный блок",
    "categoryLabelEn": "Interactive Reading",
    "format": "Один академический текст на 5 последовательных экранах с различными типами аналитических заданий.",
    "formatEn": "Один академический текст на 5 последовательных экранах с различными типами аналитических заданий."
  },
  {
    "slug": "interactive-listening",
    "number": 10,
    "titleRu": "Interactive Listening: диалог и письменное резюме",
    "titleEn": "Interactive Listening: Conversation & Summary",
    "category": "interactive",
    "categoryLabelRu": "Интерактивный блок",
    "categoryLabelEn": "Interactive Listening",
    "format": "Академический диалог из 4–6 реплик, за которым следует 75-секундный блок написания краткого резюме.",
    "formatEn": "Академический диалог из 4–6 реплик, за которым следует 75-секундный блок написания краткого резюме."
  },
  {
    "slug": "write-about-photo",
    "number": 11,
    "titleRu": "Write About the Photo: письменное описание изображения",
    "titleEn": "Write About the Photo: Visual Description",
    "category": "images",
    "categoryLabelRu": "Письмо",
    "categoryLabelEn": "Production Writing",
    "format": "Три изображения подряд. На описание каждого отводится ровно 60 секунд. Живой счетчик слов.",
    "formatEn": "Три изображения подряд. На описание каждого отводится ровно 60 секунд. Живой счетчик слов."
  },
  {
    "slug": "interactive-writing",
    "number": 12,
    "titleRu": "Interactive Writing: двухчастное аргументированное эссе",
    "titleEn": "Interactive Writing: Two-Stage Essay",
    "category": "writing",
    "categoryLabelRu": "Письмо",
    "categoryLabelEn": "Writing Sample",
    "format": "Два связанных этапа. Этап 1: развернутый ответ на вопрос (5 минут, 90–120 слов). Этап 2: уточняющий вопрос по той же теме (3 минуты, 50–70 слов).",
    "formatEn": "Два связанных этапа. Этап 1: развернутый ответ на вопрос (5 минут, 90–120 слов). Этап 2: уточняющий вопрос по той же теме (3 минуты, 50–70 слов)."
  },
  {
    "slug": "writing-sample",
    "number": 13,
    "titleRu": "Writing Sample: итоговое академическое эссе",
    "titleEn": "Writing Sample: Final Argumentative Essay",
    "category": "writing",
    "categoryLabelRu": "Письмо",
    "categoryLabelEn": "Graded Essay",
    "format": "Развернутый дискуссионный вопрос на социальную или научную тему. 5 минут. Рекомендуемый объем: 110–140 слов.",
    "formatEn": "Развернутый дискуссионный вопрос на социальную или научную тему. 5 минут. Рекомендуемый объем: 110–140 слов."
  },
  {
    "slug": "speak-about-photo",
    "number": 14,
    "titleRu": "Speak About the Photo: устное описание изображения",
    "titleEn": "Speak About the Photo: Oral Visual Description",
    "category": "speaking",
    "categoryLabelRu": "Говорение",
    "categoryLabelEn": "Speaking",
    "format": "Одно изображение на экране. 20 секунд на подготовку. До 90 секунд непрерывной записи речи в микрофон.",
    "formatEn": "Одно изображение на экране. 20 секунд на подготовку. До 90 секунд непрерывной записи речи в микрофон."
  },
  {
    "slug": "read-listen-speak",
    "number": 15,
    "titleRu": "Read / Listen, Then Speak: развернутый устный монолог",
    "titleEn": "Read / Listen, Then Speak: Extended Spoken Response",
    "category": "speaking",
    "categoryLabelRu": "Говорение",
    "categoryLabelEn": "Speaking",
    "format": "Текстовая карточка с многосоставным вопросом или аудиозапись вопроса. 20 секунд на подготовку, до 90 секунд ответа.",
    "formatEn": "Текстовая карточка с многосоставным вопросом или аудиозапись вопроса. 20 секунд на подготовку, до 90 секунд ответа."
  },
  {
    "slug": "speaking-sample",
    "number": 16,
    "titleRu": "Speaking Sample: итоговое видеоинтервью",
    "titleEn": "Speaking Sample: Admissions Video Interview",
    "category": "speaking",
    "categoryLabelRu": "Видеоинтервью",
    "categoryLabelEn": "Graded Interview",
    "format": "Дискуссионный вопрос открытого типа. 30 секунд на подготовку. От 1 до 3 минут видеозаписи ответа в веб-камеру.",
    "formatEn": "Дискуссионный вопрос открытого типа. 30 секунд на подготовку. От 1 до 3 минут видеозаписи ответа в веб-камеру."
  }
] as LessonGuide[];
