/** Canonical public origin used by metadata, JSON-LD and sitemaps. */
export const SITE_URL = 'https://det-academy.ru';
export const SITE_NAME = 'DET Academy';

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
