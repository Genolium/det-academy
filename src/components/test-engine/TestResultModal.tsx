'use client';

import React from 'react';
import Link from 'next/link';
import { CalculatedScores } from '@/lib/scoring';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { Award, ArrowRight, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TestResultModalProps {
  scores: CalculatedScores;
  candidateName: string;
  isEligibleForCert: boolean;
  certificateId?: string;
  onRetake: () => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  scores,
  candidateName,
  isEligibleForCert,
  certificateId,
  onRetake,
}) => {
  const { locale } = useSettingsStore();
  const t = translations[locale].testResults;

  React.useEffect(() => {
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  }, []);

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

        {/* 4 DET Subscores */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
          {t.subscoresLabel}:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 text-center">
            <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Literacy</span>
            <span className="text-[10px] text-neutral-500 block mb-2">{t.literacySub}</span>
            <div className="text-3xl font-black text-[#D2F544] font-mono">{scores.literacy}</div>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 text-center">
            <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Comprehension</span>
            <span className="text-[10px] text-neutral-500 block mb-2">{t.comprehensionSub}</span>
            <div className="text-3xl font-black text-emerald-400 font-mono">{scores.comprehension}</div>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 text-center">
            <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Production</span>
            <span className="text-[10px] text-neutral-500 block mb-2">{t.productionSub}</span>
            <div className="text-3xl font-black text-amber-400 font-mono">{scores.production}</div>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 text-center">
            <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">Conversation</span>
            <span className="text-[10px] text-neutral-500 block mb-2">{t.conversationSub}</span>
            <div className="text-3xl font-black text-blue-400 font-mono">{scores.conversation}</div>
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

          <Link href={certificateId ? `/verify/${certificateId}` : '/verify/demo'}>
            <Button variant={isEligibleForCert ? 'primary' : 'outline'} size="sm">
              {t.openVerifyBtn}
            </Button>
          </Link>
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
