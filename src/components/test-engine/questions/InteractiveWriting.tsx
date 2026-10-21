'use client';

import React, { useState, useEffect, useRef } from 'react';
import { interactiveWritingBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock, BookOpen, Lock } from 'lucide-react';

interface InteractiveWritingProps {
  onComplete: () => void;
}

export const InteractiveWriting: React.FC<InteractiveWritingProps> = ({ onComplete }) => {
  const { recordInteractiveWritingResult, backendSessionId, serverQuestions } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const serverQ = serverQuestions.find((q) => q.type === 'INTERACTIVE_WRITING');
  const serverPayload = (serverQ?.contentPayload || {}) as {
    part1Prompt?: string;
    part2Prompt?: string;
  };
  const q = {
    part1Prompt: serverPayload.part1Prompt || interactiveWritingBank[0].part1Prompt,
    part2Prompt: serverPayload.part2Prompt || interactiveWritingBank[0].part2Prompt,
  };

  // Part 1: 5 mins (300s), Part 2: 3 mins (180s)
  const [part, setPart] = useState<1 | 2>(1);
  const [part1Text, setPart1Text] = useState('');
  const [part2Text, setPart2Text] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  const part1Ref = useRef(part1Text);
  const part2Ref = useRef(part2Text);
  useEffect(() => {
    part1Ref.current = part1Text;
  }, [part1Text]);
  useEffect(() => {
    part2Ref.current = part2Text;
  }, [part2Text]);
  const isPartAdvancingRef = useRef(false);

  const handleNext = () => {
    if (isPartAdvancingRef.current) return;
    if (part === 1) {
      setPart(2);
      setTimeLeft(180);
    } else {
      isPartAdvancingRef.current = true;
      const finalP1 = part1Ref.current;
      const finalP2 = part2Ref.current;

      if (backendSessionId && serverQ) {
        api.submitQuestionResponse(backendSessionId, {
          questionId: serverQ.id,
          userResponse: { part1: finalP1, part2: finalP2 },
          rawScore: 0,
          timeSpentSec: Math.max(1, 480 - timeLeft),
        }).catch(() => {});
      }

      recordInteractiveWritingResult(finalP1, finalP2);
      onComplete();
    }
  };

  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    const duration = part === 1 ? 300 : 180;
    const deadline = Date.now() + duration * 1000;
    setTimeLeft(duration);

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleNextRef.current();
      }
    }, 250);

    return () => clearInterval(timer);
  }, [part]);

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
            autoCorrect="off"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
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
