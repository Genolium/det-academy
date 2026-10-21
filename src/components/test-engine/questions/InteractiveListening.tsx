'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { submitOrQueueResponse } from '@/lib/response-outbox';
import { translations } from '@/lib/translations';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/Button';
import { Volume2, ArrowRight, Clock } from 'lucide-react';

interface InteractiveListeningProps {
  onComplete: () => void;
}

interface ListeningTurn {
  speaker: string;
  speakerAudioText: string;
  options: string[];
}

export const InteractiveListening: React.FC<InteractiveListeningProps> = ({ onComplete }) => {
  const { serverQuestions, backendSessionId } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const block = useMemo(() => {
    const question = serverQuestions.find((item) => item.type === 'INTERACTIVE_LISTENING');
    if (!question) return null;
    const payload = question.contentPayload as {
      scenario?: string;
      summaryPrompt?: string;
      turns?: Array<{
        speaker?: string;
        speakerAudioText?: string;
        options?: string[];
      }>;
    };
    return {
      id: question.id,
      scenario: payload.scenario || '',
      summaryPrompt: payload.summaryPrompt || '',
      turns: (payload.turns || []).map<ListeningTurn>((turn) => ({
        speaker: turn.speaker || 'Speaker',
        speakerAudioText: turn.speakerAudioText || '',
        options: turn.options || [],
      })),
      timeLimitSec: question.timeLimitSec || 240,
    };
  }, [serverQuestions]);

  const [phase, setPhase] = useState<'DIALOG' | 'SUMMARY'>('DIALOG');
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [selectedResponses, setSelectedResponses] = useState<number[]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [timeLeft, setTimeLeft] = useState(block?.timeLimitSec || 240);
  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

  const currentTurn = block?.turns[currentTurnIdx];

  useEffect(() => {
    if (!block) return;
    setTimeLeft(block.timeLimitSec);
    startedAtRef.current = Date.now();
  }, [block?.id, block?.timeLimitSec]);

  useEffect(() => {
    if (phase === 'DIALOG' && currentTurn?.speakerAudioText) {
      sound.speakEnglish(currentTurn.speakerAudioText);
    }
  }, [phase, currentTurnIdx, currentTurn?.speakerAudioText]);

  const submit = () => {
    if (submittedRef.current || !block) return;
    submittedRef.current = true;
    if (backendSessionId) {
      void submitOrQueueResponse(backendSessionId, {
        questionId: block.id,
        userResponse: { turns: selectedResponses, summary: summaryText },
        rawScore: 0,
        timeSpentSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      });
    }
    onComplete();
  };

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    if (!block) return;
    const deadline = Date.now() + block.timeLimitSec * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        submitRef.current();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [block?.id, block?.timeLimitSec]);

  if (!block) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Сервер не выдал задание Interactive Listening</h2>
        <p className="text-sm text-neutral-400">
          Этап нельзя начать без серверного вопроса. Обновите страницу или перезапустите попытку.
        </p>
      </div>
    );
  }

  const handleSelectTurnOption = (optionIndex: number) => {
    const updated = [...selectedResponses, optionIndex];
    setSelectedResponses(updated);

    if (currentTurnIdx + 1 < block.turns.length) {
      setCurrentTurnIdx((index) => index + 1);
    } else {
      setPhase('SUMMARY');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-6 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">Interactive Listening</span>
        <div className="flex items-center gap-3">
          <span className="bg-neutral-800 text-[#D2F544] px-3 py-1 rounded-full font-bold">
            {phase === 'DIALOG' ? t.chooseTurnHint : t.listeningSummaryTimer}
          </span>
          <span className="flex items-center gap-1.5 text-[#D2F544] font-bold">
            <Clock className="w-4 h-4" />
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
      </div>

      {phase === 'DIALOG' && currentTurn && (
        <div className="space-y-6">
          <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 text-xs text-neutral-300">
            <strong className="text-[#D2F544] block mb-1 uppercase font-bold">
              {t.scenarioLabel}:
            </strong>
            {block.scenario}
          </div>

          <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 text-white flex items-center gap-4">
            <button
              onClick={() => sound.speakEnglish(currentTurn.speakerAudioText)}
              className="w-14 h-14 rounded-2xl bg-[#D2F544] text-[#0C2418] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
              aria-label="Повторить реплику"
            >
              <Volume2 className="w-7 h-7" />
            </button>
            <div>
              <span className="text-xs text-[#D2F544] font-bold uppercase block">
                {currentTurn.speaker}
              </span>
              <p className="text-sm font-medium italic text-neutral-200">
                &ldquo;{currentTurn.speakerAudioText}&rdquo;
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs text-neutral-400 font-bold uppercase block">
              {t.chooseTurnHint} ({currentTurnIdx + 1} / {block.turns.length}):
            </span>
            {currentTurn.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectTurnOption(index)}
                className="w-full text-left p-4 rounded-2xl bg-white hover:bg-[#D2F544] hover:text-[#0C2418] text-[#0E1012] font-semibold text-sm border border-neutral-200 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 text-sm text-neutral-200">
            <strong className="text-[#D2F544] block mb-2 uppercase font-bold text-xs">
              {t.summaryHeading}
            </strong>
            {block.summaryPrompt}
          </div>
          <textarea
            rows={6}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            autoCorrect="off"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            placeholder="Summarize the conversation in 2–3 sentences..."
            className="w-full bg-neutral-950 border border-neutral-700 rounded-2xl p-4 text-base text-white focus:outline-none focus:border-[#D2F544] leading-relaxed"
          />
          <div className="flex justify-end">
            <Button variant="primary" onClick={submit} icon={<ArrowRight className="w-4 h-4" />}>
              {t.submitBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
