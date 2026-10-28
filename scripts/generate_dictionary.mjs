#!/usr/bin/env node
/**
 * Builds the learner dictionary for the 1,393 course words and the B1 core.
 *
 *   node scripts/generate_dictionary.mjs --fetch   # ask the model, write JSON
 *   node scripts/generate_dictionary.mjs           # JSON -> SQL
 *   node scripts/generate_dictionary.mjs --check   # CI: validate JSON + SQL
 *
 * The fetched JSON is committed, so the SQL and the checks are deterministic
 * and never call the network. `--fetch` is the only mode that spends tokens.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { b1CoreWords } from './content/dictionary-b1.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const jsonPath = path.join(root, 'scripts/content/dictionary.generated.json');
const sqlPath = path.join(root, 'backend/db/10-dictionary.sql');
const snapshotPath = path.join(root, 'src/data/dictionary.generated.json');
const cacheDir = '/tmp/det-dict-cache';

const LEVELS = new Set(['A2', 'B1', 'B2', 'C1', 'C2']);
const POS = new Set(['noun', 'verb', 'adjective', 'adverb', 'conjunction', 'preposition', 'pronoun', 'determiner', 'interjection']);
const BATCH = 20;

// Headwords rejected during the 2026-10-28 human review. They are inflected
// forms whose lemma is already an entry (answered, cats, was), British
// spellings that duplicate the American entry (analyse, organise), or
// non-lemma forms replaced by a base word (amplest, practician). They remain
// in the theory corpus but must not be dictionary headwords.
const EXCLUDED = new Set([
  'answered', 'created', 'explained', 'waiting', 'watched', 'watches',
  'watching', 'running', 'assumes', 'analyse', 'organise', 'amplest',
  'smaller', 'uses', 'presents', 'vegetables', 'cats', 'elephants', 'men',
  'was', 'believes', 'buying', 'died', 'discovered', 'doing', 'gave', 'gets',
  'giving', 'jumps', 'kept', 'looks', 'puts', 'rained', 'reads', 'scored',
  'sees', 'taking', 'walks', 'wants', 'works', 'costs', 'returns', 'loved',
  'walking', 'washing', 'thinking', 'spending', 'dancing', 'practician',
  'contradictive',
]);

// British spellings in the source corpus point at the American headword that
// the dictionary actually publishes. This keeps the B1 core attribution when
// only one spelling can be an entry.
const SPELLING_ALIASES = new Map([
  ['analyse', 'Analyze'],
  ['organise', 'Organize'],
]);

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;
const sqlJSON = (value) => sqlString(JSON.stringify(value));

function readTheoryWords() {
  const source = fs.readFileSync(path.join(root, 'src/data/theoryVocabulary.ts'), 'utf8');
  const match = /export const theoryWords: string\[\] = (\[[\s\S]*?\]);/.exec(source);
  if (!match) throw new Error('theoryWords array not found');
  // The source document occasionally glues two words together ("inhabit
  // coldness"). Split those instead of asking the model for a phrase.
  return JSON.parse(match[1]).flatMap((word) =>
    String(word)
      .split(/\s+/)
      .map((item) => item.replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '').trim())
      .filter((item) => item.length > 1)
  );
}

function readAcademicWords() {
  const source = fs.readFileSync(path.join(root, 'backend/db/04-vocabulary-seed.sql'), 'utf8');
  return [...source.matchAll(/\('voc-\d+', '([^']+)'/g)].map((match) => match[1]);
}

function normalise(word) {
  return word.trim().toLowerCase();
}

function buildWordList() {
  const academic = new Set(readAcademicWords().map(normalise));
  const theory = readTheoryWords();
  const seen = new Set();
  const list = [];

  for (const word of [...b1CoreWords, ...theory]) {
    const isCore = b1CoreWords.includes(word);
    const canonical = SPELLING_ALIASES.get(normalise(word)) || word.trim();
    const key = normalise(canonical);
    if (!key || seen.has(key) || academic.has(key) || EXCLUDED.has(key)) continue;
    seen.add(key);
    list.push({ word: canonical, source: isCore ? 'DET B1 core (platform dataset)' : 'Course vocabulary (theory/HEDWIG-VOCABULARY.docx)' });
  }
  return list;
}

function batchKey(words) {
  return crypto.createHash('sha256').update(words.map(normalise).sort().join('|')).digest('hex').slice(0, 24);
}

function validateEntry(entry, expected) {
  const problems = [];
  const word = typeof entry.word === 'string' ? entry.word.trim() : '';
  if (normalise(word) !== normalise(expected)) problems.push('word mismatch');
  if (typeof entry.ipa !== 'string' || !entry.ipa.startsWith('/') || entry.ipa.length < 3) problems.push('ipa');
  if (!POS.has(entry.pos)) problems.push('pos');
  if (!LEVELS.has(entry.level)) problems.push('level');
  if (typeof entry.meaningRu !== 'string' || !/[А-Яа-яЁё]/.test(entry.meaningRu)) problems.push('meaningRu');
  if (typeof entry.meaningRu === 'string' && /[A-Za-z]/.test(entry.meaningRu)) problems.push('meaningRu latin');
  if (typeof entry.definitionEn !== 'string' || entry.definitionEn.length < 20) problems.push('definitionEn');
  if (typeof entry.example !== 'string' || entry.example.length < 15) problems.push('example');
  if (!Array.isArray(entry.collocations) || entry.collocations.length < 2 || entry.collocations.length > 4) problems.push('collocations');
  if (Array.isArray(entry.collocations)) {
    const collocations = entry.collocations.map((item) => String(item).toLowerCase());
    if (new Set(collocations).size !== collocations.length) problems.push('duplicate collocations');
  }
  const english = `${entry.definitionEn || ''} ${entry.example || ''} ${Array.isArray(entry.collocations) ? entry.collocations.join(' ') : ''}`;
  if (/[А-Яа-яЁё]/.test(english)) problems.push('russian text');
  return problems;
}

async function askModel(words) {
  const key = process.env.AI_API_KEY;
  const base = (process.env.AI_BASE_URL || 'https://llm.api.cloud.yandex.net/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || '';
  const folder = process.env.AI_FOLDER_ID || '';
  if (!key || !model) throw new Error('AI_API_KEY and AI_MODEL are required for --fetch');

  const system = 'You are a lexicographer building a Russian-facing English learner dictionary for Duolingo English Test preparation. Return strict JSON only.';
  const user = [
    'For every word return an object with these fields:',
    'word (exactly as given), ipa (British IPA inside slashes), pos (noun/verb/adjective/adverb/conjunction/preposition),',
    'level (A2/B1/B2/C1/C2 per CEFR), meaningRu (concise Russian translation), definitionEn (one clear English sentence),',
    'example (one natural sentence using the word), collocations (2-4 common phrases).',
    'Return {"entries":[...]} in the same order as the input. Words:',
    JSON.stringify(words),
  ].join(' ');

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${key}`,
      ...(folder ? { 'x-folder-id': folder } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) {
    throw new Error(`model returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || '';
  const parsed = JSON.parse(content);
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const map = new Map(entries.map((entry) => [normalise(entry.word || ''), entry]));
  return map;
}

async function fetchAll(list) {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const collected = new Map();
  if (fs.existsSync(jsonPath)) {
    for (const entry of JSON.parse(fs.readFileSync(jsonPath, 'utf8'))) {
      collected.set(normalise(entry.word), entry);
    }
  }

  const pending = list.filter((item) => !collected.has(normalise(item.word)));
  console.log(`words: ${list.length}, already cached: ${list.length - pending.length}, to fetch: ${pending.length}`);

  for (let offset = 0; offset < pending.length; offset += BATCH) {
    const slice = pending.slice(offset, offset + BATCH);
    const words = slice.map((item) => item.word);
    const key = batchKey(words);
    const cacheFile = path.join(cacheDir, `${key}.json`);
    let answers;

    if (fs.existsSync(cacheFile)) {
      answers = new Map(JSON.parse(fs.readFileSync(cacheFile, 'utf8')).map((entry) => [normalise(entry.word), entry]));
    } else {
      answers = await askModel(words);
      const valid = [];
      for (const word of words) {
        const entry = answers.get(normalise(word));
        if (entry && validateEntry(entry, word).length === 0) valid.push(entry);
      }
      fs.writeFileSync(cacheFile, JSON.stringify(valid, null, 2));
    }

    let missing = words.filter((word) => {
      const entry = answers.get(normalise(word));
      return !entry || validateEntry(entry, word).length > 0;
    });

    for (let attempt = 0; attempt < 2 && missing.length > 0; attempt += 1) {
      console.log(`  retry ${attempt + 1}: ${missing.length} word(s) in batch ${offset / BATCH + 1}`);
      const retry = await askModel(missing);
      for (const word of missing) {
        const entry = retry.get(normalise(word));
        if (entry && validateEntry(entry, word).length === 0) answers.set(normalise(word), entry);
      }
      fs.writeFileSync(cacheFile, JSON.stringify([...answers.values()], null, 2));
      missing = words.filter((word) => {
        const entry = answers.get(normalise(word));
        return !entry || validateEntry(entry, word).length > 0;
      });
    }

    for (const word of words) {
      const entry = answers.get(normalise(word));
      if (entry && validateEntry(entry, word).length === 0) collected.set(normalise(word), entry);
    }
    console.log(`batch ${offset / BATCH + 1}/${Math.ceil(pending.length / BATCH)}: +${words.length - missing.length}/${words.length} (total ${collected.size})`);
    if (missing.length > 0) console.warn(`  still missing: ${missing.join(', ')}`);
  }

  const expected = new Set(list.map((item) => normalise(item.word)));
  // Keep reviewed base-form entries that are not in the raw theory corpus
  // (cat, give, work, ...) when the generator is re-fetched.
  const reviewedExtras = [...collected.values()].filter((entry) => !expected.has(normalise(entry.word)));
  const entries = [
    ...list.map((item) => collected.get(normalise(item.word))).filter(Boolean),
    ...reviewedExtras,
  ].sort((a, b) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }));
  fs.writeFileSync(jsonPath, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`saved ${entries.length} entries to ${path.relative(root, jsonPath)}`);
}

function readEntries() {
  if (!fs.existsSync(jsonPath)) throw new Error(`missing ${path.relative(root, jsonPath)}; run with --fetch`);
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function validateAll(entries, list) {
  const errors = [];
  const byWord = new Map();
  for (const entry of entries) {
    const key = normalise(entry.word);
    if (byWord.has(key)) errors.push(`duplicate ${key}`);
    byWord.set(key, entry);
    for (const problem of validateEntry(entry, entry.word)) errors.push(`${entry.word}: ${problem}`);
  }
  for (const item of list) {
    if (!byWord.has(normalise(item.word))) errors.push(`missing ${item.word}`);
  }
  return errors;
}

function renderSQL(entries, list) {
  const sourceByWord = new Map(list.map((item) => [normalise(item.word), item.source]));
  const header = `-- Generated by scripts/generate_dictionary.mjs. Do not edit by hand.
-- Course vocabulary and the B1 core: IPA, part of speech, CEFR level, Russian
-- meaning, English definition, example and collocations.
-- The DELETE clears previously generated rows so removed headwords do not
-- survive a regeneration; other vocabulary sources are left untouched.

`;
  const values = entries.map((entry, index) => {
    const source = sourceByWord.get(normalise(entry.word)) || 'Course vocabulary (theory/HEDWIG-VOCABULARY.docx)';
    return `(${[
      sqlString(`dict-${index + 1}`),
      sqlString(entry.word),
      sqlString(entry.ipa),
      sqlString(entry.pos),
      sqlString(entry.level),
      sqlString(entry.meaningRu),
      sqlString(entry.definitionEn),
      sqlString(entry.example),
      `${sqlJSON(entry.collocations)}::jsonb`,
      sqlString(source),
      sqlString(''),
      sqlString('published'),
      sqlString('2026.2'),
      sqlString('2026-10-28T00:00:00Z'),
    ].join(', ')})`;
  });
  return `${header}BEGIN;

DELETE FROM vocabulary_entries WHERE id LIKE 'dict-%';

INSERT INTO vocabulary_entries
  (id, word, ipa, pos, level, meaning_ru, definition_en, example, collocations, source, source_url, status, version, reviewed_at)
VALUES
${values.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  word = EXCLUDED.word,
  ipa = EXCLUDED.ipa,
  pos = EXCLUDED.pos,
  level = EXCLUDED.level,
  meaning_ru = EXCLUDED.meaning_ru,
  definition_en = EXCLUDED.definition_en,
  example = EXCLUDED.example,
  collocations = EXCLUDED.collocations,
  source = EXCLUDED.source,
  status = EXCLUDED.status,
  version = EXCLUDED.version,
  reviewed_at = EXCLUDED.reviewed_at;

COMMIT;
`;
}

const list = buildWordList();

if (process.argv.includes('--fetch')) {
  await fetchAll(list);
}

const entries = readEntries();
const errors = validateAll(entries, list);
if (errors.length > 0) {
  console.error(`invalid dictionary: ${errors.length} problem(s)`);
  for (const error of errors.slice(0, 25)) console.error(`  - ${error}`);
  process.exit(1);
}

const sql = renderSQL(entries, list);
const levels = entries.reduce((acc, entry) => ({ ...acc, [entry.level]: (acc[entry.level] || 0) + 1 }), {});

if (process.argv.includes('--check')) {
  if (!fs.existsSync(sqlPath)) {
    console.error(`missing ${path.relative(root, sqlPath)}; run the generator`);
    process.exit(1);
  }
  const current = fs.readFileSync(sqlPath, 'utf8');
  if (current !== sql) {
    console.error(`dictionary drift: ${path.relative(root, sqlPath)} differs from the JSON source`);
    process.exit(1);
  }
  const snapshot = fs.existsSync(snapshotPath) ? fs.readFileSync(snapshotPath, 'utf8') : '';
  if (snapshot !== `${JSON.stringify(entries, null, 2)}\n`) {
    console.error(`dictionary snapshot drift: ${path.relative(root, snapshotPath)} is stale`);
    process.exit(1);
  }
  console.log(`dictionary ok (${entries.length} entries, sha256 ${crypto.createHash('sha256').update(sql).digest('hex').slice(0, 12)})`);
  console.log(`  levels: ${JSON.stringify(levels)}`);
  process.exit(0);
}

fs.writeFileSync(sqlPath, sql, 'utf8');
fs.writeFileSync(snapshotPath, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`wrote ${path.relative(root, sqlPath)} and ${path.relative(root, snapshotPath)} (${entries.length} entries)`);
console.log(`  levels: ${JSON.stringify(levels)}`);
