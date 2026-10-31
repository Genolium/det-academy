import { create } from 'zustand';
import { api, UserErrorItem as BackendErrorItem } from '@/lib/api';
import { hasAuthSession } from '@/lib/auth-session';

export type ErrorType = 'C_TEST' | 'LISTEN_TYPE' | 'READ_SELECT' | 'FILL_BLANKS' | string;

export interface ErrorItem {
  id: string;
  type: ErrorType;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  errorCategory?: string;
  errorRule?: string;
  contextVariants?: Array<{ prompt: string; correctAnswer: string; explanation?: string }>;
  timestamp: string;
  consecutiveSuccesses: number;
  attemptsCount: number;
  mastered: boolean;
  lastReviewedAt?: string;
  /** True when the item exists only in the browser and still needs a server save. */
  pendingSync?: boolean;
}

export interface SaveErrorInput {
  type: ErrorType;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  errorCategory?: string;
  errorRule?: string;
  contextVariants?: Array<{ prompt: string; correctAnswer: string; explanation?: string }>;
}

interface RecallResult {
  success: boolean;
  consecutiveSuccesses: number;
  mastered: boolean;
  correctAnswer: string;
  explanation?: string;
  message: string;
  networkError?: boolean;
}

interface ErrorNotebookState {
  errors: ErrorItem[];
  activeUserId: string | null;
  isSyncing: boolean;
  syncError: string | null;
  loadForUser: (userId?: string | null) => Promise<void>;
  addError: (error: SaveErrorInput) => Promise<void>;
  recallError: (id: string, answer: string) => Promise<RecallResult>;
  removeError: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  resetForUser: () => void;
}

const LEGACY_ERROR_BANK_KEY = 'det_error_bank_v2';

const TYPE_LABELS: Record<string, string> = {
  C_TEST: 'C-Test',
  LISTEN_TYPE: 'Listen and Type',
  READ_SELECT: 'Read and Select',
  FILL_BLANKS: 'Fill in the Blanks',
};

export function normalizeErrorType(type: string): string {
  const normalized = (type || '')
    .trim()
    .replace(/[-\s]+/g, '_')
    .toUpperCase();
  if (normalized in TYPE_LABELS) return normalized;
  return normalized || 'READ_SELECT';
}

export function errorTypeLabel(type: string): string {
  return TYPE_LABELS[normalizeErrorType(type)] || type;
}

const getStorageKey = (userId?: string | null) =>
  userId ? `det_error_notebook_${userId}` : 'det_error_notebook_guest';

const readCache = (userId?: string | null): ErrorItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persist = (items: ErrorItem[], userId?: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
  } catch {}
};

const mapServerItem = (item: BackendErrorItem): ErrorItem => ({
  id: item.id,
  type: normalizeErrorType(item.type),
  prompt: item.prompt,
  userAnswer: item.userAnswer,
  correctAnswer: item.correctAnswer,
  explanation: item.explanation,
  errorCategory: item.errorCategory || 'general',
  errorRule: item.errorRule || '',
  contextVariants: item.contextVariants || [],
  consecutiveSuccesses: item.consecutiveSuccesses || 0,
  attemptsCount: item.attemptsCount || 1,
  mastered: Boolean(item.mastered),
  timestamp: item.createdAt || new Date().toISOString(),
  lastReviewedAt: item.lastReviewedAt,
});

interface LegacyBankItem {
  type?: string;
  questionTitle?: string;
  contextSentence?: string;
  wordTested?: string;
  isRealWord?: boolean;
  userChoseReal?: boolean;
  definition?: string;
  givenPrefix?: string;
  userInput?: string;
  correctAnswer?: string;
  tokenPrefix?: string;
  missingLetters?: string;
  fullWord?: string;
  audioSentence?: string;
  userTranscript?: string;
  similarityRatio?: number;
}

const mapLegacyItem = (item: LegacyBankItem): SaveErrorInput | null => {
  const type = normalizeErrorType(item.type || 'READ_SELECT');

  if (type === 'READ_SELECT') {
    if (!item.wordTested) return null;
    return {
      type,
      prompt: `Read and Select: "${item.wordTested}"`,
      userAnswer: item.userChoseReal === undefined ? 'No answer' : item.userChoseReal ? 'Yes' : 'No',
      correctAnswer: item.isRealWord ? 'Yes' : 'No',
      explanation:
        item.definition ||
        (item.isRealWord
          ? `"${item.wordTested}" is a real English word.`
          : `"${item.wordTested}" is a pseudo-word used as a DET trap.`),
    };
  }

  if (type === 'FILL_BLANKS') {
    const prompt = item.contextSentence || item.questionTitle;
    if (!prompt || !item.correctAnswer) return null;
    return {
      type,
      prompt,
      userAnswer: `${item.givenPrefix || ''}${item.userInput || ''}`,
      correctAnswer: `${item.givenPrefix || ''}${item.correctAnswer}`,
      explanation: item.definition,
    };
  }

  if (type === 'C_TEST') {
    const prompt =
      item.contextSentence ||
      `C-Test word: ${item.tokenPrefix || ''}[...]${item.questionTitle ? ` in "${item.questionTitle}"` : ''}`;
    const correct = item.fullWord || `${item.tokenPrefix || ''}${item.missingLetters || ''}`;
    if (!prompt || !correct) return null;
    return {
      type,
      prompt,
      userAnswer: `${item.tokenPrefix || ''}${item.userInput || ''}`,
      correctAnswer: correct,
      explanation: item.definition || `Complete word was "${correct}".`,
    };
  }

  if (type === 'LISTEN_TYPE') {
    if (!item.audioSentence) return null;
    return {
      type,
      prompt: `Dictation: "${item.audioSentence}"`,
      userAnswer: item.userTranscript || '',
      correctAnswer: item.audioSentence,
      explanation:
        typeof item.similarityRatio === 'number'
          ? `Transcript match: ${Math.round(item.similarityRatio * 100)}%.`
          : undefined,
    };
  }

  return null;
};

/**
 * One-time migration of the former local-only Error Bank. The old key is
 * removed only after every item was accepted by the unified store.
 */
async function migrateLegacyErrorBank(): Promise<void> {
  if (typeof window === 'undefined') return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_ERROR_BANK_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let legacy: LegacyBankItem[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) legacy = parsed;
  } catch {}

  const store = useErrorNotebookStore.getState();
  for (const oldItem of legacy) {
    const mapped = mapLegacyItem(oldItem);
    if (mapped) {
      await store.addError(mapped);
    }
  }

  try {
    localStorage.removeItem(LEGACY_ERROR_BANK_KEY);
  } catch {}
}

export const useErrorNotebookStore = create<ErrorNotebookState>((set, get) => ({
  // Never read a user cache at module load: that leaks the previous user's
  // errors into a fresh login before `loadForUser` runs.
  errors: [],
  activeUserId: null,
  isSyncing: false,
  syncError: null,

  resetForUser: () => {
    set({ errors: [], activeUserId: null, isSyncing: false, syncError: null });
  },

  loadForUser: async (userId) => {
    const targetUserId = userId || null;
    set({ activeUserId: targetUserId, isSyncing: true, syncError: null });

    const cached = readCache(targetUserId);
    set({ errors: cached });

    await migrateLegacyErrorBank();

    if (!hasAuthSession()) {
      set({ errors: readCache(targetUserId), isSyncing: false, syncError: null });
      return;
    }

    // Retry items that were created while the API was unavailable.
    const pending = get().errors.filter((item) => item.pendingSync);
    for (const item of pending) {
      try {
        const saved = await api.saveUserError({
          type: item.type,
          prompt: item.prompt,
          userAnswer: item.userAnswer,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
        });
        set((state) => ({
          errors: state.errors.map((current) =>
            current.id === item.id ? mapServerItem(saved) : current
          ),
        }));
      } catch {
        // Keep it pending; the next load will retry.
      }
    }

    try {
      const resp = await api.getUserErrors();
      if (get().activeUserId !== targetUserId) return;
      if (resp && Array.isArray(resp.errors)) {
        const serverItems = resp.errors.map(mapServerItem);
        // Keep still-unsaved local items next to the server truth.
        const stillPending = get().errors.filter((item) => item.pendingSync);
        const merged = [
          ...stillPending,
          ...serverItems.filter((server) => !stillPending.some((p) => p.id === server.id)),
        ];
        set({ errors: merged, isSyncing: false, syncError: null });
        persist(merged, targetUserId);
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить тетрадь ошибок';
      set({ isSyncing: false, syncError: message });
      // Keep the local cache so the user can still review what is available.
      persist(get().errors, targetUserId);
      return;
    }

    set({ isSyncing: false });
  },

  addError: async (input) => {
    const normalizedType = normalizeErrorType(input.type);
    const state = get();
    const existing = state.errors.find(
      (item) =>
        !item.mastered &&
        item.prompt === input.prompt &&
        item.correctAnswer === input.correctAnswer
    );
    if (existing) return;

    let item: ErrorItem = {
      ...input,
      type: normalizedType,
      id: 'err-' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      consecutiveSuccesses: 0,
      attemptsCount: 1,
      mastered: false,
      pendingSync: true,
    };

    if (hasAuthSession()) {
      try {
        const saved = await api.saveUserError({
          type: normalizedType,
          prompt: input.prompt,
          userAnswer: input.userAnswer,
          correctAnswer: input.correctAnswer,
          explanation: input.explanation,
        });
        item = mapServerItem(saved);
      } catch {
        // Keep the local item marked as pending; it is retried on next load.
        set({ syncError: 'Ошибка сохранена локально и будет отправлена на сервер позже.' });
      }
    }

    set((current) => {
      const withoutDuplicate = current.errors.filter(
        (entry) =>
          entry.id !== item.id &&
          !(entry.prompt === item.prompt && entry.correctAnswer === item.correctAnswer && !entry.mastered)
      );
      const updated = [item, ...withoutDuplicate];
      persist(updated, current.activeUserId);
      return { errors: updated };
    });
  },

  recallError: async (id, answer) => {
    const state = get();
    const currentItem = state.errors.find((item) => item.id === id);

    if (hasAuthSession() && currentItem && !currentItem.pendingSync) {
      try {
        const resp = await api.recallUserError(id, answer);
        set((current) => {
          const updated = current.errors.map((item) =>
            item.id === id
              ? {
                  ...item,
                  consecutiveSuccesses: resp.consecutiveSuccesses,
                  mastered: resp.mastered,
                  attemptsCount: item.attemptsCount + 1,
                  lastReviewedAt: new Date().toISOString(),
                }
              : item
          );
          persist(updated, current.activeUserId);
          return { errors: updated };
        });
        return resp;
      } catch {
        return {
          success: false,
          consecutiveSuccesses: currentItem.consecutiveSuccesses,
          mastered: currentItem.mastered,
          correctAnswer: '',
          message: 'Не удалось проверить ответ: сервер недоступен. Повторите попытку позже.',
          networkError: true,
        };
      }
    }

    if (!currentItem) {
      return {
        success: false,
        consecutiveSuccesses: 0,
        mastered: false,
        correctAnswer: '',
        message: 'Задание не найдено',
      };
    }

    const clean = (value: string) => value.trim().toLowerCase().replace(/[.,!?;:"]/g, '');
    const isCorrect = clean(answer) === clean(currentItem.correctAnswer);
    const newConsecutive = isCorrect ? currentItem.consecutiveSuccesses + 1 : 0;
    const newMastered = isCorrect && newConsecutive >= 2;

    set((current) => {
      const updated = current.errors.map((item) =>
        item.id === id
          ? {
              ...item,
              consecutiveSuccesses: newConsecutive,
              attemptsCount: item.attemptsCount + 1,
              mastered: newMastered,
              lastReviewedAt: new Date().toISOString(),
            }
          : item
      );
      persist(updated, current.activeUserId);
      return { errors: updated };
    });

    if (!isCorrect) {
      return {
        success: false,
        consecutiveSuccesses: 0,
        mastered: false,
        correctAnswer: currentItem.correctAnswer,
        explanation: currentItem.explanation,
        message: `Неверно. Правильный ответ: ${currentItem.correctAnswer}`,
      };
    }

    return {
      success: true,
      consecutiveSuccesses: newConsecutive,
      mastered: newMastered,
      correctAnswer: currentItem.correctAnswer,
      explanation: currentItem.explanation,
      message: newMastered
        ? 'Отлично! Ошибка усвоена (2 верных ответа подряд).'
        : 'Верно! Повторите в следующем раунде для закрепления (1 из 2).',
    };
  },

  removeError: async (id) => {
    const state = get();
    const item = state.errors.find((entry) => entry.id === id);
    if (!item) return;

    if (hasAuthSession() && !item.pendingSync) {
      try {
        await api.deleteUserError(id);
      } catch {
        set({ syncError: 'Не удалось удалить ошибку на сервере. Повторите попытку.' });
        return;
      }
    }

    set((current) => {
      const updated = current.errors.filter((entry) => entry.id !== id);
      persist(updated, current.activeUserId);
      return { errors: updated, syncError: null };
    });
  },

  clearAll: async () => {
    const state = get();
    if (hasAuthSession()) {
      const failed: ErrorItem[] = [];
      for (const item of state.errors) {
        if (item.pendingSync) continue;
        try {
          await api.deleteUserError(item.id);
        } catch {
          failed.push(item);
        }
      }
      if (failed.length > 0) {
        set({
          errors: failed,
          syncError: 'Часть ошибок не удалось удалить на сервере. Повторите попытку.',
        });
        persist(failed, state.activeUserId);
        return;
      }
    }

    set({ errors: [], syncError: null });
    persist([], state.activeUserId);
  },
}));
