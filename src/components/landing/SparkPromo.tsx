'use client';

import React from 'react';
import { ArrowUpRight, Sparkles, Ticket } from 'lucide-react';
import { PillBadge } from '@/components/ui/PillBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';

const SPARK_URL = 'https://so-called-spark.ru';
const PROMO_CODE = 'DET_ACADEMY';

/**
 * Рекламный блок продукта «так называемый SPARK».
 * Поддерживает локализацию на русский и английский языки.
 */
export const SparkPromo: React.FC = () => {
  const { locale } = useSettingsStore();
  const t = translations[locale].sparkPromo;

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <a
        href={SPARK_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-[32px] bg-[#D2F544] text-[#0C2418] p-8 sm:p-12 shadow-xl hover:shadow-2xl transition-shadow"
      >
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/30 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <PillBadge variant="dark" prefixHash>
                {t.badge1}
              </PillBadge>
              <PillBadge variant="outline" prefixHash>
                {t.badge2}
              </PillBadge>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#0C2418] animate-pulse" />
              {t.status}
              <span className="opacity-50">•</span>
              {t.campaignStart}
            </div>

            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[1.02]">
              {t.headlinePart1}
              <br />
              {t.headlinePart2}
              <br />
              {t.headlinePart3}
            </h2>

            <p className="text-sm sm:text-base font-medium leading-relaxed max-w-2xl text-[#0C2418]/80">
              {t.description}
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
            <div className="inline-flex items-center gap-2 bg-[#0E1012] text-white rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider">
              <Ticket className="w-4 h-4 text-[#D2F544]" />
              {t.promoCodeLabel}
              <span className="font-mono text-[#D2F544] text-sm">{PROMO_CODE}</span>
            </div>

            <span className="inline-flex items-center gap-2 bg-[#0E1012] group-hover:bg-black text-[#D2F544] rounded-full px-7 py-4 font-black text-sm uppercase tracking-wider transition-transform group-hover:scale-[1.03]">
              <Sparkles className="w-4 h-4" />
              {t.applyBtn}
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
        </div>
      </a>
    </section>
  );
};
