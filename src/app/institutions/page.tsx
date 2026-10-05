'use client';

import dynamic from 'next/dynamic';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';

import { useState } from 'react';
import { DuolingoRegistry } from '@/components/institutions/DuolingoRegistry';
import { Map, BookOpen } from 'lucide-react';

const InstitutionsMap = dynamic(
  () => import('@/components/institutions/InstitutionsMap').then((mod) => mod.InstitutionsMap),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[520px] bg-neutral-900 rounded-3xl flex items-center justify-center text-white text-xs font-bold">
        <div className="w-7 h-7 border-2 border-neutral-700 border-t-[#D2F544] rounded-full animate-spin mr-3" />
        Loading interactive global universities map...
      </div>
    ),
  }
);

export default function InstitutionsPage() {
  const { locale } = useSettingsStore();
  const t = translations[locale].institutions;
  const [activeTab, setActiveTab] = useState<'registry' | 'map'>('registry');

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <PillBadge variant="mint" prefixHash>
              {t.badge}
            </PillBadge>
            <span className="text-xs uppercase font-bold text-neutral-500">
              {t.countTag}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#0E1012] tracking-tight mb-4">
            {t.title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            {t.subtitle}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 text-left">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-2xl font-black text-[#0E1012] block">{t.statsWorld}</span>
              <span className="text-xs text-neutral-500">{t.statsWorldLabel}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-2xl font-black text-emerald-600 block">{t.statsIvy}</span>
              <span className="text-xs text-neutral-500">{t.statsIvyLabel}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-2xl font-black text-purple-600 block">{t.statsAvg}</span>
              <span className="text-xs text-neutral-500">{t.statsAvgLabel}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-2xl font-black text-[#0C2418] block">{t.statsReports}</span>
              <span className="text-xs text-neutral-500">{t.statsReportsLabel}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'registry'
                ? 'bg-[#0E1012] text-white shadow-lg shadow-neutral-900/20'
                : 'bg-white text-neutral-600 hover:text-[#0E1012] border border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#D2F544]" />
            Официальный реестр (4,087 вузов)
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-[#0E1012] text-white shadow-lg shadow-neutral-900/20'
                : 'bg-white text-neutral-600 hover:text-[#0E1012] border border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <Map className="w-4 h-4 text-[#D2F544]" />
            Интерактивная карта с баллами
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'registry' ? (
          <DuolingoRegistry />
        ) : (
          <InstitutionsMap />
        )}

        {/* Bottom CTA Block */}
        <div className="mt-16 bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#D2F544]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <PillBadge variant="lime" prefixHash className="mx-auto">
              {t.ctaBadge}
            </PillBadge>
            <h3 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
              {t.ctaTitle}
            </h3>
            <p className="text-sm text-neutral-400">
              {t.ctaDesc}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/test">
                <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                  {t.ctaTestBtn}
                </Button>
              </Link>
              <Link href="/theory">
                <button className="px-6 py-3.5 rounded-full text-xs font-bold text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer">
                  {t.ctaTheoryBtn}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
