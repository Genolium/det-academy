export interface LessonGuide {
  slug: string;
  number: number;
  titleRu: string;
  titleEn: string;
  category: 'rules' | 'vocab' | 'listening' | 'interactive' | 'images' | 'writing' | 'speaking';
  categoryLabelRu: string;
  categoryLabelEn: string;
  format: string;
  scoring: string;
  timeLimit: string;
  rules: string[];
  strategySteps: string[];
  formula?: string;
  examples: {
    question?: string;
    sampleText?: string;
    audioPrompt?: string;
    modelAnswer: string;
    comment: string;
  }[];
  pitfalls: string[];
}

export const lessonsData: LessonGuide[] = [
  {
    slug: 'rules-and-technicalities',
    number: 1,
    titleRu: 'Базовые и технические правила DET (Критично)',
    titleEn: 'Base Technical & Exam Rules (Critical)',
    category: 'rules',
    categoryLabelRu: 'Регламент',
    categoryLabelEn: 'Protocol',
    format: 'Прокторинг AI + Человек, закрытый браузер',
    scoring: 'Влияет на валидацию сертификата (Certified / Uncertified)',
    timeLimit: '60 минут весь тест',
    rules: [
      'Никаких ручек и бумаги: Запрещено делать любые записи (taking notes). Весь анализ и планирование — строго в уме.',
      'Контроль взгляда (Eye-tracking): Смотреть только на экран. Взгляд в сторону или вниз приведет к аннулированию.',
      'Адаптивность (CAT): Правильные ответы повышают сложность и ваш потенциальный балл. Ошибки снижают уровень вопросов.',
      'Американский английский (US Spelling): В заданиях на пропуски буквы строго рассчитываются под American English (color, not colour).',
      'Writing & Speaking Samples теперь оцениваются и входят в итоговый балл (10–160).'
    ],
    strategySteps: [
      'Очистите стол от любых предметов, закройте двери в комнату.',
      'Проверьте освещение: лицо должно быть равномерно освещено без теней.',
      'Никогда не отводите взгляд от экрана даже при обдумывании мысли — смотрите в центр монитора.',
      'Помните: чем больше релевантного текста вы напишете или скажете, тем выше балл за лексику и грамматику.'
    ],
    pitfalls: [
      'Попытка записать план эссе на бумажке.',
      'Использование британских вариантов написания слов в C-Test (например, flavour вместо flavor).',
      'Остановка речи на 10+ секунд в устных блоках.'
    ],
    examples: [
      {
        question: 'Почему результат аннулируют при взгляде в окно?',
        modelAnswer: 'Система ИИ-прокторинга расценивает отвод взгляда как списывание или чтение подсказок за монитором.',
        comment: 'Держите визуальный контакт с экраном на протяжении всех 60 минут.'
      }
    ]
  },
  {
    slug: 'read-and-select',
    number: 2,
    titleRu: 'Read and Select (Выбери реальные слова)',
    titleEn: 'Read and Select (Identify Real English Words)',
    category: 'vocab',
    categoryLabelRu: 'Лексика',
    categoryLabelEn: 'Vocabulary',
    format: 'Поочередно выводится 1 слово. Кнопки Yes/No или клавиши Y/N. 15–18 слов в блоке.',
    scoring: 'Штрафная шкала: +1 за верный выбор, -1 за ложный выбор Yes на псевдослове.',
    timeLimit: 'Ровно 5.0 секунд на слово',
    rules: [
      'Только реальные слова английского языка с зафиксированным в словаре значением.',
      'Псевдослова сконструированы так, чтобы выглядеть аутентично (напр. *tween*, *dramatical*).'
    ],
    strategySteps: [
      'Не угадывайте наугад! За выбор псевдослова снимаются баллы.',
      'Если знаете точный перевод и значение — смело жмите Yes (Y).',
      'Если сомневаетесь или слово кажется смутно знакомым, но значения не помните — жмите No (N).',
      'Следите за таймером: полоска убывает за 5 секунд, после чего слово переключается автоматически.'
    ],
    pitfalls: [
      'Нажатие Yes на похожих выдуманных словах из-за спешки.',
      'Случайное нажатие не той клавиши.'
    ],
    examples: [
      {
        question: 'Слово: "ambiguous"',
        modelAnswer: 'YES (Реальное слово — означает двусмысленный/неоднозначный).',
        comment: 'Академическая лексика уровня B2/C1.'
      },
      {
        question: 'Слово: "disflown"',
        modelAnswer: 'NO (Псевдослово — выглядит грамматично, но такого слова в английском нет).',
        comment: 'Типичная ловушка DET: приставка dis- с формой flown.'
      }
    ]
  },
  {
    slug: 'fill-in-the-blanks',
    number: 3,
    titleRu: 'Fill in the Blanks (Заполни пропуск в предложении)',
    titleEn: 'Fill in the Blanks (Contextual Gap Fill)',
    category: 'vocab',
    categoryLabelRu: 'Лексика и грамматика',
    categoryLabelEn: 'Vocab & Grammar',
    format: 'Предложение с пропуском одного слова. Даны первые 1-2 буквы, остальные пустые поля.',
    scoring: 'Строго 0 или 1 балл. Любая опечатка обнуляет ответ.',
    timeLimit: '20 секунд на предложение (6–9 предложений подряд)',
    rules: [
      'Количество пустых полей строго равно количеству недостающих букв.',
      'Только стандартный американский спеллинг.'
    ],
    strategySteps: [
      'Сначала бегло прочитайте предложение до конца (до точки). Контекст подскажет нужную часть речи.',
      'Обратите внимание на форму слова: времена (окончание -ed), множественное число (-s), степени сравнения.',
      'Считайте число пропущенных квадратиков — это прямая подсказка длины слова.'
    ],
    pitfalls: [
      'Ввод слова длиннее или короче количества пустых полей.',
      'Игнорирование грамматического согласования (напр. забытое 3-е лицо -s).'
    ],
    examples: [
      {
        question: 'The scientist conc_____ed that the hypothesis was incorrect.',
        sampleText: 'Первые буквы: c-o-n-c, пропущено 4 буквы, окончание ed.',
        modelAnswer: 'concluded',
        comment: 'Контекст «hypothesis was incorrect» указывает на заключение ученого.'
      }
    ]
  },
  {
    slug: 'read-and-complete',
    number: 4,
    titleRu: 'Read and Complete (C-Test в тексте)',
    titleEn: 'Read and Complete (C-Test)',
    category: 'vocab',
    categoryLabelRu: 'Чтение и лексика',
    categoryLabelEn: 'Reading & Literacy',
    format: 'Текст ~100 слов. Первое и последнее предложения целые. Во вторых половинах слов повреждены буквы.',
    scoring: 'Скользящая шкала за каждое верно восстановленное слово.',
    timeLimit: '3 минуты (180 секунд) на весь текст',
    rules: [
      'Всегда пропущена ровно вторая половина слова (если 5 букв — 2 или 3 пропущены).',
      'Свободная навигация между полями (Tab, Shift+Tab, клик мыши).'
    ],
    strategySteps: [
      'Шаг 1: Skim (сканирование) — прочтите неповрежденные первое и последнее предложения, чтобы понять тему.',
      'Шаг 2: Впишите очевидные легкие служебные слова (the, that, with, from).',
      'Шаг 3: Вернитесь к сложным существительным и глаголам, используя тему текста.'
    ],
    pitfalls: [
      'Застревание на одном непонятном слове на 2 минуты.',
      'Использование британского правописания.'
    ],
    examples: [
      {
        question: 'Solar pan___ convert sunl____ directly into electri____.',
        modelAnswer: 'panels / sunlight / electricity',
        comment: 'pan[els] (3 буквы), sunl[ight] (4 буквы), electri[city] (4 буквы).'
      }
    ]
  },
  {
    slug: 'listen-and-type',
    number: 5,
    titleRu: 'Listen and Type (Аудио-диктант)',
    titleEn: 'Listen and Type (Dictation)',
    category: 'listening',
    categoryLabelRu: 'Аудирование',
    categoryLabelEn: 'Listening',
    format: 'Короткое аудио-предложение. Автоплей через 1 сек. Лимит: максимум 3 воспроизведения.',
    scoring: 'Нормализованное расстояние Левенштейна. Важен регистр первой буквы и финальная точка/знак вопроса.',
    timeLimit: '60 секунд',
    rules: [
      'Кнопка повтора блокируется после 3 нажатий.',
      'Обязательна правильная пунктуация.'
    ],
    strategySteps: [
      '1-е (автоматическое) прослушивание: быстро напечатайте смысловой костяк (существительные и глаголы).',
      '2-е прослушивание: вставьте тихие служебные слова (артикли a/the, предлоги in/at/to).',
      '3-е прослушивание: проверьте окончания множественного числа (-s) и временные формы (-ed).',
      'Перед отправкой проверьте заглавную букву в начале и точку на конце!'
    ],
    pitfalls: [
      'Забытая точка в конце предложения.',
      'Маленькая буква в начале строки.',
      'Слишком быстрое расходование всех 3 повторов в первые 10 секунд.'
    ],
    examples: [
      {
        audioPrompt: '"The professor reminded the students about the upcoming deadline."',
        modelAnswer: 'The professor reminded the students about the upcoming deadline.',
        comment: 'Заглавная T, точка в конце, точный спеллинг professor и deadline.'
      }
    ]
  },
  {
    slug: 'interactive-reading',
    number: 6,
    titleRu: 'Interactive Reading (5 типов заданий)',
    titleEn: 'Interactive Reading (5-step Passage Analysis)',
    category: 'interactive',
    categoryLabelRu: 'Интерактивные блоки',
    categoryLabelEn: 'Interactive',
    format: '1 большой академический текст, разделенный на 5 экранов вопросов.',
    scoring: 'Комплексный скоринг за Literacy и Comprehension.',
    timeLimit: '7–8 минут на весь блок',
    rules: [
      '1. Complete the sentences (дропдауны слов внутри текста).',
      '2. Complete the passage (вставка целого предложения между абзацами).',
      '3. Highlight the answer (выделение диапазона текста мышкой — 2 вопроса).',
      '4. Identify the idea (выбор главной мысли).',
      '5. Title the passage (выбор лучшего заголовка).'
    ],
    strategySteps: [
      'Для вставки предложения ищите логический мостик между концом предыдущего и началом следующего абзацев (слова However, Therefore, Furthermore).',
      'В Highlight the answer выделяйте строго требуемое предложение без лишних знаков.',
      'В заголовке выбирайте вариант, отражающий весь текст, а не только первый абзац.'
    ],
    pitfalls: [
      'Выделение лишних предложений в Highlight step.',
      'Выбор слишком узкого или слишком широкого заголовка.'
    ],
    examples: [
      {
        question: 'Highlight question: Where does the author explain the cause of coral bleaching?',
        modelAnswer: 'Выделить предложение: "Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues."',
        comment: 'Именно это предложение раскрывает причину (cause).'
      }
    ]
  },
  {
    slug: 'interactive-listening',
    number: 7,
    titleRu: 'Interactive Listening (Диалог + 75с Summary)',
    titleEn: 'Interactive Listening (Audio Dialogue & Summary)',
    category: 'interactive',
    categoryLabelRu: 'Аудирование и письмо',
    categoryLabelEn: 'Listening & Writing',
    format: 'Этап А: Диалог из 4-6 реплик (слушаем аудио, выбираем свой ответ). Этап Б: 75 сек на резюме.',
    scoring: 'Оценивается выбор реплик + беглость и полнота резюме (минимум 3 предложения).',
    timeLimit: 'Диалог (~3-4 мин) + 15с пауза + 75с на Summary',
    rules: [
      'В диалоге реплика должна точно отвечать на заданный вопрос собеседника.',
      'В Summary запрещено пользоваться заметками — вся беседа удерживается в памяти.'
    ],
    formula: 'Шаблон Summary из 3 предложений:\n1. Контекст: "I spoke with my professor today regarding [Тема/Проблема]."\n2. Совет: "They explained that [Ключевой совет] and suggested I should [Рекомендация]."\n3. Итог: "I thanked them and decided to [Дальнейшие действия]."',
    strategySteps: [
      'В диалоге следите за контекстом: вы студент, пришедший к профессору или коллеге.',
      'Когда диалог завершится, дается 15 секунд на просмотр полного скрипта — быстро запомните имена и 2 ключевых факта.',
      'В Summary пишите строго 3 емких предложения по приведенному выше шаблону.'
    ],
    pitfalls: [
      'Написание всего 1-2 предложений в Summary из-за паники по таймеру.',
      'Искажение сути диалога.'
    ],
    examples: [
      {
        question: 'Диалог: Студент просит продлить дедлайн по курсовой из-за болезни.',
        modelAnswer: 'I talked to my biology professor today to ask for an extension on my research paper due to my illness. The professor agreed to give me three additional days provided that I submitted a medical note. I agreed to email the certificate tomorrow morning.',
        comment: 'Идеальное трехчастное резюме на 55 слов.'
      }
    ]
  },
  {
    slug: 'write-about-photo',
    number: 8,
    titleRu: 'Write About the Photo (Опиши фото за 60 секунд)',
    titleEn: 'Write About the Photo (60-sec Description)',
    category: 'images',
    categoryLabelRu: 'Письменная речь',
    categoryLabelEn: 'Production',
    format: '3 фотографии подряд. На каждую дается ровно 60 секунд. Живой счетчик слов.',
    scoring: 'Оценивается грамматическое разнообразие, словарный запас (C1 adjectives) и объем (цель: 35–50 слов).',
    timeLimit: '60 секунд на каждое фото',
    rules: [
      'Таймер не останавливается.',
      'Ответ должен быть связным текстом, а не списком предметов.'
    ],
    formula: 'Золотая 4-шаговая формула описания фото:\n1. Введение: "This photograph depicts..."\n2. Действие (Present Continuous): "A young woman is carefully examining..."\n3. Локация: "In the background, several tall bookshelves are visible..."\n4. Догадка (Модальные глаголы): "She must be preparing for an upcoming university examination."',
    strategySteps: [
      'Сразу пишите первое предложение по шаблону «This image illustrates...».',
      'Используйте богатые прилагательные: не "big room", а "spacious, sunlit auditorium".',
      'Обязательно включите модальный глагол догадки (must be, might have been, seems to be).'
    ],
    pitfalls: [
      'Перечисление предметов: "I see a car. I see a man. I see a tree." (Это уровень А1!).',
      'Написание меньше 20 слов.'
    ],
    examples: [
      {
        question: 'Фотография: Инженер в защитной каске изучает чертежи на стройплощадке.',
        modelAnswer: 'This image captures a focused civil engineer wearing a bright yellow hard hat while meticulously examining architectural blueprints on a bustling construction site. In the background, cranes and unfinished concrete structures are visible, suggesting that they might be supervising a major urban development project.',
        comment: '45 слов, уровень C1, богатая лексика (meticulously, blueprints, supervising).'
      }
    ]
  },
  {
    slug: 'speak-about-photo',
    number: 9,
    titleRu: 'Speak About the Photo (Устное описание фото)',
    titleEn: 'Speak About the Photo (Oral Image Description)',
    category: 'speaking',
    categoryLabelRu: 'Говорение (Скоро)',
    categoryLabelEn: 'Speaking (Roadmap)',
    format: '20 секунд на подготовку, до 90 секунд на устный ответ в микрофон.',
    scoring: 'Беглость, произношение, связность и лексическая плотность.',
    timeLimit: '20с подготовка + 90с ответ',
    rules: [
      'Перезаписать ответ нельзя.',
      'Минимальная планка: говорить без длинных пауз не менее 75-80 секунд.'
    ],
    strategySteps: [
      'Используйте ту же 4-шаговую формулу: Что происходит -> Детали и окружение -> Предположения о предыстории и будущем.',
      'Используйте связки: "Moving on to the atmosphere...", "Furthermore...", "It is worth mentioning that...".'
    ],
    pitfalls: [
      'Паузы "эмм", "эээ" дольше 3 секунд.',
      'Остановка речи на 30-й секунде.'
    ],
    examples: [
      {
        question: 'Фото: Семья готовит ужин на современной кухне.',
        modelAnswer: 'In this heartwarming photograph, we can observe a cheerful family engaged in preparing dinner together in a bright, contemporary kitchen...',
        comment: 'В MVP платформы модуль помечен бейджем "Coming Soon: Audio Record".'
      }
    ]
  },
  {
    slug: 'interactive-writing',
    number: 10,
    titleRu: 'Interactive Writing (Двухчастное эссе)',
    titleEn: 'Interactive Writing (Two-Part Essay)',
    category: 'writing',
    categoryLabelRu: 'Письменная речь',
    categoryLabelEn: 'Writing Sample',
    format: 'Часть 1: Академический вопрос (5 мин). Часть 2: Follow-up вопрос (3 мин, часть 1 доступна read-only).',
    scoring: 'Literacy & Production: связность, аргументация, структура.',
    timeLimit: '5 минут (Part 1) + 3 минуты (Part 2)',
    rules: [
      'Во 2-й части текст 1-й части нельзя редактировать, но его нужно учитывать для логической преемственности.'
    ],
    formula: 'Структура академического абзаца:\n1. Четкий тезис (Topic sentence)\n2. Развитие мысли и аргумент (Explanation)\n3. Конкретный жизненный пример (Real-world example)\n4. Микро-вывод (Concluding thought)',
    strategySteps: [
      'Не пишите до 0:00! Оставьте 45 секунд, чтобы перечитать и убрать глупые опечатки.',
      'Используйте академические связки: "Consequently", "On the other hand", "Compelling evidence suggests".'
    ],
    pitfalls: [
      'Отклонение от темы вопроса во второй части.',
      'Слишком короткий текст (<70 слов в части 1).'
    ],
    examples: [
      {
        question: 'Part 1: Do you think remote work is more productive than working in an office? Why or why not?',
        modelAnswer: 'In modern society, remote work has revolutionized professional productivity by eliminating stressful commutes and allowing employees to tailor their optimal work environments. For instance, studies indicate that software developers often write more efficient code when working without open-office distractions...',
        comment: 'Четкая аргументация, академическая лексика.'
      }
    ]
  },
  {
    slug: 'read-listen-speak',
    number: 11,
    titleRu: 'Read / Listen, Then Speak (Развернутый монолог)',
    titleEn: 'Read / Listen, Then Speak (Extended Monologue)',
    category: 'speaking',
    categoryLabelRu: 'Говорение (Скоро)',
    categoryLabelEn: 'Speaking (Roadmap)',
    format: 'Текстовая карточка или аудио-вопрос. 20-30с на подготовку, 90 секунд на ответ.',
    scoring: 'Грамматический контроль (особенно соблюдение времен Past / Present / Future) и беглость.',
    timeLimit: '20-30с подготовка + 90с ответ',
    rules: [
      'Ответьте на все подвопросы, указанные в карточке задания.'
    ],
    strategySteps: [
      'Правило Answer and Expand: дали краткий ответ -> сразу приведите пример из своей жизни или эмоцию.',
      'Следите за временами вопроса: "How DID you..." требует строго Past Simple.',
      '"Would you recommend..." требует сослагательного "I would certainly recommend it because...".'
    ],
    pitfalls: [
      'Ответ в Present времени на вопрос про прошлое.',
      'Ответ только на первый подвопрос из трех.'
    ],
    examples: [
      {
        question: 'Describe a challenging project you worked on. What was it? Why was it difficult? How did you resolve it?',
        modelAnswer: 'A particularly demanding project I undertook was during my sophomore year at university...',
        comment: 'Модель ответа раскрывает все три вопроса карточки.'
      }
    ]
  },
  {
    slug: 'writing-sample',
    number: 12,
    titleRu: 'Writing Sample (Финальное эссе)',
    titleEn: 'Writing Sample (Graded Final Essay)',
    category: 'writing',
    categoryLabelRu: 'Письменная речь',
    categoryLabelEn: 'Graded Essay',
    format: 'Серьезная дискуссионная тема. Ровно 5 минут на написание. Рекомендуемый объем: 100–140 слов.',
    scoring: 'Оценивается ИИ-скорингом и напрямую отправляется в приемную комиссию выбранных университетов.',
    timeLimit: '5 минут',
    rules: [
      'Обязательно соблюдайте академический стиль (никаких сокращений don\'t -> do not).',
      'Запрещено копировать целые фразы из промпта.'
    ],
    formula: 'Формула OREO для скоростного эссе:\n- O (Opinion): Выражение позиции\n- R (Reason): Главная причина\n- E (Example): Иллюстрация и пример\n- O (Outcome): Итоговый вывод',
    strategySteps: [
      'Первые 30 секунд: сформулируйте свое однозначное мнение ("I firmly believe that...").',
      'Следующие 3.5 минуты: напишите 2 развитых аргумента с примером ("For example...").',
      'Финальная 1 минута: напишите заключение и внимательно проверьте запятые и окончания.'
    ],
    pitfalls: [
      'Использование неформального сленга (gonna, wanna, kids).',
      'Текст меньше 90 слов.'
    ],
    examples: [
      {
        question: 'Some believe higher education should be free for all citizens, while others argue students should pay tuition. Discuss your opinion.',
        modelAnswer: 'The debate over tertiary education funding remains crucial for socioeconomic development. I firmly advocate that university education should be universally accessible and funded by the government. Higher education elevates nationwide innovation and reduces income inequality...',
        comment: 'Более 110 слов, сбалансированная лексика C1/C2.'
      }
    ]
  }
];
