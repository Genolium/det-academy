'use client';

import React from 'react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Check, X, MapPin, ArrowRight } from 'lucide-react';
import { BentoCard } from '@/components/ui/BentoCard';
import { PillBadge } from '@/components/ui/PillBadge';

export const ComparisonTable: React.FC = () => {
  const { locale } = useSettingsStore();
  const t = translations[locale].comparison;

  const rows = [
    { label: t.price, det: t.detPrice, ielts: t.ieltsPrice, detWin: true },
    { label: t.format, det: t.detFormat, ielts: t.ieltsFormat, detWin: true },
    { label: t.duration, det: t.detDuration, ielts: t.ieltsDuration, detWin: true },
    { label: t.results, det: t.detResults, ielts: t.ieltsResults, detWin: true },
    { label: t.recognition, det: t.detRecognition, ielts: t.ieltsRecognition, detWin: false },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-y border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <PillBadge variant="mint" prefixHash className="mb-3">
            DET vs Traditional Exams
          </PillBadge>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E1012] uppercase tracking-tight mb-4">
            {t.title}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
          <Link
            href="/institutions"
            className="inline-flex items-center gap-2 mt-6 bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-95"
          >
            <MapPin className="w-4 h-4" />
            {t.mapButton}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Comparison Grid */}
        <div className="overflow-hidden rounded-3xl border border-neutral-200 shadow-sm bg-white">
          <div className="grid grid-cols-12 bg-neutral-900 text-white p-4 sm:p-6 font-bold text-xs sm:text-sm uppercase tracking-wider">
            <div className="col-span-4 sm:col-span-4">{t.feature}</div>
            <div className="col-span-4 sm:col-span-4 text-[#D2F544] flex items-center gap-1.5">
              <span>{t.det}</span>
              <span className="hidden sm:inline bg-[#D2F544] text-[#0C2418] text-[10px] px-2 py-0.5 rounded-full font-black">WIN</span>
            </div>
            <div className="col-span-4 sm:col-span-4 text-neutral-400">{t.ielts}</div>
          </div>

          <div className="divide-y divide-neutral-100">
            {rows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-12 p-4 sm:p-5 text-xs sm:text-sm items-center hover:bg-neutral-50/70 transition-colors"
              >
                <div className="col-span-4 font-semibold text-neutral-900">{row.label}</div>
                <div className="col-span-4 font-bold text-emerald-700 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <span>{row.det}</span>
                </div>
                <div className="col-span-4 text-neutral-500 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <span className="text-neutral-400 text-xs">•</span>
                  </div>
                  <span>{row.ielts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
