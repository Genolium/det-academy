import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('the course opens with the platform and exam introduction', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/theory');
  const firstCard = page.locator('a[aria-label^="С чего начать"]');
  await expect(firstCard).toBeVisible();
  await expect(page.locator('h2').first()).toContainText('С чего начать');
  await expect(page.getByTestId('theory-source-status')).toBeVisible();

  await page.goto('/theory/start-here');
  await expect(page.getByRole('heading', { name: /С чего начать/ })).toBeVisible();
  await expect(page.getByText(/Проблема экзамена → решение на платформе/)).toBeVisible();
  await expect(page.getByText(/Медленно печатаю и смотрю на клавиатуру/)).toBeVisible();
  await expect(page.locator('a[href="/practice/typing"]').first()).toBeVisible();
  await expect(page.locator('a[href="/welcome"]').first()).toBeVisible();
});
