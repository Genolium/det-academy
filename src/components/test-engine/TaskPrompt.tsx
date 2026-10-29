'use client';

import React, { useId, useMemo, useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { splitTaskPrompt } from '@/lib/taskPrompt';

interface TaskPromptProps {
  prompt: string;
  hints?: string[];
  className?: string;
  testId?: string;
}

/**
 * The task statement stays visible; coaching text is opt-in. This keeps the
 * screen looking like an exam item instead of a list of answer instructions.
 */
export const TaskPrompt: React.FC<TaskPromptProps> = ({
  prompt,
  hints,
  className = '',
  testId = 'task-prompt',
}) => {
  const { task, topic, hints: allHints } = useMemo(
    () => splitTaskPrompt(prompt, hints),
    [prompt, hints]
  );
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={className} data-testid={testId}>
      {topic && (
        <span className="mb-2 inline-block rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-neutral-300">
          {topic}
        </span>
      )}
      <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-medium">{task}</p>

      {allHints.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-1.5 text-[11px] font-bold text-neutral-300 transition-colors hover:border-[#D2F544]/60 hover:text-[#D2F544]"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {open ? 'Скрыть подсказку' : 'Подсказка'}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open && (
            <ul
              id={panelId}
              data-testid="task-hints"
              className="mt-2 space-y-1.5 rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 text-xs leading-relaxed text-neutral-400"
            >
              {allHints.map((hint, index) => (
                <li key={`${hint}-${index}`} className="flex gap-2">
                  <span aria-hidden="true" className="text-[#D2F544]">
                    •
                  </span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
