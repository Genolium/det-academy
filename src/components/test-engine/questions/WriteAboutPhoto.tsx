'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { submitOrQueueResponse } from '@/lib/response-outbox';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock } from 'lucide-react';

interface WriteAboutPhotoProps {
  onComplete: () => void;
}

export const WriteAboutPhoto: React.FC<WriteAboutPhotoProps> = ({ onComplete }) => {
  const { serverQuestions, backendSessionId } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const photos = React.useMemo(
    () =>
      serverQuestions
        .filter((question) => question.type === 'WRITE_PHOTO')
        .map((question) => {
          const payload = question.contentPayload as {
            imageUrl?: string;
            altText?: string;
            prompt?: string;
          };
          return {
            id: question.id,
            imageUrl: payload.imageUrl || '',
            altText: payload.altText || 'Write about the photo',
            prompt: payload.prompt || '',
            timeLimitSec: question.timeLimitSec || 60,
          };
        })
        .filter((item) => item.imageUrl),
    [serverQuestions]
  );

  const [photoIndex, setPhotoIndex] = useState(0);
  const [texts, setTexts] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [timeLeft, setTimeLeft] = useState(photos[0]?.timeLimitSec || 60);

  const currentPhoto = photos[photoIndex];

  const currentTextRef = useRef(currentText);
  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);
  const isAdvancingRef = useRef(false);

  const handleNextPhoto = useCallback(() => {
    if (isAdvancingRef.current) return;
    const textToSubmit = currentTextRef.current;
    const updatedTexts = [...texts];
    updatedTexts[photoIndex] = textToSubmit;
    setTexts(updatedTexts);

    if (backendSessionId && currentPhoto) {
      void submitOrQueueResponse(backendSessionId, {
        questionId: currentPhoto.id,
        userResponse: { text: textToSubmit },
        rawScore: 0,
        timeSpentSec: Math.max(1, (currentPhoto.timeLimitSec || 60) - timeLeft),
      });
    }

    if (photoIndex + 1 < photos.length) {
      setPhotoIndex((p) => p + 1);
    } else {
      isAdvancingRef.current = true;
      onComplete();
    }
  }, [backendSessionId, currentPhoto, onComplete, photoIndex, photos.length, texts, timeLeft]);

  const handleNextPhotoRef = useRef(handleNextPhoto);
  useEffect(() => {
    handleNextPhotoRef.current = handleNextPhoto;
  }, [handleNextPhoto]);

  // 60-second deadline-based timer per photo
  useEffect(() => {
    const limit = currentPhoto?.timeLimitSec || 60;
    setTimeLeft(limit);
    setCurrentText('');
    const deadline = Date.now() + limit * 1000;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleNextPhotoRef.current();
      }
    }, 250);

    return () => clearInterval(timer);
  }, [photoIndex, currentPhoto?.timeLimitSec]);

  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;

  if (photos.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Сервер не выдал задания Write About the Photo</h2>
        <p className="text-sm text-neutral-400">
          Этап нельзя начать без серверных вопросов. Обновите страницу или перезапустите попытку.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">
          Write About the Photo • {t.photoStep} {photoIndex + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-1.5 text-[#D2F544] font-bold text-sm bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / (currentPhoto?.timeLimitSec || 60)) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Photo view */}
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-4 flex flex-col items-center justify-center overflow-hidden shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.imageUrl}
            alt={currentPhoto.altText}
            className="w-full h-72 object-cover rounded-2xl"
          />
          <span className="text-[11px] text-neutral-400 mt-2 italic text-center">
            {currentPhoto.altText}
          </span>
        </div>

        {/* Input box */}
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span className="font-bold text-[#D2F544] uppercase">{t.photoInstruction}</span>
              <span>
                {t.wordsCounter}: <strong className="text-white font-mono">{wordCount}</strong> ({t.recommendedRange})
              </span>
            </div>

            <textarea
              rows={6}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="This image depicts... In the background... They appear to be..."
              className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-[#D2F544] rounded-2xl p-4 text-white text-base outline-none leading-relaxed"
              autoFocus
              autoCorrect="off"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
            />

            <div className="mt-3 p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-[11px] text-neutral-400">
              Ответ будет оценён сервером по рубрикам после отправки. Черновой балл на клиенте
              не показывается.
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="primary" size="md" onClick={handleNextPhoto} icon={<ArrowRight className="w-4 h-4" />}>
              {photoIndex + 1 === photos.length ? t.finishPhotoTestBtn : t.nextPhotoBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
