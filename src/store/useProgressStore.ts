import { create } from 'zustand';
import { api, BackendTestSession, StudyPlanResponse } from '@/lib/api';

export interface TestResult {
  id: string;
  date: string;
  overallScore: number;
  reading?: number;
  listening?: number;
  writing?: number;
  speaking?: number;
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
  targetDate: string;
  dailyMinutes: number;
  studyPlan: StudyPlanResponse | null;
  userId: string | null;
  setCandidateName: (name: string) => void;
  setTargetScore: (score: number) => Promise<void>;
  setTargetDate: (date: string) => Promise<void>;
  setDailyMinutes: (minutes: number) => Promise<void>;
  loadStudyPlan: () => Promise<void>;
  toggleLessonCompleted: (slug: string) => Promise<void>;
  syncWithBackend: (userId?: string | null) => Promise<void>;
  resetProgressState: () => void;
  setBestTypingWpm: (wpm: number) => void;
  addTestResult: (result: TestResult) => void;
  isEligibleForCertificate: () => boolean;
  getBestMockScore: () => number;
  getReadinessPercentage: () => number;
}

export const TOTAL_LESSONS = 16;

const getScopedKey = (key: string, userId?: string | null): string => {
  if (!userId) return `det_guest_${key}`;
  return `det_user_${userId}_${key}`;
};

const getDefaultTargetDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const getInitialState = (userId?: string | null) => {
  if (typeof window === 'undefined') {
    return {
      completedLessons: [],
      bestTypingWpm: 0,
      testResults: [],
      candidateName: '',
      targetScore: 125,
      targetDate: getDefaultTargetDate(),
      dailyMinutes: 45,
      studyPlan: null,
      userId: userId || null,
    };
  }

  const lessonsKey = getScopedKey('completed_lessons', userId);
  const testsKey = getScopedKey('test_results', userId);
  const wpmKey = getScopedKey('best_wpm', userId);
  const nameKey = getScopedKey('candidate_name', userId);
  const targetKey = getScopedKey('target_score', userId);
  const dateKey = getScopedKey('target_date', userId);
  const minutesKey = getScopedKey('daily_minutes', userId);

  let completedLessons: string[] = [];
  try {
    const raw = localStorage.getItem(lessonsKey);
    if (raw) completedLessons = JSON.parse(raw);
  } catch {}

  let testResults: TestResult[] = [];
  try {
    const raw = localStorage.getItem(testsKey);
    if (raw) testResults = JSON.parse(raw);
  } catch {}

  const bestTypingWpm = parseInt(localStorage.getItem(wpmKey) || '0', 10) || 0;
  const candidateName = localStorage.getItem(nameKey) || '';
  const targetScore = parseInt(localStorage.getItem(targetKey) || '125', 10) || 125;
  const targetDate = localStorage.getItem(dateKey) || getDefaultTargetDate();
  const dailyMinutes = parseInt(localStorage.getItem(minutesKey) || '45', 10) || 45;

  return {
    completedLessons,
    bestTypingWpm,
    testResults,
    candidateName,
    targetScore,
    targetDate,
    dailyMinutes,
    studyPlan: null,
    userId: userId || null,
  };
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...getInitialState(),

  resetProgressState: () => {
    set({
      completedLessons: [],
      bestTypingWpm: 0,
      testResults: [],
      candidateName: '',
      targetScore: 125,
      targetDate: getDefaultTargetDate(),
      dailyMinutes: 45,
      studyPlan: null,
      userId: null,
    });
  },

  setCandidateName: (candidateName) => {
    const uid = get().userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(getScopedKey('candidate_name', uid), candidateName);
    }
    set({ candidateName });
  },

  setTargetScore: async (targetScore) => {
    const uid = get().userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(getScopedKey('target_score', uid), targetScore.toString());
    }
    set({ targetScore });

    if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
      try {
        await api.updateUserGoals({
          targetScore,
          targetDate: get().targetDate,
          dailyMinutes: get().dailyMinutes,
        });
        await get().loadStudyPlan();
      } catch {}
    }
  },

  setTargetDate: async (targetDate) => {
    const uid = get().userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(getScopedKey('target_date', uid), targetDate);
    }
    set({ targetDate });

    if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
      try {
        await api.updateUserGoals({
          targetScore: get().targetScore,
          targetDate,
          dailyMinutes: get().dailyMinutes,
        });
        await get().loadStudyPlan();
      } catch {}
    }
  },

  setDailyMinutes: async (dailyMinutes) => {
    const uid = get().userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(getScopedKey('daily_minutes', uid), dailyMinutes.toString());
    }
    set({ dailyMinutes });

    if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
      try {
        await api.updateUserGoals({
          targetScore: get().targetScore,
          targetDate: get().targetDate,
          dailyMinutes,
        });
        await get().loadStudyPlan();
      } catch {}
    }
  },

  loadStudyPlan: async () => {
    if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
      try {
        const plan = await api.getUserStudyPlan();
        if (plan) {
          set({
            studyPlan: plan,
            targetScore: plan.targetScore || get().targetScore,
            targetDate: plan.targetDate || get().targetDate,
            dailyMinutes: plan.dailyMinutes || get().dailyMinutes,
          });
        }
      } catch {
        // ignore
      }
    }
  },

  syncWithBackend: async (explicitUserId) => {
    const activeUserId = explicitUserId !== undefined ? explicitUserId : get().userId;

    if (explicitUserId !== undefined && explicitUserId !== get().userId) {
      set({ userId: explicitUserId });
    }

    // 1. Sync local storage items for the active user
    if (typeof window !== 'undefined') {
      try {
        const testsKey = getScopedKey('test_results', activeUserId);
        const storedTests = localStorage.getItem(testsKey);
        if (storedTests) {
          set({ testResults: JSON.parse(storedTests) });
        } else {
          set({ testResults: [] });
        }
      } catch {}

      const wpmKey = getScopedKey('best_wpm', activeUserId);
      const storedWpm = localStorage.getItem(wpmKey);
      set({ bestTypingWpm: storedWpm ? parseInt(storedWpm, 10) || 0 : 0 });

      const targetKey = getScopedKey('target_score', activeUserId);
      const storedTarget = localStorage.getItem(targetKey);
      set({ targetScore: storedTarget ? parseInt(storedTarget, 10) || 125 : 125 });

      const dateKey = getScopedKey('target_date', activeUserId);
      const storedDate = localStorage.getItem(dateKey);
      if (storedDate) set({ targetDate: storedDate });

      const minutesKey = getScopedKey('daily_minutes', activeUserId);
      const storedMinutes = localStorage.getItem(minutesKey);
      if (storedMinutes) set({ dailyMinutes: parseInt(storedMinutes, 10) || 45 });

      const nameKey = getScopedKey('candidate_name', activeUserId);
      const storedName = localStorage.getItem(nameKey);
      if (storedName) {
        set({ candidateName: storedName });
      }
    }

    // 2. Sync theory progress from backend (if logged in)
    try {
      const resp = await api.getTheoryProgress();
      if (resp && resp.completedLessons) {
        set({ completedLessons: resp.completedLessons });
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            getScopedKey('completed_lessons', activeUserId),
            JSON.stringify(resp.completedLessons)
          );
        }
      }
    } catch {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(getScopedKey('completed_lessons', activeUserId));
        if (stored) {
          try {
            set({ completedLessons: JSON.parse(stored) });
          } catch {}
        } else {
          set({ completedLessons: [] });
        }
      }
    }

    // 3. Sync real test sessions from backend for authenticated user
    try {
      const testResp = await api.getMyTestSessions();
      if (testResp && Array.isArray(testResp.sessions)) {
        const completedSessions = testResp.sessions.filter(
          (s: BackendTestSession) => s.status === 'COMPLETED' && s.overallScore && s.overallScore > 0
        );

        if (completedSessions.length > 0) {
          const mappedResults: TestResult[] = completedSessions.map((s: BackendTestSession) => ({
            id: s.id,
            date: s.completedAt
              ? new Date(s.completedAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Недавно',
            overallScore: s.overallScore || 0,
            reading: s.readingScore || 0,
            listening: s.listeningScore || 0,
            writing: s.writingScore || 0,
            speaking: s.speakingScore || 0,
            literacy: s.literacyScore || s.overallScore || 0,
            comprehension: s.comprehensionScore || s.overallScore || 0,
            production: s.productionScore || s.overallScore || 0,
            conversation: s.conversationScore || s.overallScore || 0,
            candidateName: s.candidateName || get().candidateName || 'Студент',
          }));

          set({ testResults: mappedResults });
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              getScopedKey('test_results', activeUserId),
              JSON.stringify(mappedResults)
            );
          }
        }
      }
    } catch {
      // offline or unauthenticated, keep local scoped state
    }

    // 4. Sync User Goals & Study Plan
    try {
      await get().loadStudyPlan();
    } catch {}
  },

  toggleLessonCompleted: async (slug: string) => {
    const state = get();
    const uid = state.userId;
    const exists = state.completedLessons.includes(slug);
    const newLessons = exists
      ? state.completedLessons.filter((s) => s !== slug)
      : [...state.completedLessons, slug];

    set({ completedLessons: newLessons });
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        getScopedKey('completed_lessons', uid),
        JSON.stringify(newLessons)
      );
    }

    try {
      const resp = await api.toggleTheoryLesson(slug);
      if (resp && resp.completedLessons) {
        set({ completedLessons: resp.completedLessons });
      }
    } catch {
      // Keep optimistic local state
    }
  },

  setBestTypingWpm: (wpm) => {
    set((state) => {
      const newBest = Math.max(state.bestTypingWpm, wpm);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          getScopedKey('best_wpm', state.userId),
          newBest.toString()
        );
      }
      return { bestTypingWpm: newBest };
    });
  },

  addTestResult: (result) => {
    set((state) => {
      const updated = [result, ...state.testResults];
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          getScopedKey('test_results', state.userId),
          JSON.stringify(updated)
        );
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
