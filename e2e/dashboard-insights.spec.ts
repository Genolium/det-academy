import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.describe('dashboard insights', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.setItem('det_cookie_consent', 'true');
    });
    await mockApi(page);
  });

  test('shows the score range with its confidence and basis', async ({ page }) => {
    await page.goto('/dashboard');
    // The arena is disabled, so the weekly league card must not appear.
    await expect(page.getByText(/Лига недели|Weekly league/)).toHaveCount(0);
    await expect(page.getByText(/Тренировочный ориентир:/)).toBeVisible();
    await expect(page.getByText('110–130')).toBeVisible();
    await expect(page.getByText(/высокая уверенность/)).toBeVisible();
    await expect(page.getByText(/разброс ±10/)).toBeVisible();
    await expect(page.getByText('К дате экзамена:')).toBeVisible();
    await expect(page.getByText('122–134')).toBeVisible();
    await expect(page.getByText('идёт к цели')).toBeVisible();
    await expect(page.getByText(/Тренд по 3 мокам/)).toBeVisible();
  });

  test('opens the recommended drill from the next best action', async ({ page }) => {
    await page.goto('/dashboard');
    const action = page.getByRole('link', { name: /Отработать Read and Select/ });
    await expect(action).toBeVisible();
    await expect(action).toContainText('10 мин');
    await action.click();
    await expect(page).toHaveURL(/\/practice\?drill=read-and-select/);
    await expect(page.getByText(/Активный тренажер: read-and-select/)).toBeVisible();
  });
});
