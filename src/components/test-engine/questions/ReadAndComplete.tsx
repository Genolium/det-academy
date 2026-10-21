'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { submitOrQueueResponse } from '@/lib/response-outbox';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock } from 'lucide-react';

interface ReadAndCompleteProps {
  onComplete: () => void;
}

interface ServerCTest {
  id: string;
  title: string;
  firstSentence: string;
  lastSentence: string;
  tokens: { prefix: string; missingLength: number }[];
  timeLimitSec: number;
}

export const ReadAndComplete: React.FC<ReadAndCompleteProps> = ({ onComplete }) => {
  const { serverQuestions, backendSessionId } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const cTestItem = useMemo<ServerCTest | null>(() => {
    const question = serverQuestions.find((item) => item.type === 'C_TEST');
    if (!question) return null;
    const payload = question.contentPayload as {
      title?: string;
      firstSentence?: string;
      lastSentence?: string;
      damagedTokens?: Array<{ prefix?: string; missingLength?: number }>;
    };
    return {
      id: question.id,
      title: payload.title || 'Read and Complete',
      firstSentence: payload.firstSentence || '',
      lastSentence: payload.lastSentence || '',
      tokens: (payload.damagedTokens || []).map((token) => ({
        prefix: token.prefix || '',
        missingLength: Math.max(1, Number(token.missingLength || 1)),
      })),
      timeLimitSec: question.timeLimitSec || 180,
    };
  }, [serverQuestions]);

  const [inputs, setInputs] = useState<string[]>(() =>
    new Array(cTestItem?.tokens.length || 0).fill('')
  );
  const [timeLeft, setTimeLeft] = useState(cTestItem?.timeLimitSec || 180);
  const startedAtRef = useRef(Date.now());
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputsRef = useRef(inputs);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  useEffect(() => {
    setTimeLeft(cTestItem?.timeLimitSec || 180);
    startedAtRef.current = Date.now();
  }, [cTestItem?.id, cTestItem?.timeLimitSec]);

  const handleSubmit = () => {
    if (isSubmittedRef.current || !cTestItem) return;
    isSubmittedRef.current = true;

    if (backendSessionId) {
      void submitOrQueueResponse(backendSessionId, {
        questionId: cTestItem.id,
        userResponse: inputsRef.current.map((value) => value.trim()),
        rawScore: 0,
        timeSpentSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      });
    }

    if (soundEnabled) sound.playSuccessChime();
    onComplete();
  };

  useEffect(() => {
    if (!cTestItem) return;
    const deadline = Date.now() + (cTestItem.timeLimitSec || 180) * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 250);

    return () => clearInterval(timer);
  }, [cTestItem?.id, cTestItem?.timeLimitSec]);

  if (!cTestItem) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Сервер не выдал задание C-Test</h2>
        <p className="text-sm text-neutral-400">
          Этап нельзя начать без серверного вопроса. Обновите страницу или перезапустите попытку.
        </p>
      </div>
    );
  }

  const handleInputChange = (idx: number, val: string) => {
    const targetLength = cTestItem.tokens[idx].missingLength;
    const newInputs = [...inputs];
    newInputs[idx] = val;
    setInputs(newInputs);

    if (val.length === targetLength && idx + 1 < cTestItem.tokens.length) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const limit = cTestItem.timeLimitSec || 180;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">
          Read and Complete (C-Test)
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
          style={{ width: `${(timeLeft / limit) * 100}%` }}
        />
      </div>

      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-8">
        <h3 className="text-xl font-black uppercase text-[#D2F544] mb-6">{cTestItem.title}</h3>

        <div className="text-lg leading-loose text-neutral-200">
          <p className="mb-4">{cTestItem.firstSentence}</p>

          <p className="inline">
            {cTestItem.tokens.map((token, idx) => (
              <span key={idx} className="inline-block whitespace-nowrap mx-1">
                <span className="font-semibold text-neutral-300">{token.prefix}</span>
                <input
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  maxLength={token.missingLength}
                  value={inputs[idx]}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  className="bg-neutral-900 border-b-2 border-[#D2F544] text-[#D2F544] font-bold px-1 py-0.5 text-center outline-none font-mono tracking-widest text-base"
                  style={{ width: `${Math.max(32, token.missingLength * 16)}px` }}
                />
              </span>
            ))}
          </p>

          {cTestItem.lastSentence && <p className="mt-4">{cTestItem.lastSentence}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {t.submitBtn}
        </Button>
      </div>
    </div>
  );
};
