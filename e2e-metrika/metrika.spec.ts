import { test, expect, type Page } from '@playwright/test';

const COUNTER_ID = '113844701';
const CONSENT_KEY = 'det_cookie_consent';

type YmCall = unknown[];

/** Records every request to Metrika and aborts it so tests never hit the network. */
async function blockMetrika(page: Page): Promise<string[]> {
  const requests: string[] = [];
  await page.route('https://mc.yandex.ru/**', async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
  return requests;
}

/** Seeds the consent decision before the application boots. */
async function seedConsent(page: Page, value: 'true' | 'rejected'): Promise<void> {
  await page.addInitScript(
    ([key, storedValue]) => {
      try {
        window.localStorage.setItem(key, storedValue);
      } catch {
        // Storage can be unavailable in hardened browsers; the counter must
        // then stay off, which is what the other assertions cover.
      }
    },
    [CONSENT_KEY, value] as const,
  );
}

async function readYmCalls(page: Page): Promise<YmCall[]> {
  return page.evaluate(() => {
    const ym = (window as unknown as { ym?: { a?: unknown[] } }).ym;
    return (ym?.a ?? []).map((args) => Array.from(args as ArrayLike<unknown>));
  });
}

async function ymIsDefined(page: Page): Promise<boolean> {
  return page.evaluate(() => typeof (window as unknown as { ym?: unknown }).ym === 'function');
}

test('loads exactly one counter after consent and tracks client-side navigation', async ({ page }) => {
  const requests = await blockMetrika(page);
  await seedConsent(page, 'true');
  await page.goto('/');

  const tagScript = page.locator('script[src*="mc.yandex.ru/metrika/tag.js"]');
  await expect(tagScript).toHaveCount(1);
  await expect(page.locator('script#yandex-metrika')).toHaveCount(1);
  expect(requests.some((url) => url.includes('/metrika/tag.js'))).toBe(true);

  const calls = await readYmCalls(page);
  const init = calls.find((call) => String(call[0]) === COUNTER_ID && call[1] === 'init');
  expect(init, 'ym(113844701, "init", ...) must be called').toBeDefined();
  expect(init?.[2]).toMatchObject({
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    accurateTrackBounce: true,
    trackLinks: true,
  });

  await page.locator('header a[href="/theory"]:visible').first().click();
  await page.waitForURL('**/theory');

  await expect
    .poll(async () => (await readYmCalls(page)).filter((call) => call[1] === 'hit').length)
    .toBe(1);

  // Client-side navigation must neither re-inject the tag nor re-init the counter.
  await expect(tagScript).toHaveCount(1);
  await expect(page.locator('script#yandex-metrika')).toHaveCount(1);
  const callsAfterNavigation = await readYmCalls(page);
  expect(callsAfterNavigation.filter((call) => String(call[0]) === COUNTER_ID && call[1] === 'init')).toHaveLength(1);
});

test('waits for explicit consent before loading the counter', async ({ page }) => {
  const requests = await blockMetrika(page);
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Принять', exact: true })).toBeVisible();
  expect(requests).toHaveLength(0);
  await expect(page.locator('script#yandex-metrika')).toHaveCount(0);
  expect(await ymIsDefined(page)).toBe(false);

  await page.getByRole('button', { name: 'Принять', exact: true }).click();

  await expect(page.locator('script#yandex-metrika')).toHaveCount(1);
  await expect.poll(async () => (await readYmCalls(page)).length).toBeGreaterThan(0);
  expect(requests.length).toBeGreaterThan(0);
  expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe('true');
});

test('does not load the counter when consent is rejected', async ({ page }) => {
  const requests = await blockMetrika(page);
  await seedConsent(page, 'rejected');
  await page.goto('/');
  await page.waitForLoadState('load');
  // Give hydration and the consent effect time to run before asserting absence.
  await page.waitForTimeout(1500);

  await expect(page.locator('script#yandex-metrika')).toHaveCount(0);
  await expect(page.locator('script[src*="mc.yandex.ru"]')).toHaveCount(0);
  expect(await ymIsDefined(page)).toBe(false);
  expect(requests).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Принять', exact: true })).toHaveCount(0);
});
