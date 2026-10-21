'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import vocabulary from '@/data/academicVocabulary.json';
import { readSelectBank, fillBlanksBank } from '@/data/questionBank';
import { BookOpen, Search, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

interface VocabularyEntry {
  id: string;
  word: string;
  ipa?: string;
  pos?: string;
  level?: string;
  meaningRu?: string;
  definitionEn?: string;
  example?: string;
  collocations?: string[];
}

const entries = vocabulary as VocabularyEntry[];
const levels = ['ALL', 'B1', 'B2', 'C1', 'C2'] as const;

export default function VocabularyPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<(typeof levels)[number]>('ALL');
  const [tab, setTab] = useState<'awl' | 'read-select' | 'fill-blanks'>('awl');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (level !== 'ALL' && entry.level !== level) return false;
      if (!normalized) return true;
      return (
        entry.word.toLowerCase().includes(normalized) ||
        (entry.meaningRu || '').toLowerCase().includes(normalized) ||
        (entry.definitionEn || '').toLowerCase().includes(normalized)
      );
    });
  }, [query, level]);

  const readSelectWords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return readSelectBank.filter((word) =>
      normalized ? word.word.toLowerCase().includes(normalized) : true
    );
  }, [query]);

  const fillWords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return fillBlanksBank.filter((item) =>
      normalized ? item.fullWord.toLowerCase().includes(normalized) : true
    );
  }, [query]);

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#D2F544]/20 border border-[#D2F544]/40 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#0C2418] mb-4">
            <BookOpen className="w-4 h-4" /> Открытый словарь
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0E1012] tracking-tight mb-4">
            Слова, которые встречаются в DET
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Academic Word List, ловушки Read & Select и слова из Fill in the Blanks. Не обещание
            «точного списка DET», а прозрачный набор лексики из тренировок платформы.
          </p>
        </div>

        <div className="bg-white/80 border border-neutral-200 rounded-3xl p-4 sm:p-5 shadow-sm mb-8 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти слово, перевод или определение..."
              autoCorrect="off"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-neutral-200 bg-white pl-12 pr-4 py-3 text-base text-neutral-900 outline-none focus:border-[#0C2418]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1">
              {(
                [
                  ['awl', `Academic Word List (${entries.length})`],
                  ['read-select', `Read & Select (${readSelectBank.length})`],
                  ['fill-blanks', `Fill in the Blanks (${fillBlanksBank.length})`],
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

            {tab === 'awl' && (
              <div className="flex items-center gap-1">
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
                    {item === 'ALL' ? 'Все уровни' : item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {tab === 'awl' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((entry) => (
              <article
                key={entry.id}
                className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[#0E1012]">{entry.word}</h2>
                    <p className="text-xs text-neutral-500 font-mono">
                      {entry.ipa} {entry.pos ? `· ${entry.pos}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#D2F544]/30 border border-[#D2F544]/60 px-2.5 py-0.5 text-[10px] font-black text-[#0C2418]">
                    {entry.level || '—'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-neutral-800">{entry.meaningRu}</p>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{entry.definitionEn}</p>
                {entry.example && (
                  <p className="mt-3 rounded-xl bg-neutral-50 border border-neutral-100 p-3 text-xs italic text-neutral-700">
                    {entry.example}
                  </p>
                )}
                {entry.collocations && entry.collocations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {entry.collocations.map((collocation) => (
                      <span
                        key={collocation}
                        className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600"
                      >
                        {collocation}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {tab === 'read-select' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {readSelectWords.map((word) => (
              <div
                key={`${word.word}-${word.isReal}`}
                className={`rounded-2xl border p-4 ${
                  word.isReal
                    ? 'bg-white border-neutral-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[#0E1012]">{word.word}</span>
                  {word.isReal ? (
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  {word.isReal ? 'Реальное слово' : 'Псевдослово-ловушка'} · {word.difficulty}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'fill-blanks' && (
          <div className="space-y-3">
            {fillWords.map((item) => (
              <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-black text-[#0E1012]">
                    {item.givenPrefix}
                    <span className="text-emerald-600">{item.missingLetters}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase text-neutral-500">
                    {item.difficulty}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  {item.sentenceBefore}{' '}
                  <strong className="text-[#0E1012]">{item.fullWord}</strong>{' '}
                  {item.sentenceAfter}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/practice/flashcards"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0E1012] px-6 py-3 text-sm font-bold text-white hover:bg-neutral-800 transition-colors"
          >
            Тренировать в SRS <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-6 py-3 text-sm font-bold text-[#0E1012] hover:border-neutral-400 transition-colors"
          >
            Открыть тренажёры <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
