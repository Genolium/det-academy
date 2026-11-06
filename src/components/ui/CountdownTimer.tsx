'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  seconds: number;
  totalSeconds?: number;
  label?: string;
  tone?: 'exam' | 'practice';
  warnAt?: number;
  criticalAt?: number;
  showProgress?: boolean;
  className?: string;
}

function format(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  seconds,
  totalSeconds,
  label = 'Осталось',
  tone = 'practice',
  warnAt = 60,
  criticalAt = 10,
  showProgress = true,
  className = '',
}) => {
  const critical = seconds <= criticalAt;
  const warning = !critical && seconds <= warnAt;
  const palette =
    tone === 'exam'
      ? critical
        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
        : warning
          ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
          : 'border-neutral-700 bg-neutral-900 text-[#D2F544]'
      : critical
        ? 'border-rose-300 bg-rose-50 text-rose-700'
        : warning
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-neutral-200 bg-white text-neutral-800';

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${palette} ${
          critical ? 'animate-pulse' : ''
        }`}
        role="timer"
        aria-label={`${label}: ${format(seconds)}`}
      >
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{format(seconds)}</span>
      </div>
      {showProgress && totalSeconds && totalSeconds > 0 && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200/80">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              critical ? 'bg-rose-500' : warning ? 'bg-amber-500' : 'bg-[#D2F544]'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (seconds / totalSeconds) * 100))}%` }}
          />
        </div>
      )}
      {critical && (
        <span className={`text-[10px] font-bold ${tone === 'exam' ? 'text-rose-300' : 'text-rose-700'}`}>
          Время заканчивается
        </span>
      )}
      {warning && !critical && (
        <span className={`text-[10px] font-semibold ${tone === 'exam' ? 'text-amber-200' : 'text-amber-800'}`}>
          Осталось меньше {warnAt} секунд
        </span>
      )}
    </div>
  );
};
