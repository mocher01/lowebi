import { test, expect } from '@playwright/test';

test.describe('OAuth Persistence Test', () => {
  test('OAuth should persist after Quitter → Continue', async ({ page }) => {
    console.log('\n🔍 OAUTH PERSISTENCE TEST - Full Flow\n');

    // Step 1: Login
    console.log('📍 Login');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sites', { timeout: 10000 });
    console.log('✅ Logged in\n');

    // Step 2: Create new wizard
    console.log('📍 Create new wizard');
    await page.goto('https://logen.locod-ai.com/wizard?new=true');
    await page.waitForTimeout(2000);

    const sessionId = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || 'fallback-' + Date.now();
    });
    console.log(`📋 SessionId: ${sessionId}\n`);

    // Step 3: Navigate to Step 6
    console.log('📍 Navigate to Step 6');
    await page.goto(`https://logen.locod-ai.com/wizard?continue=${sessionId}&step=5`);
    await page.waitForTimeout(3000);

    // Step 4: Simulate OAuth callback
    console.log('📍 Simulate OAuth callback');
    const mockCredentialId = 'oauth-' + Date.now();
    const mockEmail = 'test@example.com';
    const callbackUrl = `https://logen.locod-ai.com/wizard?continue=${sessionId}&step=5&oauth2Status=success&credentialId=${mockCredentialId}&email=${encodeURIComponent(mockEmail)}`;

    await page.goto(callbackUrl);
    await page.waitForTimeout(3000);
    console.log('✅ OAuth callback processed\n');

    // Step 5: Verify "Connecté" shows
    console.log('📍 Check if "Connecté" appears after OAuth');
    const afterOAuth = await page.locator('text=Connecté').count();
    console.log(`📋 Connecté text: ${afterOAuth > 0 ? 'YES ✅' : 'NO ❌'}\n`);

    expect(afterOAuth, 'Should show "Connecté" after OAuth').toBeGreaterThan(0);

    // Step 6: Click "Quitter" button
    console.log('📍 Click "Quitter" button');
    const quitterButton = page.locator('button:has-text("Quitter")');
    await quitterButton.waitFor({ state: 'visible', timeout: 5000 });
    await quitterButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Quitter\n');

    // Step 7: Verify we're back at /sites
    console.log('📍 Verify redirect to /sites');
    const currentUrl = page.url();
    console.log(`📋 Current URL: ${currentUrl}\n`);
    expect(currentUrl).toContain('/sites');

    // Step 8: Navigate back with continue URL
    console.log('📍 Navigate back with Continue URL');
    await page.goto(`https://logen.locod-ai.com/wizard?continue=${sessionId}&step=5`);
    await page.waitForTimeout(3000);
    console.log('✅ Returned to wizard\n');

    // Step 9: Verify "Connecté" STILL shows (PERSISTENCE TEST)
    console.log('📍 Check if "Connecté" STILL appears after return');
    const afterReturn = await page.locator('text=Connecté').count();
    console.log(`📋 Connecté text: ${afterReturn > 0 ? 'YES ✅' : 'NO ❌'}\n`);

    // Also check radio button is selected
    const radioSelected = await page.locator('input[type="radio"][value="oauth2"]:checked').count();
    console.log(`📋 OAuth2 radio selected: ${radioSelected > 0 ? 'YES ✅' : 'NO ❌'}\n`);

    console.log('========================================');
    console.log('📊 PERSISTENCE TEST RESULT');
    console.log('========================================');
    console.log(`✨ OAuth persists after Quitter → Continue: ${afterReturn > 0 && radioSelected > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================================\n');

    expect(afterReturn, 'Should STILL show "Connecté" after Quitter → Continue').toBeGreaterThan(0);
    expect(radioSelected, 'OAuth2 radio should STILL be selected').toBeGreaterThan(0);
  });
});
