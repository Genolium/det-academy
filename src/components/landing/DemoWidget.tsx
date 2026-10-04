'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { sound } from '@/lib/sound';
import { Check, X, ArrowRight, RotateCcw, Play, Clock, Sparkles } from 'lucide-react';

interface DemoWord {
  word: string;
  isReal: boolean;
  explanationRu: string;
  explanationEn: string;
}

const DEMO_WORDS: DemoWord[] = [
  {
    word: 'ambiguous',
    isReal: true,
    explanationRu: 'Реальное слово (означает «двусмысленный, неопределенный»)',
    explanationEn: 'Real word (means "open to more than one interpretation")',
  },
  {
    word: 'disflown',
    isReal: false,
    explanationRu: 'Псевдослово (ловушка экзамена DET: приставка dis- с формой flown)',
    explanationEn: 'Pseudo-word (DET trap: prefix dis- combined with flown)',
  },
  {
    word: 'empirical',
    isReal: true,
    explanationRu: 'Реальное слово (означает «опытный, эмпирический»)',
    explanationEn: 'Real word (means "based on observation or experience")',
  },
];

export const DemoWidget: React.FC = () => {
  const { locale, soundEnabled } = useSettingsStore();
  const t = translations[locale].demo;

  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // 5.0 seconds timer for current word - ONLY runs when started and not completed
  useEffect(() => {
    if (!isStarted || completed) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleAnswer(false, true); // Auto-timeout counts as skipped/no
          return 5.0;
        }
        return Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isStarted, currentIndex, completed]);

  const handleStart = () => {
    setIsStarted(true);
    setCurrentIndex(0);
    setTimeLeft(5.0);
    setScore(0);
    setCompleted(false);
    setLastFeedback(null);
  };

  const handleAnswer = (userChoseYes: boolean, isTimeout = false) => {
    if (!isStarted || completed) return;

    const currentWord = DEMO_WORDS[currentIndex];
    const explanation = locale === 'ru' ? currentWord.explanationRu : currentWord.explanationEn;
    const isCorrect = !isTimeout && userChoseYes === currentWord.isReal;

    if (isCorrect) {
      if (soundEnabled) sound.playSuccessChime();
      setScore((s) => s + 1);
      setLastFeedback({ isCorrect: true, text: `${t.correctPrefix} ${explanation}` });
    } else {
      if (soundEnabled) sound.playErrorBuzz();
      setLastFeedback({
        isCorrect: false,
        text: isTimeout ? `${t.timeoutPrefix} ${explanation}` : `${t.errorPrefix} ${explanation}`,
      });
    }

    if (currentIndex + 1 < DEMO_WORDS.length) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(5.0);
    } else {
      setCompleted(true);
    }
  };

  const restart = () => {
    setIsStarted(false);
    setCurrentIndex(0);
    setTimeLeft(5.0);
    setScore(0);
    setCompleted(false);
    setLastFeedback(null);
  };

  const current = DEMO_WORDS[currentIndex];
  const progressPercent = ((5.0 - timeLeft) / 5.0) * 100;

  return (
    <section className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="bg-[#111315] text-white rounded-3xl p-6 sm:p-10 border border-neutral-800 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D2F544]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PillBadge variant="lime" prefixHash>
                Mini Trainer
              </PillBadge>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              {t.title}
            </h3>
          </div>
          <div className="text-xs text-neutral-400 max-w-xs">
            {t.subtitle}
          </div>
        </div>

        {!isStarted ? (
          /* Start Screen: Mini-trainer does NOT start automatically */
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#D2F544]/15 border border-[#D2F544]/30 flex items-center justify-center mx-auto text-[#D2F544]">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <h4 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
                {t.startTitle}
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {t.startDesc}
              </p>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-neutral-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700">
                <Clock className="w-3.5 h-3.5 text-[#D2F544]" /> {t.secPerWord}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> {t.demoWordsBadge}
              </span>
            </div>

            <div className="pt-4">
              <button
                onClick={handleStart}
                className="bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] px-8 py-4 rounded-2xl font-black text-base sm:text-lg inline-flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-[#D2F544]/20 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                {t.startBtn}
              </button>
            </div>
          </div>
        ) : !completed ? (
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span>{t.wordProgress} {currentIndex + 1} / {DEMO_WORDS.length}</span>
              <span className="font-mono text-[#D2F544] font-bold">{timeLeft.toFixed(1)}s</span>
            </div>

            {/* Timer Progress Bar */}
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-[#D2F544] transition-all duration-100 ease-linear"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>

            {/* Big Target Word */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 sm:p-12 text-center mb-8">
              <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold block mb-2">
                {t.realOrFake}
              </span>
              <div className="text-4xl sm:text-6xl font-black text-white tracking-wide">
                {current?.word}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer(true)}
                className="bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
              >
                <Check className="w-5 h-5" />
                {t.realWord}
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border border-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5 text-red-400" />
                {t.fakeWord}
              </button>
            </div>

            {lastFeedback && (
              <div className={`mt-4 p-3 rounded-xl text-xs font-medium text-center ${
                lastFeedback.isCorrect ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-red-950/60 text-red-300 border border-red-800'
              }`}>
                {lastFeedback.text}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#D2F544]/20 border border-[#D2F544] flex items-center justify-center mx-auto text-[#D2F544]">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-black uppercase text-white">{t.completed}</h4>
              <p className="text-sm text-neutral-400">
                {t.score}: <strong className="text-[#D2F544] text-lg">{score} / {DEMO_WORDS.length}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/test">
                <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                  {t.tryFull}
                </Button>
              </Link>
              <button
                onClick={restart}
                className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white px-4 py-3 rounded-full border border-neutral-700 hover:border-neutral-500 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t.retry}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
