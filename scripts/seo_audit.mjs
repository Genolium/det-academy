#!/usr/bin/env node
/**
 * Public-page SEO audit for the catalogue routes.
 *
 * It checks the server response (no browser): status, a single h1, canonical,
 * meta description, parseable JSON-LD, the visible disclaimer, sitemap
 * coverage, and 404s for unknown slugs.
 *
 *   BASE_URL=http://localhost:3101 node scripts/seo_audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3101').replace(/\/$/, '');
const SITE_URL = 'https://det-academy.ru';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryRows = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/duolingoInstitutions.json'), 'utf8')
);
const generatedWords = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/dictionary.generated.json'), 'utf8')
);
const awlWords = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/vocabulary-awl.json'), 'utf8')
);
const expectedInstitutions = registryRows.length;
const expectedCountries = new Set(registryRows.map((row) => row.country)).size;
const expectedWords = new Set(
  [...generatedWords, ...awlWords].map((entry) => entry.word.trim().toLowerCase())
).size;
// Home, institutions, vocabulary, theory, practice, flashcards, typing,
// diagnostic, test, verify, privacy.
const expectedStaticRoutes = 11;
const expectedTotal =
  expectedStaticRoutes + expectedInstitutions + expectedCountries + expectedWords;

const INSTITUTION_ROUTES = [
  '/institutions/stanford-university',
  '/institutions/imperial-college-london',
  '/institutions/cuny-school-of-professional-studies-united-states-wug3uqag',
];

const COUNTRY_ROUTES = ['/institutions/country/united-states'];

const WORD_ROUTES = [
  '/vocabulary/able',
  '/vocabulary/substantiate',
  '/vocabulary/affect',
];

const UNKNOWN_ROUTES = [
  '/institutions/this-institution-does-not-exist-xyz',
  '/vocabulary/notawordxyz',
  '/institutions/country/not-a-country-xyz',
];

const failures = [];
const checks = [];

function fail(message) {
  failures.push(message);
  console.log(`  FAIL ${message}`);
}

function pass(message) {
  checks.push(message);
  console.log(`  ok   ${message}`);
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match ? decodeEntities(match[1]) : null;
}

function inspectHtml(route, html, status) {
  if (status !== 200) {
    fail(`${route} returned ${status}`);
    return null;
  }

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length === 1) pass(`${route} has exactly one h1`);
  else fail(`${route} has ${h1s.length} h1 elements`);

  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  const titleText = title ? stripTags(title[1]) : '';
  if (titleText) pass(`${route} has a title`);
  else fail(`${route} has no title`);

  const canonicalTag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i);
  const canonical = canonicalTag ? attribute(canonicalTag[0], 'href') : null;
  if (canonical && canonical.startsWith(`${SITE_URL}/`)) {
    pass(`${route} canonical is ${canonical}`);
  } else {
    fail(`${route} has no absolute canonical (${canonical || 'missing'})`);
  }

  let description = null;
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if ((attribute(tag, 'name') || '').toLowerCase() === 'description') {
      description = attribute(tag, 'content');
      break;
    }
  }
  if (description && description.length >= 50) {
    pass(`${route} has a ${description.length}-character meta description`);
  } else {
    fail(`${route} has no usable meta description`);
  }

  const compactDescription = (description || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, '');
  // Readable description sanity: reject obvious template leftovers and raw
  // JSON-LD leaking into the meta tag.
  if (/undefined|null|\[object Object\]/i.test(compactDescription)) {
    fail(`${route} meta description contains placeholder values`);
  }

  const jsonLdBlocks = [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  if (jsonLdBlocks.length === 0) {
    fail(`${route} has no JSON-LD`);
  } else {
    for (const block of jsonLdBlocks) {
      try {
        JSON.parse(block[1]);
      } catch (error) {
        fail(`${route} JSON-LD does not parse: ${error.message}`);
      }
    }
    pass(`${route} has ${jsonLdBlocks.length} parseable JSON-LD block(s)`);
  }

  const h1Text = h1s.length === 1 ? stripTags(h1s[0][1]) : '';
  const chromeText = `${titleText} ${h1Text} ${description || ''}`;
  if (/[\u0400-\u04FF]/.test(chromeText)) {
    fail(`${route} has Cyrillic in title, h1 or meta description`);
  } else {
    pass(`${route} title/h1/description are English`);
  }

  return { titleText, h1Text, description, canonical, html };
}

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    redirect: 'manual',
    headers: { 'user-agent': 'DET-Academy-SEO-Audit/1.0' },
  });
  return { status: response.status, text: await response.text() };
}

async function main() {
  console.log(`SEO audit against ${BASE_URL}\n`);

  console.log('Institution pages');
  for (const route of INSTITUTION_ROUTES) {
    const { status, text } = await request(route);
    const inspected = inspectHtml(route, text, status);
    if (!inspected) continue;
    if (text.includes('Platform reference, not an official requirement.')) {
      pass(`${route} shows the platform-reference disclaimer`);
    } else {
      fail(`${route} is missing the platform-reference disclaimer`);
    }
    if (text.includes('https://englishtest.duolingo.com/institutions')) {
      pass(`${route} links to the official registry`);
    } else {
      fail(`${route} does not link to the official registry`);
    }
    if (/"@type":"CollegeOrUniversity"/.test(text) || /"@type":"EducationalOrganization"/.test(text) || /"@type":"School"/.test(text)) {
      pass(`${route} has an institution JSON-LD type`);
    } else {
      fail(`${route} has no institution JSON-LD type`);
    }
  }

  console.log('\nCountry index');
  for (const route of COUNTRY_ROUTES) {
    const { status, text } = await request(route);
    inspectHtml(route, text, status);
  }

  console.log('\nDictionary pages');
  for (const route of WORD_ROUTES) {
    const { status, text } = await request(route);
    const inspected = inspectHtml(route, text, status);
    if (!inspected) continue;
    if (text.includes('"@type":"DefinedTerm"')) {
      pass(`${route} has DefinedTerm JSON-LD`);
    } else {
      fail(`${route} has no DefinedTerm JSON-LD`);
    }
    if (text.includes('lang="ru"') && text.includes('Russian meaning')) {
      pass(`${route} shows the labelled Russian meaning`);
    } else {
      fail(`${route} is missing the labelled Russian meaning`);
    }
    if (text.includes('Collocations') && text.includes('Related words')) {
      pass(`${route} has collocations and related words`);
    } else {
      fail(`${route} is missing collocations or related words`);
    }
  }

  console.log('\nUnknown slugs');
  for (const route of UNKNOWN_ROUTES) {
    const { status } = await request(route);
    if (status === 404) pass(`${route} returns 404`);
    else fail(`${route} returned ${status}, expected 404`);
  }

  console.log('\nSitemap');
  const sitemap = await request('/sitemap.xml');
  if (sitemap.status !== 200) {
    fail(`/sitemap.xml returned ${sitemap.status}`);
  } else {
    const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
      decodeEntities(match[1])
    );
    const paths = locs.map((loc) => new URL(loc).pathname);
    const institutionPaths = paths.filter(
      (path) => /^\/institutions\/[^/]+$/.test(path) && path !== '/institutions/country'
    );
    const countryPaths = paths.filter((path) => path.startsWith('/institutions/country/'));
    const wordPaths = paths.filter((path) => /^\/vocabulary\/[^/]+$/.test(path));

    if (locs.length === expectedTotal) pass(`sitemap has ${expectedTotal} URLs`);
    else fail(`sitemap has ${locs.length} URLs, expected ${expectedTotal}`);

    if (institutionPaths.length === expectedInstitutions) pass(`sitemap includes all ${expectedInstitutions.toLocaleString('en-US')} institution pages`);
    else fail(`sitemap includes ${institutionPaths.length} institution pages, expected ${expectedInstitutions}`);

    if (countryPaths.length === expectedCountries) pass(`sitemap includes all ${expectedCountries} country indexes`);
    else fail(`sitemap includes ${countryPaths.length} country indexes, expected ${expectedCountries}`);

    if (wordPaths.length === expectedWords) pass(`sitemap includes all ${expectedWords.toLocaleString('en-US')} dictionary pages`);
    else fail(`sitemap includes ${wordPaths.length} dictionary pages, expected ${expectedWords}`);

    if (new Set(locs).size === locs.length) pass('sitemap URLs are unique');
    else fail('sitemap contains duplicate URLs');

    if (locs.every((loc) => loc.startsWith(SITE_URL))) {
      pass('sitemap uses the canonical origin');
    } else {
      fail('sitemap contains non-canonical origins');
    }

    for (const route of ['/institutions/stanford-university', '/vocabulary/able']) {
      if (locs.some((loc) => new URL(loc).pathname === route)) {
        pass(`sitemap contains ${route}`);
      } else {
        fail(`sitemap is missing ${route}`);
      }
    }
  }

  console.log(
    `\n${checks.length} checks passed, ${failures.length} failed.`
  );
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
