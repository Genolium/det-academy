import { defineConfig, devices } from '@playwright/test';

/**
 * Production-build checks for the public catalogue routes.
 *
 *   npm run build
 *   npm run test:seo
 *
 * The server is reused when it is already running, so `next start` is only
 * launched when no process is listening on the port.
 */
const PORT = Number(process.env.SEO_PORT || 3201);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/seo-public-pages.spec.ts',
  outputDir: 'test-results/seo-public-pages',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
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
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
