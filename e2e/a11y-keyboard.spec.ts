import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('the first tab stop is a skip link that moves focus to main content', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Перейти к основному содержимому' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
