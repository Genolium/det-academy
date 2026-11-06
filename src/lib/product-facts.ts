import { THEORY_TASK_COUNT } from '@/data/theoryTaxonomy';

/** Single source of product facts shown in marketing and UI. */

export const PRODUCT_FACTS = {
  theoryLessons: THEORY_TASK_COUNT,
  activeTaskTypes: 13,
  comingSoonTaskTypes: 0,
  vocabularyCount: 506,
  institutionRegistryCount: 4087,
  officialDetDurationMinutes: 60,
  diagnosticMinutes: 20,
  certificateMinScore: 105,
  detScaleMin: 10,
  detScaleMax: 160,
  verifyOrigin: 'https://det-academy.ru',
  detInstitutionsUrl: 'https://englishtest.duolingo.com/institutions',
} as const;

export function formatCount(value: number, locale: 'ru' | 'en' = 'en'): string {
  return value.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US');
}

export function verifyUrl(certificateId: string): string {
  return `${PRODUCT_FACTS.verifyOrigin}/verify/${encodeURIComponent(certificateId)}`;
}
