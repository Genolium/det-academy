/**
 * Shared glue between the speaking recorder and the pronunciation report.
 *
 * Keeps the four speaking screens from duplicating the Web Speech API shapes
 * and the "build report and attach it to the upload" sequence. Every failure is
 * silent: pronunciation feedback is optional and must never block an answer.
 */

import { capturePronunciationReport } from '@/lib/pronunciationCapture';
import type { WordTiming } from '@/lib/pronunciationAnalysis';
import type { AsrSegmentSnapshot } from '@/lib/speechTimeline';
import type { SpeechTimeline } from '@/lib/speechTimeline';

/** The subset of `SpeechRecognitionResult` we actually read. */
export interface RecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

export interface RecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: RecognitionAlternativeLike;
}

export interface RecognitionResultsLike {
  length: number;
  [index: number]: RecognitionResultLike;
}

export function toAsrSegments(results: RecognitionResultsLike): AsrSegmentSnapshot[] {
  const segments: AsrSegmentSnapshot[] = [];
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (!result || result.length === 0) continue;
    const alternative = result[0];
    const confidence =
      typeof alternative?.confidence === 'number' && alternative.confidence > 0
        ? alternative.confidence
        : undefined;
    segments.push({
      transcript: alternative?.transcript ?? '',
      confidence,
      isFinal: Boolean(result.isFinal),
    });
  }
  return segments;
}

export interface AppendPronunciationOptions {
  endedAtMs: number;
  durationSec: number;
  referenceText?: string;
  /** Prompt text offered for reference playback; never used for alignment. */
  playbackText?: string;
}

/**
 * Appends the optional `pronunciation` field to the upload using explicit word
 * timings (needed when a conversation has one recogniser per turn).
 */
export async function appendPronunciationReportFromWords(
  formData: FormData,
  blob: Blob,
  words: WordTiming[],
  options: AppendPronunciationOptions
) {
  if (words.length === 0) return null;
  try {
    const report = await capturePronunciationReport(blob, words, {
      durationSec: options.durationSec,
      referenceText: options.referenceText,
      playbackText: options.playbackText,
      timingSource: 'asr-segment-arrivals',
    });
    if (report) {
      formData.append('pronunciation', JSON.stringify(report));
    }
    return report;
  } catch {
    return null;
  }
}

/**
 * Appends the optional `pronunciation` field to the upload. Returns the report
 * when one was produced (useful for tests and debugging), otherwise null.
 */
export async function appendPronunciationReport(
  formData: FormData,
  blob: Blob,
  timeline: SpeechTimeline | null,
  options: AppendPronunciationOptions
) {
  if (!timeline) return null;
  return appendPronunciationReportFromWords(
    formData,
    blob,
    timeline.finish(options.endedAtMs),
    options
  );
}
