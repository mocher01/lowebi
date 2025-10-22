import { test, expect, Page } from '@playwright/test';

/**
 * SIMPLE DEBUG TEST: OAuth URL Issue
 * Directly simulates OAuth callback to debug URL changes
 */

test.describe('OAuth URL Debug - Simple', () => {
  let page: Page;
  const consoleLogs: string[] = [];

  test.beforeEach(async ({ page: p }) => {
    page = p;
    consoleLogs.length = 0;

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('OAuth') || text.includes('sessionId') || text.includes('IMMEDIATE') || text.includes('SAVE') || text.includes('URL')) {
        console.log(`[BROWSER] ${text}`);
      }
    });
  });

  test('Simulate OAuth callback and debug URL', async () => {
    console.log('\n========================================');
    console.log('🔍 OAUTH URL DEBUG TEST');
    console.log('========================================\n');

    // Step 1: Login
    console.log('📍 STEP 1: Login');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sites', { timeout: 10000 });
    console.log('✅ Logged in\n');

    // Step 2: Go to My Sites and find test66
    console.log('📍 STEP 2: Looking for test66 session');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(2000);

    // Check if test66 exists
    const test66Exists = await page.locator('text=test66').count() > 0;
    console.log(`📋 test66 exists: ${test66Exists}`);

    let sessionId = 'test66'; // Default

    if (!test66Exists) {
      console.log('⚠️  test66 not found, creating new wizard session');
      await page.goto('https://dev.lowebi.com/wizard?new=true');
      await page.waitForTimeout(2000);

      // Get sessionId from URL or context
      const url = page.url();
      console.log('📋 New wizard URL:', url);

      sessionId = await page.evaluate(() => {
        return (window as any).wizardContext?.sessionId || 'test-fallback';
      });
      console.log('📋 Generated sessionId:', sessionId);
    }
    console.log('');

    // Step 3: Navigate to step 6 with continue parameter
    console.log('📍 STEP 3: Navigate to Step 6');
    const step6Url = `https://dev.lowebi.com/wizard?continue=${sessionId}&step=5`;
    console.log('📋 Navigating to:', step6Url);
    await page.goto(step6Url);
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📋 Current URL after navigation:', currentUrl);

    const contextSessionId = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || null;
    });
    console.log('📋 SessionId in context:', contextSessionId);
    console.log('');

    // Step 4: Simulate OAuth callback
    console.log('📍 STEP 4: Simulating OAuth callback');
    const mockCredentialId = 'mock-cred-' + Date.now();
    const mockEmail = 'debug@test.com';
    const callbackUrl = `https://dev.lowebi.com/wizard?continue=${sessionId}&step=5&oauth2Status=success&credentialId=${mockCredentialId}&email=${encodeURIComponent(mockEmail)}`;

    console.log('📋 Callback URL:', callbackUrl);
    console.log('📋 Params in callback:');
    console.log(`   - continue: ${sessionId}`);
    console.log(`   - step: 5`);
    console.log(`   - oauth2Status: success`);
    console.log(`   - credentialId: ${mockCredentialId}`);
    console.log(`   - email: ${mockEmail}`);
    console.log('');

    // Clear console logs to focus on OAuth processing
    consoleLogs.length = 0;

    console.log('🚀 Loading callback URL...\n');
    await page.goto(callbackUrl);

    // Wait for all effects and state updates
    await page.waitForTimeout(4000);

    // Step 5: Analyze results
    console.log('\n📍 STEP 5: Results Analysis\n');

    const finalUrl = page.url();
    console.log('📋 FINAL URL:', finalUrl);
    console.log('');

    // Parse URL
    const urlObj = new URL(finalUrl);
    console.log('📋 URL components:');
    console.log(`   - pathname: ${urlObj.pathname}`);
    console.log(`   - search: ${urlObj.search}`);
    console.log('');

    console.log('📋 URL parameters:');
    urlObj.searchParams.forEach((value, key) => {
      console.log(`   - ${key}: ${value}`);
    });
    console.log('');

    // Check for issues
    const hasSessionIdNull = finalUrl.includes('sessionId=null');
    const hasSessionIdParam = finalUrl.includes('sessionId=');
    const hasContinueParam = finalUrl.includes('continue=');
    const hasOAuthParams = finalUrl.includes('oauth2Status') || finalUrl.includes('credentialId');

    console.log('🔍 URL Analysis:');
    console.log(`   - Contains "sessionId=null": ${hasSessionIdNull} ${hasSessionIdNull ? '❌' : '✅'}`);
    console.log(`   - Contains "sessionId=": ${hasSessionIdParam} ${hasSessionIdParam ? '❌' : '✅'}`);
    console.log(`   - Contains "continue=": ${hasContinueParam} ${hasContinueParam ? '✅' : '❌'}`);
    console.log(`   - Contains OAuth params: ${hasOAuthParams} ${hasOAuthParams ? '❌ (should be cleaned)' : '✅'}`);
    console.log('');

    // Check context
    const finalSessionId = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || null;
    });
    console.log('📋 Final sessionId in context:', finalSessionId);

    // Check OAuth data
    const oauthData = await page.evaluate(() => {
      const ctx = (window as any).wizardContext;
      return ctx?.wizardData?.step6?.emailConfig?.oauth || null;
    });
    console.log('📋 OAuth data in wizardData:', JSON.stringify(oauthData, null, 2));
    console.log('');

    // Print relevant console logs
    console.log('📍 Console Logs During OAuth Processing:\n');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('OAuth') ||
      log.includes('IMMEDIATE') ||
      log.includes('sessionId') ||
      log.includes('SAVE') ||
      log.includes('URL')
    );

    if (relevantLogs.length > 0) {
      relevantLogs.forEach(log => console.log(`   ${log}`));
    } else {
      console.log('   (No relevant logs captured)');
    }
    console.log('');

    // Summary
    console.log('========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`SessionId used: ${sessionId}`);
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Problem found: ${hasSessionIdNull ? 'YES - sessionId=null in URL' : 'NO'}`);
    console.log(`OAuth data saved: ${oauthData?.connected ? 'YES' : 'NO'}`);
    console.log('========================================\n');

    // Assertions
    expect(hasSessionIdNull, 'URL should NOT contain sessionId=null').toBe(false);
    expect(hasSessionIdParam, 'URL should NOT contain sessionId= parameter').toBe(false);
    expect(hasContinueParam, 'URL should contain continue= parameter').toBe(true);
    expect(hasOAuthParams, 'OAuth params should be cleaned from URL').toBe(false);
  });
});
