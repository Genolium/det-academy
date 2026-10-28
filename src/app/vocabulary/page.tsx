'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { readSelectBank, fillBlanksBank } from '@/data/questionBank';
import { api, VocabularyEntry } from '@/lib/api';
import { ArrowRight, BookOpen, Search, Sparkles } from 'lucide-react';
import { PronounceButton } from '@/components/vocabulary/PronounceButton';
import { vocabularyCopy } from '@/lib/vocabularyCopy';
import { useSettingsStore } from '@/store/useSettingsStore';

const levels = ['ALL', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const sources = ['all', 'awl', 'course', 'b1'] as const;
const PAGE_SIZE = 48;

type Tab = 'dictionary' | 'read-select' | 'fill-blanks';

const levelBadge = (level: string) => {
  switch (level) {
    case 'C2':
    case 'C1':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'B2':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'B1':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-neutral-100 text-neutral-600 border-neutral-200';
  }
};

export default function VocabularyPage() {
  const { locale } = useSettingsStore();
  const copy = vocabularyCopy[locale];
  const [tab, setTab] = useState<Tab>('dictionary');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<(typeof levels)[number]>('ALL');
  const [source, setSource] = useState<(typeof sources)[number][0]>('all');

  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setLoadError(null);
      try {
        const response = await api.getVocabulary({
          search: query.trim(),
          level,
          source,
          limit: PAGE_SIZE,
          offset,
        });
        setEntries((current) => (append ? [...current, ...response.entries] : response.entries));
        setTotal(response.total);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : vocabularyCopy[locale].error);
        if (!append) {
          setEntries([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, level, source]
  );

  useEffect(() => {
    if (tab !== 'dictionary') return;
    const timer = setTimeout(() => {
      void fetchPage(0, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPage, tab]);

  const readSelectWords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...readSelectBank]
      .filter((word) => (needle ? word.word.toLowerCase().includes(needle) : true))
      .sort((a, b) => a.word.localeCompare(b.word));
  }, [query]);

  const fillWords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...fillBlanksBank]
      .filter((item) => (needle ? item.fullWord.toLowerCase().includes(needle) : true))
      .sort((a, b) => a.fullWord.localeCompare(b.fullWord));
  }, [query]);

  const hint =
    source === 'awl' && level === 'B1'
      ? copy.b1Hint
      : null;

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/40 bg-[#D2F544]/20 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#0C2418]">
            <BookOpen className="h-4 w-4" /> {copy.badge}
          </div>
          <h1 className="mb-4 text-3xl font-black tracking-tight text-[#0E1012] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">{copy.subtitle}</p>
        </div>

        <div className="mb-8 space-y-4 rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
              autoCorrect="off"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-base text-neutral-900 outline-none focus:border-[#0C2418]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-neutral-100 p-1">
              {(
                [
                  ['dictionary', `${copy.tabs.dictionary} (${total || '…'})`],
                  ['read-select', `${copy.tabs.readSelect} (${readSelectBank.length})`],
                  ['fill-blanks', `${copy.tabs.fillBlanks} (${fillBlanksBank.length})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    tab === key ? 'bg-white text-[#0E1012] shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'dictionary' && (
              <div className="flex flex-wrap items-center gap-1">
                {levels.map((item) => (
                  <button
                    key={item}
                    onClick={() => setLevel(item)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      level === item
                        ? 'bg-[#0E1012] text-white'
                        : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {item === 'ALL' ? copy.levels.all : item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tab === 'dictionary' && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">{copy.sourceLabel}</span>
              {sources.map((key) => (
                <button
                  key={key}
                  onClick={() => setSource(key)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
                    source === key
                      ? 'border-[#0C2418] bg-[#0C2418] text-white'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {copy.sources[key]}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === 'dictionary' && (
          <section aria-label={copy.tabs.dictionary}>
            {hint && (
              <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                {hint}
              </p>
            )}

            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-3xl border border-neutral-200 bg-white" />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                {loadError}
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center">
                <p className="text-sm text-neutral-500">{copy.emptyTitle}</p>
                <p className="mt-2 text-xs text-neutral-400">
                  {copy.emptyHint}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-black tracking-tight text-[#0E1012]">{entry.word}</h2>
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            {entry.ipa || '—'} {entry.pos ? `· ${entry.pos}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${levelBadge(entry.level)}`}>
                            {entry.level}
                          </span>
                          <PronounceButton word={entry.word} size="sm" />
                        </div>
                      </div>

                      <p className="text-sm font-semibold leading-snug text-[#0E1012]">
                        {locale === 'ru' ? entry.meaningRu : entry.definitionEn}
                      </p>
                      {locale === 'ru' && (
                        <p className="text-xs leading-relaxed text-neutral-600">{entry.definitionEn}</p>
                      )}
                      {entry.example && (
                        <p className="border-l-2 border-[#D2F544] pl-3 text-xs italic leading-relaxed text-neutral-500">
                          {entry.example}
                        </p>
                      )}
                      {entry.collocations && entry.collocations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.collocations.map((collocation) => (
                            <span key={collocation} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                              {collocation}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-[11px] text-neutral-400">
                    {copy.shown(entries.length, total)}
                  </p>
                  {entries.length < total && (
                    <button
                      type="button"
                      onClick={() => void fetchPage(entries.length, true)}
                      disabled={loadingMore}
                      className="rounded-full border border-neutral-300 px-5 py-2.5 text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-500 disabled:opacity-50"
                    >
                      {loadingMore ? copy.loadingMore : copy.showMore}
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {tab === 'read-select' && (
          <section aria-label="Read and Select" className="space-y-3">
            <p className="text-xs text-neutral-500">
              {copy.readSelectNote(readSelectWords.length)}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {readSelectWords.map((item) => (
                <div key={`${item.word}-${item.difficulty}`} className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5">
                  <div className="min-w-0">
                    <span className="truncate text-sm font-bold text-[#0E1012]">{item.word}</span>
                    <span className="ml-2 text-[10px] font-bold text-neutral-400">{item.difficulty}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.isReal ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
                      {item.isReal ? 'real' : 'pseudo'}
                    </span>
                    {item.isReal && <PronounceButton word={item.word} size="sm" />}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'fill-blanks' && (
          <section aria-label="Fill in the Blanks" className="space-y-3">
            <p className="text-xs text-neutral-500">
              {copy.fillBlanksNote(fillWords.length)}
            </p>
            <div className="space-y-2">
              {fillWords.map((item) => (
                <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed text-neutral-700">
                      {item.sentenceBefore}{' '}
                      <span className="rounded bg-[#D2F544]/30 px-1 font-bold text-[#0E1012]">{item.fullWord}</span>{' '}
                      {item.sentenceAfter}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] font-bold text-neutral-400">{item.difficulty}</span>
                      <PronounceButton word={item.fullWord} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/practice/flashcards" className="inline-flex items-center gap-2 rounded-full bg-[#0E1012] px-6 py-3 text-xs font-black text-white transition-colors hover:bg-neutral-800">
            {copy.srs} <ArrowRight className="h-4 w-4 text-[#D2F544]" />
          </Link>
          <Link href="/practice" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-500">
            {copy.drills} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/theory/start-here" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900">
            <Sparkles className="h-3.5 w-3.5" /> {copy.howToLearn}
          </Link>
        </div>
      </div>
    </div>
  );
}
