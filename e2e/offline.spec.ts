import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('service worker serves an offline fallback for navigation', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await context.setOffline(true);
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Нет подключения')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Повторить' })).toBeVisible();
  await context.setOffline(false);
});
