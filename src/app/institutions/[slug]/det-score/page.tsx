import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, Info, Target } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getInstitutionBySlug,
  getScoreInstitutions,
  getSimilarInstitutions,
  institutionHeadingLocation,
} from '@/lib/seo/institutions';
import { absoluteUrl, SITE_NAME } from '@/lib/seo/site';

export const revalidate = 86_400;
export const dynamicParams = true;

interface ScorePageProps {
  params: Promise<{ slug: string }>;
}

const BANDS = [110, 120, 125, 130, 140];

export async function generateMetadata({ params }: ScorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const institution = getInstitutionBySlug(slug);
  if (!institution || institution.minScore === null) {
    return { title: 'DET score reference not found', robots: { index: false, follow: false } };
  }
  const canonical = absoluteUrl(`/institutions/${institution.slug}/det-score`);
  const title = `DET score for ${institution.name}: ${institution.minScore}+`;
  const description = `DET Academy reference: ${institution.name} in ${institution.country} lists a ${institution.minScore} DET score for its programs. See subscores, score bands and how to verify the requirement.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function InstitutionScorePage({ params }: ScorePageProps) {
  const { slug } = await params;
  const institution = getInstitutionBySlug(slug);
  if (!institution || institution.minScore === null) notFound();

  const place = institutionHeadingLocation(institution);
  const similar = getSimilarInstitutions(institution, 4);
  const others = getScoreInstitutions(20)
    .filter((item) => item.slug !== institution.slug)
    .slice(0, 5);
  const canonical = absoluteUrl(`/institutions/${institution.slug}/det-score`);
  const score = institution.minScore;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `DET score for ${institution.name}`,
    url: canonical,
    description: `Platform reference for the Duolingo English Test score listed by ${institution.name}.`,
    about: {
      '@type': 'CollegeOrUniversity',
      name: institution.name,
      url: institution.websiteUrl || absoluteUrl(`/institutions/${institution.slug}`),
      address: { '@type': 'PostalAddress', addressLocality: institution.city, addressCountry: institution.country },
    },
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/') },
  };

  return (
    <main className="min-h-screen bg-[#F6F4EE] text-[#0E1012]">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <nav className="mb-6 flex flex-wrap gap-2 text-xs text-neutral-500" aria-label="Breadcrumb">
          <Link href="/institutions" className="hover:text-[#0E1012]">Institutions</Link>
          <span>/</span>
          <Link href={`/institutions/${institution.slug}`} className="hover:text-[#0E1012]">{institution.name}</Link>
          <span>/</span>
          <span>DET score</span>
        </nav>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-900">
          <Target className="h-3.5 w-3.5" /> Score reference
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
          DET score for {institution.name}: {score}+
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
          {place}. This is the platform reference stored for {institution.registryKind.toLowerCase()} programs.
          It is not an official admission decision; always verify the current requirement with the institution.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Overall</p>
            <p className="mt-1 text-4xl font-black tabular-nums">{score}+</p>
            <p className="mt-1 text-xs text-neutral-500">DET overall score</p>
          </div>
          {institution.subscores ? (
            [institution.subscores.literacy, institution.subscores.comprehension, institution.subscores.production, institution.subscores.conversation].map((value, index) => (
              <div key={index} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  {['Literacy', 'Comprehension', 'Production', 'Conversation'][index]}
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums">{value}+</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Subscores</p>
              <p className="mt-1 text-sm text-neutral-600">The catalogue does not store separate subscores for this institution.</p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">What does {score}+ mean for your preparation?</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            {BANDS.map((band) => {
              const met = band >= score;
              return (
                <div key={band} className={`rounded-xl border p-3 text-center ${met ? 'border-emerald-200 bg-emerald-50' : 'border-neutral-200 bg-neutral-50'}`}>
                  <p className="text-lg font-black tabular-nums">{band}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${met ? 'text-emerald-700' : 'text-neutral-500'}`}>
                    {met ? 'meets reference' : 'below reference'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/practice/adaptive" className="inline-flex items-center gap-2 rounded-full bg-[#0E1012] px-4 py-2.5 text-xs font-bold text-white">
              <BookOpen className="h-3.5 w-3.5 text-[#D2F544]" /> Practice my weakest skill
            </Link>
            <Link href="/test" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2.5 text-xs font-bold">
              Take a full mock <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">Verify before you apply</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Requirements change by program and intake. Check the institution page and the official registry before
            making an application decision. DET Academy is independent and is not affiliated with Duolingo.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
            <Link href={`/institutions/${institution.slug}`} className="underline">Institution profile</Link>
            {institution.websiteUrl ? <a href={institution.websiteUrl} rel="nofollow noopener" target="_blank" className="underline">Official website</a> : null}
            <a href={institution.registryUrl} rel="nofollow noopener" target="_blank" className="underline">Registry source</a>
          </div>
        </section>

        {others.length > 0 || similar.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-bold">Other DET score references</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[...similar, ...others].filter((item) => item.minScore !== null).slice(0, 6).map((item) => (
                <Link key={item.slug} href={`/institutions/${item.slug}/det-score`} className="rounded-xl border border-neutral-200 bg-white p-3 text-sm hover:border-neutral-400">
                  <span className="font-bold">{item.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">{item.minScore}+</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-8 flex items-start gap-2 text-[11px] text-neutral-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Platform reference only. Not an official Duolingo or university statement. Last catalogue check: {institution.checkedAt}.
        </p>
      </div>
    </main>
  );
}
