'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import vocabData from '@/data/academicVocabulary.json';
import { useAuthStore } from '@/store/useAuthStore';
import { api, SRSStateResponse, SRSCardProgress } from '@/lib/api';
import { Sparkles, RotateCw, Volume2, CheckCircle2, Flame, Award, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface FlashcardProgress {
  id: string;
  intervalDays: number;
  repetitions: number;
  easinessFactor: number;
  dueDate: string; // YYYY-MM-DD
}

interface SrsStorage {
  cards: Record<string, FlashcardProgress>;
  streakDays: number;
  lastStudiedDate: string;
  totalReviewed: number;
}

export const SrsFlashcards: React.FC = () => {
  const { user } = useAuthStore();
  const [queueMode, setQueueMode] = useState<'due' | 'new' | 'all'>('due');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [storage, setStorage] = useState<SrsStorage>({
    cards: {},
    streakDays: 0,
    lastStudiedDate: '',
    totalReviewed: 0,
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const storageKey = user?.id ? `det_srs_progress_${user.id}` : 'det_srs_progress_guest';

  // Load progress from backend (if logged in) or fallback to user-scoped localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadSRS() {
      if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
        try {
          const resp: SRSStateResponse = await api.getUserSRSState();
          if (resp && isMounted) {
            const mappedCards: Record<string, FlashcardProgress> = {};
            for (const [k, v] of Object.entries(resp.cards || {})) {
              mappedCards[k] = {
                id: v.cardId,
                intervalDays: v.intervalDays,
                repetitions: v.repetitions,
                easinessFactor: v.easinessFactor,
                dueDate: v.dueDate,
              };
            }
            const s: SrsStorage = {
              cards: mappedCards,
              streakDays: resp.stats?.streakDays || 0,
              lastStudiedDate: resp.stats?.lastStudiedDate || '',
              totalReviewed: resp.stats?.totalReviewed || 0,
            };
            setStorage(s);
            try {
              localStorage.setItem(storageKey, JSON.stringify(s));
            } catch {}
            return;
          }
        } catch {
          // fallback to localStorage
        }
      }

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved && isMounted) {
          setStorage(JSON.parse(saved));
        } else if (isMounted) {
          setStorage({
            cards: {},
            streakDays: 0,
            lastStudiedDate: '',
            totalReviewed: 0,
          });
        }
      } catch {
        // ignore
      }
    }

    loadSRS();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  const saveStorage = useCallback((newStorage: SrsStorage) => {
    setStorage(newStorage);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newStorage));
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Partition cards into queues
  const { dueCards, newCards, allCards } = useMemo(() => {
    const due: typeof vocabData = [];
    const fresh: typeof vocabData = [];

    vocabData.forEach((w) => {
      const card = storage.cards[w.id];
      if (!card) {
        fresh.push(w);
      } else if (card.dueDate <= todayStr) {
        due.push(w);
      }
    });

    // Sort due cards: overdue first
    due.sort((a, b) => {
      const aDate = storage.cards[a.id]?.dueDate || '';
      const bDate = storage.cards[b.id]?.dueDate || '';
      return aDate.localeCompare(bDate);
    });

    return {
      dueCards: due,
      newCards: fresh,
      allCards: vocabData,
    };
  }, [storage.cards, todayStr]);

  // Determine active list according to mode
  const activeList = useMemo(() => {
    if (queueMode === 'due') {
      return dueCards;
    }
    if (queueMode === 'new') {
      return newCards.slice(0, 15);
    }
    return allCards;
  }, [queueMode, dueCards, newCards, allCards]);

  const currentWord = activeList[currentIndex] || activeList[0] || null;

  const cardProgress = currentWord
    ? storage.cards[currentWord.id] || {
        id: currentWord.id,
        intervalDays: 1,
        repetitions: 0,
        easinessFactor: 2.5,
        dueDate: todayStr,
      }
    : null;

  // Speak word aloud using browser SpeechSynthesis
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis || !currentWord) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // SuperMemo SM-2 Algorithm update with server sync
  const handleGrade = async (quality: 1 | 3 | 4 | 5) => {
    if (!currentWord || !cardProgress) return;

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
        if (intervalDays < 1) intervalDays = 1;
      }
      repetitions++;
    }

    // Update Easiness Factor (EF)
    const qDiff = 5 - quality;
    easinessFactor = easinessFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02));
    if (easinessFactor < 1.3) easinessFactor = 1.3;

    const nextDueDateObj = new Date();
    nextDueDateObj.setDate(nextDueDateObj.getDate() + intervalDays);
    const nextDueDateStr = nextDueDateObj.toISOString().split('T')[0];

    // Honest streak calculation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = storage.streakDays;
    if (storage.lastStudiedDate === todayStr) {
      if (newStreak === 0) newStreak = 1;
    } else if (storage.lastStudiedDate === yesterdayStr) {
      newStreak = (storage.streakDays || 0) + 1;
    } else {
      newStreak = 1;
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
          dueDate: nextDueDateStr,
        },
      },
    };

    saveStorage(updatedStorage);

    // Sync with backend if authenticated
    if (typeof window !== 'undefined' && localStorage.getItem('det_auth_token')) {
      try {
        await api.reviewSRSCard(currentWord.id, quality);
      } catch {
        // ignore background sync error
      }
    }

    // Advance to next card
    setIsFlipped(false);
    if (currentIndex + 1 < activeList.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const isDueSessionFinished = queueMode === 'due' && dueCards.length === 0;

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#D2F544]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Streak Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D2F544]/15 text-[#D2F544] border border-[#D2F544]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Интервальное повторение (SuperMemo SM-2)
            </span>
            <span className="text-neutral-500 text-xs">•</span>
            <span className="text-xs text-neutral-400 font-medium">{vocabData.length} слов Academic Word List</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Академический словарь C1/C2
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Высокочастотные академические термины для максимального балла в секциях Writing и Speaking.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Flame className="w-4 h-4 fill-current text-amber-500" />
            <span>{storage.streakDays} дн. ударный режим</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold">
            <Award className="w-4 h-4 text-[#D2F544]" />
            <span>{storage.totalReviewed} повторений</span>
          </div>
        </div>
      </div>

      {/* Queue Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 p-1.5 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => {
              setQueueMode('due');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              queueMode === 'due'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>К повторению сегодня</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                dueCards.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {dueCards.length}
            </span>
          </button>

          <button
            onClick={() => {
              setQueueMode('new');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              queueMode === 'new'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Новые слова</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-neutral-800 text-neutral-400">
              {newCards.length}
            </span>
          </button>

          <button
            onClick={() => {
              setQueueMode('all');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              queueMode === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Все карточки</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-neutral-800 text-neutral-400">
              {allCards.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 px-2 font-medium">
          Освоено терминов: <strong className="text-[#D2F544]">{Object.values(storage.cards).filter((c) => c.repetitions >= 3).length}</strong>
        </div>
      </div>

      {/* When Due Session Is Complete */}
      {isDueSessionFinished ? (
        <div className="max-w-xl mx-auto p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Все карточки на сегодня повторены!</h3>
            <p className="text-xs text-neutral-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Отличная работа по сохранению интервалов памяти. Следующие слова вернутся по графику SM-2.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setQueueMode('new');
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Учить 15 новых слов</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setQueueMode('all');
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Просмотреть весь словарь
            </button>
          </div>
        </div>
      ) : currentWord && cardProgress ? (
        /* Interactive 3D Flip Flashcard */
        <div className="max-w-xl mx-auto">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`cursor-pointer min-h-[290px] rounded-3xl p-6 sm:p-8 border transition-all duration-300 flex flex-col justify-between relative shadow-2xl select-none ${
              isFlipped
                ? 'bg-neutral-900/95 border-[#D2F544]/40 shadow-[#D2F544]/5'
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
                  className={`p-2 rounded-xl border border-neutral-700 hover:border-[#D2F544] text-neutral-300 hover:text-white transition-all cursor-pointer ${
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
                Карточка {currentIndex + 1} из {activeList.length}
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
      ) : null}
    </div>
  );
};
