import { test, expect } from '@playwright/test';

const API = process.env.FULLSTACK_API_URL || 'http://localhost:18081';

test('forgot password is generic in the UI and works against PostgreSQL', async ({ page, request }) => {
  const email = `forgot-${Date.now()}@example.com`;
  const registered = await request.post(`${API}/api/v1/auth/register`, {
    data: { email, password: 'strongPassword123!', name: 'Forgot Student', locale: 'ru' },
  });
  expect(registered.status()).toBe(201);

  const known = await request.post(`${API}/api/v1/auth/forgot-password`, { data: { email } });
  expect(known.status()).toBe(200);
  expect(await known.json()).toEqual({ status: 'sent' });

  const unknown = await request.post(`${API}/api/v1/auth/forgot-password`, {
    data: { email: `missing-${Date.now()}@example.com` },
  });
  expect(unknown.status()).toBe(200);
  expect(await unknown.json()).toEqual({ status: 'sent' });

  await page.goto('/auth/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Отправить ссылку' }).click();
  await expect(page.getByRole('heading', { name: 'Проверьте почту' })).toBeVisible();
  await expect(page.getByText(/Если аккаунт с таким email существует/)).toBeVisible();
});

test('reset password rejects an invalid token without a server error', async ({ request }) => {
  const response = await request.post(`${API}/api/v1/auth/reset-password`, {
    data: { token: 'definitely-not-a-real-token', password: 'strongPassword456!' },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    error: 'password reset link is invalid or expired',
    code: 'invalid_reset_token',
  });
});
