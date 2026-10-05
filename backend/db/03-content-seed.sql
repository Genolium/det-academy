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

-- Seed Questions Bank
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-1',
  'READ_SELECT',
  'B2',
  '{"word":"ambiguous"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-2',
  'READ_SELECT',
  'B1',
  '{"word":"coherent"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-3',
  'READ_SELECT',
  'B2',
  '{"word":"consequent"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-4',
  'READ_SELECT',
  'C1',
  '{"word":"empirical"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-5',
  'READ_SELECT',
  'B2',
  '{"word":"facilitate"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-6',
  'READ_SELECT',
  'B2',
  '{"word":"fluctuate"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-7',
  'READ_SELECT',
  'C1',
  '{"word":"infrastructure"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-8',
  'READ_SELECT',
  'C1',
  '{"word":"intrinsic"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-9',
  'READ_SELECT',
  'C1',
  '{"word":"paradigm"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-10',
  'READ_SELECT',
  'B2',
  '{"word":"predominant"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-11',
  'READ_SELECT',
  'B2',
  '{"word":"qualitative"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-12',
  'READ_SELECT',
  'B1',
  '{"word":"reinforce"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-13',
  'READ_SELECT',
  'B2',
  '{"word":"subsequent"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-14',
  'READ_SELECT',
  'B1',
  '{"word":"sustain"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-15',
  'READ_SELECT',
  'B1',
  '{"word":"widespread"}',
  '{"isReal":true}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-16',
  'READ_SELECT',
  'B1',
  '{"word":"disflown"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-17',
  'READ_SELECT',
  'B1',
  '{"word":"tweenful"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-18',
  'READ_SELECT',
  'B2',
  '{"word":"dramatical"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-19',
  'READ_SELECT',
  'B2',
  '{"word":"misclover"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-20',
  'READ_SELECT',
  'B2',
  '{"word":"overmound"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-21',
  'READ_SELECT',
  'C1',
  '{"word":"reprehendive"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-22',
  'READ_SELECT',
  'B1',
  '{"word":"unfluent"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-23',
  'READ_SELECT',
  'C1',
  '{"word":"constratious"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-24',
  'READ_SELECT',
  'C1',
  '{"word":"proflactive"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-25',
  'READ_SELECT',
  'B2',
  '{"word":"circumflect"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-26',
  'READ_SELECT',
  'C1',
  '{"word":"subvenient"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'read-select-27',
  'READ_SELECT',
  'B1',
  '{"word":"interclash"}',
  '{"isReal":false}',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-1',
  'FILL_BLANKS',
  'B2',
  '{"sentenceBefore":"The lead researcher ","givenPrefix":"con","sentenceAfter":" that previous hypotheses had overlooked critical environmental factors.","fullWord":"concluded","totalLength":9}',
  '{"missingLetters":"cluded","fullWord":"concluded"}',
  20,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-2',
  'FILL_BLANKS',
  'B1',
  '{"sentenceBefore":"Higher education institutions must ","givenPrefix":"ad","sentenceAfter":" to rapid technological changes in distance learning.","fullWord":"adapt","totalLength":5}',
  '{"missingLetters":"apt","fullWord":"adapt"}',
  20,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-3',
  'FILL_BLANKS',
  'C1',
  '{"sentenceBefore":"Economic instability can severely ","givenPrefix":"un","sentenceAfter":" social welfare programs in developing nations.","fullWord":"undermine","totalLength":9}',
  '{"missingLetters":"dermine","fullWord":"undermine"}',
  20,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'fb-4',
  'FILL_BLANKS',
  'B2',
  '{"sentenceBefore":"Students are encouraged to ","givenPrefix":"co","sentenceAfter":" on their final engineering capstone projects.","fullWord":"collaborate","totalLength":11}',
  '{"missingLetters":"llaborate","fullWord":"collaborate"}',
  20,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ct-1',
  'C_TEST',
  'B2',
  '{"title":"Renewable Energy Innovation","firstSentence":"Solar panels have transformed how communities produce clean energy worldwide.","damagedTokens":[{"prefix":"Rec","missingLength":3,"suffix":"advancements"},{"prefix":"in","missingLength":12},{"prefix":"cel","missingLength":2},{"prefix":"ha","missingLength":2},{"prefix":"dramati","missingLength":5},{"prefix":"low","missingLength":4},{"prefix":"manufac","missingLength":6},{"prefix":"co","missingLength":3}],"lastSentence":"Consequently, clean energy is now more affordable than traditional fossil fuels in many nations."}',
  '{"answers":["ent","photovoltaic","ls","ve","cally","ered","turing","sts"]}',
  180,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-1',
  'LISTEN_TYPE',
  'B2',
  '{"audioSentence":"The professor reminded the students about the upcoming deadline for the research proposal.","playsAllowed":3}',
  '{"expectedSentence":"The professor reminded the students about the upcoming deadline for the research proposal."}',
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-2',
  'LISTEN_TYPE',
  'B1',
  '{"audioSentence":"Global temperatures continue to rise despite international climate agreements.","playsAllowed":3}',
  '{"expectedSentence":"Global temperatures continue to rise despite international climate agreements."}',
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'lt-3',
  'LISTEN_TYPE',
  'C1',
  '{"audioSentence":"Careful linguistic analysis revealed significant differences between the two manuscripts.","playsAllowed":3}',
  '{"expectedSentence":"Careful linguistic analysis revealed significant differences between the two manuscripts."}',
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ir-1',
  'INTERACTIVE_READING',
  'B2',
  '{"passageTitle":"Coral Reef Ecosystems Under Thermal Stress","passageText":"Coral reefs are among the most biologically diverse ecosystems on the planet, often referred to as the rain forests of the sea. They provide critical habitats for a quarter of all marine life despite covering less than one percent of the ocean floor. Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching. Without these algae, the coral slowly starves and becomes vulnerable to disease.","gapSentence":{"before":"Marine biologists have observed that healthy reef ecosystems provide ","options":["protection","destruction","pollution","ignorance"],"correct":"protection","after":" for coastal shorelines against severe tropical storms."},"sentenceOptions":["Furthermore, widespread bleaching events have increased exponentially in frequency over the past three decades.","However, artificial fish tanks are rarely found near ocean trenches.","Therefore, many tourists prefer warm beaches during winter seasons.","Nevertheless, coal mining remains a traditional source of electrical power."],"highlightPrompt":"Click and highlight the exact sentence that identifies what happens to corals when sea temperatures rise.","mainIdeaQuestion":{"question":"What is the primary concern discussed in this passage?","options":["The economic cost of deep-sea fishing trawlers.","The devastating impact of rising ocean temperatures on coral reefs.","The history of marine exploration in the twentieth century.","The dietary habits of predatory tropical fish."],"correctIndex":1},"titleQuestion":{"question":"Which is the most suitable title for this text?","options":["The Plight of Fragile Coral Reefs","Deep Ocean Trench Exploration","Building Coastal Vacation Resorts","Algae Species in Fresh Water"],"correctIndex":0}}',
  '{"gapCorrect":"protection","sentenceCorrectIndex":0,"highlightCorrectSubstring":"Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching.","mainIdeaCorrectIndex":1,"titleCorrectIndex":0}',
  420,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'il-1',
  'INTERACTIVE_LISTENING',
  'B2',
  '{"scenario":"You are an undergraduate student meeting your biology professor during office hours to discuss an extension on your research assignment due to illness.","turns":[{"speaker":"Professor Hayes","speakerAudioText":"Come on in! How can I help you today with your final project?","options":["Hello Professor. I was sick with the flu this week and would like to request a brief extension.","I wanted to ask why the university cafeteria was closed today.","Yes, I brought my umbrella because it was raining heavily outside.","I do not really like reading textbooks in the evening."],"correctIndex":0},{"speaker":"Professor Hayes","speakerAudioText":"I am sorry to hear you were unwell. How many additional days do you realistically need?","options":["Three days would be sufficient for me to complete the bibliography and edit the final draft.","I think I will probably graduate in two years.","The weather was much better yesterday than today.","No, I did not receive any emails from other students."],"correctIndex":0},{"speaker":"Professor Hayes","speakerAudioText":"That seems fair. Please make sure to submit your health clinic slip to the departmental portal by Friday.","options":["Understood. I will upload the documentation immediately and submit the paper by Thursday night. Thank you!","I already had lunch, so I do not need anything else.","Where is the library located on campus?","Why do other classes have different exams?"],"correctIndex":0}],"summaryPrompt":"Write a 3-sentence summary of your conversation with the professor. Mention the reason for the visit, the agreement reached, and your next step."}',
  '{"turnsAnswers":[0,0,0]}',
  360,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-1',
  'WRITE_PHOTO',
  'B2',
  '{"imageUrl":"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80","altText":"Civil engineer with hard hat inspecting blueprint on construction site","minWords":20}',
  '{"expectedKeywords":["photo","image"]}',
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-2',
  'WRITE_PHOTO',
  'B1',
  '{"imageUrl":"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80","altText":"Group of diverse university students studying together in a modern library","minWords":20}',
  '{"expectedKeywords":["photo","image"]}',
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'wp-3',
  'WRITE_PHOTO',
  'B2',
  '{"imageUrl":"https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80","altText":"Scientist in laboratory examining test tubes under bright lighting","minWords":20}',
  '{"expectedKeywords":["photo","image"]}',
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'iw-1',
  'INTERACTIVE_WRITING',
  'B2',
  '{"part1Prompt":"Some people believe that university students should focus strictly on academic subjects related to their careers, while others argue they should take a broad range of general education courses. What is your opinion? Write at least 80 words.","part2Prompt":"Considering your answer above, how might employers view a candidate who took various interdisciplinary courses outside their primary major?","minWords":50}',
  '{"minWordsPart1":50,"minWordsPart2":40}',
  480,
  TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  'ws-1',
  'WRITING_SAMPLE',
  'B2',
  '{"prompt":"Many countries are investing heavily in public transportation systems rather than building new highways. Discuss the environmental and economic advantages of this policy. Provide reasons and examples from your knowledge or experience. (Aim for 100+ words).","minWords":100}',
  '{"minWords":100}',
  300,
  TRUE
) ON CONFLICT (id) DO NOTHING;
