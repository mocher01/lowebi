import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Continue button testing
 * Tests customer frontend (port 7601) instead of admin frontend
 */
export default defineConfig({
  testDir: './tests',
  testMatch: 'continue-button-e2e.spec.js',
  fullyParallel: false, // Run sequentially for better debugging
  retries: 0,
  workers: 1,
  reporter: [
    ['line'],
    ['html', { outputFolder: './test-results/continue-test-html' }]
  ],
  use: {
    baseURL: 'http://localhost:7601', // Customer frontend
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  timeout: 60 * 1000,
  outputDir: './test-results/continue-test-artifacts',
  expect: {
    timeout: 10000
  }
});