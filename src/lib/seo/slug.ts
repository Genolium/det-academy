/**
 * URL-safe slug used by the public catalogue routes.
 *
 * The source name may contain typographic quotes, zero-width characters and
 * other punctuation. Everything outside `[a-z0-9]` becomes a hyphen so the
 * resulting slug is stable across browsers and build environments.
 */
export function slugify(value: string): string {
  const ascii = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['\u2019\u2018]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  // Keep URLs readable. Collision handling in the catalogue appends a stable
  // discriminator when two long names share the same truncated prefix.
  return ascii.slice(0, 90).replace(/-+$/g, '') || 'item';
}

export function truncate(value: string, maxLength: number): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const boundary = cut.lastIndexOf(' ');
  return `${(boundary > maxLength * 0.6 ? cut.slice(0, boundary) : cut).trimEnd()}\u2026`;
}
