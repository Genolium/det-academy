'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';
import { localizeCountry } from '@/lib/countryNames';
import {
  Building2,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Globe,
  Sliders,
  TrendingUp,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface UniversityMatchWidgetProps {
  currentPredictedScore?: number;
  className?: string;
}

interface RankedInstitution {
  id: string;
  name: string;
  country: string;
  state?: string;
  /** 0 means the threshold is unknown. */
  minScore: number;
  category: string;
  websiteUrl?: string;
  requirementSource?: string;
  requirementCheckedAt?: string;
  requirementVerified: boolean;
  acceptanceRate?: string;
}

const DET_REGISTRY_URL = 'https://englishtest.duolingo.com/institutions';
const REQUIREMENT_CHECKED_AT = '2026-10-21';

function matchesTier(university: RankedInstitution, tier: 'ALL' | 'IVY' | 'TOP100'): boolean {
  if (tier === 'IVY') return university.category === 'Ivy League';
  if (tier === 'TOP100') return ['Ivy League', 'Top Global', 'Top STEM'].includes(university.category);
  return true;
}

interface CatalogPayload {
  institutions?: Array<{
    id: string;
    name: string;
    country: string;
    state?: string;
    minScore?: number;
    category?: string;
    websiteUrl?: string;
    requirementSource?: string;
    requirementCheckedAt?: string;
    requirementVerified?: boolean;
    acceptanceRate?: string;
  }>;
}

export const UniversityMatchWidget: React.FC<UniversityMatchWidgetProps> = ({
  currentPredictedScore = 0,
  className = '',
}) => {
  const { locale } = useSettingsStore();
  const t = (ruText: string, enText: string) => (locale === 'ru' ? ruText : enText);
  const [simulatedScore, setSimulatedScore] = useState<number>(currentPredictedScore > 0 ? currentPredictedScore : 95);
  const [activeTier, setActiveTier] = useState<'ALL' | 'IVY' | 'TOP100'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [catalog, setCatalog] = useState<RankedInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // The matcher uses the same catalogue as the interactive map: one model of
  // data, one set of verified coordinates and thresholds.
  useEffect(() => {
    let mounted = true;
    fetch('/registry/institutions-map', { cache: 'force-cache' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('catalog unavailable'))))
      .then((payload: CatalogPayload) => {
        if (!mounted || !Array.isArray(payload.institutions)) return;
        setCatalog(
          payload.institutions.map((item) => ({
            id: item.id,
            name: item.name,
            country: item.country,
            state: item.state,
            minScore: Number(item.minScore) || 0,
            category: item.category || 'Official DET',
            websiteUrl: item.websiteUrl,
            requirementSource: item.requirementSource,
            requirementCheckedAt: item.requirementCheckedAt,
            requirementVerified: Boolean(item.requirementVerified),
            acceptanceRate: item.acceptanceRate,
          }))
        );
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const calculateMatch = (minScore: number) => {
    if (!minScore) {
      return {
        label: t('Порог неизвестен', 'Threshold unknown'),
        labelEn: 'Threshold unknown',
        color: 'text-neutral-300 bg-neutral-900 border-neutral-700',
        badgeColor: 'bg-neutral-500',
      };
    }
    const diff = simulatedScore - minScore;
    if (diff >= 10) {
      return {
        label: t('Выше ориентировочного порога', 'Above the platform reference'),
        labelEn: 'Above reference threshold',
        color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80',
        badgeColor: 'bg-emerald-500',
      };
    }
    if (diff >= 0) {
      return {
        label: t('На уровне ориентировочного порога', 'At the platform reference'),
        labelEn: 'At reference threshold',
        color: 'text-[#D2F544] bg-[#D2F544]/10 border-[#D2F544]/30',
        badgeColor: 'bg-[#D2F544]',
      };
    }
    if (diff >= -10) {
      return {
        label: t(`Ниже порога на ${Math.abs(diff)} баллов`, `${Math.abs(diff)} points below the reference`),
        labelEn: 'Below reference threshold',
        color: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
        badgeColor: 'bg-amber-400',
      };
    }
    return {
      label: t(`Значительный дефицит: ${Math.abs(diff)} баллов`, `Large gap: ${Math.abs(diff)} points`),
      labelEn: 'Well below reference threshold',
      color: 'text-red-400 bg-red-950/60 border-red-800/60',
      badgeColor: 'bg-red-500',
    };
  };

  const filteredUniversities = useMemo(() => {
    const result = catalog.filter((uni) => {
      if (!matchesTier(uni, activeTier)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          uni.name.toLowerCase().includes(q) ||
          uni.country.toLowerCase().includes(q) ||
          (uni.state && uni.state.toLowerCase().includes(q))
        );
      }
      return true;
    });
    // Keep the panel responsive: the catalogue has thousands of entries.
    return result.slice(0, 60);
  }, [catalog, activeTier, searchQuery]);

  // Overall match stats: only confirmed thresholds can be compared.
  const comparable = filteredUniversities.filter((u) => u.minScore > 0);
  const eligibleCount = comparable.filter((u) => simulatedScore >= u.minScore).length;
  const unknownCount = filteredUniversities.length - comparable.length;

  return (
    <div className={`bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-neutral-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D2F544]" />
              University Match Engine & Ivy League Matcher
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {t('Сравнение с ориентировочными порогами вузов', 'Compare with university reference thresholds')}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {t('Пороги собраны как ориентир. Это не вероятность поступления и не гарантия: проверяйте требования на официальном сайте вуза.', 'Thresholds are a reference, not an admission probability or a guarantee. Check the official university website.')}
          </p>
          <p className="text-[11px] text-amber-300/90 mt-2">
            {t('Источник: официальный реестр DET, проверено ' + REQUIREMENT_CHECKED_AT + '. Пороги баллов — ориентир платформы, а не официальное требование вуза. Проверяйте приёмную страницу перед подачей документов.', 'Source: the official DET registry, checked ' + REQUIREMENT_CHECKED_AT + '. Score thresholds are a platform reference, not an official university requirement. Check the admissions page before applying.')}
          </p>
        </div>

        {/* Total matched badge */}
        <div className="px-4 py-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-right shrink-0">
          <span className="text-[10px] font-bold text-neutral-400 uppercase block">{t('Выше ориентира', 'Above the reference')}:</span>
          <div className="text-lg font-black text-[#D2F544]">
            {eligibleCount} / {comparable.length}
          </div>
          {unknownCount > 0 && (
            <span className="text-[10px] text-neutral-500">
              {t(`у ${unknownCount} порог неизвестен`, `${unknownCount} have no published threshold`)}
            </span>
          )}
        </div>
      </div>

      {/* Simulated Score Slider Controls */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/30 flex items-center justify-center text-[#D2F544] font-black text-base shrink-0">
            {simulatedScore}
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t('Симуляция баллов экзамена DET', 'DET score simulation')}</span>
            <span className="text-[11px] text-neutral-400">
              {currentPredictedScore > 0
                ? t('Двигайте ползунок, чтобы увидеть, как меняется соответствие ориентировочным порогам', 'Move the slider to see how the match against reference thresholds changes')
                : t('У вас пока нет подтверждённого mock-результата. Слайдер показывает сценарий, а не ваш балл.', 'You have no confirmed mock result yet. The slider shows a scenario, not your score.')}
            </span>
          </div>
        </div>

        <div className="w-full md:w-64 flex items-center gap-3">
          <input
            type="range"
            aria-label={t('Целевой балл', 'Target score')}
            min={95}
            max={155}
            step={5}
            value={simulatedScore}
            onChange={(e) => setSimulatedScore(Number(e.target.value))}
            className="w-full accent-[#D2F544] cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-white shrink-0">
            {simulatedScore} DET
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTier('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTier === 'ALL'
                ? 'bg-white text-[#0C2418]'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            {t('Все топ-вузы', 'All top universities')}
          </button>
          <button
            onClick={() => setActiveTier('IVY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTier === 'IVY'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            🏛️ Ivy League
          </button>
          <button
            onClick={() => setActiveTier('TOP100')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTier === 'TOP100'
                ? 'bg-[#D2F544] text-[#0C2418]'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            🌍 Global Top-100
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Поиск по названию или стране...', 'Search by name or country...')}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* University Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredUniversities.map((uni) => {
          const match = calculateMatch(uni.minScore);

          return (
            <div
              key={uni.id}
              className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {uni.category === 'Ivy League' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Ivy League
                        </span>
                      )}
                      {uni.category && uni.category !== 'Ivy League' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {uni.category}
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {localizeCountry(uni.country, locale)}{uni.state ? `, ${uni.state}` : ''}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-white hover:text-[#D2F544] transition-colors">
                      {uni.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">{t('Порог DET', 'DET threshold')}</span>
                    <span className="text-base font-black text-white">
                      {uni.minScore > 0 ? `${uni.minScore}+` : t('неизвестно', 'unknown')}
                    </span>
                  </div>
                </div>

                {uni.minScore > 0 ? (
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                    {uni.requirementVerified
                      ? t('Требование подтверждено вузом', 'Requirement confirmed by the university')
                      : t('Ориентировочный порог платформы, не официальное требование вуза', 'Platform reference threshold, not an official university requirement')}
                    {uni.requirementCheckedAt ? t(` · проверено ${uni.requirementCheckedAt}`, ` · checked ${uni.requirementCheckedAt}`) : ''}
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                    {t('Балл DET не опубликован в проверенном источнике — сравнение недоступно.', 'The DET score is not published in the verified source, so comparison is unavailable.')}
                  </p>
                )}
              </div>

              {/* Match Probability Status Bar */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${match.color}`}>
                  <span className={`w-2 h-2 rounded-full ${match.badgeColor}`} />
                  <span>{match.label}</span>
                  <span className="text-neutral-400 font-mono">({match.labelEn})</span>
                </div>

                <div className="flex items-center gap-3">
                  {uni.requirementSource && (
                    <a
                      href={uni.requirementSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{t('Источник', 'Source')}</span>
                    </a>
                  )}
                  {uni.websiteUrl && (
                    <a
                      href={uni.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>{t('Приемная комиссия', 'Admissions')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Link to Full 4,087 Registry */}
      <div className="pt-2 text-center">
        <Link
          href="/institutions"
          className="text-xs font-bold text-neutral-400 hover:text-white inline-flex items-center gap-1.5 hover:underline"
        >
          <Building2 className="w-4 h-4 text-[#D2F544]" />
          <span>{t('Смотреть полный каталог 4,087 университетов, принимающих Duolingo English Test →', 'Browse all 4,087 universities accepting Duolingo English Test →')}</span>
        </Link>
      </div>
    </div>
  );
};
