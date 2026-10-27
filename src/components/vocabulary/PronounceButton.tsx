'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { playPronunciation } from '@/lib/pronunciation';
import { useSettingsStore } from '@/store/useSettingsStore';

interface PronounceButtonProps {
  word: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Plays the pronunciation of a word. Uses a real recording when the free
 * dictionary API has one and the browser voice otherwise, so the learner can
 * hear the word instead of decoding the IPA.
 */
export const PronounceButton: React.FC<PronounceButtonProps> = ({ word, className = '', size = 'md' }) => {
  const { locale } = useSettingsStore();
  const [busy, setBusy] = useState(false);

  const label =
    locale === 'ru' ? `Прослушать произношение: ${word}` : `Play pronunciation: ${word}`;

  return (
    <button
      type="button"
      aria-label={label}
      title={locale === 'ru' ? 'Прослушать' : 'Listen'}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setBusy(true);
        try {
          await playPronunciation(word);
        } finally {
          setBusy(false);
        }
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544] h-11 w-11 ${className}`}
    >
      <Volume2 className={`${size === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5'} ${busy ? 'animate-pulse' : ''}`} />
    </button>
  );
};
