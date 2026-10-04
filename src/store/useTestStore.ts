import { create } from 'zustand';
import { CalculatedScores, computeFinalScores } from '@/lib/scoring';

export type StageName =
  | 'READ_SELECT'
  | 'FILL_BLANKS'
  | 'C_TEST'
  | 'LISTEN_TYPE'
  | 'INTERACTIVE_READING'
  | 'INTERACTIVE_LISTENING'
  | 'WRITE_PHOTO'
  | 'INTERACTIVE_WRITING'
  | 'WRITING_SAMPLE'
  | 'COMPLETED';

interface TestSessionState {
  sessionId: string;
  candidateName: string;
  currentStage: StageName;
  difficultyLevel: 'A2' | 'B1' | 'B2' | 'C1';

  // Metrics collection across stages
  readSelectCorrect: number;
  readSelectTotal: number;

  fillBlanksCorrect: number;
  fillBlanksTotal: number;

  cTestCorrect: number;
  cTestTotal: number;

  listenTypeSimilaritySum: number;
  listenTypeTotal: number;

  interactiveReadingScore: number; // 0..1
  interactiveListeningScore: number; // 0..1

  writePhotoTexts: string[];
  interactiveWritingTexts: { part1: string; part2: string };
  writingSampleText: string;

  finalScores: CalculatedScores | null;

  // Actions
  startNewSession: (candidateName?: string) => void;
  setStage: (stage: StageName) => void;
  recordReadSelectResult: (correct: number, total: number) => void;
  recordFillBlanksResult: (correct: number, total: number) => void;
  recordCTestResult: (correct: number, total: number) => void;
  recordListenTypeResult: (similarity: number) => void;
  recordInteractiveReadingResult: (score: number) => void;
  recordInteractiveListeningResult: (score: number) => void;
  recordWritePhotoResult: (texts: string[]) => void;
  recordInteractiveWritingResult: (part1: string, part2: string) => void;
  recordWritingSampleResult: (text: string) => void;
  finishTestAndCalculateScores: () => CalculatedScores;
}

export const useTestStore = create<TestSessionState>((set, get) => ({
  sessionId: '',
  candidateName: 'Candidate',
  currentStage: 'READ_SELECT',
  difficultyLevel: 'B1',

  readSelectCorrect: 0,
  readSelectTotal: 0,

  fillBlanksCorrect: 0,
  fillBlanksTotal: 0,

  cTestCorrect: 0,
  cTestTotal: 0,

  listenTypeSimilaritySum: 0,
  listenTypeTotal: 0,

  interactiveReadingScore: 0.8,
  interactiveListeningScore: 0.8,

  writePhotoTexts: [],
  interactiveWritingTexts: { part1: '', part2: '' },
  writingSampleText: '',

  finalScores: null,

  startNewSession: (candidateName = 'Candidate') => {
    const newSessionId = 'det-' + Math.random().toString(36).substring(2, 9);
    set({
      sessionId: newSessionId,
      candidateName,
      currentStage: 'READ_SELECT',
      difficultyLevel: 'B1',
      readSelectCorrect: 0,
      readSelectTotal: 0,
      fillBlanksCorrect: 0,
      fillBlanksTotal: 0,
      cTestCorrect: 0,
      cTestTotal: 0,
      listenTypeSimilaritySum: 0,
      listenTypeTotal: 0,
      interactiveReadingScore: 0.8,
      interactiveListeningScore: 0.8,
      writePhotoTexts: [],
      interactiveWritingTexts: { part1: '', part2: '' },
      writingSampleText: '',
      finalScores: null,
    });
  },

  setStage: (stage) => set({ currentStage: stage }),

  recordReadSelectResult: (correct, total) => {
    const accuracy = total > 0 ? correct / total : 0;
    // CAT Multi-Stage Testing transition:
    // If accuracy >= 80% -> elevate difficulty to B2/C1
    // If accuracy < 50% -> lower difficulty to A2/B1
    let nextDiff: 'A2' | 'B1' | 'B2' | 'C1' = 'B2';
    if (accuracy >= 0.8) nextDiff = 'C1';
    else if (accuracy < 0.5) nextDiff = 'A2';

    set((state) => ({
      readSelectCorrect: state.readSelectCorrect + correct,
      readSelectTotal: state.readSelectTotal + total,
      difficultyLevel: nextDiff,
    }));
  },

  recordFillBlanksResult: (correct, total) =>
    set((state) => ({
      fillBlanksCorrect: state.fillBlanksCorrect + correct,
      fillBlanksTotal: state.fillBlanksTotal + total,
    })),

  recordCTestResult: (correct, total) =>
    set((state) => ({
      cTestCorrect: state.cTestCorrect + correct,
      cTestTotal: state.cTestTotal + total,
    })),

  recordListenTypeResult: (similarity) =>
    set((state) => ({
      listenTypeSimilaritySum: state.listenTypeSimilaritySum + similarity,
      listenTypeTotal: state.listenTypeTotal + 1,
    })),

  recordInteractiveReadingResult: (score) => set({ interactiveReadingScore: score }),
  recordInteractiveListeningResult: (score) => set({ interactiveListeningScore: score }),
  recordWritePhotoResult: (texts) => set({ writePhotoTexts: texts }),
  recordInteractiveWritingResult: (part1, part2) =>
    set({ interactiveWritingTexts: { part1, part2 } }),
  recordWritingSampleResult: (text) => set({ writingSampleText: text }),

  finishTestAndCalculateScores: () => {
    const state = get();
    const rsRatio = state.readSelectTotal > 0 ? state.readSelectCorrect / state.readSelectTotal : 0.8;
    const fbRatio = state.fillBlanksTotal > 0 ? state.fillBlanksCorrect / state.fillBlanksTotal : 0.8;
    const ctRatio = state.cTestTotal > 0 ? state.cTestCorrect / state.cTestTotal : 0.8;
    const ltRatio = state.listenTypeTotal > 0 ? state.listenTypeSimilaritySum / state.listenTypeTotal : 0.85;

    // Writing volume and quality estimation
    const totalWords =
      state.writePhotoTexts.join(' ').split(/\s+/).filter(Boolean).length +
      state.interactiveWritingTexts.part1.split(/\s+/).filter(Boolean).length +
      state.interactiveWritingTexts.part2.split(/\s+/).filter(Boolean).length +
      state.writingSampleText.split(/\s+/).filter(Boolean).length;

    // 250+ total words across writing tasks yields high ratio
    const writingRatio = Math.min(1.0, Math.max(0.4, totalWords / 250));

    const scores = computeFinalScores({
      readSelectAccuracy: rsRatio,
      fillBlanksAccuracy: fbRatio,
      cTestAccuracy: ctRatio,
      listenTypeAccuracy: ltRatio,
      interactiveReadingScore: state.interactiveReadingScore,
      interactiveListeningScore: state.interactiveListeningScore,
      writingScore: writingRatio,
    });

    set({ finalScores: scores, currentStage: 'COMPLETED' });
    return scores;
  },
}));
