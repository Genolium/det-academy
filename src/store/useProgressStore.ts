import { create } from 'zustand';
import { api } from '@/lib/api';

export interface TestResult {
  id: string;
  date: string;
  overallScore: number;
  literacy: number;
  comprehension: number;
  production: number;
  conversation: number;
  candidateName: string;
}

interface ProgressState {
  completedLessons: string[];
  bestTypingWpm: number;
  testResults: TestResult[];
  candidateName: string;
  targetScore: number;
  setCandidateName: (name: string) => void;
  setTargetScore: (score: number) => void;
  toggleLessonCompleted: (slug: string) => Promise<void>;
  syncWithBackend: () => Promise<void>;
  setBestTypingWpm: (wpm: number) => void;
  addTestResult: (result: TestResult) => void;
  isEligibleForCertificate: () => boolean;
  getBestMockScore: () => number;
  getReadinessPercentage: () => number;
}

export const TOTAL_LESSONS = 16;

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      completedLessons: [],
      bestTypingWpm: 0,
      testResults: [],
      candidateName: '',
      targetScore: 125,
    };
  }

  let completedLessons: string[] = [];
  try {
    const raw = localStorage.getItem('det_completed_lessons');
    if (raw) completedLessons = JSON.parse(raw);
  } catch {}

  let testResults: TestResult[] = [];
  try {
    const raw = localStorage.getItem('det_test_results');
    if (raw) testResults = JSON.parse(raw);
  } catch {}

  const bestTypingWpm = parseInt(localStorage.getItem('det_best_wpm') || '0', 10) || 0;
  const candidateName = localStorage.getItem('det_candidate_name') || '';
  const targetScore = parseInt(localStorage.getItem('det_target_score') || '125', 10) || 125;

  return {
    completedLessons,
    bestTypingWpm,
    testResults,
    candidateName,
    targetScore,
  };
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...getInitialState(),

  setCandidateName: (candidateName) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_candidate_name', candidateName);
    }
    set({ candidateName });
  },

  setTargetScore: (targetScore) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_target_score', targetScore.toString());
    }
    set({ targetScore });
  },

  syncWithBackend: async () => {
    // 1. Sync local storage items
    if (typeof window !== 'undefined') {
      try {
        const storedTests = localStorage.getItem('det_test_results');
        if (storedTests) set({ testResults: JSON.parse(storedTests) });
      } catch {}

      const storedWpm = localStorage.getItem('det_best_wpm');
      if (storedWpm) {
        set({ bestTypingWpm: parseInt(storedWpm, 10) || 0 });
      }

      const storedTarget = localStorage.getItem('det_target_score');
      if (storedTarget) {
        set({ targetScore: parseInt(storedTarget, 10) || 125 });
      }
    }

    // 2. Sync theory progress from backend
    try {
      const resp = await api.getTheoryProgress();
      if (resp && resp.completedLessons) {
        set({ completedLessons: resp.completedLessons });
        if (typeof window !== 'undefined') {
          localStorage.setItem('det_completed_lessons', JSON.stringify(resp.completedLessons));
        }
      }
    } catch {
      // Fallback to local storage if offline or not logged in
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('det_completed_lessons');
        if (stored) {
          try {
            set({ completedLessons: JSON.parse(stored) });
          } catch {}
        }
      }
    }
  },

  toggleLessonCompleted: async (slug: string) => {
    // Optimistic local update
    const state = get();
    const exists = state.completedLessons.includes(slug);
    const newLessons = exists
      ? state.completedLessons.filter((s) => s !== slug)
      : [...state.completedLessons, slug];

    set({ completedLessons: newLessons });
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_completed_lessons', JSON.stringify(newLessons));
    }

    // Backend sync
    try {
      const resp = await api.toggleTheoryLesson(slug);
      if (resp && resp.completedLessons) {
        set({ completedLessons: resp.completedLessons });
      }
    } catch {
      // If unauthorized or network error, keep optimistic local state
    }
  },

  setBestTypingWpm: (wpm) => {
    set((state) => {
      const newBest = Math.max(state.bestTypingWpm, wpm);
      if (typeof window !== 'undefined') {
        localStorage.setItem('det_best_wpm', newBest.toString());
      }
      return { bestTypingWpm: newBest };
    });
  },

  addTestResult: (result) => {
    set((state) => {
      const updated = [result, ...state.testResults];
      if (typeof window !== 'undefined') {
        localStorage.setItem('det_test_results', JSON.stringify(updated));
      }
      return { testResults: updated };
    });
  },

  getBestMockScore: () => {
    const results = get().testResults;
    if (results.length === 0) return 0;
    return Math.max(...results.map((r) => r.overallScore));
  },

  getReadinessPercentage: () => {
    const { completedLessons, bestTypingWpm, targetScore } = get();
    const bestScore = get().getBestMockScore();

    // 45% theory completion
    const theoryPart = (Math.min(completedLessons.length, TOTAL_LESSONS) / TOTAL_LESSONS) * 45;

    // 45% test score relative to target
    const testPart = bestScore > 0 ? Math.min(45, (bestScore / Math.max(100, targetScore)) * 45) : 0;

    // 10% typing proficiency (threshold 50 WPM)
    const typingPart = Math.min(10, (bestTypingWpm / 50) * 10);

    return Math.round(theoryPart + testPart + typingPart);
  },

  isEligibleForCertificate: () => {
    const { completedLessons, testResults } = get();
    const theoryFinished = completedLessons.length >= TOTAL_LESSONS;
    const testPassed = testResults.some((r) => r.overallScore >= 105);
    return theoryFinished && testPassed;
  },
}));
