import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('the dictionary shows meanings, definitions and B1 entries', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.goto('/vocabulary');

  await expect(page.getByRole('heading', { name: 'Benefit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Substantiate' })).toBeVisible();
  await expect(page.getByText('Польза, выгода')).toBeVisible();
  await expect(page.getByText('To provide evidence to support a claim.')).toBeVisible();
  await expect(page.getByText('/ˈben.ɪ.fɪt/ · noun')).toBeVisible();

  // The B1 filter keeps the B1 word and removes the C1 one.
  await page.getByRole('button', { name: 'B1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Benefit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Substantiate' })).toHaveCount(0);

  // The AWL source filter restores the academic word once the level is reset.
  await page.getByRole('button', { name: 'Все уровни' }).click();
  await page.getByRole('button', { name: 'Academic Word List' }).click();
  await expect(page.getByRole('heading', { name: 'Substantiate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Benefit' })).toHaveCount(0);

  // AWL has no B1 words; the page explains where B1 lives instead of a dead end.
  await page.getByRole('button', { name: 'B1', exact: true }).click();
  await expect(page.getByText(/В Academic Word List нет слов уровня B1/)).toBeVisible();
});
