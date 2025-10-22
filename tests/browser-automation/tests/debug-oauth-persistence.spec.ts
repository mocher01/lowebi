import { test, expect, Page } from '@playwright/test';

/**
 * PERSISTENCE TEST: Verify OAuth data persists to backend
 *
 * Tests that OAuth data is saved to backend and persists after page refresh
 */

test.describe('OAuth Persistence Test', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
  });

  test('OAuth data should persist to backend and survive page refresh', async () => {
    console.log('\n========================================');
    console.log('🔍 OAUTH PERSISTENCE TEST');
    console.log('========================================\n');

    // Step 1: Login
    console.log('📍 STEP 1: Login');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sites', { timeout: 10000 });
    console.log('✅ Logged in\n');

    // Step 2: Create new wizard session
    console.log('📍 STEP 2: Create new wizard session');
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForTimeout(2000);

    const sessionId = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || 'test-fallback';
    });
    console.log('📋 Created sessionId:', sessionId);
    console.log('');

    // Step 3: Navigate to Step 6
    console.log('📍 STEP 3: Navigate to Step 6');
    await page.goto(`https://dev.lowebi.com/wizard?continue=${sessionId}&step=5`);
    await page.waitForTimeout(2000);
    console.log('✅ At Step 6\n');

    // Step 4: Simulate OAuth callback
    console.log('📍 STEP 4: Simulate OAuth callback');
    const mockCredentialId = 'mock-persist-' + Date.now();
    const mockEmail = 'persist-test@example.com';
    const callbackUrl = `https://dev.lowebi.com/wizard?continue=${sessionId}&step=5&oauth2Status=success&credentialId=${mockCredentialId}&email=${encodeURIComponent(mockEmail)}`;

    console.log('📋 Loading callback URL...');
    await page.goto(callbackUrl);

    // Wait for OAuth processing and save
    await page.waitForTimeout(3000);
    console.log('✅ OAuth callback processed\n');

    // Step 5: Wait for backend save to complete
    console.log('📍 STEP 5: Waiting for backend save...');
    await page.waitForTimeout(2000); // Extra time for API call
    console.log('✅ Save should have completed\n');

    // Step 6: Refresh the page to reload from backend
    console.log('📍 STEP 6: Refreshing page to reload from backend');
    await page.reload();
    await page.waitForTimeout(3000); // Wait for loadSession to complete
    console.log('✅ Page refreshed\n');

    // Step 7: Check if OAuth data persisted
    console.log('📍 STEP 7: Checking if OAuth data persisted\n');

    const oauthDataAfterRefresh = await page.evaluate(() => {
      const ctx = (window as any).wizardContext;
      return {
        step6Exists: !!ctx?.wizardData?.step6,
        emailConfigExists: !!ctx?.wizardData?.step6?.emailConfig,
        oauthExists: !!ctx?.wizardData?.step6?.emailConfig?.oauth,
        oauthData: ctx?.wizardData?.step6?.emailConfig?.oauth || null,
        fullWizardData: ctx?.wizardData || null
      };
    });

    console.log('📋 Data check after refresh:');
    console.log(`   - step6 exists: ${oauthDataAfterRefresh.step6Exists}`);
    console.log(`   - emailConfig exists: ${oauthDataAfterRefresh.emailConfigExists}`);
    console.log(`   - oauth exists: ${oauthDataAfterRefresh.oauthExists}`);
    console.log(`   - OAuth data:`, JSON.stringify(oauthDataAfterRefresh.oauthData, null, 2));
    console.log('');

    // Step 8: Check UI shows connection status
    console.log('📍 STEP 8: Checking UI connection status\n');

    // Look for "Connecté" text or connection indicator
    const hasConnectedText = await page.locator('text=Connecté').count() > 0;
    const hasConnectButton = await page.locator('button:has-text("Connecter avec Google")').count() > 0;

    console.log('📋 UI Status:');
    console.log(`   - Shows "Connecté": ${hasConnectedText} ${hasConnectedText ? '✅' : '❌'}`);
    console.log(`   - Shows "Connect" button: ${hasConnectButton} ${hasConnectButton ? '❌ (should be hidden)' : '✅'}`);
    console.log('');

    // Summary
    console.log('========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`SessionId: ${sessionId}`);
    console.log(`OAuth data persisted: ${oauthDataAfterRefresh.oauthExists ? 'YES ✅' : 'NO ❌'}`);
    console.log(`UI shows connected: ${hasConnectedText ? 'YES ✅' : 'NO ❌'}`);
    console.log('========================================\n');

    // Assertions
    expect(oauthDataAfterRefresh.oauthExists, 'OAuth data should exist after refresh').toBe(true);
    expect(oauthDataAfterRefresh.oauthData?.connected, 'OAuth should be connected').toBe(true);
    expect(hasConnectedText, 'UI should show "Connecté"').toBe(true);
  });
});
