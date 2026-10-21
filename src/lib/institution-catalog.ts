import { institutionsDataset } from '@/data/institutionsData';
import duolingoInstitutions from '@/data/duolingoInstitutions.json';
import type { Institution } from '@/lib/api';

export type InstitutionSource = 'duolingo' | 'extended';

export interface CatalogInstitution extends Institution {
  /** Official Duolingo registry match or an extended local catalogue entry. */
  source: InstitutionSource;
  /** True only when the institution is present in the official Duolingo registry. */
  verified: boolean;
}

interface OfficialInstitution {
  id: string;
  name: string;
  country: string;
  state?: string;
  websiteUrl?: string;
  fulfillsRequirement?: boolean;
  programTypes?: string[];
  programsCount?: number;
}

function normalizeName(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim();
}

function websiteDomain(value?: string): string {
  if (!value) return '';
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function catalogKey(name: string, country: string): string {
  return `${normalizeName(name)}|${String(country || '').toLowerCase()}`;
}

/**
 * Builds the map catalogue from all local sources.
 *
 * The extended catalogue supplies coordinates and display fields. Exact or
 * domain matches against the official Duolingo registry upgrade an entry to
 * "verified"; entries found only in the extended catalogue remain labelled
 * "extended" rather than being presented as official DET requirements.
 */
export function buildInstitutionMapCatalog(): CatalogInstitution[] {
  const byKey = new Map<string, CatalogInstitution>();
  const byName = new Map<string, CatalogInstitution>();
  const byDomain = new Map<string, CatalogInstitution>();

  for (const local of institutionsDataset) {
    if (!Number.isFinite(local.latitude) || !Number.isFinite(local.longitude)) continue;
    if (local.latitude === 0 && local.longitude === 0) continue;
    const entry: CatalogInstitution = {
      ...local,
      createdAt: local.createdAt || '2026-01-01T00:00:00.000Z',
      source: 'extended',
      verified: false,
    };
    const key = catalogKey(entry.name, entry.country);
    byKey.set(key, entry);
    byName.set(normalizeName(entry.name), entry);
    const domain = websiteDomain(entry.websiteUrl);
    if (domain) byDomain.set(domain, entry);
  }

  for (const official of duolingoInstitutions as OfficialInstitution[]) {
    const exact = byName.get(normalizeName(official.name));
    const domain = websiteDomain(official.websiteUrl);
    const matched = exact || (domain ? byDomain.get(domain) : undefined);
    if (!matched) continue;

    const previousKey = catalogKey(matched.name, matched.country);
    matched.source = 'duolingo';
    matched.verified = true;
    matched.name = official.name || matched.name;
    if (official.websiteUrl) matched.websiteUrl = official.websiteUrl;
    if (official.programTypes?.length && matched.programs.length === 0) {
      matched.programs = official.programTypes;
    }
    const nextKey = catalogKey(matched.name, matched.country);
    if (previousKey !== nextKey) byKey.delete(previousKey);
    byKey.set(nextKey, matched);
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const country = a.country.localeCompare(b.country);
    return country !== 0 ? country : a.name.localeCompare(b.name);
  });
}

export function getInstitutionMapStats(catalog: CatalogInstitution[]) {
  return {
    total: catalog.length,
    official: catalog.filter((item) => item.source === 'duolingo').length,
    extended: catalog.filter((item) => item.source === 'extended').length,
    countries: new Set(catalog.map((item) => item.country)).size,
    withCoordinates: catalog.filter(
      (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    ).length,
  };
}
