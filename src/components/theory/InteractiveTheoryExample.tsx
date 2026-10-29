'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Volume2, XCircle } from 'lucide-react';
import { sound } from '@/lib/sound';
import { useSettingsStore } from '@/store/useSettingsStore';

interface TheoryExample {
  question?: string;
  sampleText?: string;
  audioPrompt?: string;
  modelAnswer: string;
  comment: string;
}

interface InteractiveTheoryExampleProps {
  lessonSlug: string;
  example: TheoryExample;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .trim();
}

function wordFromQuestion(question?: string): string | null {
  if (!question) return null;
  const match =
    question.match(/Слово(?:\s+на\s+экране)?:\s*['"]?([A-Za-z][A-Za-z'-]*)/i) ||
    question.match(/Аудиозапись слова:\s*['"]?([A-Za-z][A-Za-z'-]*)/i) ||
    question.match(/Word:\s*['"]?([A-Za-z][A-Za-z'-]*)/i);
  return match ? match[1] : null;
}

function expectedFillWord(modelAnswer: string): string {
  const full = modelAnswer.match(/(?:Полное слово|Full word):\s*([A-Za-z][A-Za-z'-]*)/i);
  if (full) return full[1];
  const words = modelAnswer.match(/[A-Za-z][A-Za-z'-]*/g);
  return words ? words[words.length - 1] : modelAnswer.trim();
}

export function InteractiveTheoryExample({ lessonSlug, example }: InteractiveTheoryExampleProps) {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);

  const word = useMemo(() => wordFromQuestion(example.question), [example.question]);
  const isReadSelect = lessonSlug === 'read-and-select';
  const isListenSelect = lessonSlug === 'listen-and-select';
  const isFill = lessonSlug === 'fill-in-the-blanks';
  const isDictation = lessonSlug === 'listen-and-type';

  const expected =
    isFill
      ? expectedFillWord(example.modelAnswer)
      : isDictation
        ? example.audioPrompt || example.modelAnswer
        : example.modelAnswer;

  const promptText = (example.question || '')
    .replace(/^Предложение:\s*/i, '')
    .replace(/^Sentence:\s*/i, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();

  const submit = (value: string) => {
    const normalized = normalize(value);
    let ok = false;
    if (isReadSelect) {
      const expectedYes = /\byes\b/i.test(example.modelAnswer);
      ok = (normalized === 'yes') === expectedYes;
    } else if (isListenSelect) {
      const expectedReal = !normalize(example.modelAnswer).includes('не выбирать');
      ok = (normalized === 'real') === expectedReal;
    } else {
      ok = normalize(value) === normalize(expected);
    }
    setAnswer(value);
    setChecked(true);
    setCorrect(ok);
  };

  const reset = () => {
    setAnswer('');
    setChecked(false);
    setCorrect(false);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-black/30 p-4">
      {isDictation ? (
        <div>
          {example.question ? (
            <p className="mb-3 text-xs text-neutral-300">{example.question}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void sound.speakEnglish(expected)}
            className="inline-flex items-center gap-2 rounded-full border border-[#D2F544]/40 bg-[#D2F544]/10 px-4 py-2 text-xs font-bold text-[#D2F544] hover:bg-[#D2F544]/20"
          >
            <Volume2 className="h-3.5 w-3.5" />
            {ru ? 'Прослушать предложение' : 'Play the sentence'}
          </button>
          <span className="text-[11px] text-neutral-500">
            {ru ? 'Введите услышанное с пунктуацией' : 'Type what you hear, including punctuation'}
          </span>
          </div>
        </div>
      ) : isListenSelect ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void sound.speakEnglish(word || example.audioPrompt || expected)}
            className="inline-flex items-center gap-2 rounded-full border border-[#D2F544]/40 bg-[#D2F544]/10 px-4 py-2 text-xs font-bold text-[#D2F544] hover:bg-[#D2F544]/20"
          >
            <Volume2 className="h-3.5 w-3.5" />
            {ru ? 'Прослушать слово' : 'Play the word'}
          </button>
          <span className="text-[11px] text-neutral-500">
            {ru ? 'Реальное слово или псевдослово?' : 'Real word or pseudo-word?'}
          </span>
        </div>
      ) : isReadSelect ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 px-5 py-4 text-center">
          <span className="font-mono text-2xl font-bold text-white">{word || '—'}</span>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 font-mono text-sm text-neutral-200">
          {promptText || example.sampleText || '—'}
        </div>
      )}

      {isReadSelect || isListenSelect ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {isReadSelect ? (
            <>
              <button
                type="button"
                onClick={() => submit('yes')}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
              >
                {ru ? 'Реальное слово' : 'Real word'}
              </button>
              <button
                type="button"
                onClick={() => submit('no')}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white"
              >
                {ru ? 'Псевдослово' : 'Pseudo-word'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => submit('real')}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
              >
                {ru ? 'Выбрать' : 'Select'}
              </button>
              <button
                type="button"
                onClick={() => submit('fake')}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white"
              >
                {ru ? 'Не выбирать' : 'Do not select'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit(answer);
            }}
            disabled={checked}
            className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D2F544]"
            placeholder={ru ? 'Введите ответ' : 'Type your answer'}
          />
          <button
            type="button"
            onClick={() => submit(answer)}
            disabled={!answer.trim() || checked}
            className="rounded-xl bg-[#D2F544] px-5 py-2.5 text-xs font-bold text-[#0C2418] disabled:opacity-40"
          >
            {ru ? 'Проверить' : 'Check'}
          </button>
        </div>
      )}

      {checked ? (
        <div
          className={`mt-3 rounded-xl border p-3 text-xs ${
            correct
              ? 'border-emerald-700/60 bg-emerald-950/30 text-emerald-200'
              : 'border-rose-700/60 bg-rose-950/30 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold">
              {correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {correct ? (ru ? 'Верно' : 'Correct') : ru ? 'Неверно' : 'Incorrect'}
            </span>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[10px] font-bold opacity-80">
              <RotateCcw className="h-3 w-3" /> {ru ? 'Ещё раз' : 'Retry'}
            </button>
          </div>
          <p className="mt-1">
            {ru ? 'Правильный ответ' : 'Correct answer'}:{' '}
            <strong className="font-mono">
              {isReadSelect
                ? /\byes\b/i.test(example.modelAnswer)
                  ? 'YES'
                  : 'NO'
                : isListenSelect
                  ? normalize(example.modelAnswer).includes('не выбирать')
                    ? ru ? 'Не выбирать' : 'Do not select'
                    : ru ? 'Выбрать' : 'Select'
                  : expected}
            </strong>
          </p>
          {example.comment ? <p className="mt-1 opacity-80">{example.comment}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
