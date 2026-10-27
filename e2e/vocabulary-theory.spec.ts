import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('the vocabulary tab lists the theory words with a listen button', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);
  // Keep the pronunciation network-free: the browser voice is the fallback.
  await page.route('**/api.dictionaryapi.dev/**', (route) => route.abort());

  await page.goto('/vocabulary');

  await expect(page.getByRole('tab', { name: /Слова из программы/i }).or(page.getByRole('button', { name: /Слова из программы/i }))).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Слова из программы' })).toBeVisible();
  await expect(page.getByText(/1393 слов из материалов курса/)).toBeVisible();

  const speaker = page.getByRole('button', { name: /Прослушать произношение/i }).first();
  await expect(speaker).toBeVisible();
  await speaker.click();
  await expect(speaker).toBeEnabled();

  // The inline search narrows the list without a reload.
  await page.getByLabel('Поиск по словам из программы').fill('breath');
  await expect(page.getByText('Breathtaking', { exact: true })).toBeVisible();
  await expect(page.getByText('She', { exact: true })).toHaveCount(0);
});
