import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('focus remains visible in forced-colors mode', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Перейти к основному содержимому' });
  await expect(skip).toBeFocused();
  const outline = await skip.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThanOrEqual(2);
});
