import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('dictations use an English voice, never a system voice of another language', async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: Array<{ text: string; lang: string; voice: string | null }> = [];
    (window as unknown as { __spoken: typeof spoken }).__spoken = spoken;

    const voices = [
      { name: 'Microsoft Irina', lang: 'ru-RU', localService: true, default: true },
      { name: 'Google US English', lang: 'en-US', localService: false, default: false },
      { name: 'Milena', lang: 'ru-RU', localService: true, default: false },
    ];

    class FakeUtterance {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FakeUtterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => voices,
        speak: (utterance: FakeUtterance) => {
          spoken.push({
            text: utterance.text,
            lang: utterance.lang,
            voice: (utterance.voice as { name?: string } | null)?.name ?? null,
          });
          if (utterance.onend) utterance.onend();
        },
        cancel: () => {},
        onvoiceschanged: null,
      },
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/practice');
  await page.getByRole('button', { name: /Тренировать диктанты/i }).click();

  // The dictation starts on demand: press the first listen button.
  await page.getByRole('button', { name: /Слушать аудио/i }).click();
  await expect
    .poll(async () => page.evaluate(() => (window as unknown as { __spoken: unknown[] }).__spoken.length), {
      timeout: 8000,
    })
    .toBeGreaterThan(0);

  const spoken = await page.evaluate(
    () => (window as unknown as { __spoken: Array<{ text: string; lang: string; voice: string | null }> }).__spoken
  );
  expect(spoken[0].lang.toLowerCase().startsWith('en')).toBe(true);
  expect(spoken[0].voice).toBe('Google US English');
  expect(spoken[0].voice).not.toContain('Irina');
});
