import { lessonsData } from '../src/data/theoryContent';
import { 
  readSelectBank, 
  fillBlanksBank, 
  cTestBank, 
  listenTypeBank, 
  interactiveReadingBank, 
  interactiveListeningBank, 
  writePhotoBank, 
  interactiveWritingBank,
  writingSampleBank 
} from '../src/data/questionBank';
import * as fs from 'fs';

function escapeSql(str: string): string {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

function jsonSql(obj: unknown): string {
  return escapeSql(JSON.stringify(obj || []));
}

let sql = `-- Directus Collections Registration and Public Read Permissions
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
`;

for (const lesson of lessonsData) {
  sql += `INSERT INTO theory_lessons (id, number, slug, title_ru, title_en, category, category_label_ru, category_label_en, format, scoring, time_limit, rules, strategy_steps, formula, examples, pitfalls)
VALUES (
  ${escapeSql(lesson.slug)},
  ${lesson.number},
  ${escapeSql(lesson.slug)},
  ${escapeSql(lesson.titleRu)},
  ${escapeSql(lesson.titleEn)},
  ${escapeSql(lesson.category)},
  ${escapeSql(lesson.categoryLabelRu)},
  ${escapeSql(lesson.categoryLabelEn)},
  ${escapeSql(lesson.format)},
  ${escapeSql(lesson.scoring)},
  ${escapeSql(lesson.timeLimit)},
  ${jsonSql(lesson.rules)}::jsonb,
  ${jsonSql(lesson.strategySteps)}::jsonb,
  ${escapeSql(lesson.formula || '')},
  ${jsonSql(lesson.examples)}::jsonb,
  ${jsonSql(lesson.pitfalls)}::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  rules = EXCLUDED.rules,
  strategy_steps = EXCLUDED.strategy_steps,
  examples = EXCLUDED.examples,
  pitfalls = EXCLUDED.pitfalls;
`;
}

sql += `\n-- Seed Questions Bank\n`;

// 1. Read & Select
readSelectBank.forEach((word, idx) => {
  const qId = `read-select-${idx + 1}`;
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(qId)},
  'READ_SELECT',
  ${escapeSql(word.difficulty)},
  ${jsonSql({ word: word.word })},
  ${jsonSql({ isReal: word.isReal })},
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 2. Fill Blanks
fillBlanksBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'FILL_BLANKS',
  ${escapeSql(q.difficulty)},
  ${jsonSql({
    sentenceBefore: q.sentenceBefore,
    givenPrefix: q.givenPrefix,
    sentenceAfter: q.sentenceAfter,
    fullWord: q.fullWord,
    totalLength: q.givenPrefix.length + q.missingLetters.length
  })},
  ${jsonSql({ missingLetters: q.missingLetters, fullWord: q.fullWord })},
  20,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 3. C-Test
cTestBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'C_TEST',
  ${escapeSql(q.difficulty)},
  ${jsonSql({
    title: q.title,
    firstSentence: q.firstSentence,
    damagedTokens: q.damagedTokens.map((t) => ({ prefix: t.prefix, missingLength: t.missing.length, suffix: t.suffix })),
    lastSentence: q.lastSentence
  })},
  ${jsonSql({ answers: q.damagedTokens.map((t) => t.missing) })},
  180,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 4. Listen & Type
listenTypeBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'LISTEN_TYPE',
  ${escapeSql(q.difficulty)},
  ${jsonSql({ audioSentence: q.audioSentence, playsAllowed: 3 })},
  ${jsonSql({ expectedSentence: q.audioSentence })},
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 5. Interactive Reading
interactiveReadingBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'INTERACTIVE_READING',
  ${escapeSql(q.difficulty)},
  ${jsonSql({
    passageTitle: q.passageTitle,
    passageText: q.passageText,
    gapSentence: q.gapSentence,
    sentenceOptions: q.sentenceOptions.options,
    highlightPrompt: q.highlightPrompt,
    mainIdeaQuestion: q.mainIdeaQuestion,
    titleQuestion: q.titleQuestion
  })},
  ${jsonSql({
    gapCorrect: q.gapSentence.correct,
    sentenceCorrectIndex: q.sentenceOptions.correctIndex,
    highlightCorrectSubstring: q.highlightCorrectSubstring,
    mainIdeaCorrectIndex: q.mainIdeaQuestion.correctIndex,
    titleCorrectIndex: q.titleQuestion.correctIndex
  })},
  420,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 6. Interactive Listening
interactiveListeningBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'INTERACTIVE_LISTENING',
  ${escapeSql(q.difficulty)},
  ${jsonSql({
    scenario: q.scenario,
    turns: q.turns,
    summaryPrompt: q.summaryPrompt
  })},
  ${jsonSql({
    turnsAnswers: q.turns.map((t) => t.correctIndex)
  })},
  360,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 7. Write Photo
writePhotoBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'WRITE_PHOTO',
  ${escapeSql(q.difficulty)},
  ${jsonSql({
    imageUrl: q.imageUrl,
    altText: q.altText,
    minWords: 20
  })},
  ${jsonSql({ expectedKeywords: ['photo', 'image'] })},
  60,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 8. Interactive Writing
interactiveWritingBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'INTERACTIVE_WRITING',
  ${escapeSql(q.difficulty)},
  ${jsonSql({
    part1Prompt: q.part1Prompt,
    part2Prompt: q.part2Prompt,
    minWords: 50
  })},
  ${jsonSql({ minWordsPart1: 50, minWordsPart2: 40 })},
  480,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

// 9. Writing Sample
writingSampleBank.forEach((q) => {
  sql += `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${escapeSql(q.id)},
  'WRITING_SAMPLE',
  ${escapeSql(q.difficulty)},
  ${jsonSql({
    prompt: q.prompt,
    minWords: 100
  })},
  ${jsonSql({ minWords: 100 })},
  300,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
});

fs.writeFileSync('backend/db/03-content-seed.sql', sql);
console.log('Successfully generated backend/db/03-content-seed.sql');
