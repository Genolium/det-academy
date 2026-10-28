import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('dictionary search and pronunciation work without a reload', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.route('**/api.dictionaryapi.dev/**', (route) => route.abort());
  await page.goto('/vocabulary');

  const speaker = page.getByRole('button', { name: /Прослушать произношение/i }).first();
  await expect(speaker).toBeVisible();
  await speaker.click();
  await expect(speaker).toBeEnabled();

  await page.getByPlaceholder(/Найти слово, перевод или определение/).fill('ben');
  await expect(page.getByRole('heading', { name: 'Benefit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Substantiate' })).toHaveCount(0);
});
