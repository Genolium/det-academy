import duolingoInstitutions from '@/data/duolingoInstitutions.json';
import verifiedCoordinates from '@/data/verified-university-coordinates.json';
import institutionLocations from '@/data/institution-locations.json';
import institutionMetadata from '@/data/institution-metadata.json';
import type { Institution } from '@/lib/api';

export type InstitutionSource = 'duolingo' | 'extended';

export interface CatalogInstitution extends Institution {
  source: InstitutionSource;
  verified: boolean;
  coordinateSource?: string;
  /** Where the DET requirement comes from. */
  requirementSource?: string;
  /** When the requirement was last checked (YYYY-MM-DD). */
  requirementCheckedAt?: string;
  /** True only when the institution itself publishes the requirement. */
  requirementVerified: boolean;
}

export const DET_REGISTRY_URL = 'https://englishtest.duolingo.com/institutions';
/** Date of the last verification run of the platform catalogue. */
export const REQUIREMENT_CHECKED_AT = '2026-10-21';

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

interface InstitutionLocation {
  city: string;
  state: string;
  country: string;
}

interface InstitutionMetadata {
  minScore?: number;
  minLiteracy?: number;
  minComprehension?: number;
  minProduction?: number;
  minConversation?: number;
  subscoreReqs?: string;
  category?: string;
  acceptanceRate?: string;
}

const coordinates = verifiedCoordinates as Record<string, VerifiedCoordinate>;
const locations = institutionLocations as Record<string, InstitutionLocation>;
const metadata = institutionMetadata as Record<string, InstitutionMetadata>;

function normalizeWebsite(url?: string): string {
  const value = (url || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('www.')) return `https://${value}`;
  const match = value.match(/^(https?):(.+)$/);
  if (match) return `${match[1]}://${match[2]}`;
  return `https://${value}`;
}

function catalogKey(name: string, country: string): string {
  return `${name.toLowerCase().trim()}|${String(country || '').toLowerCase().trim()}`;
}

/**
 * Builds the map catalogue from the official Duolingo registry.
 *
 * A university reaches the map only when its exact registry name matches a
 * Wikipedia article that publishes a primary campus coordinate. City, state
 * and country come from Wikidata (P131/P17) for the same article. DET score
 * thresholds and categories come from the platform catalogue and are labelled
 * as unconfirmed, because the official registry does not publish them.
 */
export function buildInstitutionMapCatalog(): CatalogInstitution[] {
  const byKey = new Map<string, CatalogInstitution>();

  for (const official of duolingoInstitutions as OfficialInstitution[]) {
    const coordinate = coordinates[official.name];
    if (!coordinate) continue;
    if (!Number.isFinite(coordinate.latitude) || !Number.isFinite(coordinate.longitude)) continue;
    if (coordinate.latitude === 0 && coordinate.longitude === 0) continue;

    const location = locations[official.name] || { city: '', state: '', country: '' };
    const meta = metadata[official.name] || {};

    const entry: CatalogInstitution = {
      id: official.id,
      name: official.name,
      country: location.country || official.country,
      city: location.city || '',
      state: location.state || official.state || '',
      minScore: meta.minScore || 0,
      minLiteracy: meta.minLiteracy,
      minComprehension: meta.minComprehension,
      minProduction: meta.minProduction,
      minConversation: meta.minConversation,
      subscoreReqs: meta.subscoreReqs || '',
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      websiteUrl: normalizeWebsite(official.websiteUrl),
      category: meta.category || 'Official DET',
      acceptanceRate: meta.acceptanceRate || '',
      programs: official.programTypes || [],
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'duolingo',
      verified: true,
      coordinateSource: coordinate.sourceUrl,
      // The official registry confirms that the university accepts the DET,
      // but it does not publish score thresholds. The numbers below are the
      // platform's reference values, so they are explicitly not verified.
      requirementSource: DET_REGISTRY_URL,
      requirementCheckedAt: REQUIREMENT_CHECKED_AT,
      requirementVerified: false,
    };
    byKey.set(catalogKey(entry.name, entry.country), entry);
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const country = a.country.localeCompare(b.country);
    return country !== 0 ? country : a.name.localeCompare(b.name);
  });
}

export function getInstitutionMapStats(catalog: CatalogInstitution[]) {
  const categories: Record<string, number> = {};
  for (const item of catalog) {
    categories[item.category] = (categories[item.category] || 0) + 1;
  }
  return {
    total: catalog.length,
    official: catalog.filter((item) => item.source === 'duolingo').length,
    extended: 0,
    countries: new Set(catalog.map((item) => item.country)).size,
    withCoordinates: catalog.filter(
      (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    ).length,
    withCity: catalog.filter((item) => Boolean(item.city)).length,
    withScore: catalog.filter((item) => item.minScore > 0).length,
    categories,
  };
}
