'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { submitOrQueueResponse } from '@/lib/response-outbox';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { Volume2, ArrowRight, Clock } from 'lucide-react';

interface ListenAndTypeProps {
  onComplete: () => void;
}

export const ListenAndType: React.FC<ListenAndTypeProps> = ({ onComplete }) => {
  const { serverQuestions, backendSessionId } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const items = useMemo(() => {
    const questions = serverQuestions.filter((item) => item.type === 'LISTEN_TYPE');
    const perItemLimit = Math.max(
      30,
      Math.floor((questions[0]?.timeLimitSec || 60) / Math.max(1, questions.length))
    );
    return questions
      .map((question) => {
        const payload = question.contentPayload as {
          audioSentence?: string;
          playsAllowed?: number;
        };
        return {
          id: question.id,
          audioSentence: payload.audioSentence || '',
          playsAllowed: Math.max(1, Number(payload.playsAllowed || 3)),
          timeLimitSec: questions.length > 1 ? perItemLimit : question.timeLimitSec || 60,
        };
      })
      .filter((item) => item.audioSentence);
  }, [serverQuestions]);

  const [itemIndex, setItemIndex] = useState(0);
  const currentItem = items[itemIndex] || null;
  const [typedText, setTypedText] = useState('');
  const [playCount, setPlayCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentItem?.timeLimitSec || 60);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const startedAtRef = useRef(Date.now());
  const typedRef = useRef(typedText);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    typedRef.current = typedText;
  }, [typedText]);

  useEffect(() => {
    setTypedText('');
    setPlayCount(0);
    setIsPlayingAudio(false);
    setTimeLeft(currentItem?.timeLimitSec || 60);
    startedAtRef.current = Date.now();
    isSubmittedRef.current = false;
  }, [currentItem?.id, currentItem?.timeLimitSec]);

  const playAudio = useCallback(() => {
    if (!currentItem || playCount >= currentItem.playsAllowed || isPlayingAudio) return;
    setIsPlayingAudio(true);
    setPlayCount((p) => p + 1);
    sound.speakEnglish(currentItem.audioSentence, () => setIsPlayingAudio(false));
  }, [currentItem, isPlayingAudio, playCount]);

  const playAudioRef = useRef(playAudio);
  useEffect(() => {
    playAudioRef.current = playAudio;
  }, [playAudio]);

  const autoPlayedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentItem || autoPlayedRef.current === currentItem.id) return;
    autoPlayedRef.current = currentItem.id;
    const autoPlay = setTimeout(() => playAudioRef.current(), 1000);
    return () => clearTimeout(autoPlay);
  }, [currentItem?.id]);

  const handleSubmit = useCallback(() => {
    if (isSubmittedRef.current || !currentItem) return;
    isSubmittedRef.current = true;

    if (backendSessionId) {
      void submitOrQueueResponse(backendSessionId, {
        questionId: currentItem.id,
        userResponse: typedRef.current.trim(),
        rawScore: 0,
        timeSpentSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      });
    }

    if (soundEnabled) sound.playSuccessChime();
    if (itemIndex + 1 < items.length) {
      setItemIndex((index) => index + 1);
      return;
    }
    onComplete();
  }, [backendSessionId, currentItem, itemIndex, items.length, onComplete, soundEnabled]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (!currentItem) return;
    const deadline = Date.now() + (currentItem.timeLimitSec || 60) * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmitRef.current();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [currentItem]);

  if (!currentItem) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Сервер не выдал задание Listen and Type</h2>
        <p className="text-sm text-neutral-400">
          Этап нельзя начать без серверного вопроса. Обновите страницу или перезапустите попытку.
        </p>
      </div>
    );
  }

  const limit = currentItem.timeLimitSec || 60;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">
          Listen and Type (Dictation) • {itemIndex + 1} / {items.length}
        </span>
        <div className="flex items-center gap-1.5 text-[#D2F544] font-bold text-sm bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / limit) * 100}%` }}
        />
      </div>

      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-8 text-center">
        <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-6">
          Type the statement that you hear into the box below.
        </h3>

        <div className="mb-8">
          <button
            onClick={playAudio}
            disabled={playCount >= currentItem.playsAllowed || isPlayingAudio}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto transition-all ${
              playCount < currentItem.playsAllowed && !isPlayingAudio
                ? 'bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] shadow-lg hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Volume2 className="w-8 h-8 mb-1" />
            <span className="text-[11px] font-black uppercase">
              {isPlayingAudio
                ? t.playingAudio
                : `${t.playsRemaining} (${currentItem.playsAllowed - playCount}/${currentItem.playsAllowed})`}
            </span>
          </button>
        </div>

        <label htmlFor="listen-type-answer" className="sr-only">
          Type the statement that you hear
        </label>
        <textarea
          id="listen-type-answer"
          rows={3}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          autoCorrect="off"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-neutral-950 border border-neutral-700 rounded-2xl p-4 text-base text-white focus:outline-none focus:border-[#D2F544] font-mono"
          placeholder="Type exactly what you hear..."
        />

        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs font-semibold text-neutral-400 hover:text-white">
            Показать транскрипт (для доступности)
          </summary>
          <p className="mt-2 rounded-xl border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-200">
            {currentItem.audioSentence}
          </p>
        </details>
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
