#!/usr/bin/env node
/**
 * Generates backend/db/08-productive-bank.sql.
 *
 * Photo tasks use the 34 verified local images (public/drills) with several
 * prompt angles each; text tasks come from curated statements and scenarios;
 * dictations cover A2–C2. Every task is level-tagged and keeps the payload
 * shape the server-side grading already understands.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { statements, readThenSpeak, interactiveSpeaking, interactiveWriting, dictationSentences } from './content/productive-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function extractArray(name) {
  const source = fs.readFileSync(path.join(root, 'src/data/questionBank.ts'), 'utf8');
  const marker = new RegExp(`export const ${name}[^=]*=\\s*\\[`);
  const match = marker.exec(source);
  if (!match) throw new Error(`array ${name} not found`);
  const start = match.index + match[0].length - 1;
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '[') depth += 1;
    else if (source[index] === ']') {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, index + 1));
    }
  }
  throw new Error(`array ${name} is not terminated`);
}

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;
const json = (value) => sqlString(JSON.stringify(value));

const BANDS = ['B1', 'B2', 'C1'];
const bandFor = (index) => BANDS[index % BANDS.length];

const rows = [];
const counters = {};
function nextId(prefix) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return `${prefix}-${counters[prefix]}`;
}
function push(type, level, time, content, correct) {
  const prefix = {
    WRITE_PHOTO: 'pbwp',
    SPEAK_PHOTO: 'pbsp',
    WRITING_SAMPLE: 'pbws',
    SPEAKING_SAMPLE: 'pbss',
    READ_THEN_SPEAK: 'pbrts',
    INTERACTIVE_SPEAKING: 'pbis',
    INTERACTIVE_WRITING: 'pbiw',
    LISTEN_TYPE: 'pbdt',
  }[type];
  rows.push({ id: nextId(prefix), type, level, time, content, correct });
}

const writePhotos = extractArray('writePhotoBank');
const speakPhotos = extractArray('speakPhotoBank');

const writeAngles = [
  (description) => `Describe this image in 3–4 sentences: the foreground, the background and the atmosphere. Context: ${description}.`,
  (description) => `Describe this image and explain what is probably happening just before and just after the moment shown. Context: ${description}.`,
  (description) => `Describe this image for a reader who cannot see it: people, objects, setting and mood. Context: ${description}.`,
];

const speakAngles = [
  (description) => `Speak for 90 seconds: describe the setting, the people and the atmosphere. Context: ${description}.`,
  (description) => `Speak for 90 seconds: describe the image and speculate about what will happen next. Context: ${description}.`,
];

writePhotos.forEach((photo, index) => {
  writeAngles.forEach((angle, angleIndex) => {
    push('WRITE_PHOTO', bandFor(index + angleIndex), 60, {
      imageUrl: photo.imageUrl,
      altText: photo.altText,
      prompt: angle(photo.altText),
    }, { rubric: 'written_description_min_3_sentences' });
  });
});

speakPhotos.forEach((photo, index) => {
  speakAngles.forEach((angle, angleIndex) => {
    push('SPEAK_PHOTO', bandFor(index + angleIndex), 90, {
      imageUrl: photo.imageUrl,
      altText: photo.altText,
      topic: photo.topic,
      prompt: angle(photo.altText),
    }, { rubric: 'fluency_pronunciation_vocabulary_min90s' });
  });
});

statements.forEach((statement, index) => {
  push('WRITING_SAMPLE', bandFor(index), 300, {
    prompt: `Some people support this view, while others disagree. Discuss both perspectives and give your own opinion: ${statement} Write at least 100 words.`,
  }, { rubric: 'academic_argumentation_min100' });

  push('WRITING_SAMPLE', bandFor(index + 1), 300, {
    prompt: `To what extent do you agree with this statement? Support your position with reasons and examples: ${statement} Write at least 100 words.`,
  }, { rubric: 'academic_argumentation_min100' });

  push('SPEAKING_SAMPLE', bandFor(index + 2), 180, {
    prompt: `Speak for 1–3 minutes about this statement: ${statement} Give reasons and concrete examples.`,
  }, { rubric: 'extended_discourse_academic_speech_min180s' });
});

readThenSpeak.forEach((task, index) => {
  push('READ_THEN_SPEAK', bandFor(index), 90, {
    prompt: task.prompt,
    hints: task.hints,
  }, { rubric: 'read_then_speak_min90s' });
});

interactiveSpeaking.forEach((task, index) => {
  push('INTERACTIVE_SPEAKING', bandFor(index), 60, {
    scenario: task.scenario,
    prompt: task.prompt,
    hints: task.hints,
  }, { rubric: 'interactive_speaking_responsiveness' });
});

interactiveWriting.forEach((task, index) => {
  push('INTERACTIVE_WRITING', bandFor(index), 480, {
    part1Prompt: task.part1,
    part2Prompt: task.part2,
    prompt: task.part1,
  }, { rubric: 'interactive_writing_two_parts' });
});

for (const [level, sentences] of Object.entries(dictationSentences)) {
  sentences.forEach((sentence) => {
    push('LISTEN_TYPE', level, 60, { playsAllowed: 3, audioSentence: sentence }, { expectedSentence: sentence });
  });
}

// Every image must exist locally: the prompt describes what is actually shown.
const missing = [];
for (const photo of [...writePhotos, ...speakPhotos]) {
  const local = path.join(root, 'public', photo.imageUrl.replace(/^\//, ''));
  if (!fs.existsSync(local)) missing.push(photo.imageUrl);
}
if (missing.length > 0) {
  console.error('missing images referenced by photo tasks:', [...new Set(missing)]);
  process.exit(1);
}

const lines = [];
lines.push('-- Generated by scripts/generate_productive_bank.mjs. Do not edit by hand.');
lines.push('-- Productive skills: photo description (34 verified local images, several');
lines.push('-- angles), writing/speaking samples, read-then-speak, interactive tasks and');
lines.push('-- A2–C2 dictations.');
lines.push('');

for (const row of rows) {
  lines.push('INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)');
  lines.push('VALUES (');
  lines.push(`  ${sqlString(row.id)},`);
  lines.push(`  ${sqlString(row.type)},`);
  lines.push(`  ${sqlString(row.level)},`);
  lines.push(`  ${json(row.content)},`);
  lines.push(`  ${json(row.correct)},`);
  lines.push(`  ${row.time},`);
  lines.push('  true');
  lines.push(')');
  lines.push('ON CONFLICT (id) DO NOTHING;');
  lines.push('');
}

const target = path.join(root, 'backend/db/08-productive-bank.sql');
const output = lines.join('\n');

if (process.argv.includes('--check')) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (current !== output) {
    console.error('backend/db/08-productive-bank.sql is out of date; run node scripts/generate_productive_bank.mjs');
    process.exit(1);
  }
  console.log(`productive bank is up to date (${rows.length} questions)`);
  process.exit(0);
}

fs.writeFileSync(target, output, 'utf8');
const perType = {};
for (const row of rows) perType[row.type] = (perType[row.type] || 0) + 1;
console.log(`wrote ${rows.length} questions to ${target}`);
console.log(perType);
