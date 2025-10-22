import { test, expect } from '@playwright/test';

test.describe('Create New Site Flow Diagnosis', () => {
  test('should create completely fresh wizard session without step inheritance', async ({ page }) => {
    // Enable console logging
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        const text = msg.text();
        consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
      }
    });

    // Step 1: Login as existing user
    console.log('🔐 Step 1: Login as test user');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    
    // Wait for successful login redirect (could be dashboard or sites)
    await page.waitForURL((url) => url.pathname === '/dashboard' || url.pathname === '/sites', { timeout: 10000 });
    console.log('✅ Login successful - redirected to:', page.url());

    // Step 2: Go to My Sites
    console.log('📋 Step 2: Navigate to My Sites');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForLoadState('networkidle');
    
    // Check current wizard sessions before starting
    const initialLocalStorage = await page.evaluate(() => {
      const wizardKeys = Object.keys(localStorage).filter(key => key.includes('wizard'));
      const result: Record<string, string> = {};
      wizardKeys.forEach(key => {
        result[key] = localStorage.getItem(key) || '';
      });
      return result;
    });
    console.log('📊 Initial localStorage wizard keys:', JSON.stringify(initialLocalStorage, null, 2));

    // Step 3: Click Create New Site
    console.log('🆕 Step 3: Click Create New Site button');
    await page.click('a[href="/sites/create"]');
    await page.waitForURL('**/sites/create');
    console.log('✅ Redirected to selection page');

    // Step 4: Click Assistant Classique (with ?new=true)
    console.log('🎯 Step 4: Click Assistant Classique');
    const assistantLink = page.locator('a[href="/wizard?new=true"]');
    await expect(assistantLink).toBeVisible();
    await assistantLink.click();
    
    // Wait for wizard page to load
    await page.waitForURL('**/wizard?new=true');
    console.log('✅ Redirected to wizard with ?new=true parameter');

    // Step 5: Wait for all JavaScript to process
    console.log('⏱️ Step 5: Wait for wizard initialization');
    await page.waitForTimeout(1000); // Give time for async operations

    // Step 6: Check localStorage after ?new=true processing
    const afterNewLocalStorage = await page.evaluate(() => {
      const wizardKeys = Object.keys(localStorage).filter(key => key.includes('wizard'));
      const result: Record<string, string> = {};
      wizardKeys.forEach(key => {
        result[key] = localStorage.getItem(key) || '';
      });
      return result;
    });
    console.log('📊 localStorage after ?new=true:', JSON.stringify(afterNewLocalStorage, null, 2));

    // Step 7: Check current wizard state
    const wizardState = await page.evaluate(() => {
      // Find React component state through DOM or exposed globals
      return {
        currentURL: window.location.href,
        currentStep: (window as any).__WIZARD_DEBUG__?.currentStep || 'unknown',
        sessionId: (window as any).__WIZARD_DEBUG__?.sessionId || 'unknown',
        wizardData: (window as any).__WIZARD_DEBUG__?.wizardData || 'unknown'
      };
    });
    console.log('🔍 Current wizard state:', JSON.stringify(wizardState, null, 2));

    // Step 8: Check what step is actually displayed
    await page.waitForSelector('h1', { timeout: 10000 });
    const pageTitle = await page.textContent('h1');
    console.log('📄 Current page title:', pageTitle);

    // Check progress indicators
    const progressSteps = await page.$$eval('.wizard-progress *[class*="step"], .progress *[class*="step"], [class*="progress"] li, .step', (elements) => {
      return elements.map((el, index) => ({
        index,
        text: el.textContent?.trim(),
        classes: el.className,
        isActive: el.classList.contains('active') || el.classList.contains('current')
      }));
    });
    console.log('📊 Progress steps:', JSON.stringify(progressSteps, null, 2));

    // Step 9: Analyze console logs for session creation
    const sessionCreationLogs = consoleLogs.filter(log => 
      log.includes('NEW SESSION') || 
      log.includes('FRESH SESSION') || 
      log.includes('Loaded wizard session') ||
      log.includes('Cleared localStorage')
    );
    console.log('🔍 Session creation logs:');
    sessionCreationLogs.forEach(log => console.log(`  ${log}`));

    // Step 10: Check API calls made
    const apiCalls: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('wizard-sessions') || url.includes('/wizard')) {
        apiCalls.push(`${response.request().method()} ${url} -> ${response.status()}`);
        console.log(`🌐 API Call: ${response.request().method()} ${url} -> ${response.status()}`);
      }
    });

    // Final Analysis
    console.log('\n=== DIAGNOSIS RESULTS ===');
    console.log(`Expected: Start at Step 1 (Welcome) with fresh session`);
    console.log(`Actual Page Title: ${pageTitle}`);
    console.log(`localStorage wizard keys: ${Object.keys(afterNewLocalStorage).length}`);
    console.log(`Session creation logs: ${sessionCreationLogs.length} found`);
    
    // Assertions to verify correct behavior
    expect(pageTitle).toContain('Bienvenue'); // Should be on Welcome step
    expect(Object.keys(afterNewLocalStorage).length).toBeLessThanOrEqual(1); // Should only have new session ID
    expect(sessionCreationLogs.some(log => log.includes('COMPLETELY FRESH SESSION CREATED'))).toBe(true);
    
    // Screenshot for visual verification
    await page.screenshot({ path: 'create-new-site-diagnosis.png', fullPage: true });
    console.log('📸 Screenshot saved as create-new-site-diagnosis.png');
  });
});