import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('auth dialog traps focus and returns it on Escape', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.goto('/');

  const trigger = page.getByRole('button', { name: 'Войти' }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');

  await page.keyboard.press('Tab');
  const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
  expect(inside).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
