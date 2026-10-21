import { defineConfig, devices } from '@playwright/test';

const PORT = 3102;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e-fullstack',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    channel: 'chrome',
  },
  projects: [{ name: 'fullstack-chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_API_URL: '',
      NEXT_PUBLIC_API_SAME_ORIGIN: 'true',
      API_PROXY_TARGET: 'http://localhost:18081',
      NEXT_DIST_DIR: '.next-fullstack',
    },
  },
});
