import { defineConfig, devices } from '@playwright/test';

const PORT = 3103;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Dedicated config for the Yandex Metrika checks. The counter is normally
 * disabled outside production; this server explicitly enables it through the
 * same public env switch documented in docs/metrika.md.
 */
export default defineConfig({
  testDir: './e2e-metrika',
  testMatch: /metrika\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    channel: 'chrome',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'metrika-chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_API_URL: BASE_URL,
      NEXT_PUBLIC_YM_ENABLED: 'true',
    },
  },
});
