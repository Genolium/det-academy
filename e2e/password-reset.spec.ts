import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('the login modal links to the password recovery page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).first().click();
  await page.getByRole('button', { name: 'Забыли пароль?' }).click();
  await expect(page).toHaveURL(/\/auth\/forgot-password$/);
  await expect(page.getByRole('heading', { name: 'Сброс пароля' })).toBeVisible();
});

test('forgot password sends the address and never reveals whether it exists', async ({ page }) => {
  let body: Record<string, string> = {};
  await page.route('**/api/v1/auth/forgot-password', async (route) => {
    body = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'sent' }),
    });
  });

  await page.goto('/auth/forgot-password');
  await page.getByLabel('Email').fill('student@example.com');
  await page.getByRole('button', { name: 'Отправить ссылку' }).click();

  await expect(page.getByRole('heading', { name: 'Проверьте почту' })).toBeVisible();
  await expect(page.getByText(/Если аккаунт с таким email существует/)).toBeVisible();
  expect(body.email).toBe('student@example.com');
});

test('reset password submits the token and shows a single-use success state', async ({ page }) => {
  let body: Record<string, string> = {};
  await page.route('**/api/v1/auth/reset-password', async (route) => {
    body = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'reset' }),
    });
  });

  await page.goto('/auth/reset-password#token=reset-token-123');
  await page.getByLabel('Новый пароль', { exact: true }).fill('strongPassword456!');
  await page.getByLabel('Повторите пароль').fill('strongPassword456!');
  await page.getByRole('button', { name: 'Сохранить новый пароль' }).click();

  await expect(page.getByRole('heading', { name: 'Пароль обновлён' })).toBeVisible();
  expect(body.token).toBe('reset-token-123');
  expect(body.password).toBe('strongPassword456!');
});

test('reset password validates the confirmation locally', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/v1/auth/reset-password', (route) => {
    calls += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/auth/reset-password?token=reset-token-123');
  await page.getByLabel('Новый пароль', { exact: true }).fill('strongPassword456!');
  await page.getByLabel('Повторите пароль').fill('differentPassword789!');
  await page.getByRole('button', { name: 'Сохранить новый пароль' }).click();

  await expect(page.getByText('Пароли не совпадают.')).toBeVisible();
  expect(calls).toBe(0);
});

test('an expired reset link offers a fresh request', async ({ page }) => {
  await page.route('**/api/v1/auth/reset-password', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'password reset link is invalid or expired', code: 'invalid_reset_token' }),
    })
  );

  await page.goto('/auth/reset-password?token=expired-token');
  await page.getByLabel('Новый пароль', { exact: true }).fill('strongPassword456!');
  await page.getByLabel('Повторите пароль').fill('strongPassword456!');
  await page.getByRole('button', { name: 'Сохранить новый пароль' }).click();

  await expect(page.getByText(/Ссылка сброса недействительна или истекла/).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Запросить новую' })).toHaveAttribute('href', '/auth/forgot-password');
});


test('a link without a token offers a new request instead of a dead form', async ({ page }) => {
  await page.goto('/auth/reset-password');
  await expect(page.getByText(/В ссылке нет токена сброса/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Запросить новую' })).toHaveAttribute('href', '/auth/forgot-password');
  await expect(page.getByRole('button', { name: 'Сохранить новый пароль' })).toHaveCount(0);
});
