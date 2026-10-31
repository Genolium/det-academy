import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const user = {
  id: 'user-a',
  email: 'a@example.com',
  name: 'User A',
  role: 'student',
  locale: 'ru',
};

test('parallel 401 responses share one refresh request', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  let refreshCalls = 0;
  await page.route('**/api/v1/auth/refresh', async (route) => {
    refreshCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'token-user-a', user }),
    });
  });

  for (const path of ['**/api/v1/user/streak*', '**/api/v1/user/errors*']) {
    let calls = 0;
    await page.route(path, async (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'expired' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          path.includes('streak')
            ? { streakDays: 2, lastActiveDate: '2026-10-31' }
            : { errors: [], total: 0 }
        ),
      });
    });
  }

  await page.goto('/dashboard');
  await expect(page.getByTestId('progress-status')).toBeVisible();
  await expect.poll(() => refreshCalls, { timeout: 10_000 }).toBe(1);
});

test('service worker does not cache authenticated API responses', () => {
  const source = readFileSync('public/sw.js', 'utf8');
  expect(source).not.toContain("'/api/v1/user/'");
  expect(source).not.toContain("'/api/v1/test/sessions/me'");
  expect(source).not.toContain("'/api/v1/theory/progress'");
  expect(source).toContain("const VERSION = 'v3'");
});
