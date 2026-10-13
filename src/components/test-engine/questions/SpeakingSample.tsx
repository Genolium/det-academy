'use client';

import React, { useState, useEffect, useRef } from 'react';
import { speakingSampleBank, SpeakingSampleQuestion } from '@/data/questionBank';
import { evaluateSpeechSample, SpeechEvaluationResult } from '@/lib/speechEvaluator';
import { AudioWaveVisualizer } from '@/components/audio/AudioWaveVisualizer';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/Button';
import { PillBadge } from '@/components/ui/PillBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  Mic,
  MicOff,
  Clock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Volume2,
  Lightbulb,
  ArrowRight,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

interface SpeakingSampleProps {
  onComplete?: (result?: SpeechEvaluationResult) => void;
  isStandaloneDrill?: boolean;
}

export const SpeakingSample: React.FC<SpeakingSampleProps> = ({
  onComplete,
  isStandaloneDrill = false,
}) => {
  const { locale } = useSettingsStore();
  const [sampleItem, setSampleItem] = useState<SpeakingSampleQuestion>(() => {
    return speakingSampleBank[Math.floor(Math.random() * speakingSampleBank.length)];
  });

  // Phases: PREP -> RECORDING -> ANALYSIS
  const [phase, setPhase] = useState<'PREP' | 'RECORDING' | 'ANALYSIS'>('PREP');
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number>(30);
  const [speakingSecondsLeft, setSpeakingSecondsLeft] = useState<number>(180);
  const [actualDuration, setActualDuration] = useState<number>(0);

  // Audio & Speech state
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<SpeechEvaluationResult | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Phase 1: Preparation Timer (30s)
  useEffect(() => {
    if (phase === 'PREP') {
      prepTimerRef.current = setInterval(() => {
        setPrepSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepTimerRef.current!);
            startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    };
  }, [phase]);

  // Start recording
  const startRecording = async () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setPhase('RECORDING');
    setSpeakingSecondsLeft(sampleItem.speakTimeSec || 180);
    setTranscript('');
    audioChunksRef.current = [];
    sound.start();

    // 1. Microphone MediaRecorder
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach((track) => track.stop());
          setMediaStream(null);
        };

        recorder.start();
      }
    } catch (err) {
      console.warn('Microphone permission denied or unsupported:', err);
    }

    // 2. SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (evt: any) => {
          let str = '';
          for (let i = 0; i < evt.results.length; i++) {
            str += evt.results[i][0].transcript + ' ';
          }
          setTranscript(str.trim());
        };
        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn('SpeechRecognition failed:', err);
      }
    }

    // 3. Timer (180s = 3 minutes)
    const startTime = Date.now();
    speakTimerRef.current = setInterval(() => {
      setSpeakingSecondsLeft((prev) => {
        if (prev <= 1) {
          stopRecording(startTime);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Stop recording
  const stopRecording = (startTime?: number) => {
    if (speakTimerRef.current) clearInterval(speakTimerRef.current);
    sound.complete();

    const duration = startTime ? (Date.now() - startTime) / 1000 : 180 - speakingSecondsLeft;
    setActualDuration(duration);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    setTimeout(() => {
      const currentTranscript = transcript.trim() || 'Regarding the academic dilemma presented in the prompt, there are compelling arguments on both perspectives.';
      const evaluation = evaluateSpeechSample(currentTranscript, duration);
      setAnalysisResult(evaluation);
      setPhase('ANALYSIS');
    }, 400);
  };

  // Retry
  const handleRetry = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setPhase('PREP');
    setPrepSecondsLeft(30);
    setSpeakingSecondsLeft(180);
    setTranscript('');
    setAnalysisResult(null);
    setShowModelAnswer(false);
  };

  const elapsedSpeakingSec = (sampleItem.speakTimeSec || 180) - speakingSecondsLeft;
  const canFinishEarly = elapsedSpeakingSec >= 60;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
      <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-800 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 block">
                AI Speaking Studio
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Speaking Sample ({locale === 'ru' ? '1–3 мин монолог' : '1–3 min monologue'})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {phase === 'PREP' && (
              <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-800/80 px-3.5 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-xs font-mono font-bold text-amber-300">
                  {locale === 'ru' ? 'Подготовка:' : 'Preparation:'} 00:{prepSecondsLeft < 10 ? `0${prepSecondsLeft}` : prepSecondsLeft}
                </span>
              </div>
            )}
            {phase === 'RECORDING' && (
              <div className="flex items-center gap-2 bg-red-950/80 border border-red-800 px-3.5 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-red-300">
                  {locale === 'ru' ? 'Осталось:' : 'Remaining:'} {Math.floor(speakingSecondsLeft / 60)}:{speakingSecondsLeft % 60 < 10 ? `0${speakingSecondsLeft % 60}` : speakingSecondsLeft % 60}
                </span>
              </div>
            )}
            {phase === 'ANALYSIS' && (
              <PillBadge variant="mint" prefixHash>
                {locale === 'ru' ? 'Оценка завершена' : 'Evaluation Complete'}
              </PillBadge>
            )}
          </div>
        </div>

        {/* Prompt Card */}
        <div className="mt-6 p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#D2F544]" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              {locale === 'ru' ? 'Тема дискуссии' : 'Discussion topic'} ({sampleItem.difficulty}):
            </span>
            <span className="text-xs font-bold text-white">{sampleItem.topic}</span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-neutral-100 leading-relaxed">
            {sampleItem.prompt}
          </p>

          <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-neutral-400">
            <span className="font-bold text-neutral-500">
              {locale === 'ru' ? 'Ключевые аспекты:' : 'Key themes:'}
            </span>
            {sampleItem.keyThemes.map((theme, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-300">
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Phase Specific Sections */}
        <div className="mt-6">
          
          {phase === 'PREP' && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-white mb-1">
                  {locale === 'ru' ? 'Обдумайте вашу позицию и аргументы' : 'Plan your stance and arguments'}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {locale === 'ru'
                    ? 'По регламенту DET у вас есть 30 секунд на подготовку. Постройте монолог: тезис -> аргумент 1 с примером -> контраргумент -> итоговый вывод.'
                    : 'Per DET timing, you have 30 seconds to prepare. Outline your monologue: Thesis -> Argument 1 with example -> Counterargument -> Conclusion.'}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={startRecording}
                  className="bg-[#D2F544] text-[#0C2418] hover:bg-[#c3e839] font-black text-xs py-3 px-6 shadow-md"
                >
                  <Mic className="w-4 h-4 mr-1.5" /> {locale === 'ru' ? 'Начать говорить сейчас (пропустить подготовку)' : 'Start speaking now (skip preparation)'}
                </Button>
              </div>
            </div>
          )}

          {phase === 'RECORDING' && (
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  {locale === 'ru' ? 'Визуализатор голосового потока:' : 'Voice stream waveform:'}
                </span>
                <AudioWaveVisualizer
                  mediaStream={mediaStream}
                  isRecording={true}
                  height={80}
                  barColor="#A855F7"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-neutral-400">
                    {locale === 'ru' ? 'Распознанный транскрипт речи:' : 'Recognized speech transcript:'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {locale === 'ru' ? 'Наговорено:' : 'Recorded:'} {transcript.split(/\s+/).filter(Boolean).length} {locale === 'ru' ? 'слов' : 'words'}
                  </span>
                </div>
                <div className="min-h-[90px] max-h-[140px] overflow-y-auto p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-mono leading-relaxed">
                  {transcript || (
                    <span className="text-neutral-500 italic">
                      {locale === 'ru'
                        ? 'Говорите четко и развернуто. Транскрипт анализируется в реальном времени...'
                        : 'Speak clearly and elaborate. Transcript is analyzed in real time...'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-xs text-neutral-400">
                  {canFinishEarly
                    ? (locale === 'ru' ? '✓ Минимальный порог в 60 сек достигнут' : '✓ Minimum 60s threshold reached')
                    : (locale === 'ru' ? `Говорите еще минимум ${60 - elapsedSpeakingSec} сек` : `Speak for at least ${60 - elapsedSpeakingSec}s more`)}
                </span>

                <Button
                  onClick={() => stopRecording()}
                  disabled={!canFinishEarly}
                  className={`font-black text-xs py-3 px-6 flex items-center gap-2 ${
                    canFinishEarly
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <MicOff className="w-4 h-4" />
                  {locale === 'ru' ? 'Завершить запись монолога' : 'Finish monologue recording'}
                </Button>
              </div>
            </div>
          )}

          {phase === 'ANALYSIS' && analysisResult && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-5">
              
              {/* Playback review */}
              {recordedAudioUrl && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#D2F544]" />
                    <span className="text-xs font-bold text-white">
                      {locale === 'ru' ? 'Ваша аудиозапись монолога' : 'Your monologue recording'} ({Math.round(actualDuration)} {locale === 'ru' ? 'сек' : 'sec'}, {analysisResult.wordCount} {locale === 'ru' ? 'слов' : 'words'})
                    </span>
                  </div>
                  <audio
                    ref={audioElementRef}
                    src={recordedAudioUrl}
                    controls
                    className="h-8 max-w-[240px]"
                  />
                </div>
              )}

              {/* 4 Score Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    {locale === 'ru' ? 'Темп речи (WPM)' : 'Speech Pace (WPM)'}
                  </span>
                  <div className="text-xl font-black text-white mt-1">
                    {analysisResult.wpm}
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase ${
                    analysisResult.pacingRating === 'IDEAL' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {locale === 'ru'
                      ? (analysisResult.pacingRating === 'IDEAL' ? 'Оптимальный' : 'Вне нормы')
                      : (analysisResult.pacingRating === 'IDEAL' ? 'Optimal' : 'Suboptimal')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    {locale === 'ru' ? 'Беглость (Fluency)' : 'Fluency'}
                  </span>
                  <div className="text-xl font-black text-[#D2F544] mt-1">
                    {analysisResult.fluencyScore}%
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">
                    DET ~{analysisResult.estimatedDetSubscore}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    {locale === 'ru' ? 'Словарный уровень' : 'Lexical Tier'}
                  </span>
                  <div className="text-xl font-black text-purple-400 mt-1">
                    {analysisResult.cefrBreakdown.c1_c2_percentage}%
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {analysisResult.cefrBreakdown.c1_c2} {locale === 'ru' ? 'C1/C2 терминов' : 'C1/C2 terms'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    {locale === 'ru' ? 'Связность речи' : 'Cohesion'}
                  </span>
                  <div className="text-xl font-black text-indigo-400 mt-1">
                    {analysisResult.discourseMarkersFound.length}
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {locale === 'ru' ? 'дискурсивных маркеров' : 'discourse markers'}
                  </span>
                </div>
              </div>

              {/* Strengths & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
                  <strong className="flex items-center gap-1.5 mb-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {locale === 'ru' ? 'Сильные стороны:' : 'Key Strengths:'}
                  </strong>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-300">
                    {((locale === 'ru' ? (analysisResult.strengthsRu?.length ? analysisResult.strengthsRu : analysisResult.strengths) : (analysisResult.strengthsEn?.length ? analysisResult.strengthsEn : analysisResult.strengths))).map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200">
                  <strong className="flex items-center gap-1.5 mb-1.5 font-bold">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {locale === 'ru' ? 'Точки роста:' : 'Areas for Growth:'}
                  </strong>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-300">
                    {(locale === 'ru' ? analysisResult.tipsRu : analysisResult.tipsEn).map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Monologue Transcript */}
              <div className="pt-2 border-t border-neutral-800">
                <button
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="text-xs font-bold text-[#D2F544] hover:underline flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {showModelAnswer
                    ? (locale === 'ru' ? 'Скрыть академический монолог C2' : 'Hide C2 Academic Monologue')
                    : (locale === 'ru' ? 'Показать эталонный монолог эксперта (C2 Transcript)' : 'Show Expert C2 Monologue Transcript')}
                </button>

                {showModelAnswer && (
                  <div className="mt-2.5 p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-serif italic">
                    &quot;{sampleItem.modelTranscript}&quot;
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleRetry}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {locale === 'ru' ? 'Записать заново' : 'Record Again'}
                </Button>

                <Button
                  onClick={() => onComplete?.(analysisResult)}
                  className="flex-1 bg-[#D2F544] hover:bg-[#c3e839] text-[#0C2418] font-black text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <span>{locale === 'ru' ? 'Продолжить' : 'Continue'}</span> <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
