'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  minScore: number;
  tier: 'IVY_LEAGUE' | 'GLOBAL_TOP100' | 'STANDARD';
  programsCount?: number;
  websiteUrl?: string;
  notes?: string;
}

// Curated Ivy League & World Elite benchmarks
const ELITE_INSTITUTIONS_BENCHMARKS: RankedInstitution[] = [
  {
    id: 'ivy-columbia',
    name: 'Columbia University',
    country: 'USA',
    state: 'New York',
    minScore: 130,
    tier: 'IVY_LEAGUE',
    websiteUrl: 'https://undergrad.admissions.columbia.edu',
    notes: 'Ivy League • Minimum 125 Literacy & Comprehension',
  },
  {
    id: 'ivy-yale',
    name: 'Yale University',
    country: 'USA',
    state: 'Connecticut',
    minScore: 135,
    tier: 'IVY_LEAGUE',
    websiteUrl: 'https://admissions.yale.edu',
    notes: 'Ivy League • Most competitive applicants score 135+',
  },
  {
    id: 'ivy-upenn',
    name: 'University of Pennsylvania (UPenn)',
    country: 'USA',
    state: 'Pennsylvania',
    minScore: 130,
    tier: 'IVY_LEAGUE',
    websiteUrl: 'https://admissions.upenn.edu',
    notes: 'Ivy League • Recommended 130+ composite',
  },
  {
    id: 'ivy-dartmouth',
    name: 'Dartmouth College',
    country: 'USA',
    state: 'New Hampshire',
    minScore: 130,
    tier: 'IVY_LEAGUE',
    websiteUrl: 'https://admissions.dartmouth.edu',
    notes: 'Ivy League • 130+ accepted for undergraduate entry',
  },
  {
    id: 'ivy-cornell',
    name: 'Cornell University',
    country: 'USA',
    state: 'New York',
    minScore: 130,
    tier: 'IVY_LEAGUE',
    websiteUrl: 'https://admissions.cornell.edu',
    notes: 'Ivy League • 130+ DET score requirement',
  },
  {
    id: 'ivy-brown',
    name: 'Brown University',
    country: 'USA',
    state: 'Rhode Island',
    minScore: 135,
    tier: 'IVY_LEAGUE',
    websiteUrl: 'https://admission.brown.edu',
    notes: 'Ivy League • Highly competitive profile',
  },
  {
    id: 'top-mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    country: 'USA',
    state: 'Massachusetts',
    minScore: 130,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://oge.mit.edu',
    notes: 'Global #1 QS • Undergraduate & Graduate Admissions',
  },
  {
    id: 'top-stanford',
    name: 'Stanford University',
    country: 'USA',
    state: 'California',
    minScore: 135,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://admission.stanford.edu',
    notes: 'Global Top-5 • Fulfills full language requirement',
  },
  {
    id: 'top-oxford',
    name: 'University of Oxford',
    country: 'UK',
    minScore: 135,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://ox.ac.uk',
    notes: 'Global Top-3 • Minimum 130 in each subscore',
  },
  {
    id: 'top-toronto',
    name: 'University of Toronto',
    country: 'Canada',
    state: 'Ontario',
    minScore: 125,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://future.utoronto.ca',
    notes: 'Global Top-25 • Direct bachelor admission from 125',
  },
  {
    id: 'top-mcgill',
    name: 'McGill University',
    country: 'Canada',
    state: 'Quebec',
    minScore: 120,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://mcgill.ca/undergraduate-admissions',
    notes: 'Global Top-30 • Direct admission threshold 120',
  },
  {
    id: 'top-melbourne',
    name: 'University of Melbourne',
    country: 'Australia',
    state: 'Victoria',
    minScore: 115,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://study.unimelb.edu.au',
    notes: 'Group of Eight (Australia) • 115+ DET required',
  },
  {
    id: 'top-nyu',
    name: 'New York University (NYU)',
    country: 'USA',
    state: 'New York',
    minScore: 130,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://nyu.edu/admissions',
    notes: 'Global Top-30 • 130+ composite strongly advised',
  },
  {
    id: 'top-ucla',
    name: 'University of California, Los Angeles (UCLA)',
    country: 'USA',
    state: 'California',
    minScore: 125,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://admission.ucla.edu',
    notes: 'UC System Flagship • 125+ DET accepted',
  },
  {
    id: 'top-ubc',
    name: 'University of British Columbia (UBC)',
    country: 'Canada',
    state: 'British Columbia',
    minScore: 125,
    tier: 'GLOBAL_TOP100',
    websiteUrl: 'https://you.ubc.ca',
    notes: 'Global Top-40 • 125 overall with min subscores',
  },
];

export const UniversityMatchWidget: React.FC<UniversityMatchWidgetProps> = ({
  currentPredictedScore = 115,
  className = '',
}) => {
  const [simulatedScore, setSimulatedScore] = useState<number>(currentPredictedScore || 115);
  const [activeTier, setActiveTier] = useState<'ALL' | 'IVY' | 'TOP100'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const calculateMatch = (minScore: number) => {
    const diff = simulatedScore - minScore;
    if (diff >= 10) {
      return {
        label: 'Гарантированный проходной',
        labelEn: 'High Match (Safe)',
        probability: 95,
        color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80',
        badgeColor: 'bg-emerald-500',
      };
    }
    if (diff >= 0) {
      return {
        label: 'Целевой балл (Конкурентный)',
        labelEn: 'Target Match',
        probability: 80,
        color: 'text-[#D2F544] bg-[#D2F544]/10 border-[#D2F544]/30',
        badgeColor: 'bg-[#D2F544]',
      };
    }
    if (diff >= -10) {
      return {
        label: `Дефицит ${Math.abs(diff)} баллов (Reach)`,
        labelEn: 'Reach / Stretch',
        probability: 50,
        color: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
        badgeColor: 'bg-amber-400',
      };
    }
    return {
      label: `Дефицит ${Math.abs(diff)} баллов (Высокий риск)`,
      labelEn: 'High Risk',
      probability: 25,
      color: 'text-red-400 bg-red-950/60 border-red-800/60',
      badgeColor: 'bg-red-500',
    };
  };

  const filteredUniversities = useMemo(() => {
    return ELITE_INSTITUTIONS_BENCHMARKS.filter((uni) => {
      if (activeTier === 'IVY' && uni.tier !== 'IVY_LEAGUE') return false;
      if (activeTier === 'TOP100' && uni.tier === 'STANDARD') return false;

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
  }, [activeTier, searchQuery]);

  // Overall match stats
  const eligibleCount = filteredUniversities.filter((u) => simulatedScore >= u.minScore).length;

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
            Калькулятор шансов поступления в Ivy League & Top-100
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Сопоставьте ваш текущий балл со стандартами приемных комиссий ведущих вузов мира.
          </p>
        </div>

        {/* Total matched badge */}
        <div className="px-4 py-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-right shrink-0">
          <span className="text-[10px] font-bold text-neutral-400 uppercase block">Проходной в:</span>
          <div className="text-lg font-black text-[#D2F544]">
            {eligibleCount} из {filteredUniversities.length} вузов
          </div>
        </div>
      </div>

      {/* Simulated Score Slider Controls */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/30 flex items-center justify-center text-[#D2F544] font-black text-base shrink-0">
            {simulatedScore}
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Симуляция баллов экзамена DET</span>
            <span className="text-[11px] text-neutral-400">
              Двигайте ползунок, чтобы увидеть, как меняются шансы поступления при росте балла
            </span>
          </div>
        </div>

        <div className="w-full md:w-64 flex items-center gap-3">
          <input
            type="range"
            aria-label="Целевой балл"
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
            Все топ-вузы
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
            placeholder="Поиск по названию или стране..."
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
                      {uni.tier === 'IVY_LEAGUE' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Ivy League
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {uni.country}{uni.state ? `, ${uni.state}` : ''}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white hover:text-[#D2F544] transition-colors">
                      {uni.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">Порог DET</span>
                    <span className="text-base font-black text-white">{uni.minScore}+</span>
                  </div>
                </div>

                {uni.notes && (
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                    {uni.notes}
                  </p>
                )}
              </div>

              {/* Match Probability Status Bar */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${match.color}`}>
                  <span className={`w-2 h-2 rounded-full ${match.badgeColor}`} />
                  <span>{match.label}</span>
                  <span className="text-neutral-400 font-mono">({match.probability}%)</span>
                </div>

                {uni.websiteUrl && (
                  <a
                    href={uni.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Приемная комиссия</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
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
          <span>Смотреть полный каталог 4,087 университетов, принимающих Duolingo English Test →</span>
        </Link>
      </div>
    </div>
  );
};
