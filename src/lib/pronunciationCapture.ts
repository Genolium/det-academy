/**
 * Browser glue for word-level pronunciation clarity analysis.
 *
 * Decodes the recorded answer with the Web Audio API, finds the intervals that
 * actually contain speech, trims the approximate recogniser timings to them and
 * measures every word. Returns `null` — never a fabricated result — when the
 * audio cannot be decoded or nothing could be measured.
 */

import {
  buildPronunciationReport,
  detectVoicedSegments,
  measureWindow,
  refineTimingsToSpeech,
  voicedThresholdDb,
  type PronunciationReport,
  type PronunciationTimingSource,
  type WordAcousticFeatures,
  type WordTiming,
} from '@/lib/pronunciationAnalysis';

export interface CapturePronunciationOptions {
  durationSec: number;
  referenceText?: string;
  /** Prompt text offered for reference playback; never used for alignment. */
  playbackText?: string;
  timingSource?: PronunciationTimingSource;
}

type AudioContextConstructor = typeof AudioContext;

const DECODE_TIMEOUT_MS = 5000;

function resolveAudioContext(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const candidate =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  return candidate ?? null;
}

export async function capturePronunciationReport(
  blob: Blob,
  words: WordTiming[],
  options: CapturePronunciationOptions
): Promise<PronunciationReport | null> {
  if (typeof window === 'undefined' || words.length === 0) return null;
  const AudioCtx = resolveAudioContext();
  if (!AudioCtx || blob.size === 0) return null;

  let context: AudioContext | null = null;
  try {
    context = new AudioCtx();
    const encoded = await blob.arrayBuffer();
    // Decoding runs before the upload; never let a pathological file block the
    // learner's answer. The report is optional.
    const buffer = await Promise.race([
      context.decodeAudioData(encoded.slice(0)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('decode timeout')), DECODE_TIMEOUT_MS)
      ),
    ]);
    if (buffer.numberOfChannels === 0 || buffer.length === 0) return null;

    // Channel 0 is enough for clarity metrics and keeps memory predictable for
    // three-minute answers.
    const samples = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const segments = detectVoicedSegments(samples, sampleRate);
    const refined = refineTimingsToSpeech(words, segments);
    const threshold = voicedThresholdDb(samples, sampleRate);
    const features: Array<WordAcousticFeatures | null> = refined.map((word) =>
      measureWindow(samples, sampleRate, word.start, word.end, threshold)
    );

    const speechSeconds = segments.reduce(
      (total, segment) => total + (segment.end - segment.start),
      0
    );
    const durationSec =
      options.durationSec > 0
        ? Math.max(options.durationSec, buffer.duration)
        : buffer.duration;

    return buildPronunciationReport({
      words: refined,
      features,
      durationSec,
      timingSource: options.timingSource ?? 'asr-segment-arrivals',
      referenceText: options.referenceText,
      referencePlaybackText: options.playbackText,
      speechCoverage: durationSec > 0 ? Math.min(1, speechSeconds / durationSec) : 0,
    });
  } catch {
    return null;
  } finally {
    try {
      await context?.close();
    } catch {
      // Closing an already-closed context is harmless.
    }
  }
}
