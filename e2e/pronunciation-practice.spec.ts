import { test, expect } from '@playwright/test';

test('read-aloud practice exposes a reference sentence and recording controls', async ({ page }) => {
  await page.goto('/practice/pronunciation');

  await expect(page.getByRole('heading', { name: 'Прочитайте предложение вслух' })).toBeVisible();
  const sentence = page.getByTestId('read-aloud-sentence');
  await expect(sentence).toContainText('The laboratory reported a substantial improvement');
  await expect(page.getByRole('button', { name: /Записать/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Стоп и разбор/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Прослушать эталон/ })).toBeVisible();
});
