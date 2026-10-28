import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { completedResult, installFakeMedia, mockApi, TEST_ATTEMPT_ID } from './mocks';

const pronunciationFixture = {
  version: 1,
  method: 'clarity-proxy',
  overallScore: 0.62,
  timingSource: 'asr-segment-arrivals',
  durationSec: 75,
  measuredWords: 5,
  referenceText: 'Describe the workshop scene in detail.',
  referencePlaybackText: 'Speak about the scene shown below for ninety seconds.',
  referenceMatchRate: 0.5,
  notes: ['Границы слов приблизительные: распознаватель не даёт точных меток времени.'],
  words: [
    { word: 'The', start: 0.2, end: 0.4, score: 0.95 },
    { word: 'workshop', start: 0.4, end: 1.1, score: 0.38, issue: 'unclear' },
    { word: 'was', start: 1.1, end: 1.3, score: 0.9 },
    { word: 'extremely', start: 1.3, end: 2.0, score: 0.55, issue: 'quiet' },
    { word: 'noisy', start: 2.0, end: 2.5, score: 0.85 },
  ],
};

test('speaking result renders per-word clarity highlights and model playback', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
    const fakeSynth = {
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null,
      speak: (utterance: SpeechSynthesisUtterance) => {
        spoken.push(utterance.text);
        utterance.onend?.(new Event('end') as SpeechSynthesisEvent);
      },
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: fakeSynth,
    });
  });
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

  // Deterministic word-level report; overrides the shared evaluations mock.
  await page.route(/\/test\/sessions\/[^/]+\/evaluations$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        evaluations: [
          {
            id: 'eval-pron-1',
            sessionId: TEST_ATTEMPT_ID,
            questionId: 'q-ss-01',
            questionType: 'SPEAKING_SAMPLE',
            status: 'COMPLETED',
            score: 0.72,
            wordCount: 5,
            uniqueWords: 5,
            lexicalDiversity: 1,
            academicWords: [],
            connectors: [],
            relevanceScore: 0.8,
            cefrLevel: 'B2',
            speakingDuration: 75,
            wpm: 74,
            speechRate: 74,
            pauseRatio: 0.1,
            pauseCount: 1,
            fillerCount: 0,
            pronunciationStability: 0.86,
            pauses: [{ start: 10, end: 12 }],
            pronunciation: pronunciationFixture,
            recommendations: [],
            feedbackStatus: 'completed',
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    })
  );
  // Pronunciation playback prefers a human recording; block the external call
  // so the deterministic browser voice is used.
  await page.route('https://api.dictionaryapi.dev/**', (route) => route.abort());

  await page.goto('/test/session');
  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(61_000);
  await page.getByRole('button', { name: /Далее/ }).click();

  const panel = page.getByTestId('pronunciation-feedback');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: /Чёткость произношения по словам/ })).toBeVisible();
  await expect(page.getByTestId('pronunciation-overall')).toHaveText('62%');
  await expect(panel.getByText(/не фонемная точность/)).toBeVisible();

  const words = page.getByTestId('pronunciation-word');
  await expect(words).toHaveCount(5);
  await expect(words.nth(1)).toHaveAttribute('data-issue', 'unclear');
  await expect(words.nth(1)).toHaveAttribute('data-score', '0.38');
  await expect(words.nth(1)).toHaveClass(/rose|amber/);
  await expect(words.nth(2)).toHaveAttribute('data-issue', '');
  await expect(panel.getByText(/2 из 5 слов нечёткие/)).toBeVisible();
  await expect(panel.getByText(/Совпадение с эталонным текстом/)).toBeVisible();

  // Tapping a weak word plays its model pronunciation.
  await words.nth(1).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken))
    .toContain('workshop');

  // Reference playback uses the prompt text.
  await panel.getByRole('button', { name: 'Эталон: прослушать текст задания' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken))
    .toContain('Speak about the scene shown below for ninety seconds.');

  const accessibility = await new AxeBuilder({ page })
    .include('[data-testid="pronunciation-feedback"]')
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
