'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalculatedScores } from '@/lib/scoring';
import { api, CoachReport, EvaluationResult, ReviewItem } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { Award, RotateCcw, CheckCircle2, ShieldCheck, Sparkles, FileText, Lightbulb, BookOpen, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SubscoresRadarChart } from '@/components/analytics/SubscoresRadarChart';
import { RubricFeedbackCard } from '@/components/audio/RubricFeedbackCard';

interface TestResultModalProps {
  scores: CalculatedScores;
  candidateName: string;
  isEligibleForCert: boolean;
  certificateId?: string;
  sessionId?: string;
  onRetake: () => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  scores,
  candidateName,
  isEligibleForCert,
  certificateId,
  sessionId,
  onRetake,
}) => {
  const { locale } = useSettingsStore();
  const t = translations[locale].testResults;

  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [coach, setCoach] = useState<CoachReport | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);

  const notMeasured = scores.notMeasured || [];
  const overallMeasured = (scores.overall || 0) > 0 && !notMeasured.includes('overall');
  const completeness = Math.round((scores.completeness ?? 1) * 100);
  const rangeLow = scores.rangeLow ?? Math.max(10, (scores.overall || 0) - 10);
  const rangeHigh = scores.rangeHigh ?? Math.min(160, (scores.overall || 0) + 10);
  const confidenceLabel =
    scores.confidence === 'high'
      ? 'Высокая уверенность'
      : scores.confidence === 'medium'
      ? 'Средняя уверенность'
      : 'Низкая уверенность';

  const measuredSkills = [
    { key: 'reading', label: 'Чтение', value: scores.reading || 0 },
    { key: 'listening', label: 'Аудирование', value: scores.listening || 0 },
    { key: 'writing', label: 'Письмо', value: scores.writing || 0 },
    { key: 'speaking', label: 'Говорение', value: scores.speaking || 0 },
  ].filter((skill) => skill.value > 0);
  const weakestSkill = measuredSkills.length
    ? measuredSkills.reduce((weakest, skill) => (skill.value < weakest.value ? skill : weakest))
    : null;
  const nextSteps: Record<string, { title: string; description: string; href: string }> = {
    reading: {
      title: 'Чтение: C-Test и Read & Select',
      description: '15–20 минут в день на короткие тексты и разбор пропусков.',
      href: '/practice',
    },
    listening: {
      title: 'Аудирование: диктанты',
      description: 'Один диктант в день с повторным прослушиванием и разбором ошибок.',
      href: '/practice',
    },
    writing: {
      title: 'Письмо: Writing Sample',
      description: 'Два эссе в неделю по 100+ слов с проверкой структуры и лексики.',
      href: '/practice',
    },
    speaking: {
      title: 'Говорение: Speak About Photo',
      description: 'Три коротких ответа в неделю по 60–90 секунд с записью и разбором.',
      href: '/practice',
    },
  };
  const recommended = weakestSkill ? nextSteps[weakestSkill.key] : null;

  useEffect(() => {
    if (!overallMeasured) return;
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  }, [overallMeasured]);

  useEffect(() => {
    if (!sessionId) return;
    api
      .getCoachReport(sessionId)
      .then((report) => setCoach(report))
      .catch(() => setCoach(null));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    api
      .getSessionReview(sessionId)
      .then((response) => setReview(response.items || []))
      .catch((error: unknown) =>
        setReviewError(error instanceof Error ? error.message : 'Разбор недоступен')
      );
  }, [sessionId]);

  const pendingEvaluations = evaluations.some((item) =>
    ['queued', 'transcribing', 'evaluating', 'retryable_failed'].includes(
      item.feedbackStatus || ''
    )
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const load = (showLoader: boolean) => {
      if (showLoader) setLoadingEvals(true);
      api
        .getSessionEvaluations(sessionId)
        .then((res) => {
          if (!cancelled && res?.evaluations) {
            setEvaluations(res.evaluations);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled && showLoader) setLoadingEvals(false);
        });
    };
    load(true);
    const timer = setInterval(() => load(false), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sessionId]);


  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-[#111315] text-white rounded-3xl p-8 sm:p-12 border border-neutral-800 shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-neutral-800 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <PillBadge variant="lime" prefixHash>
                {t.badge}
              </PillBadge>
              <span className="text-xs text-neutral-400 font-mono">
                {t.candidateLabel}: <strong className="text-white">{candidateName}</strong>
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              {t.title}
            </h2>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#D2F544] text-[#0C2418] flex items-center justify-center font-black">
            <Award className="w-9 h-9" />
          </div>
        </div>

        {/* Overall Score Banner */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 p-8 rounded-3xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 text-center sm:text-left">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#D2F544] block mb-1">
              {overallMeasured ? t.overallLabel : 'Итоговая оценка'}
            </span>
            <span className="text-[10px] text-neutral-500 block mb-1">
              Тренировочная оценка DET Academy, не официальный балл Duolingo
            </span>
            {overallMeasured ? (
              <>
                <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
                  {scores.overall}
                  <span className="text-2xl text-neutral-500 font-normal"> / 160</span>
                </div>
                <span className="text-xs text-neutral-400 mt-2 block">
                  {t.scaleNote} • диапазон {rangeLow}–{rangeHigh} • {confidenceLabel}
                </span>
              </>
            ) : (
              <>
                <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tight">
                  Недостаточно данных
                </div>
                <span className="text-xs text-neutral-400 mt-2 block max-w-md">
                  Итоговый балл не выставлен, потому что не все четыре навыка были измерены
                  сервером. Завершено {completeness}% проверки.
                </span>
              </>
            )}
          </div>

          <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 text-xs space-y-1.5 max-w-xs">
            {overallMeasured ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {scores.overall >= 120
                    ? t.highScoreNote
                    : scores.overall >= 105
                    ? t.midScoreNote
                    : t.lowScoreNote}
                </span>
              </div>
            ) : (
              <div className="text-amber-300 font-bold">
                Пропущенные навыки: {notMeasured.filter((skill) => skill !== 'overall').join(', ') || '—'}
              </div>
            )}
            <div className="text-neutral-500 pt-1">
              Отвечено заданий: {scores.answeredQuestions ?? 0}
              {(scores.timeoutEvents ?? 0) > 0 && (
                <> · таймаутов: {scores.timeoutEvents}</>
              )}
            </div>
          </div>
        </div>

        {/* 4 DET Subscores & Radar Chart */}
        <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="w-full md:w-1/2 flex justify-center">
              {overallMeasured ? (
                <SubscoresRadarChart scores={scores} size={300} showDetails={false} />
              ) : (
                <div className="text-center text-xs text-neutral-500 max-w-[240px]">
                  Радар не строится: для него нужны все четыре измеренных навыка.
                </div>
              )}
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t.subscoresLabel}:
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Literacy</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.literacySub}</span>
                  <div className="text-2xl font-black text-[#D2F544] font-mono">
                    {scores.literacy > 0 ? scores.literacy : '—'}
                  </div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Comprehension</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.comprehensionSub}</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {scores.comprehension > 0 ? scores.comprehension : '—'}
                  </div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Production</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.productionSub}</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {scores.production > 0 ? scores.production : '—'}
                  </div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Conversation</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.conversationSub}</span>
                  <div className="text-2xl font-black text-blue-400 font-mono">
                    {scores.conversation > 0 ? scores.conversation : '—'}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
                  Individual Skills:
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {([
                    ['Reading', scores.reading],
                    ['Listening', scores.listening],
                    ['Writing', scores.writing],
                    ['Speaking', scores.speaking],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">{label}</span>
                      <span className="font-bold font-mono text-white text-sm">
                        {value && value > 0 ? value : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate notice */}
        <div className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#D2F544] shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">{t.certCardTitle}</div>
              <p className="text-xs text-neutral-400">
                {isEligibleForCert
                  ? t.certReadyNotice
                  : t.certPendingNotice}
              </p>
            </div>
          </div>

          {certificateId ? (
            <Link href={`/verify/${encodeURIComponent(certificateId)}`}>
              <Button variant="primary" size="sm">
                {t.openVerifyBtn}
              </Button>
            </Link>
          ) : (
            <div className="text-right">
              <Button variant="outline" size="sm" disabled>
                Сертификат не выдан
              </Button>
              <p className="text-[10px] text-neutral-500 mt-1 max-w-[220px]">
                Ссылка на проверку появляется только после выдачи сертификата сервером.
              </p>
            </div>
          )}
        </div>

        {/* Speaking & Writing Studio Breakdown */}
        {pendingEvaluations && (
          <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
            Серверная проверка Speaking/Writing ещё идёт. Результат и evidence появятся
            автоматически.
          </div>
        )}
        {evaluations.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D2F544]" />
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Разбор устной и письменной речи (Speaking & Writing Studio)
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Серверная оценка по рубрикам Duolingo English Test: анализ лексического разнообразия (TTR), академического словаря, структуры и беглости речи.
            </p>
            <div className="space-y-4">
              {evaluations.map((ev) => (
                <RubricFeedbackCard key={ev.id} evaluation={ev} />
              ))}
            </div>
          </div>
        )}

        {loadingEvals && (
          <div className="p-6 text-center text-xs text-neutral-400 border border-neutral-800 rounded-2xl mb-8">
            Загрузка детального разбора ответов...
          </div>
        )}

        {/* Next steps */}
        <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D2F544]" />
            <h3 className="text-base font-bold text-white">Что делать дальше</h3>
          </div>
          {overallMeasured ? (
            <>
              <p className="text-xs text-neutral-400">
                Слабейший измеренный навык:{' '}
                <strong className="text-white">{weakestSkill?.label || '—'}</strong>. Это не
                приговор, а точка роста для следующей недели.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href={recommended?.href || '/practice'}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 hover:border-[#D2F544]/60 transition-colors"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D2F544]">
                    1. Главный фокус
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">
                    {recommended?.title || 'Практика'}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {recommended?.description || 'Одна короткая сессия в день.'}
                  </p>
                </Link>
                <Link
                  href="/practice/flashcards"
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 hover:border-[#D2F544]/60 transition-colors"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D2F544]">
                    2. Словарь
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">SRS 10–15 минут</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Повторяйте слова из слабого навыка и Academic Word List.
                  </p>
                </Link>
                <Link
                  href="/test/session"
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 hover:border-[#D2F544]/60 transition-colors"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D2F544]">
                    3. Контроль
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">Полный mock через 7–10 дней</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Не каждый день: сначала закрепите слабый навык.
                  </p>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-400">
              Сначала пройдите пропущенные этапы без пропусков. Итоговый балл и рекомендации
              появятся только после измерения всех четырёх навыков. Для тренировки используйте{' '}
              <Link href="/practice" className="text-[#D2F544] underline">
                свободные тренажёры
              </Link>
              .
            </p>
          )}
        </div>

        {/* Speaking/Writing Coach */}
        {coach?.available && coach.items.length > 0 && (
          <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 mb-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#D2F544]" />
                <h3 className="text-base font-bold text-white">Коучинг Speaking / Writing</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={coachBusy}
                  onClick={async () => {
                    if (!sessionId) return;
                    setCoachBusy(true);
                    try {
                      const result = await api.saveCoachErrors(sessionId);
                      setCoachMessage(
                        result.created > 0
                          ? `Добавлено в тетрадь ошибок: ${result.created}.`
                          : 'Все наблюдения уже есть в тетради ошибок.'
                      );
                    } catch {
                      setCoachMessage('Не удалось добавить наблюдения в тетрадь ошибок.');
                    } finally {
                      setCoachBusy(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0E1012] bg-[#D2F544] hover:bg-[#C4F22C] px-3 py-1.5 rounded-full disabled:opacity-60"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  В тетрадь ошибок
                </button>
                <button
                  type="button"
                  disabled={coachBusy}
                  onClick={async () => {
                    if (!sessionId) return;
                    setCoachBusy(true);
                    try {
                      const result = await api.deleteCoachAudio(sessionId);
                      setCoachMessage(
                        result.deletedAssets > 0
                          ? `Аудио удалено: ${result.deletedAssets}.`
                          : 'Аудиозаписей для удаления нет.'
                      );
                    } catch {
                      setCoachMessage('Не удалось удалить аудио.');
                    } finally {
                      setCoachBusy(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-300 border border-neutral-700 hover:border-rose-500 hover:text-rose-300 px-3 py-1.5 rounded-full disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить аудио
                </button>
              </div>
            </div>

            {coach.notice && <p className="text-xs text-amber-300">{coach.notice}</p>}
            {coachMessage && <p className="text-xs text-neutral-300">{coachMessage}</p>}

            <div className="space-y-3">
              {coach.items.map((item) => (
                <div key={item.questionId} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {item.questionType.replaceAll('_', ' ')}
                    </span>
                      {item.status === 'COMPLETED' ? (
                      <span className="text-xs font-black text-[#D2F544]">
                        {Math.round(item.score * 100)}% · {item.cefrLevel}
                        {typeof item.previousScore === 'number' ? ` · ${item.scoreDelta && item.scoreDelta > 0 ? '+' : ''}${Math.round((item.scoreDelta || 0) * 100)}` : ''}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-300">оценка недоступна</span>
                    )}
                  </div>

                  {item.status === 'COMPLETED' ? (
                    <>
                      {item.improvements.map((line, index) => (
                        <p key={index} className="text-xs text-neutral-300">{line}</p>
                      ))}
                      {item.evidence.map((evidence, index) => (
                        <p key={index} className="text-[11px] text-neutral-400">
                          <span className="text-neutral-500">«{evidence.span}»</span> · {evidence.rule} →{' '}
                          <span className="text-neutral-200">{evidence.fix}</span>
                        </p>
                      ))}
                      {item.feedback && <p className="text-[11px] text-neutral-400">{item.feedback}</p>}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-neutral-500">
                          {item.provider || 'provider'} · {item.evaluatorVersion || 'version'}
                        </span>
                        <Link href={item.practiceUrl} className="text-[11px] font-bold text-[#D2F544] hover:underline">
                          Переписать / перезаписать
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-neutral-400">
                      Провайдер оценивания не вернул результат. Это не нулевой навык — ответ можно оценить позже.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attempt review */}
        <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 mb-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D2F544]" />
              <h3 className="text-base font-bold text-white">Разбор попытки</h3>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              {review.length} заданий
            </span>
          </div>
          {reviewError && <p className="text-xs text-amber-400">{reviewError}</p>}
          {review.length === 0 && !reviewError && (
            <p className="text-xs text-neutral-500">
              Разбор появится после завершения попытки.
            </p>
          )}
          {review.length > 0 && (
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {review.map((item) => (
                <div
                  key={`${item.stageName}-${item.questionId}`}
                  className={`rounded-2xl border p-3 text-xs ${
                    item.isCorrect
                      ? 'border-emerald-900/60 bg-emerald-950/20'
                      : 'border-amber-900/60 bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                      {item.stageName.replaceAll('_', ' ')}
                    </span>
                    <span
                      className={`font-bold ${
                        item.isCorrect ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {item.isCorrect ? 'верно' : item.userAnswer ? 'ошибка' : 'пропущено'}
                    </span>
                  </div>
                  <p className="text-neutral-200 leading-relaxed">{item.prompt}</p>
                  {item.userAnswer && (
                    <p className="mt-1 font-mono text-[11px] text-red-300 break-words">
                      Ваш ответ: {item.userAnswer}
                    </p>
                  )}
                  {!item.isCorrect && item.correctAnswer && (
                    <p className="mt-1 font-mono text-[11px] text-[#D2F544] break-words">
                      Правильный ответ: {item.correctAnswer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white px-4 py-2 rounded-full border border-neutral-700"
          >
            <RotateCcw className="w-4 h-4" />
            {t.retakeBtn}
          </button>

          <Link href="/">
            <Button variant="dark" size="md">
              {t.homeBtn}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
