'use client';

import React, { useState, useEffect } from 'react';
import { writingSampleBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock, Award } from 'lucide-react';

interface WritingSampleProps {
  onComplete: () => void;
}

export const WritingSample: React.FC<WritingSampleProps> = ({ onComplete }) => {
  const { recordWritingSampleResult } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const q = writingSampleBank[0];

  const [essayText, setEssayText] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300s

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [essayText]);

  const handleSubmit = () => {
    recordWritingSampleResult(essayText);
    onComplete();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">
          Writing Sample (Graded Essay • 5 Minutes)
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
          style={{ width: `${(timeLeft / 300) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        {/* Essay Prompt Card */}
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-[#D2F544]" />
            <span className="text-xs text-[#D2F544] font-bold uppercase tracking-wider">
              {t.writingSampleTheme}
            </span>
          </div>
          <p className="text-base sm:text-lg leading-relaxed text-neutral-200">
            {q.prompt}
          </p>
        </div>

        {/* Essay Input area */}
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{t.oreoHint}</span>
            <span className={wordCount >= 100 ? 'text-emerald-400 font-bold' : 'text-neutral-300'}>
              {t.wordsCounter}: <strong className="font-mono text-base">{wordCount}</strong> / 100+
            </span>
          </div>

          <textarea
            rows={10}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Write your academic essay here..."
            className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-[#D2F544] rounded-2xl p-4 text-white text-sm outline-none leading-relaxed"
            autoFocus
          />

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="lg" onClick={handleSubmit} icon={<ArrowRight className="w-4 h-4" />}>
              {t.finishSampleBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
