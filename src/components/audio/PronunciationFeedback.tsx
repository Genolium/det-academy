'use client';

/**
 * Word-level pronunciation clarity panel.
 *
 * The score is a clarity proxy built from measured voicing, loudness and
 * articulation plus word alignment — never phoneme accuracy. The wording in the
 * UI says so explicitly, and every weak word can be tapped to hear a model
 * pronunciation.
 */

import React, { useMemo, useState } from 'react';
import { Info, Play, Volume2 } from 'lucide-react';
import { sound } from '@/lib/sound';
import { playPronunciation } from '@/lib/pronunciation';
import { formatPhonemes } from '@/lib/phonemes';
import {
  PRONUNCIATION_METHOD,
  type PronunciationIssue,
  type PronunciationReport,
  type PronunciationWordResult,
} from '@/lib/pronunciationAnalysis';

const ISSUE_LABELS: Record<PronunciationIssue, string> = {
  quiet: 'тише остальных слов',
  unclear: 'плохо слышно',
  muffled: 'нечёткие согласные',
  unexpected: 'распознано как другое слово',
  'low-confidence': 'низкая уверенность распознавания',
};

const ISSUE_HINTS: Record<PronunciationIssue, string> = {
  quiet: 'Слово заметно тише вашего среднего уровня — произнесите его полнее.',
  unclear: 'В окне слова почти нет озвученной речи: оно проглочено или слито с соседним.',
  muffled: 'Мало высокочастотной энергии — согласные смазаны. Откройте рот шире и артикулируйте окончания.',
  unexpected: 'Распознаватель услышал другое слово. Это может быть оговорка или ошибка распознавания.',
  'low-confidence': 'Распознаватель не был уверен в слове — говорите чуть медленнее и чётче.',
};

export interface PronunciationFeedbackProps {
  report: PronunciationReport;
  /** Prompt or passage used for the reference playback. */
  referenceText?: string;
  className?: string;
}

function scoreTone(score: number): { chip: string; bar: string; label: string } {
  if (score < 0.45) {
    return {
      chip: 'border-rose-500/50 bg-rose-500/15 text-rose-200',
      bar: 'bg-rose-500/80',
      label: 'требует внимания',
    };
  }
  if (score < 0.7) {
    return {
      chip: 'border-amber-500/50 bg-amber-500/15 text-amber-200',
      bar: 'bg-amber-400/80',
      label: 'нечётко',
    };
  }
  return {
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    bar: 'bg-emerald-500/70',
    label: 'чётко',
  };
}

const WordChip: React.FC<{
  word: PronunciationWordResult;
  onPlay: (word: PronunciationWordResult) => void;
  busy: boolean;
}> = ({ word, onPlay, busy }) => {
  const tone = scoreTone(word.score);
  const percent = Math.round(word.score * 100);
  const issueLabel = word.issue ? ISSUE_LABELS[word.issue] : null;
  const phonemeLabel =
    word.referencePhonemes && word.spokenPhonemes
      ? `эталон ${formatPhonemes(word.referencePhonemes)}, услышано ${formatPhonemes(word.spokenPhonemes)}`
      : null;
  const description = [
    `Слово «${word.word}»`,
    `чёткость ${percent}%`,
    phonemeLabel,
    issueLabel ? issueLabel : 'без замечаний',
    'Нажмите, чтобы услышать эталонное произношение',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <button
      type="button"
      onClick={() => onPlay(word)}
      aria-label={description}
      title={word.issue ? ISSUE_HINTS[word.issue] : `Чёткость ${percent}%`}
      data-testid="pronunciation-word"
      data-score={word.score}
      data-issue={word.issue || ''}
      data-phoneme-score={word.phonemeScore ?? ''}
      data-phoneme-distance={word.phonemeDistance ?? ''}
      className={`group inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544] ${tone.chip} ${
        busy ? 'opacity-60' : ''
      }`}
    >
      <span>{word.word}</span>
      {word.issue ? <span className="text-[10px] opacity-80">•</span> : null}
      <Play className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70" />
    </button>
  );
};

export const PronunciationFeedback: React.FC<PronunciationFeedbackProps> = ({
  report,
  referenceText,
  className = '',
}) => {
  const [busyWord, setBusyWord] = useState<string | null>(null);
  const overallPercent = Math.round(report.overallScore * 100);

  const weakWords = useMemo(
    () => report.words.filter((word) => word.score < 0.7),
    [report.words]
  );
  const referencePlaybackText = report.referencePlaybackText || referenceText;
  const hasReference = Boolean(referencePlaybackText);

  const playWord = (word: PronunciationWordResult) => {
    setBusyWord(word.word);
    void playPronunciation(word.word).finally(() => setBusyWord(null));
  };

  const playReference = () => {
    if (referencePlaybackText) sound.speakEnglish(referencePlaybackText, undefined, 1);
  };

  const timelineWords = report.words.slice(0, 160);
  const totalWeight = timelineWords.reduce(
    (sum, word) => sum + Math.max(0.06, word.end - word.start),
    0
  );

  return (
    <section
      className={`rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 ${className}`}
      aria-labelledby="pronunciation-feedback-title"
      data-testid="pronunciation-feedback"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4
            id="pronunciation-feedback-title"
            className="flex items-center gap-2 text-sm font-bold text-white"
          >
            <Volume2 className="h-4 w-4 text-[#D2F544]" />
            Произношение: чёткость и фонемы
          </h4>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-neutral-400">
            Чёткость измеряется по громкости и артикуляции, фонемы сравниваются с
            эталоном через G2P по тексту распознавания. Это не акустическая точность.
            Нажмите на слово, чтобы услышать эталон.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasReference ? (
            <button
              type="button"
              onClick={playReference}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1.5 text-[11px] font-bold text-neutral-300 transition-colors hover:border-[#D2F544] hover:text-[#D2F544] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544]"
              aria-label="Эталон: прослушать текст задания"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Эталон
            </button>
          ) : null}
          <div className="text-right">
            <span
              className="font-mono text-2xl font-bold text-[#D2F544]"
              data-testid="pronunciation-overall"
            >
              {overallPercent}%
            </span>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              Индекс чёткости
            </p>
            {report.phonemeScore !== undefined ? (
              <p className="mt-1 text-[10px] font-bold text-neutral-300" data-testid="pronunciation-phoneme-overall">
                фонемы: {Math.round(report.phonemeScore * 100)}%
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Clarity timeline: one bar per word, width proportional to duration. */}
      {totalWeight > 0 ? (
        <div className="mt-4">
          <div
            className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-neutral-900"
            role="img"
            aria-label={`Хронология чёткости: ${report.words.length} слов, ${weakWords.length} требуют внимания`}
          >
            {timelineWords.map((word, index) => (
              <span
                key={`${word.word}-${index}`}
                className={scoreTone(word.score).bar}
                style={{
                  flexGrow: Math.max(0.06, word.end - word.start),
                  flexBasis: 0,
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
            <span>начало ответа</span>
            <span>
              {weakWords.length > 0
                ? `${weakWords.length} из ${report.words.length} слов нечёткие`
                : 'все слова разборчивы'}
            </span>
            <span>{Math.round(report.durationSec)} с</span>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5" data-testid="pronunciation-words">
        {report.words.map((word, index) => (
          <WordChip
            key={`${word.word}-${index}`}
            word={word}
            onPlay={playWord}
            busy={busyWord === word.word}
          />
        ))}
      </div>

      {report.phonemeMeasuredWords && report.phonemeMeasuredWords > 0 ? (
        <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3" data-testid="phoneme-diff">
          <p className="text-[11px] font-bold text-neutral-200">
            Фонемная разница по словам{' '}
            <span className="font-normal text-neutral-500">
              ({report.phonemeMeasuredWords} пар, модель {report.phonemeModel ?? 'G2P'})
            </span>
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-neutral-400">
            {report.words
              .filter(
                (word) =>
                  word.referencePhonemes &&
                  word.spokenPhonemes &&
                  (word.phonemeDistance ?? 0) > 0
              )
              .slice(0, 12)
              .map((word, index) => (
                <li key={`${word.word}-phonemes-${index}`} className="flex flex-wrap gap-x-1.5">
                  <strong className="text-neutral-200">{word.word}</strong>
                  <span className="font-mono text-neutral-400">
                    {formatPhonemes(word.referencePhonemes ?? [])}
                  </span>
                  <span className="text-neutral-400">→</span>
                  <span className="font-mono text-amber-300/90">
                    {formatPhonemes(word.spokenPhonemes ?? [])}
                  </span>
                  <span className="text-neutral-400">
                    ({word.phonemeDistance} {word.phonemeDistance === 1 ? 'правка' : 'правки'})
                  </span>
                </li>
              ))}
          </ul>
          {report.words.every(
            (word) => !word.referencePhonemes || (word.phonemeDistance ?? 0) === 0
          ) ? (
            <p className="mt-1 text-[11px] text-emerald-300/80">
              Фонемных расхождений в распознанных словах нет.
            </p>
          ) : null}
        </div>
      ) : null}

      {report.referenceText && report.referenceMatchRate !== undefined ? (
        <p className="mt-3 text-[11px] text-neutral-400">
          Совпадение с эталонным текстом:{' '}
          <strong className="text-neutral-200">
            {Math.round(report.referenceMatchRate * 100)}%
          </strong>{' '}
          (слово распознано как в эталоне).
        </p>
      ) : null}

      {weakWords.length > 0 ? (
        <ul className="mt-3 space-y-1 text-[11px] text-neutral-400">
          {Array.from(
            new Map(
              weakWords
                .filter((word) => word.issue)
                .map((word) => [word.issue, word])
            ).values()
          ).map((word) => (
            <li key={`${word.issue}-${word.word}`} className="flex gap-1.5">
              <span className="text-neutral-600">•</span>
              <span>
                <strong className="text-neutral-200">{word.word}</strong> —{' '}
                {word.issue ? ISSUE_LABELS[word.issue] : ''}.{' '}
                {word.issue ? ISSUE_HINTS[word.issue] : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="mt-3 text-[11px] text-neutral-500">
        <summary className="flex cursor-pointer items-center gap-1.5 text-neutral-400">
          <Info className="h-3.5 w-3.5" />
          Что именно измерено
        </summary>
        <div className="mt-2 space-y-1 leading-relaxed">
          <p>
            Метод: <code className="text-neutral-300">{PRONUNCIATION_METHOD}</code>. Источник
            границ слов: {report.timingSource === 'asr-segment-arrivals'
              ? 'приблизительные метки браузерного распознавателя, уточнённые по измеренным участкам речи'
              : 'равномерная оценка по длительности записи'}
            .
          </p>
          <p>
            По каждому слову измерены: доля озвученных кадров, уровень громкости и
            частота переходов через ноль (артикуляция). Оценка сравнивает слово с
            вашим же медианным словом, поэтому не зависит от громкости микрофона.
          </p>
          <p>
            Фонемы: эталон берётся из IPA-словаря курса, незнакомые слова —
            из правил G2P. «Услышанные» фонемы строятся из текста распознавания тем
            же G2P и сравниваются редакционным расстоянием. Акустическая модель
            фонем и принудительное выравнивание по звуку в текущем стеке не
            используются, поэтому оценка не отражает акцент или тембр.
          </p>
          {report.notes.map((note) => (
            <p key={note} className="text-amber-300/80">
              {note}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
};
