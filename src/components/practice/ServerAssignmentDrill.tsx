'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Volume2, XCircle } from 'lucide-react';
import { api, PracticeAssignment } from '@/lib/api';
import { sound } from '@/lib/sound';
import { useSettingsStore } from '@/store/useSettingsStore';

interface ServerAssignmentDrillProps {
  assignment: PracticeAssignment;
  onCompleted?: () => void;
}

type Payload = Record<string, unknown>;

function asString(payload: Payload, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

export function ServerAssignmentDrill({ assignment, onCompleted }: ServerAssignmentDrillProps) {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const payload = (assignment.contentPayload || {}) as Payload;
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState<boolean | null>(null);
  const [cTestInputs, setCTestInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; isCorrect: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const word = asString(payload, 'word');
  const prefix = asString(payload, 'givenPrefix');
  const totalLength = Number(payload.totalLength || 0);
  const missingLength = Math.max(1, totalLength - prefix.length || 1);
  const audioSentence = asString(payload, 'audioSentence');
  const damagedTokens = Array.isArray(payload.damagedTokens)
    ? (payload.damagedTokens as Array<{ prefix?: string; missingLength?: number }>)
    : [];

  const canSubmit = useMemo(() => {
    if (assignment.questionType === 'READ_SELECT') return selected !== null;
    if (assignment.questionType === 'C_TEST') {
      return damagedTokens.length > 0 && damagedTokens.every((_, index) => Boolean(cTestInputs[String(index)]?.trim()));
    }
    return answer.trim().length > 0;
  }, [answer, assignment.questionType, cTestInputs, damagedTokens, selected]);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let userResponse: Payload;
      if (assignment.questionType === 'READ_SELECT') {
        userResponse = { isReal: selected === true };
      } else if (assignment.questionType === 'C_TEST') {
        userResponse = { inputs: cTestInputs };
      } else {
        userResponse = { input: answer.trim() };
      }
      const attempt = await api.recordPracticeAttempt({
        assignmentId: assignment.assignmentId,
        questionType: assignment.questionType,
        questionId: assignment.questionId,
        userResponse,
        timeSpentSec: 30,
      });
      setResult({ score: attempt.score, isCorrect: attempt.isCorrect });
      if (attempt.isCorrect || attempt.score >= 0.6) onCompleted?.();
    } catch {
      setError(ru ? 'Сервер не подтвердил результат. Задание не будет зачтено.' : 'The server did not confirm the result. It will not be credited.');
    } finally {
      setSubmitting(false);
    }
  };

  const label = {
    READ_SELECT: ru ? 'Read and Select' : 'Read and Select',
    FILL_BLANKS: ru ? 'Fill in the Blanks' : 'Fill in the Blanks',
    C_TEST: ru ? 'Read and Complete' : 'Read and Complete',
    LISTEN_TYPE: ru ? 'Listen and Type' : 'Listen and Type',
  }[assignment.questionType] || assignment.questionType;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#111315] p-5 text-white" data-testid="server-assignment">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#D2F544]">
          {ru ? 'Серверное задание' : 'Server assignment'} · {label}
        </span>
        <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-400">
          {assignment.difficultyBand}
        </span>
      </div>

      {assignment.questionType === 'READ_SELECT' ? (
        <div className="mt-4">
          <p className="mb-3 text-xs text-neutral-400">
            {ru ? 'Это реальное английское слово?' : 'Is this a real English word?'}
          </p>
          <div className="rounded-xl border border-neutral-700 bg-neutral-950 px-6 py-6 text-center font-mono text-3xl font-bold">
            {word || '—'}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(true)}
              className={`rounded-full px-5 py-2.5 text-xs font-bold ${selected === true ? 'bg-emerald-500 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}
            >
              {ru ? 'Реальное' : 'Real'}
            </button>
            <button
              type="button"
              onClick={() => setSelected(false)}
              className={`rounded-full px-5 py-2.5 text-xs font-bold ${selected === false ? 'bg-rose-500 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}
            >
              {ru ? 'Псевдослово' : 'Pseudo-word'}
            </button>
          </div>
        </div>
      ) : null}

      {assignment.questionType === 'FILL_BLANKS' ? (
        <div className="mt-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-sm leading-relaxed text-neutral-200">
            {asString(payload, 'sentenceBefore')}
            <span className="mx-1 inline-flex items-center gap-1 rounded border border-[#D2F544]/40 bg-[#D2F544]/10 px-2 py-1 font-mono">
              {prefix}
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value.replace(/[^A-Za-z]/g, ''))}
                maxLength={missingLength}
                disabled={Boolean(result)}
                className="w-24 bg-transparent text-center font-mono text-[#D2F544] outline-none"
                placeholder={'_'.repeat(missingLength)}
              />
            </span>
            {asString(payload, 'sentenceAfter')}
          </div>
          <p className="mt-2 text-[10px] text-neutral-500">
            {ru ? 'Недостающая часть' : 'Missing part'}: {missingLength} {ru ? 'букв' : 'letters'}
          </p>
        </div>
      ) : null}

      {assignment.questionType === 'C_TEST' ? (
        <div className="mt-4">
          <p className="text-sm font-bold text-white">{asString(payload, 'title') || 'Read and Complete'}</p>
          <p className="mt-1 text-[11px] text-neutral-500">{asString(payload, 'firstSentence')}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {damagedTokens.map((token, index) => (
              <label key={index} className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm">
                <span className="text-neutral-300">{token.prefix || ''}</span>
                <input
                  value={cTestInputs[String(index)] || ''}
                  onChange={(event) =>
                    setCTestInputs((current) => ({
                      ...current,
                      [String(index)]: event.target.value.replace(/[^A-Za-z]/g, '').slice(0, Number(token.missingLength || 1)),
                    }))
                  }
                  maxLength={Number(token.missingLength || 1)}
                  disabled={Boolean(result)}
                  className="min-w-0 flex-1 bg-transparent text-[#D2F544] outline-none"
                  placeholder={'_'.repeat(Number(token.missingLength || 1))}
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">{asString(payload, 'lastSentence')}</p>
        </div>
      ) : null}

      {assignment.questionType === 'LISTEN_TYPE' ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void sound.speakEnglish(audioSentence)}
            className="inline-flex items-center gap-2 rounded-full border border-[#D2F544]/40 bg-[#D2F544]/10 px-4 py-2 text-xs font-bold text-[#D2F544]"
          >
            <Volume2 className="h-3.5 w-3.5" /> {ru ? 'Прослушать предложение' : 'Play the sentence'}
          </button>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={Boolean(result)}
            rows={3}
            className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#D2F544]"
            placeholder={ru ? 'Введите услышанное, включая пунктуацию' : 'Type what you hear, including punctuation'}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!result ? (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#D2F544] px-5 py-2.5 text-xs font-black text-[#0C2418] disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {ru ? 'Проверить на сервере' : 'Check on the server'}
          </button>
        ) : (
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${result.isCorrect ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}
          >
            {result.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {ru ? 'Результат подтверждён сервером' : 'Result confirmed by server'}: {Math.round(result.score * 100)}%
          </div>
        )}
      </div>

      {error ? <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
