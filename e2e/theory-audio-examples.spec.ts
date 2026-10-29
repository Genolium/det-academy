import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('listen-and-type theory examples use real playable sentences', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/theory/listen-and-type');

  await expect(page.getByText('Прослушайте предложение и запишите его в точности')).toBeVisible();
  await expect(page.getByRole('button', { name: /Прослушать предложение/ }).first()).toBeVisible();
  await expect(page.getByText('Прослушайте предложение с третьим условным')).toBeVisible();
  await expect(page.getByText(/Звучит аудиозапись/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Прослушать предложение/ })).toHaveCount(2);
  const input = page.getByPlaceholder('Введите ответ').first();
  await input.fill('Educational methods include teaching, storytelling, discussions, and research.');
  await page.getByRole('button', { name: 'Проверить' }).first().click();
  await expect(page.getByText('Верно').first()).toBeVisible();
  await expect(page.getByText('Educational methods include teaching, storytelling, discussions, and research.').first()).toBeVisible();
});
