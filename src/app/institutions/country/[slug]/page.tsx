import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ExternalLink, MapPin, ShieldAlert } from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  formatPlace,
  getAllCountries,
  getCountryBySlug,
  programLabels,
} from '@/lib/seo/institutions';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site';
import { truncate } from '@/lib/seo/slug';

export const revalidate = 86_400;
export const dynamicParams = true;

/**
 * Country hubs are navigational pages, not the crawl surface: the sitemap
 * lists every institution separately. Capping the visible list keeps the
 * largest country page (United States) fast instead of shipping several
 * megabytes of links in one response.
 */
const COUNTRY_PAGE_LIMIT = 150;

interface CountryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountryBySlug(slug);

  if (!country) {
    return {
      title: 'Country not found',
      robots: { index: false, follow: false },
    };
  }

  const canonical = absoluteUrl(`/institutions/country/${country.slug}`);
  const title = `DET institutions in ${country.name}`;
  const description = truncate(
    `Browse ${country.count} institutions in ${country.name} listed in the Duolingo English Test institution registry. Score values are platform references, not official requirements.`,
    158
  );

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
    twitter: { card: 'summary', title, description },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug } = await params;
  const country = getCountryBySlug(slug);

  if (!country) notFound();

  const canonical = absoluteUrl(`/institutions/country/${country.slug}`);
  const visibleInstitutions = country.institutions.slice(0, COUNTRY_PAGE_LIMIT);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#page`,
        name: `Duolingo English Test institutions in ${country.name}`,
        description: `${country.count} institutions in ${country.name} listed in the Duolingo English Test institution registry.`,
        url: canonical,
        isPartOf: {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
        },
        about: { '@type': 'Country', name: country.name },
      },
      {
        '@type': 'ItemList',
        numberOfItems: visibleInstitutions.length,
        itemListElement: visibleInstitutions.map((institution, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: institution.name,
          url: absoluteUrl(`/institutions/${institution.slug}`),
        })),
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
            name: 'Institutions',
            item: absoluteUrl('/institutions'),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: country.name,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <div lang="en" className="min-h-screen py-10 ambient-glow">
      <JsonLd data={structuredData} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Institutions', href: '/institutions' },
            { name: country.name },
          ]}
        />

        <header className="relative mt-5 overflow-hidden rounded-3xl border border-neutral-800 bg-[#0E1012] p-7 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#D2F544]/15 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D2F544] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#0C2418]">
              <MapPin className="h-3.5 w-3.5" />
              Country index
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Duolingo English Test institutions in {country.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300">
              {country.count.toLocaleString('en-US')} registry entries. Each page
              keeps platform reference scores separate from official admission
              requirements.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/institutions"
                className="inline-flex items-center gap-2 rounded-full bg-[#D2F544] px-5 py-2.5 text-xs font-black text-[#0C2418] transition-transform hover:scale-[1.02]"
              >
                All institutions
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://englishtest.duolingo.com/institutions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-5 py-2.5 text-xs font-bold text-neutral-200 transition-colors hover:border-neutral-500"
              >
                Official registry
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </header>

        <div className="mt-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p>
            <strong>Platform reference, not an official requirement.</strong>{' '}
            Registry membership is not the same as a published score threshold.
            Check the official registry and the institution before applying.
          </p>
        </div>

        <section aria-labelledby="country-institutions" className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="country-institutions"
              className="text-xl font-black tracking-tight text-[#0E1012]"
            >
              Institutions in {country.name}
            </h2>
            <p className="text-[11px] text-neutral-500">
              Showing {visibleInstitutions.length.toLocaleString('en-US')} of{' '}
              {country.count.toLocaleString('en-US')} · alphabetical, not a
              ranking.
            </p>
          </div>

          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleInstitutions.map((institution) => {
              const programs = programLabels(institution.programs);
              return (
                <li key={institution.slug}>
                  <Link
                    href={`/institutions/${institution.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
                  >
                    <span className="text-sm font-black leading-snug text-[#0E1012]">
                      {institution.name}
                    </span>
                    <span className="mt-1 text-[11px] text-neutral-500">
                      {formatPlace(institution.city, institution.state) ||
                        country.name}
                    </span>
                    <span className="mt-3 flex flex-wrap items-center gap-1.5">
                      {institution.minScore ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          Ref. {institution.minScore}
                        </span>
                      ) : (
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                          No reference score
                        </span>
                      )}
                      {programs.slice(0, 2).map((program) => (
                        <span
                          key={program}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600"
                        >
                          {program}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {country.count > visibleInstitutions.length && (
            <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center">
              <p className="text-xs leading-relaxed text-neutral-600">
                This overview shows the first {COUNTRY_PAGE_LIMIT} entries
                alphabetically. The searchable registry and the XML sitemap list
                every one of the {country.count.toLocaleString('en-US')} pages.
              </p>
              <Link
                href="/institutions"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#0E1012] px-5 py-2.5 text-xs font-black text-white transition-colors hover:bg-neutral-800"
              >
                Search all institutions
                <ArrowRight className="h-4 w-4 text-[#D2F544]" />
              </Link>
            </div>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-black tracking-tight text-[#0E1012]">
            Other countries
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Jump to another country index. All {getAllCountries().length} country
            indexes follow the same rules.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {getAllCountries()
              .filter((item) => item.slug !== country.slug)
              .map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/institutions/country/${item.slug}`}
                    className="inline-flex rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-semibold text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-neutral-500">
          DET Academy is an independent test-preparation platform and is not
          affiliated with Duolingo. Reference scores are stored by DET Academy
          and are not official admission requirements.
        </p>
      </div>
    </div>
  );
}
