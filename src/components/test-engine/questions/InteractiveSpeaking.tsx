'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useAudioRecorder } from '@/lib/useAudioRecorder';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Mic, Clock, ArrowRight, AlertCircle, MessageSquare, Volume2, Sparkles } from 'lucide-react';

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

interface InteractiveSpeakingProps {
  onComplete: () => void;
}

export const InteractiveSpeaking: React.FC<InteractiveSpeakingProps> = ({ onComplete }) => {
  const { recordSpeakingResult, serverQuestions, backendSessionId } = useTestStore();
  const audioRecorder = useAudioRecorder();

  const serverQ = serverQuestions.find((q) => q.type === 'INTERACTIVE_SPEAKING');
  const payload = (serverQ?.contentPayload || {}) as {
    scenario?: string;
    prompt?: string;
  };

  const scenarioText =
    payload.scenario ||
    'You are speaking with your university academic advisor regarding your course schedule and preparing for graduation requirements.';

  const turns = [
    'Explain why you are considering taking an intensive seminar course instead of a standard lecture series.',
    'Your advisor asks how this specific course aligns with your intended career path or graduate research.',
    'Address your advisor’s concern about the heavy weekly reading workload (over 150 pages per week).',
    'Explain how you plan to balance this seminar with your remaining laboratory requirements.',
    'Summarize the key study strategies you will employ to maintain a high grade point average.',
    'Conclude the conversation by thanking your advisor and confirming the final registration deadline.',
  ];

  const [currentTurn, setCurrentTurn] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35); // 35s per turn
  const [transcript, setTranscript] = useState('');
  const [turnTranscripts, setTurnTranscripts] = useState<string[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [isPlayingPromptAudio, setIsPlayingPromptAudio] = useState(false);

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const isAdvancingRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Text-To-Speech for Conversational Turn
  const playPromptAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsPlayingPromptAudio(true);
      utterance.onend = () => setIsPlayingPromptAudio(false);
      utterance.onerror = () => setIsPlayingPromptAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecognition = async () => {
    await audioRecorder.startRecording();

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
          setMicError('Микрофон временно недоступен.');
        };
        rec.start();
        recognitionRef.current = rec;
      } catch {}
    }
  };

  const handleNextTurn = async () => {
    if (isAdvancingRef.current) return;
    const current = transcriptRef.current;
    const updated = [...turnTranscripts, current];
    setTurnTranscripts(updated);

    if (currentTurn + 1 < turns.length) {
      setCurrentTurn((t) => t + 1);
      setTranscript('');
      setTimeLeft(35);
    } else {
      isAdvancingRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recordedBlob = await audioRecorder.stopRecording();
      const fullTranscript = updated.filter(Boolean).join('; ');

      if (backendSessionId && recordedBlob && recordedBlob.size > 0) {
        const formData = new FormData();
        formData.append('audio', recordedBlob, 'interactive_speaking.webm');
        formData.append('questionId', serverQ?.id || 'is-1');
        if (fullTranscript) {
          formData.append('transcript', fullTranscript);
        }
        formData.append('durationSec', '210');

        api.uploadSpeakingAudio(backendSessionId, formData).catch(() => {});
      }

      recordSpeakingResult(fullTranscript || (recordedBlob ? 'Записан интерактивный диалог' : ''));
      onComplete();
    }
  };

  const handleNextTurnRef = useRef(handleNextTurn);
  useEffect(() => {
    handleNextTurnRef.current = handleNextTurn;
  });

  // Turn deadline timer (35s per turn)
  useEffect(() => {
    setTimeLeft(35);
    setTranscript('');
    startRecognition();
    playPromptAudio(turns[currentTurn]);

    const deadline = Date.now() + 35 * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleNextTurnRef.current();
      }
    }, 250);

    return () => {
      clearInterval(timer);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentTurn]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-[#D2F544]">
            Interactive Speaking · Turn {currentTurn + 1} of {turns.length}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Conversational Interaction
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#16191D] border border-neutral-800 px-4 py-2 rounded-xl text-neutral-300 font-mono text-sm">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-[#D2F544]'}`} />
          <span>0:{timeLeft.toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="bg-[#16191D] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Scenario context */}
        <div className="bg-[#0E1012] border border-neutral-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block mb-1">
            Scenario
          </span>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {scenarioText}
          </p>
        </div>

        {/* Current Turn Prompt */}
        <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#D2F544] font-mono uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              Turn {currentTurn + 1} Question
            </div>
            {isPlayingPromptAudio && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                Озвучивание реплики...
              </span>
            )}
          </div>
          <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
            {turns[currentTurn]}
          </p>
        </div>

        {/* Live Audio Feedback */}
        <div className="bg-[#0E1012] border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-neutral-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Запись активна · 35 секунд на реплику
            </span>
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
              <div className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden">
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
                ? 'Голос обнаружен. Запись реплики ведется...'
                : 'Говорите в микрофон, ответ записывается в реальном времени...'}
            </p>
          )}

          {micError && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{micError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <span className="text-[11px] text-neutral-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D2F544]" />
            Реплика {currentTurn + 1} из {turns.length}
          </span>
          <Button
            variant="primary"
            onClick={handleNextTurn}
            disabled={timeLeft > 25} // Allow moving forward after speaking for at least 10s
            className="gap-2"
          >
            {currentTurn + 1 === turns.length ? 'Завершить этап' : 'Следующая реплика'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
