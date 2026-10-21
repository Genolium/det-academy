import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

test('diagnostic launcher starts a short server-issued session', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  const mock = await mockApi(page);
  await page.goto('/diagnostic');

  await page.getByRole('button', { name: /Начать диагностику/ }).click();
  await page.waitForURL('**/test/session');

  const bodies = mock.getStartSessionBodies() as Array<{ mode?: string }>;
  expect(bodies.some((body) => body.mode === 'diagnostic')).toBe(true);
  await expect(page.getByRole('heading', { name: 'Speaking Sample' })).toBeVisible();
});
