import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

const routes = [
  '/',
  '/theory',
  '/practice',
  '/practice/flashcards',
  '/practice/typing',
  '/test',
  '/diagnostic',
  '/dashboard',
  '/profile',
  '/institutions',
  '/vocabulary',
  '/verify',
  '/verify/unknown',
  '/arena',
  '/admin',
];

for (const route of routes) {
  test(`no critical accessibility violations on ${route}`, async ({ page }) => {
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
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((violation) => violation.impact === 'critical');
    expect(critical, JSON.stringify(critical.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2)).toEqual([]);
  });
}
