'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';

interface Placement {
  available: boolean;
  level?: string;
  overall?: number;
  completedAt?: string;
}

/** Level estimated by the short onboarding diagnostic. */
export const PlacementCard: React.FC = () => {
  const { locale } = useSettingsStore();
  const [placement, setPlacement] = useState<Placement | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getPlacement()
      .then((data) => {
        if (mounted) setPlacement(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!placement) return null;
  const ru = locale === 'ru';

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="w-4 h-4 text-[#D2F544]" />
        <h3 className="text-xs font-black uppercase tracking-wider text-white">
          {ru ? 'Ваш уровень' : 'Your level'}
        </h3>
      </div>

      {placement.available ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="text-2xl font-black text-[#D2F544]">{placement.level}</div>
            <span className="text-[11px] text-neutral-500">
              {ru ? 'по диагностике' : 'from the diagnostic'} · {placement.completedAt}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
            {ru
              ? `Ориентировочный уровень ${placement.level} по короткой адаптивной диагностике. Это не официальный балл DET.`
              : `Estimated ${placement.level} from the short adaptive diagnostic. Not an official DET score.`}
          </p>
          <Link
            href="/test"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D2F544] hover:underline"
          >
            {ru ? 'Пройти полный mock' : 'Take a full mock'} <ArrowRight className="w-3 h-3" />
          </Link>
        </>
      ) : (
        <>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {ru
              ? 'Пройдите короткую диагностику (около 10 минут): платформа определит стартовый уровень A2–C2 и настроит сложность.'
              : 'Take a short diagnostic (~10 min): the platform estimates your A2–C2 level and calibrates the difficulty.'}
          </p>
          <Link
            href="/diagnostic"
            className="mt-3 inline-flex items-center gap-1.5 bg-[#D2F544] text-[#0E1012] font-black text-[11px] px-3.5 py-1.5 rounded-full"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {ru ? 'Определить уровень' : 'Estimate my level'}
          </Link>
        </>
      )}
    </div>
  );
};
