'use client';

import React from 'react';
import { EvaluationResult } from '@/lib/api';
import { AudioPlayer } from './AudioPlayer';
import { PronunciationFeedback } from './PronunciationFeedback';
import { PRONUNCIATION_METHOD } from '@/lib/pronunciationAnalysis';
import { Award, BookOpen, Clock, Lightbulb, MessageSquare, Sparkles } from 'lucide-react';

interface RubricFeedbackCardProps {
  evaluation: EvaluationResult;
  className?: string;
  showAudio?: boolean;
}


const PauseTimeline: React.FC<{
  duration: number;
  pauses: Array<{ start: number; end: number }>;
}> = ({ duration, pauses }) => {
  if (duration <= 0) return null;
  const segments: Array<{ left: number; width: number; pause: boolean }> = [];
  let cursor = 0;
  for (const pause of pauses) {
    const start = Math.max(0, Math.min(duration, pause.start));
    const end = Math.max(start, Math.min(duration, pause.end));
    if (start > cursor) segments.push({ left: cursor / duration, width: (start - cursor) / duration, pause: false });
    segments.push({ left: start / duration, width: (end - start) / duration, pause: true });
    cursor = end;
  }
  if (cursor < duration) segments.push({ left: cursor / duration, width: (duration - cursor) / duration, pause: false });

  return (
    <div className="my-4 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Речь и паузы</span>
        <span>{pauses.length} пауз · {Math.round((pauses.reduce((sum, pause) => sum + (pause.end - pause.start), 0) / duration) * 100)}% тишины</span>
      </div>
      <div className="relative h-6 w-full overflow-hidden rounded-full bg-emerald-500/25" role="img" aria-label={`Речь с ${pauses.length} паузами`}>
        {segments.map((segment, index) => (
          <span
            key={index}
            className={segment.pause ? 'absolute inset-y-0 bg-neutral-700' : 'absolute inset-y-0 bg-emerald-500/70'}
            style={{ left: `${segment.left * 100}%`, width: `${segment.width * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const RubricFeedbackCard: React.FC<RubricFeedbackCardProps> = ({
  evaluation,
  className = '',
  showAudio = true,
}) => {
  const getBadgeColor = (cefr: string) => {
    switch (cefr) {
      case 'C2':
      case 'C1':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'B2':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'B1':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'A2':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const scorePercent = Math.round(evaluation.score * 100);

  return (
    <div className={`p-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl ${className}`}>
      {/* Top Header: CEFR & Score */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Разбор ответа (Rubric Evaluation)</h3>
            <p className="text-xs text-neutral-400">Тип: {evaluation.questionType || 'Open-ended'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeColor(
              evaluation.cefrLevel
            )}`}
          >
            Уровень: {evaluation.cefrLevel || 'B1'}
          </span>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-emerald-400">{scorePercent}%</span>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Точность рубрики</p>
          </div>
        </div>
      </div>

      {/* Embedded Audio Playback if available */}
      {showAudio && evaluation.audioUrl && (
        <div className="my-4">
          <AudioPlayer src={evaluation.audioUrl} title="Запись вашей устной речи" />
        </div>
      )}

      {evaluation.speakingDuration && evaluation.speakingDuration > 0 && (
        <>
          <PauseTimeline duration={evaluation.speakingDuration} pauses={evaluation.pauses || []} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-[11px] text-neutral-400 block mb-1">Темп</span>
              <span className="text-sm font-bold font-mono text-white">
                {Math.round(evaluation.speechRate || evaluation.wpm || 0)} сл/мин
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-[11px] text-neutral-400 block mb-1">Доля пауз</span>
              <span className="text-sm font-bold font-mono text-white">
                {Math.round((evaluation.pauseRatio || 0) * 100)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-[11px] text-neutral-400 block mb-1">Слова-заполнители</span>
              <span className="text-sm font-bold font-mono text-white">{evaluation.fillerCount || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-[11px] text-neutral-400 block mb-1">Стабильность подачи</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {Math.round((evaluation.pronunciationStability || 0) * 100)}%
              </span>
            </div>
          </div>
        </>
      )}

      {evaluation.rubric && evaluation.rubric.length > 0 && (
        <div className="my-4" data-testid="speaking-rubric">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Рубрика по критериям</span>
            <span className="text-[10px] text-neutral-500">4 критерия</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {evaluation.rubric.map((criterion) => (
              <div key={criterion.key} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{criterion.label}</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {Math.round(criterion.score * 100)}%
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-amber-400">{criterion.band}</p>
                <p className="mt-1.5 text-[11px] text-neutral-400">{criterion.evidence}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{criterion.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {evaluation.nextAction && (
        <div className="my-4 rounded-xl border border-[#D2F544]/30 bg-[#D2F544]/10 p-3 text-xs text-neutral-200" data-testid="speaking-next-action">
          <span className="block text-[10px] font-black uppercase tracking-wider text-[#D2F544] mb-1">
            Следующее действие
          </span>
          {evaluation.nextAction}
        </div>
      )}

      {/* Word-level clarity proxy (measured in the browser at record time) */}
      {evaluation.pronunciation && evaluation.pronunciation.words?.length > 0 && (
        <div className="my-4">
          <PronunciationFeedback
            report={{
              ...evaluation.pronunciation,
              version: 1,
              method: PRONUNCIATION_METHOD,
              notes: evaluation.pronunciation.notes ?? [],
            }}
            referenceText={evaluation.pronunciation.referenceText}
          />
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
            Количество слов
          </span>
          <span className="text-lg font-bold font-mono text-white">{evaluation.wordCount}</span>
        </div>

        {evaluation.speakingDuration !== undefined && evaluation.speakingDuration > 0 ? (
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              Длительность речи
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {Math.round(evaluation.speakingDuration)} сек
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
              Уникальных слов
            </span>
            <span className="text-lg font-bold font-mono text-white">{evaluation.uniqueWords}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Лексическое разнообразие
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {Math.round(evaluation.lexicalDiversity * 100)}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            {evaluation.wpm ? 'Темп речи (WPM)' : 'Соответствие теме'}
          </span>
          <span className="text-lg font-bold font-mono text-blue-400">
            {evaluation.wpm ? `${Math.round(evaluation.wpm)} сл/мин` : `${Math.round(evaluation.relevanceScore * 100)}%`}
          </span>
        </div>
      </div>

      {/* Academic Vocabulary & Discourse Connectors */}
      <div className="space-y-3 my-4">
        {evaluation.academicWords && evaluation.academicWords.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Академическая лексика B2/C1 ({evaluation.academicWords.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {evaluation.academicWords.map((word, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {evaluation.connectors && evaluation.connectors.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Связующие фразы и коннекторы ({evaluation.connectors.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {evaluation.connectors.map((conn, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                >
                  {conn}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transcript if available */}
      {evaluation.transcript && (
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/60 my-4 text-xs text-neutral-300 leading-relaxed italic">
          &ldquo;{evaluation.transcript}&rdquo;
        </div>
      )}

      {/* AI/Серверный feedback */}
      {evaluation.feedbackStatus && evaluation.feedbackStatus !== 'completed' && (
        <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Статус проверки: <strong>{evaluation.feedbackStatus}</strong>
          {evaluation.transcriptSource === 'none' && ' · серверное распознавание речи ещё не завершено'}
        </div>
      )}
      {evaluation.feedback && (
        <div className="my-4 rounded-xl border border-[#D2F544]/30 bg-[#D2F544]/10 p-3 text-xs text-neutral-200 leading-relaxed">
          <span className="block text-[10px] font-black uppercase tracking-wider text-[#D2F544] mb-1">
            Комментарий проверки
          </span>
          {evaluation.feedback}
        </div>
      )}
      {evaluation.evidenceSpans && evaluation.evidenceSpans.length > 0 && (
        <div className="my-4 space-y-2">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Evidence spans
          </span>
          {evaluation.evidenceSpans.map((span, index) => (
            <div key={index} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs">
              <p className="text-neutral-200">&ldquo;{span.text}&rdquo;</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-400">{span.label}</p>
              {span.suggestion && <p className="mt-1 text-neutral-400">{span.suggestion}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Actionable Recommendations */}
      {evaluation.recommendations && evaluation.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-4 h-4" />
            Рекомендации по улучшению
          </span>
          <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
            {evaluation.recommendations.map((rec, i) => (
              <li key={i} className="leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
