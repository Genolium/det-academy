'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cTestBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock } from 'lucide-react';

interface ReadAndCompleteProps {
  onComplete: () => void;
}

export const ReadAndComplete: React.FC<ReadAndCompleteProps> = ({ onComplete }) => {
  const { recordCTestResult } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const cTestItem = cTestBank[0];
  const [inputs, setInputs] = useState<string[]>(() =>
    new Array(cTestItem.damagedTokens.length).fill('')
  );
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180s

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 3 minute timer
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
  }, [inputs]);

  const handleInputChange = (idx: number, val: string) => {
    const targetLength = cTestItem.damagedTokens[idx].missing.length;
    const newInputs = [...inputs];
    newInputs[idx] = val;
    setInputs(newInputs);

    // Auto-advance to next input field when current field is full
    if (val.length === targetLength && idx + 1 < cTestItem.damagedTokens.length) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleSubmit = () => {
    let correct = 0;
    cTestItem.damagedTokens.forEach((token, idx) => {
      if (inputs[idx].trim().toLowerCase() === token.missing.toLowerCase()) {
        correct++;
      }
    });

    if (soundEnabled) {
      if (correct > cTestItem.damagedTokens.length / 2) sound.playSuccessChime();
    }

    recordCTestResult(correct, cTestItem.damagedTokens.length);
    onComplete();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header with 3 minute countdown */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">Read and Complete (C-Test)</span>
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
          style={{ width: `${(timeLeft / 180) * 100}%` }}
        />
      </div>

      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-8">
        <h3 className="text-xl font-black uppercase text-[#D2F544] mb-6">
          {cTestItem.title}
        </h3>

        <div className="text-lg leading-loose text-neutral-200">
          <p className="mb-4">{cTestItem.firstSentence}</p>

          <p className="inline">
            {cTestItem.damagedTokens.map((token, idx) => (
              <span key={idx} className="inline-block whitespace-nowrap mx-1">
                <span className="font-semibold text-neutral-300">{token.prefix}</span>
                <input
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  maxLength={token.missing.length}
                  value={inputs[idx]}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  className="bg-neutral-900 border-b-2 border-[#D2F544] text-[#D2F544] font-bold px-1 py-0.5 text-center outline-none font-mono tracking-widest text-base"
                  style={{ width: `${Math.max(28, token.missing.length * 14)}px` }}
                />
                {token.suffix && <span className="text-neutral-300 ml-1">{token.suffix}</span>}
              </span>
            ))}
          </p>

          <p className="mt-4">{cTestItem.lastSentence}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSubmit} icon={<ArrowRight className="w-4 h-4" />}>
          {t.submitBtn}
        </Button>
      </div>
    </div>
  );
};
