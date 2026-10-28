'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Keyboard,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  ONBOARDING_DONE_STORAGE_KEY,
  QUICK_PLACEMENT_STORAGE_KEY,
  quickPlacementQuestions,
  scoreQuickPlacement,
} from '@/data/quickPlacement';

const STEPS = 3;

export default function WelcomePage() {
  const router = useRouter();
  const { locale } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const saveGoals = useProgressStore((state) => state.saveGoals);
  const ru = locale === 'ru';

  const [step, setStep] = useState(0);
  const [targetScore, setTargetScore] = useState('120');
  const [targetDate, setTargetDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toISOString().slice(0, 10);
  });
  const [dailyMinutes, setDailyMinutes] = useState('45');
  const [saving, setSaving] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<boolean[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof scoreQuickPlacement> | null>(null);

  const question = quickPlacementQuestions[current];
  const progress = useMemo(() => Math.round(((step + 1) / STEPS) * 100), [step]);

  const finish = (destination: string) => {
    localStorage.setItem(ONBOARDING_DONE_STORAGE_KEY, 'true');
    router.push(destination);
  };

  const saveGoal = async () => {
    setGoalError(null);
    const score = Number(targetScore);
    if (!Number.isFinite(score) || score < 60 || score > 160) {
      setGoalError(ru ? 'Целевой балл должен быть от 60 до 160.' : 'Target score must be between 60 and 160.');
      return;
    }
    setSaving(true);
    try {
      await saveGoals({ targetScore: score, targetDate, dailyMinutes: Number(dailyMinutes) });
      setStep(2);
    } catch {
      setGoalError(
        ru
          ? 'Не удалось сохранить цель. Проверьте вход или пропустите этот шаг.'
          : 'Could not save the goal. Check your sign-in or skip this step.'
      );
    } finally {
      setSaving(false);
    }
  };

  const answer = (value: boolean) => {
    const next = [...answers, value];
    setAnswers(next);
    if (current + 1 < quickPlacementQuestions.length) {
      setCurrent(current + 1);
      return;
    }
    const scored = scoreQuickPlacement(next);
    setResult(scored);
    localStorage.setItem(QUICK_PLACEMENT_STORAGE_KEY, JSON.stringify(scored));
    localStorage.setItem(ONBOARDING_DONE_STORAGE_KEY, 'true');
  };

  return (
    <div className="min-h-screen py-10 sm:py-14 ambient-glow">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <span>{ru ? 'Онбординг DET Academy' : 'DET Academy onboarding'}</span>
            <button
              type="button"
              onClick={() => finish('/dashboard')}
              className="cursor-pointer text-neutral-400 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
            >
              {ru ? 'Позже' : 'Later'}
            </button>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-label={ru ? 'Прогресс онбординга' : 'Onboarding progress'} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[#0E1012] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            {ru ? `Шаг ${step + 1} из ${STEPS}` : `Step ${step + 1} of ${STEPS}`}
          </p>
        </div>

        {step === 0 && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/50 bg-[#D2F544]/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#0C2418]">
                <Sparkles className="h-3.5 w-3.5" /> {ru ? '3 минуты' : '3 minutes'}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#0E1012]">
                {ru ? 'Сначала карта, потом тренировки' : 'First the map, then the drills'}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {ru
                  ? 'Экзамен длится около часа и проверяет четыре сабскора: Literacy, Comprehension, Production и Conversation. Платформа повторяет его структуру и показывает, что именно проседает.'
                  : 'The exam takes about an hour and reports four subscores: Literacy, Comprehension, Production and Conversation. The platform mirrors its structure and shows what is actually weak.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: <BookOpen className="h-4 w-4" />, title: ru ? '13 типов заданий' : '13 task types', text: ru ? 'От Read & Select до Speaking Sample: таймеры и серверная оценка.' : 'From Read & Select to Speaking Sample, with timers and server-side scoring.' },
                  { icon: <Keyboard className="h-4 w-4" />, title: ru ? 'Печать вслепую' : 'Touch typing', text: ru ? '40+ WPM и взгляд на экран: иначе таймеры съедают баллы.' : '40+ WPM and eyes on screen, or the timers eat your score.' },
                  { icon: <Target className="h-4 w-4" />, title: ru ? 'Ваш уровень' : 'Your level', text: ru ? 'Короткая проверка лексики даёт ориентир A2–C1 за пару минут.' : 'A short vocabulary check estimates A2–C1 in a couple of minutes.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#D2F544] text-[#0C2418]">{item.icon}</div>
                    <p className="text-sm font-bold text-[#0E1012]">{item.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{item.text}</p>
                  </div>
                ))}
              </div>

              <Link href="/theory/start-here" className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#0E1012] underline decoration-neutral-300 underline-offset-2 hover:decoration-[#0E1012]">
                {ru ? 'Открыть вводный урок целиком' : 'Open the full intro lesson'} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D2F544] px-6 py-3.5 text-sm font-black text-[#0C2418] transition-transform hover:bg-[#C4F22C] active:scale-[0.99] sm:w-auto"
            >
              {ru ? 'Дальше: цель подготовки' : 'Next: your goal'} <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0E1012]">
                {ru ? 'Куда готовимся?' : 'What are we preparing for?'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {ru
                  ? 'План, готовность и рекомендации строятся от цели. Платформа не подставляет баллы и даты за вас.'
                  : 'The plan, readiness and recommendations are built from your goal. The platform does not invent scores or dates.'}
              </p>

              {isAuthenticated ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{ru ? 'Цель, балл' : 'Target score'}</span>
                    <input type="number" min={60} max={160} step={5} value={targetScore} onChange={(event) => setTargetScore(event.target.value)} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-[#0E1012] focus:border-[#0C2418] focus:outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{ru ? 'Дата экзамена' : 'Exam date'}</span>
                    <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-[#0E1012] focus:border-[#0C2418] focus:outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{ru ? 'Минут в день' : 'Minutes per day'}</span>
                    <select value={dailyMinutes} onChange={(event) => setDailyMinutes(event.target.value)} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-[#0E1012] focus:border-[#0C2418] focus:outline-none">
                      {[15, 30, 45, 60, 90, 120].map((minutes) => (
                        <option key={minutes} value={minutes}>{minutes}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600">
                  {ru
                    ? 'Вы не вошли в аккаунт. Цель можно сохранить после входа. Сейчас пропустите шаг и продолжите проверку уровня.'
                    : 'You are not signed in. You can save the goal after signing in; skip this step and continue to the level check.'}
                </p>
              )}

              {goalError && <p role="alert" className="mt-3 text-xs text-rose-600">{goalError}</p>}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isAuthenticated && (
                  <button type="button" onClick={saveGoal} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D2F544] px-6 py-3 text-sm font-black text-[#0C2418] transition-colors hover:bg-[#C4F22C] disabled:opacity-60">
                    {saving ? (ru ? 'Сохраняем…' : 'Saving…') : ru ? 'Сохранить и дальше' : 'Save and continue'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <button type="button" onClick={() => setStep(2)} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-neutral-500">
                  {ru ? 'Пропустить' : 'Skip'}
                </button>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
              {!result ? (
                <>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500">
                    <span>{ru ? 'Проверка лексики' : 'Vocabulary check'}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {current + 1}/{quickPlacementQuestions.length}</span>
                  </div>
                  <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-[#0E1012]">
                    {ru ? 'Это реальное английское слово?' : 'Is this a real English word?'}
                  </h1>
                  <p className="mt-2 text-sm text-neutral-500">
                    {ru ? 'Отвечайте быстро: важна первая реакция, а не поиск в словаре.' : 'Answer quickly: first reaction matters, not a dictionary search.'}
                  </p>
                  <div className="my-8 rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#0E1012]">{question.word}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => answer(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0E1012] px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-neutral-800">
                      <CheckCircle2 className="h-4 w-4 text-[#D2F544]" /> {ru ? 'Реальное слово' : 'Real word'}
                    </button>
                    <button type="button" onClick={() => answer(false)} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3.5 text-sm font-bold text-neutral-700 transition-colors hover:border-neutral-500">
                      <XCircle className="h-4 w-4" /> {ru ? 'Не слово' : 'Not a word'}
                    </button>
                  </div>
                </>
              ) : (
                <div aria-live="polite">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/50 bg-[#D2F544]/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#0C2418]">
                    <Sparkles className="h-3.5 w-3.5" /> {ru ? 'Ориентир' : 'Estimate'}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0E1012]">
                    {ru ? `Ваш уровень около ${result.level}` : `Your level is around ${result.level}`}
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {ru
                      ? `Верно ${result.correct} из ${result.total}. Это ориентир по лексике. Официальный балл DET он не заменяет: грамматику, аудирование и речь проверка не измеряет.`
                      : `${result.correct} of ${result.total} correct. This is a vocabulary estimate; it does not replace an official DET score and does not measure grammar, listening or speaking.`}
                  </p>
                  <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600">
                    {ru
                      ? 'Стартовая сложность платформы будет подстроена под этот ориентир. Точный уровень покажет диагностика: 13 этапов, около 10 минут.'
                      : 'The starting difficulty will follow this estimate. The diagnostic shows the precise level: 13 stages, about 10 minutes.'}
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => finish('/diagnostic')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D2F544] px-6 py-3 text-sm font-black text-[#0C2418] hover:bg-[#C4F22C]">
                      {ru ? 'Пройти диагностику' : 'Take the diagnostic'} <ArrowRight className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => finish('/dashboard')} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-bold text-neutral-700 hover:border-neutral-500">
                      {ru ? 'На дашборд' : 'Go to dashboard'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
