'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ONBOARDING_DONE_STORAGE_KEY } from '@/data/quickPlacement';

/**
 * One-time invitation to the three-step onboarding. It is shown to every
 * account until the wizard is finished or explicitly postponed, so existing
 * users get the same explanation of the exam, the typing requirement and the
 * level estimate as new ones.
 */
export const OnboardingPrompt: React.FC = () => {
  const { locale } = useSettingsStore();
  const [visible, setVisible] = useState(false);
  const ru = locale === 'ru';

  useEffect(() => {
    setVisible(localStorage.getItem(ONBOARDING_DONE_STORAGE_KEY) !== 'true');
  }, []);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[#D2F544]/40 bg-[#D2F544]/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#D2F544] text-[#0C2418]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-black text-white">
            {ru ? '3 минуты: экзамен, цель и ваш уровень' : '3 minutes: the exam, your goal and your level'}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-300">
            {ru
              ? 'Короткий онбординг объяснит формат, зачем нужна слепая печать и даст ориентир A2–C1 до первой диагностики.'
              : 'The short onboarding explains the format, why touch typing matters and gives an A2–C1 estimate before the first diagnostic.'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(ONBOARDING_DONE_STORAGE_KEY, 'true');
            setVisible(false);
          }}
          className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={ru ? 'Скрыть предложение онбординга' : 'Dismiss onboarding prompt'}
        >
          <X className="h-4 w-4" />
        </button>
        <Link
          href="/welcome"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#D2F544] px-4 py-2 text-xs font-black text-[#0C2418] transition-colors hover:bg-[#C4F22C]"
        >
          {ru ? 'Пройти' : 'Start'} <ArrowRight className="h-3.5 w-3.5 text-[#0C2418]" />
        </Link>
      </div>
    </div>
  );
};
