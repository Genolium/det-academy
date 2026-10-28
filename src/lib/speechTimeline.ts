/**
 * Turns browser speech-recognition events into approximate word timings.
 *
 * The Web Speech API returns transcript segments but no timestamps. Each time a
 * new word appears in the interim or final segment we stamp its arrival with the
 * current clock, then split the interval since the previous stamp by syllable
 * count. The result is an estimate with roughly ±0.3–0.5 s precision depending
 * on the browser. It is labelled `asr-segment-arrivals` everywhere and later
 * trimmed to the measured voiced intervals of the recording.
 *
 * Pure and deterministic: the caller supplies the clock.
 */

import { estimateSyllables, normalizeWord, tokenizeWords, type WordTiming } from './pronunciationAnalysis';

export interface AsrSegmentSnapshot {
  transcript: string;
  /** `SpeechRecognitionAlternative.confidence` when the browser provides it. */
  confidence?: number;
  isFinal: boolean;
}

const MIN_WORD_SECONDS = 0.06;

function allocate(
  words: string[],
  fromMs: number,
  toMs: number,
  confidence: number | undefined
): WordTiming[] {
  if (words.length === 0) return [];
  const span = Math.max(words.length * MIN_WORD_SECONDS * 1000, toMs - fromMs);
  const weights = words.map((word) => estimateSyllables(word));
  const total = weights.reduce((sum, weight) => sum + weight, 0) || words.length;
  let cursor = fromMs;

  return words.map((word, index) => {
    const share = weights[index] / total;
    const start = cursor;
    cursor = index === words.length - 1 ? fromMs + span : cursor + span * share;
    const result: WordTiming = {
      word,
      start: Math.max(0, start / 1000),
      end: Math.max(0, cursor / 1000),
    };
    if (confidence !== undefined && confidence > 0) {
      result.confidence = Math.round(confidence * 1000) / 1000;
    }
    return result;
  });
}

export class SpeechTimeline {
  private readonly startedAtMs: number;
  private lastMarkMs: number;
  private words: WordTiming[] = [];

  constructor(startedAtMs: number) {
    this.startedAtMs = Math.max(0, startedAtMs);
    this.lastMarkMs = this.startedAtMs;
  }

  /**
   * Consumes one `SpeechRecognition.onresult` event.
   *
   * `segments` mirrors `event.results` in order and is joined into the full
   * transcript. Words that already exist with the same text keep their stamps;
   * only the changed tail is re-stamped. This is what keeps an interim phrase
   * from collapsing into the last event interval when the final result arrives.
   */
  ingest(segments: AsrSegmentSnapshot[], nowMs: number): void {
    const safeNow = Math.max(nowMs, this.lastMarkMs + 1);

    const tokens: Array<{ word: string; confidence?: number }> = [];
    for (const segment of segments) {
      for (const word of tokenizeWords(segment.transcript)) {
        tokens.push({ word, confidence: segment.confidence });
      }
    }
    if (tokens.length === 0) {
      this.lastMarkMs = safeNow;
      return;
    }

    const previous = this.words;
    let prefix = 0;
    while (
      prefix < tokens.length &&
      prefix < previous.length &&
      normalizeWord(tokens[prefix].word) === normalizeWord(previous[prefix].word)
    ) {
      prefix += 1;
    }

    const kept = previous.slice(0, prefix).map((word, index) => ({
      ...word,
      word: tokens[index].word,
    }));

    // When only new words were appended, they start at the previous event.
    // When the tail was revised, re-stamp it from the first replaced word.
    const fromMs =
      prefix < previous.length
        ? previous[prefix].start * 1000
        : this.lastMarkMs - this.startedAtMs;
    const fresh = tokens.slice(prefix).map((token) => token.word);
    const freshConfidence = tokens[prefix]?.confidence;

    this.words = [
      ...kept,
      ...allocate(fresh, fromMs, safeNow - this.startedAtMs, freshConfidence),
    ];
    this.lastMarkMs = safeNow;
  }

  /** Closes the timeline and returns monotonic word timings in seconds. */
  finish(endedAtMs?: number): WordTiming[] {
    const endMs = Math.max(endedAtMs ?? this.lastMarkMs, this.lastMarkMs);
    const all = this.words.filter((word) => normalizeWord(word.word).length > 0);
    if (all.length === 0) return [];

    const lastIndex = all.length - 1;
    const relativeEnd = Math.max(0, (endMs - this.startedAtMs) / 1000);
    all[lastIndex] = {
      ...all[lastIndex],
      end: Math.max(all[lastIndex].end, relativeEnd),
    };

    let previousEnd = 0;
    return all.map((word, index) => {
      const start = Math.max(previousEnd, Math.max(0, word.start));
      let end = Math.max(start + MIN_WORD_SECONDS, word.end);
      if (index < lastIndex) {
        end = Math.min(end, Math.max(start + MIN_WORD_SECONDS, all[index + 1].start));
      }
      previousEnd = end;
      return {
        ...word,
        start: Math.round(start * 1000) / 1000,
        end: Math.round(end * 1000) / 1000,
      };
    });
  }
}

/**
 * Last-resort timings when the recognition timeline is unavailable.
 *
 * This distributes words evenly over the recording. It is deliberately marked
 * as `uniform-estimate` so the report never pretends the boundaries were
 * measured.
 */
export function estimateUniformTimings(transcript: string, durationSec: number): WordTiming[] {
  const words = tokenizeWords(transcript);
  if (words.length === 0 || durationSec <= 0) return [];
  const weights = words.map((word) => estimateSyllables(word));
  const total = weights.reduce((sum, weight) => sum + weight, 0) || words.length;
  let cursor = 0;
  return words.map((word, index) => {
    const span = (durationSec * weights[index]) / total;
    const start = cursor;
    cursor += span;
    return {
      word,
      start: Math.round(start * 1000) / 1000,
      end: Math.round(cursor * 1000) / 1000,
    };
  });
}
