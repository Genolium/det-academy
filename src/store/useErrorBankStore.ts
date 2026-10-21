import { create } from 'zustand';

export type ErrorType = 'C_TEST' | 'LISTEN_TYPE' | 'READ_SELECT' | 'FILL_BLANKS';

export interface ErrorItem {
  id: string;
  type: ErrorType;
  questionTitle?: string;
  contextSentence?: string;
  // Read and Select
  wordTested?: string;
  isRealWord?: boolean;
  userChoseReal?: boolean;
  definition?: string;
  // Fill in the blanks
  givenPrefix?: string;
  userInput?: string;
  correctAnswer?: string;
  // C-Test
  tokenPrefix?: string;
  missingLetters?: string;
  fullWord?: string;
  // Listen and type
  audioSentence?: string;
  userTranscript?: string;
  similarityRatio?: number;

  timestamp: number;
  attemptsCount: number;
  mastered: boolean;
  lastAttemptCorrect?: boolean;
}

interface ErrorBankState {
  errors: ErrorItem[];
  addError: (error: Omit<ErrorItem, 'id' | 'timestamp' | 'mastered' | 'attemptsCount'>) => void;
  recordRetry: (id: string, wasCorrect: boolean) => void;
  markMastered: (id: string) => void;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
  getUnmasteredCount: () => number;
  getMasteryRate: () => number;
}

const STORAGE_KEY = 'det_error_bank_v2';

const getInitialErrors = (): ErrorItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const saveErrors = (errors: ErrorItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
    } catch {}
  }
};

export const useErrorBankStore = create<ErrorBankState>((set, get) => ({
  errors: getInitialErrors(),

  addError: (item) => {
    set((state) => {
      // De-duplicate if identical mistake already in bank
      const existingIdx = state.errors.findIndex((e) => {
        if (e.type !== item.type) return false;
        if (item.type === 'READ_SELECT') return e.wordTested === item.wordTested;
        if (item.type === 'FILL_BLANKS') return e.correctAnswer === item.correctAnswer;
        if (item.type === 'C_TEST') return e.fullWord === item.fullWord && e.contextSentence === item.contextSentence;
        if (item.type === 'LISTEN_TYPE') return e.audioSentence === item.audioSentence;
        return false;
      });

      let updated: ErrorItem[];
      if (existingIdx >= 0) {
        updated = [...state.errors];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...item,
          timestamp: Date.now(),
          attemptsCount: updated[existingIdx].attemptsCount + 1,
          mastered: false, // reset mastery if failed again
        };
      } else {
        const newError: ErrorItem = {
          ...item,
          id: 'err-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
          timestamp: Date.now(),
          attemptsCount: 1,
          mastered: false,
        };
        updated = [newError, ...state.errors];
      }

      saveErrors(updated);
      return { errors: updated };
    });
  },

  recordRetry: (id, wasCorrect) => {
    set((state) => {
      const updated = state.errors.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            attemptsCount: e.attemptsCount + 1,
            lastAttemptCorrect: wasCorrect,
            mastered: wasCorrect ? true : e.mastered,
          };
        }
        return e;
      });
      saveErrors(updated);
      return { errors: updated };
    });
  },

  markMastered: (id) => {
    set((state) => {
      const updated = state.errors.map((e) => (e.id === id ? { ...e, mastered: true } : e));
      saveErrors(updated);
      return { errors: updated };
    });
  },

  removeError: (id) => {
    set((state) => {
      const updated = state.errors.filter((e) => e.id !== id);
      saveErrors(updated);
      return { errors: updated };
    });
  },

  clearAllErrors: () => {
    saveErrors([]);
    set({ errors: [] });
  },

  getUnmasteredCount: () => {
    return get().errors.filter((e) => !e.mastered).length;
  },

  getMasteryRate: () => {
    const total = get().errors.length;
    if (total === 0) return 100;
    const mastered = get().errors.filter((e) => e.mastered).length;
    return Math.round((mastered / total) * 100);
  },
}));
