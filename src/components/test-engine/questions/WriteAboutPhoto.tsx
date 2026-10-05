'use client';

import React, { useState, useEffect } from 'react';
import { writePhotoBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock, Image as ImageIcon } from 'lucide-react';
import { evaluateWriteAboutPhoto } from '@/lib/textEvaluator';

interface WriteAboutPhotoProps {
  onComplete: () => void;
}

export const WriteAboutPhoto: React.FC<WriteAboutPhotoProps> = ({ onComplete }) => {
  const { recordWritePhotoResult } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const [photoIndex, setPhotoIndex] = useState(0);
  const [texts, setTexts] = useState<string[]>(['', '', '']);
  const [currentText, setCurrentText] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60s per photo

  const currentPhoto = writePhotoBank[photoIndex];

  // 60-second timer per photo
  useEffect(() => {
    setTimeLeft(60);
    setCurrentText('');
  }, [photoIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextPhoto();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [photoIndex, currentText]);

  const handleNextPhoto = () => {
    const updatedTexts = [...texts];
    updatedTexts[photoIndex] = currentText;
    setTexts(updatedTexts);

    if (photoIndex + 1 < writePhotoBank.length) {
      setPhotoIndex((p) => p + 1);
    } else {
      recordWritePhotoResult(updatedTexts);
      onComplete();
    }
  };

  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">
          Write About the Photo • {t.photoStep} {photoIndex + 1} / {writePhotoBank.length}
        </span>
        <div className="flex items-center gap-1.5 text-[#D2F544] font-bold text-sm bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#D2F544] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 60) * 100}%` }}
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
              className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-[#D2F544] rounded-2xl p-4 text-white text-sm outline-none leading-relaxed"
              autoFocus
            />

            {/* Live Rubric Quality Meter */}
            {wordCount >= 5 && (
              <div className="mt-3 p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
                    Оценка соответствия контексту
                  </span>
                  <span className="font-mono font-bold text-xs text-[#D2F544]">
                    {Math.round(evaluateWriteAboutPhoto(currentText, { altText: currentPhoto.altText }).relevanceScore * 100)}%
                  </span>
                </div>
                {evaluateWriteAboutPhoto(currentText, { altText: currentPhoto.altText }).recommendations.length > 0 && (
                  <p className="text-[11px] text-amber-300/90">
                    💡 {evaluateWriteAboutPhoto(currentText, { altText: currentPhoto.altText }).recommendations[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="primary" size="md" onClick={handleNextPhoto} icon={<ArrowRight className="w-4 h-4" />}>
              {photoIndex + 1 === writePhotoBank.length ? t.finishPhotoTestBtn : t.nextPhotoBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
