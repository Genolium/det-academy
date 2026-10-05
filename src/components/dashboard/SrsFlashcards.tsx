'use client';

import React, { useState, useEffect } from 'react';
import vocabData from '@/data/academicVocabulary.json';
import { Sparkles, RotateCw, Volume2, CheckCircle2, Flame, Award, ArrowRight } from 'lucide-react';

interface FlashcardProgress {
  id: string;
  intervalDays: number;
  repetitions: number;
  easinessFactor: number;
  dueDate: string; // ISO date string
}

interface SrsStorage {
  cards: Record<string, FlashcardProgress>;
  streakDays: number;
  lastStudiedDate: string;
  totalReviewed: number;
}

export const SrsFlashcards: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [storage, setStorage] = useState<SrsStorage>({
    cards: {},
    streakDays: 3,
    lastStudiedDate: '',
    totalReviewed: 14,
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('det_srs_progress_v1');
      if (saved) {
        setStorage(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveStorage = (newStorage: SrsStorage) => {
    setStorage(newStorage);
    try {
      localStorage.setItem('det_srs_progress_v1', JSON.stringify(newStorage));
    } catch {
      // ignore
    }
  };

  const currentWord = vocabData[currentIndex] || vocabData[0];
  const cardProgress = storage.cards[currentWord.id] || {
    id: currentWord.id,
    intervalDays: 1,
    repetitions: 0,
    easinessFactor: 2.5,
    dueDate: new Date().toISOString(),
  };

  // Speak word aloud using browser SpeechSynthesis
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // SuperMemo SM-2 Algorithm update
  const handleGrade = (quality: 1 | 3 | 4 | 5) => {
    let { intervalDays, repetitions, easinessFactor } = cardProgress;

    // Quality < 3 means repetition failed
    if (quality < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easinessFactor);
      }
      repetitions++;
    }

    // Update Easiness Factor (EF)
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const qDiff = 5 - quality;
    easinessFactor = easinessFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02));
    if (easinessFactor < 1.3) easinessFactor = 1.3;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + intervalDays);

    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = storage.streakDays;
    if (storage.lastStudiedDate !== todayStr) {
      newStreak++;
    }

    const updatedStorage: SrsStorage = {
      ...storage,
      streakDays: newStreak,
      lastStudiedDate: todayStr,
      totalReviewed: storage.totalReviewed + 1,
      cards: {
        ...storage.cards,
        [currentWord.id]: {
          id: currentWord.id,
          intervalDays,
          repetitions,
          easinessFactor,
          dueDate: nextDueDate.toISOString(),
        },
      },
    };

    saveStorage(updatedStorage);

    // Advance to next card
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % vocabData.length);
  };

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#D2F544]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Streak Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D2F544]/15 text-[#D2F544] border border-[#D2F544]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Интервальное повторение (SuperMemo SM-2)
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Академический словарь C1/C2
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Карточки 1,500 высокочастотных лексем Academic Word List (AWL) для максимального балла в секциях Writing и Speaking.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Flame className="w-4 h-4 fill-current animate-pulse text-amber-500" />
            <span>{storage.streakDays} дн. ударный режим</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold">
            <Award className="w-4 h-4 text-[#D2F544]" />
            <span>{storage.totalReviewed} повторений</span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Flip Flashcard */}
      <div className="max-w-xl mx-auto">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`cursor-pointer min-h-[280px] rounded-3xl p-6 sm:p-8 border transition-all duration-300 flex flex-col justify-between relative shadow-2xl select-none ${
            isFlipped
              ? 'bg-neutral-900/90 border-[#D2F544]/40 shadow-[#D2F544]/5'
              : 'bg-[#121518] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          {/* Card Top Meta */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Уровень {currentWord.level}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-semibold italic">
                {currentWord.pos}
              </span>
              <button
                type="button"
                onClick={handleSpeak}
                className={`p-2 rounded-xl border border-neutral-700 hover:border-[#D2F544] text-neutral-300 hover:text-white transition-all ${
                  isSpeaking ? 'bg-[#D2F544] text-[#0C2418]' : 'bg-neutral-800/80'
                }`}
                title="Произнести слово"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Center Content */}
          <div className="py-6 text-center space-y-2">
            {!isFlipped ? (
              <>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {currentWord.word}
                </h3>
                <p className="text-sm font-mono text-neutral-400">{currentWord.ipa}</p>
                <p className="text-xs text-neutral-400 pt-4 flex items-center justify-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-[#D2F544]" />
                  <span>Нажмите на карточку, чтобы перевернуть</span>
                </p>
              </>
            ) : (
              <div className="text-left space-y-3">
                <div className="border-b border-neutral-800 pb-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Перевод:</span>
                  <h4 className="text-xl font-black text-[#D2F544]">{currentWord.meaningRu}</h4>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Определение:</span>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    {currentWord.definitionEn}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 text-xs text-neutral-300 italic">
                  &ldquo;{currentWord.example}&rdquo;
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentWord.collocations.map((col) => (
                    <span
                      key={col}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Bottom: Progress Info */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/60 pt-3">
            <span>
              Карточка {currentIndex + 1} из {vocabData.length}
            </span>
            <span>Интервал памяти: ~{cardProgress.intervalDays} дн.</span>
          </div>
        </div>

        {/* Rating Buttons (SuperMemo SM-2 Feedback) */}
        {isFlipped && (
          <div className="grid grid-cols-4 gap-2 pt-4">
            <button
              onClick={() => handleGrade(1)}
              className="px-2 py-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
            >
              <div className="text-sm font-black">Снова</div>
              <div className="text-[10px] text-rose-400/80">1 день</div>
            </button>

            <button
              onClick={() => handleGrade(3)}
              className="px-2 py-3 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
            >
              <div className="text-sm font-black">Трудно</div>
              <div className="text-[10px] text-amber-400/80">3 дня</div>
            </button>

            <button
              onClick={() => handleGrade(4)}
              className="px-2 py-3 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
            >
              <div className="text-sm font-black">Хорошо</div>
              <div className="text-[10px] text-blue-400/80">6 дней</div>
            </button>

            <button
              onClick={() => handleGrade(5)}
              className="px-2 py-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
            >
              <div className="text-sm font-black">Легко</div>
              <div className="text-[10px] text-emerald-400/80">10+ дней</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
