'use client';

import React, { useState, useEffect, useRef } from 'react';
import { detVocabulary, standardVocabulary } from '@/data/vocabularies';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { sound } from '@/lib/sound';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { Keyboard, RotateCcw, Volume2, VolumeX, Trophy, Zap, Clock, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';

type Mode = 'time' | 'words';
type VocabPack = 'det' | 'standard';

export const TypingEngine: React.FC = () => {
  const { bestTypingWpm, setBestTypingWpm } = useProgressStore();
  const { locale, soundEnabled, setSoundEnabled } = useSettingsStore();
  const t = translations[locale].typing;

  const [mode, setMode] = useState<Mode>('time');
  const [timeLimit, setTimeLimit] = useState<number>(30); // 15, 30, 60, 120
  const [wordLimit, setWordLimit] = useState<number>(25); // 10, 25, 50, 100
  const [vocabPack, setVocabPack] = useState<VocabPack>('det');

  const [words, setWords] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [history, setHistory] = useState<{ typed: string; correct: boolean }[]>([]);

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Key stats
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Generate word stream
  const generateWords = (pack: VocabPack, count: number = 80) => {
    const source = pack === 'det' ? detVocabulary : standardVocabulary;
    const shuffled: string[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * source.length);
      shuffled.push(source[randomIndex]);
    }
    return shuffled;
  };

  // Reset test
  const resetTest = () => {
    setIsRunning(false);
    setIsFinished(false);
    setCurrentInput('');
    setCurrentWordIndex(0);
    setHistory([]);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setStartTime(null);
    setTimeLeft(timeLimit);

    const initialWords = generateWords(vocabPack, mode === 'words' ? wordLimit : 100);
    setWords(initialWords);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    resetTest();
  }, [mode, timeLimit, wordLimit, vocabPack]);

  // Timer countdown for 'time' mode
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && mode === 'time' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, mode, timeLeft]);

  const finishTest = () => {
    setIsRunning(false);
    setIsFinished(true);

    if (soundEnabled) sound.playSuccessChime();
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Calculate live and final stats
  const getElapsedMinutes = () => {
    if (!startTime) return 0.1;
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    return Math.max(0.01, elapsedSeconds / 60);
  };

  const currentWpm = Math.round(
    correctKeystrokes / 5 / (mode === 'time' ? (timeLimit - timeLeft) / 60 || 0.05 : getElapsedMinutes())
  ) || 0;

  const finalWpm = Math.round(
    correctKeystrokes / 5 / (mode === 'time' ? timeLimit / 60 : getElapsedMinutes())
  ) || 0;

  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  useEffect(() => {
    if (isFinished && finalWpm > 0) {
      setBestTypingWpm(finalWpm);
    }
  }, [isFinished, finalWpm, setBestTypingWpm]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;

    const val = e.target.value;

    if (!isRunning) {
      setIsRunning(true);
      setStartTime(Date.now());
    }

    if (soundEnabled) sound.playKeyClick();

    // Check space key -> advance word
    if (val.endsWith(' ')) {
      const trimmed = val.trim();
      const targetWord = words[currentWordIndex];
      const isWordCorrect = trimmed === targetWord;

      setTotalKeystrokes((prev) => prev + trimmed.length + 1);
      if (isWordCorrect) {
        setCorrectKeystrokes((prev) => prev + trimmed.length + 1);
      }

      setHistory((prev) => [...prev, { typed: trimmed, correct: isWordCorrect }]);
      setCurrentInput('');

      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);

      if (mode === 'words' && nextIndex >= wordLimit) {
        finishTest();
      }
      return;
    }

    // Ongoing typing in current word
    const targetWord = words[currentWordIndex];
    const isCorrectSoFar = targetWord.startsWith(val);

    if (isCorrectSoFar) {
      setCorrectKeystrokes((prev) => prev + 1);
    }
    setTotalKeystrokes((prev) => prev + 1);

    setCurrentInput(val);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Configuration Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-[#111315] text-white p-4 rounded-3xl border border-neutral-800 shadow-md">
        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-2xl border border-neutral-800 text-xs">
          <button
            onClick={() => setMode('time')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              mode === 'time' ? 'bg-[#D2F544] text-[#0C2418]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t.modeTime}
          </button>
          <button
            onClick={() => setMode('words')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              mode === 'words' ? 'bg-[#D2F544] text-[#0C2418]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            {t.modeWords}
          </button>
        </div>

        {/* Quantities */}
        {mode === 'time' ? (
          <div className="flex items-center gap-1 text-xs">
            {[15, 30, 60, 120].map((t) => (
              <button
                key={t}
                onClick={() => setTimeLimit(t)}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                  timeLimit === t ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs">
            {[10, 25, 50, 100].map((w) => (
              <button
                key={w}
                onClick={() => setWordLimit(w)}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                  wordLimit === w ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        {/* Vocab Pack & Sound */}
        <div className="flex items-center gap-2">
          <select
            value={vocabPack}
            onChange={(e) => setVocabPack(e.target.value as VocabPack)}
            aria-label="Словарный набор"
            className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl px-3 py-1.5 font-bold focus:outline-none"
          >
            <option value="det">{t.detPack}</option>
            <option value="standard">{t.stdPack}</option>
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
            title={t.soundToggle}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#D2F544]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Typing Surface */}
      {!isFinished ? (
        <div
          onClick={() => inputRef.current?.focus()}
          className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-neutral-200 shadow-xl cursor-text relative min-h-[300px] flex flex-col justify-between"
        >
          {/* Header live counter */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100 text-sm">
            <div className="flex items-center gap-4">
              <span className="font-mono text-2xl font-black text-[#D2F544] bg-[#0E1012] px-3.5 py-1 rounded-xl">
                {mode === 'time' ? `${timeLeft}s` : `${currentWordIndex}/${wordLimit}`}
              </span>
              <span className="text-neutral-400 font-mono text-sm">
                {t.liveWpm} <strong className="text-neutral-900">{currentWpm} WPM</strong>
              </span>
            </div>
            <div className="text-neutral-400 font-mono text-sm">
              {t.accuracyLabel} <strong className="text-emerald-600">{accuracy}%</strong>
            </div>
          </div>

          {/* Word Stream Display */}
          <div className="text-2xl sm:text-3xl leading-relaxed tracking-wide font-mono select-none flex flex-wrap gap-x-3 gap-y-2 mb-8">
            {words.slice(0, 40).map((word, wIdx) => {
              const isPast = wIdx < currentWordIndex;
              const isCurrent = wIdx === currentWordIndex;

              if (isPast) {
                const pastResult = history[wIdx];
                if (pastResult && !pastResult.correct) {
                  const typedWord = pastResult.typed;
                  const len = Math.max(word.length, typedWord.length);
                  return (
                    <span key={wIdx} className="underline decoration-2 decoration-red-400">
                      {Array.from({ length: len }).map((_, cIdx) => {
                        const typedChar = typedWord[cIdx];
                        const expected = word[cIdx];
                        if (typedChar === undefined) {
                          // Missed characters stay visible but dimmed
                          return <span key={cIdx} className="text-red-300">{expected}</span>;
                        }
                        return (
                          <span
                            key={cIdx}
                            className={typedChar === expected ? 'text-neutral-400' : 'text-red-500'}
                          >
                            {typedChar}
                          </span>
                        );
                      })}
                    </span>
                  );
                }
                return (
                  <span key={wIdx} className="text-neutral-400">
                    {word}
                  </span>
                );
              }

              if (isCurrent) {
                return (
                  <span key={wIdx} className="relative bg-[#D2F544]/25 px-1 rounded-lg">
                    {word.split('').map((char, cIdx) => {
                      const typedChar = currentInput[cIdx];
                      let charColor = 'text-neutral-400';
                      let shown = char;
                      if (typedChar !== undefined) {
                        if (typedChar === char) {
                          charColor = 'text-neutral-900 font-bold';
                        } else {
                          // Show the character the user actually typed
                          charColor = 'text-red-500 font-bold';
                          shown = typedChar;
                        }
                      }
                      return (
                        <span key={cIdx} className={charColor}>
                          {shown}
                        </span>
                      );
                    })}
                    {/* Extra characters typed past word length */}
                    {currentInput.length > word.length && (
                      <span className="text-red-600 font-bold opacity-80">
                        {currentInput.slice(word.length)}
                      </span>
                    )}
                    {/* Pulsing smooth cursor */}
                    <span className="inline-block w-0.5 h-7 bg-[#0E1012] align-middle ml-0.5 animate-caret" />
                  </span>
                );
              }

              return (
                <span key={wIdx} className="text-neutral-300">
                  {word}
                </span>
              );
            })}
          </div>

          {/* Hidden Input field capturing keystrokes */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            className="opacity-0 absolute inset-0 cursor-default"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Restart button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetTest();
              }}
              className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-neutral-900 bg-neutral-100 px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.restartEsc}
            </button>
          </div>
        </div>
      ) : (
        /* Result Screen */
        <div className="bg-[#111315] text-white rounded-3xl p-8 sm:p-12 border border-neutral-800 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-800">
            <div>
              <PillBadge variant="lime" prefixHash className="mb-2">
                {t.finishedBadge}
              </PillBadge>
              <h3 className="text-3xl font-black uppercase text-white">{t.finishedTitle}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#D2F544] text-[#0C2418] flex items-center justify-center font-black">
              <Trophy className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <span className="text-xs uppercase text-neutral-400 font-bold block mb-1">{t.wpmLabel}</span>
              <div className="text-4xl sm:text-5xl font-black text-[#D2F544] font-mono">{finalWpm}</div>
            </div>
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <span className="text-xs uppercase text-neutral-400 font-bold block mb-1">{t.accuracyStat}</span>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono">{accuracy}%</div>
            </div>
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <span className="text-xs uppercase text-neutral-400 font-bold block mb-1">{t.keystrokesLabel}</span>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono">{totalKeystrokes}</div>
            </div>
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <span className="text-xs uppercase text-neutral-400 font-bold block mb-1">{t.personalBestLabel}</span>
              <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono">
                {Math.max(bestTypingWpm, finalWpm)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
            <span className="text-xs text-neutral-400">
              {t.recommendation}
            </span>
            <Button variant="primary" size="lg" onClick={resetTest} icon={<RotateCcw className="w-4 h-4" />}>
              {t.retryBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
