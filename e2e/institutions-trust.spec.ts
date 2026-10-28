import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('admissions widget does not show fabricated probabilities or guarantees', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_user_user-a_test_results',
      JSON.stringify([
        {
          id: 'result-160',
          date: '21 октября 2026',
          overallScore: 160,
          reading: 160,
          listening: 160,
          writing: 160,
          speaking: 160,
          literacy: 160,
          comprehension: 160,
          production: 160,
          conversation: 160,
          candidateName: 'User A',
        },
      ])
    );
  });
  await mockApi(page);

  await page.goto('/profile');
  await expect(page.getByText(/University Match Engine/i)).toBeVisible();
  await expect(page.getByText('Гарантированный проходной')).toHaveCount(0);
  await expect(page.getByText(/95%/)).toHaveCount(0);
  await expect(page.getByText(/ориентировочн/i).first()).toBeVisible();
});

test('registry hides the unsupported score filter', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  const registryResponse = await page.request.get('/registry/duolingo');
  expect(registryResponse.ok()).toBe(true);
  const registry = await registryResponse.json();
  expect(Array.isArray(registry)).toBe(true);
  expect(registry.length).toBeGreaterThan(4000);

  await page.goto('/institutions');
  // The map opens first; the registry is one click away.
  await page.getByRole('button', { name: /Официальный реестр/ }).click();
  await expect(page.getByText(/Официальный реестр/)).toBeVisible();
  await expect(page.getByText(/Фильтр: Подходит под мой балл/)).toHaveCount(0);
  await expect(page.getByText(/Требования вузов пока не подтверждены/)).toBeVisible();
  await expect(page.getByText(/4[\s,]?087/).first()).toBeVisible();
});
