import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Info,
  Layers,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { PronounceWordButton } from '@/components/seo/PronounceWordButton';
import {
  getRelatedWords,
  getWordBySlug,
  wordMetaDescription,
  wordPageTitle,
} from '@/lib/seo/vocabulary';
import { absoluteUrl, SITE_NAME } from '@/lib/seo/site';

export const revalidate = 604_800;
export const dynamicParams = true;

interface WordPageProps {
  params: Promise<{ word: string }>;
}

function levelBadgeClass(level: string): string {
  switch (level) {
    case 'C2':
    case 'C1':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'B2':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'B1':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-neutral-200 bg-neutral-100 text-neutral-600';
  }
}

export async function generateMetadata({
  params,
}: WordPageProps): Promise<Metadata> {
  const { word } = await params;
  const entry = getWordBySlug(word);

  if (!entry) {
    return {
      title: 'Word not found',
      robots: { index: false, follow: false },
    };
  }

  const canonical = absoluteUrl(`/vocabulary/${entry.slug}`);
  const title = wordPageTitle(entry);
  const description = wordMetaDescription(entry);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'article',
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function WordPage({ params }: WordPageProps) {
  const { word } = await params;
  const entry = getWordBySlug(word);

  if (!entry) notFound();

  const related = getRelatedWords(entry);
  const canonical = absoluteUrl(`/vocabulary/${entry.slug}`);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm',
        '@id': `${canonical}#term`,
        name: entry.word,
        description: entry.definitionEn,
        url: canonical,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'DET Academy English vocabulary',
          url: absoluteUrl('/vocabulary'),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: absoluteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Vocabulary',
            item: absoluteUrl('/vocabulary'),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: entry.word,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <div lang="en" className="min-h-screen py-10 ambient-glow">
      <JsonLd data={structuredData} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Vocabulary', href: '/vocabulary' },
            { name: entry.word },
          ]}
        />

        <header className="relative mt-5 overflow-hidden rounded-3xl border border-neutral-800 bg-[#0E1012] p-7 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#D2F544]/15 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D2F544] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#0C2418]">
                <BookOpen className="h-3.5 w-3.5" />
                Dictionary entry
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${levelBadgeClass(entry.level)}`}
              >
                CEFR {entry.level}
              </span>
              <span className="rounded-full border border-neutral-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                {entry.pos}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {entry.word}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <p className="font-mono text-sm text-[#D2F544]">
                <span className="sr-only">IPA pronunciation: </span>
                {entry.ipa}
              </p>
              <PronounceWordButton word={entry.word} />
              <span className="text-[11px] text-neutral-400">
                Listen to the pronunciation
              </span>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <div className="space-y-4 md:col-span-3">
            <section
              aria-labelledby="russian-meaning"
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h2
                id="russian-meaning"
                className="text-[10px] font-black uppercase tracking-wider text-neutral-500"
              >
                Russian meaning
              </h2>
              <p
                lang="ru"
                className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#0E1012]"
              >
                {entry.meaningRu}
              </p>
            </section>

            <section
              aria-labelledby="english-definition"
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h2
                id="english-definition"
                className="text-[10px] font-black uppercase tracking-wider text-neutral-500"
              >
                English definition
              </h2>
              <p className="mt-2 text-base leading-relaxed text-neutral-800">
                {entry.definitionEn}
              </p>
            </section>

            <section
              aria-labelledby="example"
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h2
                id="example"
                className="text-[10px] font-black uppercase tracking-wider text-neutral-500"
              >
                Example
              </h2>
              <blockquote className="mt-2 border-l-2 border-[#D2F544] pl-4 text-sm italic leading-relaxed text-neutral-700">
                {entry.example}
              </blockquote>
            </section>

            <section
              aria-labelledby="collocations"
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h2
                id="collocations"
                className="text-[10px] font-black uppercase tracking-wider text-neutral-500"
              >
                Collocations
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {entry.collocations.map((collocation) => (
                  <li
                    key={collocation}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700"
                  >
                    {collocation}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-4 md:col-span-2">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-[#0E1012]">
                Word facts
              </h2>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    IPA
                  </dt>
                  <dd className="text-right font-mono text-xs text-neutral-800">
                    {entry.ipa}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    Part of speech
                  </dt>
                  <dd className="text-right text-xs font-semibold text-neutral-800">
                    {entry.pos}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    CEFR level
                  </dt>
                  <dd className="text-right text-xs font-semibold text-neutral-800">
                    {entry.level}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    Source
                  </dt>
                  <dd className="max-w-[65%] text-right text-[11px] leading-snug text-neutral-700">
                    {entry.sourceUrl ? (
                      <a
                        href={entry.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                      >
                        {entry.source}
                      </a>
                    ) : (
                      entry.source
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-[#0E1012]">
                Related words
              </h2>
              <p className="mt-1 text-[11px] text-neutral-500">
                Shared level, part of speech and word shape — not synonyms.
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/vocabulary/${item.slug}`}
                      className="inline-flex items-baseline gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                    >
                      {item.word}
                      <span className="text-[9px] font-bold text-neutral-400">
                        {item.level}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl bg-[#0E1012] p-6 text-white shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-black tracking-tight">
                <Sparkles className="h-4 w-4 text-[#D2F544]" />
                Learn it in context
              </h2>
              <div className="mt-4 space-y-2">
                <Link
                  href="/practice/flashcards"
                  className="inline-flex w-full items-center justify-between gap-2 rounded-full bg-[#D2F544] px-4 py-2.5 text-xs font-black text-[#0C2418]"
                >
                  Practise in SRS
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/vocabulary"
                  className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-neutral-700 px-4 py-2.5 text-xs font-bold text-neutral-200 transition-colors hover:border-neutral-500"
                >
                  Back to the dictionary
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-neutral-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            This is learning content written for DET preparation, not an
            official dictionary entry. Check a current dictionary or the
            institution&apos;s policy when precision matters.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-white p-6">
          <div>
            <h2 className="text-base font-black tracking-tight text-[#0E1012]">
              Explore the dictionary
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Definitions, IPA, Russian meanings, examples and collocations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/vocabulary"
              className="inline-flex items-center gap-2 rounded-full bg-[#0E1012] px-5 py-2.5 text-xs font-black text-white transition-colors hover:bg-neutral-800"
            >
              <Volume2 className="h-4 w-4 text-[#D2F544]" />
              All words
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-500"
            >
              <Layers className="h-4 w-4" />
              Practice
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
