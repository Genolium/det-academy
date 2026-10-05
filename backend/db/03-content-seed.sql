-- Directus Collections Registration and Public Read Permissions
INSERT INTO directus_collections (collection, icon, note)
VALUES 
    ('theory_lessons', 'menu_book', 'Theory Lessons and Guides'),
    ('questions', 'quiz', 'Adaptive Question Bank'),
    ('institutions', 'school', 'Universities & Acceptance'),
    ('ad_banners', 'campaign', 'Ad Banners')
ON CONFLICT (collection) DO NOTHING;

INSERT INTO directus_permissions (collection, action, permissions, validation, presets, fields, policy)
VALUES
    ('theory_lessons', 'read', '{}', '{}', NULL, '*', 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'),
    ('questions', 'read', '{}', '{}', NULL, '*', 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'),
    ('institutions', 'read', '{}', '{}', NULL, '*', 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'),
    ('ad_banners', 'read', '{}', '{}', NULL, '*', 'abf8a154-5b1c-4a46-ac9c-7300570f4f17')
ON CONFLICT DO NOTHING;

-- Seed Theory Lessons
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'rules-and-technicalities',
  1,
  'rules-and-technicalities',
  'Регламент тестирования и технические требования',
  'Testing Protocol & Technical Requirements',
  'rules',
  'Регламент',
  'Protocol',
  'Закрытое десктопное приложение Duolingo English Test с видео- и аудиозаписью экрана и помещения.',
  'Верификация сессии: статус Certified или отказ в сертификации (Uncertified) при нарушении протокола.',
  '60 минут (45 минут адаптивная часть, 15 минут открытые семплы)',
  '["Стол должен быть полностью чистым: бумага, ручки, стикеры и любые письменные принадлежности запрещены.","Взгляд фиксируется на экране: длительный отвод глаз в сторону, вниз на клавиатуру или в окно расценивается как считывание подсказок.","В комнате запрещено присутствие других людей и посторонние звуки: включенный телевизор или разговоры за дверью приведут к аннулированию.","Наушники любого типа запрещены: уши должны оставаться полностью открытыми, звук выводится через встроенные динамики компьютера.","Проверка орфографии ориентирована на американский вариант (US spelling): в заданиях с подсчетом символов учитывается именно американское написание.","Разделы Writing Sample и Speaking Sample с 2024 года официально входят в расчет общего балла и сабскора Production."]'::jsonb,
  '["Подготовьте рабочее место заранее: уберите телефон, книги, наушники, лишние предметы со стола.","Настройте прямое освещение: лампа должна освещать лицо спереди, а не светить в объектив камеры из-за спины.","Завершите все фоновые процессы: мессенджеры, программы удаленного доступа, автоисправление текста и уведомления календаря.","Привыкните фиксировать взгляд в центре монитора на поле ввода, чтобы минимизировать непроизвольные движения глазами."]'::jsonb,
  'Контрольные пункты перед запуском приложения:
1. Изолированная комната без посторонних.
2. Открытые уши без гарнитур.
3. Пустой рабочий стол.
4. Выключенные фоновые утилиты.
5. Качественное фронтальное освещение.',
  '[{"question":"Кандидат во время написания эссе регулярно смотрел на стену слева от монитора в течение нескольких секунд.","modelAnswer":"Сессия отклоняется с пометкой о нарушении зрительного контроля (candidate did not look at the screen).","comment":"Взгляд должен оставаться в пределах границ монитора на протяжении всего экзамена."}]'::jsonb,
  '["Использование второго подключенного монитора.","Шепот или проговаривание текста губами во время чтения.","Появление домашних животных в поле зрения веб-камеры."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'subscores-and-cat-engine',
  2,
  'subscores-and-cat-engine',
  'Структура сабскоров и адаптивный алгоритм',
  'Subscores Structure & Adaptive Engine',
  'rules',
  'Оценивание',
  'Scoring',
  'Адаптивное компьютерное тестирование (CAT) по модели теории тестирования (Item Response Theory).',
  'Итоговый результат от 10 до 160 складывается из четырех взаимосвязанных показателей: Literacy, Comprehension, Conversation, Production.',
  '45 минут адаптивного блока',
  '["Каждое задание оценивает два суббалла одновременно.","Сложность заданий калибруется динамически: ранние ответы формируют рабочий диапазон сложности.","Сабскор Production оценивает продуктивные навыки (письмо и говорение) и часто является решающим для приемных комиссий.","Шкала 10–160 соотносится с уровнями CEFR: от A1 (до 55) до C2 (140–160)."]'::jsonb,
  '["Сохраняйте предельную концентрацию в первые 10 минут: они определяют базовый уровень сложности сессии.","Ориентируйтесь на разнообразие лексики и грамматики: простые короткие ответы ограничивают балл за Production.","Пишите и говорите в полном объеме: неполные ответы снижают оценку за беглость и словарный запас."]'::jsonb,
  'Распределение навыков по сабскорам:
• Literacy (чтение и письмо): C-Test, Read and Select, эссе, Interactive Reading.
• Comprehension (чтение и аудирование): диктант, Interactive Reading, Listen and Select.
• Conversation (аудирование и говорение): диалог, устные ответы, Read Aloud.
• Production (письмо и говорение): описание изображений, эссе, устные монологи.',
  '[{"question":"Кандидат написал грамматически корректные, но предельно короткие предложения в эссе (по 4–5 слов).","modelAnswer":"Оценка за Production окажется низкой из-за ограниченного лексического разнообразия.","comment":"Для высокого балла требуются сложные синтаксические конструкции и развитый академический словарь."}]'::jsonb,
  '["Невнимательность на простых заданиях в начале теста.","Использование однотипных конструкций на протяжении всего ответа."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'read-and-select',
  3,
  'read-and-select',
  'Read and Select: определение реальных слов',
  'Read and Select: Real Word Recognition',
  'vocab',
  'Лексика',
  'Vocabulary',
  'Последовательный показ отдельных слов. Лимит 5 секунд на слово. Выбор с помощью кнопок или клавиш Y и N.',
  'Баллы начисляются за правильное опознание существующих слов, за выбор несуществующих начисляется штраф.',
  '5 секунд на слово',
  '["Подтверждайте только те слова, значение которых вы можете уверенно вспомнить.","Выбор псевдослова штрафуется, поэтому случайное угадывание статистически снижает итоговый балл.","Таймер не останавливается: при отсутствии ответа слово считается пропущенным.","Ответы принимаются кликом или нажатием клавиш Y (Yes) и N (No)."]'::jsonb,
  '["Если значение слова вам неизвестно, безопаснее ответить ''No''.","Анализируйте состав слова: псевдослова нередко сочетают корень с неподходящим суффиксом.","Держите пальцы на клавишах Y и N, чтобы не терять время на перемещение курсора мыши."]'::jsonb,
  'Алгоритм выбора за 5 секунд:
1. Значение или контекст известны точно -> Yes.
2. Слово лишь смутно напоминает знакомое, точный смысл неясен -> No.
3. Очевидная ошибка в словообразовании (например, dramatical) -> No.',
  '[{"question":"Слово: ineffable","modelAnswer":"Yes","comment":"Литературное прилагательное со значением ''невыразимый словами''."},{"question":"Слово: dramatical","modelAnswer":"No","comment":"Существуют формы dramatic и dramatically, формы dramatical нет."}]'::jsonb,
  '["Попытка подтверждать все слова подряд наугад.","Спешка при нажатии клавиш, приводящая к случайному вводу для следующего слова."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'listen-and-select',
  4,
  'listen-and-select',
  'Listen and Select: восприятие слов на слух',
  'Listen and Select: Spoken Word Recognition',
  'vocab',
  'Аудирование',
  'Audio Vocabulary',
  'Сетка из 9 аудиокнопок. Допускается повторное воспроизведение каждой дорожки в пределах общего времени.',
  'Баллы за правильный выбор реальных слов со штрафом за выбор псевдослов. Влияет на Comprehension и Conversation.',
  '90 секунд на блок',
  '["Прослушивать аудиодорожки можно несколько раз, пока не истечет общее время.","Выбирайте только те слова, в существовании которых не сомневаетесь.","За ошибочно выбранные несуществующие слова начисляется штраф."]'::jsonb,
  '["В первые 30 секунд прослушайте все 9 записей и отметьте слова, знакомые вам по учебе или чтению.","Во второй половине времени перепроверьте сомнительные варианты, мысленно вспоминая их написание.","Перед отправкой убедитесь, что не нажали лишние варианты: лучше подтвердить 4 точных слова, чем добавить псевдослово."]'::jsonb,
  'Критерий выбора на слух:
Если вы не можете воспроизвести орфографию слова или составить с ним фразу, оставьте его неотмеченным.',
  '[{"question":"Аудиозапись слова: pertain","modelAnswer":"Выбрать","comment":"Академический глагол с предлогом to, означающий ''относиться к чему-либо''."},{"question":"Аудиозапись слова: flinged","modelAnswer":"Не выбирать","comment":"Глагол fling неправильный (формы flung, flung), форма flinged не существует."}]'::jsonb,
  '["Выбор слов исключительно из-за четкой и уверенной интонации диктора.","Задержка на одном слове до истечения всего времени таймера."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'fill-in-the-blanks',
  5,
  'fill-in-the-blanks',
  'Fill in the Blanks: заполнение пропусков в предложениях',
  'Fill in the Blanks: Single-Sentence Completion',
  'vocab',
  'Грамматика',
  'Grammar & Vocab',
  'Отдельные предложения, в каждом из которых пропущено одно слово. Даны начальные буквы и фиксированное число пустых позиций.',
  'Бинарная оценка: 1 балл при полностью точном вводе слова, 0 баллов при любой ошибке.',
  '20 секунд на предложение',
  '["Количество пустых ячеек точно задает длину недостающей части слова.","Слово должно грамматически согласовываться со всем предложением (время, число, часть речи).","Применяются правила американской орфографии.","Регистр букв не учитывается."]'::jsonb,
  '["Прочитайте предложение до конца: контекст второй половины фразы часто определяет выбор слова.","Определите необходимую часть речи по синтаксической роли в предложении.","Посчитайте пустые ячейки и подберите слово нужной длины.","Проверьте правильность окончаний множественного числа или прошедшего времени."]'::jsonb,
  'Порядок решения:
1. Чтение предложения целиком.
2. Определение части речи.
3. Подсчет букв в пропуске.
4. Проверка грамматического согласования.',
  '[{"question":"The committee reached a unanimous dec____ on the proposed budget changes.","sampleText":"dec + 5 пустых ячеек -> dec[ision]","modelAnswer":"decision","comment":"После прилагательного unanimous требуется существительное из 8 букв."}]'::jsonb,
  '["Попытка угадать слово, прочитав только первые два слова предложения.","Несогласованность по времени (например, ввод основы глагола вместо формы прошедшего времени)."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'read-and-complete',
  6,
  'read-and-complete',
  'Read and Complete: восстановление текста',
  'Read and Complete: C-Test Text Reconstruction',
  'vocab',
  'Чтение',
  'Reading & Literacy',
  'Связный отрывок текста объемом около 90–110 слов. В каждом втором или третьем слове пропущена вторая половина букв.',
  'Оценивается доля правильно восстановленных слов. Задание существенно влияет на суббаллы Literacy и Comprehension.',
  '3 минуты на текст',
  '["Первое и заключительное предложения текста всегда даны целиком и задают общую тему.","Пропущена вторая половина слова (при нечетном числе букв пропуск обычно на одну букву длиннее).","Между полями можно переключаться клавишами Tab и Shift+Tab или мышью.","Используется американское правописание."]'::jsonb,
  '["Бегло прочитайте первое и последнее предложения, чтобы понять предметную область текста.","Заполните очевидные служебные слова: местоимения, артикли, союзы и простые предлоги.","Вернитесь к смысловым словам, опираясь на контекст предложения и длину пропуска.","В последние 20 секунд перечитайте текст целиком для проверки связности и окончаний."]'::jsonb,
  'Правило расчета длины пропуска в C-Test:
• 4 буквы: 2 даны, 2 пропущены (wi[th], fr[om]).
• 5 букв: 2 даны, 3 пропущены или наоборот (wh[ere], pl[ant]).
• 6 букв: 3 даны, 3 пропущены (sys[tem], sch[ool]).
• 8 букв: 4 даны, 4 пропущены (rese[arch]).',
  '[{"question":"Scientific experiments require rigorous preparation. Rese____ must docu____ every observation to ensure reli____ results.","sampleText":"Rese[archers] (7 ячеек), docu[ment] (4 ячейки), reli[able] (4 ячейки).","modelAnswer":"Researchers / document / reliable","comment":"Слова логически связаны с темой научного исследования и согласованы по синтаксису."}]'::jsonb,
  '["Длительная остановка на первом сложном слове с потерей времени на остальной текст.","Использование британских вариантов написания (например, behaviour вместо behavior)."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'listen-and-type',
  7,
  'listen-and-type',
  'Listen and Type: запись предложений под диктовку',
  'Listen and Type: Audio Dictation',
  'listening',
  'Аудирование',
  'Listening',
  'Аудиозапись предложения. Первое воспроизведение запускается автоматически. Доступны 2 дополнительных повтора.',
  'Посимвольная точность (расстояние Левенштейна), правильный регистр первой буквы и знак препинания в конце.',
  '60 секунд',
  '["Максимальное количество прослушиваний — три (одно автоматическое и два по клику).","Предложение начинается с заглавной буквы.","В конце обязателен знак препинания: точка или вопросительный знак.","Числительные записываются словами, если диктор произносит их как слова."]'::jsonb,
  '["Первое прослушивание: сразу запишите основные члены предложения (подлежащее, сказуемое, дополнение).","Второе прослушивание (примерно на 20-й секунде): добавьте артикли, предлоги и служебные части речи.","Третье прослушивание (на 40-й секунде): проверьте окончания множественного числа (-s) и прошедшего времени (-ed).","Финальные 10 секунд: убедитесь в наличии заглавной буквы и точки в конце."]'::jsonb,
  'Распределение прослушиваний:
Попытка 1: фиксация смыслового скелета предложения.
Попытка 2: восстановление артиклей и служебных слов.
Попытка 3: проверка грамматических окончаний и пунктуации.',
  '[{"audioPrompt":"The administrative department will publish the schedule tomorrow morning.","modelAnswer":"The administrative department will publish the schedule tomorrow morning.","comment":"Заглавная буква T, слово department написано без опечаток, в конце стоит точка."}]'::jsonb,
  '["Использование всех трех прослушиваний подряд в начале задания.","Пропуск точки или вопросительного знака в конце строки.","Запись чисел цифрами вместо слов."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'read-aloud',
  8,
  'read-aloud',
  'Read Aloud: чтение предложения вслух',
  'Read Aloud: Oral Reading',
  'speaking',
  'Говорение',
  'Speaking',
  'Текстовое предложение на экране. Лимит 20 секунд на чтение в микрофон.',
  'Точность произношения фонем, связность речи, фразовое ударение и деление на смысловые группы.',
  '20 секунд',
  '["Нельзя пропускать слова, добавлять новые или заменять их синонимами.","Запись начинается сразу после нажатия кнопки или по истечении 20 секунд.","Перезаписать ответ нельзя.","Если допущена оговорка, продолжайте чтение без повторения слова с начала."]'::jsonb,
  '["В первые секунды просмотрите предложение и определите сложные многосложные слова.","Мысленно разделите фразу на 2–3 смысловые группы по союзам или знакам препинания.","Прочитайте текст с естественной интонацией, понижая голос к точке в конце предложения."]'::jsonb,
  'Интонационный рисунок предложения:
[Вводная часть ↗] -> [Смысловое ядро ↗] -> [Завершение мысли с понижением тона ↘].',
  '[{"question":"The scientific expedition collected geological samples across the northern ridge.","modelAnswer":"Плавное прочтение с ударением на словах scientific, expedition, collected, geological, northern, ridge.","comment":"Слово expedition произносится с ударением на третий слог, geological — на третий слог."}]'::jsonb,
  '["Чтение отдельными словами с длительными паузами между ними.","Пропуск окончания -ed у правильных глаголов."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'interactive-reading',
  9,
  'interactive-reading',
  'Interactive Reading: комплексный анализ текста',
  'Interactive Reading: Multi-Stage Analysis',
  'interactive',
  'Интерактивный блок',
  'Interactive Reading',
  'Один академический текст на 5 последовательных экранах с различными типами аналитических заданий.',
  'Понимание общего смысла, логической связности и деталей научного или публицистического текста.',
  '7–8 минут на все 5 экранов',
  '["Экран 1: заполнение пропусков в тексте выбором из выпадающего списка.","Экран 2: определение позиции нового предложения внутри структуры текста.","Экраны 3 и 4: выделение в тексте точного фрагмента, отвечающего на вопрос задания.","Экран 5: выбор главной идеи текста и наиболее подходящего заголовка.","Общий таймер 7–8 минут не сбрасывается между экранами."]'::jsonb,
  '["Контролируйте время: не более 2.5 минут на первый экран, по 1–1.5 минуты на последующие шаги.","При вставке предложения ищите слова-связки (However, Therefore, This finding), указывающие на логическую связь с соседними абзацами.","В заданиях на выделение отмечайте только то предложение, которое непосредственно отвечает на поставленный вопрос.","При выборе заголовка отсеивайте слишком узкие варианты, описывающие лишь отдельную деталь одного абзаца."]'::jsonb,
  'Ориентиры для связности текста:
• Противопоставление: however, in contrast, whereas.
• Причинно-следственная связь: consequently, as a result, therefore.
• Отсылка к ранее упомянутому: this process, these findings, such methods.',
  '[{"question":"Вопрос: выделите предложение, объясняющее причину миграции птиц в тексте.","modelAnswer":"Seasonal fluctuations in food availability compel the flock to travel southward before winter conditions set in.","comment":"Выделено строго одно предложение, содержащее прямое указание на причину миграции."}]'::jsonb,
  '["Трата более половины времени на первый экран, из-за чего последние вопросы выполняются в спешке.","Выделение нескольких лишних предложений вокруг ответа."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'interactive-listening',
  10,
  'interactive-listening',
  'Interactive Listening: диалог и письменное резюме',
  'Interactive Listening: Conversation & Summary',
  'interactive',
  'Интерактивный блок',
  'Interactive Listening',
  'Академический диалог из 4–6 реплик, за которым следует 75-секундный блок написания краткого резюме.',
  'Оценивается адекватность реплик в контексте беседы и качество изложения резюме (полнота фактов, грамматика).',
  'Диалог (~3-4 мин), 15 сек на просмотр транскрипта, 75 сек на резюме',
  '["Каждая реплика собеседника звучит один раз.","Выбирайте ответы, соответствующие академическому этикету и цели обращения.","После окончания диалога предоставляется 15 секунд на чтение полного текста беседы без возможности ввода текста.","На написание резюме отводится 75 секунд; оптимальный объем составляет 3 связных предложения (40–60 слов)."]'::jsonb,
  '["Во время диалога удерживайте позицию студента: задавайте предметные вопросы и соглашайтесь с конструктивными указаниями.","В течение 15-секундной паузы сформулируйте про себя три пункта: повод обращения, ответ преподавателя и согласованное решение.","В блоке резюме используйте прошедшее время и косвенную речь: изложите повод, предложенное решение и следующий практический шаг."]'::jsonb,
  'Трехчастная схема резюме диалога:
1. Причина обращения: I met with my instructor to discuss...
2. Разъяснение преподавателя: The professor explained that... and advised me to...
3. Итоговая договоренность: In response, I agreed to submit the revised draft by...',
  '[{"question":"Тема беседы: перенос дедлайна эссе из-за технического сбоя в лаборатории.","modelAnswer":"I spoke with my biology professor regarding a brief extension for my laboratory assignment due to equipment maintenance. The instructor agreed to grant an additional forty-eight hours to finalize the data interpretation. Consequently, I committed to submitting the complete report before Friday afternoon.","comment":"Объем 45 слов, логично отражены цель встречи, решение преподавателя и срок сдачи."}]'::jsonb,
  '["Написание одного короткого предложения вместо связного текста.","Использование прямой речи в кавычках вместо косвенной речи.","Пропуск финального соглашения о сроках или следующих шагах."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'write-about-photo',
  11,
  'write-about-photo',
  'Write About the Photo: письменное описание изображения',
  'Write About the Photo: Visual Description',
  'images',
  'Письмо',
  'Production Writing',
  'Три изображения подряд. На описание каждого отводится ровно 60 секунд. Живой счетчик слов.',
  'Оценивается сабскор Production: разнообразие синтаксиса, точные предметные прилагательные и объем (35–50 слов).',
  '60 секунд на изображение',
  '["Официальная инструкция требует написать одно или несколько предложений; для высокого результата рекомендуются 2–3 развернутых предложения.","Для описания текущих действий людей используется время Present Continuous.","Ответ должен быть связным абзацем, а не разрозненными фразами.","Таймер не останавливается: через 60 секунд ответ отправляется автоматически."]'::jsonb,
  '["Секунды 0–15: Напишите первое предложение с указанием субъекта, действия и места действия.","Секунды 15–35: Добавьте детали переднего или заднего плана с предлогами места (in the foreground, against the backdrop).","Секунды 35–50: Включите логическое предположение с модальными глаголами (appears to be, might have been).","Секунды 50–60: Проверьте согласование подлежащего со сказуемым и форму глаголов с окончанием -ing."]'::jsonb,
  'Трехчастный план описания кадра:
1. Главный объект и действие: This photograph shows [субъект], who is [действие в Present Continuous] in [локация].
2. Окружение и планы: In the background, several [объекты] are visible, suggesting...
3. Контекст или гипотеза: Judging by the setup, they seem to be preparing for...',
  '[{"question":"Фотография: инженер в каске изучает строительную документацию на площадке.","modelAnswer":"This image shows a civil engineer in a protective helmet carefully examining construction blueprints outdoors. In the background, cranes and unfinished concrete foundations indicate an active building site. Judging by his focused posture, he appears to be verifying structural measurements prior to the next phase of work.","comment":"Объем 49 слов, использованы сложные предложения, причастия и уместные предметные термины."}]'::jsonb,
  '["Использование простого настоящего времени вместо Present Continuous для длящихся действий.","Объем ответа менее 20 слов.","Оборванная на полуслове фраза из-за истечения времени."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'interactive-writing',
  12,
  'interactive-writing',
  'Interactive Writing: двухчастное аргументированное эссе',
  'Interactive Writing: Two-Stage Essay',
  'writing',
  'Письмо',
  'Writing Sample',
  'Два связанных этапа. Этап 1: развернутый ответ на вопрос (5 минут, 90–120 слов). Этап 2: уточняющий вопрос по той же теме (3 минуты, 50–70 слов).',
  'Логическая последовательность аргументации, лексический состав, связность между первой и второй частями.',
  '5 минут (часть 1) + 3 минуты (часть 2)',
  '["Часть 1: минимальный продуктивный объем составляет от 85 до 120 слов.","Часть 2: объем от 50 до 70 слов с прямой логической связью с первым ответом.","Текст первой части после перехода блокируется от правок.","Требуется соблюдение формального стиля без разговорных сокращений (пишите do not, cannot, will not).","Не копируйте формулировку вопроса дословно: используйте перифраз."]'::jsonb,
  '["Часть 1 (первые 40 секунд): определите четкую позицию и два аргумента в ее поддержку.","Часть 1 (минуты 1–4): сформулируйте тезис, раскройте причины и приведите конкретный пример.","Часть 1 (последние 40 секунд): проверьте орфографию и знаки препинания.","Часть 2 (минута 1): прочитайте уточняющий вопрос и свяжите его со своей исходной позицией.","Часть 2 (минуты 2–3): напишите один связный абзац с новым аргументом или практическим шагом."]'::jsonb,
  'Логическая структура двухчастного эссе:
• Часть 1: Тезис -> Первый аргумент с обоснованием -> Второй аргумент с примером -> Краткий вывод.
• Часть 2: Ссылка на первую часть (Building on my earlier point regarding...) -> Ответ на уточняющий вопрос -> Итоговое соображение.',
  '[{"question":"Часть 1: Should universities prioritize practical vocational skills over theoretical academic subjects?","modelAnswer":"In discussions of higher education curricula, opinions vary regarding the emphasis on theoretical knowledge versus practical training. I maintain that universities should offer a balanced curriculum that integrates both approaches. Theoretical foundations foster critical thinking and enable students to understand underlying scientific principles. Meanwhile, practical instruction equips graduates with marketable skills demanded by modern industries. For example, engineering students who combine rigorous mathematics with hands-on laboratory experience adapt to professional demands more rapidly. Therefore, incorporating applied projects into academic programs produces well-rounded professionals.","comment":"Объем 85 слов, академический стиль, логичные связки between theory and practice."}]'::jsonb,
  '["Короткий текст в первой части (менее 60 слов).","Разговорные вводные обороты вроде ''Well, I think''.","Отсутствие времени на вычитку текста перед окончанием таймера."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'writing-sample',
  13,
  'writing-sample',
  'Writing Sample: итоговое академическое эссе',
  'Writing Sample: Final Argumentative Essay',
  'writing',
  'Письмо',
  'Graded Essay',
  'Развернутый дискуссионный вопрос на социальную или научную тему. 5 минут. Рекомендуемый объем: 110–140 слов.',
  'Оценивается автоматической системой DET и направляется в приемные комиссии выбранных учебных заведений.',
  '5 минут',
  '["Перефразируйте тему в первом предложении, избегая прямого копирования вопроса.","Соблюдайте строгий академический регистр: без сленга и разговорных сокращений.","Обосновывайте позицию структурированными аргументами и примерами.","Ориентируйтесь на объем от 110 до 140 слов: тексты короче 80 слов получают заниженную оценку."]'::jsonb,
  '["Первые 30 секунд: выберите ту сторону вопроса, для которой проще подобрать доказательства на английском языке.","Минуты 1–3.5: напишите введение с тезисом, два аргумента и один пример из общественной жизни.","Минуты 3.5–4.2: сформулируйте заключительное предложение, обобщающее сказанное.","Последние 40 секунд: проверьте окончания глаголов, артикли и орфографию."]'::jsonb,
  'План аргументированного эссе:
1. Введение: The question of whether [тема] remains contentious; nevertheless, I argue that [тезис].
2. Первый довод: Primarily, [причина и обоснование].
3. Второй довод с примером: Furthermore, [дополнительный аспект]. For instance, [пример].
4. Заключение: In summary, [обобщающий вывод].',
  '[{"question":"Should public transportation in large cities be fully funded by municipal taxes and free for passengers?","modelAnswer":"The financing of municipal public transport represents an important civic consideration in urban planning. I support the view that cities should fund public transit through tax revenues and eliminate ticket fares for residents. First, universal fare-free transit encourages commuters to leave private automobiles at home, which directly reduces traffic congestion and urban air pollution. Furthermore, accessible public transit provides equitable mobility for lower-income families who rely on buses and trains to reach employment opportunities and essential services. For example, several European municipalities that introduced free transit recorded significant decreases in downtown traffic volume. In summary, public funding for urban transportation is a sensible investment that improves both environmental quality and economic mobility.","comment":"Объем 119 слов, выдержана строгая структура, использована предметная лексика по урбанистике и экологии."}]'::jsonb,
  '["Объем эссе менее 85 слов.","Попытка перечислить слишком много разрозненных мыслей без должного раскрытия.","Отсутствие проверки орфографии в конце отведенного времени."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'speak-about-photo',
  14,
  'speak-about-photo',
  'Speak About the Photo: устное описание изображения',
  'Speak About the Photo: Oral Visual Description',
  'speaking',
  'Говорение',
  'Speaking',
  'Одно изображение на экране. 20 секунд на подготовку. До 90 секунд непрерывной записи речи в микрофон.',
  'Оцениваются беглость речи (отсутствие длительных пауз), произношение, разнообразие лексики и синтаксиса.',
  '20 секунд подготовка, до 90 секунд ответ',
  '["Перезаписать устный ответ нельзя: запись включается автоматически после 20 секунд подготовки.","Рекомендуемая продолжительность ответа составляет не менее 70–80 секунд.","Паузы дольше 3 секунд снижают балл за беглость речи.","Сохраняйте зрительный контакт с монитором и веб-камерой."]'::jsonb,
  '["В период подготовки мысленно наметьте 4 пункта: центральная фигура, фон, настроение сцены, предположение о событии.","Секунды 0–20: опишите центральный объект и выполняемое действие.","Секунды 20–45: охарактеризуйте детали заднего плана и пространственное окружение.","Секунды 45–70: выскажите предположение об эмоциях персонажей или цели их деятельности.","Секунды 70–85: подведите итог одним обобщающим предложением."]'::jsonb,
  'Последовательность устного монолога:
1. Центральный объект: The photograph depicts a scene in which...
2. Фон и обстановка: In the background, one can observe...
3. Настроение и контекст: The overall setting appears quiet and focused...
4. Логическое предположение: Judging by their gestures, they may be discussing...
5. Заключение: Overall, the image reflects...',
  '[{"question":"Изображение: студенты за столом в университетской библиотеке готовятся к семинару.","modelAnswer":"This photograph depicts a group of university students collaborating around a wooden table in an academic library. In the center, two individuals are reviewing notes while another student points toward an open laptop screen. In the background, tall shelves filled with reference books and large windows create a calm, studious atmosphere. Judging by their focused expressions and the presence of highlighted articles, they appear to be preparing for an upcoming seminar presentation. Overall, the scene highlights effective teamwork in an academic setting.","comment":"Ответ звучит около 75 секунд при спокойном темпе, содержит последовательные переходы от центра к окружению."}]'::jsonb,
  '["Остановка ответа на 30-й секунде.","Повторение одного и того же описания несколько раз подряд.","Отвод взгляда от экрана во время говорения."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'read-listen-speak',
  15,
  'read-listen-speak',
  'Read / Listen, Then Speak: развернутый устный монолог',
  'Read / Listen, Then Speak: Extended Spoken Response',
  'speaking',
  'Говорение',
  'Speaking',
  'Текстовая карточка с многосоставным вопросом или аудиозапись вопроса. 20 секунд на подготовку, до 90 секунд ответа.',
  'Оценивается полнота ответа на все подпункты задания, грамматический диапазон (прошедшие, настоящие и условные формы), беглость.',
  '20 секунд подготовка, до 90 секунд ответ',
  '["Необходимо ответить на все подпункты, перечисленные в карточке задания.","Сохраняйте грамматическое время вопроса: рассказ о событиях прошлого строится преимущественно в формах Past Simple и Past Continuous.","Если вопрос содержит гипотетическую часть (''What would you do differently?''), используйте условные конструкции.","Избегайте продолжительных пауз молчания."]'::jsonb,
  '["За 20 секунд подготовки разделите ответ на три блока: контекст ситуации, основная сложность и выводы.","Секунды 0–30: ответьте на первый вопрос, описав исходную ситуацию и участников.","Секунды 30–60: раскройте причины возникших трудностей и предпринятые действия.","Секунды 60–85: подведите итог, ответив на вопрос о полученном опыте или возможных изменениях."]'::jsonb,
  'План ответа на многосоставный вопрос:
1. Описание случая: An experience that directly relates to this topic took place when...
2. Характер трудности: The primary challenge in that situation stemmed from...
3. Принятые меры: To address the issue, I decided to...
4. Вывод и оценка: Looking back, that experience showed me the importance of...',
  '[{"question":"Describe a difficult decision you had to make in your studies. What was the situation? Why was the decision difficult? What was the outcome?","modelAnswer":"A challenging decision I faced during my studies involved choosing between continuing an intensive chemistry course or switching to an environmental science seminar. The choice was difficult because I enjoyed laboratory work, yet the environmental syllabus aligned more closely with my career goals in sustainability. After discussing the options with my academic advisor, I decided to register for the environmental seminar. In retrospect, that choice proved beneficial because it provided practical project experience that later helped me secure a research internship.","comment":"Ответ охватывает все три пункта промпта за 75 секунд, выдержаны формы прошедшего времени."}]'::jsonb,
  '["Подробный ответ только на первый вопрос с нехваткой времени на остальные.","Непроизвольный переход на настоящее время при описании прошлых событий.","Повторение связующего слова ''and then'' вместо разнообразных союзов."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'speaking-sample',
  16,
  'speaking-sample',
  'Speaking Sample: итоговое видеоинтервью',
  'Speaking Sample: Admissions Video Interview',
  'speaking',
  'Видеоинтервью',
  'Graded Interview',
  'Дискуссионный вопрос открытого типа. 30 секунд на подготовку. От 1 до 3 минут видеозаписи ответа в веб-камеру.',
  'Оценивается автоматической системой DET и пересылается в видеоформате в приемные комиссии вузов.',
  '30 секунд подготовка, 1–3 минуты ответ',
  '["Смотрите в направлении камеры или центра монитора на протяжении всего ответа.","Рекомендуемая длительность монолога — от 2 до 2.5 минут (ответ короче 90 секунд снижает оценку).","Рассматривайте вопрос структурно, приводя минимум два аргумента или сопоставляя две точки зрения.","Избегайте заученных стандартных текстов: ответ должен отвечать строго на поставленный вопрос."]'::jsonb,
  '["За 30 секунд подготовки определите основную мысль и два направления аргументации.","Минута 1: введите тему и раскройте первый тезис с пояснением.","Минута 2: приведите второй аргумент или рассмотрите возможные возражения оппонентов.","Финальные 30 секунд: сформулируйте взвешенное заключение с обобщением обеих сторон."]'::jsonb,
  'Структура трехминутного ответа:
1. Постановка проблемы: The debate surrounding [тема] involves several competing perspectives.
2. Первый довод: On one hand, advocates emphasize that...
3. Второй довод: On the other hand, it is equally important to consider...
4. Взвешенный итог: On balance, I believe the most practical approach involves...',
  '[{"question":"Should public funding support historical museums and heritage sites, or should they rely solely on admission tickets and private donations?","modelAnswer":"The funding of historical museums raises important questions regarding cultural heritage preservation. I believe that public municipal support is essential alongside private contributions. First, public investment ensures that museums remain accessible to students and low-income visitors regardless of admission fees, thereby promoting historical literacy. In addition, relying entirely on private sponsorship might encourage institutions to prioritize commercially attractive exhibits over culturally significant archives. Therefore, while ticket sales contribute to operating budgets, baseline public funding remains necessary to safeguard national heritage.","comment":"Ответ структурирован, аргументы подкреплены логикой доступности и независимости культурных учреждений."}]'::jsonb,
  '["Преждевременная остановка записи до истечения полутора минут.","Попытка воспроизвести несвязанный заученный топик.","Частый отвод взгляда от объектива камеры."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;


-- Seed Questions Bank (Total: 218)

INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-1',
  'C_TEST',
  'B2',
  '{"title": "Renewable Energy Innovation", "lastSentence": "Consequently, clean energy is now more affordable than traditional fossil fuels in many nations.", "damagedTokens": [{"prefix": "Rec", "missingLength": 3}, {"prefix": "in", "missingLength": 12}, {"prefix": "cel", "missingLength": 2}, {"prefix": "ha", "missingLength": 2}, {"prefix": "dramati", "missingLength": 5}, {"prefix": "low", "missingLength": 4}, {"prefix": "manufac", "missingLength": 6}, {"prefix": "co", "missingLength": 3}], "firstSentence": "Solar panels have transformed how communities produce clean energy worldwide."}',
  '{"answers": ["ent", "photovoltaic", "ls", "ve", "cally", "ered", "turing", "sts"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-10',
  'C_TEST',
  'B2',
  '{"title": "Glacial Retreat & Global Sea Levels", "lastSentence": "Rising coastal waters pose immediate environmental hazards to island communities and delta regions.", "damagedTokens": [{"prefix": "Sate", "missingLength": 5}, {"prefix": "obse", "missingLength": 8}, {"prefix": "sh", "missingLength": 2}, {"prefix": "th", "missingLength": 2}, {"prefix": "mil", "missingLength": 5}, {"prefix": "o", "missingLength": 1}, {"prefix": "to", "missingLength": 2}, {"prefix": "me", "missingLength": 2}], "firstSentence": "Polar ice sheets and alpine glaciers are shrinking at rates faster than historical averages."}',
  '{"answers": ["llite", "rvations", "ow", "at", "lions", "f", "ns", "lt"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-2',
  'C_TEST',
  'B1',
  '{"title": "Urban Ecology & Green Spaces", "lastSentence": "These green corridors also help reduce urban heat and give residents peaceful areas to exercise.", "damagedTokens": [{"prefix": "Lar", "missingLength": 2}, {"prefix": "pub", "missingLength": 3}, {"prefix": "par", "missingLength": 2}, {"prefix": "pro", "missingLength": 4}, {"prefix": "sa", "missingLength": 2}, {"prefix": "she", "missingLength": 5}, {"prefix": "f", "missingLength": 2}, {"prefix": "bi", "missingLength": 3}], "firstSentence": "Modern cities are creating greener spaces to support local wildlife and improve community health."}',
  '{"answers": ["ge", "lic", "ks", "vide", "fe", "lters", "or", "rds"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-3',
  'C_TEST',
  'C1',
  '{"title": "Deep Ocean Exploration", "lastSentence": "Astrobiologists study these ecosystems because hydrothermal vents support life without solar radiation.", "damagedTokens": [{"prefix": "Auton", "missingLength": 5}, {"prefix": "mar", "missingLength": 3}, {"prefix": "vehi", "missingLength": 4}, {"prefix": "navi", "missingLength": 4}, {"prefix": "ext", "missingLength": 4}, {"prefix": "wat", "missingLength": 2}, {"prefix": "pres", "missingLength": 4}], "firstSentence": "Specialized submersibles have unlocked unprecedented insights into underwater geological formations."}',
  '{"answers": ["omous", "ine", "cles", "gate", "reme", "er", "sure"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-4',
  'C_TEST',
  'B2',
  '{"title": "The Psychology of Decision Making", "lastSentence": "Researchers emphasize that recognizing irrational tendencies enables citizens to make prudent investments.", "damagedTokens": [{"prefix": "Wh", "missingLength": 2}, {"prefix": "individ", "missingLength": 4}, {"prefix": "confr", "missingLength": 3}, {"prefix": "comp", "missingLength": 3}, {"prefix": "dilem", "missingLength": 3}, {"prefix": "th", "missingLength": 2}, {"prefix": "re", "missingLength": 2}], "firstSentence": "Cognitive psychologists investigate how subconscious biases influence economic choices."}',
  '{"answers": ["en", "uals", "ont", "lex", "mas", "ey", "ly"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-5',
  'C_TEST',
  'B2',
  '{"title": "Marine Microplastics & Food Webs", "lastSentence": "Conservation biologists urge international regulatory bodies to enforce comprehensive packaging restrictions.", "damagedTokens": [{"prefix": "Indus", "missingLength": 5}, {"prefix": "run", "missingLength": 3}, {"prefix": "depo", "missingLength": 4}, {"prefix": "micros", "missingLength": 5}, {"prefix": "plas", "missingLength": 3}, {"prefix": "parti", "missingLength": 4}], "firstSentence": "Synthetic polymer contamination represents a formidable challenge to oceanic life."}',
  '{"answers": ["trial", "off", "sits", "copic", "tic", "cles"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-6',
  'C_TEST',
  'C1',
  '{"title": "The Evolution of Written Language", "lastSentence": "Anthropologists assert that written symbols allowed human communities to transmit empirical knowledge across generations.", "damagedTokens": [{"prefix": "Ear", "missingLength": 2}, {"prefix": "cunei", "missingLength": 4}, {"prefix": "tabl", "missingLength": 3}, {"prefix": "in", "missingLength": 11}, {"prefix": "recor", "missingLength": 3}, {"prefix": "gr", "missingLength": 3}], "firstSentence": "Ancient civilizations developed structured writing systems to preserve administrative and agricultural records."}',
  '{"answers": ["ly", "form", "ets", "Mesopotamia", "ded", "ain"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-7',
  'C_TEST',
  'C1',
  '{"title": "Quantum Computing & Information Security", "lastSentence": "Consequently, cybersecurity experts are developing cryptographic systems capable of resisting quantum attacks.", "damagedTokens": [{"prefix": "Unli", "missingLength": 2}, {"prefix": "clas", "missingLength": 5}, {"prefix": "com", "missingLength": 6}, {"prefix": "whi", "missingLength": 2}, {"prefix": "pr", "missingLength": 5}, {"prefix": "bi", "missingLength": 4}, {"prefix": "bi", "missingLength": 2}, {"prefix": "qua", "missingLength": 4}], "firstSentence": "Quantum computing has the potential to revolutionize how complex mathematical calculations are solved."}',
  '{"answers": ["ke", "sical", "puters", "ch", "ocess", "nary", "ts", "ntum"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-8',
  'C_TEST',
  'B2',
  '{"title": "Vertical Farming in Urban Landscapes", "lastSentence": "By growing crops close to urban consumers, vertical farms substantially reduce transportation emissions.", "damagedTokens": [{"prefix": "The", "missingLength": 2}, {"prefix": "fac", "missingLength": 7}, {"prefix": "ut", "missingLength": 5}, {"prefix": "artif", "missingLength": 5}, {"prefix": "lig", "missingLength": 5}, {"prefix": "a", "missingLength": 2}, {"prefix": "hydr", "missingLength": 6}, {"prefix": "sys", "missingLength": 4}], "firstSentence": "Indoor vertical farming represents an innovative method of cultivating fresh produce inside dense cities."}',
  '{"answers": ["se", "ilities", "ilize", "icial", "hting", "nd", "oponic", "tems"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-9',
  'C_TEST',
  'B2',
  '{"title": "Sleep Cycles & Memory Consolidation", "lastSentence": "Neuroscientists recommend eight hours of rest to optimize long-term learning retention.", "damagedTokens": [{"prefix": "Dur", "missingLength": 3}, {"prefix": "de", "missingLength": 2}, {"prefix": "sle", "missingLength": 2}, {"prefix": "th", "missingLength": 1}, {"prefix": "br", "missingLength": 3}, {"prefix": "conso", "missingLength": 7}, {"prefix": "rec", "missingLength": 3}, {"prefix": "memo", "missingLength": 4}], "firstSentence": "Quality sleep is vital for maintaining physical well-being and peak cognitive performance."}',
  '{"answers": ["ing", "ep", "ep", "e", "ain", "lidates", "ent", "ries"]}',
  180,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-1',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "concluded", "givenPrefix": "con", "totalLength": 9, "sentenceAfter": " that previous hypotheses had overlooked critical environmental factors.", "sentenceBefore": "The lead researcher "}',
  '{"fullWord": "concluded", "missingLetters": "cluded"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-10',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "comprehensive", "givenPrefix": "com", "totalLength": 13, "sentenceAfter": " portfolio of extracurricular community projects.", "sentenceBefore": "The scholarship committee requested a "}',
  '{"fullWord": "comprehensive", "missingLetters": "prehensive"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-11',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "evidence", "givenPrefix": "evi", "totalLength": 8, "sentenceAfter": " correlating cognitive fatigue with digital screen time.", "sentenceBefore": "Researchers could find no direct "}',
  '{"fullWord": "evidence", "missingLetters": "dence"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-12',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "resolve", "givenPrefix": "re", "totalLength": 7, "sentenceAfter": " longstanding maritime border disagreements.", "sentenceBefore": "Diplomats worked tirelessly to "}',
  '{"fullWord": "resolve", "missingLetters": "solve"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-13',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "preliminary", "givenPrefix": "pre", "totalLength": 11, "sentenceAfter": " stress test on the suspension cables before construction.", "sentenceBefore": "The engineering team conducted a "}',
  '{"fullWord": "preliminary", "missingLetters": "liminary"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-14',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "necessity", "givenPrefix": "ne", "totalLength": 9, "sentenceAfter": " of widespread diagnostic screening.", "sentenceBefore": "Public health agencies stressed the "}',
  '{"fullWord": "necessity", "missingLetters": "cessity"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-15',
  'FILL_BLANKS',
  'C1',
  '{"fullWord": "unprecedented", "givenPrefix": "un", "totalLength": 13, "sentenceAfter": " immune response in laboratory trials.", "sentenceBefore": "The experimental vaccine generated an "}',
  '{"fullWord": "unprecedented", "missingLetters": "precedented"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-16',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "migration", "givenPrefix": "mi", "totalLength": 9, "sentenceAfter": " across glacial land bridges.", "sentenceBefore": "Anthropologists unearthed ancient tools that shed light on human "}',
  '{"fullWord": "migration", "missingLetters": "gration"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-17',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "promote", "givenPrefix": "pro", "totalLength": 7, "sentenceAfter": " sustainable agricultural practices among local farmers.", "sentenceBefore": "The government launched an initiative to "}',
  '{"fullWord": "promote", "missingLetters": "mote"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-18',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "demonstrated", "givenPrefix": "dem", "totalLength": 12, "sentenceAfter": " the efficacy of the novel therapeutic compound.", "sentenceBefore": "Recent clinical trials have "}',
  '{"fullWord": "demonstrated", "missingLetters": "onstrated"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-19',
  'FILL_BLANKS',
  'C1',
  '{"fullWord": "curtail", "givenPrefix": "cur", "totalLength": 7, "sentenceAfter": " industrial emissions.", "sentenceBefore": "Environmental economists argue that carbon taxation can effectively "}',
  '{"fullWord": "curtail", "missingLetters": "tail"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-2',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "adapt", "givenPrefix": "ad", "totalLength": 5, "sentenceAfter": " to rapid technological changes in distance learning.", "sentenceBefore": "Higher education institutions must "}',
  '{"fullWord": "adapt", "missingLetters": "apt"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-20',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "clarify", "givenPrefix": "cla", "totalLength": 7, "sentenceAfter": " the new examination guidelines for graduating seniors.", "sentenceBefore": "The department dean was asked to "}',
  '{"fullWord": "clarify", "missingLetters": "rify"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-21',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "origin", "givenPrefix": "or", "totalLength": 6, "sentenceAfter": " of dramatic theater in ancient Mediterranean societies.", "sentenceBefore": "Scholars have long debated the "}',
  '{"fullWord": "origin", "missingLetters": "igin"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-22',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "obscure", "givenPrefix": "obs", "totalLength": 7, "sentenceAfter": " solar illumination for several consecutive days.", "sentenceBefore": "Heavy volcanic ash clouds can completely "}',
  '{"fullWord": "obscure", "missingLetters": "cure"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-23',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "decision", "givenPrefix": "de", "totalLength": 8, "sentenceAfter": " regarding the distribution of university research grants.", "sentenceBefore": "The committee reached a unanimous "}',
  '{"fullWord": "decision", "missingLetters": "cision"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-24',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "absorb", "givenPrefix": "abs", "totalLength": 6, "sentenceAfter": " seismic vibrations efficiently.", "sentenceBefore": "To maintain structural integrity, modern skyscrapers are designed to "}',
  '{"fullWord": "absorb", "missingLetters": "orb"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-25',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "strengthen", "givenPrefix": "str", "totalLength": 10, "sentenceAfter": " diplomatic partnerships across participating continents.", "sentenceBefore": "The international summit aimed to "}',
  '{"fullWord": "strengthen", "missingLetters": "engthen"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-26',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "question", "givenPrefix": "que", "totalLength": 8, "sentenceAfter": " the fundamental assumptions underpinning ethical theories.", "sentenceBefore": "Philosophers frequently "}',
  '{"fullWord": "question", "missingLetters": "stion"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-27',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "terminate", "givenPrefix": "ter", "totalLength": 9, "sentenceAfter": " non-essential operations to reduce overhead expenditures.", "sentenceBefore": "The company decided to "}',
  '{"fullWord": "terminate", "missingLetters": "minate"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-28',
  'FILL_BLANKS',
  'C1',
  '{"fullWord": "detrimental", "givenPrefix": "det", "totalLength": 11, "sentenceAfter": " to its survival.", "sentenceBefore": "Genetic mutations can either benefit an organism or prove distinctly "}',
  '{"fullWord": "detrimental", "missingLetters": "rimental"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-29',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "evaluate", "givenPrefix": "eva", "totalLength": 8, "sentenceAfter": " consumer attitudes toward autonomous electric vehicles.", "sentenceBefore": "The primary objective of the survey is to "}',
  '{"fullWord": "evaluate", "missingLetters": "luate"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-3',
  'FILL_BLANKS',
  'C1',
  '{"fullWord": "undermine", "givenPrefix": "un", "totalLength": 9, "sentenceAfter": " social welfare programs in developing nations.", "sentenceBefore": "Economic instability can severely "}',
  '{"fullWord": "undermine", "missingLetters": "dermine"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-30',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "implications", "givenPrefix": "imp", "totalLength": 12, "sentenceAfter": " of generative models on intellectual copyright.", "sentenceBefore": "Scientists gathered at the symposium to discuss the "}',
  '{"fullWord": "implications", "missingLetters": "lications"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-4',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "collaborate", "givenPrefix": "co", "totalLength": 11, "sentenceAfter": " on their final engineering capstone projects.", "sentenceBefore": "Students are encouraged to "}',
  '{"fullWord": "collaborate", "missingLetters": "llaborate"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-5',
  'FILL_BLANKS',
  'B1',
  '{"fullWord": "cancel", "givenPrefix": "can", "totalLength": 6, "sentenceAfter": " all scheduled transatlantic flights.", "sentenceBefore": "Due to severe blizzard conditions, airport authorities decided to "}',
  '{"fullWord": "cancel", "missingLetters": "cel"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-6',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "supported", "givenPrefix": "sup", "totalLength": 9, "sentenceAfter": " by peer-reviewed empirical evidence.", "sentenceBefore": "National ecological policies must be firmly "}',
  '{"fullWord": "supported", "missingLetters": "ported"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-7',
  'FILL_BLANKS',
  'C1',
  '{"fullWord": "facilitate", "givenPrefix": "fa", "totalLength": 10, "sentenceAfter": " safer non-motorized cycling routes.", "sentenceBefore": "Urban architects are redesigning infrastructure to "}',
  '{"fullWord": "facilitate", "missingLetters": "cilitate"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-8',
  'FILL_BLANKS',
  'B2',
  '{"fullWord": "fluctuate", "givenPrefix": "fluc", "totalLength": 9, "sentenceAfter": " unpredictably ahead of interest rate decisions.", "sentenceBefore": "Market economists predict currency values will "}',
  '{"fullWord": "fluctuate", "missingLetters": "tuate"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-9',
  'FILL_BLANKS',
  'C1',
  '{"fullWord": "deteriorate", "givenPrefix": "de", "totalLength": 11, "sentenceAfter": " unless ocean surface temperatures stabilize.", "sentenceBefore": "Marine biologists caution that coral reefs will "}',
  '{"fullWord": "deteriorate", "missingLetters": "teriorate"}',
  20,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'il-1',
  'INTERACTIVE_LISTENING',
  'B2',
  '{"turns": [{"options": ["Hello Professor. I was sick with the flu this week and would like to request a brief extension.", "I wanted to ask why the university cafeteria was closed today.", "Yes, I brought my umbrella because it was raining heavily outside.", "I do not really like reading textbooks in the evening."], "speaker": "Professor Hayes", "correctIndex": 0, "speakerAudioText": "Come on in! How can I help you today with your final project?"}, {"options": ["Three days would be sufficient for me to complete the bibliography and edit the final draft.", "I think I will probably graduate in two years.", "The weather was much better yesterday than today.", "No, I did not receive any emails from other students."], "speaker": "Professor Hayes", "correctIndex": 0, "speakerAudioText": "I am sorry to hear you were unwell. How many additional days do you realistically need?"}, {"options": ["Understood. I will upload the documentation immediately and submit the paper by Thursday night. Thank you!", "I already had lunch, so I do not need anything else.", "Where is the library located on campus?", "Why do other classes have different exams?"], "speaker": "Professor Hayes", "correctIndex": 0, "speakerAudioText": "That seems fair. Please make sure to submit your health clinic slip to the departmental portal by Friday."}], "scenario": "You are an undergraduate student meeting your biology professor during office hours to discuss an extension on your research assignment due to illness.", "summaryPrompt": "Write a 3-sentence summary of your conversation with the professor. Mention the reason for the visit, the agreement reached, and your next step."}',
  '{"turnsAnswers": [0, 0, 0]}',
  360,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'il-2',
  'INTERACTIVE_LISTENING',
  'B2',
  '{"turns": [{"options": ["Good afternoon. I am considering switching my major to Computer Science and want to check credit transfers.", "I lost my student ID card in the library yesterday.", "I need directions to the campus bookstore.", "The tuition fees were already paid by my bank last week."], "speaker": "Advisor Martinez", "correctIndex": 0, "speakerAudioText": "Good afternoon! What brings you into the advising center today?"}, {"options": ["I finished Calculus I and II with high marks, but I still need to enroll in Python programming next term.", "I usually eat lunch around noon on weekdays.", "Calculus is taught on the third floor of the science hall.", "No, I have never participated in intramural basketball."], "speaker": "Advisor Martinez", "correctIndex": 0, "speakerAudioText": "Have you already completed the prerequisite Calculus and introductory programming sequences?"}, {"options": ["Thank you for the guidance. I will submit the summer registration petition today.", "I do not plan to take any courses during my degree.", "My roommate is also an economics student.", "The library closes at ten on Friday nights."], "speaker": "Advisor Martinez", "correctIndex": 0, "speakerAudioText": "Excellent. If you register for Programming I over the summer session, you will stay completely on track for four-year graduation."}], "scenario": "You are consulting a university academic advisor about switching your major from Economics to Computer Science in your sophomore year.", "summaryPrompt": "In 75 seconds, write a concise summary (35\u201365 words) detailing why you met the advisor, their academic prerequisite recommendations, and your next step."}',
  '{"turnsAnswers": [0, 0, 0]}',
  360,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'il-3',
  'INTERACTIVE_LISTENING',
  'B2',
  '{"turns": [{"options": ["Good morning Dr. Vance. Yes, incorporating survey data would allow me to triangulate my findings across a larger sample size.", "I forgot to return the laboratory keys yesterday afternoon.", "The campus bus was running twenty minutes late this morning.", "I am thinking about taking a painting class over the weekend."], "speaker": "Dr. Vance", "correctIndex": 0, "speakerAudioText": "Good morning. I reviewed the draft of your methodology section. Have you considered using mixed methods instead of purely qualitative interviews?"}, {"options": ["I can draft the questionnaire within ten days and pilot it with a focus group next week.", "I usually study in the library until eight in the evening.", "Survey forms were invented over a hundred years ago in England.", "No, I have never participated in varsity cross-country running."], "speaker": "Dr. Vance", "correctIndex": 0, "speakerAudioText": "That would strengthen your empirical rigor significantly. How long will it take you to design and pilot the online survey?"}, {"options": ["I will email the survey draft by next Monday. Thank you for the constructive feedback, Dr. Vance.", "I will probably buy a new laptop before next semester begins.", "The university cafeteria menu changes every Tuesday morning.", "Chemistry was always my favorite subject in high school."], "speaker": "Dr. Vance", "correctIndex": 0, "speakerAudioText": "Excellent timeline. Send me the survey questions as soon as they are ready so we can verify the statistical validity."}], "scenario": "You are a graduate student speaking with your faculty dissertation supervisor regarding changes in your methodology chapter.", "summaryPrompt": "In 75 seconds, write a concise summary (35\u201365 words) summarizing why you met Dr. Vance, the methodological recommendation made, and your agreed timeline."}',
  '{"turnsAnswers": [0, 0, 0]}',
  360,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ir-1',
  'INTERACTIVE_READING',
  'B2',
  '{"gapSentence": {"after": " for coastal shorelines against severe tropical storms.", "before": "Marine biologists have observed that healthy reef ecosystems provide ", "correct": "protection", "options": ["protection", "destruction", "pollution", "ignorance"]}, "passageText": "Coral reefs are among the most biologically diverse ecosystems on the planet, often referred to as the rain forests of the sea. They provide critical habitats for a quarter of all marine life despite covering less than one percent of the ocean floor. Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching. Without these algae, the coral slowly starves and becomes vulnerable to disease.", "passageTitle": "Coral Reef Ecosystems Under Thermal Stress", "titleQuestion": {"options": ["Thermal Degradation in Marine Coral Ecosystems", "How Tropical Fish Spend Their Summers", "A Brief History of Scuba Diving", "Economic Growth of Coastal Tourism"], "question": "Choose the most appropriate academic title for this passage:", "correctIndex": 0}, "highlightPrompt": "Click and highlight the exact sentence that identifies what happens to corals when ocean temperatures elevate.", "sentenceOptions": ["Furthermore, widespread bleaching events have increased exponentially in frequency over the past three decades.", "However, artificial fish tanks are rarely found near ocean trenches.", "Therefore, many tourists prefer warm beaches during winter seasons.", "Nevertheless, coal mining remains a traditional source of electrical power."], "mainIdeaQuestion": {"options": ["To describe the biological mechanism and ecological gravity of coral bleaching", "To encourage commercial fishing vessels to navigate deeper equatorial waters", "To prove that ocean temperatures have ceased fluctuating", "To compare tropical rain forests directly with alpine meadows"], "question": "What is the primary objective of the author in this passage?", "correctIndex": 0}}',
  '{"gapCorrect": "protection", "titleCorrectIndex": 0, "mainIdeaCorrectIndex": 0, "sentenceCorrectIndex": 0, "highlightCorrectSubstring": "Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching."}',
  420,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ir-2',
  'INTERACTIVE_READING',
  'B2',
  '{"gapSentence": {"after": " the severity of localized metropolitan temperature spikes.", "before": "Urban planners advocate implementing reflective roofing and green vegetation to ", "correct": "mitigate", "options": ["mitigate", "exacerbate", "eliminate", "disregard"]}, "passageText": "Densely populated metropolitan areas routinely experience elevated surface temperatures compared to surrounding rural perimeters, an environmental phenomenon termed the Urban Heat Island effect. Massive expanses of asphalt, concrete pavement, and dark roofing materials absorb solar radiation during daylight hours and slowly re-radiate thermal energy throughout the night. Consequently, cooling demand spikes, placing immense pressure on metropolitan electrical grids.", "passageTitle": "The Architecture of Megacities and Heat Islands", "titleQuestion": {"options": ["Thermal Dynamics in Modern Urban Architecture", "A Guide to Designing Suburban Golf Courses", "The History of Steam Power in Industrial Centers", "Why Rural Farmland Remains Unpopulated"], "question": "Select the most suitable title for this text:", "correctIndex": 0}, "highlightPrompt": "Click and highlight the sentence detailing why urban construction materials absorb and release solar radiation.", "sentenceOptions": ["In addition, planting municipal shade trees along streets dramatically lowers ambient sidewalk heat.", "Nevertheless, lunar exploration requires pressurized spacesuits for astronauts.", "Conversely, ancient manuscripts were handwritten using quill pens and iron gall ink.", "As a result, deep-sea currents transport nutrient-dense cold water along tectonic rifts."], "mainIdeaQuestion": {"options": ["Analyzing the thermodynamic causes and infrastructure consequences of the Urban Heat Island effect", "Explaining how historical architects constructed limestone cathedrals in Europe", "Debating the cost-effectiveness of residential solar panels in agricultural villages", "Evaluating the efficiency of municipal water purification plants"], "question": "What is the central focus of the excerpt?", "correctIndex": 0}}',
  '{"gapCorrect": "mitigate", "titleCorrectIndex": 0, "mainIdeaCorrectIndex": 0, "sentenceCorrectIndex": 0, "highlightCorrectSubstring": "Massive expanses of asphalt, concrete pavement, and dark roofing materials absorb solar radiation during daylight hours and slowly re-radiate thermal energy throughout the night."}',
  420,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ir-3',
  'INTERACTIVE_READING',
  'C1',
  '{"gapSentence": {"after": " connectivity among older adults.", "before": "Engaging regularly in intellectually demanding activities helps maintain ", "correct": "synaptic", "options": ["synaptic", "skeletal", "cardiac", "respiratory"]}, "passageText": "For much of the twentieth century, neuroscientists operated under the dogma that the adult human brain was structurally immutable. It was widely believed that neurogenesis ceased after adolescence, leaving older individuals with a fixed cognitive architecture. Modern neuroimaging has shattered this assumption, demonstrating neuroplasticity: the central nervous system''s lifelong capacity to reorganize neural pathways in response to novel learning, environmental enrichment, and cognitive rehabilitation.", "passageTitle": "Neuroplasticity and Lifelong Cognitive Adaptation", "titleQuestion": {"options": ["Neuroplasticity: Overcoming the Dogma of the Static Brain", "The Anatomy of Childhood Memory Formation", "Medical History of Medieval Physicians", "How to Pass University Cognitive Tests"], "question": "Choose the most appropriate academic title for this passage:", "correctIndex": 0}, "highlightPrompt": "Click and highlight the sentence expressing the historical misconception held by early neuroscientists.", "sentenceOptions": ["Furthermore, acquiring foreign languages or learning musical instruments has been shown to fortify cognitive reserve.", "However, ancient philosophers rarely contemplated the biological composition of the cosmos.", "Therefore, steam locomotives were rapidly superseded by diesel combustion engines.", "Consequently, deep ocean submersibles must withstand extreme atmospheric barometric pressure."], "mainIdeaQuestion": {"options": ["The adult human brain retains structural plasticity and adaptable potential throughout life.", "Human learning capabilities terminate abruptly at the conclusion of childhood.", "Neuroimaging techniques have proven ineffective at measuring mental processes.", "Intellectual challenges accelerate cognitive fatigue in elderly subjects."], "question": "What is the central premise demonstrated in this passage?", "correctIndex": 0}}',
  '{"gapCorrect": "synaptic", "titleCorrectIndex": 0, "mainIdeaCorrectIndex": 0, "sentenceCorrectIndex": 0, "highlightCorrectSubstring": "For much of the twentieth century, neuroscientists operated under the dogma that the adult human brain was structurally immutable."}',
  420,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ir-4',
  'INTERACTIVE_READING',
  'B2',
  '{"gapSentence": {"after": " of beneficial probiotic bacterial species.", "before": "Dietary fibers act as prebiotics that selectively promote the ", "correct": "proliferation", "options": ["proliferation", "suppression", "termination", "contamination"]}, "passageText": "The human gastrointestinal tract harbors trillions of microorganisms that constitute the gut microbiome. Rather than functioning merely as passive organisms, these bacterial colonies play an active role in training the human immune system. Disruption of this microbial balance, termed dysbiosis, has been linked to numerous chronic conditions ranging from autoimmune disorders to metabolic syndromes.", "passageTitle": "Microbiome Ecology and Human Immunology", "titleQuestion": {"options": ["Symbiotic Microorganisms: The Immunological Significance of the Gut Microbiome", "A History of Surgical Equipment in the Nineteenth Century", "Industrial Food Processing and Packaging Techniques", "How to Cultivate Tropical Plants in Greenhouses"], "question": "Choose the most appropriate academic title for this passage:", "correctIndex": 0}, "highlightPrompt": "Click and highlight the exact sentence that defines the term applied when the bacterial balance is disrupted.", "sentenceOptions": ["Moreover, broad-spectrum antibiotics can inadvertently eradicate beneficial gut bacteria alongside pathogens.", "Consequently, medieval trade routes were heavily guarded by royal cavalry.", "Therefore, geothermal vents provide extreme pressure at the bottom of the Mariana Trench.", "Nevertheless, steam locomotives revolutionized nineteenth-century continental logistics."], "mainIdeaQuestion": {"options": ["The gut microbiome plays an indispensable role in maintaining systemic immune and metabolic health.", "All microorganisms living inside humans cause infectious diseases unless eradicated.", "Dietary fiber has no measurable correlation with digestive well-being.", "Antibiotics should replace dietary regulation in modern clinical protocols."], "question": "What is the primary thesis advanced by the author regarding the gut microbiome?", "correctIndex": 0}}',
  '{"gapCorrect": "proliferation", "titleCorrectIndex": 0, "mainIdeaCorrectIndex": 0, "sentenceCorrectIndex": 0, "highlightCorrectSubstring": "Disruption of this microbial balance, termed dysbiosis, has been linked to numerous chronic conditions ranging from autoimmune disorders to metabolic syndromes."}',
  420,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ir-5',
  'INTERACTIVE_READING',
  'C1',
  '{"gapSentence": {"after": " impact assessments to avoid toxic chemical runoff.", "before": "Establishing domestic mineral processing facilities requires substantial capital investment and stringent ", "correct": "environmental", "options": ["environmental", "fictional", "negligent", "recreational"]}, "passageText": "The global transition toward renewable energy technologies relies heavily on critical minerals known as rare earth elements. Essential for the fabrication of permanent magnets used in wind turbines and electric vehicle motors, these elements are geologically dispersed yet geographically concentrated in their refining capacity. Securing stable supply chains has become a prominent geopolitical priority for industrialized nations striving to achieve net-zero targets.", "passageTitle": "The Geopolitics of Rare Earth Elements", "titleQuestion": {"options": ["Critical Minerals in the Clean Energy Transition: Strategic Realities", "The Exploration of Deep Ocean Abyssal Plains", "Urbanization Trends in Twentieth-Century Europe", "Principles of Aerodynamic Flight Control"], "question": "Select the most accurate academic title for the passage:", "correctIndex": 0}, "highlightPrompt": "Click and highlight the sentence explaining why securing critical mineral supply chains has become a geopolitical priority.", "sentenceOptions": ["Furthermore, international trade partnerships are forming to diversify supply sources and bolster geopolitical resilience.", "However, classical Greek philosophers did not anticipate the emergence of commercial aviation.", "Therefore, wooden ships were traditionally constructed using seasoned oak timber.", "Consequently, Antarctic penguins migrate southward during the harsh austral winter."], "mainIdeaQuestion": {"options": ["The critical strategic and environmental challenges surrounding mineral supply chains for clean energy", "The mechanical engineering differences between diesel and electric motor transmissions", "A detailed analysis of agricultural soil fertility in equatorial developing countries", "The commercial collapse of international shipping container networks"], "question": "What is the central focus of the discussion regarding rare earth minerals?", "correctIndex": 0}}',
  '{"gapCorrect": "environmental", "titleCorrectIndex": 0, "mainIdeaCorrectIndex": 0, "sentenceCorrectIndex": 0, "highlightCorrectSubstring": "Securing stable supply chains has become a prominent geopolitical priority for industrialized nations striving to achieve net-zero targets."}',
  420,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'iw-1',
  'INTERACTIVE_WRITING',
  'B2',
  '{"part1Prompt": "Some people believe that university students should focus strictly on academic subjects related to their careers, while others argue they should take a broad range of general education courses. What is your opinion? Write at least 80 words.", "part2Prompt": "Considering your answer above, how should universities support students who feel overwhelmed by taking general education courses outside their primary field? Write at least 50 words."}',
  '{"rubric": "academic_cohesion_min80_min50"}',
  480,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'iw-2',
  'INTERACTIVE_WRITING',
  'B2',
  '{"part1Prompt": "With the rise of remote work and digital nomadism, many professionals choose to work outside traditional corporate offices. Discuss the primary advantages and potential drawbacks of this trend. Write at least 80 words.", "part2Prompt": "Reflecting on your initial perspective, what specific obligations do employers have toward preserving employee mental health and preventing burnout in remote environments? Write at least 50 words."}',
  '{"rubric": "academic_cohesion_min80_min50"}',
  480,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'iw-3',
  'INTERACTIVE_WRITING',
  'C1',
  '{"part1Prompt": "Some governments are investing substantial public funds into exploring deep space, while critics argue that domestic problems on Earth should take absolute priority. What is your stance? Write at least 80 words.", "part2Prompt": "Building upon your previous argument, how can technological innovations developed during space missions directly benefit social infrastructure and everyday life on Earth? Write at least 50 words."}',
  '{"rubric": "academic_cohesion_min80_min50"}',
  480,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'iw-4',
  'INTERACTIVE_WRITING',
  'B2',
  '{"minWords": 50, "part1Prompt": "Many educators argue that secondary schools should teach personal financial literacy and investing rather than advanced theoretical calculus. What is your perspective? Write at least 80 words.", "part2Prompt": "Following up on your answer, how can educational policymakers design a balanced curriculum that equips students with practical financial skills without compromising essential STEM foundations? Write at least 50 words."}',
  '{"minWordsPart1": 50, "minWordsPart2": 40}',
  480,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-1',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "There are thousands of robots doing a wide variety of tasks in hospitals."}',
  '{"expectedSentence": "There are thousands of robots doing a wide variety of tasks in hospitals."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-10',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "The mobile phone has made an enormous difference to the way we communicate."}',
  '{"expectedSentence": "The mobile phone has made an enormous difference to the way we communicate."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-11',
  'LISTEN_TYPE',
  'C1',
  '{"playsAllowed": 3, "audioSentence": "Had I realized the severity of the situation, I would have informed the authorities immediately."}',
  '{"expectedSentence": "Had I realized the severity of the situation, I would have informed the authorities immediately."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-12',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "The primary energy source of tropical storms is warm ocean waters."}',
  '{"expectedSentence": "The primary energy source of tropical storms is warm ocean waters."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-13',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "Once they had checked all my bags, I was allowed on the plane."}',
  '{"expectedSentence": "Once they had checked all my bags, I was allowed on the plane."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-14',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "She became very sick because she had not been sleeping enough."}',
  '{"expectedSentence": "She became very sick because she had not been sleeping enough."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-15',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "Scientific research on human emotions has increased significantly over the past two decades."}',
  '{"expectedSentence": "Scientific research on human emotions has increased significantly over the past two decades."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-16',
  'LISTEN_TYPE',
  'C1',
  '{"playsAllowed": 3, "audioSentence": "After the evaluation, the government announced a radical review of its procedures."}',
  '{"expectedSentence": "After the evaluation, the government announced a radical review of its procedures."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-17',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "The company has decided to integrate the sales and marketing departments."}',
  '{"expectedSentence": "The company has decided to integrate the sales and marketing departments."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-18',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "The public sector is the part of the economy that provides basic government services."}',
  '{"expectedSentence": "The public sector is the part of the economy that provides basic government services."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-19',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "Obesity is connected to many different fatal diseases."}',
  '{"expectedSentence": "Obesity is connected to many different fatal diseases."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-2',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "Educational methods include teaching, storytelling, discussions, and research."}',
  '{"expectedSentence": "Educational methods include teaching, storytelling, discussions, and research."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-20',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "I do not think it is worth spending all that money on exploring the universe."}',
  '{"expectedSentence": "I do not think it is worth spending all that money on exploring the universe."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-21',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "The university library provides extensive digital archives for graduate researchers."}',
  '{"expectedSentence": "The university library provides extensive digital archives for graduate researchers."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-22',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "Modern renewable technologies have significantly decreased the cost of solar energy."}',
  '{"expectedSentence": "Modern renewable technologies have significantly decreased the cost of solar energy."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-23',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "Students who organize their revision schedules generally experience less stress before exams."}',
  '{"expectedSentence": "Students who organize their revision schedules generally experience less stress before exams."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-24',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "The laboratory technician calibrated the electronic balance before weighing the chemical samples."}',
  '{"expectedSentence": "The laboratory technician calibrated the electronic balance before weighing the chemical samples."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-25',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "Urban planning initiatives must prioritize pedestrian accessibility and efficient public transit."}',
  '{"expectedSentence": "Urban planning initiatives must prioritize pedestrian accessibility and efficient public transit."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-26',
  'LISTEN_TYPE',
  'C1',
  '{"playsAllowed": 3, "audioSentence": "Artificial intelligence algorithms require rigorous ethical oversight when deployed in healthcare."}',
  '{"expectedSentence": "Artificial intelligence algorithms require rigorous ethical oversight when deployed in healthcare."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-27',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "She decided to enroll in an intensive language course before studying abroad in France."}',
  '{"expectedSentence": "She decided to enroll in an intensive language course before studying abroad in France."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-28',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "Financial analysts predicted a modest economic recovery following the quarterly market report."}',
  '{"expectedSentence": "Financial analysts predicted a modest economic recovery following the quarterly market report."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-29',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "Marine reserves provide critical sanctuaries where endangered species can replenish their numbers."}',
  '{"expectedSentence": "Marine reserves provide critical sanctuaries where endangered species can replenish their numbers."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-3',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "Many large university institutions are now starting to offer free online courses."}',
  '{"expectedSentence": "Many large university institutions are now starting to offer free online courses."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-30',
  'LISTEN_TYPE',
  'C1',
  '{"playsAllowed": 3, "audioSentence": "Cognitive psychologists investigated how bilingualism influences working memory in young adults."}',
  '{"expectedSentence": "Cognitive psychologists investigated how bilingualism influences working memory in young adults."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-4',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "Cultural globalization refers to the transmission of ideas, meanings, and values around the world."}',
  '{"expectedSentence": "Cultural globalization refers to the transmission of ideas, meanings, and values around the world."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-5',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "Developments in technology and transportation infrastructure have made tourism more affordable."}',
  '{"expectedSentence": "Developments in technology and transportation infrastructure have made tourism more affordable."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-6',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "The internet has been instrumental in connecting people across geographical borders."}',
  '{"expectedSentence": "The internet has been instrumental in connecting people across geographical borders."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-7',
  'LISTEN_TYPE',
  'B2',
  '{"playsAllowed": 3, "audioSentence": "One reason you might consider studying abroad is for the chance to experience different styles of education."}',
  '{"expectedSentence": "One reason you might consider studying abroad is for the chance to experience different styles of education."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-8',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "I would have bought you a present if I had known it was your birthday."}',
  '{"expectedSentence": "I would have bought you a present if I had known it was your birthday."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-9',
  'LISTEN_TYPE',
  'B1',
  '{"playsAllowed": 3, "audioSentence": "Many people believe that schools should concentrate more on the child and less on the exam."}',
  '{"expectedSentence": "Many people believe that schools should concentrate more on the child and less on the exam."}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-100',
  'READ_SELECT',
  'C1',
  '{"word": "equilibrium"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-101',
  'READ_SELECT',
  'B2',
  '{"word": "lucid"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-102',
  'READ_SELECT',
  'B1',
  '{"word": "vulnerable"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-103',
  'READ_SELECT',
  'B2',
  '{"word": "spontaneous"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-104',
  'READ_SELECT',
  'C1',
  '{"word": "paramount"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-105',
  'READ_SELECT',
  'B2',
  '{"word": "concur"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-106',
  'READ_SELECT',
  'B1',
  '{"word": "diminish"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-107',
  'READ_SELECT',
  'B2',
  '{"word": "rigorous"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-108',
  'READ_SELECT',
  'B2',
  '{"word": "comprehendive"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-109',
  'READ_SELECT',
  'B1',
  '{"word": "unclariable"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-110',
  'READ_SELECT',
  'B2',
  '{"word": "prospectate"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-111',
  'READ_SELECT',
  'C1',
  '{"word": "subvertionary"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-112',
  'READ_SELECT',
  'C1',
  '{"word": "impenetrabilityness"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-113',
  'READ_SELECT',
  'B2',
  '{"word": "disruptivement"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-114',
  'READ_SELECT',
  'C1',
  '{"word": "transcendably"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-115',
  'READ_SELECT',
  'C1',
  '{"word": "equilibrateous"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-116',
  'READ_SELECT',
  'B2',
  '{"word": "reversitivity"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-117',
  'READ_SELECT',
  'B2',
  '{"word": "hypothetize"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-118',
  'READ_SELECT',
  'B2',
  '{"word": "intercedement"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-119',
  'READ_SELECT',
  'B1',
  '{"word": "conclusible"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-120',
  'READ_SELECT',
  'B2',
  '{"word": "unplausible"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-121',
  'READ_SELECT',
  'B2',
  '{"word": "magnitudic"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-122',
  'READ_SELECT',
  'C1',
  '{"word": "cogniscently"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-88',
  'READ_SELECT',
  'C1',
  '{"word": "ubiquitous"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-89',
  'READ_SELECT',
  'B2',
  '{"word": "scrutinize"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-90',
  'READ_SELECT',
  'B1',
  '{"word": "preliminary"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-91',
  'READ_SELECT',
  'B2',
  '{"word": "resilient"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-92',
  'READ_SELECT',
  'B2',
  '{"word": "mitigate"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-93',
  'READ_SELECT',
  'B2',
  '{"word": "plausible"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-94',
  'READ_SELECT',
  'C1',
  '{"word": "discrepancy"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-95',
  'READ_SELECT',
  'B2',
  '{"word": "comprehensive"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-96',
  'READ_SELECT',
  'C1',
  '{"word": "arbitrary"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-97',
  'READ_SELECT',
  'C1',
  '{"word": "ambivalent"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-98',
  'READ_SELECT',
  'B2',
  '{"word": "pragmatic"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-99',
  'READ_SELECT',
  'B2',
  '{"word": "deteriorate"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-1',
  'READ_SELECT',
  'B2',
  '{"word": "ambiguous"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-10',
  'READ_SELECT',
  'B2',
  '{"word": "predominant"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-11',
  'READ_SELECT',
  'B2',
  '{"word": "qualitative"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-12',
  'READ_SELECT',
  'B1',
  '{"word": "reinforce"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-13',
  'READ_SELECT',
  'B2',
  '{"word": "subsequent"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-14',
  'READ_SELECT',
  'B1',
  '{"word": "sustain"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-15',
  'READ_SELECT',
  'B1',
  '{"word": "widespread"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-16',
  'READ_SELECT',
  'B2',
  '{"word": "deteriorate"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-17',
  'READ_SELECT',
  'B2',
  '{"word": "comprehensive"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-18',
  'READ_SELECT',
  'B2',
  '{"word": "counterpart"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-19',
  'READ_SELECT',
  'B2',
  '{"word": "preliminary"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-2',
  'READ_SELECT',
  'B1',
  '{"word": "coherent"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-20',
  'READ_SELECT',
  'C1',
  '{"word": "accord"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-21',
  'READ_SELECT',
  'B2',
  '{"word": "adverse"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-22',
  'READ_SELECT',
  'C1',
  '{"word": "albeit"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-23',
  'READ_SELECT',
  'B2',
  '{"word": "allocation"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-24',
  'READ_SELECT',
  'B1',
  '{"word": "anonymous"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-25',
  'READ_SELECT',
  'B2',
  '{"word": "assert"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-26',
  'READ_SELECT',
  'B2',
  '{"word": "bias"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-27',
  'READ_SELECT',
  'B2',
  '{"word": "conspiracy"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-28',
  'READ_SELECT',
  'B2',
  '{"word": "convey"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-29',
  'READ_SELECT',
  'B2',
  '{"word": "denial"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-3',
  'READ_SELECT',
  'B2',
  '{"word": "consequent"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-30',
  'READ_SELECT',
  'B2',
  '{"word": "dismissal"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-31',
  'READ_SELECT',
  'C1',
  '{"word": "eccentric"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-32',
  'READ_SELECT',
  'C1',
  '{"word": "formidable"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-33',
  'READ_SELECT',
  'B2',
  '{"word": "hazard"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-34',
  'READ_SELECT',
  'B1',
  '{"word": "injustice"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-35',
  'READ_SELECT',
  'C1',
  '{"word": "invoke"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-36',
  'READ_SELECT',
  'B2',
  '{"word": "interim"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-37',
  'READ_SELECT',
  'C1',
  '{"word": "paramount"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-38',
  'READ_SELECT',
  'B2',
  '{"word": "rigorous"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-39',
  'READ_SELECT',
  'B2',
  '{"word": "specimen"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-4',
  'READ_SELECT',
  'C1',
  '{"word": "empirical"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-40',
  'READ_SELECT',
  'C1',
  '{"word": "substantiate"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-41',
  'READ_SELECT',
  'C1',
  '{"word": "unprecedented"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-42',
  'READ_SELECT',
  'C1',
  '{"word": "discrepancy"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-43',
  'READ_SELECT',
  'B2',
  '{"word": "plausible"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-44',
  'READ_SELECT',
  'B1',
  '{"word": "reluctant"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-45',
  'READ_SELECT',
  'B2',
  '{"word": "stance"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-46',
  'READ_SELECT',
  'B1',
  '{"word": "quarrel"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-47',
  'READ_SELECT',
  'B2',
  '{"word": "pertain"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-48',
  'READ_SELECT',
  'B1',
  '{"word": "maximize"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-49',
  'READ_SELECT',
  'B2',
  '{"word": "potent"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-5',
  'READ_SELECT',
  'B2',
  '{"word": "facilitate"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-50',
  'READ_SELECT',
  'B2',
  '{"word": "rigid"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-51',
  'READ_SELECT',
  'B2',
  '{"word": "aduse"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-52',
  'READ_SELECT',
  'B1',
  '{"word": "ammock"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-53',
  'READ_SELECT',
  'B2',
  '{"word": "perfolds"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-54',
  'READ_SELECT',
  'C1',
  '{"word": "perium"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-55',
  'READ_SELECT',
  'B2',
  '{"word": "persenet"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-56',
  'READ_SELECT',
  'B1',
  '{"word": "tapity"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-57',
  'READ_SELECT',
  'B2',
  '{"word": "tessity"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-58',
  'READ_SELECT',
  'B2',
  '{"word": "unlial"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-59',
  'READ_SELECT',
  'C1',
  '{"word": "urbact"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-6',
  'READ_SELECT',
  'B2',
  '{"word": "fluctuate"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-60',
  'READ_SELECT',
  'B1',
  '{"word": "bresk"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-61',
  'READ_SELECT',
  'B2',
  '{"word": "cappose"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-62',
  'READ_SELECT',
  'C1',
  '{"word": "obstial"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-63',
  'READ_SELECT',
  'B1',
  '{"word": "sheck"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-64',
  'READ_SELECT',
  'B2',
  '{"word": "serfack"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-65',
  'READ_SELECT',
  'B2',
  '{"word": "depact"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-66',
  'READ_SELECT',
  'C1',
  '{"word": "agalition"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-67',
  'READ_SELECT',
  'B1',
  '{"word": "swind"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-68',
  'READ_SELECT',
  'B2',
  '{"word": "crove"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-69',
  'READ_SELECT',
  'B2',
  '{"word": "implow"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-7',
  'READ_SELECT',
  'C1',
  '{"word": "infrastructure"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-70',
  'READ_SELECT',
  'C1',
  '{"word": "errical"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-71',
  'READ_SELECT',
  'B1',
  '{"word": "sidedown"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-72',
  'READ_SELECT',
  'B1',
  '{"word": "floop"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-73',
  'READ_SELECT',
  'B2',
  '{"word": "satics"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-74',
  'READ_SELECT',
  'B1',
  '{"word": "blick"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-75',
  'READ_SELECT',
  'B1',
  '{"word": "edual"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-76',
  'READ_SELECT',
  'C1',
  '{"word": "dehumanics"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-77',
  'READ_SELECT',
  'B2',
  '{"word": "counterbrain"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-78',
  'READ_SELECT',
  'B2',
  '{"word": "sploration"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-79',
  'READ_SELECT',
  'B1',
  '{"word": "conseptual"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-8',
  'READ_SELECT',
  'C1',
  '{"word": "intrinsic"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-80',
  'READ_SELECT',
  'B1',
  '{"word": "flunder"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-81',
  'READ_SELECT',
  'B2',
  '{"word": "gration"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-82',
  'READ_SELECT',
  'C1',
  '{"word": "intransient"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-83',
  'READ_SELECT',
  'B2',
  '{"word": "misguidement"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-84',
  'READ_SELECT',
  'B1',
  '{"word": "probalistic"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-85',
  'READ_SELECT',
  'B1',
  '{"word": "reversable"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-86',
  'READ_SELECT',
  'C1',
  '{"word": "substantivement"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-87',
  'READ_SELECT',
  'B2',
  '{"word": "unpredictance"}',
  '{"isReal": false}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'rs-9',
  'READ_SELECT',
  'C1',
  '{"word": "paradigm"}',
  '{"isReal": true}',
  5,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-1',
  'WRITE_PHOTO',
  'B2',
  '{"altText": "A scientist in a white laboratory coat carefully examining a test tube in an analytical chemistry facility", "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"}',
  '{"rubric": "grammar_vocabulary_structure"}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-2',
  'WRITE_PHOTO',
  'B1',
  '{"altText": "A diverse group of university students collaborating around a wooden table with laptops in a brightly lit library", "imageUrl": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"}',
  '{"rubric": "grammar_vocabulary_structure"}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-3',
  'WRITE_PHOTO',
  'B2',
  '{"altText": "A civil engineer wearing a protective hard hat surveying blueprints against a backdrop of construction cranes", "imageUrl": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"}',
  '{"rubric": "grammar_vocabulary_structure"}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-4',
  'WRITE_PHOTO',
  'B2',
  '{"altText": "A corporate professional delivering an interactive presentation in a conference hall with digital charts", "imageUrl": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"}',
  '{"rubric": "grammar_vocabulary_structure"}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-5',
  'WRITE_PHOTO',
  'B2',
  '{"altText": "Two software developers discussing code logic displayed on dual desktop monitors in a modern open-plan office", "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"}',
  '{"rubric": "grammar_vocabulary_structure"}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-6',
  'WRITE_PHOTO',
  'C1',
  '{"altText": "A medical researcher adjusting optical lenses on a high-precision laboratory microscope", "imageUrl": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80"}',
  '{"rubric": "grammar_vocabulary_structure"}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-7',
  'WRITE_PHOTO',
  'B2',
  '{"altText": "A healthcare physician in scrubs consulting a digital tablet with patient medical imaging scans", "imageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80", "minWords": 20}',
  '{"expectedKeywords": ["photo", "image"]}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-8',
  'WRITE_PHOTO',
  'B1',
  '{"altText": "A classroom teacher assisting young students engaged in hands-on science activities at round desks", "imageUrl": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", "minWords": 20}',
  '{"expectedKeywords": ["photo", "image"]}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-9',
  'WRITE_PHOTO',
  'B2',
  '{"altText": "Modern corporate professionals collaborating in an open-plan glass-walled meeting space with digital whiteboard", "imageUrl": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80", "minWords": 20}',
  '{"expectedKeywords": ["photo", "image"]}',
  60,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ws-1',
  'WRITING_SAMPLE',
  'B2',
  '{"prompt": "Many countries are investing heavily in public transportation systems rather than building new highways. Discuss the environmental and economic advantages of this policy. Provide reasons and examples from your knowledge or experience. (Aim for 100+ words)."}',
  '{"rubric": "academic_argumentation_min100"}',
  300,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ws-2',
  'WRITING_SAMPLE',
  'B2',
  '{"prompt": "In general, people are living significantly longer today than in previous generations. Discuss some of the social and economic implications of this phenomenon. (Aim for 100+ words)."}',
  '{"rubric": "academic_argumentation_min100"}',
  300,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ws-3',
  'WRITING_SAMPLE',
  'C1',
  '{"prompt": "Some educators advocate that all secondary school students should be required to study philosophy and critical thinking. Others contend that vocational and technical subjects should take precedence. Which viewpoint do you support, and why? (Aim for 100+ words)."}',
  '{"rubric": "academic_argumentation_min100"}',
  300,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ws-4',
  'WRITING_SAMPLE',
  'C1',
  '{"prompt": "Do you believe artificial intelligence tools in universities empower students to conduct higher quality academic research, or do they weaken foundational critical thinking skills? Support your opinion with concrete examples. (Aim for 100+ words)."}',
  '{"rubric": "academic_argumentation_min100"}',
  300,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ws-5',
  'WRITING_SAMPLE',
  'C1',
  '{"prompt": "With globalization and modern telecommunications, some sociologists predict regional dialects and minority languages will vanish within a century. Do you view this cultural homogenization as an inevitable cost of global progress, or should governments invest actively in language preservation? Give detailed reasons. (Aim for 100+ words).", "minWords": 100}',
  '{"minWords": 100}',
  300,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  difficulty_band = EXCLUDED.difficulty_band,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = TRUE;
