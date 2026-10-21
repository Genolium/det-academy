import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('SRS reviews are queued offline and flushed after reconnect', async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);
  let reviews = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/user/srs/review') && request.method() === 'POST') reviews += 1;
  });

  await page.goto('/practice/flashcards');
  await page.getByRole('button', { name: /Все карточки/ }).click();
  await page.locator('.min-h-\\[290px\\]').click();
  // Remove the mocked API so the offline write really fails instead of being
  // fulfilled by Playwright's route layer.
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await context.setOffline(true);
  await page.getByRole('button', { name: /Хорошо/ }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const key = Object.keys(localStorage).find((item) => item.startsWith('det_srs_outbox_v1_'));
        const raw = key ? localStorage.getItem(key) : null;
        return raw ? Object.keys(JSON.parse(raw)).length : 0;
      })
    )
    .toBe(1);

  await context.setOffline(false);
  await page.route('**/api/v1/user/srs/review', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cardId: 'voc-1', intervalDays: 1, repetitions: 1, easinessFactor: 2.5, dueDate: '2026-10-22', streakDays: 1, totalReviewed: 1 }),
    })
  );
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect
    .poll(() =>
      page.evaluate(() => {
        const key = Object.keys(localStorage).find((item) => item.startsWith('det_srs_outbox_v1_'));
        const raw = key ? localStorage.getItem(key) : null;
        return raw ? Object.keys(JSON.parse(raw)).length : 0;
      })
    )
    .toBe(0);
  expect(reviews).toBeGreaterThanOrEqual(1);
});
