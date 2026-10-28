'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { api, AdaptivePractice } from '@/lib/api';
import { useErrorNotebookStore, ErrorItem, errorTypeLabel } from '@/store/useErrorNotebookStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface RecallFeedback {
  success: boolean;
  mastered: boolean;
  message: string;
  correctAnswer: string;
  explanation?: string;
}

export default function AdaptivePracticePage() {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const { user } = useAuthStore();
  const { errors, loadForUser, recallError, isSyncing } = useErrorNotebookStore();
  const [plan, setPlan] = useState<AdaptivePractice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<RecallFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [index, setIndex] = useState(0);
  const [masteredHere, setMasteredHere] = useState<string[]>([]);

  const load = () => {
    setError(null);
    setFeedback(null);
    setIndex(0);
    setMasteredHere([]);
    api
      .getAdaptivePractice()
      .then(setPlan)
      .catch(() =>
        setError(
          ru ? 'Не удалось собрать набор. Попробуйте ещё раз.' : 'Could not build the practice set. Try again.'
        )
      );
  };

  useEffect(() => {
    load();
    void loadForUser(user?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const sessionItems = useMemo(() => {
    if (!plan) return [];
    const byId = new Map(errors.map((item) => [item.id, item]));
    return plan.errorIds
      .map((id) => byId.get(id))
      .filter((item): item is ErrorItem => Boolean(item) && !item!.mastered);
  }, [plan, errors]);

  const current = sessionItems[index] ?? null;
  const completed = masteredHere.length;
  const total = sessionItems.length + completed;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const submit = async () => {
    if (!current || !answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await recallError(current.id, answer);
      setFeedback({
        success: result.success,
        mastered: result.mastered,
        message: result.message,
        correctAnswer: result.correctAnswer || current.correctAnswer,
        explanation: result.explanation ?? current.explanation,
      });
      if (result.mastered) {
        setMasteredHere((items) => [...items, current.id]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    setFeedback(null);
    setAnswer('');
    if (feedback?.mastered) {
      // The store removes the mastered item from the queue, so restart at the
      // first remaining entry instead of incrementing past it.
      setIndex(0);
    }
  };

  return (
    <div className="min-h-screen py-10 ambient-glow">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link
          href="/dashboard#errors"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-[#0E1012]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {ru ? 'К тетради ошибок' : 'Back to the error notebook'}
        </Link>

        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/50 bg-[#D2F544]/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#0C2418]">
              <Brain className="h-3.5 w-3.5" /> {ru ? 'Адаптивная практика' : 'Adaptive practice'}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#0E1012] sm:text-4xl">
              {plan?.title || (ru ? 'Собираем набор из ваших ошибок' : 'Building a set from your errors')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              {plan?.reason ||
                (ru
                  ? 'Набор строится из конкретных неусвоенных записей тетради ошибок.'
                  : 'The set is built from the exact unmastered Error Notebook entries.')}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 self-start rounded-full border border-neutral-300 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:border-neutral-500"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {ru ? 'Пересобрать' : 'Rebuild'}
          </button>
        </div>

        {error ? (
          <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-bold text-[#0E1012] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#D2F544]" />
            {sessionItems.length} {ru ? 'точных заданий' : 'exact items'}
          </span>
          <span>{plan?.focusType || '—'}</span>
          <span>· {plan?.minutes || 10} {ru ? 'минут' : 'minutes'}</span>
          {isSyncing ? <span>{ru ? 'Синхронизация…' : 'Syncing…'}</span> : null}
        </div>

        {plan && sessionItems.length === 0 && !isSyncing ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-bold">
                {ru ? 'В этой группе ошибок не осталось.' : 'No unmastered errors remain in this group.'}
              </p>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              {ru
                ? 'Ошибка считается усвоенной после двух верных ответов подряд. Можно перейти к общему тренажёру.'
                : 'An error is mastered after two correct recalls in a row. You can continue with the general drill.'}
            </p>
            {plan.focusSlug ? (
              <Link
                href={`/practice?drill=${plan.focusSlug}`}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0E1012] px-4 py-2.5 text-xs font-bold text-white"
              >
                {ru ? 'Открыть тренажёр' : 'Open the drill'} <ArrowRight className="h-3.5 w-3.5 text-[#D2F544]" />
              </Link>
            ) : null}
          </div>
        ) : null}

        {current ? (
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" data-testid="adaptive-session">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
                {ru ? 'Задание' : 'Item'} {Math.min(index + 1, sessionItems.length)} / {sessionItems.length}
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600">
                {errorTypeLabel(current.type)}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
              <div className="h-full rounded-full bg-[#D2F544]" style={{ width: `${progress}%` }} />
            </div>

            <p className="mt-4 whitespace-pre-wrap text-base font-semibold leading-relaxed text-[#0E1012]">
              {current.prompt}
            </p>
            {current.userAnswer ? (
              <p className="mt-2 text-xs text-neutral-500">
                {ru ? 'Прошлый ответ' : 'Previous answer'}:{' '}
                <span className="font-mono text-rose-600">{current.userAnswer}</span>
              </p>
            ) : null}

            <label htmlFor="adaptive-answer" className="mt-4 block text-[11px] font-black uppercase tracking-wider text-neutral-500">
              {ru ? 'Ваш ответ' : 'Your answer'}
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                id="adaptive-answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void submit();
                }}
                disabled={Boolean(feedback) || submitting}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-[#0E1012] outline-none focus:border-[#0E1012]"
                placeholder={ru ? 'Введите ответ' : 'Type your answer'}
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!answer.trim() || submitting || Boolean(feedback)}
                className="rounded-xl bg-[#0E1012] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40"
              >
                {submitting ? (ru ? 'Проверяем…' : 'Checking…') : ru ? 'Проверить' : 'Check'}
              </button>
            </div>

            {current.contextVariants?.length ? (
              <details className="mt-3 text-xs text-neutral-500">
                <summary className="cursor-pointer font-bold text-neutral-600">
                  {ru ? 'Похожие формулировки' : 'Related prompts'}
                </summary>
                <ul className="mt-2 space-y-1">
                  {current.contextVariants.slice(0, 3).map((variant) => (
                    <li key={variant.prompt}>• {variant.prompt}</li>
                  ))}
                </ul>
              </details>
            ) : null}

            {feedback ? (
              <div
                role="status"
                className={`mt-4 rounded-xl border p-4 text-sm ${
                  feedback.success
                    ? feedback.mastered
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-rose-200 bg-rose-50 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {feedback.success ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">{feedback.message}</p>
                    <p className="mt-1 text-xs">
                      {ru ? 'Правильный ответ' : 'Correct answer'}:{' '}
                      <strong className="font-mono">{feedback.correctAnswer}</strong>
                    </p>
                    {feedback.explanation ? <p className="mt-1 text-xs opacity-80">{feedback.explanation}</p> : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#0E1012] px-4 py-2 text-[11px] font-bold text-white"
                >
                  {feedback.mastered
                    ? ru
                      ? 'Следующая ошибка'
                      : 'Next error'
                    : ru
                      ? 'Повторить'
                      : 'Try again'}
                  <ArrowRight className="h-3 w-3 text-[#D2F544]" />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {masteredHere.length > 0 ? (
          <p className="mt-4 text-xs text-emerald-700" data-testid="adaptive-mastered">
            {ru ? 'Усвоено в этой сессии' : 'Mastered in this session'}: {masteredHere.length}
          </p>
        ) : null}
      </div>
    </div>
  );
}
