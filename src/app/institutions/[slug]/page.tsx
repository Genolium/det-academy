import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  GraduationCap,
  Info,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  countryUrl,
  formatPlace,
  getCountryBySlug,
  getInstitutionBySlug,
  getSimilarInstitutions,
  institutionHeadingLocation,
  institutionMetaDescription,
  institutionPageTitle,
  programLabels,
} from '@/lib/seo/institutions';
import { absoluteUrl, SITE_NAME } from '@/lib/seo/site';

// Dynamic on-demand rendering with ISR: the 4,087 catalogue pages are not
// written as individual files during the build.
export const revalidate = 86_400;
export const dynamicParams = true;

interface InstitutionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: InstitutionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const institution = getInstitutionBySlug(slug);

  if (!institution) {
    return {
      title: 'Institution not found',
      robots: { index: false, follow: false },
    };
  }

  const canonical = absoluteUrl(`/institutions/${institution.slug}`);
  const title = institutionPageTitle(institution);
  const description = institutionMetaDescription(institution);

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
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

function scoreCell(label: string, value: number | null) {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-white p-4">
      <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-black tabular-nums text-[#0E1012]">
        {value ?? '\u2014'}
      </dd>
      <dd className="text-[11px] font-medium text-neutral-500">
        {value === null ? 'Not stored' : 'Platform reference'}
      </dd>
    </div>
  );
}

export default async function InstitutionPage({
  params,
}: InstitutionPageProps) {
  const { slug } = await params;
  const institution = getInstitutionBySlug(slug);

  if (!institution) notFound();

  const country = getCountryBySlug(institution.countrySlug);
  const similar = getSimilarInstitutions(institution);
  const programs = programLabels(institution.programs);
  const canonical = absoluteUrl(`/institutions/${institution.slug}`);
  const location = institutionHeadingLocation(institution);

  const isCollegeOrUniversity =
    institution.programs.includes('UNDERGRADUATE') ||
    institution.programs.includes('GRADUATE') ||
    /(university|college|institute|polytechnic|academy)/i.test(institution.name);

  const schemaType = isCollegeOrUniversity
    ? 'CollegeOrUniversity'
    : institution.programs.includes('SECONDARY_SCHOOL')
      ? 'School'
      : 'EducationalOrganization';

  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressCountry: institution.country,
  };
  if (institution.city) address.addressLocality = institution.city;
  if (institution.state) address.addressRegion = institution.state;

  const institutionSchema: Record<string, unknown> = {
    '@type': schemaType,
    '@id': `${canonical}#institution`,
    name: institution.name,
    url: institution.websiteUrl || canonical,
    address,
    description: institution.fulfillsRequirement
      ? `${institution.name} appears in the official Duolingo English Test institution registry.`
      : `${institution.name} appears in the official Duolingo institution registry; the entry does not mark its programs as DET-fulfilling.`,
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      institutionSchema,
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
            name: 'Institutions',
            item: absoluteUrl('/institutions'),
          },
          ...(country
            ? [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: country.name,
                  item: absoluteUrl(countryUrl(country)),
                },
              ]
            : []),
          {
            '@type': 'ListItem',
            position: country ? 4 : 3,
            name: institution.name,
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
            { name: 'Institutions', href: '/institutions' },
            ...(country
              ? [{ name: country.name, href: countryUrl(country) }]
              : []),
            { name: institution.name },
          ]}
        />

        <header className="relative mt-5 overflow-hidden rounded-3xl border border-neutral-800 bg-[#0E1012] p-7 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#D2F544]/15 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D2F544] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#0C2418]">
                <BookOpen className="h-3.5 w-3.5" />
                Official registry entry
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                Platform reference data
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {institution.name}
            </h1>

            <p className="mt-3 flex items-start gap-2 text-sm font-medium text-neutral-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D2F544]" />
              <span>{location || institution.country}</span>
            </p>

            {programs.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Registry programs">
                {programs.map((program) => (
                  <li
                    key={program}
                    className="rounded-full border border-neutral-700 px-3 py-1 text-[11px] font-semibold text-neutral-200"
                  >
                    {program}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        <section
          aria-labelledby="det-reference"
          className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2
                id="det-reference"
                className="text-lg font-black tracking-tight text-[#0E1012] sm:text-xl"
              >
                DET acceptance and score reference
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-950">
                <strong>Platform reference, not an official requirement.</strong>{' '}
                The score values below are reference figures stored by DET
                Academy. They are not published or endorsed by the institution
                or by Duolingo, and admission requirements change. Always verify
                on the institution&apos;s website and the official registry
                before applying.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {scoreCell('Platform reference', institution.minScore)}
            {scoreCell('Literacy', institution.subscores?.literacy ?? null)}
            {scoreCell(
              'Comprehension',
              institution.subscores?.comprehension ?? null
            )}
            {scoreCell(
              'Production',
              institution.subscores?.production ?? null
            )}
            {scoreCell(
              'Conversation',
              institution.subscores?.conversation ?? null
            )}
          </dl>

          <p className="mt-4 rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-xs leading-relaxed text-amber-950">
            {institution.fulfillsRequirement
              ? 'The official registry entry marks at least one listed program as fulfilling a DET requirement. The numeric scores above are still platform references, not the institution\u2019s published policy.'
              : 'The official registry entry does not mark the listed programs as DET-fulfilling. That does not prove the DET is rejected — confirm directly with the institution.'}
            {!institution.minScore &&
              ' No platform reference score is stored for this institution; this is a data gap, not evidence that no requirement exists.'}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={institution.registryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0E1012] px-5 py-3 text-xs font-black text-white transition-colors hover:bg-neutral-800"
            >
              Check the official Duolingo registry
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {institution.websiteUrl && (
              <a
                href={institution.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-5 py-3 text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-500"
              >
                Institution website
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <section
            aria-labelledby="institution-details"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-3"
          >
            <h2
              id="institution-details"
              className="text-lg font-black tracking-tight text-[#0E1012]"
            >
              Institution details
            </h2>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  Country
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0E1012]">
                  {country ? (
                    <Link
                      href={countryUrl(country)}
                      className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                    >
                      {institution.country}
                    </Link>
                  ) : (
                    institution.country
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  City / state
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0E1012]">
                  {formatPlace(institution.city, institution.state) || 'Not listed'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  Registry program type
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0E1012]">
                  {institution.registryKind}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  Platform category
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0E1012]">
                  {institution.platformCategory || 'Not classified'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  Programs in the registry
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0E1012]">
                  {programs.length > 0 ? programs.join(', ') : 'Not listed'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  Registry checked
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0E1012]">
                  <time dateTime={institution.checkedAt}>
                    {institution.checkedAt}
                  </time>
                </dd>
              </div>
            </dl>

            <p className="mt-5 flex items-start gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-[11px] leading-relaxed text-neutral-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              A platform category is a label from our dataset. It is not an
              official ranking, accreditation, or admission classification.
            </p>
          </section>

          <aside className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-black tracking-tight text-[#0E1012]">
              Plan your application
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Use a diagnostic test to see your current DET range, then compare
              it with the platform reference on this page. The comparison is
              practice guidance, not an admission prediction.
            </p>
            <div className="mt-5 space-y-2.5">
              <Link
                href="/diagnostic"
                className="inline-flex w-full items-center justify-between gap-2 rounded-full bg-[#0E1012] px-5 py-3 text-xs font-black text-white transition-colors hover:bg-neutral-800"
              >
                Take the diagnostic
                <ArrowRight className="h-4 w-4 text-[#D2F544]" />
              </Link>
              <Link
                href="/practice"
                className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-neutral-300 px-5 py-3 text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-500"
              >
                Open practice drills
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vocabulary"
                className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-neutral-300 px-5 py-3 text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-500"
              >
                Build academic vocabulary
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar-institutions" className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="similar-institutions"
                  className="text-xl font-black tracking-tight text-[#0E1012]"
                >
                  Similar institutions in {institution.country}
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Shared country, location and registry program type. Alphabetical
                  order — not a ranking.
                </p>
              </div>
              {country && (
                <Link
                  href={countryUrl(country)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                >
                  Country overview ({country.count.toLocaleString('en-US')})
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {similar.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/institutions/${item.slug}`}
                    className="group flex h-full items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
                  >
                    <span>
                      <span className="block text-sm font-black leading-snug text-[#0E1012]">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-[11px] text-neutral-500">
                        {formatPlace(item.city, item.state) || item.country}
                      </span>
                    </span>
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-[#0E1012]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-black tracking-tight text-[#0E1012]">
              Browse the full catalogue
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Every entry keeps its own page with the same visible disclaimers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/institutions"
              className="inline-flex items-center gap-2 rounded-full bg-[#0E1012] px-5 py-2.5 text-xs font-black text-white transition-colors hover:bg-neutral-800"
            >
              All institutions
              <ArrowRight className="h-4 w-4 text-[#D2F544]" />
            </Link>
            <Link
              href="/vocabulary"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-xs font-bold text-neutral-700 transition-colors hover:border-neutral-500"
            >
              Dictionary
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-neutral-500">
          DET Academy is an independent test-preparation platform and is not
          affiliated with Duolingo. Institution names, locations and program
          types come from the public Duolingo institution directory. Reference
          scores are stored by DET Academy and are not official admission
          requirements. Verify every requirement with the institution.
        </p>
      </div>
    </div>
  );
}
