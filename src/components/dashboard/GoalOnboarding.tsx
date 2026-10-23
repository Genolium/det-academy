'use client';

import React, { useState } from 'react';
import { Target, CalendarDays, Clock, ArrowRight } from 'lucide-react';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const MIN_SCORE = 60;
const MAX_SCORE = 160;

/**
 * Shown until the student chooses a target. The product never invents a target
 * score, a deadline, a daily budget or a university.
 */
export const GoalOnboarding: React.FC = () => {
  const { locale } = useSettingsStore();
  const saveGoals = useProgressStore((state) => state.saveGoals);

  const [targetScore, setTargetScore] = useState('125');
  const [targetDate, setTargetDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toISOString().slice(0, 10);
  });
  const [dailyMinutes, setDailyMinutes] = useState('45');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ru = locale === 'ru';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const score = Number(targetScore);
    if (!Number.isFinite(score) || score < MIN_SCORE || score > MAX_SCORE) {
      setError(ru ? `Целевой балл должен быть от ${MIN_SCORE} до ${MAX_SCORE}.` : `Target score must be between ${MIN_SCORE} and ${MAX_SCORE}.`);
      return;
    }
    if (!targetDate) {
      setError(ru ? 'Укажите дату экзамена.' : 'Choose an exam date.');
      return;
    }

    setSaving(true);
    try {
      await saveGoals({ targetScore: score, targetDate, dailyMinutes: Number(dailyMinutes) });
    } catch {
      setError(ru ? 'Не удалось сохранить цель. Попробуйте ещё раз.' : 'Could not save the goal. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="goal-onboarding-title"
      className="bg-[#0E1012] border border-[#D2F544]/30 rounded-3xl p-6 sm:p-8 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-[#D2F544]" />
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D2F544]/20 text-[#D2F544] border border-[#D2F544]/30">
          {ru ? 'Первый шаг' : 'First step'}
        </span>
      </div>

      <h2 id="goal-onboarding-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
        {ru ? 'Задайте цель подготовки' : 'Set your preparation goal'}
      </h2>
      <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-2xl leading-relaxed">
        {ru
          ? 'План обучения, готовность и рекомендации строятся от вашей цели. Пока цель не выбрана, платформа не подставляет баллы, даты и университеты за вас.'
          : 'The plan, readiness and recommendations are derived from your goal. Until you choose one, the platform does not fill in scores, dates or universities for you.'}
      </p>

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> {ru ? 'Целевой балл DET' : 'Target DET score'}
          </span>
          <input
            type="number"
            min={MIN_SCORE}
            max={MAX_SCORE}
            step={5}
            value={targetScore}
            onChange={(event) => setTargetScore(event.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D2F544]"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> {ru ? 'Дата экзамена' : 'Exam date'}
          </span>
          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D2F544]"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {ru ? 'Время в день' : 'Time per day'}
          </span>
          <select
            value={dailyMinutes}
            onChange={(event) => setDailyMinutes(event.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D2F544]"
          >
            {[15, 30, 45, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} {ru ? 'мин/день' : 'min/day'}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-[#D2F544] hover:bg-[#C4F22C] text-[#0E1012] font-black text-sm px-5 py-2.5 rounded-full transition-transform active:scale-95 disabled:opacity-60"
          >
            {saving ? (ru ? 'Сохраняем…' : 'Saving…') : ru ? 'Сохранить цель' : 'Save goal'}
            <ArrowRight className="w-4 h-4" />
          </button>
          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}
        </div>
      </form>
    </section>
  );
};
