'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { speakPhotoBank, SpeakAboutPhotoQuestion } from '@/data/questionBank';
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
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Volume2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface SpeakAboutPhotoProps {
  onComplete?: (result?: SpeechEvaluationResult) => void;
  isStandaloneDrill?: boolean;
}

export const SpeakAboutPhoto: React.FC<SpeakAboutPhotoProps> = ({
  onComplete,
  isStandaloneDrill = false,
}) => {
  const { locale } = useSettingsStore();
  const [photoItem, setPhotoItem] = useState<SpeakAboutPhotoQuestion>(() => {
    return speakPhotoBank[Math.floor(Math.random() * speakPhotoBank.length)];
  });

  // Phases: PREP -> RECORDING -> REVIEW_ANALYSIS
  const [phase, setPhase] = useState<'PREP' | 'RECORDING' | 'ANALYSIS'>('PREP');
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number>(20);
  const [speakingSecondsLeft, setSpeakingSecondsLeft] = useState<number>(90);
  const [actualDuration, setActualDuration] = useState<number>(0);

  // Audio / Speech Recognition
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

  // Phase 1: Preparation Timer
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
    setSpeakingSecondsLeft(photoItem.speakTimeSec || 90);
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
      console.warn('Microphone permission not granted or unsupported:', err);
    }

    // 2. Web Speech Recognition for live transcript
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
        console.warn('SpeechRecognition failed to start:', err);
      }
    }

    // 3. Speaking timer
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

  // Stop recording & evaluate
  const stopRecording = (startTime?: number) => {
    if (speakTimerRef.current) clearInterval(speakTimerRef.current);
    sound.complete();

    const duration = startTime ? (Date.now() - startTime) / 1000 : 90 - speakingSecondsLeft;
    setActualDuration(duration);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    // Run AI speech evaluator
    setTimeout(() => {
      const currentTranscript = transcript.trim() || 'This photograph displays an active scene in a professional environment.';
      const evaluation = evaluateSpeechSample(currentTranscript, duration);
      setAnalysisResult(evaluation);
      setPhase('ANALYSIS');
    }, 400);
  };

  // Retry / retake
  const handleRetry = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setPhase('PREP');
    setPrepSecondsLeft(20);
    setSpeakingSecondsLeft(90);
    setTranscript('');
    setAnalysisResult(null);
    setShowModelAnswer(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
      <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Status & Timers */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-800 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black">
              <Mic className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                AI Speaking Studio
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Speak About the Photo (90s)
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
                  {locale === 'ru' ? 'Запись:' : 'Recording:'} {Math.floor(speakingSecondsLeft / 60)}:{speakingSecondsLeft % 60 < 10 ? `0${speakingSecondsLeft % 60}` : speakingSecondsLeft % 60}
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

        {/* Content Area */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left: Image Card */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full relative aspect-4/3 rounded-2xl overflow-hidden border border-neutral-700/80 bg-neutral-900 shadow-lg">
              <Image
                src={photoItem.imageUrl}
                alt={photoItem.altText}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 text-center">
              {locale === 'ru' ? 'Тематика:' : 'Topic:'} <span className="text-neutral-200 font-semibold">{photoItem.topic}</span>
            </p>
          </div>

          {/* Right: Interactive Interaction & Feedback */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            
            {phase === 'PREP' && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D2F544]" />
                    {locale === 'ru' ? 'Инструкция DET:' : 'DET Instructions:'}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                    {locale === 'ru'
                      ? 'Говорите непрерывно от 30 до 90 секунд. Опишите главное действие, окружение и сделайте предположение о происходящем.'
                      : 'Speak continuously for 30 to 90 seconds. Describe the main subject, setting, and make a speculation.'}
                  </p>
                </div>

                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1.5">
                  <span className="text-xs font-bold text-[#D2F544] block">
                    {locale === 'ru' ? '💡 Рекомендуемая структура описания:' : '💡 Recommended description structure:'}
                  </span>
                  <p>1. <strong>Main subject & action:</strong> In the foreground, a professional is...</p>
                  <p>2. <strong>Surroundings & setting:</strong> In the background, modern apparatus...</p>
                  <p>3. <strong>Speculation / Hypothesis:</strong> It appears that they might be...</p>
                </div>

                <Button
                  onClick={startRecording}
                  className="w-full bg-[#D2F544] text-[#0C2418] hover:bg-[#c3e839] font-black text-xs py-3 flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" /> {locale === 'ru' ? 'Начать говорить сейчас (пропустить таймер)' : 'Start speaking now (skip countdown)'}
                </Button>
              </div>
            )}

            {phase === 'RECORDING' && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    {locale === 'ru' ? 'Живая осциллограмма голоса:' : 'Live voice waveform:'}
                  </span>
                  <div className="mt-2">
                    <AudioWaveVisualizer
                      mediaStream={mediaStream}
                      isRecording={true}
                      height={75}
                      barColor="#D2F544"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-neutral-400 block mb-1">
                    {locale === 'ru' ? 'Распознанный транскрипт речи:' : 'Recognized speech transcript:'}
                  </span>
                  <div className="min-h-[70px] max-h-[120px] overflow-y-auto p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-mono leading-relaxed">
                    {transcript || (
                      <span className="text-neutral-500 italic">
                        {locale === 'ru'
                          ? 'Говорите в микрофон... Текст появится автоматически.'
                          : 'Speak into the microphone... Text will appear automatically.'}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => stopRecording()}
                  disabled={speakingSecondsLeft > 60}
                  className={`w-full font-black text-xs py-3 flex items-center justify-center gap-2 transition-all ${
                    speakingSecondsLeft > 60
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                  }`}
                >
                  <MicOff className="w-4 h-4" />
                  {speakingSecondsLeft > 60
                    ? (locale === 'ru'
                        ? `Говорите еще минимум ${speakingSecondsLeft - 60} сек.`
                        : `Speak for at least ${speakingSecondsLeft - 60}s more`)
                    : (locale === 'ru'
                        ? 'Завершить ответ и получить диагностику'
                        : 'Finish response & diagnose')}
                </Button>
              </div>
            )}

            {phase === 'ANALYSIS' && analysisResult && (
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                
                {/* Audio Playback Bar */}
                {recordedAudioUrl && (
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#D2F544]" />
                      <span className="text-xs font-bold text-white">
                        {locale === 'ru' ? 'Ваша аудиозапись' : 'Your recording'} ({Math.round(actualDuration)} {locale === 'ru' ? 'сек' : 'sec'})
                      </span>
                    </div>
                    <audio
                      ref={audioElementRef}
                      src={recordedAudioUrl}
                      controls
                      onPlay={() => setIsAudioPlaying(true)}
                      onPause={() => setIsAudioPlaying(false)}
                      onEnded={() => setIsAudioPlaying(false)}
                      className="h-8 max-w-[220px]"
                    />
                  </div>
                )}

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                      {locale === 'ru' ? 'Темп речи' : 'Speech Pace'}
                    </span>
                    <div className="text-lg font-black text-white mt-0.5">
                      {analysisResult.wpm} <span className="text-[10px] font-normal text-neutral-500">WPM</span>
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase ${
                      analysisResult.pacingRating === 'IDEAL' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {locale === 'ru'
                        ? (analysisResult.pacingRating === 'IDEAL' ? 'Идеальный' : 'Требует правки')
                        : (analysisResult.pacingRating === 'IDEAL' ? 'Ideal' : 'Needs Polish')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                      {locale === 'ru' ? 'Беглость (Fluency)' : 'Fluency'}
                    </span>
                    <div className="text-lg font-black text-[#D2F544] mt-0.5">
                      {analysisResult.fluencyScore}%
                    </div>
                    <span className="text-[9px] font-extrabold uppercase text-neutral-400">
                      DET ~{analysisResult.estimatedDetSubscore}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                      {locale === 'ru' ? 'Словарь C1/C2' : 'C1/C2 Lexicon'}
                    </span>
                    <div className="text-lg font-black text-purple-400 mt-0.5">
                      {analysisResult.cefrBreakdown.c1_c2_percentage}%
                    </div>
                    <span className="text-[9px] font-bold text-neutral-400">
                      {analysisResult.cefrBreakdown.c1_c2} {locale === 'ru' ? 'терминов' : 'terms'}
                    </span>
                  </div>
                </div>

                {/* Strengths & Tips */}
                <div className="space-y-2 text-xs">
                  {((locale === 'ru' ? analysisResult.strengthsRu : analysisResult.strengthsEn) || analysisResult.strengths).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
                      <strong className="flex items-center gap-1.5 mb-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {locale === 'ru' ? 'Сильные стороны:' : 'Key Strengths:'}
                      </strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-neutral-300">
                        {((locale === 'ru' ? (analysisResult.strengthsRu?.length ? analysisResult.strengthsRu : analysisResult.strengths) : (analysisResult.strengthsEn?.length ? analysisResult.strengthsEn : analysisResult.strengths))).map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(locale === 'ru' ? analysisResult.tipsRu : analysisResult.tipsEn).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200">
                      <strong className="flex items-center gap-1.5 mb-1 font-bold">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {locale === 'ru' ? 'Рекомендации ментора:' : 'Mentor Recommendations:'}
                      </strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-neutral-300">
                        {(locale === 'ru' ? analysisResult.tipsRu : analysisResult.tipsEn).map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Model Answer Toggle */}
                <div className="pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="text-xs font-bold text-[#D2F544] hover:underline flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {showModelAnswer
                      ? (locale === 'ru' ? 'Скрыть образцовый ответ C2' : 'Hide C2 Model Answer')
                      : (locale === 'ru' ? 'Показать образцовый ответ экзаменатора (C2)' : 'Show Examiner Model Answer (C2)')}
                  </button>

                  {showModelAnswer && (
                    <div className="mt-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-serif italic">
                      &quot;{photoItem.modelTranscript}&quot;
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleRetry}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {locale === 'ru' ? 'Пересдать запись' : 'Record Again'}
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
    </div>
  );
};
