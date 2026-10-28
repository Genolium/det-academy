'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Sparkles, Target, Layers } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export interface Subscores {
  literacy: number;
  comprehension: number;
  conversation: number;
  production: number;
}

export interface Modalities {
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
}

interface SkillRadarChartProps {
  currentScores?: Subscores | null;
  currentModalities?: Modalities | null;
  overallScore?: number | null;
  targetScore?: number;
  hasTakenTest?: boolean;
  typingWpm?: number;
  completedLessonsCount?: number;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  currentScores,
  currentModalities,
  overallScore,
  targetScore = 125,
  hasTakenTest = true,
}) => {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const [radarMode, setRadarMode] = useState<'subscores' | 'modalities'>('subscores');

  // Radar geometry
  const size = 320;
  const center = size / 2;
  const maxRadius = 110;
  const minScoreScale = 10;
  const maxScoreScale = 160;

  const getCoordinates = (value: number, angleDeg: number) => {
    const normalized = Math.max(0, Math.min(1, (value - minScoreScale) / (maxScoreScale - minScoreScale)));
    const r = normalized * maxRadius;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  };

  const effectiveSubscores: Subscores = (hasTakenTest && currentScores) ? currentScores : {
    literacy: 0,
    comprehension: 0,
    production: 0,
    conversation: 0,
  };

  const effectiveModalities: Modalities = (hasTakenTest && currentModalities) ? currentModalities : {
    reading: 0,
    listening: 0,
    writing: 0,
    speaking: 0,
  };

  // 1. Subscores Points (North: Literacy, East: Comprehension, South: Production, West: Conversation)
  const subscorePoints = [
    getCoordinates(effectiveSubscores.literacy, 0),
    getCoordinates(effectiveSubscores.comprehension, 90),
    getCoordinates(effectiveSubscores.production, 180),
    getCoordinates(effectiveSubscores.conversation, 270),
  ];

  // Subscore Target Polygon Points (based on student target)
  const targetSubscorePoints = [
    getCoordinates(targetScore, 0),
    getCoordinates(targetScore, 90),
    getCoordinates(targetScore, 180),
    getCoordinates(targetScore, 270),
  ];

  // 2. Modalities Points (North: Reading, East: Listening, South: Writing, West: Speaking)
  const modalityPoints = [
    getCoordinates(effectiveModalities.reading, 0),
    getCoordinates(effectiveModalities.listening, 90),
    getCoordinates(effectiveModalities.writing, 180),
    getCoordinates(effectiveModalities.speaking, 270),
  ];

  const targetModalityPoints = [
    getCoordinates(targetScore, 0),
    getCoordinates(targetScore, 90),
    getCoordinates(targetScore, 180),
    getCoordinates(targetScore, 270),
  ];

  const activePoints = radarMode === 'subscores' ? subscorePoints : modalityPoints;
  const activeBenchmarkPoints = radarMode === 'subscores' ? targetSubscorePoints : targetModalityPoints;

  // Scale circles levels (40, 80, 105, 125, 160)
  const scaleLevels = [40, 80, 105, 125, 160];

  // Subscore Deficits
  const subscoreDeficits = [
    { name: 'Literacy', label: ru ? 'Чтение + Письмо' : 'Reading + Writing', current: effectiveSubscores.literacy, target: targetScore },
    { name: 'Comprehension', label: ru ? 'Чтение + Аудирование' : 'Reading + Listening', current: effectiveSubscores.comprehension, target: targetScore },
    { name: 'Production', label: ru ? 'Письмо + Говорение' : 'Writing + Speaking', current: effectiveSubscores.production, target: targetScore },
    { name: 'Conversation', label: ru ? 'Аудирование + Говорение' : 'Listening + Speaking', current: effectiveSubscores.conversation, target: targetScore },
  ].map((item) => ({
    ...item,
    diff: item.target - item.current,
    passed: hasTakenTest && item.current >= item.target,
  }));

  // Modality Deficits
  const modalityDeficits = [
    { name: 'Reading', label: ru ? 'Чтение (C-Test, Select)' : 'Reading (C-Test, Select)', current: effectiveModalities.reading, target: targetScore },
    { name: 'Listening', label: ru ? 'Аудирование (Dictation, Dialog)' : 'Listening (Dictation, Dialogue)', current: effectiveModalities.listening, target: targetScore },
    { name: 'Writing', label: ru ? 'Письмо (Photo, Sample)' : 'Writing (Photo, Sample)', current: effectiveModalities.writing, target: targetScore },
    { name: 'Speaking', label: ru ? 'Говорение (Photo, Interactive)' : 'Speaking (Photo, Interactive)', current: effectiveModalities.speaking, target: targetScore },
  ].map((item) => ({
    ...item,
    diff: item.target - item.current,
    passed: hasTakenTest && item.current >= item.target,
  }));

  // Find weakest modality
  const weakestModality = useMemo(() => {
    if (!hasTakenTest) return null;
    let minItem = modalityDeficits[0];
    for (const m of modalityDeficits) {
      if (m.current < minItem.current) {
        minItem = m;
      }
    }
    return minItem;
  }, [hasTakenTest, modalityDeficits]);

  const activeDeficits = radarMode === 'subscores' ? subscoreDeficits : modalityDeficits;
  const totalDeficit = activeDeficits.filter((d) => !d.passed).length;

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {ru ? 'Радар готовности (Skill Spider Chart)' : 'Readiness radar'}
            </span>
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-[11px] font-bold">
              <button
                onClick={() => setRadarMode('subscores')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  radarMode === 'subscores'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {ru ? 'Официальные сабскоры (4)' : 'Official subscores (4)'}
              </button>
              <button
                onClick={() => setRadarMode('modalities')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  radarMode === 'modalities'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {ru ? 'Базовые навыки (R / L / W / S)' : 'Core skills (R / L / W / S)'}
              </button>
            </div>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {radarMode === 'subscores' ? (ru ? 'Сравнение сабскоров с целевым баллом' : 'Subscores against the target') : (ru ? 'Диагностика 4 фундаментальных навыков' : 'Four core skills diagnostic')}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {radarMode === 'subscores'
              ? (ru ? 'Сопоставление ваших результатов с целевым ориентиром подготовки.' : 'Your results against the preparation target.')
              : (ru ? 'Анализ независимых навыков: выявите, какой блок тянет общий балл вниз.' : 'Independent skills: find the block that pulls the overall score down.')}
          </p>
        </div>

        {/* Target Goal Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <Target className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="text-left">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{ru ? 'Ваша цель' : 'Your target'}:</span>
            <span className="text-xs font-black text-white">{targetScore}+ DET</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Radar SVG, Right Diagnostics */}
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

              {/* Benchmark Polygon (University in subscores mode, or Target Score in modalities mode) */}
              <polygon
                points={activeBenchmarkPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="rgba(168, 85, 247, 0.12)"
                stroke="#A855F7"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              {activeBenchmarkPoints.map((p, i) => (
                <circle key={`bench-pt-${i}`} cx={p.x} cy={p.y} r={4} fill="#A855F7" />
              ))}

              {/* Student Polygon (Lime Green Glowing) */}
              {hasTakenTest && (
                <>
                  <polygon
                    points={activePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(210, 245, 68, 0.22)"
                    stroke="#D2F544"
                    strokeWidth={2.5}
                  />
                  {activePoints.map((p, i) => (
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
              {radarMode === 'subscores' ? (
                <>
                  <text x={center} y={center - maxRadius - 14} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Literacy ({hasTakenTest ? effectiveSubscores.literacy : '—'})
                  </text>
                  <text x={center + maxRadius + 14} y={center + 4} textAnchor="start" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Comprehension ({hasTakenTest ? effectiveSubscores.comprehension : '—'})
                  </text>
                  <text x={center} y={center + maxRadius + 20} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Production ({hasTakenTest ? effectiveSubscores.production : '—'})
                  </text>
                  <text x={center - maxRadius - 14} y={center + 4} textAnchor="end" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Conversation ({hasTakenTest ? effectiveSubscores.conversation : '—'})
                  </text>
                </>
              ) : (
                <>
                  <text x={center} y={center - maxRadius - 14} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Reading ({hasTakenTest && effectiveModalities.reading > 0 ? effectiveModalities.reading : '—'})
                  </text>
                  <text x={center + maxRadius + 14} y={center + 4} textAnchor="start" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Listening ({hasTakenTest && effectiveModalities.listening > 0 ? effectiveModalities.listening : '—'})
                  </text>
                  <text x={center} y={center + maxRadius + 20} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Writing ({hasTakenTest && effectiveModalities.writing > 0 ? effectiveModalities.writing : '—'})
                  </text>
                  <text x={center - maxRadius - 14} y={center + 4} textAnchor="end" fill="#FFFFFF" fontSize="11" fontWeight="800">
                    Speaking ({hasTakenTest && effectiveModalities.speaking > 0 ? effectiveModalities.speaking : '—'})
                  </text>
                </>
              )}
            </svg>

            {/* Overlay if student has never taken a test */}
            {!hasTakenTest && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="bg-[#0E1012]/95 border border-neutral-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-[210px] text-center">
                  <div className="w-8 h-8 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center mx-auto mb-2 text-[#D2F544]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-black text-white leading-tight">{ru ? 'Тест еще не пройден' : 'No test completed yet'}</p>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                    {ru ? 'Сдайте симулятор, чтобы составить ваш персональный радар' : 'Take the simulator to build your personal radar'}
                  </p>
                  <Link
                    href="/test"
                    className="mt-3 inline-flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] text-[11px] font-black rounded-xl transition-transform active:scale-95 shadow-sm"
                  >
                    {ru ? 'Пройти тест' : 'Take the test'}
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
                {hasTakenTest ? (ru ? `Ваш уровень (${overallScore})` : `Your level (${overallScore})`) : (ru ? 'Ваш уровень: —' : 'Your level: —')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-purple-500 border border-purple-400 border-dashed" />
              <span className="text-purple-300">
                {ru ? 'Целевой ориентир' : 'Target'} ({targetScore})
              </span>
            </div>
          </div>
        </div>

        {/* Right Gap Analysis & Actionable Recommendations */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-400">
                  {radarMode === 'subscores' ? (ru ? 'Соответствие цели по сабскорам:' : 'Subscores against the target:') : (ru ? 'Диагностика готовности:' : 'Readiness diagnostic:')}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {!hasTakenTest ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> {ru ? 'Требуется прохождение теста' : 'A completed test is required'}
                    </span>
                  ) : totalDeficit === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {ru ? 'Все 4 показателя в норме!' : 'All 4 indicators are on target!'}
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> {ru ? `Дефицит по ${totalDeficit} из 4 показателей` : `Below target on ${totalDeficit} of 4 indicators`}
                    </span>
                  )}
                </h3>
                {weakestModality && (
                  <p className="text-[11px] text-amber-300/90 mt-1">
                    {ru ? 'Главное слабое звено' : 'Weakest link'}: <strong>{weakestModality.name}</strong> ({weakestModality.current} {ru ? 'баллов' : 'points'}).
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-neutral-500">
                  {ru ? 'Цель студента' : 'Student target'}
                </span>
                <div className="text-xl font-black text-purple-400">
                  {targetScore}+
                </div>
              </div>
            </div>
          </div>

          {/* 4 Subscore / Modality Cards */}
          <div className="space-y-2.5">
            {activeDeficits.map((d) => (
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
                    {ru ? 'Текущий' : 'Current'}: <strong className="text-white">{hasTakenTest && d.current > 0 ? d.current : '—'}</strong> •
                    {ru ? 'Требуется' : 'Target'}: <strong className="text-purple-300">{d.target}</strong>
                  </div>
                </div>

                <div>
                  {!hasTakenTest || d.current === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
                      {ru ? 'Нет данных' : 'No data'}
                    </span>
                  ) : d.passed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {ru ? 'В норме' : 'On target'} (+{d.current - d.target})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5" /> {ru ? `Нужно +${d.diff} баллов` : `Need +${d.diff} points`}
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
