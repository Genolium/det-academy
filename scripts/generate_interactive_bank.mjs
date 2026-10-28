#!/usr/bin/env node
/**
 * Generates backend/db/09-interactive-bank.sql.
 *
 * Deterministic: the same content always produces byte-identical SQL. Every row
 * is validated before it is written, and `--check` fails when the committed
 * file differs from the generator output or contains an invalid payload.
 *
 * Pool policy:
 *   - INTERACTIVE_READING: two variants per academic passage.
 *   - C_TEST: exactly one item per source text. The academic passages plus the
 *     short cTestPassages pool provide at least 100 distinct texts, so no
 *     C-Test item reuses another item's passage.
 *   - INTERACTIVE_LISTENING: three variants per dialogue, each with a distinct
 *     rotation of the correct options.
 *   - READ_THEN_SPEAK / INTERACTIVE_SPEAKING: three / four tasks per topic.
 *
 *   node scripts/generate_interactive_bank.mjs
 *   node scripts/generate_interactive_bank.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readingPassages, cTestPassages } from './content/interactive-passages.mjs';
import {
  listeningDialogues,
  readThenSpeakTopics,
  interactiveSpeakingScenarios,
} from './content/interactive-speaking.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'backend/db/09-interactive-bank.sql');

const BANDS = ['B1', 'B2', 'C1'];
// Each bank row gets its own source text. Two rows from one passage would mean
// the same passage appears twice in a student's pool, so variants are forbidden.
const READING_VARIANTS = 1;
const LISTENING_VARIANTS = 1;

const MIN_COUNTS = {
  INTERACTIVE_READING: 100,
  C_TEST: 100,
  INTERACTIVE_LISTENING: 60,
  READ_THEN_SPEAK: 60,
  INTERACTIVE_SPEAKING: 60,
};

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;
const sqlJSON = (value) => sqlString(JSON.stringify(value));

function rotate(correct, wrong, shift) {
  const all = [correct, ...wrong].filter((item, index, list) => list.indexOf(item) === index);
  if (all.length !== 4) throw new Error(`expected 4 unique options, got ${all.length}: ${JSON.stringify(all)}`);
  const offset = ((shift % 4) + 4) % 4;
  const options = [...all.slice(offset), ...all.slice(0, offset)];
  return { options, correctIndex: options.indexOf(correct) };
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function shingles(text, size = 8) {
  const tokens = normalize(text).split(' ').filter(Boolean);
  const set = new Set();
  for (let index = 0; index + size <= tokens.length; index += 1) {
    set.add(tokens.slice(index, index + size).join(' '));
  }
  return set;
}

function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return shared / (left.size + right.size - shared);
}

// stableHash spreads sequential row numbers across the option positions. A
// plain index is too regular: with four positions, every linear shift repeats
// the same answer pattern every fourth row.
function stableHash(value) {
  let x = Math.imul(value + 1, 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

function findWholeWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\b${escaped}\\b`, 'i').exec(text);
  return match ? { index: match.index, value: match[0] } : null;
}

function validateSources() {
  const errors = [];
  const allTexts = [
    ...readingPassages.map((passage) => ({ ...passage, kind: 'reading' })),
    ...cTestPassages.map((passage) => ({ ...passage, kind: 'c-test' })),
  ];
  const seenTexts = new Map();
  const seenTitles = new Map();
  const shingleSets = [];

  for (const passage of allTexts) {
    const label = `${passage.kind} "${passage.title}"`;
    if (!passage.title || !passage.text) {
      errors.push(`${label}: missing title or text`);
      continue;
    }
    if (seenTitles.has(passage.title)) errors.push(`${label}: duplicate title`);
    seenTitles.set(passage.title, true);

    const normalized = normalize(passage.text);
    if (seenTexts.has(normalized)) {
      errors.push(`${label}: duplicate text (same as "${seenTexts.get(normalized)}")`);
    } else {
      seenTexts.set(normalized, passage.title);
    }

    const shingleSet = shingles(passage.text);
    for (const previous of shingleSets) {
      if (jaccard(shingleSet, previous.set) > 0.35) {
        errors.push(`${label}: near-duplicate text (overlaps "${previous.title}")`);
      }
    }
    shingleSets.push({ title: passage.title, set: shingleSet });

    const count = wordCount(passage.text);
    if (passage.kind === 'reading') {
      if (count < 90 || count > 140) errors.push(`${label}: expected 90-140 words, found ${count}`);
      if (!Array.isArray(passage.gaps) || passage.gaps.length !== 3) {
        errors.push(`${label}: expected 3 gap words`);
      } else {
        passage.gaps.forEach((word, gapIndex) => {
          if (!findWholeWord(passage.text, word)) errors.push(`${label}: gap word not found: ${word}`);
          const distractors = passage.gapDistractors?.[gapIndex];
          if (!Array.isArray(distractors) || distractors.length !== 3) {
            errors.push(`${label}: gap ${gapIndex} needs 3 distractors`);
            return;
          }
          const options = [word, ...distractors].map((item) => item.toLowerCase());
          if (new Set(options).size !== 4) errors.push(`${label}: gap ${gapIndex} distractors are not distinct`);
          if (distractors.some((item) => !item.trim())) errors.push(`${label}: gap ${gapIndex} has an empty distractor`);
        });
      }
      if (!Array.isArray(passage.highlights) || passage.highlights.length !== 2) {
        errors.push(`${label}: expected 2 highlight sentences`);
      } else {
        passage.highlights.forEach((highlight) => {
          if (!passage.text.includes(highlight)) errors.push(`${label}: highlight is not a substring`);
        });
        if (new Set(passage.highlights).size !== 2) errors.push(`${label}: duplicate highlight sentences`);
      }
      for (const [field, expected] of [['titles', 'title'], ['mainIdeas', 'main idea']]) {
        const values = passage[field];
        if (!Array.isArray(values) || values.length !== 4) {
          errors.push(`${label}: expected 4 ${expected} options`);
        } else if (new Set(values).size !== 4 || values.some((item) => !item.trim())) {
          errors.push(`${label}: ${expected} options must be unique and non-empty`);
        }
      }
    } else {
      if (count < 55 || count > 120) errors.push(`${label}: expected 55-120 words, found ${count}`);
      const longWords = new Set(passage.text.match(/[A-Za-z]{6,}/g) ?? []);
      if (longWords.size < 8) errors.push(`${label}: needs at least 8 distinct words of 6+ letters`);
      const sentences = passage.text.match(/[^.!?]+[.!?]+/g) ?? [];
      if (sentences.length < 3) errors.push(`${label}: needs at least 3 sentences`);
    }
  }

  if (allTexts.length < MIN_COUNTS.C_TEST) {
    errors.push(`C-Test pool has ${allTexts.length} texts; needs at least ${MIN_COUNTS.C_TEST}`);
  }

  const seenScenarios = new Map();
  for (const dialogue of listeningDialogues) {
    const normalized = normalize(dialogue.scenario ?? '');
    if (!normalized) errors.push('listening dialogue with an empty scenario');
    if (seenScenarios.has(normalized)) {
      errors.push(`duplicate dialogue scenario: "${dialogue.scenario}"`);
    }
    seenScenarios.set(normalized, true);
    if (!Array.isArray(dialogue.turns) || dialogue.turns.length !== 3) {
      errors.push(`dialogue "${dialogue.scenario}" needs exactly 3 turns`);
      continue;
    }
    dialogue.turns.forEach((turn, index) => {
      if (!turn.speaker || !turn.audio) errors.push(`dialogue "${dialogue.scenario}" turn ${index}: missing speaker or audio`);
      const options = [turn.correct, ...(turn.wrong ?? [])];
      if (options.length !== 4 || new Set(options).size !== 4) {
        errors.push(`dialogue "${dialogue.scenario}" turn ${index}: options must be 4 unique values`);
      }
      if (!turn.correct?.trim()) errors.push(`dialogue "${dialogue.scenario}" turn ${index}: empty correct option`);
    });
    if (!Array.isArray(dialogue.summaries) || dialogue.summaries.length < 2) {
      errors.push(`dialogue "${dialogue.scenario}" needs at least 2 summary prompts`);
    }
  }

  if (readThenSpeakTopics.length < MIN_COUNTS.READ_THEN_SPEAK / 3) {
    errors.push(`read-then-speak pool needs at least ${Math.ceil(MIN_COUNTS.READ_THEN_SPEAK / 3)} topics`);
  }
  readThenSpeakTopics.forEach((topic) => {
    if (!topic.statement || !Array.isArray(topic.focuses) || topic.focuses.length !== 3) {
      errors.push(`read-then-speak topic is incomplete: ${topic.statement ?? '(missing)'}`);
    }
  });

  if (interactiveSpeakingScenarios.length < MIN_COUNTS.INTERACTIVE_SPEAKING / 4) {
    errors.push(`interactive-speaking pool needs at least ${Math.ceil(MIN_COUNTS.INTERACTIVE_SPEAKING / 4)} scenarios`);
  }
  interactiveSpeakingScenarios.forEach((scenario) => {
    if (!scenario.scenario || !Array.isArray(scenario.tasks) || scenario.tasks.length !== 4) {
      errors.push(`interactive-speaking scenario is incomplete: ${scenario.scenario ?? '(missing)'}`);
    }
  });

  return errors;
}

function passageGap(passage, index) {
  const word = passage.gaps[index % passage.gaps.length];
  const found = findWholeWord(passage.text, word);
  if (!found) throw new Error(`gap word not found in passage "${passage.title}": ${word}`);
  const distractors = passage.gapDistractors?.[index % passage.gaps.length];
  if (!distractors || distractors.length !== 3) throw new Error(`missing gap distractors for "${passage.title}"`);
  return {
    before: passage.text.slice(0, found.index),
    after: passage.text.slice(found.index + found.value.length),
    correct: found.value,
    distractors,
  };
}

function buildReadingRows() {
  const rows = [];
  readingPassages.forEach((passage, passageIndex) => {
    // Independent hashes per question keep the correct positions varied: if
    // every shift were derived from one value, the whole four-answer pattern
    // would repeat every fourth passage.
    const gapShift = stableHash(passageIndex * 4 + 1);
    const titleShift = stableHash(passageIndex * 4 + 2);
    const mainShift = stableHash(passageIndex * 4 + 3);
    const sentenceShift = stableHash(passageIndex * 4 + 4);
    const gap = passageGap(passage, gapShift % passage.gaps.length);
    const gapOptions = rotate(gap.correct, gap.distractors, gapShift);
    const title = rotate(passage.titles[0], passage.titles.slice(1), titleShift);
    const mainIdea = rotate(passage.mainIdeas[0], passage.mainIdeas.slice(1), mainShift);
    const highlight = passage.highlights[stableHash(passageIndex * 4 + 5) % passage.highlights.length];
    const otherHighlights = readingPassages
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.index !== passageIndex)
      .map((entry) => entry.item.highlights[stableHash(entry.index + passageIndex + 1) % entry.item.highlights.length])
      .slice(0, 3);
    const sentence = rotate(highlight, otherHighlights, sentenceShift);

    rows.push({
      id: `ibir-${passageIndex + 1}`,
      type: 'INTERACTIVE_READING',
      band: BANDS[passageIndex % BANDS.length],
      time: 120,
      content: {
        passageTitle: passage.title,
        passageText: passage.text,
        gapSentence: {
          before: gap.before,
          after: gap.after,
          correct: gap.correct,
          options: gapOptions.options,
        },
        titleQuestion: {
          question: 'Choose the most appropriate academic title for this passage:',
          options: title.options,
          correctIndex: title.correctIndex,
        },
        mainIdeaQuestion: {
          question: 'What is the primary idea of the passage?',
          options: mainIdea.options,
          correctIndex: mainIdea.correctIndex,
        },
        highlightPrompt: 'Highlight the sentence that carries the key claim described in the question.',
        sentenceOptions: sentence.options,
      },
      correct: {
        gapCorrect: gap.correct,
        titleCorrectIndex: title.correctIndex,
        mainIdeaCorrectIndex: mainIdea.correctIndex,
        sentenceCorrectIndex: sentence.correctIndex,
        highlightCorrectSubstring: highlight,
      },
    });
  });
  return rows;
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g)?.map((item) => item.trim()) ?? [text];
}

const cTestSourceById = new Map();

function buildCTestRows() {
  const rows = [];
  // Keep the C-Test at 120 items: the first 60 reading passages plus the 60
  // C-Test-only passages. The newer reading passages are reserved for the
  // interactive-reading bank, where every row must have a unique text.
  const sources = [
    ...readingPassages.slice(0, 60).map((passage) => ({ title: passage.title, text: passage.text })),
    ...cTestPassages.map((passage) => ({ title: passage.title, text: passage.text })),
  ];

  sources.forEach((source, sourceIndex) => {
    const sentences = splitSentences(source.text);
    if (sentences.length < 3) throw new Error(`C-Test source "${source.title}" needs at least three sentences`);
    const words = [...new Set(source.text.match(/[A-Za-z]{6,}/g) ?? [])];
    if (words.length < 8) throw new Error(`C-Test source "${source.title}" needs at least 8 long words`);

    const selected = [];
    const start = (sourceIndex * 3) % words.length;
    for (let step = 0; selected.length < 8 && step < words.length; step += 1) {
      const candidate = words[(start + step) % words.length];
      if (!selected.includes(candidate)) selected.push(candidate);
    }
    if (selected.length !== 8) throw new Error(`not enough C-Test words in "${source.title}"`);

    const remaining = new Set(selected);
    const answers = [];
    const damaged = [];
    const segments = [];
    const tokens = source.text.split(/(\b[A-Za-z]+\b)/);
    for (const token of tokens) {
      if (!/^[A-Za-z]+$/.test(token) || !remaining.has(token)) {
        if (token) segments.push({ text: token });
        continue;
      }
      remaining.delete(token);
      const prefixLength = Math.max(2, Math.floor(token.length / 2));
      const prefix = token.slice(0, prefixLength);
      const answer = token.slice(prefixLength);
      segments.push({ prefix, missingLength: answer.length });
      damaged.push({ prefix, missingLength: answer.length });
      answers.push(answer);
    }
    if (remaining.size > 0) throw new Error(`words not blanked in "${source.title}": ${[...remaining].join(', ')}`);

    let answerIndex = 0;
    const rebuilt = segments
      .map((segment) => {
        if (segment.text !== undefined) return segment.text;
        const answer = answers[answerIndex];
        answerIndex += 1;
        return segment.prefix + answer;
      })
      .join('');
    if (rebuilt !== source.text) throw new Error(`C-Test prefix/suffix does not reconstruct "${source.title}"`);

    const id = `ibct-${sourceIndex + 1}`;
    cTestSourceById.set(id, source.text);
    rows.push({
      id,
      type: 'C_TEST',
      band: BANDS[sourceIndex % BANDS.length],
      time: 180,
      content: {
        title: source.title,
        firstSentence: sentences[0],
        lastSentence: sentences[sentences.length - 1],
        damagedTokens: damaged,
        segments,
      },
      correct: { answers },
    });
  });
  return rows;
}

function buildListeningRows() {
  const rows = [];
  listeningDialogues.forEach((dialogue, dialogueIndex) => {
    const turns = dialogue.turns.map((turn, turnIndex) => {
      const options = [turn.correct, ...turn.wrong];
      // A stable hash keeps the three-turn answer pattern from repeating
      // across the pool while staying deterministic between builds. The turn
      // has its own hash: deriving every turn from one dialogue-level base
      // value collapses the answer key into twelve possible patterns, which
      // the pattern gate rejects once the dialogue pool grows.
      const offset = stableHash(dialogueIndex * 4 + turnIndex + 1) % 4;
      const rotated = [...options.slice(offset), ...options.slice(0, offset)];
      return {
        speaker: turn.speaker,
        speakerAudioText: turn.audio,
        options: rotated,
        correctIndex: rotated.indexOf(turn.correct),
      };
    });
    rows.push({
      id: `ibil-${dialogueIndex + 1}`,
      type: 'INTERACTIVE_LISTENING',
      band: BANDS[dialogueIndex % BANDS.length],
      time: 150,
      content: {
        scenario: dialogue.scenario,
        turns,
        summaryPrompt: dialogue.summaries[0],
      },
      correct: { turnsAnswers: turns.map((turn) => turn.correctIndex) },
    });
  });
  return rows;
}

function buildReadThenSpeakRows() {
  const rows = [];
  let id = 0;
  const angles = [
    (statement, focus) => `${statement} Do you agree? Speak for 90 seconds and focus on ${focus}.`,
    (statement, focus) => `${statement} Discuss the arguments on both sides, paying particular attention to ${focus}.`,
    (statement, focus) => `${statement} What would you recommend to a policymaker? Consider ${focus}.`,
  ];
  readThenSpeakTopics.forEach((topic, topicIndex) => {
    for (let variant = 0; variant < 3; variant += 1) {
      id += 1;
      const focus = topic.focuses[variant % topic.focuses.length];
      rows.push({
        id: `ibrts-${id}`,
        type: 'READ_THEN_SPEAK',
        band: BANDS[(topicIndex + variant) % BANDS.length],
        time: 90,
        content: {
          prompt: angles[variant](topic.statement, focus),
          hints: [...topic.focuses.slice(variant % 3), ...topic.focuses.slice(0, variant % 3)],
        },
        correct: { rubric: 'read_then_speak_min90s' },
      });
    }
  });
  return rows;
}

function buildSpeakingRows() {
  const rows = [];
  let id = 0;
  interactiveSpeakingScenarios.forEach((scenario, scenarioIndex) => {
    scenario.tasks.forEach((task, taskIndex) => {
      id += 1;
      rows.push({
        id: `ibis-${id}`,
        type: 'INTERACTIVE_SPEAKING',
        band: BANDS[(scenarioIndex + taskIndex) % BANDS.length],
        time: 35,
        content: {
          scenario: scenario.scenario,
          prompt: task,
          hints: ['State your position first.', 'Give one reason and one example.', 'Finish within 35 seconds.'],
        },
        correct: { rubric: 'interactive_speaking_responsiveness' },
      });
    });
  });
  return rows;
}

function checkOptionPatterns(rows, errors) {
  const groups = new Map();
  for (const row of rows) {
    let pattern = null;
    if (row.type === 'INTERACTIVE_READING') {
      pattern = [
        row.content.gapSentence.options.indexOf(row.content.gapSentence.correct),
        row.content.titleQuestion.correctIndex,
        row.content.mainIdeaQuestion.correctIndex,
        row.correct.sentenceCorrectIndex,
      ];
    } else if (row.type === 'INTERACTIVE_LISTENING') {
      pattern = row.correct.turnsAnswers;
    }
    if (!pattern) continue;
    if (!groups.has(row.type)) groups.set(row.type, { patterns: [], indices: [] });
    const group = groups.get(row.type);
    group.patterns.push(pattern.join(''));
    group.indices.push(...pattern);
  }

  for (const [type, group] of groups) {
    const distribution = [0, 0, 0, 0];
    group.indices.forEach((index) => {
      distribution[index] += 1;
    });
    const total = group.indices.length;
    if (total > 0 && Math.max(...distribution) / total > 0.5) {
      errors.push(`${type}: correct-option positions are imbalanced: ${distribution.join('/')}`);
    }
    let run = 1;
    let maxRun = 1;
    for (let index = 1; index < group.indices.length; index += 1) {
      run = group.indices[index] === group.indices[index - 1] ? run + 1 : 1;
      maxRun = Math.max(maxRun, run);
    }
    if (maxRun > 8) errors.push(`${type}: ${maxRun} consecutive items share the same correct position`);

    const patternCounts = new Map();
    group.patterns.forEach((pattern) => patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1));
    const mostRepeated = Math.max(...patternCounts.values());
    if (mostRepeated > Math.max(6, Math.ceil(group.patterns.length * 0.12))) {
      errors.push(`${type}: a correct-option pattern repeats ${mostRepeated} times`);
    }
  }
}

function validate(rows) {
  const errors = [];
  const ids = new Set();
  const counts = {};
  const irSignatures = new Set();
  const irTexts = new Set();
  const ilScenarios = new Set();
  const cTestTexts = new Set();
  const rtsPrompts = new Set();
  const speakingPrompts = new Set();

  for (const row of rows) {
    counts[row.type] = (counts[row.type] || 0) + 1;
    if (ids.has(row.id)) errors.push(`${row.id}: duplicate id`);
    ids.add(row.id);
    if (!BANDS.includes(row.band)) errors.push(`${row.id}: invalid band ${row.band}`);

    if (row.type === 'INTERACTIVE_READING') {
      const { gapSentence, titleQuestion, mainIdeaQuestion, sentenceOptions, passageText } = row.content;
      if (!passageText || wordCount(passageText) < 90) errors.push(`${row.id}: passage is too short`);
      if (gapSentence.options.length !== 4) errors.push(`${row.id}: gap options`);
      if (new Set(gapSentence.options).size !== 4) errors.push(`${row.id}: duplicate gap options`);
      if (!gapSentence.options.includes(gapSentence.correct)) errors.push(`${row.id}: gap answer missing from options`);
      if (titleQuestion.options[titleQuestion.correctIndex] !== row.content.passageTitle) {
        errors.push(`${row.id}: title answer does not match the passage title`);
      }
      if (gapSentence.before + gapSentence.correct + gapSentence.after !== passageText) {
        errors.push(`${row.id}: gap does not reconstruct the passage`);
      }
      for (const [name, question] of [['title', titleQuestion], ['mainIdea', mainIdeaQuestion]]) {
        if (question.options.length !== 4) errors.push(`${row.id}: ${name} needs 4 options`);
        if (new Set(question.options).size !== 4) errors.push(`${row.id}: ${name} has duplicate options`);
        if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) {
          errors.push(`${row.id}: ${name} index`);
        }
      }
      if (sentenceOptions.length !== 4) errors.push(`${row.id}: sentence options`);
      const correctSentence = sentenceOptions[row.correct.sentenceCorrectIndex];
      if (!correctSentence || !passageText.includes(correctSentence)) errors.push(`${row.id}: highlight is not a substring`);
      if (row.correct.highlightCorrectSubstring !== correctSentence) errors.push(`${row.id}: highlight mismatch`);
      if (new Set(sentenceOptions).size !== 4) errors.push(`${row.id}: duplicate sentence options`);

      const normalizedPassage = normalize(passageText);
      if (irTexts.has(normalizedPassage)) errors.push(`${row.id}: duplicate interactive-reading passage text`);
      irTexts.add(normalizedPassage);

      const signature = `${normalizedPassage}|${gapSentence.before.length}|${gapSentence.correct}`;
      if (irSignatures.has(signature)) errors.push(`${row.id}: duplicate passage/gap combination`);
      irSignatures.add(signature);
    }

    if (row.type === 'C_TEST') {
      const sourceText = cTestSourceById.get(row.id);
      if (!sourceText) errors.push(`${row.id}: missing C-Test source text`);
      if (row.content.damagedTokens.length !== 8 || row.correct.answers.length !== 8) {
        errors.push(`${row.id}: needs 8 blanks`);
      }
      row.content.damagedTokens.forEach((token, index) => {
        if (!token.prefix) errors.push(`${row.id}: empty prefix`);
        if (token.missingLength !== row.correct.answers[index].length) errors.push(`${row.id}: answer length mismatch`);
        if (!row.content.segments.some((segment) => segment.prefix === token.prefix && segment.missingLength === token.missingLength)) {
          errors.push(`${row.id}: token missing from segments`);
        }
        if (!/^[A-Za-z]+$/.test(row.correct.answers[index] ?? '')) errors.push(`${row.id}: answer is not alphabetic`);
      });
      let answerIndex = 0;
      const rebuilt = row.content.segments
        .map((segment) => {
          if (segment.text !== undefined) return segment.text;
          const answer = row.correct.answers[answerIndex];
          answerIndex += 1;
          return segment.prefix + answer;
        })
        .join('');
      if (sourceText && rebuilt !== sourceText) {
        errors.push(`${row.id}: prefix/suffix does not reconstruct a word in the source passage`);
      }
      row.content.damagedTokens.forEach((token, index) => {
        const answer = row.correct.answers[index];
        if (sourceText && !sourceText.includes(token.prefix + answer)) {
          errors.push(`${row.id}: blanked word is not present in the source passage`);
        }
      });
      const normalizedText = sourceText ? normalize(sourceText) : '';
      if (normalizedText) {
        if (cTestTexts.has(normalizedText)) errors.push(`${row.id}: duplicate C-Test text`);
        cTestTexts.add(normalizedText);
      }
    }

    if (row.type === 'INTERACTIVE_LISTENING') {
      const normalizedScenario = normalize(row.content.scenario ?? '');
      if (ilScenarios.has(normalizedScenario)) errors.push(`${row.id}: duplicate listening scenario`);
      ilScenarios.add(normalizedScenario);
      if (row.content.turns.length !== 3) errors.push(`${row.id}: needs three turns`);
      if (row.correct.turnsAnswers.length !== 3) errors.push(`${row.id}: needs three recorded answers`);
      row.content.turns.forEach((turn, index) => {
        if (!turn.speakerAudioText) errors.push(`${row.id}: turn ${index} has no audio text`);
        if (turn.options.length !== 4) errors.push(`${row.id}: turn ${index} needs 4 options`);
        if (new Set(turn.options).size !== 4) errors.push(`${row.id}: turn ${index} has duplicate options`);
        if (turn.correctIndex !== row.correct.turnsAnswers[index]) errors.push(`${row.id}: turn ${index} index mismatch`);
        if (!Number.isInteger(turn.correctIndex) || turn.correctIndex < 0 || turn.correctIndex > 3) {
          errors.push(`${row.id}: turn ${index} index`);
        }
      });
      if (!row.content.summaryPrompt) errors.push(`${row.id}: missing summary prompt`);
    }

    if (row.type === 'READ_THEN_SPEAK') {
      if (!row.content.prompt || row.content.prompt.length < 40) errors.push(`${row.id}: prompt is too short`);
      if (row.content.hints.length !== 3) errors.push(`${row.id}: needs 3 hints`);
      if (rtsPrompts.has(row.content.prompt)) errors.push(`${row.id}: duplicate read-then-speak prompt`);
      rtsPrompts.add(row.content.prompt);
    }

    if (row.type === 'INTERACTIVE_SPEAKING') {
      if (!row.content.scenario || !row.content.prompt) errors.push(`${row.id}: missing scenario or prompt`);
      if (row.content.hints.length !== 3) errors.push(`${row.id}: needs 3 hints`);
      const signature = `${row.content.scenario}|${row.content.prompt}`;
      if (speakingPrompts.has(signature)) errors.push(`${row.id}: duplicate speaking task`);
      speakingPrompts.add(signature);
    }
  }

  for (const [type, minimum] of Object.entries(MIN_COUNTS)) {
    if ((counts[type] ?? 0) < minimum) errors.push(`${type}: ${counts[type] ?? 0} rows, minimum is ${minimum}`);
  }
  if (cTestTexts.size < 100) errors.push(`C_TEST: only ${cTestTexts.size} unique texts, minimum is 100`);

  checkOptionPatterns(rows, errors);
  return { errors, counts };
}

function renderSQL(rows) {
  const header = `-- Generated by scripts/generate_interactive_bank.mjs. Do not edit by hand.
-- Interactive reading and listening, C-Test, read-then-speak and interactive
-- speaking. Every row is validated by the generator; run with --check in CI.
-- Every interactive-reading item and listening item uses its own source text.
-- C-Test items each use a different source text (120 unique texts).

`;
  const statements = rows.map((row) => `INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES (
  ${sqlString(row.id)},
  ${sqlString(row.type)},
  ${sqlString(row.band)},
  ${sqlJSON(row.content)},
  ${sqlJSON(row.correct)},
  ${row.time},
  true
)
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  difficulty_band = EXCLUDED.difficulty_band,
  content_payload = EXCLUDED.content_payload,
  correct_answers = EXCLUDED.correct_answers,
  time_limit_sec = EXCLUDED.time_limit_sec,
  is_active = true;
`);
  // A previous deploy may contain rows that are no longer generated. They must
  // not stay active: the uniqueness guarantee applies to the live bank, not
  // only to the rows in this file. Deactivation keeps response history intact.
  const ids = rows.map((row) => sqlString(row.id)).join(', ');
  const retire = `-- Retire rows from older banks so the active pool stays unique.
UPDATE questions
SET is_active = false
WHERE id LIKE 'ib%'
  AND id NOT IN (${ids});
`;
  return header + statements.join('\n') + '\n' + retire;
}

const sourceErrors = validateSources();
if (sourceErrors.length > 0) {
  console.error(`invalid content pools: ${sourceErrors.length} problem(s)`);
  for (const error of sourceErrors.slice(0, 30)) console.error(`  - ${error}`);
  process.exit(1);
}

const rows = [
  ...buildReadingRows(),
  ...buildCTestRows(),
  ...buildListeningRows(),
  ...buildReadThenSpeakRows(),
  ...buildSpeakingRows(),
];

const { errors, counts } = validate(rows);
if (errors.length > 0) {
  console.error(`invalid content: ${errors.length} problem(s)`);
  for (const error of errors.slice(0, 30)) console.error(`  - ${error}`);
  process.exit(1);
}

const sql = renderSQL(rows);
const hash = createHash('sha256').update(sql).digest('hex');

if (process.argv.includes('--check')) {
  if (!fs.existsSync(target)) {
    console.error(`missing ${path.relative(root, target)}; run the generator`);
    process.exit(1);
  }
  const current = fs.readFileSync(target, 'utf8');
  if (current !== sql) {
    console.error(`content drift: ${path.relative(root, target)} differs from the generator output`);
    console.error(`  committed ${createHash('sha256').update(current).digest('hex')}`);
    console.error(`  generated ${hash}`);
    process.exit(1);
  }
  console.log(`interactive bank ok (${rows.length} rows, sha256 ${hash.slice(0, 12)})`);
  for (const [type, count] of Object.entries(counts)) console.log(`  ${type}: ${count}`);
  process.exit(0);
}

fs.writeFileSync(target, sql, 'utf8');
console.log(`wrote ${path.relative(root, target)} (${rows.length} rows, sha256 ${hash.slice(0, 12)})`);
for (const [type, count] of Object.entries(counts)) console.log(`  ${type}: ${count}`);
