import { test, expect } from '@playwright/test';

const API = process.env.FULLSTACK_API_URL || 'http://localhost:18081';

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

test('published vocabulary survives an offline reload with a real backend', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await page.goto('/vocabulary');
  await expect(page.getByRole('heading', { name: 'Substantiate' })).toBeVisible({ timeout: 20_000 });
  await waitForServiceWorker(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Substantiate' })).toBeVisible();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Substantiate' })).toBeVisible();
  await expect(page.getByText('Офлайн-режим')).toBeVisible();
  await context.setOffline(false);
});

test('authenticated dashboard survives an offline reload with cached user data', async ({ page, context, request }) => {
  const register = await request.post(`${API}/api/v1/auth/register`, {
    data: {
      email: `offline-${Date.now()}@example.com`,
      password: 'strongPassword123!',
      name: 'Offline Student',
      locale: 'ru',
    },
  });
  expect(register.status()).toBe(201);
  const auth = await register.json();

  await page.addInitScript((token) => {
    localStorage.setItem('det_auth_token', token);
    localStorage.setItem('det_cookie_consent', 'true');
  }, auth.token);
  await page.goto('/dashboard');
  await expect(page.getByText('Отчёты DET Academy')).toBeVisible({ timeout: 20_000 });
  await waitForServiceWorker(page);
  await page.reload();
  await expect(page.getByText('Отчёты DET Academy')).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Отчёты DET Academy')).toBeVisible();
  await expect(page.getByText('Офлайн-режим')).toBeVisible();
  await context.setOffline(false);
});
