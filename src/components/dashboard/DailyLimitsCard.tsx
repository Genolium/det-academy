'use client';

import React, { useEffect, useState } from 'react';
import { Gauge, Info } from 'lucide-react';
import { api, DailyLimits } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';

/** Shows the server-enforced daily allowance so limits never surprise a student. */
export const DailyLimitsCard: React.FC = () => {
  const { locale } = useSettingsStore();
  const [limits, setLimits] = useState<DailyLimits | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getDailyLimits()
      .then((data) => {
        if (mounted) setLimits(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!limits || ((limits.mockLimit ?? 0) <= 0 && (limits.speakingLimit ?? 0) <= 0)) return null;

  const ru = locale === 'ru';
  const row = (label: string, used: number, limit: number) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-400">{label}</span>
      <span className={`font-black ${used >= limit && limit > 0 ? 'text-rose-400' : 'text-white'}`}>
        {used}/{limit > 0 ? limit : '∞'}
      </span>
    </div>
  );

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#D2F544]" />
          {ru ? 'Лимиты на сегодня' : 'Today’s limits'}
        </h3>
        <span className="text-[10px] uppercase font-bold text-neutral-500">{limits.date}</span>
      </div>
      <div className="space-y-2">
        {limits.mockLimit > 0 && row(ru ? 'Полные пробные тесты' : 'Full mock tests', limits.mockUsed, limits.mockLimit)}
        {limits.speakingLimit > 0 && row(ru ? 'Задания speaking' : 'Speaking tasks', limits.speakingUsed, limits.speakingLimit)}
      </div>
      <p className="text-[10px] text-neutral-500 mt-3 flex items-start gap-1.5 leading-relaxed">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        {ru
          ? 'Лимиты обновляются в 00:00 UTC и защищают от переутомления. Диагностика и чтение без ограничений.'
          : 'Limits reset at 00:00 UTC. Diagnostics and reading practice stay unlimited.'}
      </p>
    </div>
  );
};
