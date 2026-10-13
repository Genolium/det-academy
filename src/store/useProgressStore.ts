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

export interface LeagueInfo {
  name: string;
  nameRu: string;
  color: string;
  badge: string;
  minElo: number;
  maxElo: number;
}

export function getLeagueInfo(elo: number): LeagueInfo {
  if (elo >= 2050) return { name: 'Grandmaster', nameRu: 'Грандмастер', color: 'text-rose-400 bg-rose-950/60 border-rose-800/60', badge: '👑', minElo: 2050, maxElo: 3000 };
  if (elo >= 1900) return { name: 'Master', nameRu: 'Мастер', color: 'text-purple-400 bg-purple-950/60 border-purple-800/60', badge: '🔮', minElo: 1900, maxElo: 2049 };
  if (elo >= 1750) return { name: 'Diamond', nameRu: 'Алмаз', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60', badge: '💎', minElo: 1750, maxElo: 1899 };
  if (elo >= 1600) return { name: 'Platinum', nameRu: 'Платина', color: 'text-teal-400 bg-teal-950/60 border-teal-800/60', badge: '🛡️', minElo: 1600, maxElo: 1749 };
  if (elo >= 1400) return { name: 'Gold', nameRu: 'Золото', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60', badge: '🥇', minElo: 1400, maxElo: 1599 };
  if (elo >= 1200) return { name: 'Silver', nameRu: 'Серебро', color: 'text-slate-300 bg-slate-800/60 border-slate-700/60', badge: '🥈', minElo: 1200, maxElo: 1399 };
  return { name: 'Bronze', nameRu: 'Бронза', color: 'text-orange-400 bg-orange-950/60 border-orange-800/60', badge: '🥉', minElo: 0, maxElo: 1199 };
}

interface ProgressState {
  completedLessons: string[];
  bestTypingWpm: number;
  testResults: TestResult[];
  candidateName: string;
  targetScore: number;
  streakDays: number;
  lastActiveDate: string;
  pvpElo: number;
  setCandidateName: (name: string) => void;
  setTargetScore: (score: number) => void;
  toggleLessonCompleted: (slug: string) => Promise<void>;
  syncWithBackend: () => Promise<void>;
  setBestTypingWpm: (wpm: number) => void;
  addTestResult: (result: TestResult) => void;
  isEligibleForCertificate: () => boolean;
  getBestMockScore: () => number;
  getReadinessPercentage: () => number;
  recordDailyActivity: () => void;
  setPvpElo: (elo: number) => void;
  getLeague: () => LeagueInfo;
}

export const TOTAL_LESSONS = 16;

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      completedLessons: [],
      bestTypingWpm: 0,
      testResults: [],
      candidateName: '',
      targetScore: 125,
      streakDays: 3,
      lastActiveDate: '',
      pvpElo: 1420,
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
  const streakDays = parseInt(localStorage.getItem('det_streak_days') || '3', 10) || 3;
  const lastActiveDate = localStorage.getItem('det_last_active_date') || getTodayDateString();
  const pvpElo = parseInt(localStorage.getItem('det_pvp_elo') || '1420', 10) || 1420;

  return {
    completedLessons,
    bestTypingWpm,
    testResults,
    candidateName,
    targetScore,
    streakDays,
    lastActiveDate,
    pvpElo,
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

  recordDailyActivity: () => {
    const today = getTodayDateString();
    const { lastActiveDate, streakDays } = get();

    if (lastActiveDate === today) {
      return; // Already recorded today
    }

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let newStreak = streakDays;
    if (lastActiveDate === yesterday) {
      newStreak += 1;
    } else if (!lastActiveDate) {
      newStreak = 1;
    } else {
      newStreak = 1; // broken streak
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('det_streak_days', newStreak.toString());
      localStorage.setItem('det_last_active_date', today);
    }
    set({ streakDays: newStreak, lastActiveDate: today });
  },

  setPvpElo: (pvpElo: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_pvp_elo', pvpElo.toString());
    }
    set({ pvpElo });
  },

  getLeague: () => {
    return getLeagueInfo(get().pvpElo);
  },
}));
