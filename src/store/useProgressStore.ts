import { create } from 'zustand';
import { api, BackendTestSession, StudyPlanResponse } from '@/lib/api';
import { hasAuthSession } from '@/lib/auth-session';

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

export interface LeagueInfo {
  name: string;
  nameRu: string;
  color: string;
  badge: string;
  minElo: number;
  maxElo: number;
}

export function getLeagueInfo(elo: number): LeagueInfo {
  if (elo >= 2050) return { name: 'Grandmaster', nameRu: 'Грандмастер', color: 'text-rose-100 bg-rose-900 border-rose-700', badge: '👑', minElo: 2050, maxElo: 3000 };
  if (elo >= 1900) return { name: 'Master', nameRu: 'Мастер', color: 'text-purple-100 bg-purple-900 border-purple-700', badge: '🔮', minElo: 1900, maxElo: 2049 };
  if (elo >= 1750) return { name: 'Diamond', nameRu: 'Алмаз', color: 'text-cyan-100 bg-cyan-900 border-cyan-700', badge: '💎', minElo: 1750, maxElo: 1899 };
  if (elo >= 1600) return { name: 'Platinum', nameRu: 'Платина', color: 'text-teal-100 bg-teal-900 border-teal-700', badge: '🛡️', minElo: 1600, maxElo: 1749 };
  if (elo >= 1400) return { name: 'Gold', nameRu: 'Золото', color: 'text-amber-100 bg-amber-900 border-amber-700', badge: '🥇', minElo: 1400, maxElo: 1599 };
  if (elo >= 1200) return { name: 'Silver', nameRu: 'Серебро', color: 'text-slate-100 bg-slate-700 border-slate-600', badge: '🥈', minElo: 1200, maxElo: 1399 };
  return { name: 'Bronze', nameRu: 'Бронза', color: 'text-orange-100 bg-orange-900 border-orange-700', badge: '🥉', minElo: 0, maxElo: 1199 };
}

interface ProgressState {
  completedLessons: string[];
  bestTypingWpm: number;
  testResults: TestResult[];
  candidateName: string;
  targetScore: number;
  targetDate: string;
  dailyMinutes: number;
  /** True once the student has chosen a target on the server. */
  goalsConfigured: boolean;
  studyPlan: StudyPlanResponse | null;
  streakDays: number;
  lastActiveDate: string;
  pvpElo: number;
  userId: string | null;
  setCandidateName: (name: string) => void;
  setTargetScore: (score: number) => Promise<void>;
  setTargetDate: (date: string) => Promise<void>;
  setDailyMinutes: (minutes: number) => Promise<void>;
  loadStudyPlan: () => Promise<void>;
  saveGoals: (goals: { targetScore: number; targetDate: string; dailyMinutes: number }) => Promise<void>;
  completeDailyTask: (taskId: string) => Promise<void>;
  toggleLessonCompleted: (slug: string) => Promise<void>;
  syncWithBackend: (userId?: string | null) => Promise<void>;
  resetProgressState: () => void;
  setBestTypingWpm: (wpm: number) => void;
  addTestResult: (result: TestResult) => void;
  getBestMockScore: () => number;
  getReadinessPercentage: () => number;
  recordDailyActivity: () => void;
  setPvpElo: (elo: number) => void;
  getLeague: () => LeagueInfo;
}

export const TOTAL_LESSONS = 17;

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
      goalsConfigured: false,
      studyPlan: null,
      streakDays: 0,
      lastActiveDate: '',
      pvpElo: 1200,
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
  const streakKey = getScopedKey('streak_days', userId);
  const activeKey = getScopedKey('last_active_date', userId);
  const eloKey = getScopedKey('pvp_elo', userId);

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
  const streakDays = parseInt(localStorage.getItem(streakKey) || '0', 10) || 0;
  const lastActiveDate = localStorage.getItem(activeKey) || '';
  const pvpElo = parseInt(localStorage.getItem(eloKey) || '1200', 10) || 1200;

  return {
    completedLessons,
    bestTypingWpm,
    testResults,
    candidateName,
    targetScore,
    targetDate,
    dailyMinutes,
    goalsConfigured: false,
    studyPlan: null,
    streakDays,
    lastActiveDate,
    pvpElo,
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
      goalsConfigured: false,
      studyPlan: null,
      streakDays: 0,
      lastActiveDate: '',
      pvpElo: 1200,
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

    if (hasAuthSession()) {
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

    if (hasAuthSession()) {
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

    if (hasAuthSession()) {
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
    if (hasAuthSession()) {
      try {
        const plan = await api.getUserStudyPlan();
        if (!plan || plan.configured === false) {
          // No target yet: show onboarding instead of fabricated plan values.
          set({ goalsConfigured: false, studyPlan: null });
          return;
        }
        set({
          goalsConfigured: true,
          studyPlan: plan,
          targetScore: plan.targetScore || get().targetScore,
          targetDate: plan.targetDate || get().targetDate,
          dailyMinutes: plan.dailyMinutes || get().dailyMinutes,
        });
      } catch {
        // ignore
      }
    }
  },

  saveGoals: async (goals) => {
    await api.updateUserGoals({
      targetScore: goals.targetScore,
      targetDate: goals.targetDate,
      dailyMinutes: goals.dailyMinutes,
    });
    const uid = get().userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(getScopedKey('target_score', uid), String(goals.targetScore));
      localStorage.setItem(getScopedKey('target_date', uid), goals.targetDate);
      localStorage.setItem(getScopedKey('daily_minutes', uid), String(goals.dailyMinutes));
    }
    set({
      targetScore: goals.targetScore,
      targetDate: goals.targetDate,
      dailyMinutes: goals.dailyMinutes,
      goalsConfigured: true,
    });
    await get().loadStudyPlan();
  },

  completeDailyTask: async (taskId) => {
    await api.completePlanTask(taskId);
    await get().loadStudyPlan();
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

      const streakKey = getScopedKey('streak_days', activeUserId);
      const activeKey = getScopedKey('last_active_date', activeUserId);
      const eloKey = getScopedKey('pvp_elo', activeUserId);
      set({
        streakDays: parseInt(localStorage.getItem(streakKey) || '0', 10) || 0,
        lastActiveDate: localStorage.getItem(activeKey) || '',
        pvpElo: parseInt(localStorage.getItem(eloKey) || '1200', 10) || 1200,
      });

      const nameKey = getScopedKey('candidate_name', activeUserId);
      const storedName = localStorage.getItem(nameKey);
      if (storedName) {
        set({ candidateName: storedName });
      }
    }

    // Server-owned streak is authoritative when the API is reachable.
    if (hasAuthSession()) {
      try {
        const streak = await api.getUserStreak(-new Date().getTimezoneOffset());
        set({ streakDays: streak.streakDays, lastActiveDate: streak.lastActiveDate });
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            getScopedKey('streak_days', activeUserId),
            streak.streakDays.toString()
          );
          localStorage.setItem(
            getScopedKey('last_active_date', activeUserId),
            streak.lastActiveDate
          );
        }
      } catch {
        // Offline: keep the last local value.
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

    // 5. Sync Typing history & best WPM from server
    if (hasAuthSession()) {
      try {
        const typingData = await api.getTypingHistory();
        if (typingData && typeof typingData.bestWpm === 'number' && typingData.bestWpm > 0) {
          set({ bestTypingWpm: typingData.bestWpm });
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              getScopedKey('best_wpm', activeUserId),
              typingData.bestWpm.toString()
            );
          }
        }
      } catch {}
    }
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
    get().recordDailyActivity();
  },

  addTestResult: (result) => {
    set((state) => {
      const existing = state.testResults.filter((item) => item.id !== result.id);
      const updated = [result, ...existing];
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          getScopedKey('test_results', state.userId),
          JSON.stringify(updated)
        );
      }
      return { testResults: updated };
    });
    get().recordDailyActivity();
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

  recordDailyActivity: () => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    if (state.lastActiveDate === today) return;

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];
    const optimisticStreak = state.lastActiveDate === yesterday ? state.streakDays + 1 : 1;

    if (typeof window !== 'undefined') {
      localStorage.setItem(getScopedKey('streak_days', state.userId), optimisticStreak.toString());
      localStorage.setItem(getScopedKey('last_active_date', state.userId), today);
    }
    set({ streakDays: optimisticStreak, lastActiveDate: today });

    if (hasAuthSession()) {
      void api
        .recordUserActivity('study', -new Date().getTimezoneOffset())
        .then((streak) => set({ streakDays: streak.streakDays, lastActiveDate: streak.lastActiveDate }))
        .catch(() => {
          // Keep the optimistic local value until the next sync.
        });
    }
  },

  setPvpElo: (pvpElo) => {
    const uid = get().userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(getScopedKey('pvp_elo', uid), pvpElo.toString());
    }
    set({ pvpElo });
  },

  getLeague: () => getLeagueInfo(get().pvpElo),
}));
