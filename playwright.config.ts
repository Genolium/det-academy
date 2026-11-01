import { defineConfig, devices } from '@playwright/test';

const PORT = 3101;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // The HTML report is what CI uploads when a test fails. The list reporter
  // alone leaves no report directory, so a red job would have no evidence.
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    // Use Playwright's bundled Chromium, which `playwright install chromium`
    // guarantees on CI. `channel: 'chrome'` needs a separate Google Chrome.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Production build catches SSR/hydration regressions that `next dev`
    // hides, and avoids per-test compilation timeouts on CI.
    command: isCI
      ? `npm run build && npm run start -- --port ${PORT}`
      : `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: isCI ? 300_000 : 180_000,
    env: {
      NEXT_PUBLIC_API_URL: BASE_URL,
    },
  },
});
