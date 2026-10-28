/**
 * Deterministic phoneme scoring for pronunciation feedback.
 *
 * Honest scope:
 *   - Reference phonemes come from the shipped IPA lexicon or a rule-based
 *     letter-to-sound fallback.
 *   - "Recognised" phonemes are derived from the speech recogniser's transcript
 *     with the same G2P. They are not acoustic phoneme posteriors: the project
 *     has no phoneme acoustic model or forced aligner.
 *   - The score therefore measures how closely the recognised words' phoneme
 *     sequences match the expected ones. It is feedback, never a grade.
 *
 * Everything here is pure and deterministic so it can be tested with fixed
 * fixtures.
 */

import { PHONEME_LEXICON } from './phonemeLexicon';

export const PHONEME_METHOD = 'g2p-phoneme-alignment' as const;
export const PHONEME_MODEL = 'lexicon+rule-g2p' as const;

const DIGRAPHS = [
  'tʃ',
  'dʒ',
  'aɪ',
  'aʊ',
  'eɪ',
  'oʊ',
  'əʊ',
  'ɔɪ',
  'ɪə',
  'eə',
  'ʊə',
  'ɑɪ',
  'ɑʊ',
];

const STRESS_MARKS = /[ˈˌ.\u0329]/g;

/** Lower-cases and removes everything that cannot be part of an English word. */
export function normalizeEnglishWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z']/g, '')
    .replace(/^'+|'+$/g, '');
}

/** Splits an IPA transcription into comparable phoneme tokens. */
export function tokenizeIPA(ipa: string): string[] {
  const cleaned = ipa
    .replace(/^[\/\[]+|[\/\]]+$/g, '')
    .replace(STRESS_MARKS, '')
    .replace(/ɡ/g, 'g')
    .replace(/ɹ/g, 'r')
    .replace(/ʧ/g, 'tʃ')
    .replace(/ʤ/g, 'dʒ')
    .trim();
  const tokens: string[] = [];
  let index = 0;
  while (index < cleaned.length) {
    const pair = cleaned.slice(index, index + 2);
    if (DIGRAPHS.includes(pair)) {
      tokens.push(pair);
      index += 2;
      continue;
    }
    const char = cleaned[index];
    index += 1;
    if (char === ' ' || char === '\u200d') continue;
    let token = char;
    if (cleaned[index] === 'ː') {
      token += 'ː';
      index += 1;
    }
    tokens.push(token);
  }
  return tokens;
}

const VOWEL_DIGRAPHS: Record<string, string> = {
  ai: 'eɪ',
  ay: 'eɪ',
  au: 'ɔː',
  aw: 'ɔː',
  ea: 'iː',
  ee: 'iː',
  ei: 'eɪ',
  ew: 'uː',
  ie: 'aɪ',
  oa: 'oʊ',
  oo: 'uː',
  ou: 'aʊ',
  ow: 'aʊ',
  oi: 'ɔɪ',
  oy: 'ɔɪ',
  ue: 'uː',
  ui: 'uː',
};

const SINGLE_VOWELS: Record<string, string> = {
  a: 'æ',
  e: 'e',
  i: 'ɪ',
  o: 'ɒ',
  u: 'ʌ',
  y: 'ɪ',
};

const SINGLE_CONSONANTS: Record<string, string> = {
  b: 'b',
  d: 'd',
  f: 'f',
  h: 'h',
  j: 'dʒ',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  p: 'p',
  r: 'r',
  s: 's',
  t: 't',
  v: 'v',
  w: 'w',
  z: 'z',
};

const SUFFIXES: Array<[string, string[]]> = [
  ['tion', ['ʃ', 'ə', 'n']],
  ['sion', ['ʒ', 'ə', 'n']],
  ['cious', ['ʃ', 'ə', 's']],
  ['tious', ['ʃ', 'ə', 's']],
  ['ture', ['tʃ', 'ə']],
  ['ough', ['ɔː']],
  ['ing', ['ɪ', 'ŋ']],
  ['ment', ['m', 'ə', 'n', 't']],
  ['ness', ['n', 'ə', 's']],
  ['able', ['ə', 'b', 'ə', 'l']],
  ['ible', ['ə', 'b', 'ə', 'l']],
  ['ly', ['l', 'i']],
  ['ed', ['d']],
  ['es', ['ɪ', 'z']],
];

function ruleStem(word: string): string[] {
  const out: string[] = [];
  let index = 0;

  while (index < word.length) {
    const rest = word.slice(index);
    const pair = rest.slice(0, 2);

    // Silent or fused consonant clusters.
    if (rest.startsWith('kn') || rest.startsWith('gn')) {
      out.push('n');
      index += 2;
      continue;
    }
    if (rest.startsWith('wr')) {
      out.push('r');
      index += 2;
      continue;
    }
    if (rest.startsWith('mb') && index + 2 === word.length) {
      out.push('m');
      index += 2;
      continue;
    }
    if (rest.startsWith('gh') && index + 2 === word.length) {
      index += 2;
      continue;
    }
    if (pair === 'qu') {
      out.push('k', 'w');
      index += 2;
      continue;
    }
    if (pair === 'th') {
      out.push('θ');
      index += 2;
      continue;
    }
    if (pair === 'sh') {
      out.push('ʃ');
      index += 2;
      continue;
    }
    if (pair === 'ch') {
      out.push('tʃ');
      index += 2;
      continue;
    }
    if (pair === 'ph') {
      out.push('f');
      index += 2;
      continue;
    }
    if (pair === 'wh') {
      out.push('w');
      index += 2;
      continue;
    }
    if (pair === 'ck') {
      out.push('k');
      index += 2;
      continue;
    }
    if (pair === 'ng') {
      out.push('ŋ');
      index += 2;
      continue;
    }
    if (pair === 'gh') {
      out.push('g');
      index += 2;
      continue;
    }

    if (VOWEL_DIGRAPHS[pair]) {
      out.push(VOWEL_DIGRAPHS[pair]);
      index += 2;
      continue;
    }

    const char = word[index];

    // Final silent e after a consonant, as in "make" or "time".
    if (
      char === 'e' &&
      index === word.length - 1 &&
      index >= 2 &&
      !/[aeiouy]/.test(word[index - 1])
    ) {
      index += 1;
      continue;
    }

    if (SINGLE_VOWELS[char]) {
      out.push(SINGLE_VOWELS[char]);
      index += 1;
      continue;
    }

    if (char === 'c') {
      const next = word[index + 1] ?? '';
      out.push(/[eiy]/.test(next) ? 's' : 'k');
      index += 1;
      continue;
    }
    if (char === 'g') {
      const next = word[index + 1] ?? '';
      out.push(/[eiy]/.test(next) ? 'dʒ' : 'g');
      index += 1;
      continue;
    }
    if (char === 'x') {
      out.push('k', 's');
      index += 1;
      continue;
    }
    if (char === 'y') {
      out.push(index === 0 ? 'j' : 'ɪ');
      index += 1;
      continue;
    }

    if (SINGLE_CONSONANTS[char]) {
      // Collapse doubled consonants: "letter" is /letə/, not /lettə/.
      if (word[index + 1] === char) index += 1;
      out.push(SINGLE_CONSONANTS[char]);
      index += 1;
      continue;
    }

    index += 1;
  }

  return out;
}

function phonemizeStem(word: string): string[] {
  const direct = PHONEME_LEXICON[word];
  if (direct) return tokenizeIPA(direct);
  return ruleStem(word);
}

/**
 * Converts an English word to a phoneme sequence.
 *
 * Known words use the shipped IPA lexicon. Unknown words use the documented
 * rule fallback, which is approximate and deliberately labelled as such in the
 * report.
 */
export function phonemizeWord(raw: string): string[] {
  const word = normalizeEnglishWord(raw);
  if (!word) return [];

  const direct = PHONEME_LEXICON[word];
  if (direct) return tokenizeIPA(direct);

  if (word.endsWith("'s") && word.length > 2) {
    const base = word.slice(0, -2);
    const tail = /[ptkfθsʃ]$/.test(base) ? 's' : 'z';
    return [...phonemizeStem(base), tail];
  }
  if (word.endsWith("s'") && word.length > 2) {
    const base = word.slice(0, -2);
    const tail = /[ptkfθsʃ]$/.test(base) ? 's' : 'z';
    return [...phonemizeStem(base), tail];
  }

  for (const [suffix, phonemes] of SUFFIXES) {
    if (word.length > suffix.length + 1 && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      if (stem.length >= 2) {
        return [...phonemizeStem(stem), ...phonemes];
      }
    }
  }

  return ruleStem(word);
}

/** Levenshtein distance between two phoneme sequences. */
export function phonemeDistance(reference: string[], spoken: string[]): number {
  const rows = reference.length + 1;
  const cols = spoken.length + 1;
  let previous = new Array<number>(cols);
  let current = new Array<number>(cols);
  for (let col = 0; col < cols; col += 1) previous[col] = col;

  for (let row = 1; row < rows; row += 1) {
    current[0] = row;
    for (let col = 1; col < cols; col += 1) {
      const substitution =
        previous[col - 1] + (reference[row - 1] === spoken[col - 1] ? 0 : 1);
      current[col] = Math.min(previous[col] + 1, current[col - 1] + 1, substitution);
    }
    [previous, current] = [current, previous];
  }
  return previous[cols - 1];
}

export type PhonemeOperationKind = 'match' | 'substitute' | 'missing' | 'extra';

export interface PhonemeOperation {
  kind: PhonemeOperationKind;
  reference?: string;
  spoken?: string;
}

export interface PhonemeComparison {
  reference: string[];
  spoken: string[];
  distance: number;
  score: number;
  operations: PhonemeOperation[];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Aligns two phoneme sequences and returns an edit script for the UI.
 *
 * A missing phoneme means the recogniser heard nothing at that position; an
 * extra phoneme means it heard something the expected word does not contain.
 */
export function comparePhonemes(reference: string[], spoken: string[]): PhonemeComparison {
  const rows = reference.length + 1;
  const cols = spoken.length + 1;
  const cost: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let row = 0; row < rows; row += 1) cost[row][0] = row;
  for (let col = 0; col < cols; col += 1) cost[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const same = reference[row - 1] === spoken[col - 1];
      cost[row][col] = Math.min(
        cost[row - 1][col] + 1,
        cost[row][col - 1] + 1,
        cost[row - 1][col - 1] + (same ? 0 : 1)
      );
    }
  }

  const operations: PhonemeOperation[] = [];
  let row = reference.length;
  let col = spoken.length;
  while (row > 0 || col > 0) {
    const same =
      row > 0 && col > 0 && reference[row - 1] === spoken[col - 1];
    if (row > 0 && col > 0 && cost[row][col] === cost[row - 1][col - 1] + (same ? 0 : 1)) {
      operations.push(
        same
          ? { kind: 'match', reference: reference[row - 1], spoken: spoken[col - 1] }
          : { kind: 'substitute', reference: reference[row - 1], spoken: spoken[col - 1] }
      );
      row -= 1;
      col -= 1;
    } else if (col > 0 && cost[row][col] === cost[row][col - 1] + 1) {
      operations.push({ kind: 'extra', spoken: spoken[col - 1] });
      col -= 1;
    } else {
      operations.push({ kind: 'missing', reference: reference[row - 1] });
      row -= 1;
    }
  }
  operations.reverse();

  const distance = cost[reference.length][spoken.length];
  const denominator = Math.max(reference.length, spoken.length, 1);
  return {
    reference,
    spoken,
    distance,
    score: Math.round(clamp01(1 - distance / denominator) * 100) / 100,
    operations,
  };
}

/** Compares the expected and recognised pronunciations of one word pair. */
export function compareWordPronunciation(referenceWord: string, spokenWord: string): PhonemeComparison {
  return comparePhonemes(phonemizeWord(referenceWord), phonemizeWord(spokenWord));
}

/** Renders a phoneme list with a leading/trailing slash for display. */
export function formatPhonemes(phonemes: string[]): string {
  return `/${phonemes.join('')}/`;
}
