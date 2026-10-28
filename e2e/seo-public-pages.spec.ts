import { expect, test } from '@playwright/test';
import { mockApi } from './mocks';
import registryRows from '../src/data/duolingoInstitutions.json';
import generatedWords from '../src/data/dictionary.generated.json';
import awlWords from '../src/data/vocabulary-awl.json';

/**
 * Public SEO routes: rendered status, one h1, canonical, description,
 * JSON-LD, sitemap coverage, 404s, and no Russian interface chrome when the
 * interface language is English.
 *
 * Russian dictionary meanings are learning content and live below the page
 * chrome, so they are intentionally not part of the chrome assertion.
 */

const SITE_URL = 'https://det-academy.ru';

// Derived from the committed data files so the test reports real drift instead
// of hiding it behind a stale hard-coded count.
const EXPECTED_INSTITUTIONS = registryRows.length;
const EXPECTED_COUNTRIES = new Set(
  registryRows.map((row) => row.country)
).size;
const EXPECTED_WORDS = new Set(
  [...generatedWords, ...awlWords].map((entry) =>
    entry.word.trim().toLowerCase()
  )
).size;
const EXPECTED_STATIC_ROUTES = 12;
const EXPECTED_TOTAL =
  EXPECTED_STATIC_ROUTES + EXPECTED_INSTITUTIONS + EXPECTED_COUNTRIES + EXPECTED_WORDS;

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

test.describe('SEO catalogue pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_locale', 'en');
      localStorage.setItem('det_cookie_consent', 'true');
    });
    await mockApi(page);
  });

  for (const route of [...INSTITUTION_ROUTES, ...COUNTRY_ROUTES, ...WORD_ROUTES]) {
    test(`${route} renders indexable metadata and English chrome`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} status`).toBe(200);

      await expect(page.locator('h1')).toHaveCount(1);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `${route} canonical`).toBeTruthy();
      expect(canonical?.startsWith(SITE_URL)).toBe(true);

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute('content');
      expect(description, `${route} meta description`).toBeTruthy();
      expect((description || '').length).toBeGreaterThan(50);

      const jsonLdBlocks = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      expect(jsonLdBlocks.length, `${route} JSON-LD blocks`).toBeGreaterThan(0);
      for (const block of jsonLdBlocks) {
        expect(() => JSON.parse(block), `${route} JSON-LD parses`).not.toThrow();
      }

      // Let LocaleSync apply the stored `en` locale before auditing chrome.
      await page.waitForTimeout(900);

      const offenders: string[] = await page.evaluate(() => {
        const cyrillic = /[\u0400-\u04FF]/;
        const results: string[] = [];
        const seen = new Set<string>();

        const isVisible = (element: Element) => {
          const node = element as HTMLElement;
          if (node.hidden) return false;
          const style = window.getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return node.getClientRects().length > 0;
        };

        const push = (kind: string, value: string | null | undefined) => {
          const text = (value || '').replace(/\s+/g, ' ').trim();
          if (!text || !cyrillic.test(text)) return;
          const key = `${kind}:${text}`;
          if (seen.has(key)) return;
          seen.add(key);
          results.push(`${kind}: ${text}`);
        };

        push('title', document.title);
        const description = document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content');
        push('meta description', description);

        document.querySelectorAll('h1').forEach((element) => {
          if (isVisible(element)) push('h1', element.textContent);
        });

        document.querySelectorAll('button').forEach((element) => {
          if (!isVisible(element)) return;
          push('button text', element.textContent);
          push('button aria-label', element.getAttribute('aria-label'));
          push('button title', element.getAttribute('title'));
        });

        document.querySelectorAll('nav a, header a, footer a').forEach((element) => {
          if (!isVisible(element)) return;
          push('navigation link', element.textContent);
          push('navigation aria-label', element.getAttribute('aria-label'));
        });

        document.querySelectorAll('input, textarea, select').forEach((element) => {
          if (!isVisible(element)) return;
          push('placeholder', element.getAttribute('placeholder'));
          push('field aria-label', element.getAttribute('aria-label'));
        });

        document.querySelectorAll('label').forEach((element) => {
          if (isVisible(element)) push('label', element.textContent);
        });

        return results;
      });

      expect(
        offenders,
        `${route} contains Russian interface chrome with locale=en:\n${offenders.join('\n')}`
      ).toEqual([]);
    });
  }

  test('institution page exposes the disclaimer and registry link', async ({ page }) => {
    await page.goto('/institutions/stanford-university');
    await expect(
      page.getByText(/Platform reference, not an official requirement/i).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /official Duolingo registry/i })
    ).toHaveAttribute('href', 'https://englishtest.duolingo.com/institutions');
  });

  test('unknown catalogue slugs return 404', async ({ page }) => {
    for (const route of [
      '/institutions/this-institution-does-not-exist-xyz',
      '/institutions/country/not-a-country-xyz',
      '/vocabulary/notawordxyz',
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} status`).toBe(404);
    }
  });
});

test.describe('SEO sitemap', () => {
  test('lists every catalogue entry once', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1]
    );
    const paths = locations.map((location) => new URL(location).pathname);

    expect(locations).toHaveLength(EXPECTED_TOTAL);
    expect(new Set(locations).size).toBe(locations.length);

    const institutionPaths = paths.filter(
      (path) => /^\/institutions\/[^/]+$/.test(path) && path !== '/institutions/country'
    );
    const countryPaths = paths.filter((path) =>
      path.startsWith('/institutions/country/')
    );
    const wordPaths = paths.filter((path) => /^\/vocabulary\/[^/]+$/.test(path));

    expect(institutionPaths).toHaveLength(EXPECTED_INSTITUTIONS);
    expect(countryPaths).toHaveLength(EXPECTED_COUNTRIES);
    expect(wordPaths).toHaveLength(EXPECTED_WORDS);
    expect(locations.every((location) => location.startsWith(SITE_URL))).toBe(true);
  });
});
