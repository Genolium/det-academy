'use client';

import React, { useState, useEffect } from 'react';
import { listenTypeBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { sound } from '@/lib/sound';
import { stringSimilarity } from '@/lib/scoring';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { Volume2, VolumeX, ArrowRight, Clock, AlertCircle } from 'lucide-react';

interface ListenAndTypeProps {
  onComplete: () => void;
}

export const ListenAndType: React.FC<ListenAndTypeProps> = ({ onComplete }) => {
  const { recordListenTypeResult } = useTestStore();
  const { soundEnabled, locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const currentItem = listenTypeBank[0];
  const [typedText, setTypedText] = useState('');
  const [playCount, setPlayCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Play audio helper (strictly max 3 times)
  const playAudio = () => {
    if (playCount >= 3 || isPlayingAudio) return;
    setIsPlayingAudio(true);
    setPlayCount((p) => p + 1);

    sound.speakEnglish(currentItem.audioSentence, () => {
      setIsPlayingAudio(false);
    });
  };

  // 1st play starts automatically after 1 second
  useEffect(() => {
    const autoPlayTimer = setTimeout(() => {
      playAudio();
    }, 1000);

    return () => clearTimeout(autoPlayTimer);
  }, []);

  // 60-second timer
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
  }, [typedText]);

  const handleSubmit = () => {
    const similarity = stringSimilarity(typedText, currentItem.audioSentence);
    recordListenTypeResult(similarity);

    if (soundEnabled && similarity > 0.7) {
      sound.playSuccessChime();
    }
    onComplete();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Timer Bar */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">Listen and Type (Dictation)</span>
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

      <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-8 text-center">
        <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-6">
          Type the statement that you hear into the box below.
        </h3>

        {/* Big Audio Play Button */}
        <div className="mb-8">
          <button
            onClick={playAudio}
            disabled={playCount >= 3 || isPlayingAudio}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto transition-all ${
              playCount < 3 && !isPlayingAudio
                ? 'bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] shadow-lg hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Volume2 className="w-8 h-8 mb-1" />
            <span className="text-[11px] font-black uppercase">
              {isPlayingAudio ? t.playingAudio : `${t.playsRemaining} (${3 - playCount}/3)`}
            </span>
          </button>
        </div>

        {/* Text Area */}
        <textarea
          rows={3}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder="Type what you hear... Remember capital letter and punctuation (. or ?)."
          className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-[#D2F544] rounded-2xl p-4 text-white placeholder-neutral-500 text-lg outline-none font-sans leading-relaxed"
          autoFocus
        />

        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mt-4">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>{t.dictationHint}</span>
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
