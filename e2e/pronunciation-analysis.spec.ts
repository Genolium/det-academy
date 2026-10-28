import { expect, test } from '@playwright/test';
import {
  alignWords,
  buildPronunciationReport,
  detectVoicedSegments,
  estimateSyllables,
  frameLevels,
  measureWindow,
  refineTimingsToSpeech,
  scoreWord,
  tokenizeWords,
  voicedThresholdDb,
  type WordAcousticFeatures,
  type WordTiming,
} from '../src/lib/pronunciationAnalysis';
import { SpeechTimeline, estimateUniformTimings } from '../src/lib/speechTimeline';

const SAMPLE_RATE = 16_000;

type Span = { from: number; to: number; amplitude: number; frequency?: number };

/**
 * Deterministic synthetic recording: sine tones separated by digital silence.
 * A "speech" segment keeps a fixed amplitude so loudness comparisons are exact.
 */
function makeRecording(spans: Span[], totalSeconds: number): Float32Array {
  const samples = new Float32Array(Math.round(totalSeconds * SAMPLE_RATE));
  for (const span of spans) {
    const from = Math.round(span.from * SAMPLE_RATE);
    const to = Math.min(samples.length, Math.round(span.to * SAMPLE_RATE));
    const frequency = span.frequency ?? 440;
    for (let index = from; index < to; index += 1) {
      const t = (index - from) / SAMPLE_RATE;
      samples[index] = span.amplitude * Math.sin(2 * Math.PI * frequency * t);
    }
  }
  return samples;
}

function features(overrides: Partial<WordAcousticFeatures> = {}): WordAcousticFeatures {
  return {
    voicedRatio: 0.9,
    rmsDb: -18,
    zcr: 0.06,
    durationSec: 0.4,
    ...overrides,
  };
}

test.describe('voiced interval detection', () => {
  test('finds two voiced islands separated by silence', () => {
    const samples = makeRecording(
      [
        { from: 0.5, to: 1.0, amplitude: 0.3 },
        { from: 1.5, to: 1.9, amplitude: 0.3 },
      ],
      2.5
    );

    const segments = detectVoicedSegments(samples, SAMPLE_RATE);
    expect(segments).toHaveLength(2);
    expect(segments[0].start).toBeGreaterThan(0.45);
    expect(segments[0].start).toBeLessThan(0.56);
    expect(segments[0].end).toBeGreaterThan(0.95);
    expect(segments[0].end).toBeLessThan(1.08);
    expect(segments[1].start).toBeGreaterThan(1.45);
    expect(segments[1].end).toBeLessThan(2.0);
  });

  test('adapts the threshold to a quiet recording', () => {
    const samples = makeRecording([{ from: 0.2, to: 0.8, amplitude: 0.01 }], 1.2);
    const threshold = voicedThresholdDb(samples, SAMPLE_RATE);
    const levels = frameLevels(samples, SAMPLE_RATE);
    const loudest = Math.max(...levels);
    expect(loudest).toBeGreaterThan(threshold);
    expect(detectVoicedSegments(samples, SAMPLE_RATE)).toHaveLength(1);
  });

  test('measures voicing and loudness inside one window', () => {
    const samples = makeRecording([{ from: 0.0, to: 1.0, amplitude: 0.3 }], 1.2);
    const threshold = voicedThresholdDb(samples, SAMPLE_RATE);
    const voiced = measureWindow(samples, SAMPLE_RATE, 0.1, 0.5, threshold);
    const silent = measureWindow(samples, SAMPLE_RATE, 1.0, 1.2, threshold);

    expect(voiced).not.toBeNull();
    expect(silent).not.toBeNull();
    expect(voiced!.voicedRatio).toBeGreaterThan(0.9);
    expect(silent!.voicedRatio).toBeLessThan(0.1);
    expect(voiced!.rmsDb).toBeGreaterThan(silent!.rmsDb + 40);
    // A 440 Hz tone crosses zero ~880 times per second.
    expect(voiced!.zcr).toBeGreaterThan(0.03);
    expect(voiced!.zcr).toBeLessThan(0.08);
  });

  test('refines approximate word timings onto measured speech', () => {
    const words: WordTiming[] = [
      { word: 'hello', start: 0.1, end: 0.45 },
      { word: 'world', start: 0.5, end: 0.95 },
    ];
    const refined = refineTimingsToSpeech(words, [{ start: 0.4, end: 1.0 }]);
    expect(refined[0].start).toBeGreaterThanOrEqual(0.4);
    expect(refined.every((word) => word.end > word.start)).toBe(true);
    expect(refined[0].end).toBeLessThanOrEqual(refined[1].start + 0.001);
  });
});

test.describe('word scoring', () => {
  const baseline = { medianRmsDb: -18, medianZcr: 0.06 };

  test('a clear word scores high', () => {
    const result = scoreWord(features(), baseline);
    expect(result.score).toBeGreaterThanOrEqual(0.95);
    expect(result.issue).toBeUndefined();
  });

  test('quieter words score lower and are flagged as quiet', () => {
    const quiet = scoreWord(features({ rmsDb: -34 }), baseline);
    const clear = scoreWord(features(), baseline);
    expect(quiet.score).toBeLessThan(clear.score);
    expect(quiet.issue).toBe('quiet');
  });

  test('unvoiced windows are flagged as unclear', () => {
    const unclear = scoreWord(features({ voicedRatio: 0.1 }), baseline);
    expect(unclear.score).toBeLessThan(0.7);
    expect(unclear.issue).toBe('unclear');
  });

  test('low articulation brightness is flagged as muffled', () => {
    const muffled = scoreWord(features({ zcr: 0.01 }), baseline);
    expect(muffled.issue).toBe('muffled');
    expect(muffled.score).toBeLessThan(1);
  });

  test('short function words are not flagged for natural low brightness', () => {
    const short = scoreWord(features({ zcr: 0.01 }), { ...baseline, word: 'a' });
    expect(short.issue).toBeUndefined();
    const long = scoreWord(features({ zcr: 0.01 }), { ...baseline, word: 'crowded' });
    expect(long.issue).toBe('muffled');
  });

  test('a substituted word is penalised and flagged', () => {
    const substituted = scoreWord(features(), {
      ...baseline,
      alignment: { spokenIndex: 2, referenceIndex: 2, referenceWord: 'fox', kind: 'substitute' },
    });
    expect(substituted.score).toBeLessThan(0.75);
    expect(substituted.issue).toBe('unexpected');
  });
});

test.describe('word alignment', () => {
  test('identical sequences match one-to-one', () => {
    const result = alignWords(['the', 'quick', 'fox'], ['the', 'quick', 'fox']);
    expect(result.alignments.map((item) => item.kind)).toEqual(['match', 'match', 'match']);
    expect(result.matchedReferenceWords).toBe(3);
    expect(result.missingReferenceWords).toEqual([]);
  });

  test('one wrong word becomes a substitution, not a deletion', () => {
    const result = alignWords(['the', 'quick', 'brown', 'fox'], ['the', 'quick', 'brown', 'box']);
    expect(result.matchedReferenceWords).toBe(3);
    expect(result.alignments[3].kind).toBe('substitute');
    expect(result.alignments[3].referenceWord).toBe('fox');
  });

  test('a skipped reference word is reported as missing', () => {
    const result = alignWords(['we', 'should', 'start', 'now'], ['we', 'start', 'now']);
    expect(result.missingReferenceWords).toEqual(['should']);
    expect(result.alignments).toHaveLength(3);
  });

  test('extra spoken words are marked as extra', () => {
    const result = alignWords(['we', 'start'], ['we', 'really', 'start']);
    expect(result.alignments.find((item) => item.kind === 'extra')?.spokenIndex).toBe(1);
  });
});

test.describe('pronunciation report', () => {
  const words: WordTiming[] = [
    { word: 'Yesterday', start: 0.1, end: 0.6 },
    { word: 'I', start: 0.65, end: 0.72 },
    { word: 'visited', start: 0.75, end: 1.3 },
    { word: 'a', start: 1.35, end: 1.4 },
    { word: 'gallery', start: 1.45, end: 2.1 },
  ];

  test('builds per-word results with an honest method label', () => {
    const report = buildPronunciationReport({
      words,
      features: [
        features({ rmsDb: -18 }),
        features({ rmsDb: -19, durationSec: 0.07 }),
        features({ rmsDb: -20 }),
        features({ rmsDb: -19 }),
        features({ rmsDb: -32, voicedRatio: 0.3 }),
      ],
      durationSec: 2.5,
      timingSource: 'asr-segment-arrivals',
    });

    expect(report).not.toBeNull();
    expect(report!.method).toBe('g2p-phoneme-alignment');
    expect(report!.version).toBe(2);
    expect(report!.words).toHaveLength(5);
    expect(report!.overallScore).toBeGreaterThan(0);
    expect(report!.overallScore).toBeLessThan(1);
    expect(report!.words[4].issue).toBe('unclear');
    expect(report!.words[0].score).toBeGreaterThan(report!.words[4].score);
    expect(report!.measuredWords).toBe(5);
    expect(report!.notes.join(' ')).toContain('приблизительные');
  });

  test('alignment against a reference lowers the match rate, not the clarity score', () => {
    const report = buildPronunciationReport({
      words: words.slice(0, 3),
      features: [features(), features(), features()],
      durationSec: 2.5,
      timingSource: 'asr-segment-arrivals',
      referenceText: 'Yesterday I visited the gallery',
    });
    expect(report!.referenceMatchRate).toBeCloseTo(0.6, 2);
    expect(report!.words[2].referenceWord).toBe('visited');
    expect(report!.overallScore).toBeGreaterThan(0.9);
  });

  test('never fabricates a report without measured audio', () => {
    const report = buildPronunciationReport({
      words,
      features: words.map(() => null),
      durationSec: 2.5,
      timingSource: 'asr-segment-arrivals',
    });
    expect(report).toBeNull();
  });

  test('keeps each word paired with its own features when a malformed word is skipped', () => {
    const report = buildPronunciationReport({
      words: [
        { word: '   ', start: 0, end: 0.4 },
        { word: 'clear', start: 0.4, end: 0.9 },
      ],
      features: [features({ rmsDb: -45 }), features({ rmsDb: -12 })],
      durationSec: 1,
      timingSource: 'asr-segment-arrivals',
    });
    expect(report!.words).toHaveLength(1);
    expect(report!.words[0].word).toBe('clear');
    // The surviving word must be scored against its own loud window, not the
    // skipped word's quiet feature.
    expect(report!.words[0].score).toBeGreaterThan(0.9);
  });

  test('end-to-end: synthetic audio becomes per-word clarity results', () => {
    const samples = makeRecording(
      [
        { from: 0.1, to: 0.5, amplitude: 0.3 },
        { from: 0.7, to: 1.0, amplitude: 0.3 },
        { from: 1.4, to: 1.7, amplitude: 0.02 },
      ],
      2.0
    );
    const segments = detectVoicedSegments(samples, SAMPLE_RATE);
    const words = refineTimingsToSpeech(
      [
        { word: 'open', start: 0.1, end: 0.5 },
        { word: 'the', start: 0.7, end: 1.0 },
        { word: 'door', start: 1.4, end: 1.7 },
      ],
      segments
    );
    const threshold = voicedThresholdDb(samples, SAMPLE_RATE);
    const report = buildPronunciationReport({
      words,
      features: words.map((word) => measureWindow(samples, SAMPLE_RATE, word.start, word.end, threshold)),
      durationSec: 2.0,
      timingSource: 'asr-segment-arrivals',
      referenceText: 'open the door',
    });

    expect(report).not.toBeNull();
    expect(report!.words.map((word) => word.word)).toEqual(['open', 'the', 'door']);
    expect(report!.referenceMatchRate).toBe(1);
    expect(report!.words[2].issue).toBe('quiet');
    expect(report!.words[2].score).toBeLessThan(report!.words[0].score);
  });

  test('clamps word boundaries to the recording duration', () => {
    const report = buildPronunciationReport({
      words: [{ word: 'tail', start: 2.0, end: 3.5 }],
      features: [features()],
      durationSec: 2.2,
      timingSource: 'asr-segment-arrivals',
    });
    expect(report!.words[0].end).toBeLessThanOrEqual(2.2);
  });
});

test.describe('speech timeline', () => {
  test('stamps interim words relative to the recording start', () => {
    const timeline = new SpeechTimeline(1000);
    timeline.ingest([{ transcript: 'hello world', isFinal: false }], 2000);
    const words = timeline.finish(2000);

    expect(words.map((word) => word.word)).toEqual(['hello', 'world']);
    expect(words[0].start).toBeGreaterThanOrEqual(0);
    expect(words[0].start).toBeLessThan(0.5);
    expect(words[1].end).toBeLessThanOrEqual(1.001);
  });

  test('final segments replace the interim tail and stay ordered', () => {
    const timeline = new SpeechTimeline(1000);
    timeline.ingest([{ transcript: 'the quick', isFinal: false }], 1500);
    timeline.ingest([{ transcript: 'the quick brown fox', isFinal: true }], 2500);
    timeline.ingest(
      [
        { transcript: 'the quick brown fox', isFinal: true },
        { transcript: 'jumps', isFinal: false },
      ],
      3000
    );
    const words = timeline.finish(3500);

    expect(words.map((word) => word.word)).toEqual([
      'the',
      'quick',
      'brown',
      'fox',
      'jumps',
    ]);
    for (let index = 1; index < words.length; index += 1) {
      expect(words[index].start).toBeGreaterThanOrEqual(words[index - 1].end - 0.001);
    }
    expect(words[words.length - 1].end).toBeCloseTo(2.5, 1);
  });

  test('finalising a phrase does not squeeze early words into the last interval', () => {
    const timeline = new SpeechTimeline(1000);
    timeline.ingest([{ transcript: 'alpha beta', isFinal: false }], 1500);
    timeline.ingest([{ transcript: 'alpha beta gamma', isFinal: true }], 2000);
    const words = timeline.finish(2000);

    expect(words.map((word) => word.word)).toEqual(['alpha', 'beta', 'gamma']);
    // "beta" kept its interim stamp (0.25–0.5 s) instead of being re-spread over
    // the whole final segment.
    expect(words[1].start).toBeCloseTo(0.25, 2);
    expect(words[1].end).toBeCloseTo(0.5, 2);
    expect(words[2].start).toBeCloseTo(0.5, 2);
  });

  test('keeps confidence when the recogniser exposes it', () => {
    const timeline = new SpeechTimeline(0);
    timeline.ingest([{ transcript: 'substantiate', isFinal: true, confidence: 0.42 }], 800);
    const words = timeline.finish(800);
    expect(words[0].confidence).toBeCloseTo(0.42, 2);
  });

  test('uniform fallback is deterministic and marked separately by the caller', () => {
    const first = estimateUniformTimings('one two three four', 4);
    const second = estimateUniformTimings('one two three four', 4);
    expect(first).toEqual(second);
    expect(first[0].start).toBe(0);
    expect(first[first.length - 1].end).toBeCloseTo(4, 2);
  });

  test('tokenisation and syllable estimation stay deterministic', () => {
    expect(tokenizeWords('Hello, world! It’s fine.')).toEqual(['Hello', 'world', "It's", 'fine']);
    expect(estimateSyllables('gallery')).toBe(3);
    expect(estimateSyllables('I')).toBe(1);
    expect(estimateSyllables('make')).toBe(1);
  });
});
