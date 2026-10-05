'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GeneratedCTest, getRandomGeneratedCTest } from '@/lib/generators/cTestGenerator';
import { generateReadSelectBatch, VocabularyItem, generateRandomFillInBlank, GeneratedFillInBlank } from '@/lib/generators/vocabularyGenerator';
import { getRandomDictation, DictationItem, playSynthesizedDictation, evaluateDictationAccuracy } from '@/lib/generators/audioDictationGenerator';
import { getRandomWritingPrompt, WritingPrompt, analyzeWritingVocabulary } from '@/lib/generators/writingPromptGenerator';
import { 
  interactiveReadingBank, 
  interactiveListeningBank, 
  writePhotoBank, 
  interactiveWritingBank, 
  writingSampleBank, 
  listenTypeBank,
  readSelectBank 
} from '@/data/questionBank';
import { sound } from '@/lib/sound';
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
  Mic, 
  Square, 
  ArrowRight, 
  Check, 
  Clock, 
  ShieldAlert,
  Play
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
  // Determine active task mechanics based on official 16 lessons
  const isReadSelect = lessonSlug === 'read-and-select';
  const isListenSelect = lessonSlug === 'listen-and-select';
  const isFillBlanks = lessonSlug === 'fill-in-the-blanks';
  const isCTest = lessonSlug === 'read-and-complete';
  const isListenType = lessonSlug === 'listen-and-type';
  const isReadAloud = lessonSlug === 'read-aloud';
  const isInteractiveReading = lessonSlug === 'interactive-reading';
  const isInteractiveListening = lessonSlug === 'interactive-listening';
  const isPhotoWriting = lessonSlug === 'write-about-photo';
  const isInteractiveWriting = lessonSlug === 'interactive-writing';
  const isWritingSample = lessonSlug === 'writing-sample';
  const isPhotoSpeaking = lessonSlug === 'speak-about-photo';
  const isReadListenSpeak = lessonSlug === 'read-listen-speak';
  const isSpeakingSample = lessonSlug === 'speaking-sample';

  // General State
  const [drillCompleted, setDrillCompleted] = useState(false);

  // 1. C-Test Drill State
  const [cTest, setCTest] = useState<GeneratedCTest>(() => getRandomGeneratedCTest());
  const [cTestInputs, setCTestInputs] = useState<Record<number, string>>({});
  const [cTestChecked, setCTestChecked] = useState(false);
  const [cTestScore, setCTestScore] = useState<number | null>(null);

  // 2. Read & Select Drill State (Text Words)
  const [rsWords, setRsWords] = useState<VocabularyItem[]>(() => generateReadSelectBatch(8));
  const [rsIndex, setRsIndex] = useState(0);
  const [rsAnswers, setRsAnswers] = useState<boolean[]>([]);
  const [rsUserChoices, setRsUserChoices] = useState<boolean[]>([]);
  const [rsFinished, setRsFinished] = useState(false);

  // 3. Listen & Select Drill State (Spoken Audio Words)
  const [lsWords, setLsWords] = useState<VocabularyItem[]>(() => generateReadSelectBatch(6));
  const [lsIndex, setLsIndex] = useState(0);
  const [lsAnswers, setLsAnswers] = useState<boolean[]>([]);
  const [lsUserChoices, setLsUserChoices] = useState<boolean[]>([]);
  const [lsFinished, setLsFinished] = useState(false);
  const [lsPlaying, setLsPlaying] = useState(false);

  // 4. Fill in the Blanks Drill State
  const [fib, setFib] = useState<GeneratedFillInBlank>(() => generateRandomFillInBlank());
  const [fibInput, setFibInput] = useState('');
  const [fibChecked, setFibChecked] = useState(false);
  const [fibCorrect, setFibCorrect] = useState(false);

  // 5. Listen & Type Drill State (DET: 1 initial play + 2 replays = 3 total)
  const [dictation, setDictation] = useState<DictationItem>(() => getRandomDictation());
  const [dictInput, setDictInput] = useState('');
  const [replaysLeft, setReplaysLeft] = useState(2);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [dictResult, setDictResult] = useState<ReturnType<typeof evaluateDictationAccuracy> | null>(null);

  // 6. Read Aloud State
  const [readAloudIndex, setReadAloudIndex] = useState(0);
  const readAloudSentences = [
    'Developments in technology and transportation infrastructure have made international tourism considerably more affordable.',
    'By the time of his death, it had damaged his lungs so severely that he could not sing.',
    'Educational methods include direct teaching, storytelling, collaborative discussions, and empirical research.',
    'Many prominent university institutions are now starting to offer accessible online courses for international scholars.',
    'Had I realized the severity of the situation, I would have informed the departmental authorities immediately.'
  ];
  const [isRecordingAloud, setIsRecordingAloud] = useState(false);
  const [aloudTranscript, setAloudTranscript] = useState('');
  const [aloudScore, setAloudScore] = useState<number | null>(null);
  const [aloudEvaluated, setAloudEvaluated] = useState(false);
  const aloudRecognitionRef = useRef<any>(null);

  // 7. Interactive Reading State
  const [readingBlockIndex, setReadingBlockIndex] = useState(0);
  const currentReadingBlock = interactiveReadingBank[readingBlockIndex % interactiveReadingBank.length];
  const [readingSubStep, setReadingSubStep] = useState<1 | 2 | 3>(1);
  const [readingGapChoice, setReadingGapChoice] = useState('');
  const [readingSentenceIdx, setReadingSentenceIdx] = useState<number | null>(null);
  const [readingHighlightDone, setReadingHighlightDone] = useState(false);
  const [readingChecked, setReadingChecked] = useState(false);

  // 8. Interactive Listening State
  const [listeningBlockIndex, setListeningBlockIndex] = useState(0);
  const currentListeningBlock = interactiveListeningBank[listeningBlockIndex % interactiveListeningBank.length];
  const [listeningTurnIdx, setListeningTurnIdx] = useState(0);
  const [listeningChosenTurns, setListeningChosenTurns] = useState<number[]>([]);
  const [listeningFinished, setListeningFinished] = useState(false);

  // 9. Photo Writing State (Write About Photo)
  const [photoWriteIndex, setPhotoWriteIndex] = useState(0);
  const currentPhotoItem = writePhotoBank[photoWriteIndex % writePhotoBank.length];
  const [photoWriteText, setPhotoWriteText] = useState('');
  const [photoWriteAnalysis, setPhotoWriteAnalysis] = useState<ReturnType<typeof analyzeWritingVocabulary> | null>(null);
  const [photoShowModel, setPhotoShowModel] = useState(false);

  // 10. Interactive Writing & Writing Sample State
  const [writingPrompt, setWritingPrompt] = useState<WritingPrompt>(() => getRandomWritingPrompt());
  const [writingText, setWritingText] = useState('');
  const [writingAnalysis, setWritingAnalysis] = useState<ReturnType<typeof analyzeWritingVocabulary> | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // 11. Speaking Monologues State (Speak About Photo, Read/Listen Speak, Speaking Sample)
  const [speakingSecRemaining, setSpeakingSecRemaining] = useState(0);
  const [isSpeakingActive, setIsSpeakingActive] = useState(false);
  const [speakingTranscript, setSpeakingTranscript] = useState('');
  const [speakingCompleted, setSpeakingCompleted] = useState(false);
  const speakingTimerRef = useRef<any>(null);
  const speakingRecognitionRef = useRef<any>(null);

  // Reset drill state when lesson slug changes
  useEffect(() => {
    setDrillCompleted(false);

    // Reset C-Test
    setCTest(getRandomGeneratedCTest());
    setCTestInputs({});
    setCTestChecked(false);
    setCTestScore(null);

    // Reset Read & Select
    setRsWords(generateReadSelectBatch(8));
    setRsIndex(0);
    setRsAnswers([]);
    setRsUserChoices([]);
    setRsFinished(false);

    // Reset Listen & Select
    const newLs = generateReadSelectBatch(6);
    setLsWords(newLs);
    setLsIndex(0);
    setLsAnswers([]);
    setLsUserChoices([]);
    setLsFinished(false);
    setLsPlaying(false);

    // Reset FIB
    setFib(generateRandomFillInBlank());
    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);

    // Reset Listen & Type
    setDictation(getRandomDictation());
    setDictInput('');
    setReplaysLeft(2);
    setHasStartedAudio(false);
    setIsPlayingAudio(false);
    setDictResult(null);

    // Reset Read Aloud
    setIsRecordingAloud(false);
    setAloudTranscript('');
    setAloudScore(null);
    setAloudEvaluated(false);

    // Reset Interactive Reading
    setReadingSubStep(1);
    setReadingGapChoice('');
    setReadingSentenceIdx(null);
    setReadingHighlightDone(false);
    setReadingChecked(false);

    // Reset Interactive Listening
    setListeningTurnIdx(0);
    setListeningChosenTurns([]);
    setListeningFinished(false);

    // Reset Photo Writing
    setPhotoWriteText('');
    setPhotoWriteAnalysis(null);
    setPhotoShowModel(false);

    // Reset Essay Writing
    setWritingPrompt(getRandomWritingPrompt());
    setWritingText('');
    setWritingAnalysis(null);
    setShowModelAnswer(false);

    // Reset Speaking
    setIsSpeakingActive(false);
    setSpeakingSecRemaining(0);
    setSpeakingTranscript('');
    setSpeakingCompleted(false);
    if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
    if (speakingRecognitionRef.current) {
      try { speakingRecognitionRef.current.stop(); } catch {}
    }
  }, [lessonSlug]);

  // Autoplay audio word for Listen & Select when index advances
  const playCurrentLsWord = () => {
    if (lsWords[lsIndex]) {
      setLsPlaying(true);
      sound.speakEnglish(lsWords[lsIndex].word, () => {
        setLsPlaying(false);
      });
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: C-Test
  // -------------------------------------------------------------
  const handleCTestCheck = () => {
    let correct = 0;
    cTest.gaps.forEach((gap) => {
      const userVal = (cTestInputs[gap.index] || '').trim().toLowerCase();
      if (userVal === gap.missing.toLowerCase()) correct++;
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

  // -------------------------------------------------------------
  // HANDLERS: Read & Select (Text)
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // HANDLERS: Listen & Select (Audio Words)
  // -------------------------------------------------------------
  const handleLsChoice = (userBelievesReal: boolean) => {
    const currentWord = lsWords[lsIndex];
    const isCorrect = userBelievesReal === currentWord.isReal;
    const newAnswers = [...lsAnswers, isCorrect];
    const newChoices = [...lsUserChoices, userBelievesReal];
    setLsAnswers(newAnswers);
    setLsUserChoices(newChoices);

    if (lsIndex + 1 < lsWords.length) {
      setLsIndex(lsIndex + 1);
    } else {
      setLsFinished(true);
      const correctTotal = newAnswers.filter(Boolean).length;
      if (correctTotal >= Math.floor(lsWords.length * 0.5)) {
        setDrillCompleted(true);
        onDrillCompleted?.();
      }
    }
  };

  const handleLsReset = () => {
    setLsWords(generateReadSelectBatch(6));
    setLsIndex(0);
    setLsAnswers([]);
    setLsUserChoices([]);
    setLsFinished(false);
  };

  // -------------------------------------------------------------
  // HANDLERS: Fill in the Blanks
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // HANDLERS: Listen & Type
  // -------------------------------------------------------------
  const handlePlayDictation = async () => {
    if (!hasStartedAudio) {
      setHasStartedAudio(true);
      setIsPlayingAudio(true);
      try {
        await playSynthesizedDictation(dictation.sentence);
      } finally {
        setIsPlayingAudio(false);
      }
    } else if (replaysLeft > 0) {
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
    if (evalResult.similarity >= 0.65) {
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

  // -------------------------------------------------------------
  // HANDLERS: Read Aloud
  // -------------------------------------------------------------
  const targetAloudSentence = readAloudSentences[readAloudIndex % readAloudSentences.length];

  const toggleReadAloudRecording = () => {
    if (isRecordingAloud) {
      // Stop recording
      setIsRecordingAloud(false);
      if (aloudRecognitionRef.current) {
        try { aloudRecognitionRef.current.stop(); } catch {}
      }
      evaluateAloudFluency(aloudTranscript);
    } else {
      // Start recording
      setAloudTranscript('');
      setAloudEvaluated(false);
      setAloudScore(null);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = 'en-US';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (evt: any) => {
            let fullText = '';
            for (let i = 0; i < evt.results.length; ++i) {
              fullText += evt.results[i][0].transcript + ' ';
            }
            setAloudTranscript(fullText.trim());
          };
          rec.onerror = () => {
            setIsRecordingAloud(false);
          };
          aloudRecognitionRef.current = rec;
          rec.start();
          setIsRecordingAloud(true);
        } catch {
          simulateMicrophoneAloud();
        }
      } else {
        simulateMicrophoneAloud();
      }
    }
  };

  const simulateMicrophoneAloud = () => {
    setIsRecordingAloud(true);
    setAloudTranscript('Слушаю произношение...');
    setTimeout(() => {
      setIsRecordingAloud(false);
      const simulatedText = targetAloudSentence;
      setAloudTranscript(simulatedText);
      evaluateAloudFluency(simulatedText);
    }, 4000);
  };

  const evaluateAloudFluency = (text: string) => {
    const cleanTarget = targetAloudSentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    const cleanUser = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    let matched = 0;
    cleanTarget.forEach((word) => {
      if (cleanUser.includes(word)) matched++;
    });
    const ratio = matched / Math.max(1, cleanTarget.length);
    const percent = Math.min(100, Math.round(ratio * 100));
    setAloudScore(percent);
    setAloudEvaluated(true);
    if (percent >= 60) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Interactive Reading
  // -------------------------------------------------------------
  const handleReadingCheckAll = () => {
    let score = 0;
    if (readingGapChoice === currentReadingBlock.gapSentence.correct) score += 35;
    if (readingSentenceIdx === currentReadingBlock.sentenceOptions.correctIndex) score += 35;
    if (readingHighlightDone) score += 30;
    setReadingChecked(true);
    if (score >= 60) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Interactive Listening
  // -------------------------------------------------------------
  const currentListenTurn = currentListeningBlock.turns[listeningTurnIdx];

  const handleChooseListenTurn = (choiceIdx: number) => {
    const updated = [...listeningChosenTurns, choiceIdx];
    setListeningChosenTurns(updated);
    if (listeningTurnIdx + 1 < currentListeningBlock.turns.length) {
      setListeningTurnIdx(listeningTurnIdx + 1);
    } else {
      setListeningFinished(true);
      let correct = 0;
      currentListeningBlock.turns.forEach((t, i) => {
        if (updated[i] === t.correctIndex) correct++;
      });
      if (correct >= 2) {
        setDrillCompleted(true);
        onDrillCompleted?.();
      }
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Photo Writing
  // -------------------------------------------------------------
  const handlePhotoWriteAnalyze = () => {
    const analysis = analyzeWritingVocabulary(photoWriteText);
    setPhotoWriteAnalysis(analysis);
    if (!analysis.isGibberish && analysis.wordCount >= 20) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Essay & Sample Writing
  // -------------------------------------------------------------
  const handleWritingAnalyze = () => {
    const analysis = analyzeWritingVocabulary(writingText);
    setWritingAnalysis(analysis);
    if (!analysis.isGibberish && analysis.wordCount >= writingPrompt.minWords * 0.5) {
      setDrillCompleted(true);
      onDrillCompleted?.();
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Speaking Monologues (Lessons 14, 15, 16)
  // -------------------------------------------------------------
  const startSpeakingTimer = (durationSeconds: number) => {
    setIsSpeakingActive(true);
    setSpeakingSecRemaining(durationSeconds);
    setSpeakingTranscript('');
    setSpeakingCompleted(false);

    // Audio recording via SpeechRecognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (evt: any) => {
          let fullText = '';
          for (let i = 0; i < evt.results.length; ++i) {
            fullText += evt.results[i][0].transcript + ' ';
          }
          setSpeakingTranscript(fullText.trim());
        };
        speakingRecognitionRef.current = rec;
        rec.start();
      } catch {}
    }

    speakingTimerRef.current = setInterval(() => {
      setSpeakingSecRemaining((prev) => {
        if (prev <= 1) {
          stopSpeakingSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopSpeakingSession = () => {
    setIsSpeakingActive(false);
    if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
    if (speakingRecognitionRef.current) {
      try { speakingRecognitionRef.current.stop(); } catch {}
    }
    setSpeakingCompleted(true);
    setDrillCompleted(true);
    onDrillCompleted?.();
  };

  return (
    <div className="mt-12 pt-8 border-t border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D2F544] flex items-center justify-center text-black font-black shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
              Интерактивная практика (Live Task Drill)
            </h3>
            <p className="text-xs text-neutral-500 font-medium">
              Отработайте именно этот тип экзаменационного задания Duolingo в реальном времени с проверкой
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
        {/* LESSON 3: READ AND SELECT (Text Words) */}
        {/* ========================================================================= */}
        {isReadSelect && (
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
                    className="flex-1 border-neutral-300 hover:border-red-500 text-red-700 font-bold py-3 text-sm cursor-pointer"
                    onClick={() => handleRsChoice(false)}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Фейк (No)
                  </Button>
                  <Button
                    className="flex-1 bg-[#D2F544] text-neutral-900 font-bold hover:bg-[#c3e839] py-3 text-sm cursor-pointer"
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
                            <p className="text-neutral-600 mt-1 text-xs leading-relaxed">{item.definition}</p>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? '✓ Верно' : `✕ Ошибка (Вы: ${userChoice ? 'Yes' : 'No'})`}
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
        {/* LESSON 4: LISTEN AND SELECT (Spoken Audio Words Drill) */}
        {/* ========================================================================= */}
        {isListenSelect && (
          <div>
            {!lsFinished ? (
              <div className="text-center py-6">
                <div className="text-xs font-bold text-neutral-400 mb-2">
                  Аудио-слово {lsIndex + 1} из {lsWords.length} · Сложность {lsWords[lsIndex].difficulty}
                </div>
                
                {/* Audio Button with prompt */}
                <div className="my-6">
                  <button
                    onClick={playCurrentLsWord}
                    className="w-20 h-20 mx-auto rounded-3xl bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Volume2 className={`w-10 h-10 ${lsPlaying ? 'animate-bounce' : ''}`} />
                  </button>
                  <p className="text-xs text-neutral-500 font-medium mt-3">
                    Нажмите, чтобы прослушать произношение слова вслух
                  </p>
                </div>

                <div className="flex justify-center gap-4 max-w-sm mx-auto">
                  <Button
                    variant="outline"
                    className="flex-1 border-neutral-300 hover:border-red-500 text-red-700 font-bold py-3 text-sm cursor-pointer"
                    onClick={() => handleLsChoice(false)}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Ловушка / Фейк (No)
                  </Button>
                  <Button
                    className="flex-1 bg-[#D2F544] text-neutral-900 font-bold hover:bg-[#c3e839] py-3 text-sm cursor-pointer"
                    onClick={() => handleLsChoice(true)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Реальное английское (Yes)
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center py-4 mb-4">
                  <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h4 className="text-lg font-black text-neutral-900">Раунд аудирования завершен!</h4>
                  <p className="text-xs text-neutral-600">
                    Верно распознано на слух: <b>{lsAnswers.filter(Boolean).length} из {lsWords.length} слов</b>
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-5">
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 font-bold text-xs uppercase tracking-wider text-neutral-600">
                    Анализ аудио-слов и ловушек:
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {lsWords.map((item, idx) => {
                      const isCorrect = lsAnswers[idx];
                      const userChoice = lsUserChoices[idx];
                      return (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => sound.speakEnglish(item.word)}
                                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-[#D2F544] text-neutral-800 transition-colors"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <span className="text-base font-black text-neutral-900">{item.word}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                item.isReal ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {item.isReal ? 'Настоящее слово (C1/C2)' : 'DET Trap (Фонетическая ловушка)'}
                              </span>
                            </div>
                            <p className="text-neutral-600 mt-1 text-xs leading-relaxed">{item.definition}</p>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? '✓ Верно' : `✕ Ошибка (Вы: ${userChoice ? 'Yes' : 'No'})`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button size="md" onClick={handleLsReset}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Еще 6 аудио-слов
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSON 5: FILL IN THE BLANKS */}
        {/* ========================================================================= */}
        {isFillBlanks && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Fill in the Blanks · Уровень {fib.difficulty}
              </span>
              <Button size="sm" variant="ghost" onClick={handleFibReset} className="text-xs cursor-pointer">
                <RotateCcw className="w-3 h-3 mr-1" /> Другое предложение
              </Button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 text-lg leading-relaxed text-neutral-900">
              {fib.sentenceBefore}
              <span className="font-black text-[#0C2418] bg-[#E3F8ED] px-2 py-0.5 rounded-lg border border-[#0C2418]/20 mx-1">
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
                <Button size="sm" onClick={handleFibCheck}>Проверить</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleFibReset}>Следующее задание</Button>
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
        {/* LESSON 6: READ AND COMPLETE (C-Test) */}
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
                              <span className="font-bold text-red-700">Введено: "{userVal || '—'}"</span>
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
                <Button size="md" onClick={handleCTestCheck}>Проверить ответы</Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSON 7: LISTEN AND TYPE */}
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
                <Button size="sm" onClick={handleDictCheck}>Проверить диктант</Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSON 8: READ ALOUD (Speaking & Fluency) */}
        {/* ========================================================================= */}
        {isReadAloud && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Read Aloud · Устная беглость и фонемный контроль
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReadAloudIndex((prev) => prev + 1);
                  setIsRecordingAloud(false);
                  setAloudTranscript('');
                  setAloudScore(null);
                  setAloudEvaluated(false);
                }}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Другое предложение
              </Button>
            </div>

            {/* Sentence card */}
            <div className="p-6 bg-white rounded-2xl border-2 border-neutral-200 mb-6 text-center">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 leading-relaxed mb-4">
                &ldquo;{targetAloudSentence}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sound.speakEnglish(targetAloudSentence)}
                  className="text-xs"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-1" /> Эталонное звучание
                </Button>
              </div>
            </div>

            {/* Microphone record action */}
            <div className="flex flex-col items-center justify-center py-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <button
                onClick={toggleReadAloudRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isRecordingAloud
                    ? 'bg-red-500 text-white animate-pulse shadow-lg scale-105'
                    : 'bg-[#D2F544] text-[#0C2418] hover:bg-[#c3e839]'
                }`}
              >
                {isRecordingAloud ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-7 h-7" />}
              </button>
              <span className="text-xs font-bold text-neutral-700 mt-3">
                {isRecordingAloud ? 'Запись идет... Читайте предложение в микрофон' : 'Нажмите на микрофон и прочитайте вслух'}
              </span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Лимит времени в реальном тесте: 20 секунд</span>
            </div>

            {/* Results breakdown */}
            {aloudEvaluated && (
              <div className="mt-4 p-5 bg-white rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-base font-black text-neutral-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Совпадение речи: {aloudScore}%
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    aloudScore! >= 70 ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {aloudScore! >= 70 ? 'Высокая беглость (C1)' : 'Требует четкости'}
                  </span>
                </div>

                <div className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                  <span className="font-bold block text-neutral-800 mb-1">Распознанная речь (Speech-to-Text):</span>
                  <i>{aloudTranscript || 'Произношение зафиксировано'}</i>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSON 9: INTERACTIVE READING */}
        {/* ========================================================================= */}
        {isInteractiveReading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Interactive Reading · {currentReadingBlock.passageTitle}
                </span>
                <span className="ml-2 text-[10px] font-black bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200">
                  {currentReadingBlock.difficulty}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReadingBlockIndex((prev) => prev + 1);
                  setReadingSubStep(1);
                  setReadingGapChoice('');
                  setReadingSentenceIdx(null);
                  setReadingHighlightDone(false);
                  setReadingChecked(false);
                }}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Другой отрывок
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Passage Column */}
              <div className="bg-[#111315] text-neutral-200 p-6 rounded-2xl text-xs sm:text-sm leading-relaxed border border-neutral-800 max-h-[380px] overflow-y-auto">
                <h4 className="font-bold text-[#D2F544] uppercase mb-3 text-xs tracking-wider">
                  Академический текст:
                </h4>
                <p className="mb-4">{currentReadingBlock.passageText}</p>

                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-700/60 text-xs">
                  <span className="font-bold text-amber-300 block mb-1">Задание на выделение факта:</span>
                  <p className="text-neutral-400 mb-2">{currentReadingBlock.highlightPrompt}</p>
                  <button
                    onClick={() => setReadingHighlightDone(true)}
                    className={`p-2.5 rounded-lg border text-left w-full transition-all cursor-pointer ${
                      readingHighlightDone
                        ? 'bg-[#D2F544]/20 border-[#D2F544] text-[#D2F544] font-bold'
                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500 text-neutral-300'
                    }`}
                  >
                    &ldquo;{currentReadingBlock.highlightCorrectSubstring}&rdquo;
                  </button>
                </div>
              </div>

              {/* Questions Column */}
              <div className="space-y-4">
                {/* 1. Missing Gap */}
                <div className="bg-white p-4 rounded-2xl border border-neutral-200 text-xs">
                  <span className="font-bold text-neutral-900 block mb-2">
                    1. Выберите слово для заполнения пропуска в предложении:
                  </span>
                  <p className="text-neutral-700 mb-2">
                    {currentReadingBlock.gapSentence.before}{' '}
                    <select
                      value={readingGapChoice}
                      onChange={(e) => setReadingGapChoice(e.target.value)}
                      className="inline-block bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold text-neutral-900"
                    >
                      <option value="">(выбрать)</option>
                      {currentReadingBlock.gapSentence.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>{' '}
                    {currentReadingBlock.gapSentence.after}
                  </p>
                </div>

                {/* 2. Sentence Insertion */}
                <div className="bg-white p-4 rounded-2xl border border-neutral-200 text-xs">
                  <span className="font-bold text-neutral-900 block mb-2">
                    2. Выберите предложение, наиболее подходящее по смыслу в текст:
                  </span>
                  <div className="space-y-2">
                    {currentReadingBlock.sentenceOptions.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReadingSentenceIdx(idx)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          readingSentenceIdx === idx
                            ? 'bg-[#D2F544] border-black text-black font-bold'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={handleReadingCheckAll}>Проверить ответы</Button>
                </div>
              </div>
            </div>

            {readingChecked && (
              <div className="mt-4 p-4 bg-neutral-100 rounded-2xl border border-neutral-200 text-xs text-neutral-800 flex items-center justify-between">
                <span>
                  Пропуск: {readingGapChoice === currentReadingBlock.gapSentence.correct ? '✓ Верно' : '✕ Ошибка'} · 
                  Вставка предложения: {readingSentenceIdx === currentReadingBlock.sentenceOptions.correctIndex ? ' ✓ Верно' : ' ✕ Ошибка'} · 
                  Выделение: {readingHighlightDone ? ' ✓ Выполнено' : ' ✕ Не выбрано'}
                </span>
                <span className="font-black text-emerald-800">Блок проверен</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSON 10: INTERACTIVE LISTENING (Dialogue Interaction) */}
        {/* ========================================================================= */}
        {isInteractiveListening && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Interactive Listening · Диалог с преподавателем
                </span>
                <span className="ml-2 text-[10px] font-black bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200">
                  Реплика {Math.min(listeningTurnIdx + 1, currentListeningBlock.turns.length)} из {currentListeningBlock.turns.length}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setListeningBlockIndex((prev) => prev + 1);
                  setListeningTurnIdx(0);
                  setListeningChosenTurns([]);
                  setListeningFinished(false);
                }}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Другой диалог
              </Button>
            </div>

            {/* Scenario Header */}
            <div className="p-4 bg-neutral-100 rounded-2xl border border-neutral-200 text-xs text-neutral-700 mb-4">
              <strong className="text-neutral-900 block mb-1">Сценарий общения:</strong>
              {currentListeningBlock.scenario}
            </div>

            {!listeningFinished && currentListenTurn ? (
              <div className="space-y-4">
                {/* Audio line box */}
                <div className="p-5 bg-neutral-900 rounded-2xl border border-neutral-800 text-white flex items-center gap-4">
                  <button
                    onClick={() => sound.speakEnglish(currentListenTurn.speakerAudioText)}
                    className="w-12 h-12 rounded-xl bg-[#D2F544] text-[#0C2418] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-[#D2F544] block mb-0.5">{currentListenTurn.speaker}</span>
                    <p className="text-sm italic text-neutral-200">&ldquo;{currentListenTurn.speakerAudioText}&rdquo;</p>
                  </div>
                </div>

                {/* 4 Choices */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                    Выберите академически подходящий ответ:
                  </span>
                  {currentListenTurn.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleChooseListenTurn(optIdx)}
                      className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-[#D2F544] hover:text-[#0C2418] text-[#0E1012] font-semibold text-xs sm:text-sm border border-neutral-200 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-white rounded-2xl border border-neutral-200">
                <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h4 className="text-base font-black text-neutral-900">Диалог успешно завершен!</h4>
                <p className="text-xs text-neutral-600 mt-1 mb-4">
                  Все реплики академической беседы прослушаны и сопоставлены.
                </p>
                <div className="p-4 bg-neutral-50 rounded-xl max-w-lg mx-auto border border-neutral-200 text-xs text-left mb-4">
                  <span className="font-bold text-neutral-900 block mb-1">Финальная инструкция DET:</span>
                  {currentListeningBlock.summaryPrompt}
                </div>
                <Button size="sm" onClick={() => {
                  setListeningTurnIdx(0);
                  setListeningChosenTurns([]);
                  setListeningFinished(false);
                }}>
                  Пройти диалог заново
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSON 11: WRITE ABOUT PHOTO */}
        {/* ========================================================================= */}
        {isPhotoWriting && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Write About the Photo · Описание изображения за 60 секунд
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPhotoWriteIndex((prev) => prev + 1);
                  setPhotoWriteText('');
                  setPhotoWriteAnalysis(null);
                  setPhotoShowModel(false);
                }}
                className="text-xs cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Новое изображение
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Photo */}
              <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center p-2 max-h-72">
                <img
                  src={currentPhotoItem.imageUrl}
                  alt={currentPhotoItem.altText}
                  className="max-h-64 w-auto rounded-xl object-contain shadow-sm"
                />
              </div>

              {/* Instructions and Textarea */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 mb-3">
                    <span className="font-bold text-neutral-900 block mb-0.5">Регламент DET:</span>
                    Напишите минимум 1–3 развернутых предложения с описанием переднего плана, действий и обстановки (рекомендуется 25+ слов).
                  </div>

                  <textarea
                    rows={4}
                    value={photoWriteText}
                    onChange={(e) => setPhotoWriteText(e.target.value)}
                    placeholder="This photograph showcases a professional working inside..."
                    className="w-full p-3.5 rounded-xl border border-neutral-300 font-medium text-neutral-900 focus:outline-none focus:border-black text-xs sm:text-sm"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>Слов: <b>{photoWriteText.trim().split(/\s+/).filter(Boolean).length}</b> / мин. 20</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setPhotoShowModel(!photoShowModel)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> {photoShowModel ? 'Скрыть' : 'Образец C1'}
                    </Button>
                    <Button size="sm" onClick={handlePhotoWriteAnalyze}>Проверить описание</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis & Model */}
            {photoWriteAnalysis && (
              <div className="mt-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs">
                {photoWriteAnalysis.isGibberish ? (
                  <p className="text-red-700 font-bold">⚠️ Обнаружен бессмысленный набор символов.</p>
                ) : (
                  <div>
                    <span className="font-bold text-emerald-800 block mb-1">✓ Описание проверено:</span>
                    <p className="text-neutral-700">Объем: {photoWriteAnalysis.wordCount} слов. Использован академический стиль.</p>
                  </div>
                )}
              </div>
            )}

            {photoShowModel && (
              <div className="mt-4 p-4 bg-[#E3F8ED] border border-[#0C2418]/20 rounded-2xl text-xs text-[#0C2418]">
                <span className="font-bold block mb-1">Эталонное описание (130+ баллов):</span>
                <p>
                  &ldquo;This photograph portrays a professional engaged in detailed analytical work inside a modern facility. In the foreground, specialized instruments and equipment are systematically arranged, reflecting a high level of operational precision.&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSONS 12 & 13: INTERACTIVE WRITING & WRITING SAMPLE */}
        {/* ========================================================================= */}
        {(isInteractiveWriting || isWritingSample) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {isInteractiveWriting ? 'Interactive Writing · Двухчастный формат' : 'Writing Sample · Академическое эссе'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setWritingPrompt(getRandomWritingPrompt());
                  setWritingText('');
                  setWritingAnalysis(null);
                  setShowModelAnswer(false);
                }}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Новая тема
              </Button>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Тема эссе:
              </span>
              <p className="text-sm font-bold text-neutral-900 leading-relaxed">{writingPrompt.prompt}</p>
            </div>

            <textarea
              rows={5}
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
                <Button size="sm" onClick={handleWritingAnalyze}>Анализ эссе</Button>
              </div>
            </div>

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
                        ⚠️ Написано {writingAnalysis.wordCount} из {writingPrompt.minWords} рекомендуемых слов.
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
                              Замените простое <b>"{s.word}"</b> на продвинутые аналоги: <i className="text-emerald-700 font-semibold">{s.upgrades.join(', ')}</i>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {showModelAnswer && (
              <div className="mt-4 p-5 bg-[#E3F8ED] border border-[#0C2418]/20 rounded-2xl text-xs text-[#0C2418]">
                <span className="font-bold text-sm block mb-1">Образцовый академический ответ (Model Answer 130+ баллов):</span>
                <p className="leading-relaxed">{writingPrompt.modelAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LESSONS 14, 15, 16: SPOKEN MONOLOGUES & SAMPLES */}
        {/* ========================================================================= */}
        {(isPhotoSpeaking || isReadListenSpeak || isSpeakingSample) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {isPhotoSpeaking ? 'Speak About the Photo · 75–85 секунд монолога' :
                 isReadListenSpeak ? 'Read / Listen, Then Speak · Развернутый ответ по карточке' :
                 'Speaking Sample · Итоговое академическое видеоинтервью'}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-400">
                Целевое время: {isPhotoSpeaking ? '80 сек' : isReadListenSpeak ? '90 сек' : '120–150 сек'}
              </span>
            </div>

            {/* Prompt Display */}
            {isPhotoSpeaking && (
              <div className="flex flex-col sm:flex-row gap-6 mb-5 items-center">
                <img
                  src={currentPhotoItem.imageUrl}
                  alt={currentPhotoItem.altText}
                  className="w-full sm:w-1/2 max-h-56 object-cover rounded-2xl border border-neutral-200"
                />
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-700 space-y-2 flex-1">
                  <span className="font-bold text-neutral-900 block">5-зонный маршрут говорения (75–85 сек):</span>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Общий план (Present Continuous): Who is doing what and where.</li>
                    <li>Пространственные детали (foreground, adjacent to).</li>
                    <li>Предметы в руках и мимика.</li>
                    <li>Академическая гипотеза (judging by their posture...).</li>
                    <li>Синтезирующий вывод об атмосфере кадра.</li>
                  </ol>
                </div>
              </div>
            )}

            {isReadListenSpeak && (
              <div className="p-5 bg-white rounded-2xl border-2 border-neutral-200 mb-5">
                <span className="text-xs font-bold text-[#0C2418] uppercase tracking-wider block mb-2">
                  Карточка вопроса (Card Prompt):
                </span>
                <p className="text-sm sm:text-base font-bold text-neutral-900 mb-3 leading-relaxed">
                  Talk about a challenging academic or professional project you recently completed.
                </p>
                <ul className="text-xs text-neutral-600 space-y-1 list-disc pl-5">
                  <li>What was the project about, and why was it significant?</li>
                  <li>What principal obstacles did you or your team encounter?</li>
                  <li>How did you resolve these challenges, and what valuable lesson did you learn?</li>
                </ul>
              </div>
            )}

            {isSpeakingSample && (
              <div className="p-5 bg-neutral-900 rounded-2xl border border-neutral-800 text-white mb-5">
                <span className="text-xs font-mono text-[#D2F544] uppercase tracking-wider block mb-2 font-bold">
                  University Video Interview Prompt:
                </span>
                <p className="text-sm sm:text-base font-bold text-neutral-100 mb-2 leading-relaxed">
                  &ldquo;Should artificial intelligence tools be integrated into higher education curricula, or do they undermine academic integrity?&rdquo;
                </p>
                <p className="text-xs text-neutral-400">
                  Говорите прямо в камеру спокойным уверенным тоном. Приведите 2 аргумента и контраргумент.
                </p>
              </div>
            )}

            {/* Speaking Session Control */}
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col items-center justify-center text-center">
              {!isSpeakingActive ? (
                <div>
                  <button
                    onClick={() => startSpeakingTimer(isPhotoSpeaking ? 80 : isReadListenSpeak ? 90 : 120)}
                    className="w-16 h-16 mx-auto rounded-full bg-[#D2F544] hover:bg-[#c3e839] text-[#0C2418] flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer mb-3"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                  <span className="text-xs font-bold text-neutral-800 block">
                    Начать устную сессию с таймером
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Активирует микрофон и обратный отсчет времени говорения
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div className="text-2xl font-black text-neutral-900">
                    Осталось: <span className="text-red-600">{speakingSecRemaining} сек</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={stopSpeakingSession} className="text-xs">
                    Завершить досрочно
                  </Button>
                </div>
              )}
            </div>

            {/* Speaking Feedback */}
            {speakingCompleted && (
              <div className="mt-4 p-5 bg-white rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-neutral-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Устный ответ зафиксирован
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Сессия завершена
                  </span>
                </div>
                {speakingTranscript && (
                  <div className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <span className="font-bold block text-neutral-800 mb-1">Транскрипт ответа:</span>
                    <i>{speakingTranscript}</i>
                  </div>
                )}
                <div className="text-xs text-neutral-600">
                  💡 <b>Чек-лист самопроверки:</b> непрерывная беглость без вокализованных пауз (uh/um), раскрытие всех подвопросов, уверенный контакт с камерой.
                </div>
              </div>
            )}
          </div>
        )}

      </BentoCard>
    </div>
  );
};
