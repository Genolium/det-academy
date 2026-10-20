'use client';

import React, { useState } from 'react';
import { useErrorNotebookStore, ErrorItem } from '@/store/useErrorNotebookStore';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';

export const ErrorNotebookWidget: React.FC = () => {
  const { errors, recallError, removeError, clearAll } = useErrorNotebookStore();
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered'>('unmastered');
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
  const [drillAnswer, setDrillAnswer] = useState<string>('');
  const [drillFeedback, setDrillFeedback] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredErrors = errors.filter((item) => {
    if (filter === 'unmastered') return !item.mastered;
    if (filter === 'mastered') return item.mastered;
    return true;
  });

  const activeCount = errors.filter((e) => !e.mastered).length;
  const masteredCount = errors.filter((e) => e.mastered).length;

  const handleStartDrill = (err: ErrorItem) => {
    setActiveDrillId(err.id);
    setDrillAnswer('');
    setDrillFeedback(null);
  };

  const handleCancelDrill = () => {
    setActiveDrillId(null);
    setDrillAnswer('');
    setDrillFeedback(null);
  };

  const handleCheckDrill = async (err: ErrorItem) => {
    if (!drillAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await recallError(err.id, drillAnswer);
      setDrillFeedback({
        id: err.id,
        success: res.success,
        message: res.message,
      });

      if (res.success && res.mastered) {
        setTimeout(() => {
          setActiveDrillId(null);
          setDrillFeedback(null);
          setDrillAnswer('');
        }, 2200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="errors" className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white">Тетрадь ошибок</h2>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeCount} на доработку
                </span>
              )}
              {masteredCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {masteredCount} усвоено
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Интервальное исправление: ошибка считается усвоенной только после 2 верных ответов подряд.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-[11px] font-bold">
            <button
              onClick={() => setFilter('unmastered')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'unmastered'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Активные ({activeCount})
            </button>
            <button
              onClick={() => setFilter('mastered')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'mastered'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Усвоенные ({masteredCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Все ({errors.length})
            </button>
          </div>
          {errors.length > 0 && (
            <button
              onClick={clearAll}
              className="p-2 text-neutral-500 hover:text-red-400 transition-colors rounded-lg hover:bg-neutral-900 cursor-pointer"
              title="Очистить тетрадь"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredErrors.length === 0 ? (
        <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {filter === 'mastered' ? 'Пока нет усвоенных ошибок' : 'Активных ошибок нет!'}
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {filter === 'mastered'
                ? 'Решите активные ошибки 2 раза подряд, чтобы перевести их в статус усвоенных.'
                : 'Все сложные моменты отработаны, либо вы еще не проходили практические тренировки.'}
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D2F544]" />
              <span>Перейти к тренажерам</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
          {filteredErrors.map((err) => {
            const isDrilling = activeDrillId === err.id;
            const feedback = drillFeedback?.id === err.id ? drillFeedback : null;

            return (
              <div
                key={err.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  err.mastered
                    ? 'bg-neutral-900/30 border-neutral-800/50 opacity-75'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    <span className="text-amber-400 font-mono">{err.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">
                        Попыток: {err.attemptsCount}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-500">
                        {new Date(err.timestamp).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-white line-clamp-2">{err.prompt}</p>

                  {/* Previous Answer Comparison */}
                  {!isDrilling && (
                    <div className="mt-2.5 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-red-400">
                        <span className="text-neutral-500 text-[10px]">Ваш ответ:</span>
                        <span className="font-mono bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/40">
                          {err.userAnswer || '—'}
                        </span>
                      </div>
                      {err.explanation && (
                        <p className="text-[11px] text-neutral-400 italic pt-1">
                          {err.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Active Recall Drill Area */}
                  {isDrilling && (
                    <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#D2F544] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Контрольный ввод по памяти
                        </span>
                        <span className="text-neutral-400 text-[10px]">
                          Прогресс: {err.consecutiveSuccesses}/2
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={drillAnswer}
                          onChange={(e) => setDrillAnswer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCheckDrill(err);
                          }}
                          placeholder="Введите правильный ответ..."
                          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleCheckDrill(err)}
                          disabled={!drillAnswer.trim() || isSubmitting}
                          className="px-3 py-1.5 bg-[#D2F544] hover:bg-[#c4f22c] disabled:opacity-40 text-[#0C2418] text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Проверить</span>
                        </button>
                        <button
                          onClick={handleCancelDrill}
                          className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
                          title="Отмена"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {feedback && (
                        <div
                          className={`p-2 rounded-lg text-[11px] font-semibold border ${
                            feedback.success
                              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                              : 'bg-red-950/60 border-red-800/80 text-red-300'
                          }`}
                        >
                          {feedback.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Status & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    {err.mastered ? (
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Усвоено (2/2)</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              err.consecutiveSuccesses >= 1 ? 'bg-[#D2F544]' : 'bg-neutral-700'
                            }`}
                          />
                          <span
                            className={`w-2 h-2 rounded-full ${
                              err.consecutiveSuccesses >= 2 ? 'bg-[#D2F544]' : 'bg-neutral-700'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {err.consecutiveSuccesses}/2 повторений
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDrilling && (
                      <button
                        onClick={() => handleStartDrill(err)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <RotateCcw className="w-3 h-3 text-[#D2F544]" />
                        <span>{err.mastered ? 'Повторить еще раз' : 'Отработать'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => removeError(err.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                      title="Удалить из тетради"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
