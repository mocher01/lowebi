import { test, expect, Page } from '@playwright/test';

/**
 * COMPLETE OAUTH UI TEST
 *
 * Tests that OAuth connection displays "Connecté" IMMEDIATELY after OAuth callback
 * without needing to navigate away and back
 */

test.describe('OAuth Immediate Display Test', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
  });

  test('OAuth should display "Connecté" immediately after callback', async () => {
    console.log('\n========================================');
    console.log('🔍 OAUTH IMMEDIATE DISPLAY TEST');
    console.log('========================================\n');

    // Step 1: Login
    console.log('📍 STEP 1: Login');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sites', { timeout: 10000 });
    console.log('✅ Logged in\n');

    // Step 2: Look for test66 or create new session
    console.log('📍 STEP 2: Looking for test66 session');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(2000);

    // Check if test66 exists
    const test66Exists = await page.locator('text=/test66/i').count() > 0;
    console.log('📋 test66 exists:', test66Exists);

    let sessionId: string;

    if (test66Exists) {
      console.log('✅ Found test66, getting sessionId');
      // Click on test66 to continue
      await page.click('text=/test66/i');
      await page.waitForTimeout(2000);

      // Extract sessionId from URL
      const currentUrl = page.url();
      const urlParams = new URLSearchParams(new URL(currentUrl).search);
      sessionId = urlParams.get('continue') || '';
      console.log('📋 Using existing sessionId:', sessionId);
    } else {
      console.log('⚠️  test66 not found, creating new wizard session');
      await page.goto('https://dev.lowebi.com/wizard?new=true');
      await page.waitForTimeout(2000);

      sessionId = await page.evaluate(() => {
        return (window as any).wizardContext?.sessionId || '';
      });
      console.log('📋 Created new sessionId:', sessionId);
    }
    console.log('');

    // Step 3: Navigate to Step 6
    console.log('📍 STEP 3: Navigate to Step 6 (Advanced Features)');
    await page.goto(`https://dev.lowebi.com/wizard?continue=${sessionId}&step=5`);
    await page.waitForTimeout(3000);
    console.log('✅ At Step 6\n');

    // Step 4: Check initial state (should show Connect button)
    console.log('📍 STEP 4: Checking initial state (before OAuth)');
    const hasConnectButtonBefore = await page.locator('button:has-text("Connecter avec Google")').count() > 0;
    const hasConnectedTextBefore = await page.locator('text=Connecté').count() > 0;
    console.log('📋 Initial state:');
    console.log(`   - Shows "Connect" button: ${hasConnectButtonBefore}`);
    console.log(`   - Shows "Connecté": ${hasConnectedTextBefore}`);
    console.log('');

    // Step 5: Simulate OAuth callback
    console.log('📍 STEP 5: Simulating OAuth callback');
    const mockCredentialId = 'test-oauth-' + Date.now();
    const mockEmail = 'oauth-test@example.com';
    const callbackUrl = `https://dev.lowebi.com/wizard?continue=${sessionId}&step=5&oauth2Status=success&credentialId=${mockCredentialId}&email=${encodeURIComponent(mockEmail)}`;

    console.log('📋 Navigating to callback URL with OAuth params...');
    await page.goto(callbackUrl);

    // CRITICAL: Wait for OAuth processing (should be quick with new code)
    await page.waitForTimeout(3000);
    console.log('✅ OAuth callback processed\n');

    // Step 6: Check if "Connecté" appears IMMEDIATELY (without navigation)
    console.log('📍 STEP 6: Checking if "Connecté" appears IMMEDIATELY');

    const hasConnectedTextAfter = await page.locator('text=Connecté').count() > 0;
    const hasConnectButtonAfter = await page.locator('button:has-text("Connecter avec Google")').count() > 0;
    const connectedEmail = hasConnectedTextAfter ? await page.locator('text=Connecté').locator('..').locator('xpath=following-sibling::div').textContent() : null;

    console.log('📋 After OAuth callback (IMMEDIATE check):');
    console.log(`   - Shows "Connecté": ${hasConnectedTextAfter} ${hasConnectedTextAfter ? '✅' : '❌'}`);
    console.log(`   - Shows "Connect" button: ${hasConnectButtonAfter} ${hasConnectButtonAfter ? '❌ (should be hidden)' : '✅'}`);
    if (connectedEmail) {
      console.log(`   - Connected email: ${connectedEmail.trim()}`);
    }
    console.log('');

    // Step 7: Check URL is clean (no OAuth params)
    console.log('📍 STEP 7: Verifying URL is clean');
    const finalUrl = page.url();
    const hasOAuthParams = finalUrl.includes('oauth2Status') || finalUrl.includes('credentialId');
    const hasSessionIdNull = finalUrl.includes('sessionId=null');
    console.log('📋 URL check:');
    console.log(`   - Final URL: ${finalUrl}`);
    console.log(`   - Contains OAuth params: ${hasOAuthParams} ${hasOAuthParams ? '❌' : '✅'}`);
    console.log(`   - Contains sessionId=null: ${hasSessionIdNull} ${hasSessionIdNull ? '❌' : '✅'}`);
    console.log('');

    // Step 8: Test persistence - click "Quitter" and then "Continue"
    console.log('📍 STEP 8: Testing persistence (Quitter → Continue)');

    // Find and click Quitter button
    const quitterButton = page.locator('button:has-text("Quitter")');
    if (await quitterButton.count() > 0) {
      await quitterButton.click();
      await page.waitForURL('**/sites', { timeout: 10000 });
      console.log('✅ Clicked "Quitter", back to sites page');

      await page.waitForTimeout(2000);

      // Find and click Continue on test66 (or the session we used)
      const continueButton = page.locator('button:has-text("Continuer")').first();
      if (await continueButton.count() > 0) {
        await continueButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Clicked "Continuer", back in wizard\n');

        // Check if "Connecté" still shows
        console.log('📍 STEP 9: Checking if "Connecté" persists after Continue');
        const hasConnectedAfterContinue = await page.locator('text=Connecté').count() > 0;
        console.log(`📋 Shows "Connecté" after Continue: ${hasConnectedAfterContinue} ${hasConnectedAfterContinue ? '✅' : '❌'}`);
        console.log('');
      } else {
        console.log('⚠️  Could not find "Continuer" button, skipping persistence test\n');
      }
    } else {
      console.log('⚠️  Could not find "Quitter" button, skipping persistence test\n');
    }

    // Summary
    console.log('========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`SessionId: ${sessionId}`);
    console.log(`Initial state - "Connect" button visible: ${hasConnectButtonBefore ? 'YES' : 'NO'}`);
    console.log(`After OAuth - "Connecté" appears IMMEDIATELY: ${hasConnectedTextAfter ? 'YES ✅' : 'NO ❌'}`);
    console.log(`After OAuth - "Connect" button hidden: ${!hasConnectButtonAfter ? 'YES ✅' : 'NO ❌'}`);
    console.log(`URL clean (no OAuth params): ${!hasOAuthParams ? 'YES ✅' : 'NO ❌'}`);
    console.log(`URL clean (no sessionId=null): ${!hasSessionIdNull ? 'YES ✅' : 'NO ❌'}`);
    console.log('========================================\n');

    // Assertions
    expect(hasConnectedTextAfter, '"Connecté" should appear immediately after OAuth callback').toBe(true);
    expect(hasConnectButtonAfter, '"Connect" button should be hidden after OAuth').toBe(false);
    expect(hasOAuthParams, 'URL should not contain OAuth params').toBe(false);
    expect(hasSessionIdNull, 'URL should not contain sessionId=null').toBe(false);
  });
});
