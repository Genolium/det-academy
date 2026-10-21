import { test, expect } from '@playwright/test';

test('typing trainer restarts from the result screen', async ({ page }) => {
  await page.goto('/practice/typing');
  await page.getByRole('button', { name: 'Слова' }).click();
  await page.getByRole('button', { name: '10', exact: true }).click();

  const input = page.locator('input[aria-label="Поле ввода текста"]');
  await input.waitFor();
  await input.focus();
  for (let index = 0; index < 10; index += 1) {
    await input.pressSequentially('x ', { delay: 5 });
  }

  await expect(page.getByText('Результаты печати')).toBeVisible();
  await page.getByRole('button', { name: /Повторить попытку/ }).click();
  await expect(page.getByText('Результаты печати')).toHaveCount(0);
  await expect(input).toBeVisible();
});

test('typing trainer restarts from the in-surface restart button', async ({ page }) => {
  await page.goto('/practice/typing');
  await page.getByRole('button', { name: 'Слова' }).click();
  await page.getByRole('button', { name: '10', exact: true }).click();
  const input = page.locator('input[aria-label="Поле ввода текста"]');
  await input.waitFor();
  await input.focus();
  await input.pressSequentially('x ', { delay: 5 });
  await input.pressSequentially('y ', { delay: 5 });

  await page.getByRole('button', { name: /Перезапустить/ }).click();
  await expect(page.getByText('0/10')).toBeVisible();
  await expect(page.getByText('Результаты печати')).toHaveCount(0);
});
