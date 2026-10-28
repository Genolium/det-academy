'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { playPronunciation } from '@/lib/pronunciation';

/**
 * English-only pronunciation control for public SEO pages.
 *
 * The regular PronounceButton follows the client locale store, whose initial
 * server value is Russian. Public catalogue pages render in English for every
 * visitor, so their controls must not emit Russian aria-labels during SSR.
 */
export function PronounceWordButton({ word }: { word: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Play pronunciation: ${word}`}
      title="Listen"
      onClick={async () => {
        setBusy(true);
        try {
          await playPronunciation(word);
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-white text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544]"
    >
      <Volume2 className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`} />
    </button>
  );
}
