import { create } from 'zustand';
import { api, UserErrorItem as BackendErrorItem } from '@/lib/api';

export interface ErrorItem {
  id: string;
  type: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  timestamp: string;
  consecutiveSuccesses: number;
  attemptsCount: number;
  mastered: boolean;
  lastReviewedAt?: string;
}

interface ErrorNotebookState {
  errors: ErrorItem[];
  activeUserId: string | null;
  loadForUser: (userId?: string) => Promise<void>;
  addError: (error: {
    type: string;
    prompt: string;
    userAnswer: string;
    correctAnswer: string;
    explanation?: string;
  }) => Promise<void>;
  recallError: (
    id: string,
    answer: string
  ) => Promise<{
    success: boolean;
    consecutiveSuccesses: number;
    mastered: boolean;
    correctAnswer: string;
    explanation?: string;
    message: string;
  }>;
  removeError: (id: string) => Promise<void>;
  clearAll: () => void;
}

const getStorageKey = (userId?: string | null) => {
  if (userId) return `det_error_notebook_${userId}`;
  if (typeof window !== 'undefined') {
    try {
      const rawUser = localStorage.getItem('det_auth_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.id) return `det_error_notebook_${u.id}`;
      }
    } catch {}
  }
  return 'det_error_notebook_guest';
};

export const useErrorNotebookStore = create<ErrorNotebookState>((set, get) => {
  let initialErrors: ErrorItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (raw) initialErrors = JSON.parse(raw);
    } catch {}
  }

  const persist = (items: ErrorItem[], userId?: string | null) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
      } catch {}
    }
  };

  return {
    errors: initialErrors,
    activeUserId: null,

    loadForUser: async (userId) => {
      const targetUserId = userId || null;
      set({ activeUserId: targetUserId });

      // 1. Try to load from backend if authenticated
      if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
        try {
          const resp = await api.getUserErrors();
          if (resp && Array.isArray(resp.errors)) {
            const mapped: ErrorItem[] = resp.errors.map((be: BackendErrorItem) => ({
              id: be.id,
              type: be.type,
              prompt: be.prompt,
              userAnswer: be.userAnswer,
              correctAnswer: be.correctAnswer,
              explanation: be.explanation,
              consecutiveSuccesses: be.consecutiveSuccesses || 0,
              attemptsCount: be.attemptsCount || 1,
              mastered: Boolean(be.mastered),
              timestamp: be.createdAt || new Date().toISOString(),
              lastReviewedAt: be.lastReviewedAt,
            }));
            set({ errors: mapped });
            persist(mapped, targetUserId);
            return;
          }
        } catch {
          // fallback to localStorage
        }
      }

      // 2. Fallback to user-scoped localStorage
      if (typeof window !== 'undefined') {
        try {
          const key = getStorageKey(targetUserId);
          const raw = localStorage.getItem(key);
          set({ errors: raw ? JSON.parse(raw) : [] });
        } catch {
          set({ errors: [] });
        }
      }
    },

    addError: async (err) => {
      const state = get();
      // Avoid duplicate active errors with identical prompt and correct answer
      const existing = state.errors.find(
        (e) => e.prompt === err.prompt && e.correctAnswer === err.correctAnswer && !e.mastered
      );
      if (existing) return;

      let newItemId = 'err-' + Math.random().toString(36).substring(2, 9);

      // Save to backend if authenticated
      if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
        try {
          const be = await api.saveUserError({
            type: err.type,
            prompt: err.prompt,
            userAnswer: err.userAnswer,
            correctAnswer: err.correctAnswer,
            explanation: err.explanation,
          });
          if (be?.id) {
            newItemId = be.id;
          }
        } catch {
          // local fallback
        }
      }

      const newItem: ErrorItem = {
        ...err,
        id: newItemId,
        timestamp: new Date().toISOString(),
        consecutiveSuccesses: 0,
        attemptsCount: 1,
        mastered: false,
      };

      const updated = [newItem, ...state.errors];
      set({ errors: updated });
      persist(updated, state.activeUserId);
    },

    recallError: async (id, answer) => {
      const state = get();
      const currentItem = state.errors.find((e) => e.id === id);

      // 1. Try server recall if authenticated
      if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
        try {
          const resp = await api.recallUserError(id, answer);
          const updated = state.errors.map((e) => {
            if (e.id === id) {
              return {
                ...e,
                consecutiveSuccesses: resp.consecutiveSuccesses,
                mastered: resp.mastered,
                attemptsCount: e.attemptsCount + 1,
                lastReviewedAt: new Date().toISOString(),
              };
            }
            return e;
          });
          set({ errors: updated });
          persist(updated, state.activeUserId);
          return resp;
        } catch {
          // fallback to client-side logic
        }
      }

      // 2. Client-side verified recall logic
      if (!currentItem) {
        return {
          success: false,
          consecutiveSuccesses: 0,
          mastered: false,
          correctAnswer: '',
          message: 'Задание не найдено',
        };
      }

      const cleanAns = answer.trim().toLowerCase();
      const cleanCorrect = currentItem.correctAnswer.trim().toLowerCase();
      const isCorrect = cleanAns === cleanCorrect;

      const newConsecutive = isCorrect ? currentItem.consecutiveSuccesses + 1 : 0;
      const newMastered = isCorrect && newConsecutive >= 2;

      const updated = state.errors.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            consecutiveSuccesses: newConsecutive,
            attemptsCount: e.attemptsCount + 1,
            mastered: newMastered,
            lastReviewedAt: new Date().toISOString(),
          };
        }
        return e;
      });

      set({ errors: updated });
      persist(updated, state.activeUserId);

      if (isCorrect) {
        if (newMastered) {
          return {
            success: true,
            consecutiveSuccesses: newConsecutive,
            mastered: true,
            correctAnswer: currentItem.correctAnswer,
            explanation: currentItem.explanation,
            message: 'Отлично! Ошибка усвоена (2 верных ответа подряд).',
          };
        }
        return {
          success: true,
          consecutiveSuccesses: newConsecutive,
          mastered: false,
          correctAnswer: currentItem.correctAnswer,
          explanation: currentItem.explanation,
          message: 'Верно! Повторите в следующем раунде для закрепления (1 из 2).',
        };
      }

      return {
        success: false,
        consecutiveSuccesses: 0,
        mastered: false,
        correctAnswer: currentItem.correctAnswer,
        explanation: currentItem.explanation,
        message: `Неверно. Правильный ответ: ${currentItem.correctAnswer}`,
      };
    },

    removeError: async (id) => {
      const state = get();
      if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
        try {
          await api.deleteUserError(id);
        } catch {}
      }
      const updated = state.errors.filter((e) => e.id !== id);
      set({ errors: updated });
      persist(updated, state.activeUserId);
    },

    clearAll: () => {
      set({ errors: [] });
      persist([], get().activeUserId);
    },
  };
});
