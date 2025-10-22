import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration specifically for V2 Wizard testing
 * Tests the live production wizard at https://logen.locod-ai.com/wizard-v2
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/wizard-v2-*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './test-results/wizard-v2-report' }],
    ['junit', { outputFile: './test-results/wizard-v2-junit.xml' }],
    ['json', { outputFile: './test-results/wizard-v2-results.json' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL for wizard testing */
    baseURL: 'https://logen.locod-ai.com',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Record videos on failure */
    video: 'retain-on-failure',
    
    /* Set timeout for individual actions */
    actionTimeout: 15000,
    
    /* Set timeout for navigation actions */
    navigationTimeout: 30000,
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }
  ],

  /* Global timeout for entire test suite */
  globalTimeout: 20 * 60 * 1000, // 20 minutes
  
  /* Timeout for each test */
  timeout: 2 * 60 * 1000, // 2 minutes per test
  
  /* Directory for test artifacts */
  outputDir: './test-results/wizard-v2-artifacts',
  
  /* Expect assertions configuration */
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 10000
  }
});