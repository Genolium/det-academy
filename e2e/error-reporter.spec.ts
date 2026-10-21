import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('frontend errors are reported to the backend error endpoint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('det_cookie_consent', 'true'));
  await mockApi(page);
  let payload = '';
  await page.route('**/api/v1/client-errors', async (route) => {
    payload = route.request().postData() || '';
    await route.fulfill({ status: 202, contentType: 'application/json', body: '{"status":"accepted"}' });
  });
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'frontend-test-error',
        error: new Error('frontend-test-error'),
      })
    );
  });
  await expect.poll(() => payload).toContain('frontend-test-error');
  expect(JSON.parse(payload).url).toBe('/');
});
