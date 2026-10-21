'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalculatedScores } from '@/lib/scoring';
import { api, EvaluationResult } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { Award, RotateCcw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setLoadingEvals(true);
    api.getSessionEvaluations(sessionId)
      .then((res) => {
        if (res?.evaluations) {
          setEvaluations(res.evaluations);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEvals(false));
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
              {t.overallLabel}
            </span>
            <span className="text-[10px] text-neutral-500 block mb-1">
              Тренировочная оценка DET Academy, не официальный балл Duolingo
            </span>
            <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
              {scores.overall}
              <span className="text-2xl text-neutral-500 font-normal"> / 160</span>
            </div>
            <span className="text-xs text-neutral-400 mt-2 block">
              {t.scaleNote} • {scores.overall - 5}–{scores.overall + 5}
            </span>
          </div>

          <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 text-xs space-y-1.5 max-w-xs">
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
          </div>
        </div>

        {/* 4 DET Subscores & Radar Chart */}
        <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="w-full md:w-1/2 flex justify-center">
              <SubscoresRadarChart scores={scores} size={300} showDetails={false} />
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t.subscoresLabel}:
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Literacy</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.literacySub}</span>
                  <div className="text-2xl font-black text-[#D2F544] font-mono">{scores.literacy}</div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Comprehension</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.comprehensionSub}</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{scores.comprehension}</div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Production</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.productionSub}</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">{scores.production}</div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Conversation</span>
                  <span className="text-[10px] text-neutral-500 block mb-1">{t.conversationSub}</span>
                  <div className="text-2xl font-black text-blue-400 font-mono">{scores.conversation}</div>
                </div>
              </div>

              {scores.reading && scores.listening && scores.writing && scores.speaking ? (
                <div className="pt-3 border-t border-neutral-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
                    Individual Skills:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Reading</span>
                      <span className="font-bold font-mono text-white text-sm">{scores.reading}</span>
                    </div>
                    <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Listening</span>
                      <span className="font-bold font-mono text-white text-sm">{scores.listening}</span>
                    </div>
                    <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Writing</span>
                      <span className="font-bold font-mono text-white text-sm">{scores.writing}</span>
                    </div>
                    <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Speaking</span>
                      <span className="font-bold font-mono text-white text-sm">{scores.speaking}</span>
                    </div>
                  </div>
                </div>
              ) : null}
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
