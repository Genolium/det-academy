/**
 * Single frontend source of truth for the current DET theory taxonomy.
 *
 * The course has 13 graded task types. The two orientation guides and the
 * local `start-here` introduction are useful reading, but never count toward
 * progress or certificate eligibility.
 */

export const THEORY_TASK_SLUGS = [
  'read-and-select',
  'fill-in-the-blanks',
  'read-and-complete',
  'listen-and-type',
  'interactive-reading',
  'interactive-listening',
  'write-about-photo',
  'interactive-writing',
  'speak-about-photo',
  'read-then-speak',
  'interactive-speaking',
  'writing-sample',
  'speaking-sample',
] as const;

export const THEORY_REFERENCE_SLUGS = [
  'rules-and-technicalities',
  'subscores-and-cat-engine',
] as const;

export const THEORY_TASK_COUNT = THEORY_TASK_SLUGS.length;

const TASK_SET = new Set<string>(THEORY_TASK_SLUGS);

/** Retired lesson slugs mapped to the current lessons that replace them. */
export const RETIRED_THEORY_SLUG_MAP: Record<string, readonly string[]> = {
  'listen-and-select': ['fill-in-the-blanks'],
  'read-aloud': ['read-then-speak'],
  'read-listen-speak': ['read-then-speak', 'interactive-speaking'],
};

export function isTheoryTaskSlug(slug: string): boolean {
  return TASK_SET.has(slug);
}

/**
 * Migrates browser-local progress that may still contain retired slugs.
 * Keeps only trackable tasks, removes duplicates and returns official order.
 */
export function normalizeTheoryCompletedLessons(slugs: readonly string[] | null | undefined): string[] {
  const mapped = new Set<string>();
  for (const slug of slugs || []) {
    const targets = RETIRED_THEORY_SLUG_MAP[slug] || [slug];
    for (const target of targets) {
      if (isTheoryTaskSlug(target)) mapped.add(target);
    }
  }
  return THEORY_TASK_SLUGS.filter((slug) => mapped.has(slug));
}
