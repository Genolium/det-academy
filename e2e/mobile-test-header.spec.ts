import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

const STAGES = [
  'READ_SELECT',
  'FILL_BLANKS',
  'C_TEST',
  'LISTEN_TYPE',
  'INTERACTIVE_READING',
  'INTERACTIVE_LISTENING',
  'WRITE_PHOTO',
  'INTERACTIVE_WRITING',
  'SPEAK_PHOTO',
  'READ_THEN_SPEAK',
  'INTERACTIVE_SPEAKING',
  'WRITING_SAMPLE',
  'SPEAKING_SAMPLE',
];

for (const stage of STAGES) {
  test(`mobile test header has no overflow on ${stage}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install();
    await page.addInitScript((attemptId) => {
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.setItem('det_cookie_consent', 'true');
      localStorage.setItem(
        'det_active_test_attempt_v2',
        JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
      );
    }, TEST_ATTEMPT_ID);
    await mockApi(page, { sessionStage: stage, sessionQuestions: [] });

    await page.goto('/test/session');
    await expect(page.getByRole('button', { name: /Пропустить этап/ })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      const header = document.querySelector('header, .max-w-7xl') as HTMLElement | null;
      return {
        page: root.scrollWidth - root.clientWidth,
        header: header ? header.scrollWidth - header.clientWidth : 0,
      };
    });
    expect(overflow.page, `${stage} page overflow`).toBeLessThanOrEqual(1);
    expect(overflow.header, `${stage} header overflow`).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: `test-results/mobile-header-${stage}.png`,
      fullPage: false,
    });
  });
}
