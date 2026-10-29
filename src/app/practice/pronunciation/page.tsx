'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, Square, Volume2, Sparkles } from 'lucide-react';
import { useAudioRecorder } from '@/lib/useAudioRecorder';
import { SpeechTimeline } from '@/lib/speechTimeline';
import { toAsrSegments } from '@/lib/speechPronunciation';
import { capturePronunciationReport } from '@/lib/pronunciationCapture';
import type { PronunciationReport } from '@/lib/pronunciationAnalysis';
import { PronunciationFeedback } from '@/components/audio/PronunciationFeedback';
import { useSettingsStore } from '@/store/useSettingsStore';

interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string; confidence?: number };
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

const SENTENCES = [
  'The laboratory reported a substantial improvement in air quality after the new filters were installed.',
  'Researchers analysed the data carefully before they published their conclusions.',
  'The committee recommended that the proposal should be revised and resubmitted.',
  'Although the evidence was limited, the argument remained persuasive and clearly structured.',
  'The city council introduced a policy that encouraged residents to use public transport.',
];

export default function PronunciationPracticePage() {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const recorder = useAudioRecorder();
  const timelineRef = useRef<SpeechTimeline | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [customSentence, setCustomSentence] = useState<string | null>(null);
  const [report, setReport] = useState<PronunciationReport | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('sentence');
    if (value && value.trim()) setCustomSentence(value.trim());
  }, []);

  const sentence = customSentence || SENTENCES[sentenceIndex];

  const start = async () => {
    setError(null);
    setReport(null);
    setTranscript('');
    const started = await recorder.startRecording();
    if (!started) {
      setError(
        recorder.error ??
          (ru ? 'Не удалось начать запись. Проверьте микрофон.' : 'Could not start recording. Check the microphone.')
      );
      return;
    }
    const startedAt = performance.now();
    timelineRef.current = new SpeechTimeline(startedAt);

    const win = typeof window !== 'undefined' ? (window as unknown as WindowWithSpeech) : null;
    const SpeechRecognition = win?.SpeechRecognition || win?.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        ru
          ? 'Браузер не поддерживает распознавание речи. Используйте Chrome или Edge.'
          : 'This browser does not support speech recognition. Use Chrome or Edge.'
      );
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        timelineRef.current?.ingest(toAsrSegments(event.results), performance.now());
        let text = '';
        for (let index = 0; index < event.results.length; index += 1) {
          text += `${event.results[index][0].transcript} `;
        }
        setTranscript(text.trim());
      };
      recognition.onerror = () => {};
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setError(ru ? 'Распознавание речи недоступно.' : 'Speech recognition is unavailable.');
    }
  };

  const stop = async () => {
    setProcessing(true);
    try {
      recognitionRef.current?.stop();
      const endedAt = performance.now();
      const blob = await recorder.stopRecording();
      const words = timelineRef.current?.finish(endedAt) ?? [];
      if (!blob || blob.size === 0 || words.length === 0) {
        setError(
          ru
            ? 'Не удалось измерить речь. Запишите ещё раз чуть громче и ближе к микрофону.'
            : 'Could not measure speech. Record again, a little louder and closer to the microphone.'
        );
        return;
      }
      const result = await capturePronunciationReport(blob, words, {
        durationSec: Math.max(1, recorder.durationSec),
        referenceText: sentence,
        playbackText: ru ? 'Прочитайте предложение вслух.' : 'Read the sentence aloud.',
      });
      if (!result) {
        setError(ru ? 'Не удалось обработать аудио.' : 'Could not process the audio.');
        return;
      }
      setReport(result);
    } finally {
      setProcessing(false);
      recognitionRef.current = null;
    }
  };

  return (
    <div className="min-h-screen py-10 ambient-glow">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link
          href="/practice"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-[#0E1012]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {ru ? 'К тренажёрам' : 'Back to practice'}
        </Link>

        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/50 bg-[#D2F544]/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#0C2418]">
            <Sparkles className="h-3.5 w-3.5" /> {ru ? 'Фонемная практика' : 'Phoneme practice'}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#0E1012] sm:text-4xl">
            {ru ? 'Прочитайте предложение вслух' : 'Read the sentence aloud'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            {ru
              ? 'Запись сравнивается с эталонным текстом по фонемам: вы увидите, какие звуки распознаватель услышал иначе. Оценка строится по тексту распознавания, а не по акустической модели.'
              : 'The recording is compared with the reference text at phoneme level: you will see which sounds the recogniser heard differently. The score uses the transcript, not an acoustic model.'}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <label htmlFor="sentence" className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
            {ru ? 'Предложение' : 'Sentence'}
          </label>
          <select
            id="sentence"
            value={sentenceIndex}
            onChange={(event) => {
              setSentenceIndex(Number(event.target.value));
              setReport(null);
              setTranscript('');
            }}
            className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-[#0E1012]"
            disabled={recorder.isRecording}
          >
            {SENTENCES.map((item, index) => (
              <option key={item} value={index}>
                {index + 1}. {item.slice(0, 64)}…
              </option>
            ))}
          </select>

          <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-lg leading-relaxed text-[#0E1012]" data-testid="read-aloud-sentence">
            {sentence}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void start()}
              disabled={recorder.isRecording || processing}
              className="inline-flex items-center gap-2 rounded-full bg-[#0E1012] px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              <Mic className="h-3.5 w-3.5 text-[#D2F544]" /> {ru ? 'Записать' : 'Record'}
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              disabled={!recorder.isRecording || processing}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:border-neutral-500 disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5" /> {ru ? 'Стоп и разбор' : 'Stop and analyse'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-[#0E1012]"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance(sentence);
                  utterance.lang = 'en-US';
                  window.speechSynthesis.speak(utterance);
                }
              }}
            >
              <Volume2 className="h-3.5 w-3.5" /> {ru ? 'Прослушать эталон' : 'Listen to the model'}
            </button>
            <span className="text-[11px] text-neutral-500">
              {recorder.isRecording
                ? `${ru ? 'Идёт запись' : 'Recording'}: ${recorder.durationSec.toFixed(1)} ${ru ? 'с' : 's'}`
                : transcript
                  ? `${ru ? 'Распознано' : 'Recognised'}: ${transcript.slice(0, 90)}`
                  : ''}
            </span>
          </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        {report ? (
          <div className="mt-5">
            <PronunciationFeedback report={report} referenceText={sentence} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
