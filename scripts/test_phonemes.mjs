#!/usr/bin/env node
/**
 * Deterministic phoneme tests. Run through `npm run test:phonemes`, which
 * compiles the TypeScript modules first (the app itself has no unit runner).
 */
import assert from 'node:assert/strict';
import {
  comparePhonemes,
  compareWordPronunciation,
  formatPhonemes,
  phonemeDistance,
  phonemizeWord,
  tokenizeIPA,
} from '../.tmp-phonemes/phonemes.js';
import { buildPronunciationReport } from '../.tmp-phonemes/pronunciationAnalysis.js';

const checks = [];
const check = (name, fn) => {
  fn();
  checks.push(name);
};

check('IPA tokenizer keeps length and digraphs', () => {
  assert.deepEqual(tokenizeIPA('/ˈwɜːk/'), ['w', 'ɜː', 'k']);
  assert.deepEqual(tokenizeIPA('/tʃeɪn/'), ['tʃ', 'eɪ', 'n']);
  assert.deepEqual(tokenizeIPA('/ˈdʒʌdʒ/'), ['dʒ', 'ʌ', 'dʒ']);
});

check('lexicon and suffix rules produce the expected phonemes', () => {
  assert.deepEqual(phonemizeWord('work'), ['w', 'ɜː', 'k']);
  assert.deepEqual(phonemizeWord('working'), ['w', 'ɜː', 'k', 'ɪ', 'ŋ']);
  assert.deepEqual(phonemizeWord('question'), ['k', 'w', 'e', 's', 'tʃ', 'ə', 'n']);
  assert.equal(formatPhonemes(['w', 'ɜː', 'k']), '/wɜːk/');
});

check('phoneme distance is a real Levenshtein distance', () => {
  assert.equal(phonemeDistance([], []), 0);
  assert.equal(phonemeDistance(['k', 'æ', 't'], ['k', 'æ', 't']), 0);
  assert.equal(phonemeDistance(['k', 'æ', 't'], ['k', 'ʌ', 't']), 1);
  assert.equal(phonemeDistance(['k', 'æ', 't'], ['k', 'æ', 't', 's']), 1);
});

check('word comparison reports substitutions with an edit script', () => {
  const comparison = compareWordPronunciation('work', 'walk');
  assert.equal(comparison.distance, 1);
  assert.equal(comparison.score, 0.67);
  assert.deepEqual(
    comparison.operations.map((operation) => operation.kind),
    ['match', 'substitute', 'match']
  );
});

check('identical sequences score one and empty input is rejected honestly', () => {
  assert.equal(comparePhonemes(['k', 'æ', 't'], ['k', 'æ', 't']).score, 1);
  assert.equal(comparePhonemes(['k', 'æ', 't'], []).score, 0);
});

check('report attaches per-word phonemes and an overall phoneme score', () => {
  const features = [{ voicedRatio: 0.9, rmsDb: -20, zcr: 0.1, durationSec: 0.4 }];
  const report = buildPronunciationReport({
    words: [{ word: 'work', start: 0, end: 0.4 }],
    features,
    durationSec: 0.6,
    timingSource: 'asr-segment-arrivals',
    referenceText: 'walk',
  });
  assert.ok(report);
  assert.equal(report.version, 2);
  assert.equal(report.method, 'g2p-phoneme-alignment');
  assert.deepEqual(report.words[0].referencePhonemes, ['w', 'ɔː', 'k']);
  assert.deepEqual(report.words[0].spokenPhonemes, ['w', 'ɜː', 'k']);
  assert.equal(report.words[0].phonemeDistance, 1);
  assert.equal(report.words[0].phonemeScore, 0.67);
  assert.equal(report.phonemeScore, 0.67);
  assert.equal(report.phonemeMeasuredWords, 1);
  assert.equal(report.phonemeModel, 'lexicon+rule-g2p');
  assert.ok(report.notes.some((note) => note.includes('не из акустической модели')));
});

console.log(`phoneme tests passed: ${checks.length}`);
for (const name of checks) console.log(`  ok ${name}`);
