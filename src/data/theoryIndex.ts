import type { LessonGuide } from '@/data/theoryContent';

// Lightweight SSR-safe lesson index: no lesson bodies in the client bundle.
// Only the 13 graded DET task lessons belong here. Reference guides and the
// local start-here page are not part of the dashboard roadmap.
export type TheoryIndexLesson = Pick<
  LessonGuide,
  | 'slug'
  | 'number'
  | 'titleRu'
  | 'titleEn'
  | 'category'
  | 'categoryLabelRu'
  | 'categoryLabelEn'
  | 'format'
  | 'formatEn'
>;

export const theoryIndex: TheoryIndexLesson[] = [
  {
    "slug": "read-and-select",
    "number": 1,
    "titleRu": "Read and Select: Распознавание академической лексики",
    "titleEn": "Read and select: academic vocabulary recognition",
    "category": "vocab",
    "categoryLabelRu": "Лексика",
    "categoryLabelEn": "Vocabulary",
    "format": "На экране появляется одно слово. Таймер ровно 5 секунд на слово. Всего 15–18 слов в блоке. Кнопки 'Yes' (реальное слово) и 'No' (выдуманное слово).",
    "formatEn": "One word on screen, five seconds per word, 15–18 words per block. Yes for a real word, No for a pseudoword."
  },
  {
    "slug": "fill-in-the-blanks",
    "number": 2,
    "titleRu": "Fill in the Blanks: Заполнение пропусков в предложениях",
    "titleEn": "Fill in the blanks: sentence-level context",
    "category": "vocab",
    "categoryLabelRu": "Контекст",
    "categoryLabelEn": "Context",
    "format": "На экране появляется одно предложение. В одном слове даны первые 1–2 буквы, остальная часть слова пропущена. Дается 20 секунд на одно предложение. Всего 6–9 предложений подряд.",
    "formatEn": "One sentence with the first 1–2 letters of a missing word."
  },
  {
    "slug": "read-and-complete",
    "number": 3,
    "titleRu": "Read and Complete: C-Test восстановление текста",
    "titleEn": "Read and complete: paragraph C-Test",
    "category": "vocab",
    "categoryLabelRu": "C-Test",
    "categoryLabelEn": "C-Test",
    "format": "Текст академического содержания (~80–110 слов). В нескольких словах во второй половине предложений стерта вторая половина букв. Ровно 3 минуты на весь текст.",
    "formatEn": "An academic passage of 80–110 words with the second half of several words removed."
  },
  {
    "slug": "listen-and-type",
    "number": 4,
    "titleRu": "Listen and Type: Академический диктант",
    "titleEn": "Listen and type: academic audio transcription",
    "category": "listening",
    "categoryLabelRu": "Диктант",
    "categoryLabelEn": "Dictation",
    "format": "Звучит одно предложение академической или университетской речи. На ввод отводится ровно 60 секунд. Всего за экзамен встречается 4–6 диктантов.",
    "formatEn": "One academic sentence, 60 seconds to type it, up to three playbacks."
  },
  {
    "slug": "interactive-reading",
    "number": 5,
    "titleRu": "Interactive Reading: Академический ридинг-блок",
    "titleEn": "Interactive reading: multi-stage academic passage",
    "category": "interactive",
    "categoryLabelRu": "Ридинг",
    "categoryLabelEn": "Reading",
    "format": "Большой академический текст. Блок из 5 последовательных заданий с общим таймером 7–8 минут. За тест попадается 2 таких блока.",
    "formatEn": "A long academic passage with five linked tasks and a shared 7–8 minute timer."
  },
  {
    "slug": "interactive-listening",
    "number": 6,
    "titleRu": "Interactive Listening: Академический диалог и Summary",
    "titleEn": "Interactive listening: campus dialogue and summary",
    "category": "listening",
    "categoryLabelRu": "Диалог",
    "categoryLabelEn": "Listening",
    "format": "Сценарий академической беседы (студент-профессор или студенты). Интерактивный диалог (выбор реплик) + пауза для повторения + 75 секунд на написание Summary (резюме).",
    "formatEn": "An academic conversation with choices, a 15-second pause and a summary."
  },
  {
    "slug": "write-about-photo",
    "number": 7,
    "titleRu": "Write About the Photo: Описание изображения",
    "titleEn": "Write about the photo: visual scene description",
    "category": "images",
    "categoryLabelRu": "Письмо",
    "categoryLabelEn": "Production Writing",
    "format": "Три изображения подряд. На составление описания каждого снимка отводится ровно 60 секунд. Живой счетчик введенных символов.",
    "formatEn": "Three images in a row, 60 seconds per description."
  },
  {
    "slug": "interactive-writing",
    "number": 8,
    "titleRu": "Interactive Writing: Двухэтапное эссе",
    "titleEn": "Interactive writing: dual-phase academic essay",
    "category": "writing",
    "categoryLabelRu": "Эссе",
    "categoryLabelEn": "Writing",
    "format": "Часть 1: написание развернутого эссе на заданную тему (5 минут). Часть 2: follow-up дополнительный вопрос на ту же тему (3 минуты). Текст части 1 отображается на экране для справки, но закрыт для редактирования.",
    "formatEn": "Part 1: a five-minute essay. Part 2: a three-minute follow-up."
  },
  {
    "slug": "speak-about-photo",
    "number": 9,
    "titleRu": "Speak About the Photo: Устное описание изображения",
    "titleEn": "Speak about the photo: oral visual narration",
    "category": "speaking",
    "categoryLabelRu": "Говорение",
    "categoryLabelEn": "Speaking",
    "format": "Одно изображение на экране. 20 секунд на подготовку, затем 90 секунд на непрерывный устный ответ. Минимальное время речи 30 сек, целевое время 75–85 сек.",
    "formatEn": "One image, 20 seconds to prepare and 90 seconds to speak."
  },
  {
    "slug": "read-then-speak",
    "number": 10,
    "titleRu": "Read, Then Speak: развернутый устный ответ",
    "titleEn": "Read, Then Speak: Extended Spoken Response",
    "category": "speaking",
    "categoryLabelRu": "Говорение",
    "categoryLabelEn": "Speaking",
    "format": "Письменный промпт на экране. 20 секунд на чтение и планирование, затем 90 секунд записи ответа. Вопрос остается видимым во время ответа.",
    "formatEn": "One written prompt. 20 seconds to read and plan, then 90 seconds to record. The prompt stays visible while you speak."
  },
  {
    "slug": "interactive-speaking",
    "number": 11,
    "titleRu": "Interactive Speaking: адаптивный диалог",
    "titleEn": "Interactive Speaking: Adaptive Conversation",
    "category": "speaking",
    "categoryLabelRu": "Говорение",
    "categoryLabelEn": "Speaking",
    "format": "Симулированный диалог с анимированным персонажем. 6–8 вопросов по двум темам, 3–4 вопроса на тему. 35 секунд на ответ, без времени на подготовку. Вопрос звучит один раз, следующий зависит от предыдущего ответа.",
    "formatEn": "A simulated conversation with an animated character. 6–8 questions across two topics, 3–4 per topic. 35 seconds per answer, no preparation time. Each question plays once and the next one adapts to your previous answer."
  },
  {
    "slug": "writing-sample",
    "number": 12,
    "titleRu": "Writing Sample: Оцениваемое финальное эссе",
    "titleEn": "Writing sample: graded admissions essay",
    "category": "writing",
    "categoryLabelRu": "Эссе вузам",
    "categoryLabelEn": "Writing Sample",
    "format": "Финальное развернутое академическое эссе. Дается ровно 5 минут на написание текста на дискуссионную тему. Таймер на экране.",
    "formatEn": "The final academic essay, five minutes."
  },
  {
    "slug": "speaking-sample",
    "number": 13,
    "titleRu": "Speaking Sample: Финальное видеоинтервью",
    "titleEn": "Speaking sample: graded admissions video interview",
    "category": "speaking",
    "categoryLabelRu": "Интервью вузам",
    "categoryLabelEn": "Speaking Sample",
    "format": "Финальный устный ответ на сложную академическую или мировоззренческую тему. 30 секунд на подготовку, от 1 до 3 минут на запись непрерывного видеоответа.",
    "formatEn": "A final spoken answer on an academic topic, 30 seconds to prepare and up to 3 minutes to speak."
  }
];
