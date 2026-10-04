'use client';

import React from 'react';
import Link from 'next/link';
import { BentoCard } from '@/components/ui/BentoCard';
import { PillBadge } from '@/components/ui/PillBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Cpu, Keyboard, BookOpen, Award, ArrowUpRight, Zap, Target } from 'lucide-react';

export const BentoGrid: React.FC = () => {
  const { locale } = useSettingsStore();
  const t = translations[locale].bento;

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <PillBadge variant="dark" prefixHash className="mb-3">
            {t.sectionBadge}
          </PillBadge>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E1012] uppercase tracking-tight">
            {t.sectionTitle}
          </h2>
        </div>
        <p className="text-sm text-neutral-500 max-w-md">
          {t.sectionSubtitle}
        </p>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Lead Accent Card: Electric Lime (7 cols) */}
        <BentoCard variant="lime" className="md:col-span-7 flex flex-col justify-between group cursor-pointer relative overflow-hidden">
          <Link href="/test" className="block h-full">
            <div className="flex items-center justify-between mb-8">
              <PillBadge variant="dark" prefixHash>
                #CAT ENGINE
              </PillBadge>
              <div className="w-12 h-12 rounded-full bg-[#0C2418] text-[#D2F544] flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <h3 className="text-2xl sm:text-4xl font-black uppercase text-[#0C2418] leading-tight">
                {t.adaptiveCatTitle}
              </h3>
              <p className="text-sm sm:text-base text-[#0C2418]/80 font-medium leading-relaxed">
                {t.adaptiveCatDesc}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#0C2418]/15 flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0C2418]">
                <Cpu className="w-4 h-4" />
                {t.taskTypesMvp}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0C2418]">
                <Zap className="w-4 h-4" />
                {t.liveFeedback}
              </div>
            </div>
          </Link>
        </BentoCard>

        {/* Pitch Black Dark Module: DET Typing Trainer (5 cols) */}
        <BentoCard variant="dark" className="md:col-span-5 flex flex-col justify-between group cursor-pointer">
          <Link href="/practice/typing" className="block h-full">
            <div className="flex items-center justify-between mb-6">
              <PillBadge variant="lime" prefixHash>
                #DET_TYPING
              </PillBadge>
              <div className="w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#D2F544] font-mono">
                <Keyboard className="w-4 h-4" />
                <span>WPM: 85+ • Acc: 98%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold uppercase text-white">
                {t.typingTitle}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {t.typingDesc}
              </p>
            </div>

            <div className="mt-6 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">DET Vocabulary:</span>
              <span className="text-[#D2F544] font-bold">{t.vocabCount}</span>
            </div>
          </Link>
        </BentoCard>

        {/* Theory Module (6 cols) */}
        <BentoCard variant="mint" className="md:col-span-6 flex flex-col justify-between group cursor-pointer">
          <Link href="/theory" className="block h-full">
            <div className="flex items-center justify-between mb-6">
              <PillBadge variant="dark" prefixHash>
                #KNOWLEDGE BASE
              </PillBadge>
              <BookOpen className="w-6 h-6 text-[#0C2418]" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold uppercase text-[#0C2418]">
                {t.theoryTitle}
              </h3>
              <p className="text-xs sm:text-sm text-[#0C2418]/80 leading-relaxed">
                {t.theoryDesc}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-semibold text-[#0C2418]">
                ✓ OREO Formula
              </span>
              <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-semibold text-[#0C2418]">
                ✓ 4-step Photo
              </span>
              <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-semibold text-[#0C2418]">
                ✓ C-Test Traps
              </span>
            </div>
          </Link>
        </BentoCard>

        {/* Certificate Module (6 cols) */}
        <BentoCard variant="light" className="md:col-span-6 flex flex-col justify-between group cursor-pointer border-2 border-neutral-200">
          <Link href="/verify/det-cert-8f921a4" className="block h-full">
            <div className="flex items-center justify-between mb-6">
              <PillBadge variant="slate" prefixHash>
                #CREDENTIALS
              </PillBadge>
              <Award className="w-6 h-6 text-blue-600" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold uppercase text-[#0E1012]">
                {t.certificateTitle}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {t.certificateDesc}
              </p>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-neutral-800">{t.certCondition}</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                {t.certReq}
              </span>
            </div>
          </Link>
        </BentoCard>
      </div>
    </section>
  );
};
