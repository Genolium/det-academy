import { test, expect } from '@playwright/test';
import { completedResult, installFakeMedia, mockApi, TEST_ATTEMPT_ID } from './mocks';

test('mock review shows skills, item timing and a weekly plan', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await page.addInitScript((attemptId) => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
    );
    localStorage.setItem('det_active_test_session_id', attemptId);
  }, TEST_ATTEMPT_ID);
  await mockApi(page, { completionResponses: [{ status: 200, body: completedResult }] });
  await page.route('**/api/v1/test/sessions/*/review', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: TEST_ATTEMPT_ID,
        nextAction: 'Закрыть слабейший навык: аудирование',
        items: [
          { questionId: 'q1', questionType: 'READ_SELECT', stageName: 'READ_SELECT', prompt: 'Read and Select', userAnswer: 'Yes', correctAnswer: 'Yes', isCorrect: true, rawScore: 1, timeSpentSec: 12 },
          { questionId: 'q2', questionType: 'LISTEN_TYPE', stageName: 'LISTEN_TYPE', prompt: 'Listen and Type', userAnswer: 'wrong', correctAnswer: 'right', isCorrect: false, rawScore: 0, timeSpentSec: 30 },
        ],
        skills: [
          { name: 'reading', score: 132, correct: 1, total: 1, accuracy: 1 },
          { name: 'listening', score: 118, correct: 0, total: 1, accuracy: 0 },
        ],
        weeklyPlan: [
          { title: 'Закрыть слабейший навык: аудирование', description: 'Два блока по 10 минут.', href: '/practice?drill=listen-and-type', minutes: 20, reason: 'Самый низкий сабскор.' },
          { title: 'Повторить ошибки из тетради', description: 'Адаптивная сессия.', href: '/practice/adaptive', minutes: 10, reason: 'Ошибки попытки.' },
        ],
      }),
    })
  );

  await page.goto('/test/session');
  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(61_000);
  await page.getByRole('button', { name: /Проверить ответ|Далее/ }).click();

  await expect(page.getByTestId('review-next-action')).toContainText('аудирование');
  await expect(page.getByTestId('review-skills')).toContainText('reading');
  await expect(page.getByTestId('review-skills')).toContainText('118');
  await expect(page.getByTestId('review-weekly-plan')).toContainText('План на неделю');
  await expect(page.getByTestId('review-weekly-plan').getByRole('link', { name: /Закрыть слабейший/ })).toHaveAttribute(
    'href',
    '/practice?drill=listen-and-type'
  );
  await expect(page.getByText(/LISTEN TYPE · 30s/)).toBeVisible();
});
