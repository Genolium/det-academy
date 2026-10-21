import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

const routes = [
  '/', '/theory', '/practice', '/practice/flashcards', '/practice/typing',
  '/test', '/diagnostic', '/dashboard', '/profile', '/institutions',
  '/vocabulary', '/verify', '/verify/unknown', '/arena', '/admin',
];

for (const route of routes) {
  test(`reflows at 320 CSS pixels on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.addInitScript((attemptId) => {
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.setItem('det_cookie_consent', 'true');
      localStorage.setItem(
        'det_active_test_attempt_v2',
        JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
      );
    }, TEST_ATTEMPT_ID);
    await mockApi(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
}
