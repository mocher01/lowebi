import { test, expect, Page } from '@playwright/test';

/**
 * SIMPLE OAUTH UI TEST - Quick verification
 */

test.describe('OAuth Simple UI Test', () => {
  test('OAuth callback should show Connecté immediately', async ({ page }) => {
    console.log('\n🔍 SIMPLE OAUTH UI TEST\n');

    // Login
    console.log('📍 Login');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sites', { timeout: 10000 });
    console.log('✅ Logged in\n');

    // Create new session
    console.log('📍 Create new wizard');
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForTimeout(2000);

    const sessionId = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || 'fallback-' + Date.now();
    });
    console.log('📋 SessionId:', sessionId, '\n');

    // Navigate to Step 6
    console.log('📍 Navigate to Step 6');
    await page.goto(`https://dev.lowebi.com/wizard?continue=${sessionId}&step=5`);
    await page.waitForTimeout(3000);

    // Check initial state
    const initialConnectButton = await page.locator('button:has-text("Connecter avec Google")').count();
    const initialConnectedText = await page.locator('text=Connecté').count();
    console.log('📋 Before OAuth:');
    console.log(`   Connect button: ${initialConnectButton > 0 ? 'YES' : 'NO'}`);
    console.log(`   Connecté text: ${initialConnectedText > 0 ? 'YES' : 'NO'}`);
    console.log('');

    // Simulate OAuth callback
    console.log('📍 Simulate OAuth callback');
    const mockCredentialId = 'oauth-' + Date.now();
    const mockEmail = 'test@example.com';
    const callbackUrl = `https://dev.lowebi.com/wizard?continue=${sessionId}&step=5&oauth2Status=success&credentialId=${mockCredentialId}&email=${encodeURIComponent(mockEmail)}`;

    await page.goto(callbackUrl);
    console.log('✅ Callback URL loaded\n');

    // Wait for processing
    console.log('⏳ Waiting 3 seconds for OAuth processing...');
    await page.waitForTimeout(3000);

    // Check if Connecté appears
    console.log('📍 Check if "Connecté" appears');
    const afterConnectButton = await page.locator('button:has-text("Connecter avec Google")').count();
    const afterConnectedText = await page.locator('text=Connecté').count();

    console.log('📋 After OAuth:');
    console.log(`   Connect button: ${afterConnectButton > 0 ? 'YES (❌ should be hidden)' : 'NO (✅)'}`);
    console.log(`   Connecté text: ${afterConnectedText > 0 ? 'YES (✅)' : 'NO (❌)'}`);
    console.log('');

    // Check URL
    const finalUrl = page.url();
    console.log('📋 Final URL:', finalUrl);
    const hasOAuthParams = finalUrl.includes('oauth2Status');
    const hasSessionIdNull = finalUrl.includes('sessionId=null');
    console.log(`   Has OAuth params: ${hasOAuthParams ? 'YES (❌)' : 'NO (✅)'}`);
    console.log(`   Has sessionId=null: ${hasSessionIdNull ? 'YES (❌)' : 'NO (✅)'}`);
    console.log('');

    // Summary
    console.log('========================================');
    console.log('📊 TEST RESULT');
    console.log('========================================');
    const immediateDisplay = afterConnectedText > 0 && afterConnectButton === 0;
    console.log(`✨ OAuth displays "Connecté" immediately: ${immediateDisplay ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🧹 URL is clean: ${!hasOAuthParams && !hasSessionIdNull ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================================\n');

    // Assertions
    expect(afterConnectedText, 'Should show "Connecté" text').toBeGreaterThan(0);
    expect(afterConnectButton, 'Should hide "Connect" button').toBe(0);
    expect(hasOAuthParams, 'Should not have OAuth params in URL').toBe(false);
    expect(hasSessionIdNull, 'Should not have sessionId=null in URL').toBe(false);
  });
});
