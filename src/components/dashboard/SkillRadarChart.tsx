'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Target, ChevronDown, CheckCircle2, AlertTriangle, Sparkles, Building2 } from 'lucide-react';
import institutionsData from '@/data/duolingoInstitutions.json';

interface Subscores {
  literacy: number;
  comprehension: number;
  conversation: number;
  production: number;
}

interface UniversityPreset {
  id: string;
  name: string;
  country: string;
  minScore: number;
  minLiteracy: number;
  minComprehension: number;
  minConversation: number;
  minProduction: number;
}

const POPULAR_UNIVERSITIES: UniversityPreset[] = [
  {
    id: 'toronto',
    name: 'University of Toronto',
    country: 'Canada',
    minScore: 125,
    minLiteracy: 120,
    minComprehension: 125,
    minConversation: 120,
    minProduction: 125,
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    country: 'USA',
    minScore: 135,
    minLiteracy: 135,
    minComprehension: 135,
    minConversation: 130,
    minProduction: 130,
  },
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    country: 'USA',
    minScore: 130,
    minLiteracy: 130,
    minComprehension: 130,
    minConversation: 125,
    minProduction: 125,
  },
  {
    id: 'oxford',
    name: 'University of Oxford',
    country: 'UK',
    minScore: 135,
    minLiteracy: 135,
    minComprehension: 135,
    minConversation: 135,
    minProduction: 130,
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    country: 'USA',
    minScore: 130,
    minLiteracy: 130,
    minComprehension: 125,
    minConversation: 125,
    minProduction: 125,
  },
  {
    id: 'mcgill',
    name: 'McGill University',
    country: 'Canada',
    minScore: 120,
    minLiteracy: 120,
    minComprehension: 120,
    minConversation: 115,
    minProduction: 115,
  },
  {
    id: 'melbourne',
    name: 'University of Melbourne',
    country: 'Australia',
    minScore: 115,
    minLiteracy: 115,
    minComprehension: 115,
    minConversation: 110,
    minProduction: 110,
  },
  {
    id: 'foundation',
    name: 'Standard Foundation Program',
    country: 'Global',
    minScore: 105,
    minLiteracy: 105,
    minComprehension: 105,
    minConversation: 100,
    minProduction: 100,
  },
];

interface SkillRadarChartProps {
  currentScores?: Subscores | null;
  overallScore?: number | null;
  hasTakenTest?: boolean;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  currentScores,
  overallScore,
  hasTakenTest = true,
}) => {
  const [selectedUniId, setSelectedUniId] = useState<string>('toronto');
  const [customSearch, setCustomSearch] = useState<string>('');

  const targetUni = useMemo(() => {
    const found = POPULAR_UNIVERSITIES.find((u) => u.id === selectedUniId);
    if (found) return found;

    // Fallback: search in scraped Duolingo 4,087 dataset
    const scraped = (institutionsData as any[]).find((u) => u.id === selectedUniId || u.accountId === selectedUniId);
    if (scraped) {
      return {
        id: scraped.id,
        name: scraped.name,
        country: scraped.country,
        minScore: 120,
        minLiteracy: 115,
        minComprehension: 115,
        minConversation: 110,
        minProduction: 115,
      };
    }

    return POPULAR_UNIVERSITIES[0];
  }, [selectedUniId]);

  // Radar geometry configuration
  const size = 320;
  const center = size / 2;
  const maxRadius = 110;
  const minScoreScale = 10;
  const maxScoreScale = 160;

  // 4 Axes:
  // 0: North -> Literacy
  // 1: East  -> Comprehension
  // 2: South -> Production
  // 3: West  -> Conversation
  const getCoordinates = (value: number, angleDeg: number) => {
    const normalized = Math.max(0, Math.min(1, (value - minScoreScale) / (maxScoreScale - minScoreScale)));
    const r = normalized * maxRadius;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  };

  const effectiveScores: Subscores = (hasTakenTest && currentScores) ? currentScores : {
    literacy: 0,
    comprehension: 0,
    production: 0,
    conversation: 0,
  };

  // Student Polygon Points
  const studentPoints = [
    getCoordinates(effectiveScores.literacy, 0),
    getCoordinates(effectiveScores.comprehension, 90),
    getCoordinates(effectiveScores.production, 180),
    getCoordinates(effectiveScores.conversation, 270),
  ];
  const studentSvgPath = `${studentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`;

  // University Target Polygon Points
  const uniPoints = [
    getCoordinates(targetUni.minLiteracy, 0),
    getCoordinates(targetUni.minComprehension, 90),
    getCoordinates(targetUni.minProduction, 180),
    getCoordinates(targetUni.minConversation, 270),
  ];
  const uniSvgPath = `${uniPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`;

  // Scale circles levels (40, 80, 105, 125, 160)
  const scaleLevels = [40, 80, 105, 125, 160];

  // Deficit calculations
  const deficits = [
    { name: 'Literacy', label: 'Чтение + Письмо', current: effectiveScores.literacy, target: targetUni.minLiteracy },
    { name: 'Comprehension', label: 'Чтение + Аудирование', current: effectiveScores.comprehension, target: targetUni.minComprehension },
    { name: 'Production', label: 'Письмо + Говорение', current: effectiveScores.production, target: targetUni.minProduction },
    { name: 'Conversation', label: 'Аудирование + Говорение', current: effectiveScores.conversation, target: targetUni.minConversation },
  ].map((item) => ({
    ...item,
    diff: item.target - item.current,
    passed: hasTakenTest && item.current >= item.target,
  }));

  const totalDeficit = deficits.filter((d) => !d.passed).length;

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Target University Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Радар готовности (Skill Spider Chart)
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Сравнение с целевым вузом
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Наложите профиль ваших сабскоров на требования приемной комиссии любого университета мира.
          </p>
        </div>

        {/* University Selector Dropdown */}
        <div className="relative min-w-[260px]">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
            Целевой университет:
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedUniId}
              onChange={(e) => setSelectedUniId(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer appearance-none"
            >
              {POPULAR_UNIVERSITIES.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0E1012]">
                  {u.name} ({u.minScore}+ DET)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid: Left Radar SVG, Right Gap Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar Diagram Graphic */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative w-[320px] h-[320px]">
            <svg width={size} height={size} className="overflow-visible">
              {/* Concentric Grid Circles & Labels */}
              {scaleLevels.map((lvl) => {
                const norm = (lvl - minScoreScale) / (maxScoreScale - minScoreScale);
                const r = norm * maxRadius;
                return (
                  <g key={lvl}>
                    <circle
                      cx={center}
                      cy={center}
                      r={r}
                      fill="none"
                      stroke="#262626"
                      strokeDasharray={lvl === 105 || lvl === 125 ? '3 3' : undefined}
                      strokeWidth={lvl === 105 ? 1.5 : 1}
                    />
                    <text
                      x={center + 4}
                      y={center - r + 10}
                      fill="#737373"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {lvl}
                    </text>
                  </g>
                );
              })}

              {/* 4 Cardinal Axes Lines */}
              <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="#262626" strokeWidth={1} />
              <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="#262626" strokeWidth={1} />

              {/* Target University Requirement Polygon (Purple Dashed) */}
              <polygon
                points={uniPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="rgba(168, 85, 247, 0.12)"
                stroke="#A855F7"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              {uniPoints.map((p, i) => (
                <circle key={`uni-pt-${i}`} cx={p.x} cy={p.y} r={4} fill="#A855F7" />
              ))}

              {/* Student Polygon (Lime Green Glowing) - only rendered if test taken */}
              {hasTakenTest && (
                <>
                  <polygon
                    points={studentPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(210, 245, 68, 0.22)"
                    stroke="#D2F544"
                    strokeWidth={2.5}
                  />
                  {studentPoints.map((p, i) => (
                    <circle
                      key={`stu-pt-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      fill="#D2F544"
                      stroke="#0C2418"
                      strokeWidth={2}
                    />
                  ))}
                </>
              )}

              {/* Axis Labels */}
              {/* North: Literacy */}
              <text x={center} y={center - maxRadius - 14} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
                Literacy ({hasTakenTest ? effectiveScores.literacy : '—'})
              </text>

              {/* East: Comprehension */}
              <text x={center + maxRadius + 14} y={center + 4} textAnchor="start" fill="#FFFFFF" fontSize="11" fontWeight="800">
                Comprehension ({hasTakenTest ? effectiveScores.comprehension : '—'})
              </text>

              {/* South: Production */}
              <text x={center} y={center + maxRadius + 20} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
                Production ({hasTakenTest ? effectiveScores.production : '—'})
              </text>

              {/* West: Conversation */}
              <text x={center - maxRadius - 14} y={center + 4} textAnchor="end" fill="#FFFFFF" fontSize="11" fontWeight="800">
                Conversation ({hasTakenTest ? effectiveScores.conversation : '—'})
              </text>
            </svg>

            {/* Overlay if student has never taken a test */}
            {!hasTakenTest && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="bg-[#0E1012]/95 border border-neutral-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-[210px] text-center">
                  <div className="w-8 h-8 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center mx-auto mb-2 text-[#D2F544]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-black text-white leading-tight">Тест еще не пройден</p>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                    Сдайте тест, чтобы составить ваш персональный радар
                  </p>
                  <Link
                    href="/test"
                    className="mt-3 inline-flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] text-[11px] font-black rounded-xl transition-transform active:scale-95 shadow-sm"
                  >
                    Пройти тест
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-md ${hasTakenTest ? 'bg-[#D2F544] shadow-[0_0_8px_rgba(210,245,68,0.5)]' : 'bg-neutral-700'}`} />
              <span className={hasTakenTest ? 'text-white' : 'text-neutral-400'}>
                {hasTakenTest ? `Ваш уровень (${overallScore})` : 'Ваш уровень: — (тест не сдан)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-purple-500 border border-purple-400 border-dashed" />
              <span className="text-purple-300">{targetUni.name} ({targetUni.minScore})</span>
            </div>
          </div>
        </div>

        {/* Right Gap Analysis & Actionable Recommendations */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-400">Статус соответствия вузу:</span>
                <h4 className="text-base font-black text-white mt-0.5">
                  {!hasTakenTest ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Требуется прохождение теста
                    </span>
                  ) : totalDeficit === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Готов к поступлению в {targetUni.name}!
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Дефицит по {totalDeficit} из 4 сабскоров
                    </span>
                  )}
                </h4>
                {!hasTakenTest && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Сдайте симулятор DET (45 мин), чтобы сопоставить ваши баллы с порогом {targetUni.name}.
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Целевой общий балл</span>
                <div className="text-xl font-black text-purple-400">{targetUni.minScore}+</div>
              </div>
            </div>

            {!hasTakenTest && (
              <div className="mt-3 pt-3 border-t border-neutral-800/80">
                <Link
                  href="/test"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] font-black text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Запустить симулятор теста DET</span>
                </Link>
              </div>
            )}
          </div>

          {/* 4 Subscore Cards */}
          <div className="space-y-2.5">
            {deficits.map((d) => (
              <div
                key={d.name}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  !hasTakenTest
                    ? 'bg-neutral-900/30 border-neutral-800/60 text-neutral-400'
                    : d.passed
                    ? 'bg-neutral-900/40 border-neutral-800/80 text-neutral-300'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{d.name}</span>
                    <span className="text-[10px] text-neutral-400">({d.label})</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Текущий: <strong className="text-white">{hasTakenTest ? d.current : '—'}</strong> • Требуется:{' '}
                    <strong className="text-purple-300">{d.target}</strong>
                  </div>
                </div>

                <div>
                  {!hasTakenTest ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
                      Ожидает сдачи
                    </span>
                  ) : d.passed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" /> В норме (+{d.current - d.target})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5" /> Нужно +{d.diff} баллов
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
