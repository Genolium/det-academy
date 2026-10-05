'use client';

import React, { useState, useEffect } from 'react';
import { GeneratedCTest, getRandomGeneratedCTest } from '@/lib/generators/cTestGenerator';
import { generateReadSelectBatch, VocabularyItem, generateRandomFillInBlank, GeneratedFillInBlank } from '@/lib/generators/vocabularyGenerator';
import { getRandomDictation, DictationItem, playSynthesizedDictation, evaluateDictationAccuracy } from '@/lib/generators/audioDictationGenerator';
import { getRandomWritingPrompt, WritingPrompt, analyzeWritingVocabulary } from '@/lib/generators/writingPromptGenerator';
import { BentoCard } from '@/components/ui/BentoCard';
import { Button } from '@/components/ui/Button';
import { PillBadge } from '@/components/ui/PillBadge';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Volume2, 
  Trophy, 
  Lightbulb,
  AlertCircle,
  Eye,
  HelpCircle
} from 'lucide-react';

interface InteractiveLessonDrillProps {
  lessonSlug: string;
  category: string;
  onDrillCompleted?: () => void;
}

export const InteractiveLessonDrill: React.FC<InteractiveLessonDrillProps> = ({
  lessonSlug,
  category,
  onDrillCompleted,
}) => {
  // 1. C-Test Drill State
  const [cTest, setCTest] = useState<GeneratedCTest>(() => getRandomGeneratedCTest());
  const [cTestInputs, setCTestInputs] = useState<Record<number, string>>({});
  const [cTestChecked, setCTestChecked] = useState(false);
  const [cTestScore, setCTestScore] = useState<number | null>(null);

  // 2. Read & Select Drill State
  const [rsWords, setRsWords] = useState<VocabularyItem[]>(() => generateReadSelectBatch(8));
  const [rsIndex, setRsIndex] = useState(0);
  const [rsAnswers, setRsAnswers] = useState<boolean[]>([]);
  const [rsUserChoices, setRsUserChoices] = useState<boolean[]>([]);
  const [rsFinished, setRsFinished] = useState(false);

  // 3. Fill in the Blanks Drill State
  const [fib, setFib] = useState<GeneratedFillInBlank>(() => generateRandomFillInBlank());
  const [fibInput, setFibInput] = useState('');
  const [fibChecked, setFibChecked] = useState(false);
  const [fibCorrect, setFibCorrect] = useState(false);

  // 4. Listen & Type Drill State (DET: 1 initial play + 2 replays = 3 total)
  const [dictation, setDictation] = useState<DictationItem>(() => getRandomDictation());
  const [dictInput, setDictInput] = useState('');
  const [replaysLeft, setReplaysLeft] = useState(2);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [dictResult, setDictResult] = useState<ReturnType<typeof evaluateDictationAccuracy> | null>(null);

  // 5. Writing Drill State
  const [writingPrompt, setWritingPrompt] = useState<WritingPrompt>(() => getRandomWritingPrompt());
  const [writingText, setWritingText] = useState('');
  const [writingAnalysis, setWritingAnalysis] = useState<ReturnType<typeof analyzeWritingVocabulary> | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // General State
  const [drillCompleted, setDrillCompleted] = useState(false);

  // Reset drill whenever lessonSlug changes
  useEffect(() => {
    setCTest(getRandomGeneratedCTest());
    setCTestInputs({});
    setCTestChecked(false);
    setCTestScore(null);

    setRsWords(generateReadSelectBatch(8));
    setRsIndex(0);
    setRsAnswers([]);
    setRsUserChoices([]);
    setRsFinished(false);

    setFib(generateRandomFillInBlank());
    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);

    setDictation(getRandomDictation());
    setDictInput('');
    setReplaysLeft(2);
    setHasStartedAudio(false);
    setDictResult(null);

    setWritingPrompt(getRandomWritingPrompt());
    setWritingText('');
    setWritingAnalysis(null);
    setShowModelAnswer(false);
    setDrillCompleted(false);
  }, [lessonSlug]);

  // Handlers for C-Test
  const handleCTestCheck = () => {
    let correct = 0;
    cTest.gaps.forEach((gap) => {
      const userVal = (cTestInputs[gap.index] || '').trim().toLowerCase();
      if (userVal === gap.missing.toLowerCase()) {
        correct++;
      }
    });
    setCTestScore(correct);
    setCTestChecked(true);
    if (correct >= Math.floor(cTest.gaps.length * 0.5)) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  const handleCTestReset = () => {
    setCTest(getRandomGeneratedCTest());
    setCTestInputs({});
    setCTestChecked(false);
    setCTestScore(null);
  };

  // Handlers for Read & Select
  const handleRsChoice = (userBelievesReal: boolean) => {
    const currentWord = rsWords[rsIndex];
    const isCorrect = userBelievesReal === currentWord.isReal;
    const newAnswers = [...rsAnswers, isCorrect];
    const newChoices = [...rsUserChoices, userBelievesReal];
    setRsAnswers(newAnswers);
    setRsUserChoices(newChoices);

    if (rsIndex + 1 < rsWords.length) {
      setRsIndex(rsIndex + 1);
    } else {
      setRsFinished(true);
      const correctTotal = newAnswers.filter(Boolean).length;
      if (correctTotal >= Math.floor(rsWords.length * 0.6)) {
        setDrillCompleted(true);
        onDrillCompleted?.();
      }
    }
  };

  const handleRsReset = () => {
    setRsWords(generateReadSelectBatch(8));
    setRsIndex(0);
    setRsAnswers([]);
    setRsUserChoices([]);
    setRsFinished(false);
  };

  // Handlers for Fill in Blanks
  const handleFibCheck = () => {
    const isOk = fibInput.trim().toLowerCase() === fib.missingLetters.toLowerCase();
    setFibCorrect(isOk);
    setFibChecked(true);
    if (isOk) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  const handleFibReset = () => {
    setFib(generateRandomFillInBlank());
    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);
  };

  // Handlers for Listen & Type (1 initial play + 2 replays)
  const handlePlayDictation = async () => {
    if (!hasStartedAudio) {
      // First initial play
      setHasStartedAudio(true);
      setIsPlayingAudio(true);
      try {
        await playSynthesizedDictation(dictation.sentence);
      } finally {
        setIsPlayingAudio(false);
      }
    } else if (replaysLeft > 0) {
      // Replay
      setReplaysLeft(replaysLeft - 1);
      setIsPlayingAudio(true);
      try {
        await playSynthesizedDictation(dictation.sentence);
      } finally {
        setIsPlayingAudio(false);
      }
    }
  };

  const handleDictCheck = () => {
    const evalResult = evaluateDictationAccuracy(dictInput, dictation.sentence);
    setDictResult(evalResult);
    if (evalResult.similarity >= 0.7) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  const handleDictReset = () => {
    setDictation(getRandomDictation());
    setDictInput('');
    setReplaysLeft(2);
    setHasStartedAudio(false);
    setDictResult(null);
  };

  // Handlers for Writing
  const handleWritingAnalyze = () => {
    const analysis = analyzeWritingVocabulary(writingText);
    setWritingAnalysis(analysis);
    if (!analysis.isGibberish && analysis.wordCount >= writingPrompt.minWords * 0.6) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  // Determine active drill type based on lesson slug
  const isCTest = lessonSlug === 'read-and-complete';
  const isReadSelect = lessonSlug === 'read-and-select';
  const isFillBlanks = lessonSlug === 'fill-in-the-blanks';
  const isListenType = lessonSlug === 'listen-and-type' || lessonSlug === 'interactive-listening';
  const isWriting = lessonSlug === 'write-about-the-photo' || lessonSlug === 'interactive-writing' || lessonSlug === 'writing-sample';
  const isGeneral = !isCTest && !isReadSelect && !isFillBlanks && !isListenType && !isWriting;

  return (
    <div className="mt-12 pt-8 border-t border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D2F544] flex items-center justify-center text-black font-black shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
              Интерактивная практика (Live Dynamic Drill)
            </h3>
            <p className="text-xs text-neutral-500 font-medium">
              Закрепите изученные правила на алгоритмически сгенерированном задании с мгновенным разбором
            </p>
          </div>
        </div>

        {drillCompleted && (
          <PillBadge variant="mint">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#0C2418]" /> Практика сдана!
          </PillBadge>
        )}
      </div>

      <BentoCard variant="light" className="p-6 rounded-3xl border border-neutral-200/80 shadow-md">
        {/* ========================================================================= */}
        {/* 1. C-TEST DRILL (RICH CONTEXT + COMPLETE TEXT RENDERING) */}
        {/* ========================================================================= */}
        {isCTest && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Академический текст: {cTest.title}
                </span>
                <span className="ml-2 text-[10px] font-black bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200">
                  Уровень {cTest.difficulty} · Пропусков: {cTest.gaps.length}
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCTestReset} className="text-xs">
                <RotateCcw className="w-3 h-3 mr-1" /> Новый текст
              </Button>
            </div>

            {/* Continuous passage rendering with undamaged context and inline gap inputs */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 text-base sm:text-lg leading-loose text-neutral-800">
              {cTest.segments.map((segment, idx) => {
                if (segment.type === 'text') {
                  return <span key={idx}>{segment.content}</span>;
                }

                const gap = segment.gap;
                const userVal = cTestInputs[gap.index] || '';
                const isExact = userVal.trim().toLowerCase() === gap.missing.toLowerCase();

                return (
                  <span key={idx} className="inline-flex items-center mx-1 align-baseline">
                    <span className="font-black text-neutral-900">{gap.prefix}</span>
                    <input
                      type="text"
                      maxLength={gap.missing.length}
                      value={userVal}
                      disabled={cTestChecked}
                      onChange={(e) => {
                        setCTestInputs({ ...cTestInputs, [gap.index]: e.target.value });
                      }}
                      placeholder={'_'.repeat(gap.missing.length)}
                      style={{ width: `${Math.max(2, gap.missing.length * 1.05)}rem` }}
                      className={`text-center font-bold px-1 py-0.5 border-b-2 outline-none transition-all ${
                        cTestChecked
                          ? isExact
                            ? 'border-green-500 bg-green-100 text-green-900 font-black'
                            : 'border-red-500 bg-red-100 text-red-900 line-through'
                          : 'border-neutral-400 focus:border-[#0C2418] bg-neutral-50/80 focus:bg-white'
                      }`}
                    />
                    {gap.suffix && <span className="font-semibold text-neutral-900">{gap.suffix}</span>}
                  </span>
                );
              })}
            </div>

            {/* Detailed per-word & overall feedback */}
            {cTestChecked ? (
              <div className="mt-6 space-y-4">
                <div className="p-5 bg-neutral-100 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-black text-neutral-900 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Результат: {cTestScore} из {cTest.gaps.length} верных слов
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">
                      {cTestScore! >= Math.floor(cTest.gaps.length * 0.7)
                        ? '🎉 Отличный результат! Контекст понят правильно.'
                        : '💡 Ознакомьтесь с разбором пропущенных слов ниже и попробуйте еще раз.'}
                    </p>
                  </div>
                  <Button size="sm" onClick={handleCTestReset}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Следующий текст
                  </Button>
                </div>

                {/* Detailed Breakdown of Gaps */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                    Детальный разбор каждого пропуска:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {cTest.gaps.map((g) => {
                      const userVal = (cTestInputs[g.index] || '').trim().toLowerCase();
                      const isCorrect = userVal === g.missing.toLowerCase();

                      return (
                        <div
                          key={g.index}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-sm">{g.fullWord}</span>
                            <span className="text-[11px] block text-neutral-600">
                              Дано: <b>{g.prefix}</b> + вставить: <b>{g.missing}</b>
                            </span>
                          </div>
                          <div className="text-right">
                            {isCorrect ? (
                              <span className="font-bold text-green-700">✓ Верно</span>
                            ) : (
                              <span className="font-bold text-red-700">
                                Введено: "{userVal || '—'}"
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex justify-end">
                <Button size="md" onClick={handleCTestCheck}>
                  Проверить ответы
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. READ & SELECT DRILL (INTERACTIVE ROUND + FULL REVIEW TABLE) */}
        {/* ========================================================================= */}
        {(isReadSelect || isGeneral) && (
          <div>
            {!rsFinished ? (
              <div className="text-center py-6">
                <div className="text-xs font-bold text-neutral-400 mb-2">
                  Слово {rsIndex + 1} из {rsWords.length} · Сложность {rsWords[rsIndex].difficulty}
                </div>
                <div className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-wider mb-8">
                  {rsWords[rsIndex].word}
                </div>

                <div className="flex justify-center gap-4 max-w-sm mx-auto">
                  <Button
                    variant="outline"
                    className="flex-1 border-neutral-300 hover:border-red-500 text-red-700 font-bold py-3 text-sm"
                    onClick={() => handleRsChoice(false)}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Фейк (No)
                  </Button>
                  <Button
                    className="flex-1 bg-[#D2F544] text-neutral-900 font-bold hover:bg-[#c3e839] py-3 text-sm"
                    onClick={() => handleRsChoice(true)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Реальное (Yes)
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center py-4 mb-4">
                  <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h4 className="text-lg font-black text-neutral-900">Раунд завершен!</h4>
                  <p className="text-xs text-neutral-600">
                    Верно отвечено: <b>{rsAnswers.filter(Boolean).length} из {rsWords.length} слов</b>
                  </p>
                </div>

                {/* Complete Detailed Review of ALL Words in the Round */}
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-5">
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 font-bold text-xs uppercase tracking-wider text-neutral-600">
                    Детальный разбор каждого слова:
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {rsWords.map((item, idx) => {
                      const isCorrect = rsAnswers[idx];
                      const userChoice = rsUserChoices[idx];

                      return (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-neutral-900">{item.word}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                item.isReal ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {item.isReal ? 'Реальное слово (C1/C2)' : 'DET Trap (Псевдослово)'}
                              </span>
                            </div>
                            <p className="text-neutral-600 mt-1 text-xs leading-relaxed">
                              {item.definition}
                            </p>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? '✓ Верно' : `✕ Ошибка (Вы выбрали: ${userChoice ? 'Yes' : 'No'})`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button size="md" onClick={handleRsReset}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Тренировать еще 8 слов
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. FILL IN THE BLANKS DRILL (WITH GRAMMAR & CONTEXT FEEDBACK) */}
        {/* ========================================================================= */}
        {isFillBlanks && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Fill in the Blanks · Уровень {fib.difficulty}
              </span>
              <Button size="sm" variant="ghost" onClick={handleFibReset} className="text-xs">
                <RotateCcw className="w-3 h-3 mr-1" /> Другое предложение
              </Button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 text-lg leading-relaxed text-neutral-900">
              {fib.sentenceBefore}
              <span className="font-black text-[#0C2418] bg-[#E3F8ED] px-2 py-0.5 rounded-lg border border-[#0C2418]/20">
                {fib.givenPrefix}
                <input
                  type="text"
                  maxLength={fib.missingLetters.length}
                  value={fibInput}
                  disabled={fibChecked}
                  onChange={(e) => setFibInput(e.target.value)}
                  placeholder={'_'.repeat(fib.missingLetters.length)}
                  style={{ width: `${Math.max(2, fib.missingLetters.length * 1.1)}rem` }}
                  className="bg-transparent text-center font-black outline-none border-b-2 border-black tracking-widest"
                />
              </span>
              {fib.sentenceAfter}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
              <span>
                Длина недостающей части: <b>{fib.missingLetters.length} букв</b> (Американский спеллинг)
              </span>

              {!fibChecked ? (
                <Button size="sm" onClick={handleFibCheck}>
                  Проверить
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleFibReset}>
                  Следующее задание
                </Button>
              )}
            </div>

            {fibChecked && (
              <div className={`mt-4 p-4 rounded-2xl border text-xs leading-relaxed ${
                fibCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  {fibCorrect ? '✓ Абсолютно верно!' : `✕ Неверно. Правильное слово: "${fib.fullWord}"`}
                </div>
                <p>{fib.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. LISTEN & TYPE DRILL (DET REAL RULES: 1 INITIAL + 2 REPLAYS & DIFF) */}
        {/* ========================================================================= */}
        {isListenType && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Диктант · {dictation.topic}
                </span>
                <span className="ml-2 text-[10px] font-black bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200">
                  {dictation.difficulty}
                </span>
              </div>
              <div className="text-xs font-bold text-neutral-600">
                Повторов осталось: <b className="text-neutral-900">{replaysLeft} из 2</b>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <Button
                onClick={handlePlayDictation}
                disabled={isPlayingAudio || (hasStartedAudio && replaysLeft === 0)}
                className="bg-[#D2F544] text-neutral-900 font-bold hover:bg-[#c3e839]"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                {isPlayingAudio
                  ? 'Воспроизведение...'
                  : !hasStartedAudio
                  ? 'Слушать аудио (1-й раз)'
                  : `Повторить аудио (${replaysLeft} повтора)`}
              </Button>
              <span className="text-xs text-neutral-500">
                По регламенту DET доступно 1 основное прослушивание и до 2 повторов (всего 3).
              </span>
            </div>

            <textarea
              rows={2}
              value={dictInput}
              disabled={!!dictResult}
              onChange={(e) => setDictInput(e.target.value)}
              placeholder="Напечатайте услышанное предложение строго на английском..."
              className="w-full p-4 rounded-xl border border-neutral-300 font-medium text-neutral-900 focus:outline-none focus:border-black text-sm"
            />

            {dictResult ? (
              <div className="mt-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-neutral-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Точность совпадения: {Math.round(dictResult.similarity * 100)}%
                  </div>
                  <Button size="sm" variant="outline" onClick={handleDictReset}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Новый диктант
                  </Button>
                </div>

                {/* Word by word breakdown */}
                <div>
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Пословный разбор:
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-white rounded-xl border border-neutral-200 text-xs">
                    {dictResult.wordDiff.map((wd, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 rounded font-bold ${
                          wd.status === 'correct'
                            ? 'bg-green-100 text-green-900 border border-green-300'
                            : wd.status === 'missing'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 line-through'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                        title={wd.status === 'missing' ? 'Пропущено слово' : wd.user ? `Ваш ввод: ${wd.user}` : ''}
                      >
                        {wd.expected || wd.user}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-neutral-700 bg-white p-3 rounded-xl border border-neutral-200">
                  <span className="font-bold block text-neutral-900 mb-0.5">Оригинал: "{dictation.sentence}"</span>
                  <span className="text-neutral-500">Перевод: {dictation.translationRu}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={handleDictCheck}>
                  Проверить диктант
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. WRITING DRILL (GIBBERISH DETECTION, C1/C2 UPGRADES, MODEL ANSWERS) */}
        {/* ========================================================================= */}
        {isWriting && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Writing Lab · {writingPrompt.category}
              </span>
              <Button size="sm" variant="ghost" onClick={() => {
                setWritingPrompt(getRandomWritingPrompt());
                setWritingText('');
                setWritingAnalysis(null);
                setShowModelAnswer(false);
              }} className="text-xs">
                <RotateCcw className="w-3 h-3 mr-1" /> Новая тема
              </Button>
            </div>

            {writingPrompt.imageUrl && (
              <div className="mb-5 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center p-2">
                <img
                  src={writingPrompt.imageUrl}
                  alt="Writing Prompt"
                  className="max-h-80 w-auto rounded-xl object-contain shadow-sm"
                />
              </div>
            )}

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 mb-4">
              <p className="text-sm font-bold text-neutral-900">{writingPrompt.prompt}</p>
            </div>

            <textarea
              rows={4}
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Введите академический ответ без сокращений (use 'do not', 'cannot')..."
              className="w-full p-4 rounded-xl border border-neutral-300 font-medium text-neutral-900 focus:outline-none focus:border-black text-sm"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
              <span>Слов: <b>{writingText.trim().split(/\s+/).filter(Boolean).length}</b> / мин. {writingPrompt.minWords}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowModelAnswer(!showModelAnswer)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> {showModelAnswer ? 'Скрыть образец' : 'Показать образец'}
                </Button>
                <Button size="sm" onClick={handleWritingAnalyze}>
                  Анализ эссе
                </Button>
              </div>
            </div>

            {/* Writing Analysis Results */}
            {writingAnalysis && (
              <div className="mt-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                {writingAnalysis.isGibberish ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Случайный набор символов</span>
                      {writingAnalysis.feedbackMessage}
                    </div>
                  </div>
                ) : (
                  <>
                    {writingAnalysis.hasContractions && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        ⚠️ <b>Обнаружены неформальные сокращения (don't, can't и др.).</b> В академическом письме DET обязательно пишите раздельно: <i>do not, cannot</i>.
                      </div>
                    )}

                    {writingAnalysis.wordCount < writingPrompt.minWords && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        ⚠️ Написано {writingAnalysis.wordCount} из {writingPrompt.minWords} рекомендуемых слов. Для высокого балла Production стремитесь к более развернутому ответу.
                      </div>
                    )}

                    {writingAnalysis.suggestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" /> Рекомендации по лексике C1/C2 (VIP Vocab):
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {writingAnalysis.suggestions.map((s, i) => (
                            <div key={i} className="text-neutral-700 bg-white p-2.5 rounded-lg border border-neutral-200">
                              Замените простое <b>"{s.word}"</b> на продвинутые академические аналоги: <i className="text-emerald-700 font-semibold">{s.upgrades.join(', ')}</i>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Model Answer Preview */}
            {showModelAnswer && (
              <div className="mt-4 p-5 bg-[#E3F8ED] border border-[#0C2418]/20 rounded-2xl text-xs text-[#0C2418]">
                <span className="font-bold text-sm block mb-1">Образцовый академический ответ (Model Answer 130+ баллов):</span>
                <p className="leading-relaxed">{writingPrompt.modelAnswer}</p>
              </div>
            )}
          </div>
        )}
      </BentoCard>
    </div>
  );
};
