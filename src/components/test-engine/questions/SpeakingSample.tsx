'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useAudioRecorder } from '@/lib/useAudioRecorder';
import { api } from '@/lib/api';
import { SpeechTimeline } from '@/lib/speechTimeline';
import { appendPronunciationReport, toAsrSegments } from '@/lib/speechPronunciation';
import { Button } from '@/components/ui/Button';
import { TaskPrompt } from '@/components/test-engine/TaskPrompt';
import { isAudioAlreadyStored, speakingUploadErrorMessage } from '@/lib/speakingUploadError';
import { Mic, Clock, ArrowRight, AlertCircle, Sparkles, Volume2 } from 'lucide-react';

interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence?: number;
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

const PREP_SECONDS = 30;
const SPEAK_SECONDS = 180;
const TOTAL_SECONDS = PREP_SECONDS + SPEAK_SECONDS;
const MIN_SPEAK_SECONDS = 60;

export const SpeakingSample: React.FC<SpeakingSampleProps> = ({ onComplete, isStandaloneDrill }) => {
  const { recordSpeakingResult, serverQuestions, backendSessionId } = useTestStore();
  const audioRecorder = useAudioRecorder();

  const serverQ = isStandaloneDrill ? undefined : serverQuestions.find((q) => q.type === 'SPEAKING_SAMPLE');
  const payload = (serverQ?.contentPayload || {}) as { prompt?: string };
  const promptText =
    payload.prompt ||
    'Some people believe that artificial intelligence will transform higher education, while others believe traditional classrooms remain essential. What is your opinion? Explain your reasons with specific examples. Speak for 1 to 3 minutes.';

  const [phase, setPhase] = useState<'prep' | 'speaking'>('prep');
  // One countdown covers preparation and speaking: 3:30 in total.
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [speakSeconds, setSpeakSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const isCompletedRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timelineRef = useRef<SpeechTimeline | null>(null);
  const phaseRef = useRef<'prep' | 'speaking'>('prep');
  const speakStartedAtRef = useRef<number | null>(null);
  const autoStartFailedRef = useRef(false);

  const handleFinish = async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setUploadFailed(false);
    setSubmitError(null);
    const endedAtMs = performance.now();
    const durationSec = speakStartedAtRef.current
      ? Math.max(1, Math.round((endedAtMs - speakStartedAtRef.current) / 1000))
      : Math.max(1, TOTAL_SECONDS - timeLeft);

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
      setUploadFailed(true);
      setSubmitError('Аудио не записано. Проверьте микрофон и повторите.');
      return;
    }

    if (!isStandaloneDrill && backendSessionId && serverQ && recordedBlob.size > 0) {
      const formData = new FormData();
      formData.append('audio', recordedBlob, 'speaking_sample.webm');
      formData.append('questionId', serverQ.id);
      if (spokenText) {
        formData.append('transcript', spokenText);
      }
      formData.append('durationSec', durationSec.toString());

      setIsSubmitting(true);
      try {
        await appendPronunciationReport(formData, recordedBlob, timelineRef.current, {
          endedAtMs,
          durationSec,
          playbackText: promptText,
        });
        await api.uploadSpeakingAudio(backendSessionId, formData);
      } catch (err) {
        setIsSubmitting(false);
        isCompletedRef.current = false;
        if (isAudioAlreadyStored(err)) {
          if (!isStandaloneDrill) recordSpeakingResult(spokenText || 'Записан Speaking Sample');
          onComplete();
          return;
        }
        setUploadFailed(true);
        setSubmitError(speakingUploadErrorMessage(err, true));
        return;
      }

    }

    if (!isStandaloneDrill) recordSpeakingResult(spokenText || (recordedBlob ? 'Записан Speaking Sample' : ''));
    onComplete();
  };

  const handleContinueWithoutAudio = () => {
    if (isSubmitting) return;
    if (!isStandaloneDrill) {
      recordSpeakingResult(
        transcriptRef.current || 'Speaking Sample не сохранён: аудио не загружено'
      );
    }
    onComplete();
  };

  const handleFinishRef = useRef(handleFinish);
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  });

  const startRecording = useCallback(async () => {
    if (phaseRef.current === 'speaking') return;
    autoStartFailedRef.current = false;

    const started = await audioRecorder.startRecording();
    if (!started) {
      autoStartFailedRef.current = true;
      setMicError(audioRecorder.error || 'Не удалось включить микрофон. Попробуйте ещё раз.');
      return;
    }

    phaseRef.current = 'speaking';
    setPhase('speaking');
    speakStartedAtRef.current = performance.now();
    timelineRef.current = new SpeechTimeline(performance.now());

    const win = typeof window !== 'undefined' ? (window as unknown as WindowWithSpeech) : null;
    const SpeechRecognition = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (evt: SpeechRecognitionEvent) => {
          timelineRef.current?.ingest(toAsrSegments(evt.results), performance.now());
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
  }, [audioRecorder]);

  // The timer must depend on the phase only. Depending on startRecording made
  // the deadline reset whenever the recorder updated its duration, so the
  // countdown never reached the point where the answer can be submitted.
  const startRecordingRef = useRef(startRecording);
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  // One task deadline for 30 s prep + 180 s speaking. It must not depend on
  // startRecording: the recorder object changes with every volume update.
  useEffect(() => {
    const deadline = Date.now() + TOTAL_SECONDS * 1000;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (speakStartedAtRef.current !== null) {
        setSpeakSeconds(
          Math.max(0, Math.round((performance.now() - speakStartedAtRef.current) / 1000))
        );
      }

      if (remaining <= SPEAK_SECONDS && phaseRef.current === 'prep' && !autoStartFailedRef.current) {
        void startRecordingRef.current();
      }

      if (remaining <= 0) {
        clearInterval(timer);
        handleFinishRef.current();
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

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
          <span data-testid="task-countdown">
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
          <TaskPrompt prompt={promptText} />
        </div>

        {/* Live Audio Feedback */}
        {phase === 'prep' ? (
          <div className="bg-[#0E1012]/60 border border-neutral-800 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-400">
              Подготовьте развёрнутый ответ. Запись микрофона включится через{' '}
              <span className="text-[#D2F544] font-bold font-mono">
                {Math.max(0, timeLeft - SPEAK_SECONDS)}s
              </span>
              .
            </p>
            {micError && (
              <div className="mt-3 flex flex-col items-center gap-2 text-xs text-amber-300">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {micError}
                </span>
                <button
                  type="button"
                  onClick={() => void startRecording()}
                  className="rounded-lg border border-amber-500/40 px-3 py-1.5 font-bold hover:bg-amber-500/10"
                >
                  Попробовать снова
                </button>
              </div>
            )}
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
              <div className="text-xs text-red-300 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
                {uploadFailed && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleFinish()}
                      className="rounded-lg border border-neutral-600 px-3 py-1.5 font-bold text-neutral-200 hover:border-neutral-400"
                    >
                      Повторить отправку
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueWithoutAudio}
                      className="rounded-lg border border-[#D2F544]/50 bg-[#D2F544]/10 px-3 py-1.5 font-bold text-[#D2F544] hover:bg-[#D2F544]/20"
                    >
                      Продолжить без аудио
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-800/80">
          <span className="text-[11px] text-neutral-500" data-testid="speak-timer-hint">
            {phase === 'prep'
              ? `Подготовка · общий таймер ${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
                  .toString()
                  .padStart(2, '0')}`
              : speakSeconds < MIN_SPEAK_SECONDS
                ? `Проверка станет доступна через ${MIN_SPEAK_SECONDS - speakSeconds} с`
                : 'Ответ можно отправить на проверку'}
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
              disabled={speakSeconds < MIN_SPEAK_SECONDS || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? 'Сохранение...' : uploadFailed ? 'Повторить отправку' : 'Проверить ответ'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
