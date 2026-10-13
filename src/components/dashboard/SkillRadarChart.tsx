'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Target, ChevronDown, CheckCircle2, AlertTriangle, Sparkles, Building2, BookOpen, Layers } from 'lucide-react';
import institutionsData from '@/data/duolingoInstitutions.json';

export interface Subscores {
  literacy: number;
  comprehension: number;
  conversation: number;
  production: number;
}

export interface SixSkills {
  vocabulary: number; // 10 - 160
  grammar: number; // 10 - 160
  listening: number; // 10 - 160
  readingSpeed: number; // 10 - 160
  productionDepth: number; // 10 - 160
  conversationalFluency: number; // 10 - 160
}

interface UniversityPreset {
  id: string;
  name: string;
  country: string;
  minScore: number;
  minSkills: SixSkills;
}

const POPULAR_UNIVERSITIES: UniversityPreset[] = [
  {
    id: 'toronto',
    name: 'University of Toronto',
    country: 'Canada',
    minScore: 125,
    minSkills: {
      vocabulary: 125,
      grammar: 120,
      listening: 125,
      readingSpeed: 120,
      productionDepth: 125,
      conversationalFluency: 120,
    },
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    country: 'USA',
    minScore: 135,
    minSkills: {
      vocabulary: 135,
      grammar: 135,
      listening: 135,
      readingSpeed: 130,
      productionDepth: 135,
      conversationalFluency: 130,
    },
  },
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    country: 'USA',
    minScore: 130,
    minSkills: {
      vocabulary: 130,
      grammar: 130,
      listening: 130,
      readingSpeed: 130,
      productionDepth: 125,
      conversationalFluency: 125,
    },
  },
  {
    id: 'oxford',
    name: 'University of Oxford',
    country: 'UK',
    minScore: 135,
    minSkills: {
      vocabulary: 140,
      grammar: 135,
      listening: 135,
      readingSpeed: 135,
      productionDepth: 135,
      conversationalFluency: 135,
    },
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    country: 'USA',
    minScore: 130,
    minSkills: {
      vocabulary: 130,
      grammar: 130,
      listening: 125,
      readingSpeed: 125,
      productionDepth: 130,
      conversationalFluency: 125,
    },
  },
  {
    id: 'mcgill',
    name: 'McGill University',
    country: 'Canada',
    minScore: 120,
    minSkills: {
      vocabulary: 120,
      grammar: 120,
      listening: 120,
      readingSpeed: 115,
      productionDepth: 120,
      conversationalFluency: 115,
    },
  },
  {
    id: 'melbourne',
    name: 'University of Melbourne',
    country: 'Australia',
    minScore: 115,
    minSkills: {
      vocabulary: 115,
      grammar: 115,
      listening: 115,
      readingSpeed: 110,
      productionDepth: 115,
      conversationalFluency: 110,
    },
  },
  {
    id: 'foundation',
    name: 'Standard Foundation Program',
    country: 'Global',
    minScore: 105,
    minSkills: {
      vocabulary: 105,
      grammar: 105,
      listening: 105,
      readingSpeed: 100,
      productionDepth: 100,
      conversationalFluency: 100,
    },
  },
];

interface SkillRadarChartProps {
  currentScores?: Subscores | null;
  overallScore?: number | null;
  hasTakenTest?: boolean;
  typingWpm?: number;
  completedLessonsCount?: number;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  currentScores,
  overallScore,
  hasTakenTest = true,
  typingWpm = 0,
  completedLessonsCount = 0,
}) => {
  const [selectedUniId, setSelectedUniId] = useState<string>('toronto');

  const targetUni = useMemo(() => {
    const found = POPULAR_UNIVERSITIES.find((u) => u.id === selectedUniId);
    if (found) return found;

    const scraped = (institutionsData as any[]).find((u) => u.id === selectedUniId || u.accountId === selectedUniId);
    if (scraped) {
      return {
        id: scraped.id,
        name: scraped.name,
        country: scraped.country,
        minScore: 120,
        minSkills: {
          vocabulary: 120,
          grammar: 120,
          listening: 115,
          readingSpeed: 115,
          productionDepth: 115,
          conversationalFluency: 110,
        },
      };
    }

    return POPULAR_UNIVERSITIES[0];
  }, [selectedUniId]);

  // Derived 6 Core Skills from student performance
  const studentSkills: SixSkills = useMemo(() => {
    if (!hasTakenTest || !currentScores) {
      return {
        vocabulary: 0,
        grammar: 0,
        listening: 0,
        readingSpeed: 0,
        productionDepth: 0,
        conversationalFluency: 0,
      };
    }

    const { literacy, comprehension, production, conversation } = currentScores;
    // 1. Vocabulary: heavily derived from Literacy + Comprehension
    const vocab = Math.round(literacy * 0.6 + comprehension * 0.4);
    // 2. Grammar: Literacy + Production
    const grammar = Math.round(literacy * 0.5 + production * 0.5);
    // 3. Listening: Comprehension + Conversation
    const listening = Math.round(comprehension * 0.65 + conversation * 0.35);
    // 4. Reading Speed: Literacy + Typing bonus
    const speedBonus = Math.min(15, Math.round((typingWpm / 60) * 10));
    const readingSpeed = Math.min(160, Math.round(literacy * 0.85 + speedBonus));
    // 5. Production Depth: Production subscore
    const productionDepth = Math.round(production);
    // 6. Conversational Fluency: Conversation subscore
    const conversationalFluency = Math.round(conversation);

    return {
      vocabulary: vocab,
      grammar,
      listening,
      readingSpeed,
      productionDepth,
      conversationalFluency,
    };
  }, [hasTakenTest, currentScores, typingWpm]);

  // Radar geometry configuration (6 axes = 60 deg each)
  const size = 360;
  const center = size / 2;
  const maxRadius = 120;
  const minScoreScale = 10;
  const maxScoreScale = 160;

  // 6 Axes:
  // 0: 0° (Top)        -> Vocabulary
  // 1: 60° (Top-Right) -> Grammar
  // 2: 120° (Bot-Right)-> Listening
  // 3: 180° (Bottom)   -> Reading Speed
  // 4: 240° (Bot-Left) -> Production Depth
  // 5: 300° (Top-Left) -> Conversational Fluency
  const getCoordinates = (value: number, angleDeg: number) => {
    const normalized = Math.max(0, Math.min(1, (value - minScoreScale) / (maxScoreScale - minScoreScale)));
    const r = normalized * maxRadius;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  };

  const axesAngles = [0, 60, 120, 180, 240, 300];

  const studentPoints = [
    getCoordinates(studentSkills.vocabulary, 0),
    getCoordinates(studentSkills.grammar, 60),
    getCoordinates(studentSkills.listening, 120),
    getCoordinates(studentSkills.readingSpeed, 180),
    getCoordinates(studentSkills.productionDepth, 240),
    getCoordinates(studentSkills.conversationalFluency, 300),
  ];
  const studentSvgPath = `${studentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`;

  const uniPoints = [
    getCoordinates(targetUni.minSkills.vocabulary, 0),
    getCoordinates(targetUni.minSkills.grammar, 60),
    getCoordinates(targetUni.minSkills.listening, 120),
    getCoordinates(targetUni.minSkills.readingSpeed, 180),
    getCoordinates(targetUni.minSkills.productionDepth, 240),
    getCoordinates(targetUni.minSkills.conversationalFluency, 300),
  ];
  const uniSvgPath = `${uniPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`;

  // Scale levels
  const scaleLevels = [40, 80, 105, 125, 160];

  // 6 Skill diagnostics list
  const skillDetails = [
    { key: 'vocabulary', name: 'Vocabulary', labelRu: 'Словарный запас C1/C2', current: studentSkills.vocabulary, target: targetUni.minSkills.vocabulary },
    { key: 'grammar', name: 'Grammar', labelRu: 'Грамматика и синтаксис', current: studentSkills.grammar, target: targetUni.minSkills.grammar },
    { key: 'listening', name: 'Listening', labelRu: 'Аудирование и диктанты', current: studentSkills.listening, target: targetUni.minSkills.listening },
    { key: 'readingSpeed', name: 'Reading Speed', labelRu: 'Скорость и глубина чтения', current: studentSkills.readingSpeed, target: targetUni.minSkills.readingSpeed },
    { key: 'productionDepth', name: 'Production Depth', labelRu: 'Глубина академического письма', current: studentSkills.productionDepth, target: targetUni.minSkills.productionDepth },
    { key: 'conversationalFluency', name: 'Conversational Fluency', labelRu: 'Беглость устной речи (WPM)', current: studentSkills.conversationalFluency, target: targetUni.minSkills.conversationalFluency },
  ].map((item) => ({
    ...item,
    diff: item.target - item.current,
    passed: hasTakenTest && item.current >= item.target,
  }));

  const deficitCount = skillDetails.filter((s) => !s.passed).length;

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Радар 6 ключевых навыков DET (6-Axis Spider Chart)
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Диагностика 6 компетенций vs Целевой университет
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Комплексный профиль: Vocabulary, Grammar, Listening, Reading Speed, Production Depth и Conversational Fluency.
          </p>
        </div>

        {/* University Selector Dropdown */}
        <div className="relative min-w-[270px]">
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

      {/* Grid: Radar Diagram & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar Diagram Graphic */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative w-[360px] h-[360px]">
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
                      y={center - r + 9}
                      fill="#737373"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {lvl}
                    </text>
                  </g>
                );
              })}

              {/* 6 Radial Axes Lines */}
              {axesAngles.map((deg) => {
                const p = getCoordinates(maxScoreScale, deg);
                return (
                  <line
                    key={`axis-${deg}`}
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke="#262626"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Target University Polygon (Purple Dashed) */}
              <polygon
                points={uniPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="rgba(168, 85, 247, 0.12)"
                stroke="#A855F7"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              {uniPoints.map((p, i) => (
                <circle key={`uni-pt-${i}`} cx={p.x} cy={p.y} r={3.5} fill="#A855F7" />
              ))}

              {/* Student Polygon (Lime Green Glowing) */}
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
                      r={4.5}
                      fill="#D2F544"
                      stroke="#0C2418"
                      strokeWidth={2}
                    />
                  ))}
                </>
              )}

              {/* 6 Labels */}
              {/* Top: Vocabulary */}
              <text x={center} y={center - maxRadius - 12} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
                Vocabulary ({hasTakenTest ? studentSkills.vocabulary : '—'})
              </text>
              {/* Top-Right: Grammar */}
              <text x={center + maxRadius * 0.9 + 10} y={center - maxRadius * 0.5 + 4} textAnchor="start" fill="#FFFFFF" fontSize="10" fontWeight="800">
                Grammar ({hasTakenTest ? studentSkills.grammar : '—'})
              </text>
              {/* Bot-Right: Listening */}
              <text x={center + maxRadius * 0.9 + 10} y={center + maxRadius * 0.5 + 10} textAnchor="start" fill="#FFFFFF" fontSize="10" fontWeight="800">
                Listening ({hasTakenTest ? studentSkills.listening : '—'})
              </text>
              {/* Bottom: Reading Speed */}
              <text x={center} y={center + maxRadius + 18} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
                Reading Speed ({hasTakenTest ? studentSkills.readingSpeed : '—'})
              </text>
              {/* Bot-Left: Production Depth */}
              <text x={center - maxRadius * 0.9 - 10} y={center + maxRadius * 0.5 + 10} textAnchor="end" fill="#FFFFFF" fontSize="10" fontWeight="800">
                Production ({hasTakenTest ? studentSkills.productionDepth : '—'})
              </text>
              {/* Top-Left: Conversational Fluency */}
              <text x={center - maxRadius * 0.9 - 10} y={center - maxRadius * 0.5 + 4} textAnchor="end" fill="#FFFFFF" fontSize="10" fontWeight="800">
                Fluency ({hasTakenTest ? studentSkills.conversationalFluency : '—'})
              </text>
            </svg>

            {!hasTakenTest && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="bg-[#0E1012]/95 border border-neutral-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-[210px] text-center">
                  <div className="w-8 h-8 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center mx-auto mb-2 text-[#D2F544]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-black text-white leading-tight">Тест еще не пройден</p>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                    Пройдите симулятор теста, чтобы построить личный радар 6 компетенций.
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
                {hasTakenTest ? `Ваш профиль (${overallScore || '—'})` : 'Ваш профиль: — (тест не сдан)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-purple-500 border border-purple-400 border-dashed" />
              <span className="text-purple-300">{targetUni.name} ({targetUni.minScore})</span>
            </div>
          </div>
        </div>

        {/* Right: Gap Analysis */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-400">Статус соответствия:</span>
                <h4 className="text-base font-black text-white mt-0.5">
                  {!hasTakenTest ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Требуется сдача теста
                    </span>
                  ) : deficitCount === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Готов к поступлению в {targetUni.name}!
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Дефицит по {deficitCount} из 6 компетенций
                    </span>
                  )}
                </h4>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Целевой балл</span>
                <div className="text-xl font-black text-purple-400">{targetUni.minScore}+</div>
              </div>
            </div>
          </div>

          {/* 6 Skill Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {skillDetails.map((s) => (
              <div
                key={s.key}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  !hasTakenTest
                    ? 'bg-neutral-900/30 border-neutral-800/60 text-neutral-400'
                    : s.passed
                    ? 'bg-neutral-900/40 border-neutral-800/80 text-neutral-300'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                }`}
              >
                <div>
                  <span className="text-xs font-extrabold text-white block">{s.name}</span>
                  <span className="text-[10px] text-neutral-400 block">{s.labelRu}</span>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Текущий: <strong className="text-white">{hasTakenTest ? s.current : '—'}</strong> / {s.target}
                  </div>
                </div>

                <div>
                  {!hasTakenTest ? (
                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-900 px-2 py-1 rounded-lg">
                      Ожидает
                    </span>
                  ) : s.passed ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded-lg">
                      Норма
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded-lg">
                      +{s.diff}
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
