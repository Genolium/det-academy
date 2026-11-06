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

test('cookie-authenticated mutations require the double-submit CSRF token', async ({ page, request }) => {
  const email = `csrf-${Date.now()}@example.com`;
  const password = 'strongPassword123!';
  const registered = await request.post(`${API}/api/v1/auth/register`, {
    data: { email, password, name: 'CSRF Student', locale: 'ru' },
  });
  expect(registered.status()).toBe(201);

  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).first().click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Войти в аккаунт' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const csrf = await page.evaluate(() => {
    const match = document.cookie.match(/(?:^|; )det_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  });
  expect(csrf).toBeTruthy();

  const body = JSON.stringify({ targetScore: 120, targetDate: '2026-12-01', dailyMinutes: 30 });
  const without = await page.evaluate(async (payload) => {
    const response = await fetch('/api/v1/user/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    return response.status;
  }, body);
  const withToken = await page.evaluate(
    async ({ payload, token }) => {
      const response = await fetch('/api/v1/user/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: payload,
      });
      return response.status;
    },
    { payload: body, token: csrf }
  );

  expect(without).toBe(403);
  expect(withToken).toBe(200);
});
