import { test } from '@playwright/test';
import { mockApi } from './mocks';

const ROUTES = ['/', '/theory', '/practice', '/vocabulary', '/institutions', '/dashboard', '/welcome', '/profile'];

test('audit: English interface should not contain Russian UI copy', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_locale', 'en');
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  for (const route of ROUTES) {
    await page.goto(route);
    await page.waitForTimeout(600);
    const text = await page.locator('body').innerText();
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /[А-Яа-яЁё]/.test(line));
    if (lines.length > 0) {
      console.log(`\n=== ${route} (${lines.length})`);
      for (const line of [...new Set(lines)].slice(0, 20)) console.log(`  ${line.slice(0, 140)}`);
    }
  }
});
