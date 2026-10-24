import { test, expect } from '@playwright/test';
import { completedResult, installFakeMedia, mockApi, TEST_ATTEMPT_ID } from './mocks';

test.describe('speaking/writing coach', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await installFakeMedia(page);
    await page.addInitScript((attemptId) => {
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.removeItem('det_token');
      localStorage.setItem(
        'det_active_test_attempt_v2',
        JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
      );
      localStorage.setItem('det_active_test_session_id', attemptId);
      localStorage.setItem('det_cookie_consent', 'true');
    }, TEST_ATTEMPT_ID);
  });

  test('the coach compares attempts and links feedback to the notebook', async ({ page }) => {
    await mockApi(page, { completionResponses: [{ status: 200, body: completedResult }] });

    let savedErrors = 0;
    let deletedAudio = 0;

    await page.route('**/api/v1/user/coach/*/errors', async (route) => {
      savedErrors += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ created: 1 }) });
    });
    await page.route('**/api/v1/user/coach/*/audio', async (route) => {
      deletedAudio += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deletedAssets: 1, deletedFiles: 1 }),
      });
    });
    await page.route('**/api/v1/user/coach/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: TEST_ATTEMPT_ID,
          available: true,
          items: [
            {
              questionId: 'q-ws-01',
              questionType: 'WRITING_SAMPLE',
              status: 'COMPLETED',
              score: 0.72,
              cefrLevel: 'B2',
              provider: 'practice_feedback',
              evaluatorVersion: '2026.1',
              feedback: 'Усильте аргументацию примерами.',
              recommendations: [],
              evidence: [
                {
                  span: 'I think it is good',
                  rule: 'academic_register',
                  fix: 'Use a precise claim: The policy improves outcomes by...',
                },
              ],
              previousScore: 0.55,
              scoreDelta: 0.17,
              improvements: ['Оценка выросла на 0.17 по сравнению с прошлой попыткой (0.55 → 0.72).'],
              practiceUrl: '/practice',
            },
            {
              questionId: 'q-ss-01',
              questionType: 'SPEAKING_SAMPLE',
              status: 'FAILED',
              score: 0,
              cefrLevel: '',
              provider: 'openai',
              evaluatorVersion: '2026.1',
              feedback: '',
              recommendations: [],
              evidence: [],
              improvements: [],
              practiceUrl: '/practice',
            },
          ],
        }),
      });
    });

    await page.goto('/test/session');
    await expect(page.getByRole('heading', { name: 'Speaking Sample' })).toBeVisible();
    await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
    await page.clock.fastForward(61_000);
    await page.getByRole('button', { name: /Далее/ }).click();

    await expect(page.getByText('Коучинг Speaking / Writing')).toBeVisible();
    await expect(
      page.getByText('Оценка выросла на 0.17 по сравнению с прошлой попыткой (0.55 → 0.72).')
    ).toBeVisible();
    await expect(page.getByText(/academic_register/)).toBeVisible();
    await expect(page.getByText(/оценка недоступна/)).toBeVisible();
    await expect(page.getByText(/Это не нулевой навык/)).toBeVisible();

    await page.getByRole('button', { name: /В тетрадь ошибок/ }).click();
    await expect(page.getByText(/Добавлено в тетрадь ошибок: 1/)).toBeVisible();
    expect(savedErrors).toBe(1);

    await page.getByRole('button', { name: /Удалить аудио/ }).click();
    await expect(page.getByText(/Аудио удалено: 1/)).toBeVisible();
    expect(deletedAudio).toBe(1);
  });
});
