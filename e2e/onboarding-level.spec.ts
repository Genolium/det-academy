import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('onboarding explains the exam and estimates a level in two minutes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/welcome');
  await expect(page.getByRole('heading', { name: /Сначала карта/ })).toBeVisible();
  await page.getByRole('button', { name: /Дальше: цель подготовки/ }).click();

  // A guest cannot save the goal; skipping keeps the flow alive.
  await expect(page.getByRole('heading', { name: /Куда готовимся/ })).toBeVisible();
  await page.getByRole('button', { name: 'Пропустить' }).click();

  await expect(page.getByRole('heading', { name: /Это реальное английское слово/ })).toBeVisible();
  for (let index = 0; index < 12; index += 1) {
    await page.getByRole('button', { name: /Реальное слово/ }).click();
  }

  await expect(page.getByRole('heading', { name: /Ваш уровень около B2/ })).toBeVisible();
  await expect(page.getByText(/Верно 8 из 12/)).toBeVisible();

  const stored = await page.evaluate(() => ({
    done: localStorage.getItem('det_onboarding_done_v1'),
    placement: JSON.parse(localStorage.getItem('det_onboarding_placement') || 'null'),
  }));
  expect(stored.done).toBe('true');
  expect(stored.placement.level).toBe('B2');

  await page.getByRole('button', { name: /На дашборд/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/3 минуты: экзамен, цель и ваш уровень/)).toHaveCount(0);
});
