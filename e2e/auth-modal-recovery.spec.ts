import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

async function openAuthModal(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('unverified login offers a resend action', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Email is not verified', code: 'email_not_verified' }),
    })
  );
  let resendCalls = 0;
  await page.route('**/api/v1/auth/resend-verification-by-email', (route) => {
    resendCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'sent' }),
    });
  });

  await openAuthModal(page);
  await page.getByLabel('Email').fill('student@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('strongPassword123!');
  await page.getByRole('button', { name: 'Войти в аккаунт' }).click();

  await expect(page.getByText('Этот email ещё не подтверждён')).toBeVisible();
  await page.getByRole('button', { name: 'Отправить письмо ещё раз' }).click();
  await expect(
    page.getByText(/Если аккаунт существует и ещё не подтверждён/)
  ).toBeVisible();
  expect(resendCalls).toBe(1);
});

test('duplicate registration is explained without a dead end', async ({ page }) => {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'unable to register with these details' }),
    })
  );

  await openAuthModal(page);
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await page.getByLabel(/Ваше имя/).fill('Maria Bogatyreva');
  await page.getByLabel('Email').fill('mariabogatyreva@icloud.com');
  await page.getByLabel('Пароль', { exact: true }).fill('strongPassword123!');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

  await expect(page.getByText('Возможно, он уже существует')).toBeVisible();
  await expect(page.getByRole('alert').getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить письмо ещё раз' })).toBeVisible();
});

test('successful login stores no access token and sends the CSRF header', async ({ page, context }) => {
  await context.addCookies([
    { name: 'det_csrf', value: 'csrf-test-token', url: 'http://localhost:3101' },
  ]);
  let seenCsrf = '';
  await page.route('**/api/v1/auth/login', (route) => {
    seenCsrf = route.request().headers()['x-csrf-token'] || '';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'server-issued-token',
        user: {
          id: 'user-a',
          email: 'student@example.com',
          name: 'User A',
          role: 'student',
          locale: 'ru',
        },
      }),
    });
  });

  await openAuthModal(page);
  await page.getByLabel('Email').fill('student@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('strongPassword123!');
  await page.getByRole('button', { name: 'Войти в аккаунт' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const storage = await page.evaluate(() => ({
    token: localStorage.getItem('det_auth_token'),
    userId: localStorage.getItem('det_auth_user_id'),
  }));
  expect(storage.token).toBeNull();
  expect(storage.userId).toBe('user-a');
  expect(seenCsrf).toBe('csrf-test-token');
});
