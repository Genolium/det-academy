import { create } from 'zustand';
import { CalculatedScores, computeFinalScores } from '@/lib/scoring';
import { evaluateWriteAboutPhoto, evaluateEssayWriting } from '@/lib/textEvaluator';
import { updateTheta2PL, DIFFICULTY_THETA_MAP } from '@/lib/irtCatEngine';
import { BackendQuestion } from '@/lib/api';

export type StageName =
  | 'READ_SELECT'
  | 'FILL_BLANKS'
  | 'C_TEST'
  | 'LISTEN_TYPE'
  | 'INTERACTIVE_READING'
  | 'INTERACTIVE_LISTENING'
  | 'WRITE_PHOTO'
  | 'INTERACTIVE_WRITING'
  | 'SPEAK_PHOTO'
  | 'READ_THEN_SPEAK'
  | 'INTERACTIVE_SPEAKING'
  | 'WRITING_SAMPLE'
  | 'SPEAKING_SAMPLE'
  | 'COMPLETED';

interface TestSessionState {
  sessionId: string;
  backendSessionId: string | null;
  candidateName: string;
  currentStage: StageName;
  difficultyLevel: 'A2' | 'B1' | 'B2' | 'C1';
  thetaAbility: number; // IRT 2PL latent trait [-3.0 .. +3.0]
  deadlineAt: number | null; // Milliseconds timestamp
  serverQuestions: BackendQuestion[];

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
  speakingTexts: string[];

  finalScores: CalculatedScores | null;
  writingScoreRatio: number;

  // Actions
  startNewSession: (candidateName?: string) => void;
  setStage: (stage: StageName) => void;
  setDifficultyLevel: (level: 'A2' | 'B1' | 'B2' | 'C1') => void;
  setBackendSessionId: (id: string | null) => void;
  setServerQuestions: (questions: BackendQuestion[]) => void;
  setDeadlineAt: (deadline: number | null) => void;
  setFinalScores: (scores: CalculatedScores) => void;
  recordReadSelectResult: (correct: number, total: number) => void;
  recordFillBlanksResult: (correct: number, total: number) => void;
  recordCTestResult: (correct: number, total: number) => void;
  recordListenTypeResult: (similarity: number) => void;
  recordInteractiveReadingResult: (score: number) => void;
  recordInteractiveListeningResult: (score: number) => void;
  recordWritePhotoResult: (texts: string[]) => void;
  recordInteractiveWritingResult: (part1: string, part2: string) => void;
  recordWritingSampleResult: (text: string) => void;
  recordSpeakingResult: (text: string) => void;
  finishTestAndCalculateScores: () => CalculatedScores;
}

export const useTestStore = create<TestSessionState>((set, get) => ({
  sessionId: '',
  backendSessionId: null,
  candidateName: 'Candidate',
  currentStage: 'READ_SELECT',
  difficultyLevel: 'B1',
  thetaAbility: 0.0,
  deadlineAt: null,
  serverQuestions: [],

  readSelectCorrect: 0,
  readSelectTotal: 0,

  fillBlanksCorrect: 0,
  fillBlanksTotal: 0,

  cTestCorrect: 0,
  cTestTotal: 0,

  listenTypeSimilaritySum: 0,
  listenTypeTotal: 0,

  interactiveReadingScore: 0,
  interactiveListeningScore: 0,

  writePhotoTexts: [],
  interactiveWritingTexts: { part1: '', part2: '' },
  writingSampleText: '',
  speakingTexts: [],

  finalScores: null,
  writingScoreRatio: 0,

  startNewSession: (candidateName = 'Candidate') => {
    const newSessionId = 'det-' + Math.random().toString(36).substring(2, 9);
    set({
      sessionId: newSessionId,
      backendSessionId: null,
      candidateName,
      currentStage: 'READ_SELECT',
      difficultyLevel: 'B1',
      thetaAbility: 0.0,
      deadlineAt: null,
      serverQuestions: [],
      readSelectCorrect: 0,
      readSelectTotal: 0,
      fillBlanksCorrect: 0,
      fillBlanksTotal: 0,
      cTestCorrect: 0,
      cTestTotal: 0,
      listenTypeSimilaritySum: 0,
      listenTypeTotal: 0,
      interactiveReadingScore: 0,
      interactiveListeningScore: 0,
      writePhotoTexts: [],
      interactiveWritingTexts: { part1: '', part2: '' },
      writingSampleText: '',
      speakingTexts: [],
      finalScores: null,
      writingScoreRatio: 0,
    });
  },

  setStage: (stage) => set({ currentStage: stage }),
  setDifficultyLevel: (level) => set({ difficultyLevel: level }),
  setBackendSessionId: (id) => set({ backendSessionId: id }),
  setServerQuestions: (questions) => set({ serverQuestions: questions }),
  setDeadlineAt: (deadline) => set({ deadlineAt: deadline }),
  setFinalScores: (scores) => set({ finalScores: scores, currentStage: 'COMPLETED' }),

  recordReadSelectResult: (correct, total) => {
    const accuracy = total > 0 ? correct / total : 0;
    const currentState = get();

    // 2-Parameter Logistic (2PL) Item Response Theory θ update:
    const itemThetaB = DIFFICULTY_THETA_MAP[currentState.difficultyLevel] || 0.0;
    const nextTheta = updateTheta2PL(currentState.thetaAbility, itemThetaB, accuracy, 1.3);

    // Map latent ability theta to CEFR difficulty band
    let nextDiff: 'A2' | 'B1' | 'B2' | 'C1' = 'B2';
    if (nextTheta >= 1.0) nextDiff = 'C1';
    else if (nextTheta >= 0.0) nextDiff = 'B2';
    else if (nextTheta >= -1.0) nextDiff = 'B1';
    else nextDiff = 'A2';

    set((state) => ({
      readSelectCorrect: state.readSelectCorrect + correct,
      readSelectTotal: state.readSelectTotal + total,
      thetaAbility: nextTheta,
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
  recordSpeakingResult: (text) =>
    set((state) => ({ speakingTexts: [...state.speakingTexts, text] })),

  finishTestAndCalculateScores: () => {
    const state = get();
    // If backend scores were already supplied, respect them as source of truth
    if (state.finalScores) {
      return state.finalScores;
    }

    const rsRatio = state.readSelectTotal > 0 ? state.readSelectCorrect / state.readSelectTotal : 0;
    const fbRatio = state.fillBlanksTotal > 0 ? state.fillBlanksCorrect / state.fillBlanksTotal : 0;
    const ctRatio = state.cTestTotal > 0 ? state.cTestCorrect / state.cTestTotal : 0;
    const ltRatio = state.listenTypeTotal > 0 ? state.listenTypeSimilaritySum / state.listenTypeTotal : 0;

    // Writing evaluation using Rubric Grader
    let photoScoresSum = 0;
    state.writePhotoTexts.forEach((text) => {
      const fb = evaluateWriteAboutPhoto(text, {
        expectedKeywords: ['laboratory', 'students', 'engineer', 'presentation', 'monitors', 'researcher'],
      });
      photoScoresSum += fb.score;
    });
    const photoAvg = state.writePhotoTexts.length > 0 ? photoScoresSum / state.writePhotoTexts.length : 0;

    const iwPart1Fb = evaluateEssayWriting(state.interactiveWritingTexts.part1, 80, ['university', 'students', 'education', 'courses']);
    const iwPart2Fb = evaluateEssayWriting(state.interactiveWritingTexts.part2, 50, ['support', 'stress', 'mental', 'employers']);
    const wsFb = evaluateEssayWriting(state.writingSampleText, 100, ['transportation', 'environment', 'economic', 'philosophy', 'intelligence', 'academic']);

    const writingRatio = state.writePhotoTexts.length > 0 || state.writingSampleText || state.interactiveWritingTexts.part1
      ? Math.min(1.0, Math.max(0.0, photoAvg * 0.25 + iwPart1Fb.score * 0.25 + iwPart2Fb.score * 0.2 + wsFb.score * 0.3))
      : 0;

    const scores = computeFinalScores({
      readSelectAccuracy: rsRatio,
      fillBlanksAccuracy: fbRatio,
      cTestAccuracy: ctRatio,
      listenTypeAccuracy: ltRatio,
      interactiveReadingScore: state.interactiveReadingScore,
      interactiveListeningScore: state.interactiveListeningScore,
      writingScore: writingRatio,
    });

    set({ finalScores: scores, writingScoreRatio: writingRatio, currentStage: 'COMPLETED' });
    return scores;
  },
}));
