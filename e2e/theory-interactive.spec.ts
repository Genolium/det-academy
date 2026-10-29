import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);
});

test('read-and-select theory example checks Yes/No and explains the trap', async ({ page }) => {
  await page.goto('/theory/read-and-select');
  await expect(page.getByText(/Звучит аудиозапись/)).toHaveCount(0);
  await expect(page.getByText(/20 Vocabulary Tests/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Практиковать этот тип/ })).toHaveAttribute(
    'href',
    '/practice?drill=read-and-select'
  );
  await page.getByRole('button', { name: 'Реальное слово' }).first().click();
  await expect(page.getByText('Верно').first()).toBeVisible();
  await expect(page.getByText(/Правильный ответ/).first()).toBeVisible();
});

test('fill-in-the-blanks theory example accepts a typed word', async ({ page }) => {
  await page.goto('/theory/fill-in-the-blanks');
  const input = page.getByPlaceholder('Введите ответ').first();
  await input.fill('cancel');
  await page.getByRole('button', { name: 'Проверить' }).first().click();
  await expect(page.getByText('Верно').first()).toBeVisible();
});

test('listen-and-type theory example accepts the real sentence', async ({ page }) => {
  await page.goto('/theory/listen-and-type');
  const input = page.getByPlaceholder('Введите ответ').first();
  await input.fill('Educational methods include teaching, storytelling, discussions, and research.');
  await page.getByRole('button', { name: 'Проверить' }).first().click();
  await expect(page.getByText('Верно').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Прослушать предложение/ }).first()).toBeVisible();
});
