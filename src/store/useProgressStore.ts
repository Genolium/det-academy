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
  setCandidateName: (name: string) => void;
  toggleLessonCompleted: (slug: string) => Promise<void>;
  syncWithBackend: () => Promise<void>;
  setBestTypingWpm: (wpm: number) => void;
  addTestResult: (result: TestResult) => void;
  isEligibleForCertificate: () => boolean;
  getBestMockScore: () => number;
}

const TOTAL_LESSONS = 12;

export const useProgressStore = create<ProgressState>((set, get) => ({
  completedLessons: [],
  bestTypingWpm: 0,
  testResults: [],
  candidateName: 'Alex Rivera',

  setCandidateName: (candidateName) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_candidate_name', candidateName);
    }
    set({ candidateName });
  },

  syncWithBackend: async () => {
    try {
      const resp = await api.getTheoryProgress();
      if (resp && resp.completedLessons) {
        set({ completedLessons: resp.completedLessons });
        if (typeof window !== 'undefined') {
          localStorage.setItem('det_completed_lessons', JSON.stringify(resp.completedLessons));
        }
      }
    } catch {
      // Fallback to local storage if offline
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
      // If unauthorized or error, keep optimistic local state
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

  isEligibleForCertificate: () => {
    const { completedLessons, testResults } = get();
    const theoryFinished = completedLessons.length >= TOTAL_LESSONS;
    const testPassed = testResults.some((r) => r.overallScore >= 105);
    return theoryFinished && testPassed;
  },
}));
