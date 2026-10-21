'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { submitOrQueueResponse } from '@/lib/response-outbox';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

interface FillInTheBlanksProps {
  onComplete: () => void;
}

interface ServerFillBlank {
  id: string;
  sentenceBefore: string;
  givenPrefix: string;
  sentenceAfter: string;
  missingLength: number;
  timeLimitSec: number;
}

export const FillInTheBlanks: React.FC<FillInTheBlanksProps> = ({ onComplete }) => {
  const { serverQuestions, backendSessionId } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const pool = useMemo<ServerFillBlank[]>(
    () =>
      serverQuestions
        .filter((question) => question.type === 'FILL_BLANKS')
        .map((question) => {
          const payload = question.contentPayload as {
            sentenceBefore?: string;
            givenPrefix?: string;
            sentenceAfter?: string;
            totalLength?: number;
          };
          const prefix = payload.givenPrefix || '';
          const totalLength = Number(payload.totalLength || 0);
          return {
            id: question.id,
            sentenceBefore: payload.sentenceBefore || '',
            givenPrefix: prefix,
            sentenceAfter: payload.sentenceAfter || '',
            missingLength: Math.max(1, totalLength - prefix.length || 4),
            timeLimitSec: question.timeLimitSec || 20,
          };
        })
        .filter((item) => item.sentenceBefore || item.sentenceAfter),
    [serverQuestions]
  );

  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pool[0]?.timeLimitSec || 20);
  const [inputVal, setInputVal] = useState('');
  const startedAtRef = useRef(Date.now());
  const isSubmittingRef = useRef(false);
  const inputValRef = useRef(inputVal);

  const currentItem = pool[index];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputValRef.current = inputVal;
  }, [inputVal]);

  useEffect(() => {
    inputRef.current?.focus();
    setInputVal('');
    setTimeLeft(currentItem?.timeLimitSec || 20);
    startedAtRef.current = Date.now();
    isSubmittingRef.current = false;
  }, [index, currentItem?.timeLimitSec]);

  const handleSubmit = () => {
    if (isSubmittingRef.current || !currentItem) return;
    isSubmittingRef.current = true;

    if (backendSessionId) {
      void submitOrQueueResponse(backendSessionId, {
        questionId: currentItem.id,
        userResponse: { answer: inputValRef.current.trim() },
        rawScore: 0,
        timeSpentSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      });
    }

    if (soundEnabled) sound.playSuccessChime();

    if (index + 1 < pool.length) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    if (!currentItem) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [index, currentItem?.timeLimitSec]);

  if (pool.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Сервер не выдал задания Fill in the Blanks</h2>
        <p className="text-sm text-neutral-400">
          Этап нельзя начать без серверных вопросов. Обновите страницу или перезапустите попытку.
        </p>
      </div>
    );
  }

  const limit = currentItem?.timeLimitSec || 20;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span>
          {t.sentenceStep} {index + 1} / {pool.length}
        </span>
        <span className="text-[#D2F544] font-bold text-sm">{timeLeft}s</span>
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / limit) * 100}%` }}
        />
      </div>

      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-8">
        <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-6">
          Fill in the missing letters to complete the sentence:
        </h3>

        <div className="text-xl sm:text-2xl leading-relaxed text-neutral-200">
          <span>{currentItem.sentenceBefore}</span>

          <span className="inline-flex items-center align-baseline bg-neutral-900 border-2 border-[#D2F544] rounded-xl px-2 py-1 mx-1 font-mono">
            <span className="text-[#D2F544] font-bold mr-0.5">{currentItem.givenPrefix}</span>
            <input
              ref={inputRef}
              type="text"
              maxLength={currentItem.missingLength}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder={'_'.repeat(currentItem.missingLength)}
              autoCorrect="off"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="next"
              className="bg-transparent text-white font-bold outline-none font-mono tracking-widest text-base"
              style={{ width: `${Math.max(64, currentItem.missingLength * 16)}px` }}
            />
          </span>

          <span>{currentItem.sentenceAfter}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {t.nextBtn}
        </Button>
      </div>
    </div>
  );
};
