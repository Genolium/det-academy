-- Move the theory catalogue from the retired 16-row model to the current
-- 13 graded DET task types plus two non-trackable orientation guides.
--
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
  pitfalls = EXCLUDED.pitfalls,
  is_trackable = TRUE,
  version = '2026.3',
  updated_at = NOW();

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
  pitfalls = EXCLUDED.pitfalls,
  is_trackable = TRUE,
  version = '2026.3',
  updated_at = NOW();

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
  pitfalls = EXCLUDED.pitfalls,
  is_trackable = TRUE,
  version = '2026.3',
  updated_at = NOW();

-- Keep the orientation guide in sync with the current task list.
UPDATE theory_lessons
SET formula = 'Распределение навыков по сабскорам:
• Literacy (чтение и письмо): Read and Select, Read and Complete, Interactive Reading, Write About the Photo, Interactive Writing, Writing Sample.
• Comprehension (чтение и аудирование): Read and Select, Fill in the Blanks, Read and Complete, Listen and Type, Interactive Reading, Interactive Listening.
• Conversation (аудирование и говорение): Listen and Type, Interactive Listening, Read Then Speak, Interactive Speaking, Speak About the Photo, Speaking Sample.
• Production (письмо и говорение): Write About the Photo, Interactive Writing, Writing Sample, Speak About the Photo, Read Then Speak, Interactive Speaking, Speaking Sample.',
    version = '2026.3',
    updated_at = NOW()
WHERE slug = 'subscores-and-cat-engine';

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
