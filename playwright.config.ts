import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  snapshotDir: './e2e/screenshots',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'visual',
      grep: /@visual/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium',
      grepInvert: /@visual/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      grepInvert: /@visual/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      grepInvert: /@visual/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      grepInvert: /@visual/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      grepInvert: /@visual/,
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev -- --port 3001',
    // The home page depends on live SEO data, so use a stable route as the
    // readiness probe for the local E2E server.
    url: 'http://localhost:3001/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  timeout: 30000,
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: 'disabled',
      caret: 'hide',
      scale: 'device',
    },
  },
});
