import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('vocabulary comes from the published server dataset', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);
  await page.goto('/vocabulary');

  // The theory word list is the default tab; the published dataset lives in AWL.
  await page.getByRole('button', { name: /Academic Word List/ }).click();

  await expect(page.getByRole('heading', { name: 'Substantiate' })).toBeVisible();
  await expect(page.getByText('Обосновывать')).toBeVisible();
  await expect(page.getByText('Academic Word List (1)')).toBeVisible();
});
