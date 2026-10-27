import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const VIEWPORTS = [
  { name: 'phone', width: 375, height: 667, isMobile: true, hasTouch: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false, hasTouch: false },
] as const;

const PAGES = ['/', '/practice', '/dashboard', '/vocabulary', '/institutions'];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width}px`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.hasTouch,
      isMobile: viewport.isMobile,
    });

    test('no horizontal overflow and touch-friendly controls', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('det_auth_token', 'token-user-a');
        localStorage.setItem('det_cookie_consent', 'true');
      });
      await mockApi(page);

      for (const route of PAGES) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
        });
        expect(
          overflow.scrollWidth,
          `${route} overflows horizontally (${overflow.scrollWidth} > ${overflow.clientWidth})`
        ).toBeLessThanOrEqual(overflow.clientWidth + 1);
      }

      // The vocabulary speaker must stay a comfortable touch target on phones.
      await page.goto('/vocabulary');
      const speaker = page.getByRole('button', { name: /Прослушать произношение/i }).first();
      await expect(speaker).toBeVisible();
      const box = await speaker.boundingBox();
      expect(box).not.toBeNull();
      if (viewport.hasTouch) {
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
}
