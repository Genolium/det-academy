'use client';

import React, { useEffect, useState } from 'react';
import {
  useErrorNotebookStore,
  ErrorItem,
  ErrorType,
  errorTypeLabel,
} from '@/store/useErrorNotebookStore';
import { useAuthStore } from '@/store/useAuthStore';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/Button';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Trash2,
  X,
  Check,
} from 'lucide-react';

interface ErrorBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTERS: Array<'ALL' | ErrorType> = [
  'ALL',
  'C_TEST',
  'LISTEN_TYPE',
  'READ_SELECT',
  'FILL_BLANKS',
];

export const ErrorBankModal: React.FC<ErrorBankModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const {
    errors,
    isSyncing,
    syncError,
    loadForUser,
    recallError,
    removeError,
    clearAll,
  } = useErrorNotebookStore();

  const [activeFilter, setActiveFilter] = useState<'ALL' | ErrorType>('ALL');
  const [retryInputMap, setRetryInputMap] = useState<Record<string, string>>({});
  const [activeRetryId, setActiveRetryId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string; success: boolean } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void loadForUser(user?.id ?? null);
    }
  }, [isOpen, user?.id, loadForUser]);

  if (!isOpen) return null;

  const filteredErrors = errors.filter((err) => {
    if (activeFilter === 'ALL') return true;
    return err.type === activeFilter;
  });

  const unmasteredCount = errors.filter((err) => !err.mastered).length;
  const masteryRate =
    errors.length === 0
      ? 100
      : Math.round(((errors.length - unmasteredCount) / errors.length) * 100);

  const submitRetry = async (item: ErrorItem, answer: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await recallError(item.id, answer);
      if (result.success) sound.correct();
      else if (!result.networkError) sound.incorrect();
      setFeedback({ id: item.id, message: result.message, success: result.success });
      if (result.mastered) {
        setActiveRetryId(null);
        setRetryInputMap((prev) => ({ ...prev, [item.id]: '' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestRetry = (item: ErrorItem) => {
    const answer = (retryInputMap[item.id] || '').trim();
    if (!answer) return;
    void submitRetry(item, answer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  Error Notebook
                </span>
                <span className="text-neutral-500 text-xs">•</span>
                <span className="text-xs font-bold text-neutral-400">
                  Синхронизировано с вашим аккаунтом
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Банк личных ошибок и пересдачи
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Закрыть банк ошибок"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-neutral-950/60 border-b border-neutral-800/80 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Всего ошибок
              </span>
              <div className="text-xl font-black text-white mt-0.5">{errors.length}</div>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">
                Требуют повтора
              </span>
              <div className="text-xl font-black text-amber-300 mt-0.5">{unmasteredCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Усвоено
              </span>
              <div className="text-xl font-black text-emerald-300 mt-0.5">
                {errors.length - unmasteredCount}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-[#D2F544] block">
                Процент усвоения
              </span>
              <div className="text-xl font-black text-[#D2F544] mt-0.5">{masteryRate}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTERS.map((filter) => {
                const count =
                  filter === 'ALL'
                    ? errors.length
                    : errors.filter((item) => item.type === filter).length;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      activeFilter === filter
                        ? 'bg-[#D2F544] text-[#0C2418]'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {filter === 'ALL' ? 'Все' : errorTypeLabel(filter)} ({count})
                  </button>
                );
              })}
            </div>

            {errors.length > 0 && (
              <button
                onClick={() => void clearAll()}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Очистить весь банк
              </button>
            )}
          </div>

          {isSyncing && (
            <p className="text-[11px] text-neutral-400">Синхронизация с сервером...</p>
          )}
          {syncError && <p className="text-[11px] text-amber-400">{syncError}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredErrors.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D2F544]/10 text-[#D2F544] border border-[#D2F544]/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Ошибок в этой категории нет</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Ошибки из адаптивных тестов и свободных дриллов автоматически сохраняются здесь для
                отработки.
              </p>
            </div>
          ) : (
            filteredErrors.map((item) => {
              const isRetrying = activeRetryId === item.id;
              const userVal = retryInputMap[item.id] || '';
              const itemFeedback = feedback?.id === item.id ? feedback : null;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.mastered
                      ? 'bg-neutral-950/40 border-neutral-800/60 opacity-80'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 uppercase">
                          {errorTypeLabel(item.type)}
                        </span>
                        {item.errorCategory && item.errorCategory !== 'general' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                            {item.errorCategory}
                          </span>
                        )}
                        {item.mastered ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Усвоено
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                            Требует пересдачи (попыток: {item.attemptsCount})
                          </span>
                        )}
                        {item.pendingSync && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                            Ждёт синхронизации
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500">
                          {new Date(item.timestamp).toLocaleDateString('ru-RU')}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-200 leading-relaxed break-words">
                        {item.prompt}
                      </p>
                      {item.errorRule && (
                        <p className="text-[11px] text-amber-300/90 font-medium mt-1">
                          Правило: {item.errorRule}
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-1 text-xs">
                        <span className="text-red-300 font-mono break-words">
                          Ваш ответ: {item.userAnswer || '—'}
                        </span>
                        <span className="text-[#D2F544] font-mono break-words">
                          Правильный ответ: {item.correctAnswer}
                        </span>
                        {item.explanation && (
                          <span className="text-[11px] text-neutral-400 italic">
                            {item.explanation}
                          </span>
                        )}
                      </div>

                      {item.contextVariants && item.contextVariants.length > 0 && (
                        <div className="mt-3 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            Отработка в новом контексте:
                          </span>
                          <p className="text-[11px] text-neutral-300 font-mono">
                            {item.contextVariants[0].prompt}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setActiveRetryId(isRetrying ? null : item.id);
                          setFeedback(null);
                        }}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[#D2F544] transition-colors"
                        title="Попробовать пересдать"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void removeError(item.id)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Удалить из банка"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {itemFeedback && (
                    <p
                      className={`mt-2 text-[11px] font-semibold ${
                        itemFeedback.success ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {itemFeedback.message}
                    </p>
                  )}

                  {isRetrying && (
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-2">
                      {item.type === 'READ_SELECT' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-300">
                            Это слово существует?
                          </span>
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => void submitRetry(item, 'yes')}
                            className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Да
                          </Button>
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => void submitRetry(item, 'no')}
                            className="text-xs py-1 px-3 bg-red-600 hover:bg-red-700 text-white"
                          >
                            Нет
                          </Button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={userVal}
                            onChange={(e) =>
                              setRetryInputMap((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleTestRetry(item);
                            }}
                            placeholder="Введите ваш исправленный ответ..."
                            className="flex-1 min-w-[220px] px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D2F544] font-mono"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            disabled={isSubmitting || !userVal.trim()}
                            onClick={() => handleTestRetry(item)}
                            className="bg-[#D2F544] text-[#0C2418] hover:bg-[#c3e839] text-xs font-bold py-1.5 px-3"
                          >
                            Проверить
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
