'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, RefreshCw, Sparkles } from 'lucide-react';
import { api, AdaptivePractice } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ErrorNotebookWidget } from '@/components/dashboard/ErrorNotebookWidget';

export default function AdaptivePracticePage() {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const [plan, setPlan] = useState<AdaptivePractice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    api
      .getAdaptivePractice()
      .then(setPlan)
      .catch(() => setError(ru ? 'Не удалось собрать набор. Попробуйте ещё раз.' : 'Could not build the practice set. Try again.'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen py-10 ambient-glow">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/50 bg-[#D2F544]/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#0C2418]">
              <Brain className="h-3.5 w-3.5" /> {ru ? 'Адаптивная практика' : 'Adaptive practice'}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#0E1012] sm:text-4xl">
              {plan?.title || (ru ? 'Собираем набор из ваших ошибок' : 'Building a set from your errors')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              {plan?.reason || (ru ? 'Набор строится по неусвоенным записям тетради ошибок, а не по случайным заданиям.' : 'The set is built from unmastered Error Notebook entries, not random questions.')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:border-neutral-500"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {ru ? 'Пересобрать' : 'Rebuild'}
            </button>
            {plan?.focusSlug && (
              <Link
                href={`/practice?drill=${plan.focusSlug}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#0E1012] px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-800"
              >
                {ru ? 'Открыть тренажёр' : 'Open the drill'} <ArrowRight className="h-3.5 w-3.5 text-[#D2F544]" />
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-bold text-[#0E1012] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#D2F544]" />
            {plan?.errorCount || 0} {ru ? 'неусвоенных ошибок' : 'unmastered errors'}
          </span>
          <span>{plan?.focusType || '—'}</span>
          <span>· {plan?.minutes || 10} {ru ? 'минут' : 'minutes'}</span>
        </div>

        <ErrorNotebookWidget />
      </div>
    </div>
  );
}
