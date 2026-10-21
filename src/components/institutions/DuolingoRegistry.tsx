'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import {
  Search,
  Globe,
  ExternalLink,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Target,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PillBadge } from '@/components/ui/PillBadge';

interface DuolingoInstitution {
  id: string;
  accountId: string;
  name: string;
  country: string;
  state: string;
  websiteUrl: string;
  fulfillsRequirement: boolean;
  minScore?: number;
  programTypes: string[];
  programsCount: number;
  programs: Array<{
    type: string;
    name: string;
    country: string;
    state: string;
    link: string;
    useCase: string;
    applicantIdTypes: string[];
  }>;
}

const ITEMS_PER_PAGE = 24;

// Verified score cutoff lookup (returns null if requirements are not officially confirmed)
function getVerifiedMinScore(inst: { minScore?: number } | null | undefined): number | null {
  if (typeof inst?.minScore === 'number') {
    return inst.minScore;
  }
  return null;
}

export const DuolingoRegistry: React.FC = () => {
  const { getBestMockScore, testResults } = useProgressStore();
  const bestScore = getBestMockScore();

  const [institutions, setInstitutions] = useState<DuolingoInstitution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedType, setSelectedType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    fetch('/registry/duolingo')
      .then((response) => {
        if (!response.ok) throw new Error(`registry returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setInstitutions(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError('Не удалось загрузить реестр вузов.');
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Available countries sorted by frequency
  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    institutions.forEach((item) => {
      counts[item.country] = (counts[item.country] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count }));
  }, [institutions]);

  // Filtered dataset
  const filtered = useMemo(() => {
    let result = institutions;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.state.toLowerCase().includes(q) ||
          item.country.toLowerCase().includes(q)
      );
    }

    if (selectedCountry !== 'All') {
      result = result.filter((item) => item.country === selectedCountry);
    }

    if (selectedType !== 'ALL') {
      result = result.filter((item) => item.programTypes.includes(selectedType));
    }

    return result;
  }, [institutions, search, selectedCountry, selectedType]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleCountryChange = (c: string) => {
    setSelectedCountry(c);
    setCurrentPage(1);
  };

  const handleTypeChange = (t: string) => {
    setSelectedType(t);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-neutral-200 shadow-sm text-center">
        <div className="w-7 h-7 border-2 border-neutral-300 border-t-[#0E1012] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-neutral-600">Загрузка реестра вузов...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="bg-red-50 rounded-3xl p-6 border border-red-200 text-sm font-semibold text-red-700">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по названию университета, штату или стране (например, MIT, Stanford, Harvard, Toronto)..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2F544] focus:bg-white transition-all text-[#0E1012] placeholder-neutral-400 font-medium"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            {/* Country Selector */}
            <select
              aria-label="Страна"
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full sm:w-auto max-w-full px-4 py-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm font-semibold text-[#0E1012] focus:outline-none focus:ring-2 focus:ring-[#D2F544] cursor-pointer"
            >
              <option value="All">🌍 Все страны ({institutions.length})</option>
              {countries.map(({ country, count }) => (
                <option key={country} value={country}>
                  {country} ({count})
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              aria-label="Тип программы"
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full sm:w-auto max-w-full px-4 py-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm font-semibold text-[#0E1012] focus:outline-none focus:ring-2 focus:ring-[#D2F544] cursor-pointer"
            >
              <option value="ALL">🎓 Все программы</option>
              <option value="UNDERGRADUATE">Бакалавриат (Undergraduate)</option>
              <option value="GRADUATE">Магистратура & PhD (Graduate)</option>
              <option value="OTHER">Подготовительные / Курсы</option>
            </select>
          </div>
        </div>

        {/* Score Matching Banner & Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-neutral-100 text-neutral-500 cursor-not-allowed"
              title="В реестре пока нет подтверждённых требований по баллам"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Требования вузов пока не подтверждены</span>
            </div>

            {bestScore > 0 ? (
              <span className="text-xs text-neutral-500">
                Ваш текущий результат: <strong className="text-emerald-700">{bestScore} / 160</strong>
              </span>
            ) : (
              <span className="text-xs text-neutral-400 italic">
                (Тест еще не пройден — отображаются ориентировочные пороги)
              </span>
            )}
          </div>

          <div className="text-xs text-neutral-500">
            Найдено вузов: <strong className="text-[#0E1012]">{filtered.length.toLocaleString('ru-RU')}</strong> из {institutions.length.toLocaleString('ru-RU')}
          </div>
        </div>
      </div>

      {/* Grid of Universities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((inst) => {
          const reqScore = getVerifiedMinScore(inst);
          const isEligible = reqScore !== null && bestScore > 0 && bestScore >= reqScore;
          const scoreGap = reqScore !== null && bestScore > 0 ? reqScore - bestScore : null;

          return (
            <div
              key={inst.id}
              className="bg-white rounded-3xl p-5 border border-neutral-200 hover:border-neutral-900 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                    <Globe className="w-3 h-3 text-neutral-400" />
                    {inst.country}
                    {inst.state && ` • ${inst.state}`}
                  </span>
                  {inst.fulfillsRequirement && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Официально DET
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="font-extrabold text-[#0E1012] text-base leading-snug group-hover:text-emerald-700 transition-colors">
                    {inst.name}
                  </h2>
                </div>

                {/* Score Requirement & Eligibility Pill */}
                <div className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500 text-[11px] block">Проходной балл:</span>
                    <strong className="text-[#0E1012] font-black">
                      {reqScore ? `${reqScore}+ DET` : 'Уточняется в вузе'}
                    </strong>
                  </div>
                  {reqScore && bestScore > 0 ? (
                    isEligible ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Вы проходите (+{bestScore - reqScore})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Нужно еще {scoreGap} б.
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      {inst.fulfillsRequirement ? 'Принимает DET' : 'Требования уточняются'}
                    </span>
                  )}
                </div>

                {/* Program Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {inst.programTypes.map((pt) => (
                    <span
                      key={pt}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700"
                    >
                      {pt === 'UNDERGRADUATE' ? 'Undergraduate' : pt === 'GRADUATE' ? 'Graduate' : pt}
                    </span>
                  ))}
                  {inst.programsCount > 1 && (
                    <span className="text-[10px] font-semibold text-neutral-400 px-1 py-0.5">
                      +{inst.programsCount} программ
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-medium">
                  ID: {inst.accountId.slice(0, 10)}...
                </span>
                {inst.websiteUrl ? (
                  <a
                    href={inst.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0E1012] hover:text-emerald-600 transition-colors"
                  >
                    Требования вуза <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-neutral-400">Ссылка в профиле</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            aria-label="Предыдущая страница"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-[#0E1012]">
            {currentPage} / {totalPages}
          </span>

          <button
            aria-label="Следующая страница"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
