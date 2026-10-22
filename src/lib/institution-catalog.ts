import duolingoInstitutions from '@/data/duolingoInstitutions.json';
import verifiedCoordinates from '@/data/verified-university-coordinates.json';
import type { Institution } from '@/lib/api';

export type InstitutionSource = 'duolingo' | 'extended';

export interface CatalogInstitution extends Institution {
  source: InstitutionSource;
  verified: boolean;
  coordinateSource?: string;
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

interface VerifiedCoordinate {
  title: string;
  latitude: number;
  longitude: number;
  sourceUrl: string;
  wikidataId: string;
}

function catalogKey(name: string, country: string): string {
  return `${name.toLowerCase().trim()}|${String(country || '').toLowerCase().trim()}`;
}

/**
 * Builds the map catalogue from the official Duolingo registry only.
 *
 * Coordinates are admitted only when an exact-name or redirect match exists on
 * the English Wikipedia page and that page publishes a primary coordinate.
 * Extended/generated rows are deliberately not used: a wrong pin is worse than
 * a missing one.
 */
// A few official registry names differ from the Wikipedia page only by a
// parenthetical/leading article. These coordinates were checked manually
// against the corresponding Wikipedia page and are kept as an explicit alias
// list rather than fuzzy-matched.
const manualVerifiedCoordinates: Record<string, VerifiedCoordinate> = {
  'The University of Chicago': {
    title: 'University of Chicago',
    latitude: 41.78972222,
    longitude: -87.59972222,
    sourceUrl: 'https://en.wikipedia.org/wiki/University_of_Chicago',
    wikidataId: 'Q131252',
  },
  'Westminster College (Pennsylvania)': {
    title: 'Westminster College (Pennsylvania)',
    latitude: 41.11777778,
    longitude: -80.32944444,
    sourceUrl: 'https://en.wikipedia.org/wiki/Westminster_College_(Pennsylvania)',
    wikidataId: 'Q7989148',
  },
};

export function buildInstitutionMapCatalog(): CatalogInstitution[] {
  const coordinates = verifiedCoordinates as Record<string, VerifiedCoordinate>;
  const byKey = new Map<string, CatalogInstitution>();

  for (const official of duolingoInstitutions as OfficialInstitution[]) {
    const coordinate = coordinates[official.name] || manualVerifiedCoordinates[official.name];
    if (!coordinate) continue;
    if (!Number.isFinite(coordinate.latitude) || !Number.isFinite(coordinate.longitude)) continue;
    if (coordinate.latitude === 0 && coordinate.longitude === 0) continue;

    const entry: CatalogInstitution = {
      id: official.id,
      name: official.name,
      country: official.country,
      city: '',
      state: official.state || '',
      minScore: 0,
      subscoreReqs: '',
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      websiteUrl: official.websiteUrl || '',
      category: 'Official DET',
      acceptanceRate: '',
      programs: official.programTypes || [],
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'duolingo',
      verified: true,
      coordinateSource: coordinate.sourceUrl,
    };
    byKey.set(catalogKey(entry.name, entry.country), entry);
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
    extended: 0,
    countries: new Set(catalog.map((item) => item.country)).size,
    withCoordinates: catalog.filter(
      (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    ).length,
  };
}
