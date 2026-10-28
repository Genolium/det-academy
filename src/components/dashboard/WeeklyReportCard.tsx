'use client';

import React, { useEffect, useState } from 'react';
import { api, WeeklyReport } from '@/lib/api';
import { CalendarDays, TrendingUp, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export const WeeklyReportCard: React.FC = () => {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getUserWeeklyReport()
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        if (!cancelled) setError(ru ? 'Недельный отчёт пока недоступен' : 'The weekly report is not available yet');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-[#0E1012] p-5 text-xs text-neutral-500">
        {error}
      </div>
    );
  }
  if (!report) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-[#0E1012] p-5 text-xs text-neutral-500">
        {ru ? 'Собираем недельный отчёт...' : 'Building the weekly report...'}
      </div>
    );
  }

  const range =
    report.currentEstimate > 0
      ? `${report.rangeLow}–${report.rangeHigh}`
      : (ru ? 'не измерено' : 'not measured');

  return (
    <div className="rounded-3xl border border-neutral-800 bg-[#0E1012] p-6 text-white space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#D2F544]" />
          <h2 className="text-base font-bold">{ru ? 'Отчёт за неделю' : 'Weekly report'}</h2>
        </div>
        <span className="text-[10px] font-mono text-neutral-500">
          {report.weekStart} — {report.weekEnd}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          [ru ? 'Дней занятий' : 'Study days', report.studyDays],
          [ru ? 'Сессий' : 'Sessions', report.sessions],
          [ru ? 'Mock-тестов' : 'Mock tests', report.mockTests],
          [ru ? 'SRS-повторов' : 'SRS reviews', report.srsReviews],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">{label}</span>
            <span className="text-xl font-black font-mono text-white">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D2F544]/30 bg-[#D2F544]/10 px-3 py-1 text-[#D2F544]">
          <TrendingUp className="w-3.5 h-3.5" /> {ru ? 'Текущий диапазон' : 'Current range'}: {range}
        </span>
        {report.weakestSkill && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300">
            <AlertCircle className="w-3.5 h-3.5" /> {ru ? 'Слабый навык' : 'Weakest skill'}: {report.weakestSkill}
          </span>
        )}
        <span className="text-neutral-500">
          {ru ? 'Ошибки' : 'Errors'}: +{report.errorsAdded} / {ru ? 'освоено' : 'mastered'} {report.errorsMastered}
        </span>
      </div>

      {report.recommendations.length > 0 && (
        <ul className="space-y-1.5 text-xs text-neutral-300">
          {report.recommendations.map((item) => (
            <li key={item} className="leading-relaxed">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
