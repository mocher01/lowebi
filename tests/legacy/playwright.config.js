// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration Playwright pour les tests automatisés
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './specs',
  
  /* Configuration globale des tests */
  fullyParallel: false, // Tests séquentiels pour éviter les conflits
  forbidOnly: !!process.env.CI, // Interdire .only() en CI
  retries: process.env.CI ? 2 : 1, // Retry en cas d'échec
  workers: 1, // Un seul worker pour éviter les conflits de ports
  
  /* Configuration des rapports */
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  /* Dossier pour les artifacts */
  outputDir: 'test-results/artifacts',
  
  /* Configuration globale des tests */
  use: {
    /* URL de base (sera surchargée par les tests) */
    baseURL: process.env.BASE_URL || 'http://162.55.213.90:3001',
    
    /* Collecte des traces en cas d'échec */
    trace: 'on-first-retry',
    
    /* Screenshots en cas d'échec */
    screenshot: 'only-on-failure',
    
    /* Vidéos en cas d'échec */
    video: 'retain-on-failure',
    
    /* Timeouts */
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  /* Configuration des navigateurs de test */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    /* Tests mobile sur Chrome */
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
    
    /* Optionnel: Tests Firefox et Safari */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Configuration du serveur de développement local (optionnel) */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
});