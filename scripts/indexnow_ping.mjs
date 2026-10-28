#!/usr/bin/env node
/**
 * IndexNow ping for the public catalogue.
 *
 * The default is a dry run: it fetches the sitemap, validates the key file and
 * prints what would be submitted. Nothing leaves the machine unless `--send` is
 * passed explicitly.
 *
 *   node scripts/indexnow_ping.mjs --dry-run
 *   node scripts/indexnow_ping.mjs --send --limit=200
 *
 * https://www.indexnow.org/documentation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://det-academy.ru';
const DEFAULT_KEY = 'detacademy2026indexnow4f7c';
const args = process.argv.slice(2);
const send = args.includes('--send');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const sitemapArg = args.find((arg) => arg.startsWith('--sitemap='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Number.POSITIVE_INFINITY;
const sitemapUrl = sitemapArg ? sitemapArg.split('=')[1] : `${SITE_URL}/sitemap.xml`;
const key = process.env.INDEXNOW_KEY || DEFAULT_KEY;
const keyPath = path.join(root, 'public', `${key}.txt`);

if (!fs.existsSync(keyPath)) {
  console.error(`FAIL key file not found: ${path.relative(root, keyPath)}`);
  process.exit(1);
}
const keyFileValue = fs.readFileSync(keyPath, 'utf8').trim();
if (keyFileValue !== key) {
  console.error('FAIL key file does not contain the configured key');
  process.exit(1);
}

const response = await fetch(sitemapUrl, { headers: { accept: 'application/xml' } });
if (!response.ok) {
  console.error(`FAIL sitemap ${sitemapUrl} returned ${response.status}`);
  process.exit(1);
}
const xml = await response.text();
const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
  .map((match) => match[1].replace(/&amp;/g, '&'))
  .filter((url) => url.startsWith(SITE_URL))
  .slice(0, limit);

if (urls.length === 0) {
  console.error('FAIL sitemap contains no URLs for the site');
  process.exit(1);
}

console.log(`IndexNow key: ${key.slice(0, 6)}... (${path.relative(root, keyPath)})`);
console.log(`Sitemap: ${sitemapUrl}`);
console.log(`URLs: ${urls.length}`);
for (const url of urls.slice(0, 5)) console.log(`  ${url}`);
if (urls.length > 5) console.log(`  ... ${urls.length - 5} more`);

if (!send) {
  console.log('Dry run: nothing submitted. Pass --send to ping IndexNow.');
  process.exit(0);
}

const chunks = [];
for (let index = 0; index < urls.length; index += 10_000) {
  chunks.push(urls.slice(index, index + 10_000));
}
for (const [index, chunk] of chunks.entries()) {
  const ping = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList: chunk,
    }),
  });
  console.log(`Chunk ${index + 1}/${chunks.length}: HTTP ${ping.status}`);
  if (!ping.ok) {
    console.error(await ping.text().catch(() => ''));
    process.exit(1);
  }
}
console.log('IndexNow ping accepted.');
