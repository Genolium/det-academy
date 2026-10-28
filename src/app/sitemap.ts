import type { MetadataRoute } from 'next';
import {
  getAllCountries,
  getAllInstitutionSlugs,
  getScoreInstitutions,
} from '@/lib/seo/institutions';
import { getAllWordSlugs } from '@/lib/seo/vocabulary';
import { SITE_URL } from '@/lib/seo/site';

export const revalidate = 86_400;

/**
 * One sitemap file, no per-record static pages.
 *
 * Institution and dictionary detail routes are rendered on demand with ISR.
 * The sitemap is a single generated XML response, so adding thousands of
 * catalogue rows does not add thousands of build artifacts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date('2026-10-28T00:00:00.000Z');
  const registryDate = new Date('2026-10-21T00:00:00.000Z');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: today, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/institutions`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/vocabulary`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/theory`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/practice`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/practice/flashcards`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/practice/typing`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/practice/pronunciation`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/diagnostic`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/test`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/verify`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const countryRoutes: MetadataRoute.Sitemap = getAllCountries().map((country) => ({
    url: `${SITE_URL}/institutions/country/${country.slug}`,
    lastModified: registryDate,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const institutionRoutes: MetadataRoute.Sitemap = getAllInstitutionSlugs().map((slug) => ({
    url: `${SITE_URL}/institutions/${slug}`,
    lastModified: registryDate,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const scoreRoutes: MetadataRoute.Sitemap = getScoreInstitutions(20).map((institution) => ({
    url: `${SITE_URL}/institutions/${institution.slug}/det-score`,
    lastModified: registryDate,
    changeFrequency: 'monthly',
    priority: 0.65,
  }));

  const wordRoutes: MetadataRoute.Sitemap = getAllWordSlugs().map((slug) => ({
    url: `${SITE_URL}/vocabulary/${slug}`,
    lastModified: today,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...countryRoutes, ...institutionRoutes, ...scoreRoutes, ...wordRoutes];
}
