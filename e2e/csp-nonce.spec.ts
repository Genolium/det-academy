import { test, expect } from '@playwright/test';

test('authenticated app routes use a per-request script nonce', async ({ page }) => {
  test.skip(process.env.CI !== 'true', 'the production build attaches nonces; dev HMR scripts do not');
  const response = await page.goto('/test');
  expect(response).not.toBeNull();
  const csp = response!.headers()['content-security-policy'] || '';
  expect(csp).toContain("'nonce-");
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");

  const missingNonce = await page.evaluate(() =>
    Array.from(document.scripts)
      .filter((script) => !script.nonce)
      .map((script) => script.src || 'inline')
  );
  expect(missingNonce).toEqual([]);
});
