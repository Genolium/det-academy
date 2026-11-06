import { test, expect } from '@playwright/test';

const API = process.env.FULLSTACK_API_URL || 'http://localhost:18081';

test('a real login keeps the access token out of localStorage and survives reload via cookies', async ({
  page,
  request,
}) => {
  const email = `cookie-${Date.now()}@example.com`;
  const password = 'strongPassword123!';
  const registered = await request.post(`${API}/api/v1/auth/register`, {
    data: { email, password, name: 'Cookie Student', locale: 'ru' },
  });
  expect(registered.status()).toBe(201);

  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).first().click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Войти в аккаунт' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Cookie Student').or(page.getByText('Пользователь Cookie Student')).first()).toBeVisible();

  const storage = await page.evaluate(() => ({
    token: localStorage.getItem('det_auth_token'),
    userId: localStorage.getItem('det_auth_user_id'),
  }));
  expect(storage.token).toBeNull();
  expect(storage.userId).toBeTruthy();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Cookie Student').or(page.getByText('Пользователь Cookie Student')).first()).toBeVisible();
});
