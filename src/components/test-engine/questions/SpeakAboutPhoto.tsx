'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useAudioRecorder } from '@/lib/useAudioRecorder';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Mic, Clock, ArrowRight, AlertCircle, Volume2 } from 'lucide-react';

interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}

type WindowWithSpeech = Window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
};

interface SpeakAboutPhotoProps {
  onComplete: () => void;
  isStandaloneDrill?: boolean;
}

export const SpeakAboutPhoto: React.FC<SpeakAboutPhotoProps> = ({ onComplete }) => {
  const { recordSpeakingResult, serverQuestions, backendSessionId } = useTestStore();
  const audioRecorder = useAudioRecorder();

  // Find question payload if available from server
  const serverQ = serverQuestions.find((q) => q.type === 'SPEAK_PHOTO');
  const payload = (serverQ?.contentPayload || {}) as { imageUrl?: string; prompt?: string };
  const promptText = payload.prompt || 'Speak for at least 90 seconds about the scene shown below. Describe the setting, what the subjects are doing, and what might happen next.';
  const imageSource = payload.imageUrl || '/images/practice/engineering-workshop.jpg';

  const [phase, setPhase] = useState<'prep' | 'speaking'>('prep');
  const [timeLeft, setTimeLeft] = useState(20); // 20s prep, then 90s speech
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const isCompletedRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleFinish = async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recordedBlob = await audioRecorder.stopRecording();
    const spokenText = transcriptRef.current;

    if (!recordedBlob || recordedBlob.size === 0) {
      isCompletedRef.current = false;
      setIsSubmitting(false);
      setSubmitError('Аудио не записано. Проверьте микрофон и повторите.');
      return;
    }

    // Upload audio blob to backend if session exists
    if (backendSessionId && serverQ && recordedBlob && recordedBlob.size > 0) {
      const formData = new FormData();
      formData.append('audio', recordedBlob, 'speak_about_photo.webm');
      formData.append('questionId', serverQ.id);
      if (spokenText) {
        formData.append('transcript', spokenText);
      }
      formData.append('durationSec', Math.max(1, 90 - timeLeft).toString());

      setIsSubmitting(true);
      try {
        await api.uploadSpeakingAudio(backendSessionId, formData);
      } catch {
        setIsSubmitting(false);
        isCompletedRef.current = false;
        setSubmitError('Не удалось сохранить аудио на сервере. Проверьте соединение и повторите.');
        return;
      }

    }

    recordSpeakingResult(spokenText || (recordedBlob ? 'Записан устный ответ (аудио)' : ''));
    onComplete();
  };

  const handleFinishRef = useRef(handleFinish);
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  });

  // Start audio capture when transitioning to speaking phase
  const startRecording = async () => {
    setPhase('speaking');
    setTimeLeft(90);

    const started = await audioRecorder.startRecording();
    if (!started && audioRecorder.error) {
      setMicError(audioRecorder.error);
    }

    const win = typeof window !== 'undefined' ? (window as unknown as WindowWithSpeech) : null;
    const SpeechRecognition = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (evt: SpeechRecognitionEvent) => {
          let fullText = '';
          for (let i = 0; i < evt.results.length; i++) {
            fullText += evt.results[i][0].transcript + ' ';
          }
          setTranscript(fullText.trim());
        };
        rec.onerror = () => {
          // If browser speech recognition is not available, audio recording still captures voice
        };
        rec.start();
        recognitionRef.current = rec;
      } catch {}
    }
  };

  // Timer handling
  useEffect(() => {
    const duration = phase === 'prep' ? 20 : 90;
    const deadline = Date.now() + duration * 1000;
    setTimeLeft(duration);

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (phase === 'prep') {
          startRecording();
        } else {
          handleFinishRef.current();
        }
      }
    }, 250);

    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-[#D2F544]">
            {phase === 'prep' ? 'Preparation Phase (20s)' : 'Speaking Phase (90s)'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Speak About the Photo
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#16191D] border border-neutral-800 px-4 py-2 rounded-xl text-neutral-300 font-mono text-sm">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-[#D2F544]'}`} />
          <span>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-[#16191D] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Photo Display */}
        <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <img
            src={imageSource}
            alt="Exam Prompt Photo"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </div>

        {/* Prompt */}
        <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-medium">
          {promptText}
        </p>

        {/* Status / Live Feedback */}
        {phase === 'prep' ? (
          <div className="bg-[#0E1012] border border-neutral-800 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-400">
              Подготовьте ваш ответ. Запись начнётся автоматически через{' '}
              <span className="text-[#D2F544] font-bold font-mono">{timeLeft}s</span>.
            </p>
          </div>
        ) : (
          <div className="bg-[#0E1012] border border-neutral-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-neutral-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Запись речи активна... Говорите в микрофон
              </span>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                {/* Audio visualizer volume bar */}
                <div className="w-20 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, audioRecorder.volumeLevel * 1.5)}%` }}
                  />
                </div>
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse ml-1" />
              </div>
            </div>

            {transcript ? (
              <p className="text-sm text-neutral-300 font-mono italic bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/80">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                {audioRecorder.volumeLevel > 15
                  ? 'Голосовой поток обнаружен. Аудио сохраняется...'
                  : 'Ожидание голосового потока... Говорите чётко и связно.'}
              </p>
            )}

            {micError && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{micError}</span>
              </div>
            )}
            {submitError && (
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <span className="text-[11px] text-neutral-500">
            {phase === 'prep' ? '20 секунд на подготовку' : 'Говорите не менее 30–90 секунд'}
          </span>
          {phase === 'prep' ? (
            <Button variant="primary" onClick={startRecording} className="gap-2">
              <Mic className="w-4 h-4" />
              Начать говорить сейчас
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleFinish}
              disabled={timeLeft > 60} // Require at least 30 seconds of speaking before manual finish
              className="gap-2"
            >
              Далее (Next)
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
