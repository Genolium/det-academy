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
  // The HTML report is what CI uploads when a test fails. The JSON report is
  // summarized into the public job summary, because raw job logs require a
  // GitHub login even for a public repository.
  reporter: isCI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
      ]
    : [['list']],
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
      // Test-only: mocks identify the fixture user with a Bearer token.
      // Production never sets this flag and never stores an access token.
      NEXT_PUBLIC_ALLOW_LEGACY_BEARER: 'true',
    },
  },
});
