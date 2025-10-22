import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for comprehensive admin portal testing
 * Tests actual browser behavior, not just HTML parsing
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './test-results/html-report' }],
    ['junit', { outputFile: './test-results/junit-results.xml' }],
    ['json', { outputFile: './test-results/test-results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:7602',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Record videos on failure */
    video: 'retain-on-failure',
    
    /* Set timeout for individual actions */
    actionTimeout: 10000,
    
    /* Set timeout for navigation actions */
    navigationTimeout: 30000
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

  /* Run your local dev server before starting the tests */
  // webServer: Disabled - using Docker containers on ports 7600, 7601, 7602
  // webServer: [
  //   {
  //     command: 'cd /var/apps/logen/apps/admin-frontend && npm run dev',
  //     port: 7602,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 30000
  //   },
  //   {
  //     command: 'cd /var/apps/logen/apps/backend && npm run start:dev',
  //     port: 7600,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 30000
  //   }
  // ],

  /* Global timeout for entire test suite */
  globalTimeout: 10 * 60 * 1000, // 10 minutes
  
  /* Timeout for each test */
  timeout: 300 * 1000, // 5 minutes per test
  
  /* Directory for test artifacts */
  outputDir: './test-results/artifacts',
  
  /* Expect assertions configuration */
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000
  }
});