'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useAudioRecorder } from '@/lib/useAudioRecorder';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Mic, Clock, ArrowRight, AlertCircle, Sparkles, Volume2 } from 'lucide-react';

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

interface SpeakingSampleProps {
  onComplete: () => void;
  isStandaloneDrill?: boolean;
}

export const SpeakingSample: React.FC<SpeakingSampleProps> = ({ onComplete }) => {
  const { recordSpeakingResult, serverQuestions, backendSessionId } = useTestStore();
  const audioRecorder = useAudioRecorder();

  const serverQ = serverQuestions.find((q) => q.type === 'SPEAKING_SAMPLE');
  const payload = (serverQ?.contentPayload || {}) as { prompt?: string };
  const promptText =
    payload.prompt ||
    'Some people believe that artificial intelligence will transform higher education, while others believe traditional classrooms remain essential. What is your opinion? Explain your reasons with specific examples. Speak for 1 to 3 minutes.';

  const [phase, setPhase] = useState<'prep' | 'speaking'>('prep');
  const [timeLeft, setTimeLeft] = useState(30); // 30s prep, then 180s (3 min)
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

    if (backendSessionId && serverQ && recordedBlob && recordedBlob.size > 0) {
      const formData = new FormData();
      formData.append('audio', recordedBlob, 'speaking_sample.webm');
      formData.append('questionId', serverQ.id);
      if (spokenText) {
        formData.append('transcript', spokenText);
      }
      formData.append('durationSec', Math.max(1, 180 - timeLeft).toString());

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

    recordSpeakingResult(spokenText || (recordedBlob ? 'Записан Speaking Sample' : ''));
    onComplete();
  };

  const handleFinishRef = useRef(handleFinish);
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  });

  const startRecording = async () => {
    setPhase('speaking');
    setTimeLeft(180);

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
        rec.onerror = () => {};
        rec.start();
        recognitionRef.current = rec;
      } catch {}
    }
  };

  useEffect(() => {
    const duration = phase === 'prep' ? 30 : 180;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-[#D2F544]">
            {phase === 'prep' ? 'Preparation Phase (30s)' : 'Speaking Sample (1–3 mins)'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Speaking Sample
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#16191D] border border-neutral-800 px-4 py-2 rounded-xl text-neutral-300 font-mono text-sm">
          <Clock className={`w-4 h-4 ${timeLeft <= 30 ? 'text-rose-500 animate-pulse' : 'text-[#D2F544]'}`} />
          <span>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="bg-[#16191D] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Topic Prompt Card */}
        <div className="bg-[#0E1012] border border-neutral-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#D2F544] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Speaking Sample Prompt
          </div>
          <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* Live Audio Feedback */}
        {phase === 'prep' ? (
          <div className="bg-[#0E1012]/60 border border-neutral-800 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-400">
              Подготовьте развёрнутый ответ. Запись микрофона включится через{' '}
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
                Запись образца речи активна · Говорите 1–3 минуты
              </span>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
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
                  ? 'Голос зафиксирован. Идёт запись образца речи...'
                  : 'Ожидание голосового потока... Говорите связно и аргументированно.'}
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

        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <span className="text-[11px] text-neutral-500">
            {phase === 'prep' ? '30 секунд на подготовку' : 'Говорите не менее 1–3 минут'}
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
              disabled={timeLeft > 120} // Require at least 60s of speech before manual submit
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
