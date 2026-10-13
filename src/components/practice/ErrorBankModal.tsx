'use client';

import React, { useState } from 'react';
import { useErrorBankStore, ErrorItem, ErrorType } from '@/store/useErrorBankStore';
import { sound } from '@/lib/sound';
import { stringSimilarity } from '@/lib/scoring';
import { Button } from '@/components/ui/Button';
import { PillBadge } from '@/components/ui/PillBadge';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Sparkles,
  BookOpen,
  Volume2,
  Layers,
  FileText,
  X,
  Check,
  Trophy,
} from 'lucide-react';

interface ErrorBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorBankModal: React.FC<ErrorBankModalProps> = ({ isOpen, onClose }) => {
  const {
    errors,
    recordRetry,
    markMastered,
    removeError,
    clearAllErrors,
    getUnmasteredCount,
    getMasteryRate,
  } = useErrorBankStore();

  const [activeFilter, setActiveFilter] = useState<'ALL' | ErrorType>('ALL');
  const [retryInputMap, setRetryInputMap] = useState<Record<string, string>>({});
  const [activeRetryId, setActiveRetryId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredErrors = errors.filter((err) => {
    if (activeFilter === 'ALL') return true;
    return err.type === activeFilter;
  });

  const unmasteredCount = getUnmasteredCount();
  const masteryRate = getMasteryRate();

  const handleTestRetry = (item: ErrorItem) => {
    const rawInput = (retryInputMap[item.id] || '').trim().toLowerCase();
    const cleanInput = rawInput.replace(/[.,!?;:"]/g, '').trim();
    let isCorrect = false;

    if (item.type === 'FILL_BLANKS') {
      const targetFull = (item.correctAnswer || '').toLowerCase().replace(/[.,!?;:"]/g, '').trim();
      const targetMissing = (item.missingLetters || '').toLowerCase().replace(/[.,!?;:"]/g, '').trim();
      isCorrect = cleanInput === targetMissing || cleanInput === targetFull;
    } else if (item.type === 'C_TEST') {
      const targetMissing = (item.missingLetters || '').toLowerCase().replace(/[.,!?;:"]/g, '').trim();
      const targetFull = (item.fullWord || '').toLowerCase().replace(/[.,!?;:"]/g, '').trim();
      isCorrect = cleanInput === targetMissing || cleanInput === targetFull;
    } else if (item.type === 'LISTEN_TYPE') {
      const target = (item.audioSentence || '').toLowerCase().replace(/[.,!?;:"]/g, '').trim();
      const sim = stringSimilarity(cleanInput, target);
      isCorrect = cleanInput === target || sim >= 0.85;
    } else if (item.type === 'READ_SELECT') {
      // Choice is boolean
      isCorrect = cleanInput === String(item.isRealWord);
    }

    if (isCorrect) {
      sound.correct();
      recordRetry(item.id, true);
    } else {
      sound.incorrect();
      recordRetry(item.id, false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  Smart Error Bank
                </span>
                <span className="text-neutral-500 text-xs">•</span>
                <span className="text-xs font-bold text-neutral-400">
                  Работа над ошибками DET
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Банк личных ошибок и умные пересдачи
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Filters Bar */}
        <div className="p-6 bg-neutral-950/60 border-b border-neutral-800/80 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Всего ошибок</span>
              <div className="text-xl font-black text-white mt-0.5">{errors.length}</div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Требуют повтора</span>
              <div className="text-xl font-black text-amber-300 mt-0.5">{unmasteredCount}</div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Усвоено (Mastered)</span>
              <div className="text-xl font-black text-emerald-300 mt-0.5">
                {errors.length - unmasteredCount}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-[#D2F544] block">Процент усвоения</span>
              <div className="text-xl font-black text-[#D2F544] mt-0.5">{masteryRate}%</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-white text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Все ({errors.length})
              </button>
              <button
                onClick={() => setActiveFilter('C_TEST')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'C_TEST'
                    ? 'bg-[#D2F544] text-[#0C2418]'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                C-Test ({errors.filter((e) => e.type === 'C_TEST').length})
              </button>
              <button
                onClick={() => setActiveFilter('LISTEN_TYPE')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'LISTEN_TYPE'
                    ? 'bg-[#D2F544] text-[#0C2418]'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Диктанты ({errors.filter((e) => e.type === 'LISTEN_TYPE').length})
              </button>
              <button
                onClick={() => setActiveFilter('READ_SELECT')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'READ_SELECT'
                    ? 'bg-[#D2F544] text-[#0C2418]'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Read & Select ({errors.filter((e) => e.type === 'READ_SELECT').length})
              </button>
              <button
                onClick={() => setActiveFilter('FILL_BLANKS')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'FILL_BLANKS'
                    ? 'bg-[#D2F544] text-[#0C2418]'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Fill Blanks ({errors.filter((e) => e.type === 'FILL_BLANKS').length})
              </button>
            </div>

            {errors.length > 0 && (
              <button
                onClick={clearAllErrors}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Очистить весь банк
              </button>
            )}
          </div>
        </div>

        {/* Error Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredErrors.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D2F544]/10 text-[#D2F544] border border-[#D2F544]/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Ошибок в этой категории нет</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Ошибки из адаптивных тестов и свободных дриллов автоматически сохраняются здесь для отработки.
              </p>
            </div>
          ) : (
            filteredErrors.map((item) => {
              const isRetrying = activeRetryId === item.id;
              const userVal = retryInputMap[item.id] || '';

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
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 uppercase">
                          {item.type.replace('_', ' ')}
                        </span>
                        {item.mastered ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Усвоено
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                            Требует пересдачи (попыток: {item.attemptsCount})
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content specific description */}
                      {item.type === 'C_TEST' && (
                        <div>
                          <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                            {item.contextSentence || `Контекст: ${item.tokenPrefix}[...]`}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Правильное слово: <strong className="text-[#D2F544] font-mono">{item.fullWord}</strong> (пропуск: <span className="text-white font-mono">{item.missingLetters}</span>)
                          </p>
                        </div>
                      )}

                      {item.type === 'FILL_BLANKS' && (
                        <div>
                          <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                            {item.contextSentence}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Начало: <strong className="text-neutral-200">{item.givenPrefix}</strong> • Ответ:{' '}
                            <strong className="text-[#D2F544] font-mono">{item.correctAnswer}</strong>
                          </p>
                        </div>
                      )}

                      {item.type === 'LISTEN_TYPE' && (
                        <div>
                          <p className="text-xs text-neutral-200 font-serif italic mb-1">
                            &quot;{item.audioSentence}&quot;
                          </p>
                          {item.userTranscript && (
                            <p className="text-xs text-red-300 font-mono">
                              Ваш ввод: &quot;{item.userTranscript}&quot;
                            </p>
                          )}
                        </div>
                      )}

                      {item.type === 'READ_SELECT' && (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-mono">{item.wordTested}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.isRealWord ? 'bg-emerald-950 text-emerald-300' : 'text-red-400 bg-red-950'
                            }`}>
                              {item.isRealWord ? 'Реальное слово английского языка' : 'Псевдослово (ловушка DET)'}
                            </span>
                          </div>
                          {item.definition && (
                            <p className="text-xs text-neutral-400 mt-1">{item.definition}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveRetryId(isRetrying ? null : item.id)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[#D2F544] transition-colors"
                        title="Попробовать пересдать"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeError(item.id)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Удалить из банка"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Retry Interactive Input Box */}
                  {isRetrying && (
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center gap-2">
                      {item.type === 'READ_SELECT' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-300">Это слово существует?</span>
                          <Button
                            size="sm"
                            onClick={() => {
                              const isCorrect = item.isRealWord === true;
                              if (isCorrect) sound.correct(); else sound.incorrect();
                              recordRetry(item.id, isCorrect);
                            }}
                            className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Да (Реальное)
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const isCorrect = item.isRealWord === false;
                              if (isCorrect) sound.correct(); else sound.incorrect();
                              recordRetry(item.id, isCorrect);
                            }}
                            className="text-xs py-1 px-3 bg-red-600 hover:bg-red-700 text-white"
                          >
                            Нет (Псевдослово)
                          </Button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={userVal}
                            onChange={(e) =>
                              setRetryInputMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleTestRetry(item);
                            }}
                            placeholder="Введите ваш исправленный ответ..."
                            className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D2F544] font-mono"
                            autoFocus
                          />
                          <Button
                            size="sm"
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
