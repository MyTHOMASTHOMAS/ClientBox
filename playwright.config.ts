import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright — ADR-011
 * Exécution des tests E2E sur navigateur headless.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*(?:e2e|\.e2e)\.test\.ts$/,
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:2974',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node dist/clientsbox.js -e env/.env.test',
    url: 'http://127.0.0.1:2974',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
