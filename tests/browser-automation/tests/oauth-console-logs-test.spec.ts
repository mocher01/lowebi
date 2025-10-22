import { test, expect, Page } from '@playwright/test';

/**
 * OAUTH CONSOLE LOGS TEST
 * Captures all browser console logs to debug OAuth processing
 */

test.describe('OAuth Console Logs Test', () => {
  test('Capture console logs during OAuth callback', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
      console.log(`[BROWSER] ${text}`);
    });

    console.log('\n🔍 OAUTH CONSOLE LOGS TEST\n');

    // Login
    console.log('📍 Step 1: Login');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sites', { timeout: 10000 });
    console.log('✅ Logged in\n');

    // Create new session
    console.log('📍 Step 2: Create new wizard');
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForTimeout(2000);

    const sessionId = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || 'fallback-' + Date.now();
    });
    console.log('📋 SessionId:', sessionId, '\n');

    // Navigate to Step 6
    console.log('📍 Step 3: Navigate to Step 6');
    consoleLogs.length = 0; // Clear logs
    await page.goto(`https://dev.lowebi.com/wizard?continue=${sessionId}&step=5`);
    await page.waitForTimeout(2000);
    console.log('✅ At Step 6\n');

    // Simulate OAuth callback
    console.log('📍 Step 4: Simulate OAuth callback\n');
    consoleLogs.length = 0; // Clear logs before OAuth

    const mockCredentialId = 'oauth-' + Date.now();
    const mockEmail = 'test@example.com';
    const callbackUrl = `https://dev.lowebi.com/wizard?continue=${sessionId}&step=5&oauth2Status=success&credentialId=${mockCredentialId}&email=${encodeURIComponent(mockEmail)}`;

    await page.goto(callbackUrl);
    console.log('📋 OAuth callback URL loaded');

    // Wait for processing
    await page.waitForTimeout(5000);

    // Print all console logs
    console.log('\n📋 BROWSER CONSOLE LOGS:\n');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('OAuth') ||
      log.includes('RENDER') ||
      log.includes('UPDATE') ||
      log.includes('step6') ||
      log.includes('emailConfig')
    );

    if (relevantLogs.length > 0) {
      relevantLogs.forEach(log => console.log(log));
    } else {
      console.log('⚠️  No relevant logs found. All logs:');
      consoleLogs.slice(-20).forEach(log => console.log(log));
    }

    // Check component state
    console.log('\n📍 Step 5: Check component state\n');

    const componentState = await page.evaluate(() => {
      const ctx = (window as any).wizardContext;
      return {
        sessionId: ctx?.sessionId,
        step6: ctx?.wizardData?.step6,
        emailScenario: ctx?.wizardData?.step6?.emailConfig?.scenario,
        oauth: ctx?.wizardData?.step6?.emailConfig?.oauth
      };
    });

    console.log('📋 Component State:');
    console.log(JSON.stringify(componentState, null, 2));

    // Check DOM
    const radioChecked = await page.evaluate(() => {
      const oauth2Radio = document.querySelector('input[name="emailScenario"][value="oauth2"]') as HTMLInputElement;
      return oauth2Radio?.checked || false;
    });

    const hasConnectedText = await page.locator('text=Connecté').count() > 0;

    console.log('\n📋 DOM State:');
    console.log(`   OAuth2 radio checked: ${radioChecked}`);
    console.log(`   "Connecté" text visible: ${hasConnectedText}`);

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`EmailScenario in state: ${componentState.emailScenario || 'UNDEFINED'}`);
    console.log(`OAuth data in state: ${componentState.oauth ? 'YES' : 'NO'}`);
    console.log(`Radio button checked: ${radioChecked ? 'YES' : 'NO'}`);
    console.log(`"Connecté" visible: ${hasConnectedText ? 'YES' : 'NO'}`);
    console.log('========================================\n');
  });
});
