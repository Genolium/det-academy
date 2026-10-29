import { expect, test } from '@playwright/test';
import { mockApi } from './mocks';

/**
 * Stricter companion to i18n-audit.spec.ts.
 *
 * The audit test prints every visible Cyrillic line and accepts content
 * (lesson bodies, backend plan tasks, dictionary meanings). This test only
 * inspects interface chrome — page titles, buttons, navigation, form fields,
 * labels, select options and aria-labels — and fails when `en` still renders
 * Russian there.
 *
 * Content regions (lesson text, plan task titles, word definitions) are not
 * queried at all, so they cannot make this test fail.
 */

const UI_ROUTES = [
  '/',
  '/theory',
  '/practice',
  '/practice/flashcards',
  '/practice/typing',
  '/vocabulary',
  '/institutions',
  '/dashboard',
  '/welcome',
  '/profile',
  '/verify',
  '/diagnostic',
  '/test',
  '/privacy',
];

interface Offender {
  kind: string;
  text: string;
}

// Avoid competing with parallel test runs over the shared test-results folder.
test.use({ trace: 'off' });

test.describe('English interface chrome', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_locale', 'en');
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.setItem('det_cookie_consent', 'true');
    });
    await mockApi(page);
  });

  for (const route of UI_ROUTES) {
    test(`${route} has no Russian interface chrome`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(900);

      const offenders: Offender[] = await page.evaluate(() => {
        const cyrillic = /[А-Яа-яЁё]/;

        const isVisible = (el: Element) => {
          const element = el as HTMLElement;
          if (element.hidden) return false;
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return element.getClientRects().length > 0;
        };

        const results: Array<{ kind: string; text: string }> = [];
        const seen = new Set<string>();

        const push = (kind: string, value: string | null | undefined) => {
          const text = (value || '').replace(/\s+/g, ' ').trim();
          if (!text || !cyrillic.test(text)) return;
          const key = `${kind}:${text}`;
          if (seen.has(key)) return;
          seen.add(key);
          results.push({ kind, text });
        };

        // Page title.
        document.querySelectorAll('h1').forEach((el) => {
          if (isVisible(el)) push('h1', el.textContent);
        });

        // Buttons are always interface chrome.
        document.querySelectorAll('button').forEach((el) => {
          if (isVisible(el)) push('button', el.textContent);
        });

        // Primary navigation, header and footer links.
        document.querySelectorAll('nav a, header a, footer a').forEach((el) => {
          if (isVisible(el)) push('nav link', el.textContent);
        });

        // Form fields.
        document.querySelectorAll('input, textarea, select').forEach((el) => {
          if (!isVisible(el)) return;
          const field = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          push('placeholder', field.getAttribute('placeholder'));
          push('aria-label', field.getAttribute('aria-label'));
        });

        // Visible select options (locale-switched country list, filters).
        document.querySelectorAll('option').forEach((el) => {
          const select = el.closest('select');
          if (select && isVisible(select)) push('option', el.textContent);
        });

        // Explicit labels and aria-labels on interactive elements.
        document.querySelectorAll('label').forEach((el) => {
          if (isVisible(el)) push('label', el.textContent);
        });
        document
          .querySelectorAll('button, a, [role="button"], [role="tab"], [role="link"], [role="switch"], [role="checkbox"]')
          .forEach((el) => {
            if (isVisible(el)) push('aria-label', el.getAttribute('aria-label'));
          });

        return results;
      });

      const details = offenders.map((o) => `${o.kind}: ${o.text}`);
      expect(
        offenders,
        `Russian interface chrome found on ${route} with locale=en:\n${details.join('\n')}`
      ).toEqual([]);
    });
  }

  test('institutions registry tab is localized', async ({ page }) => {
    await page.goto('/institutions');
    await page.waitForTimeout(900);

    const registryTab = page.getByRole('button', {
      name: /official registry|реестр/i,
    });
    await expect(registryTab).toBeVisible();
    await registryTab.click();
    await page.waitForTimeout(900);

    const content = await page.locator('body').innerText();
    expect(content).toContain('All countries');
    expect(content).not.toMatch(/Все страны|Найдено вузов|Проходной балл/);
  });
});
