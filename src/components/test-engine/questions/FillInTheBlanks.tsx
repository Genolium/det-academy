'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fillBlanksBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

interface FillInTheBlanksProps {
  onComplete: () => void;
}

export const FillInTheBlanks: React.FC<FillInTheBlanksProps> = ({ onComplete }) => {
  const { recordFillBlanksResult } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const [pool] = useState(() => fillBlanksBank);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [inputVal, setInputVal] = useState('');
  const [correctCount, setCorrectCount] = useState(0);

  const currentItem = pool[index];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setInputVal('');
    setTimeLeft(20);
  }, [index]);

  const handleSubmit = () => {
    const isCorrect = inputVal.trim().toLowerCase() === currentItem.missingLetters.toLowerCase();

    if (isCorrect) {
      if (soundEnabled) sound.playSuccessChime();
      setCorrectCount((c) => c + 1);
    } else {
      if (soundEnabled) sound.playErrorBuzz();
    }

    if (index + 1 < pool.length) {
      setIndex((i) => i + 1);
    } else {
      recordFillBlanksResult(correctCount + (isCorrect ? 1 : 0), pool.length);
      onComplete();
    }
  };

  // 20s timer per item
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [index, inputVal]);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Timer Bar */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span>{t.sentenceStep} {index + 1} / {pool.length}</span>
        <span className="text-[#D2F544] font-bold text-sm">{timeLeft}s</span>
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 20) * 100}%` }}
        />
      </div>

      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-8">
        <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-6">
          Fill in the missing letters to complete the sentence:
        </h3>

        <div className="text-xl sm:text-2xl leading-relaxed text-neutral-200">
          <span>{currentItem.sentenceBefore}</span>

          {/* Inline input container */}
          <span className="inline-flex items-center align-baseline bg-neutral-900 border-2 border-[#D2F544] rounded-xl px-2 py-1 mx-1 font-mono">
            <span className="text-[#D2F544] font-bold mr-0.5">{currentItem.givenPrefix}</span>
            <input
              ref={inputRef}
              type="text"
              maxLength={currentItem.missingLetters.length}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder={'_'.repeat(currentItem.missingLetters.length)}
              className="bg-transparent text-white font-bold outline-none font-mono tracking-widest"
              style={{ width: `${currentItem.missingLetters.length * 14}px` }}
            />
          </span>

          <span>{currentItem.sentenceAfter}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSubmit} icon={<ArrowRight className="w-4 h-4" />}>
          {t.nextBtn}
        </Button>
      </div>
    </div>
  );
};
