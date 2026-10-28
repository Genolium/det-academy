import generated from '@/data/dictionary.generated.json';
import awlSeed from '@/data/vocabulary-awl.json';
import { slugify, truncate } from '@/lib/seo/slug';

/**
 * Public dictionary snapshot.
 *
 * `src/data/dictionary.generated.json` mirrors the committed generator output
 * used by `scripts/content`, and `src/data/vocabulary-awl.json` is generated
 * from `backend/db/04-vocabulary-seed.sql` by
 * `scripts/generate_awl_vocabulary.mjs`. Keeping both under `src/data` means
 * the public SEO routes do not depend on a build-time path outside the app.
 */

export interface SeoVocabularyEntry {
  id: string;
  word: string;
  slug: string;
  ipa: string;
  pos: string;
  level: string;
  meaningRu: string;
  definitionEn: string;
  example: string;
  collocations: string[];
  source: string;
  sourceUrl: string | null;
}

interface GeneratedEntry {
  word: string;
  ipa: string;
  pos: string;
  level: string;
  meaningRu: string;
  definitionEn: string;
  example: string;
  collocations: string[];
}

interface SeedEntry extends GeneratedEntry {
  id: string;
  source?: string;
  sourceUrl?: string;
}

const COURSE_SOURCE = 'DET Academy course dictionary';
const AWL_SOURCE = 'Academic Word List (platform dataset)';

function normaliseWord(word: string): string {
  return word.trim().toLowerCase();
}

function buildEntries(): SeoVocabularyEntry[] {
  const merged = new Map<string, SeoVocabularyEntry>();

  for (const entry of generated as GeneratedEntry[]) {
    const word = normaliseWord(entry.word);
    merged.set(word, {
      id: `course-${slugify(word)}`,
      word,
      slug: slugify(word),
      ipa: entry.ipa.trim(),
      pos: entry.pos.trim(),
      level: entry.level.trim().toUpperCase(),
      meaningRu: entry.meaningRu.trim(),
      definitionEn: entry.definitionEn.trim(),
      example: entry.example.trim(),
      collocations: entry.collocations.map((item) => item.trim()),
      source: COURSE_SOURCE,
      sourceUrl: null,
    });
  }

  for (const entry of awlSeed as SeedEntry[]) {
    const word = normaliseWord(entry.word);
    // The two sources do not overlap today. If they ever do, the reviewed AWL
    // entry wins because it carries an explicit source URL and version.
    merged.set(word, {
      id: entry.id || `awl-${slugify(word)}`,
      word,
      slug: slugify(word),
      ipa: entry.ipa.trim(),
      pos: entry.pos.trim(),
      level: entry.level.trim().toUpperCase(),
      meaningRu: entry.meaningRu.trim(),
      definitionEn: entry.definitionEn.trim(),
      example: entry.example.trim(),
      collocations: entry.collocations.map((item) => item.trim()),
      source: entry.source || AWL_SOURCE,
      sourceUrl: entry.sourceUrl || null,
    });
  }

  return Array.from(merged.values()).sort((a, b) => a.word.localeCompare(b.word));
}

const entries = buildEntries();
const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));

export function getWordBySlug(slug: string): SeoVocabularyEntry | undefined {
  return bySlug.get(slug);
}

export function getAllWordSlugs(): string[] {
  return entries.map((entry) => entry.slug);
}

export function getVocabularyCount(): number {
  return entries.length;
}

export function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function wordPageTitle(entry: SeoVocabularyEntry): string {
  return `${capitalizeWord(entry.word)} \u2014 meaning, pronunciation and examples`;
}

export function wordMetaDescription(entry: SeoVocabularyEntry): string {
  return truncate(
    `${capitalizeWord(entry.word)} (${entry.pos}, ${entry.level}): ${entry.definitionEn} Example: ${entry.example}`,
    158
  );
}

/**
 * Related words are chosen from shared level, part of speech and first letter.
 * The result is deterministic and never pretends to be a thesaurus.
 */
export function getRelatedWords(
  target: SeoVocabularyEntry,
  limit = 8
): SeoVocabularyEntry[] {
  return entries
    .filter((entry) => entry.slug !== target.slug)
    .map((entry) => {
      let score = 0;
      if (entry.pos === target.pos) score += 3;
      if (entry.level === target.level) score += 2;
      if (entry.word.charAt(0) === target.word.charAt(0)) score += 1;
      if (entry.word.slice(0, 3) === target.word.slice(0, 3)) score += 2;
      return { entry, score };
    })
    .sort((a, b) => b.score - a.score || a.entry.word.localeCompare(b.entry.word))
    .slice(0, limit)
    .map((item) => item.entry);
}
