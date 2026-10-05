'use client';

import React, { useState, useMemo } from 'react';
import institutionsData from '@/data/duolingoInstitutions.json';
import { Search, Globe, ExternalLink, GraduationCap, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PillBadge } from '@/components/ui/PillBadge';

interface DuolingoInstitution {
  id: string;
  accountId: string;
  name: string;
  country: string;
  state: string;
  websiteUrl: string;
  fulfillsRequirement: boolean;
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

export const DuolingoRegistry: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedType, setSelectedType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Available countries sorted by frequency
  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    (institutionsData as DuolingoInstitution[]).forEach((item) => {
      counts[item.country] = (counts[item.country] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count }));
  }, []);

  // Filtered dataset
  const filtered = useMemo(() => {
    let result = institutionsData as DuolingoInstitution[];

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
  }, [search, selectedCountry, selectedType]);

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
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="px-4 py-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm font-semibold text-[#0E1012] focus:outline-none focus:ring-2 focus:ring-[#D2F544] cursor-pointer"
            >
              <option value="All">🌍 Все страны ({institutionsData.length})</option>
              {countries.map(({ country, count }) => (
                <option key={country} value={country}>
                  {country} ({count})
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="px-4 py-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm font-semibold text-[#0E1012] focus:outline-none focus:ring-2 focus:ring-[#D2F544] cursor-pointer"
            >
              <option value="ALL">🎓 Все программы</option>
              <option value="UNDERGRADUATE">Бакалавриат (Undergraduate)</option>
              <option value="GRADUATE">Магистратура & PhD (Graduate)</option>
              <option value="OTHER">Подготовительные / Курсы</option>
            </select>
          </div>
        </div>

        {/* Counter & Status */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
          <div>
            Найдено вузов: <strong className="text-[#0E1012]">{filtered.length.toLocaleString('ru-RU')}</strong> из {institutionsData.length.toLocaleString('ru-RU')}
          </div>
          <div>
            Страница {currentPage} из {totalPages}
          </div>
        </div>
      </div>

      {/* Grid of Universities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((inst) => (
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
                <h3 className="font-extrabold text-[#0E1012] text-base leading-snug group-hover:text-emerald-700 transition-colors">
                  {inst.name}
                </h3>
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
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
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
