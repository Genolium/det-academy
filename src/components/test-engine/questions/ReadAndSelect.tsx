'use client';

import React, { useEffect, useState, useRef } from 'react';
import { readSelectBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { Check, X } from 'lucide-react';

interface ReadAndSelectProps {
  onComplete: () => void;
}

export const ReadAndSelect: React.FC<ReadAndSelectProps> = ({ onComplete }) => {
  const { recordReadSelectResult } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const [pool] = useState(() => [...readSelectBank].sort(() => 0.5 - Math.random()).slice(0, 15));
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [correctCount, setCorrectCount] = useState(0);
  const isHandlingAnswer = useRef(false);

  const currentItem = pool[index];

  const handleChoice = (choseYes: boolean) => {
    if (isHandlingAnswer.current) return;
    isHandlingAnswer.current = true;

    const isCorrect = choseYes === currentItem.isReal;
    if (isCorrect) {
      if (soundEnabled) sound.playSuccessChime();
      setCorrectCount((c) => c + 1);
    } else {
      if (soundEnabled) sound.playErrorBuzz();
    }

    if (index + 1 < pool.length) {
      setIndex((i) => i + 1);
      setTimeLeft(5.0);
      isHandlingAnswer.current = false;
    } else {
      recordReadSelectResult(correctCount + (isCorrect ? 1 : 0), pool.length);
      onComplete();
    }
  };

  // Keyboard hotkeys Y and N
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

  // 5.0 second countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleChoice(false); // timeout treated as No/pass
          return 5.0;
        }
        return Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [index]);

  const progressPercent = ((5.0 - timeLeft) / 5.0) * 100;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Timer Bar */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span>{t.wordStep} {index + 1} / {pool.length}</span>
        <span className="text-[#D2F544] font-bold">{timeLeft.toFixed(1)}s</span>
      </div>
      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-100 ease-linear"
          style={{ width: `${100 - progressPercent}%` }}
        />
      </div>

      {/* Target Word Card */}
      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-12 text-center mb-8 shadow-2xl">
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold block mb-4">
          Is this an actual English word?
        </span>
        <div className="text-4xl sm:text-6xl font-black text-white tracking-wide">
          {currentItem?.word}
        </div>
      </div>

      {/* Choice Buttons */}
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

      <div className="text-center text-xs text-neutral-400 mt-6">
        {t.hotkeysHint}
      </div>
    </div>
  );
};
