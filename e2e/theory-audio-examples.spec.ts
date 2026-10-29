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
  await expect(page.getByText('Прослушайте предложение с третьим условным')).toBeVisible();
  await expect(page.getByText(/Звучит аудиозапись/)).toHaveCount(0);
  await expect(page.getByText('Educational methods include teaching, storytelling, discussions, and research.')).toBeVisible();
  await expect(page.getByText('I would have bought you a present if I had known it was your birthday.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Прослушать реальный пример/ })).toHaveCount(2);
});
