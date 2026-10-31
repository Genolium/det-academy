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
import { deleteAudioDraft, loadAudioDraft, saveAudioDraft } from '@/lib/audioDraft';
import { Mic, Clock, ArrowRight, AlertCircle, BookOpen, Volume2 } from 'lucide-react';

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

interface ReadThenSpeakProps {
  onComplete: () => void;
}

const PREP_SECONDS = 20;
const SPEAK_SECONDS = 90;
const TOTAL_SECONDS = PREP_SECONDS + SPEAK_SECONDS;
const MIN_SPEAK_SECONDS = 30;

export const ReadThenSpeak: React.FC<ReadThenSpeakProps> = ({ onComplete }) => {
  const { recordSpeakingResult, serverQuestions, backendSessionId } = useTestStore();
  const audioRecorder = useAudioRecorder();

  const serverQ = serverQuestions.find((q) => q.type === 'READ_THEN_SPEAK');
  const payload = (serverQ?.contentPayload || {}) as { prompt?: string; hints?: string[] };
  const promptText =
    payload.prompt ||
    'Describe a significant accomplishment that required substantial effort and dedication. Explain what you achieved, the obstacles you had to overcome, and why this accomplishment was important to you. Speak for 90 seconds.';

  const [phase, setPhase] = useState<'prep' | 'speaking'>('prep');
  // One countdown covers reading/preparation and speaking.
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [speakSeconds, setSpeakSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
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

  useEffect(() => {
    if (!backendSessionId || !serverQ) return;
    let active = true;
    void loadAudioDraft(backendSessionId, serverQ.id).then((blob) => {
      if (!active || !blob) return;
      audioRecorder.restoreAudio(blob);
      setHasDraft(true);
    });
    return () => {
      active = false;
    };
  }, [audioRecorder, backendSessionId, serverQ?.id]);

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

    if (backendSessionId && serverQ) {
      await saveAudioDraft(backendSessionId, serverQ.id, recordedBlob);
      setHasDraft(true);
    }

    if (backendSessionId && serverQ && recordedBlob.size > 0) {
      const formData = new FormData();
      formData.append('audio', recordedBlob, 'read_then_speak.webm');
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
          if (backendSessionId && serverQ) {
            await deleteAudioDraft(backendSessionId, serverQ.id);
          }
          recordSpeakingResult(spokenText || 'Записан устный ответ (аудио)');
          onComplete();
          return;
        }
        setUploadFailed(true);
        setSubmitError(speakingUploadErrorMessage(err, true));
        return;
      }

    }

    if (backendSessionId && serverQ) {
      await deleteAudioDraft(backendSessionId, serverQ.id);
    }
    recordSpeakingResult(spokenText || (recordedBlob ? 'Записан устный ответ (аудио)' : ''));
    onComplete();
  };

  const handleContinueWithoutAudio = () => {
    if (isSubmitting) return;
    if (backendSessionId && serverQ) {
      void deleteAudioDraft(backendSessionId, serverQ.id);
    }
    recordSpeakingResult(
      transcriptRef.current || 'Устный ответ не сохранён: аудио не загружено'
    );
    onComplete();
  };

  const discardDraft = () => {
    if (backendSessionId && serverQ) {
      void deleteAudioDraft(backendSessionId, serverQ.id);
    }
    audioRecorder.resetAudio();
    setHasDraft(false);
    setUploadFailed(false);
    setSubmitError(null);
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

  const startRecordingRef = useRef(startRecording);
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  // One task deadline. The previous effect depended on startRecording, which
  // changed with every recorder update and reset the countdown mid-task.
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
            {phase === 'prep' ? 'Reading & Prep Phase (20s)' : 'Speaking Phase (90s)'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Read, Then Speak
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#16191D] border border-neutral-800 px-4 py-2 rounded-xl text-neutral-300 font-mono text-sm">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-[#D2F544]'}`} />
          <span data-testid="task-countdown">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="bg-[#16191D] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Academic Prompt Box */}
        <div className="bg-[#0E1012] border border-neutral-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#D2F544] font-mono uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            Prompt to speak about
          </div>
          <TaskPrompt prompt={promptText} hints={payload.hints} />
        </div>

        {hasDraft && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            <p className="mb-2">
              Есть сохранённая запись с прошлой попытки. Её можно отправить без повторной записи.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleFinish()}
                className="rounded-lg border border-[#D2F544]/60 px-3 py-1.5 font-bold text-[#D2F544]"
              >
                Отправить сохранённую запись
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="rounded-lg border border-neutral-600 px-3 py-1.5 font-bold text-neutral-300"
              >
                Удалить
              </button>
            </div>
          </div>
        )}

        {/* Live Audio Feedback */}
        {phase === 'prep' ? (
          <div className="bg-[#0E1012]/60 border border-neutral-800 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-400">
              Прочтите задание и подготовьте ответ. Запись микрофона включится через{' '}
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
                Запись активна... Говорите в микрофон
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
                  ? 'Голосовой поток обнаружен. Аудио сохраняется...'
                  : 'Ожидание голосового потока... Говорите непрерывно и развёрнуто.'}
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
