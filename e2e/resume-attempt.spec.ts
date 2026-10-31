import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

async function seedAttempt(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript((attemptId) => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
    );
  }, TEST_ATTEMPT_ID);
}

test('the lobby offers to continue an unfinished attempt instead of silently replacing it', async ({ page }) => {
  await seedAttempt(page);
  await mockApi(page);

  await page.goto('/test');
  await expect(page.getByRole('button', { name: 'Продолжить попытку' })).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить попытку' }).click();
  await expect(page).toHaveURL(/\/test\/session/);
});

test('a missing active attempt offers explicit choices and does not spend a new try silently', async ({ page }) => {
  await seedAttempt(page);
  await mockApi(page);
  await page.route(`**/api/v1/test/sessions/${TEST_ATTEMPT_ID}`, async (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not found"}' })
  );

  let starts = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/v1/test/sessions')) {
      starts += 1;
    }
  });

  await page.goto('/test/session');
  await expect(page.getByText('Прежняя попытка больше недоступна')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Начать новую попытку' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'В кабинет' })).toBeVisible();
  expect(starts).toBe(0);
});
