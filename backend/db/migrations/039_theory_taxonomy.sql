-- Move the theory catalogue from the retired 16-row model to the current
-- 13 graded DET task types plus two non-trackable orientation guides.
--
-- This migration is intentionally self-sufficient: a deployment that runs
-- init.sql + migrations without the content seed still gets all 15 rows.
-- Progress is mapped before the retired rows are removed:
--   listen-and-select -> fill-in-the-blanks
--   read-aloud        -> read-then-speak
--   read-listen-speak -> read-then-speak + interactive-speaking

ALTER TABLE theory_lessons
    ADD COLUMN IF NOT EXISTS is_trackable BOOLEAN NOT NULL DEFAULT TRUE;

-- Preserve completed progress from retired task lessons.
INSERT INTO theory_progress (user_id, lesson_slug, is_completed, updated_at)
SELECT user_id, 'fill-in-the-blanks', TRUE, NOW()
FROM theory_progress
WHERE lesson_slug = 'listen-and-select' AND is_completed
ON CONFLICT (user_id, lesson_slug) DO UPDATE
SET is_completed = TRUE, updated_at = NOW();

INSERT INTO theory_progress (user_id, lesson_slug, is_completed, updated_at)
SELECT user_id, 'read-then-speak', TRUE, NOW()
FROM theory_progress
WHERE lesson_slug = 'read-aloud' AND is_completed
ON CONFLICT (user_id, lesson_slug) DO UPDATE
SET is_completed = TRUE, updated_at = NOW();

INSERT INTO theory_progress (user_id, lesson_slug, is_completed, updated_at)
SELECT user_id, 'read-then-speak', TRUE, NOW()
FROM theory_progress
WHERE lesson_slug = 'read-listen-speak' AND is_completed
ON CONFLICT (user_id, lesson_slug) DO UPDATE
SET is_completed = TRUE, updated_at = NOW();

INSERT INTO theory_progress (user_id, lesson_slug, is_completed, updated_at)
SELECT user_id, 'interactive-speaking', TRUE, NOW()
FROM theory_progress
WHERE lesson_slug = 'read-listen-speak' AND is_completed
ON CONFLICT (user_id, lesson_slug) DO UPDATE
SET is_completed = TRUE, updated_at = NOW();

DELETE FROM theory_progress
WHERE lesson_slug IN ('listen-and-select', 'read-aloud', 'read-listen-speak');

DELETE FROM theory_lessons
WHERE slug IN ('listen-and-select', 'read-aloud', 'read-listen-speak');

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'read-and-select',
  1,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'fill-in-the-blanks',
  2,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'read-and-complete',
  3,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'listen-and-type',
  4,
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
  '[{"question":"Прослушайте предложение и запишите его в точности, включая пунктуацию.","audioPrompt":"The administrative department will publish the schedule tomorrow morning.","modelAnswer":"The administrative department will publish the schedule tomorrow morning.","comment":"Заглавная буква T, слово department написано без опечаток, в конце стоит точка."}]'::jsonb,
  '["Использование всех трех прослушиваний подряд в начале задания.","Пропуск точки или вопросительного знака в конце строки.","Запись чисел цифрами вместо слов."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'interactive-reading',
  5,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'interactive-listening',
  6,
  'interactive-listening',
  'Interactive Listening: диалог, ответы и резюме',
  'Interactive Listening: Conversation & Summary',
  'interactive',
  'Интерактивный блок',
  'Interactive Listening',
  'Два академических диалога. В каждом: аудиосценарий, 3–4 задания Listen and Complete, 5–6 заданий Listen and Respond и 75-секундное резюме. На первую часть отводится 6:30; сценарий можно переслушивать.',
  'Listening, Comprehension, Conversation. Резюме дополнительно оценивается как письменная продукция: полнота фактов, связность и грамматика.',
  '6:30 на диалог + 75 секунд на резюме; 2 диалога',
  '["Аудиосценарий можно переслушивать; реплики Listen and Respond звучат только один раз.","Listen and Complete: 3–4 пропуска. Можно перефразировать ответ, если смысл сохранен.","Listen and Respond: выберите лучший ответ. После ответа показывается правильный вариант, поэтому следующий вопрос можно исправить.","Резюме: 75 секунд, 3 связных предложения. Укажите повод разговора, решение и следующий шаг."]'::jsonb,
  '["Сначала прослушайте сценарий целиком: зафиксируйте участников, проблему и цель разговора.","В Listen and Complete отвечайте по смыслу, не копируйте услышанное дословно.","В Listen and Respond следите за отношениями говорящих и целью беседы.","Перед резюме мысленно соберите три пункта и используйте past tense с косвенной речью."]'::jsonb,
  'Трехчастная схема резюме диалога:
1. Причина обращения: I met with my instructor to discuss...
2. Разъяснение преподавателя: The professor explained that... and advised me to...
3. Итоговая договоренность: In response, I agreed to submit the revised draft by...',
  '[{"question":"Тема беседы: перенос дедлайна эссе из-за технического сбоя в лаборатории.","modelAnswer":"I spoke with my biology professor regarding a brief extension for my laboratory assignment due to equipment maintenance. The instructor agreed to grant an additional forty-eight hours to finalize the data interpretation. Consequently, I committed to submitting the complete report before Friday afternoon.","comment":"Объем 45 слов, логично отражены цель встречи, решение преподавателя и срок сдачи."}]'::jsonb,
  '["Ответ одним коротким предложением вместо связного резюме.","Использование прямой речи в кавычках вместо косвенной речи.","Пропуск финального соглашения о сроке или следующем шаге."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'write-about-photo',
  7,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'interactive-writing',
  8,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'speak-about-photo',
  9,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'read-then-speak',
  10,
  'read-then-speak',
  'Read, Then Speak: развернутый устный ответ',
  'Read, Then Speak: Extended Spoken Response',
  'speaking',
  'Говорение',
  'Speaking',
  'Письменный промпт на экране. 20 секунд на чтение и планирование, затем 90 секунд записи ответа. Вопрос остается видимым во время ответа.',
  'Speaking, Conversation, Production. Оценивается полнота ответа на все пункты промпта, связность, диапазон лексики и грамматики, беглость.',
  '20 секунд подготовка, 90 секунд ответ',
  '["Промпт содержит основную тему и несколько наводящих вопросов. Ответьте на каждый пункт, а не только на первый.","Во время записи вопрос остается на экране: используйте его как план ответа.","Соблюдайте время вопроса: past tenses для личного опыта, would для гипотетических ситуаций, present perfect для опыта к настоящему моменту.","Не читайте заученный текст: оценивается спонтанная связная речь, а не скорость воспроизведения шаблона."]'::jsonb,
  '["0–20 секунд: выделите 2–3 подпункта и короткий тезис для каждого.","0–30 секунд ответа: дайте прямой ответ на первый пункт и назовите причину.","30–60 секунд: приведите конкретный пример или короткую историю.","60–90 секунд: раскройте второй пункт, ответьте на оставшийся вопрос и сформулируйте вывод."]'::jsonb,
  'Тезис → причина → пример → вывод. На каждый подпункт промпта: одно прямое предложение, одно пояснение, один пример.',
  '[{"question":"Describe a difficult decision you had to make in your studies. What was the situation? Why was the decision difficult? What was the outcome?","modelAnswer":"A challenging decision I faced during my studies involved choosing between an intensive chemistry course and an environmental science seminar. The choice was difficult because I enjoyed laboratory work, yet the environmental syllabus aligned more closely with my career goals in sustainability. After discussing the options with my academic advisor, I decided to register for the environmental seminar. In retrospect, that choice proved beneficial because it provided practical project experience that later helped me secure a research internship.","comment":"Ответ охватывает все три пункта промпта за 75 секунд и последовательно использует прошедшее время."}]'::jsonb,
  '["Подробный ответ только на первый вопрос и нехватка времени на остальные.","Переход на настоящее время при описании прошлых событий.","Повтор одного связующего слова вместо разнообразных союзов и вводных конструкций."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'interactive-speaking',
  11,
  'interactive-speaking',
  'Interactive Speaking: адаптивный диалог',
  'Interactive Speaking: Adaptive Conversation',
  'speaking',
  'Говорение',
  'Speaking',
  'Симулированный диалог с анимированным персонажем. 6–8 вопросов по двум темам, 3–4 вопроса на тему. 35 секунд на ответ, без времени на подготовку. Вопрос звучит один раз, следующий зависит от предыдущего ответа.',
  'Speaking и общий балл. Оценивается релевантность ответа, развитие темы, связность, беглость, произношение и способность поддерживать разговор.',
  '6–8 вопросов × 35 секунд; 3:30–4:40',
  '["Вопрос звучит только один раз; повтора нет.","На каждый ответ дается до 35 секунд. Говорите естественно и строго по теме вопроса.","Follow-up зависит от того, что вы сказали: развивайте мысль, а не повторяйте заученный шаблон.","В диалоге две темы. Следите за сменой темы и не смешивайте ответы из предыдущей части."]'::jsonb,
  '["O — Opinion: дайте прямой ответ в первом предложении.","R — Reason: назовите одну конкретную причину.","E — Example: добавьте короткий личный пример.","O — Outcome: сформулируйте вывод или мостик к следующему вопросу.","Если вопрос не расслышан, переспросите одной короткой фразой и ответьте по ключевым словам."]'::jsonb,
  'Opinion → Reason → Example → Outcome. В 35 секундах достаточно двух-трех предложений с одной ясной мыслью.',
  '[{"question":"Do you think technology makes it easier or harder to concentrate?","modelAnswer":"I think technology makes concentration harder for most students because every notification competes for attention. For example, when I study, I often check my phone after a message even if the task is not urgent. As a result, I now keep my phone in another room during deep work, which helps me stay focused for longer.","comment":"Ответ дает позицию, причину, личный пример и практический вывод в рамках 35 секунд."}]'::jsonb,
  '["Ответ не по теме вопроса или уход в заученный монолог.","Слишком длинная пауза в начале ответа: времени на подготовку нет.","Попытка ответить на все возможные follow-up сразу вместо одного ясного ответа."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'writing-sample',
  12,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'speaking-sample',
  13,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'rules-and-technicalities',
  14,
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
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  'subscores-and-cat-engine',
  15,
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
• Literacy (чтение и письмо): Read and Select, Read and Complete, Interactive Reading, Write About the Photo, Interactive Writing, Writing Sample.
• Comprehension (чтение и аудирование): Read and Select, Fill in the Blanks, Read and Complete, Listen and Type, Interactive Reading, Interactive Listening.
• Conversation (аудирование и говорение): Listen and Type, Interactive Listening, Read Then Speak, Interactive Speaking, Speak About the Photo, Speaking Sample.
• Production (письмо и говорение): Write About the Photo, Interactive Writing, Writing Sample, Speak About the Photo, Read Then Speak, Interactive Speaking, Speaking Sample.',
  '[{"question":"Кандидат написал грамматически корректные, но предельно короткие предложения в эссе (по 4–5 слов).","modelAnswer":"Оценка за Production окажется низкой из-за ограниченного лексического разнообразия.","comment":"Для высокого балла требуются сложные синтаксические конструкции и развитый академический словарь."}]'::jsonb,
  '["Невнимательность на простых заданиях в начале теста.","Использование однотипных конструкций на протяжении всего ответа."]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  number = EXCLUDED.number,
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  category_label_ru = EXCLUDED.category_label_ru,
  category_label_en = EXCLUDED.category_label_en,
  format = EXCLUDED.format,
  scoring = EXCLUDED.scoring,
  time_limit = EXCLUDED.time_limit,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  formula = EXCLUDED.formula,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;

-- Official task order: 1-13 are graded tasks, 14-15 are reference guides.
UPDATE theory_lessons SET number = 1  WHERE slug = 'read-and-select';
UPDATE theory_lessons SET number = 2  WHERE slug = 'fill-in-the-blanks';
UPDATE theory_lessons SET number = 3  WHERE slug = 'read-and-complete';
UPDATE theory_lessons SET number = 4  WHERE slug = 'listen-and-type';
UPDATE theory_lessons SET number = 5  WHERE slug = 'interactive-reading';
UPDATE theory_lessons SET number = 6  WHERE slug = 'interactive-listening';
UPDATE theory_lessons SET number = 7  WHERE slug = 'write-about-photo';
UPDATE theory_lessons SET number = 8  WHERE slug = 'interactive-writing';
UPDATE theory_lessons SET number = 9  WHERE slug = 'speak-about-photo';
UPDATE theory_lessons SET number = 10 WHERE slug = 'read-then-speak';
UPDATE theory_lessons SET number = 11 WHERE slug = 'interactive-speaking';
UPDATE theory_lessons SET number = 12 WHERE slug = 'writing-sample';
UPDATE theory_lessons SET number = 13 WHERE slug = 'speaking-sample';
UPDATE theory_lessons SET number = 14 WHERE slug = 'rules-and-technicalities';
UPDATE theory_lessons SET number = 15 WHERE slug = 'subscores-and-cat-engine';

UPDATE theory_lessons SET is_trackable = TRUE
WHERE slug IN (
  'read-and-select', 'fill-in-the-blanks', 'read-and-complete',
  'listen-and-type', 'interactive-reading', 'interactive-listening',
  'write-about-photo', 'interactive-writing', 'speak-about-photo',
  'read-then-speak', 'interactive-speaking', 'writing-sample',
  'speaking-sample'
);
UPDATE theory_lessons SET is_trackable = FALSE
WHERE slug IN ('rules-and-technicalities', 'subscores-and-cat-engine');
UPDATE theory_lessons SET version = '2026.3';
