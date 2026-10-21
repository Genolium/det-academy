import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('reduced motion disables long animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockApi(page);
  await page.goto('/');
  const duration = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'animate-caret';
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).animationDuration;
    probe.remove();
    return value;
  });
  expect(parseFloat(duration)).toBeLessThan(0.02);
});
