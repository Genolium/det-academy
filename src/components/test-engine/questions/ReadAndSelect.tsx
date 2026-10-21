'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { submitOrQueueResponse } from '@/lib/response-outbox';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { Check, X } from 'lucide-react';

interface ReadAndSelectProps {
  onComplete: () => void;
}

export const ReadAndSelect: React.FC<ReadAndSelectProps> = ({ onComplete }) => {
  const { serverQuestions, backendSessionId } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const pool = useMemo(
    () =>
      serverQuestions
        .filter((question) => question.type === 'READ_SELECT')
        .map((question) => ({
          id: question.id,
          word: String((question.contentPayload as { word?: unknown }).word || ''),
          timeLimitSec: question.timeLimitSec || 5,
        }))
        .filter((item) => item.word.length > 0),
    [serverQuestions]
  );

  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pool[0]?.timeLimitSec || 5);
  const isHandlingAnswer = useRef(false);
  const startedAtRef = useRef(Date.now());

  const currentItem = pool[index];

  useEffect(() => {
    setTimeLeft(currentItem?.timeLimitSec || 5);
    startedAtRef.current = Date.now();
  }, [index, currentItem?.timeLimitSec]);

  const handleChoice = (choseYes: boolean) => {
    if (isHandlingAnswer.current || !currentItem) return;
    isHandlingAnswer.current = true;

    if (backendSessionId) {
      void submitOrQueueResponse(backendSessionId, {
        questionId: currentItem.id,
        userResponse: { isReal: choseYes },
        rawScore: 0,
        timeSpentSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      });
    }

    if (soundEnabled) {
      // Correctness is graded server-side. Keep a neutral click sound.
      sound.playSuccessChime();
    }

    if (index + 1 < pool.length) {
      setIndex((i) => i + 1);
      isHandlingAnswer.current = false;
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y' || e.key === 'ArrowLeft') {
        handleChoice(true);
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') {
        handleChoice(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    const limit = currentItem?.timeLimitSec || 5;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleChoice(false); // timeout is a skipped answer, not a free pass
          return limit;
        }
        return Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [index, currentItem?.timeLimitSec]);

  if (pool.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Сервер не выдал задания Read & Select</h2>
        <p className="text-sm text-neutral-400">
          Этап нельзя начать без серверных вопросов. Обновите страницу или перезапустите попытку.
        </p>
      </div>
    );
  }

  const limit = currentItem?.timeLimitSec || 5;
  const progressPercent = ((limit - timeLeft) / limit) * 100;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span>
          {t.wordStep} {index + 1} / {pool.length}
        </span>
        <span className="text-[#D2F544] font-bold">{timeLeft.toFixed(1)}s</span>
      </div>
      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-100 ease-linear"
          style={{ width: `${100 - progressPercent}%` }}
        />
      </div>

      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-12 text-center mb-8 shadow-2xl">
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold block mb-4">
          Is this an actual English word?
        </span>
        <div className="text-4xl sm:text-6xl font-black text-white tracking-wide">
          {currentItem?.word}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleChoice(true)}
          className="bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
        >
          <Check className="w-6 h-6" /> {t.yesKey}
        </button>
        <button
          onClick={() => handleChoice(false)}
          className="bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border border-neutral-700 cursor-pointer"
        >
          <X className="w-6 h-6 text-red-400" /> {t.noKey}
        </button>
      </div>

      <div className="text-center text-xs text-neutral-400 mt-6">{t.hotkeysHint}</div>

      <div className="mt-6 text-center">
        <button
          onClick={onComplete}
          className="text-[11px] text-neutral-500 hover:text-neutral-300 underline"
        >
          Пропустить оставшиеся слова
        </button>
      </div>
    </div>
  );
};
