import { create } from 'zustand';
import { CalculatedScores } from '@/lib/scoring';
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

export type AttemptStatus =
  | 'starting'
  | 'in_progress'
  | 'submitting'
  | 'pending_sync'
  | 'pending_evaluation'
  | 'completed'
  | 'failed'
  | 'expired';

interface ServerAttemptContext {
  sessionId: string;
  candidateName?: string;
  stage: StageName;
  difficultyLevel: 'A2' | 'B1' | 'B2' | 'C1';
  deadlineAt: number | null;
  questions: BackendQuestion[];
  revision?: number;
}

interface TestSessionState {
  sessionId: string;
  backendSessionId: string | null;
  candidateName: string;
  currentStage: StageName;
  difficultyLevel: 'A2' | 'B1' | 'B2' | 'C1';
  thetaAbility: number; // IRT 2PL latent trait [-3.0 .. +3.0]
  deadlineAt: number | null; // Milliseconds timestamp
  serverQuestions: BackendQuestion[];

  // Trusted-result state. Only the server may move an attempt to `completed`.
  attemptStatus: AttemptStatus;
  attemptError: string | null;
  serverRevision: number;
  lastConfirmedStage: StageName | null;
  lastSyncedAt: number | null;
  resultId: string | null;
  certificateId: string | null;
  certificateEligible: boolean | null;

  // Metrics collected locally for the current attempt. They are hints for the
  // server, never a source of a confirmed result.
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

  // Actions
  startNewSession: (candidateName?: string) => void;
  setStage: (stage: StageName) => void;
  setDifficultyLevel: (level: 'A2' | 'B1' | 'B2' | 'C1') => void;
  setBackendSessionId: (id: string | null) => void;
  setServerQuestions: (questions: BackendQuestion[]) => void;
  setDeadlineAt: (deadline: number | null) => void;
  hydrateServerAttempt: (context: ServerAttemptContext) => void;
  setAttemptStatus: (status: AttemptStatus, error?: string | null) => void;
  setAttemptError: (error: string | null) => void;
  applyServerCompletion: (result: {
    sessionId: string;
    scores: CalculatedScores;
    certificateId?: string;
    certificateEligible: boolean;
    completedAt?: string;
  }) => void;
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
}

const INITIAL_ATTEMPT = {
  sessionId: '',
  backendSessionId: null as string | null,
  currentStage: 'READ_SELECT' as StageName,
  difficultyLevel: 'B1' as const,
  thetaAbility: 0.0,
  deadlineAt: null as number | null,
  serverQuestions: [] as BackendQuestion[],
  attemptStatus: 'starting' as AttemptStatus,
  attemptError: null as string | null,
  serverRevision: 0,
  lastConfirmedStage: null as StageName | null,
  lastSyncedAt: null as number | null,
  resultId: null as string | null,
  certificateId: null as string | null,
  certificateEligible: null as boolean | null,
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
  writePhotoTexts: [] as string[],
  interactiveWritingTexts: { part1: '', part2: '' },
  writingSampleText: '',
  speakingTexts: [] as string[],
  finalScores: null as CalculatedScores | null,
};

export const useTestStore = create<TestSessionState>((set, get) => ({
  ...INITIAL_ATTEMPT,
  candidateName: 'Candidate',

  startNewSession: (candidateName = 'Candidate') => {
    set({
      ...INITIAL_ATTEMPT,
      candidateName,
    });
  },

  setStage: (stage) => set({ currentStage: stage }),
  setDifficultyLevel: (level) => set({ difficultyLevel: level }),
  setBackendSessionId: (id) =>
    set({ backendSessionId: id, sessionId: id || '', attemptStatus: id ? 'in_progress' : 'starting' }),
  setServerQuestions: (questions) => set({ serverQuestions: questions }),
  setDeadlineAt: (deadline) => set({ deadlineAt: deadline }),

  hydrateServerAttempt: (context) => {
    set((state) => ({
      backendSessionId: context.sessionId,
      sessionId: context.sessionId,
      candidateName: context.candidateName || state.candidateName,
      currentStage: context.stage,
      difficultyLevel: context.difficultyLevel,
      deadlineAt: context.deadlineAt,
      serverQuestions: context.questions,
      serverRevision: context.revision ?? state.serverRevision,
      lastConfirmedStage: context.stage,
      lastSyncedAt: Date.now(),
      attemptStatus: 'in_progress',
      attemptError: null,
    }));
  },

  setAttemptStatus: (status, error = null) =>
    set((state) => ({
      attemptStatus: status,
      attemptError: error,
      lastSyncedAt: status === 'in_progress' || status === 'completed' ? Date.now() : state.lastSyncedAt,
    })),

  setAttemptError: (error) => set({ attemptError: error }),

  applyServerCompletion: (result) => {
    set({
      backendSessionId: result.sessionId,
      sessionId: result.sessionId,
      finalScores: result.scores,
      resultId: result.sessionId,
      certificateId: result.certificateId,
      certificateEligible: result.certificateEligible,
      currentStage: 'COMPLETED',
      lastConfirmedStage: 'COMPLETED',
      attemptStatus: 'completed',
      attemptError: null,
      lastSyncedAt: Date.now(),
    });
  },

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
}));
