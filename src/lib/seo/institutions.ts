import duolingoInstitutions from '@/data/duolingoInstitutions.json';
import institutionLocations from '@/data/institution-locations.json';
import institutionMetadata from '@/data/institution-metadata.json';
import {
  DET_REGISTRY_URL,
  REQUIREMENT_CHECKED_AT,
} from '@/lib/institution-catalog';
import { localizeCountry } from '@/lib/countryNames';
import { slugify, truncate } from '@/lib/seo/slug';

interface RegistryInstitution {
  id: string;
  accountId?: string;
  name: string;
  country: string;
  state?: string;
  websiteUrl?: string;
  fulfillsRequirement?: boolean;
  programTypes?: string[];
}

interface InstitutionLocation {
  city?: string;
  state?: string;
  country?: string;
}

interface InstitutionMetadata {
  minScore?: number;
  minLiteracy?: number;
  minComprehension?: number;
  minProduction?: number;
  minConversation?: number;
  category?: string;
}

export interface SeoSubscores {
  literacy: number;
  comprehension: number;
  production: number;
  conversation: number;
}

export interface SeoInstitution {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryRaw: string;
  countrySlug: string;
  city: string;
  state: string;
  /** Platform label from the catalogue. Never presented as an official rank. */
  platformCategory: string | null;
  /** Factual grouping derived only from the registry program types. */
  registryKind: string;
  programs: string[];
  websiteUrl: string | null;
  /** Platform reference only. `null` means no value is stored. */
  minScore: number | null;
  subscores: SeoSubscores | null;
  /** Whether the official registry marks at least one program as DET-fulfilling. */
  fulfillsRequirement: boolean;
  registryUrl: string;
  checkedAt: string;
}

export interface SeoCountry {
  slug: string;
  name: string;
  count: number;
  institutions: SeoInstitution[];
}

const rows = duolingoInstitutions as RegistryInstitution[];
const locations = institutionLocations as Record<string, InstitutionLocation>;
const metadata = institutionMetadata as Record<string, InstitutionMetadata>;

const PROGRAM_LABELS: Record<string, string> = {
  UNDERGRADUATE: 'Undergraduate',
  GRADUATE: 'Graduate',
  SECONDARY_SCHOOL: 'Secondary school',
  COMMUNITY_COLLEGE: 'Community college',
  ESL: 'English language',
  STUDY_ABROAD_EXCHANGE: 'Study abroad / exchange',
  OTHER: 'Other program',
};

function normalizeWebsite(url?: string): string | null {
  const value = (url || '').trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('www.')) return `https://${value}`;
  const match = value.match(/^(https?):(.+)$/);
  if (match) return `${match[1]}://${match[2]}`;
  return `https://${value}`;
}

function uniquePrograms(programTypes?: string[]): string[] {
  return Array.from(new Set((programTypes || []).filter(Boolean))).sort(
    (a, b) => {
      const order = Object.keys(PROGRAM_LABELS);
      return order.indexOf(a) - order.indexOf(b);
    }
  );
}

function programLabel(type: string): string {
  return PROGRAM_LABELS[type] || type.replace(/_/g, ' ').toLowerCase();
}

export function registryKindFor(programs: string[]): string {
  if (programs.length === 0) return 'Programs not listed in the registry';
  if (programs.includes('COMMUNITY_COLLEGE')) return 'Community college';
  if (programs.includes('UNDERGRADUATE') || programs.includes('GRADUATE')) {
    return 'Higher education';
  }
  if (programs.includes('SECONDARY_SCHOOL')) return 'Secondary school';
  if (programs.includes('ESL')) return 'English language program';
  return 'Other education provider';
}

export function programLabels(programs: string[]): string[] {
  return programs.map(programLabel);
}

function buildSubscores(meta: InstitutionMetadata | undefined): SeoSubscores | null {
  if (!meta) return null;
  const values = [
    meta.minLiteracy,
    meta.minComprehension,
    meta.minProduction,
    meta.minConversation,
  ];
  if (!values.every((value): value is number => typeof value === 'number' && value > 0)) {
    return null;
  }
  return {
    literacy: meta.minLiteracy as number,
    comprehension: meta.minComprehension as number,
    production: meta.minProduction as number,
    conversation: meta.minConversation as number,
  };
}

/**
 * Stable slug mapping built from the original registry rows.
 *
 * The registry has four repeated names. Every row keeps its own page, so the
 * country is appended to duplicated names and the account identifier is used
 * only when the name and country are both identical. Sorting before assigning
 * makes the mapping independent of the JSON row order.
 */
function buildInstitutions(): SeoInstitution[] {
  const groups = new Map<string, RegistryInstitution[]>();

  for (const row of rows) {
    const base = slugify(row.name);
    const group = groups.get(base);
    if (group) group.push(row);
    else groups.set(base, [row]);
  }

  const used = new Set<string>();
  const slugByRow = new Map<RegistryInstitution, string>();

  for (const [base, group] of groups) {
    const ordered = [...group].sort((a, b) => a.id.localeCompare(b.id));
    for (const row of ordered) {
      let candidate = base;
      if (group.length > 1) {
        candidate = `${base}-${slugify(localizeCountry(row.country, 'en'))}`;
        if (used.has(candidate)) {
          const account = slugify(row.accountId || row.id);
          candidate = `${candidate}-${account.slice(-8)}`;
        }
      }

      let counter = 2;
      const preferred = candidate;
      while (used.has(candidate)) {
        candidate = `${preferred}-${counter}`;
        counter += 1;
      }
      used.add(candidate);
      slugByRow.set(row, candidate);
    }
  }

  return rows.map((row) => {
    const location = locations[row.name] || {};
    const meta = metadata[row.name];
    const country = localizeCountry(row.country, 'en');
    const programs = uniquePrograms(row.programTypes);
    const minScore =
      typeof meta?.minScore === 'number' && meta.minScore > 0
        ? meta.minScore
        : null;

    return {
      id: row.id,
      name: row.name,
      slug: slugByRow.get(row) || slugify(row.name),
      country,
      countryRaw: row.country,
      countrySlug: slugify(country),
      city: location.city || '',
      state: location.state || row.state || '',
      platformCategory: meta?.category?.trim() || null,
      registryKind: registryKindFor(programs),
      programs,
      websiteUrl: normalizeWebsite(row.websiteUrl),
      minScore,
      subscores: minScore ? buildSubscores(meta) : null,
      fulfillsRequirement: row.fulfillsRequirement === true,
      registryUrl: DET_REGISTRY_URL,
      checkedAt: REQUIREMENT_CHECKED_AT,
    };
  });
}

const institutions = buildInstitutions();

const bySlug = new Map<string, SeoInstitution>();
const byCountry = new Map<string, SeoCountry>();

for (const institution of institutions) {
  bySlug.set(institution.slug, institution);
  const country = byCountry.get(institution.countrySlug);
  if (country) {
    country.institutions.push(institution);
    country.count += 1;
  } else {
    byCountry.set(institution.countrySlug, {
      slug: institution.countrySlug,
      name: institution.country,
      count: 1,
      institutions: [institution],
    });
  }
}

for (const country of byCountry.values()) {
  country.institutions.sort((a, b) => a.name.localeCompare(b.name));
}

const countries = Array.from(byCountry.values()).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function getInstitutionBySlug(slug: string): SeoInstitution | undefined {
  return bySlug.get(slug);
}

export function getAllInstitutionSlugs(): string[] {
  return institutions.map((institution) => institution.slug);
}

export function getCountryBySlug(slug: string): SeoCountry | undefined {
  return byCountry.get(slug);
}

export function getAllCountries(): SeoCountry[] {
  return countries;
}

export function getInstitutionCount(): number {
  return institutions.length;
}

export function getCountryCount(): number {
  return countries.length;
}

export function countryUrl(country: SeoCountry | string): string {
  const slug = typeof country === 'string' ? country : country.slug;
  return `/institutions/country/${slug}`;
}

function similarityScore(target: SeoInstitution, candidate: SeoInstitution): number {
  let score = 0;
  if (target.city && target.city === candidate.city) score += 4;
  if (target.state && target.state === candidate.state) score += 2;
  if (target.platformCategory && target.platformCategory === candidate.platformCategory) {
    score += 3;
  }
  if (target.registryKind === candidate.registryKind) score += 1;
  return score;
}

/**
 * Same-country neighbours for internal linking. No ranking claim is implied:
 * the list is sorted by shared location/type signals and then alphabetically.
 */
export function getSimilarInstitutions(
  target: SeoInstitution,
  limit = 8
): SeoInstitution[] {
  const pool = byCountry.get(target.countrySlug)?.institutions || [];
  return pool
    .filter(
      (candidate) =>
        candidate.slug !== target.slug && candidate.name !== target.name
    )
    .map((candidate) => ({
      candidate,
      score: similarityScore(target, candidate),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.name.localeCompare(b.candidate.name)
    )
    .slice(0, limit)
    .map((item) => item.candidate);
}

export function formatPlace(...parts: Array<string | undefined>): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const value = (part || '').trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique.join(', ');
}

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function institutionPageTitle(institution: SeoInstitution): string {
  const name =
    institution.name.length > 44
      ? `${institution.name.slice(0, 41).trimEnd()}\u2026`
      : institution.name;
  return `${name} \u2014 DET acceptance`;
}

export function institutionMetaDescription(institution: SeoInstitution): string {
  const place = formatPlace(
    institution.city,
    institution.state,
    institution.country
  );
  const status = institution.fulfillsRequirement
    ? 'listed in the Duolingo English Test registry'
    : 'listed in the Duolingo institution registry';
  const score = institution.minScore
    ? ` Platform reference score: ${institution.minScore}.`
    : '';
  return truncate(
    `${institution.name}${place ? ` in ${place}` : ''} is ${status}.${score} Values are platform references, not official admission requirements.`,
    158
  );
}

export function institutionHeadingLocation(institution: SeoInstitution): string {
  return capitalizeFirst(
    formatPlace(institution.city, institution.state, institution.country)
  );
}
