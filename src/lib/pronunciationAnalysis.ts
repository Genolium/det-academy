import { compareWordPronunciation, PHONEME_METHOD, PHONEME_MODEL } from './phonemes';

/**
 * Word-level pronunciation analysis.
 *
 * IMPORTANT — what this module measures and what it does not.
 *
 * The configured STT provider (Yandex SpeechKit v1 `stt:recognize`) returns a
 * plain transcript without word timings, confidence or phoneme posteriors.
 * Phonemes are therefore derived from the transcript and the expected text with
 * a lexicon + rule G2P, then aligned. This is a text-level phoneme comparison,
 * not an acoustic accuracy measurement, and the report says so explicitly.
 *
 * What it does compute, from the learner's own recording:
 *   - word boundaries, taken from the browser recogniser's segment arrivals
 *     (approximate, later trimmed to measured voiced intervals);
 *   - per-word voicing (`voicedRatio`), loudness (`rmsDb`) and a
 *     zero-crossing-rate articulation proxy (`zcr`);
 *   - a clarity index per word, relative to the same speaker's median word,
 *     which cancels most microphone gain differences;
 *   - optional word alignment against a reference text (read-aloud tasks).
 *
 * All functions are pure and deterministic so they can be tested with fixed
 * numeric fixtures. Everything that touches the microphone or the decoder lives
 * in `pronunciationCapture.ts`.
 */

export const PRONUNCIATION_METHOD = PHONEME_METHOD;

export type PronunciationMethod = typeof PRONUNCIATION_METHOD;

export type PronunciationIssue =
  | 'quiet'
  | 'unclear'
  | 'muffled'
  | 'unexpected'
  | 'low-confidence';

export type PronunciationTimingSource = 'asr-segment-arrivals' | 'uniform-estimate';

export interface WordTiming {
  word: string;
  /** Seconds from the start of the recording. */
  start: number;
  /** Seconds from the start of the recording. Inclusive. */
  end: number;
  /** Recogniser confidence when the browser exposes it (0..1). */
  confidence?: number;
}

export interface VoicedSegment {
  start: number;
  end: number;
}

export interface WordAcousticFeatures {
  /** Share of 30 ms frames in the word window above the noise floor. */
  voicedRatio: number;
  /** RMS level of the window in dBFS. */
  rmsDb: number;
  /** Zero crossings per sample — a cheap articulation/brightness proxy. */
  zcr: number;
  durationSec: number;
}

export interface PronunciationWordResult extends WordTiming {
  /** Delivery clarity index 0..1 (voicing, loudness, articulation). */
  score: number;
  issue?: PronunciationIssue;
  /** Expected word when a reference text was supplied. */
  referenceWord?: string;
  /** Expected phonemes from the IPA lexicon or the rule fallback. */
  referencePhonemes?: string[];
  /** Phonemes derived from the recognised word with the same G2P. */
  spokenPhonemes?: string[];
  /** Phoneme-level Levenshtein distance for this word pair. */
  phonemeDistance?: number;
  /** 1 - distance / max(lengths), 0..1. */
  phonemeScore?: number;
}

export interface PronunciationReport {
  version: 1 | 2;
  method: PronunciationMethod;
  /** Mean word clarity, 0..1. */
  overallScore: number;
  words: PronunciationWordResult[];
  timingSource: PronunciationTimingSource;
  durationSec: number;
  /** Number of words with a real acoustic measurement. */
  measuredWords: number;
  referenceText?: string;
  /**
   * Text offered for reference playback (the task prompt). It is never used for
   * alignment — the prompt is not a transcript of the expected answer.
   */
  referencePlaybackText?: string;
  /** Share of reference words the recogniser matched (read-aloud only). */
  referenceMatchRate?: number;
  /** Mean phoneme score over aligned word pairs, 0..1. */
  phonemeScore?: number;
  /** Number of word pairs with a phoneme comparison. */
  phonemeMeasuredWords?: number;
  /** Identifies the G2P model behind the phoneme comparison. */
  phonemeModel?: string;
  /** Non-fatal data-quality notes shown in the UI. */
  notes: string[];
}

export interface BuildReportInput {
  words: WordTiming[];
  /** `null` when a word window could not be measured (too short / silent). */
  features: Array<WordAcousticFeatures | null>;
  durationSec: number;
  timingSource: PronunciationTimingSource;
  referenceText?: string;
  /** Prompt text for reference playback; never aligned. */
  referencePlaybackText?: string;
  /** Fraction of the recording covered by measured speech, 0..1. */
  speechCoverage?: number;
}

const MIN_WORD_SECONDS = 0.06;
const FRAME_SECONDS = 0.03;
const HOP_SECONDS = 0.01;
const SILENCE_FLOOR_DB = -60;
const VOICED_MARGIN_DB = 8;

/** Lower-cases and strips punctuation while keeping inner apostrophes. */
export function normalizeWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9']/g, '')
    .replace(/^'+|'+$/g, '');
}

export function tokenizeWords(text: string): string[] {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/[^A-Za-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^-+|-+$/g, ''))
    .filter((word) => normalizeWord(word).length > 0);
}

/**
 * Rough syllable count used only to distribute word timings inside a voiced
 * interval. English vowel groups are a decent deterministic approximation.
 */
export function estimateSyllables(word: string): number {
  const clean = normalizeWord(word).replace(/[^a-z]/g, '');
  if (!clean) return 1;
  const groups = clean.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  if (clean.length > 3 && /[^aeiouy]e$/.test(clean)) {
    count -= 1;
  }
  return Math.max(1, count);
}

function roundSeconds(value: number): number {
  return Math.round(Math.max(0, value) * 1000) / 1000;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function median(values: number[]): number {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (finite.length === 0) return 0;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2 === 0 ? (finite[middle - 1] + finite[middle]) / 2 : finite[middle];
}

function percentile(values: number[], ratio: number): number {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (finite.length === 0) return 0;
  const index = Math.max(0, Math.min(finite.length - 1, Math.round((finite.length - 1) * ratio)));
  return finite[index];
}

function rmsDbOf(samples: Float32Array, from: number, to: number): number {
  let sumSquares = 0;
  const count = Math.max(1, to - from);
  for (let index = from; index < to; index += 1) {
    const value = samples[index];
    sumSquares += value * value;
  }
  const rms = Math.sqrt(sumSquares / count);
  return 20 * Math.log10(rms + 1e-7);
}

/** Per-frame RMS levels in dBFS (30 ms frames, 10 ms hop). */
export function frameLevels(samples: Float32Array, sampleRate: number): number[] {
  const frame = Math.max(1, Math.round(sampleRate * FRAME_SECONDS));
  const hop = Math.max(1, Math.round(sampleRate * HOP_SECONDS));
  const levels: number[] = [];
  if (samples.length < frame) return levels;
  for (let start = 0; start + frame <= samples.length; start += hop) {
    levels.push(rmsDbOf(samples, start, start + frame));
  }
  return levels;
}

/**
 * The single voicing threshold used for a recording: its own noise floor plus
 * 8 dB, never below -60 dBFS. Callers that measure individual words reuse the
 * value so every word is judged against the same floor.
 */
export function voicedThresholdDb(samples: Float32Array, sampleRate: number): number {
  const levels = frameLevels(samples, sampleRate);
  if (levels.length === 0) return SILENCE_FLOOR_DB;
  const floor = Math.max(percentile(levels, 0.1), SILENCE_FLOOR_DB);
  return Math.max(floor + VOICED_MARGIN_DB, SILENCE_FLOOR_DB);
}

/**
 * Finds voiced intervals from frame energy.
 *
 * The noise floor is the 10th percentile of frame levels, so the detector
 * adapts to any microphone gain. Frames more than 8 dB above that floor (and
 * above -60 dBFS) count as speech. Very short blips are discarded and short
 * gaps are merged to avoid splitting words on stop consonants.
 */
export function detectVoicedSegments(
  samples: Float32Array,
  sampleRate: number,
  options: { mergeGapSec?: number; minSegmentSec?: number } = {}
): VoicedSegment[] {
  const levels = frameLevels(samples, sampleRate);
  if (levels.length === 0) return [];
  const threshold = voicedThresholdDb(samples, sampleRate);

  const raw: VoicedSegment[] = [];
  let start: number | null = null;
  levels.forEach((level, index) => {
    const isVoiced = level > threshold;
    if (isVoiced && start === null) {
      start = index * HOP_SECONDS;
    } else if (!isVoiced && start !== null) {
      raw.push({ start, end: index * HOP_SECONDS + FRAME_SECONDS });
      start = null;
    }
  });
  if (start !== null) {
    raw.push({ start, end: (levels.length - 1) * HOP_SECONDS + FRAME_SECONDS });
  }

  const mergeGap = options.mergeGapSec ?? 0.16;
  const minSegment = options.minSegmentSec ?? 0.08;
  const merged: VoicedSegment[] = [];
  for (const segment of raw) {
    const previous = merged[merged.length - 1];
    if (previous && segment.start - previous.end <= mergeGap) {
      previous.end = segment.end;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged
    .filter((segment) => segment.end - segment.start >= minSegment)
    .map((segment) => ({ start: roundSeconds(segment.start), end: roundSeconds(segment.end) }));
}

function overlap(start: number, end: number, segment: VoicedSegment): number {
  return Math.max(0, Math.min(end, segment.end) - Math.max(start, segment.start));
}

/**
 * Trims word windows to measured voiced intervals and keeps them ordered.
 *
 * ASR segment arrivals are approximate: a word may be stamped while the
 * previous word is still being uttered. Using the measured voiced intervals
 * makes the window we analyse actually contain speech. If a window misses all
 * speech, the nearest interval is used; a word is never expanded beyond it.
 */
export function refineTimingsToSpeech(words: WordTiming[], segments: VoicedSegment[]): WordTiming[] {
  if (segments.length === 0) return words;

  let previousEnd = 0;
  return words.map((word) => {
    const midpoint = (word.start + word.end) / 2;
    let best: VoicedSegment | null = null;
    let bestOverlap = 0;
    for (const segment of segments) {
      const value = overlap(word.start, word.end, segment);
      if (value > bestOverlap) {
        bestOverlap = value;
        best = segment;
      }
    }
    if (!best) {
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const segment of segments) {
        const distance =
          midpoint < segment.start
            ? segment.start - midpoint
            : midpoint > segment.end
            ? midpoint - segment.end
            : 0;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = segment;
        }
      }
    }
    if (!best) return word;

    let start = bestOverlap > 0 ? Math.max(word.start, best.start) : best.start;
    let end = bestOverlap > 0 ? Math.min(word.end, best.end) : best.end;
    start = Math.max(start, previousEnd);
    if (end - start < MIN_WORD_SECONDS) {
      end = Math.min(best.end, start + MIN_WORD_SECONDS);
      if (end - start < MIN_WORD_SECONDS) {
        start = Math.max(previousEnd, Math.min(start, best.end - MIN_WORD_SECONDS));
        end = Math.min(best.end, start + MIN_WORD_SECONDS);
      }
    }
    if (end <= start) {
      end = start + MIN_WORD_SECONDS;
    }
    previousEnd = end;
    return { ...word, start: roundSeconds(start), end: roundSeconds(end) };
  });
}

/** Measures voicing, loudness and articulation inside one word window. */
export function measureWindow(
  samples: Float32Array,
  sampleRate: number,
  start: number,
  end: number,
  voicedThresholdDb?: number
): WordAcousticFeatures | null {
  const from = Math.max(0, Math.floor(start * sampleRate));
  const to = Math.min(samples.length, Math.ceil(end * sampleRate));
  if (to - from < sampleRate * 0.01) return null;

  const window = samples.subarray(from, to);
  const levels = frameLevels(window, sampleRate);
  // A shared recording-wide threshold should be supplied; a window in isolation
  // cannot infer its own noise floor (a fully voiced window has none).
  const threshold = voicedThresholdDb ?? SILENCE_FLOOR_DB;
  const voicedFrames = levels.filter((level) => level > threshold).length;

  let crossings = 0;
  for (let index = 1; index < window.length; index += 1) {
    if ((window[index - 1] >= 0) !== (window[index] >= 0)) crossings += 1;
  }

  return {
    voicedRatio: levels.length > 0 ? clamp01(voicedFrames / levels.length) : 0,
    rmsDb: rmsDbOf(window, 0, window.length),
    zcr: crossings / window.length,
    durationSec: (to - from) / sampleRate,
  };
}

export type AlignmentKind = 'match' | 'substitute' | 'extra';

export interface WordAlignment {
  spokenIndex: number;
  referenceIndex: number | null;
  referenceWord: string | null;
  kind: AlignmentKind;
}

export interface AlignmentResult {
  alignments: WordAlignment[];
  missingReferenceWords: string[];
  matchedReferenceWords: number;
  referenceWordCount: number;
}

/**
 * Word-level Levenshtein alignment. A substituted word is still aligned so the
 * UI can show what the reader said instead; that is evidence of a possible
 * mispronunciation but also of an STT error, hence the neutral label.
 */
export function alignWords(reference: string[], spoken: string[]): AlignmentResult {
  const rows = reference.length + 1;
  const cols = spoken.length + 1;
  const cost: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let row = 0; row < rows; row += 1) cost[row][0] = row;
  for (let col = 0; col < cols; col += 1) cost[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const same = normalizeWord(reference[row - 1]) === normalizeWord(spoken[col - 1]);
      cost[row][col] = Math.min(
        cost[row - 1][col] + 1,
        cost[row][col - 1] + 1,
        cost[row - 1][col - 1] + (same ? 0 : 1)
      );
    }
  }

  const alignments: WordAlignment[] = new Array(spoken.length);
  const missingReferenceWords: string[] = [];
  let row = reference.length;
  let col = spoken.length;
  while (row > 0 || col > 0) {
    const same =
      row > 0 && col > 0 && normalizeWord(reference[row - 1]) === normalizeWord(spoken[col - 1]);
    if (row > 0 && col > 0 && cost[row][col] === cost[row - 1][col - 1] + (same ? 0 : 1)) {
      alignments[col - 1] = {
        spokenIndex: col - 1,
        referenceIndex: row - 1,
        referenceWord: reference[row - 1],
        kind: same ? 'match' : 'substitute',
      };
      row -= 1;
      col -= 1;
    } else if (col > 0 && cost[row][col] === cost[row][col - 1] + 1) {
      alignments[col - 1] = {
        spokenIndex: col - 1,
        referenceIndex: null,
        referenceWord: null,
        kind: 'extra',
      };
      col -= 1;
    } else {
      missingReferenceWords.push(reference[row - 1]);
      row -= 1;
    }
  }

  const matchedReferenceWords = alignments.filter((item) => item.kind === 'match').length;
  return {
    alignments: alignments.filter(Boolean),
    missingReferenceWords,
    matchedReferenceWords,
    referenceWordCount: reference.length,
  };
}

export interface ScoreWordContext {
  medianRmsDb: number;
  medianZcr: number;
  alignment?: WordAlignment;
  /** Recogniser confidence when available (0..1). */
  confidence?: number;
  /** Word text, used to avoid brightness penalties on very short words. */
  word?: string;
}

/**
 * Clarity index for one word.
 *
 * Penalties are relative to the speaker's own median word so a quiet microphone
 * does not lower the whole answer. Absolute voicing is still checked: a window
 * with no voiced frames cannot be a clear word. The result is a delivery
 * clarity proxy, not a phoneme score.
 */
export function scoreWord(
  features: WordAcousticFeatures,
  context: ScoreWordContext
): { score: number; issue?: PronunciationIssue } {
  let score = 1;

  if (features.voicedRatio < 0.5) {
    // A window with almost no voiced frames is silence, not a slightly unclear
    // word: at 0 voicing the penalty reaches 0.85, leaving a floor near 0.15.
    score -= Math.min(0.85, (0.5 - features.voicedRatio) * 1.7);
  }

  const relativeDb = features.rmsDb - context.medianRmsDb;
  if (relativeDb < -6) {
    score -= Math.min(0.3, (-6 - relativeDb) / 24);
  }

  // Very short words ("a", "I", "the") are naturally less bright; applying the
  // articulation proxy to them produces false "muffled" flags.
  const brightnessEligible = !context.word || normalizeWord(context.word).length >= 4;
  const darkArticulation =
    brightnessEligible && context.medianZcr > 0 && features.zcr < context.medianZcr * 0.6;

  if (darkArticulation && context.medianZcr > 0) {
    const ratio = features.zcr / context.medianZcr;
    score -= Math.min(0.2, (0.6 - ratio) * 0.35);
  }

  if (context.alignment?.kind === 'substitute' || context.alignment?.kind === 'extra') {
    score -= 0.35;
  }

  if (typeof context.confidence === 'number' && context.confidence > 0 && context.confidence < 0.7) {
    score -= Math.min(0.2, (0.7 - context.confidence) * 0.4);
  }

  if (typeof features.durationSec === 'number' && features.durationSec < MIN_WORD_SECONDS) {
    score -= 0.1;
  }

  score = clamp01(score);

  let issue: PronunciationIssue | undefined;
  if (features.voicedRatio < 0.45) issue = 'unclear';
  else if (relativeDb < -9) issue = 'quiet';
  else if (darkArticulation) issue = 'muffled';
  else if (context.alignment?.kind === 'substitute' || context.alignment?.kind === 'extra') {
    issue = 'unexpected';
  } else if (typeof context.confidence === 'number' && context.confidence > 0 && context.confidence < 0.55) {
    issue = 'low-confidence';
  }

  return { score: Math.round(score * 100) / 100, issue };
}

/** Builds the persisted report. Returns null when nothing could be measured. */
export function buildPronunciationReport(input: BuildReportInput): PronunciationReport | null {
  const durationSec = Math.max(0, input.durationSec);
  // Keep word and feature paired: dropping a malformed word must never shift
  // every following feature onto the wrong word.
  const entries = input.words
    .map((word, index) => {
      const normalized: WordTiming = {
        ...word,
        word: word.word.trim(),
        start: roundSeconds(Math.min(word.start, durationSec || word.start)),
        end: roundSeconds(Math.min(Math.max(word.end, word.start), durationSec || word.end)),
      };
      return { word: normalized, features: input.features[index] ?? null };
    })
    .filter(
      (entry) =>
        normalizeWord(entry.word.word).length > 0 &&
        (entry.word.end - entry.word.start >= 0.01 || entry.word.confidence !== undefined)
    );

  if (entries.length === 0) return null;

  const words = entries.map((entry) => entry.word);
  const referenceTokens = input.referenceText ? tokenizeWords(input.referenceText) : [];
  const spokenTokens = words.map((word) => word.word);
  const alignment = referenceTokens.length > 0 ? alignWords(referenceTokens, spokenTokens) : null;
  const alignmentByIndex = new Map<number, WordAlignment>();
  for (const item of alignment?.alignments ?? []) {
    alignmentByIndex.set(item.spokenIndex, item);
  }

  const measured = entries
    .map((entry) => entry.features)
    .filter((feature): feature is WordAcousticFeatures => Boolean(feature));
  if (measured.length === 0) return null;

  const medianRmsDb = median(measured.map((feature) => feature.rmsDb));
  const medianZcr = median(measured.map((feature) => feature.zcr));

  const results: PronunciationWordResult[] = [];
  let weightedSum = 0;
  let weightTotal = 0;
  let measuredWords = 0;
  let phonemeSum = 0;
  let phonemeMeasuredWords = 0;

  words.forEach((word, index) => {
    const features = entries[index].features;
    const item = alignmentByIndex.get(index);
    const comparison =
      item?.referenceWord && item.kind !== 'extra'
        ? compareWordPronunciation(item.referenceWord, word.word)
        : null;
    if (comparison) {
      phonemeSum += comparison.score;
      phonemeMeasuredWords += 1;
    }
    const phonemeFields = comparison
      ? {
          referencePhonemes: comparison.reference,
          spokenPhonemes: comparison.spoken,
          phonemeDistance: comparison.distance,
          phonemeScore: comparison.score,
        }
      : {};

    if (!features) {
      results.push({
        ...word,
        score: 0.35,
        issue: 'unclear',
        referenceWord: item?.referenceWord ?? undefined,
        ...phonemeFields,
      });
      weightedSum += 0.35 * Math.max(MIN_WORD_SECONDS, word.end - word.start);
      weightTotal += Math.max(MIN_WORD_SECONDS, word.end - word.start);
      return;
    }
    measuredWords += 1;
    const scored = scoreWord(features, {
      medianRmsDb,
      medianZcr,
      alignment: item,
      confidence: word.confidence,
      word: word.word,
    });
    results.push({
      ...word,
      start: roundSeconds(word.start),
      end: roundSeconds(word.end),
      score: scored.score,
      issue: scored.issue,
      referenceWord: item?.referenceWord ?? undefined,
      ...phonemeFields,
    });
    const weight = Math.max(MIN_WORD_SECONDS, word.end - word.start);
    weightedSum += scored.score * weight;
    weightTotal += weight;
  });

  const overallScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) / 100 : 0;
  const notes: string[] = [];
  if (input.timingSource === 'asr-segment-arrivals') {
    notes.push('Границы слов приблизительные: распознаватель не даёт точных меток времени.');
  }
  if (input.speechCoverage !== undefined && input.speechCoverage < 0.35) {
    notes.push('Мало речи в записи — оценка чёткости менее надёжна.');
  }
  if (phonemeMeasuredWords > 0) {
    notes.push(
      'Фонемы получены из текста распознавания и словаря/правил G2P, а не из акустической модели: это сравнение ожидаемых и услышанных фонем, не акустическая точность.'
    );
  }

  return {
    version: 2,
    method: PRONUNCIATION_METHOD,
    overallScore: clamp01(overallScore),
    words: results,
    timingSource: input.timingSource,
    durationSec: roundSeconds(durationSec),
    measuredWords,
    referenceText: input.referenceText,
    referencePlaybackText: input.referencePlaybackText?.trim() || undefined,
    referenceMatchRate:
      alignment && alignment.referenceWordCount > 0
        ? Math.round((alignment.matchedReferenceWords / alignment.referenceWordCount) * 100) / 100
        : undefined,
    phonemeScore:
      phonemeMeasuredWords > 0 ? Math.round((phonemeSum / phonemeMeasuredWords) * 100) / 100 : undefined,
    phonemeMeasuredWords: phonemeMeasuredWords > 0 ? phonemeMeasuredWords : undefined,
    phonemeModel: phonemeMeasuredWords > 0 ? PHONEME_MODEL : undefined,
    notes,
  };
}
