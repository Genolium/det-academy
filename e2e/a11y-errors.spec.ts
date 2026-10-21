import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('login errors are announced as alerts', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid credentials' }),
    })
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('#auth-email').fill('student@example.com');
  await dialog.locator('#auth-password').fill('wrong-password');
  await dialog.getByRole('button', { name: 'Войти в аккаунт' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Invalid credentials');
});
