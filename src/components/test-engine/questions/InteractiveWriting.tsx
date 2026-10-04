'use client';

import React, { useState, useEffect } from 'react';
import { interactiveWritingBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock, BookOpen, Lock } from 'lucide-react';

interface InteractiveWritingProps {
  onComplete: () => void;
}

export const InteractiveWriting: React.FC<InteractiveWritingProps> = ({ onComplete }) => {
  const { recordInteractiveWritingResult } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const q = interactiveWritingBank[0];

  // Part 1: 5 mins (300s), Part 2: 3 mins (180s)
  const [part, setPart] = useState<1 | 2>(1);
  const [part1Text, setPart1Text] = useState('');
  const [part2Text, setPart2Text] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (part === 2) {
      setTimeLeft(180);
    }
  }, [part]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [part, part1Text, part2Text]);

  const handleNext = () => {
    if (part === 1) {
      setPart(2);
    } else {
      recordInteractiveWritingResult(part1Text, part2Text);
      onComplete();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentWordCount = (part === 1 ? part1Text : part2Text).trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">
          Interactive Writing • {t.writingPartStep} {part} / 2
        </span>
        <div className="flex items-center gap-1.5 text-[#D2F544] font-bold text-sm bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
          <Clock className="w-4 h-4" />
          <span>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / (part === 1 ? 300 : 180)) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        {/* Prompt Card */}
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <span className="text-xs text-[#D2F544] font-bold uppercase tracking-wider block mb-2">
            {part === 1 ? 'Prompt 1 (5 Minutes)' : 'Follow-up Prompt (3 Minutes)'}
          </span>
          <p className="text-base sm:text-lg leading-relaxed text-neutral-200">
            {part === 1 ? q.part1Prompt : q.part2Prompt}
          </p>
        </div>

        {/* In Part 2: Read-only preview of Part 1 */}
        {part === 2 && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 text-neutral-400 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-neutral-300 mb-2">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{t.part1Reference}:</span>
            </div>
            <p className="leading-relaxed italic">{part1Text || t.emptyTextNotice}</p>
          </div>
        )}

        {/* Text Input area */}
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{t.typeResponseHint}:</span>
            <span>
              {t.writingWordCount}: <strong className="text-white font-mono">{currentWordCount}</strong>
            </span>
          </div>

          <textarea
            rows={8}
            value={part === 1 ? part1Text : part2Text}
            onChange={(e) => (part === 1 ? setPart1Text(e.target.value) : setPart2Text(e.target.value))}
            placeholder="Structure your answer with topic sentences, explanations, and real-life examples..."
            className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-[#D2F544] rounded-2xl p-4 text-white text-sm outline-none leading-relaxed"
            autoFocus
          />

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="lg" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              {part === 1 ? t.advanceToFollowUpBtn : t.finishWritingBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
