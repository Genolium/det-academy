import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.use({ serviceWorkers: 'allow' });

async function waitForServiceWorker(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
      });
    }
  });
}

test('service worker serves an offline fallback for an uncached navigation', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.goto('/');
  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Нет подключения')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Повторить' })).toBeVisible();
  await context.setOffline(false);
});
