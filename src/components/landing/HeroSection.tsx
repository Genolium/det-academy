'use client';

import React from 'react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { locale } = useSettingsStore();
  const t = translations[locale].hero;

  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden ambient-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <PillBadge variant="mint" prefixHash>
            DET Academy {new Date().getFullYear()}
          </PillBadge>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest hidden sm:inline">
            • {t.badge}
          </span>
        </div>

        {/* Main Headline with Embedded Inline Pill */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#0E1012] max-w-5xl mx-auto leading-[1.1] mb-6 uppercase">
          {t.titlePart1}{' '}
          <span className="inline-block align-middle my-1 px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-[#D2F544] text-[#0C2418] text-3xl sm:text-5xl lg:text-6xl font-black border-2 border-[#BCE828] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform">
            [ {t.titlePill} ]
          </span>{' '}
          {t.titlePart2}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          {t.subtitle}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/test">
            <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
              {t.ctaPrimary}
            </Button>
          </Link>
          <Link href="/theory">
            <Button variant="outline" size="lg">
              {t.ctaSecondary}
            </Button>
          </Link>
        </div>

        {/* High Impact Micro Badges — скрыто, пока нет реальной статистики пользователей
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4 border-t border-neutral-200/80">
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{t.statsUsers}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t.statsPassRate}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t.statsScore}</span>
          </div>
        </div>
        */}
      </div>
    </section>
  );
};
