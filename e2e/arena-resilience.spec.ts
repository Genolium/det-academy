import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const ARENA_ENABLED = process.env.NEXT_PUBLIC_ARENA_ENABLED === 'true';
test.skip(!ARENA_ENABLED, 'Arena is paused (NEXT_PUBLIC_ARENA_ENABLED is not true)');

async function installFakeWebSocket(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    type FakeWindow = Window & {
      __arenaSockets?: number;
      __arenaClosed?: number;
      __arenaWs?: FakeSocket;
    };
    const fakeWindow = window as unknown as FakeWindow;
    fakeWindow.__arenaSockets = 0;
    fakeWindow.__arenaClosed = 0;
    class FakeSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor(_url: string) {
        fakeWindow.__arenaSockets = (fakeWindow.__arenaSockets || 0) + 1;
        fakeWindow.__arenaWs = this;
        setTimeout(() => {
          this.readyState = 1;
          this.onopen?.();
        }, 0);
      }
      send() {}
      close() {
        this.readyState = 3;
        fakeWindow.__arenaClosed = (fakeWindow.__arenaClosed || 0) + 1;
        this.onclose?.();
      }
    }
    Object.defineProperty(window, 'WebSocket', { configurable: true, value: FakeSocket });
  });
}

test('arena closes its websocket when leaving and can retry after an error', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/arena');
  const findMatch = page.getByRole('button', { name: /Найти соперника/ });
  await expect(findMatch).toBeVisible();
  await installFakeWebSocket(page);
  await findMatch.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __arenaSockets?: number }).__arenaSockets || 0)).toBe(1);

  await page.getByRole('link', { name: 'Словарь' }).click();
  await expect(page).toHaveURL(/vocabulary/);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __arenaClosed?: number }).__arenaClosed || 0)).toBeGreaterThanOrEqual(1);
});

test('arena offers a retry when the match server errors', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/arena');
  const findMatch = page.getByRole('button', { name: /Найти соперника/ });
  await expect(findMatch).toBeVisible();
  await installFakeWebSocket(page);
  await findMatch.click();
  await page.evaluate(() => {
    const socket = (window as unknown as { __arenaWs?: { onerror?: () => void } }).__arenaWs;
    socket?.onerror?.();
  });
  await expect(page.getByText('Арена недоступна')).toBeVisible();
  await page.getByRole('button', { name: 'Повторить поиск' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __arenaSockets?: number }).__arenaSockets || 0)).toBe(2);
});
