import { test, expect, Page } from '@playwright/test';

/**
 * DEBUG TEST: OAuth Flow URL Issue
 *
 * This test debugs why the URL shows sessionId=null after OAuth callback
 * It captures all console logs and traces the exact execution flow
 */

test.describe('OAuth Flow Debug', () => {
  let page: Page;
  const consoleLogs: any[] = [];
  const networkLogs: any[] = [];

  test.beforeEach(async ({ page: p }) => {
    page = p;
    consoleLogs.length = 0;
    networkLogs.length = 0;

    // Capture ALL console logs
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
      console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
    });

    // Capture network requests
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });

    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    });
  });

  test('Debug OAuth flow - Capture URL changes', async () => {
    console.log('\n========================================');
    console.log('🔍 STARTING OAUTH FLOW DEBUG TEST');
    console.log('========================================\n');

    // Step 1: Login
    console.log('📍 STEP 1: Login');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sites', { timeout: 10000 });
    console.log('✅ Login successful\n');

    // Step 2: Start new wizard
    console.log('📍 STEP 2: Start new wizard');
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForTimeout(2000);
    const initialUrl = page.url();
    console.log('📋 Initial wizard URL:', initialUrl);

    // Extract sessionId from URL
    const urlParams = new URLSearchParams(new URL(initialUrl).search);
    const continueParam = urlParams.get('continue');
    const sessionIdParam = urlParams.get('sessionId');
    console.log('📋 URL params - continue:', continueParam, 'sessionId:', sessionIdParam);
    console.log('');

    // Step 3: Navigate through wizard to step 6
    console.log('📍 STEP 3: Navigate to Step 6 (Advanced Features)');

    // Accept terms (Step 1)
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("Commencer")');
    await page.waitForTimeout(1000);

    // Select template (Step 2)
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(1000);

    // Business info (Step 3)
    await page.fill('input[placeholder*="nom"]', 'Test OAuth Debug');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(1000);

    // Content (Step 4)
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(1000);

    // Images (Step 5)
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(2000);

    console.log('✅ Reached Step 6 (Advanced Features)\n');

    const step6Url = page.url();
    console.log('📋 Step 6 URL:', step6Url);

    // Step 4: Find and click OAuth button
    console.log('📍 STEP 4: Looking for OAuth button');
    const oauthButton = await page.locator('button:has-text("Connecter avec Google")').first();
    const isVisible = await oauthButton.isVisible();
    console.log('📋 OAuth button visible:', isVisible);

    if (!isVisible) {
      // Need to select OAuth scenario first
      console.log('📋 Selecting OAuth2 radio option');
      await page.click('input[value="oauth2"]');
      await page.waitForTimeout(1000);
    }

    // Capture the current URL and sessionId before OAuth
    const preOAuthUrl = page.url();
    console.log('📋 Pre-OAuth URL:', preOAuthUrl);

    // Get sessionId from context
    const sessionIdBefore = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || null;
    });
    console.log('📋 SessionId in context before OAuth:', sessionIdBefore);
    console.log('');

    // Step 5: Click OAuth button and intercept redirect
    console.log('📍 STEP 5: Clicking OAuth button');
    console.log('⚠️  We will NOT actually redirect to Google');
    console.log('⚠️  Instead, we will simulate the OAuth callback directly\n');

    // Don't actually click - we'll simulate the callback
    // await page.click('button:has-text("Connecter avec Google")');

    // Step 6: Simulate OAuth callback
    console.log('📍 STEP 6: Simulating OAuth callback');
    const mockCredentialId = 'mock-credential-123';
    const mockEmail = 'testuser@example.com';
    const callbackUrl = `https://dev.lowebi.com/wizard?continue=${sessionIdBefore}&step=5&oauth2Status=success&credentialId=${mockCredentialId}&email=${encodeURIComponent(mockEmail)}`;

    console.log('📋 Simulating callback to:', callbackUrl);
    console.log('');

    // Clear console logs to see only OAuth processing
    consoleLogs.length = 0;

    await page.goto(callbackUrl);
    await page.waitForTimeout(3000); // Wait for all effects to run

    // Step 7: Capture final state
    console.log('📍 STEP 7: Capturing final state after OAuth callback\n');

    const finalUrl = page.url();
    console.log('📋 Final URL:', finalUrl);

    const finalUrlObj = new URL(finalUrl);
    const finalParams = new URLSearchParams(finalUrlObj.search);
    console.log('📋 Final URL params:');
    finalParams.forEach((value, key) => {
      console.log(`   - ${key}: ${value}`);
    });
    console.log('');

    // Check for sessionId=null
    const hasSessionIdNull = finalUrl.includes('sessionId=null');
    console.log('🚨 URL contains "sessionId=null":', hasSessionIdNull);
    console.log('');

    // Get sessionId from context after
    const sessionIdAfter = await page.evaluate(() => {
      return (window as any).wizardContext?.sessionId || null;
    });
    console.log('📋 SessionId in context after OAuth:', sessionIdAfter);
    console.log('');

    // Check wizardData
    const wizardData = await page.evaluate(() => {
      return (window as any).wizardContext?.wizardData || null;
    });
    console.log('📋 OAuth data in wizardData:');
    console.log(JSON.stringify(wizardData?.step6?.emailConfig?.oauth || {}, null, 2));
    console.log('');

    // Step 8: Print relevant console logs
    console.log('📍 STEP 8: Console logs during OAuth processing\n');
    const oauthLogs = consoleLogs.filter(log =>
      log.text.includes('OAuth') ||
      log.text.includes('sessionId') ||
      log.text.includes('IMMEDIATE') ||
      log.text.includes('SAVE')
    );

    console.log('🔍 Filtered OAuth-related logs:');
    oauthLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    console.log('');

    // Step 9: Analysis
    console.log('📍 STEP 9: Analysis\n');
    console.log('🔍 Key findings:');
    console.log(`   1. SessionId before OAuth: ${sessionIdBefore}`);
    console.log(`   2. SessionId after OAuth: ${sessionIdAfter}`);
    console.log(`   3. Final URL: ${finalUrl}`);
    console.log(`   4. URL has sessionId=null: ${hasSessionIdNull}`);
    console.log(`   5. OAuth data saved: ${!!wizardData?.step6?.emailConfig?.oauth?.connected}`);
    console.log('');

    // Save full logs to file
    const fs = require('fs');
    const logFile = '/var/apps/logen/oauth-debug-logs.json';
    fs.writeFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      sessionIdBefore,
      sessionIdAfter,
      finalUrl,
      hasSessionIdNull,
      consoleLogs: oauthLogs,
      networkLogs: networkLogs.filter(n => n.url.includes('wizard') || n.url.includes('oauth'))
    }, null, 2));
    console.log(`📁 Full logs saved to: ${logFile}`);
    console.log('');

    console.log('========================================');
    console.log('🏁 OAUTH FLOW DEBUG TEST COMPLETE');
    console.log('========================================\n');

    // Assertions
    expect(hasSessionIdNull).toBe(false);
    expect(sessionIdAfter).toBeTruthy();
    expect(finalUrl).toContain('continue=');
    expect(finalUrl).not.toContain('oauth2Status');
  });
});
