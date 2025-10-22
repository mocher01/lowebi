import { test, expect } from '@playwright/test';

test('Cycle 15 Direct: Step 6 Feature Cards UI Only', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes timeout
  console.log('🔄 CYCLE 15 DIRECT: STEP 6 FEATURE CARDS UI TEST');
  console.log('Purpose: Test Step 6 Feature Cards UI directly without full wizard flow');
  console.log('Features tested:');
  console.log('  - Feature Card structure and visibility');
  console.log('  - 3 Email scenarios (OAuth2, Locod.ai, No Form)');
  console.log('  - Dynamic states based on email selection');
  console.log('  - GDPR consent form');
  console.log('  - Dependencies badges');
  console.log('Flow: Login → Existing Site → Navigate to Step 6 directly');
  console.log('=' .repeat(80));

  try {
    // ============================================================================
    // Login
    // ============================================================================

    console.log('\n🔐 Authentication...');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Login successful');

    // ============================================================================
    // Navigate to Sites and find or create a session
    // ============================================================================

    console.log('\n🏠 Navigate to sites...');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(2000);

    // Check if there are existing sites
    const siteCards = await page.locator('[data-testid="site-card"], .site-card, a[href*="/wizard"]').count();
    console.log(`📊 Found ${siteCards} sites`);

    if (siteCards > 0) {
      // Click on first site to continue wizard
      console.log('✅ Using existing site to test Step 6');
      await page.locator('[data-testid="site-card"], .site-card, a[href*="/wizard"]').first().click();
      await page.waitForTimeout(2000);
    } else {
      // Create new site if none exist
      console.log('➕ Creating new site for Step 6 test...');
      await page.click('text="Create New Site"');
      await page.waitForTimeout(2000);
      await page.click('a[href="/wizard?new=true"]');
      await page.waitForTimeout(3000);
      await page.locator('input[type="checkbox"]').first().check();
      await page.click('button:has-text("Commencer")');
      await page.waitForTimeout(2000);
    }

    // ============================================================================
    // Try to navigate directly to Step 6
    // ============================================================================

    console.log('\n🎯 Navigating to Step 6...');

    // Try clicking on step indicators if available
    const step6Indicator = await page.locator('[data-step="6"], button:has-text("6")').count();
    if (step6Indicator > 0) {
      await page.locator('[data-step="6"], button:has-text("6")').first().click();
      await page.waitForTimeout(2000);
    } else {
      // Navigate using "Suivant" buttons
      for (let i = 0; i < 10; i++) {
        const currentStep = await page.locator('h2, h1').first().textContent();
        console.log(`📍 Current step: ${currentStep}`);

        if (currentStep?.includes('Fonctionnalités avancées') || currentStep?.includes('Advanced Features') || currentStep?.includes('Step 6')) {
          console.log('✅ Reached Step 6!');
          break;
        }

        const suivantButton = await page.locator('button:has-text("Suivant")').count();
        if (suivantButton > 0) {
          await page.click('button:has-text("Suivant")');
          await page.waitForTimeout(2000);
        } else {
          console.log('⚠️ No "Suivant" button found, might be at final step');
          break;
        }
      }
    }

    await page.waitForTimeout(2000);

    // ============================================================================
    // Verify we're on Step 6
    // ============================================================================

    console.log('\n🧪 VERIFYING STEP 6 UI');
    console.log('='.repeat(50));

    const pageTitle = await page.locator('h2').first().textContent();
    console.log(`📋 Page title: ${pageTitle}`);

    const step6Title = await page.locator('h2:has-text("Fonctionnalités avancées")').count();
    if (step6Title === 0) {
      console.log('⚠️ Not on Step 6, taking screenshot...');
      await page.screenshot({ path: '/tmp/not-on-step6.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/not-on-step6.png');
      throw new Error('Could not navigate to Step 6');
    }

    expect(step6Title).toBeGreaterThan(0);
    console.log('✅ Confirmed on Step 6: Fonctionnalités avancées');

    // ============================================================================
    // TEST 1: Feature Card 1 - Email Configuration
    // ============================================================================

    console.log('\n🧪 TEST 1: Feature Card 1 - Email Configuration');
    console.log('-'.repeat(50));

    const emailCard = await page.locator('text=📧 Emails Automatiques').count();
    expect(emailCard).toBeGreaterThan(0);
    console.log('✅ Email Configuration card found');

    const foundationBadge = await page.locator('text=FONDATION').count();
    expect(foundationBadge).toBeGreaterThan(0);
    console.log('✅ FONDATION badge visible');

    // Check 3 radio options
    const oauth2Radio = await page.locator('input[value="oauth2"]').count();
    const locodaiRadio = await page.locator('input[value="locodai-default"]').count();
    const noFormRadio = await page.locator('input[value="no-form"]').count();

    expect(oauth2Radio).toBe(1);
    expect(locodaiRadio).toBe(1);
    expect(noFormRadio).toBe(1);
    console.log('✅ All 3 email scenarios available');

    // ============================================================================
    // TEST 2: Select OAuth2 and verify dynamic states
    // ============================================================================

    console.log('\n🧪 TEST 2: OAuth2 Selection');
    console.log('-'.repeat(50));

    await page.locator('input[value="oauth2"]').click();
    await page.waitForTimeout(1000);
    console.log('✅ Selected OAuth2');

    const googleButton = await page.locator('button:has-text("Connecter avec Google")').count();
    expect(googleButton).toBe(1);
    console.log('✅ "Connecter avec Google" button appears');

    // Check N8N becomes available
    const n8nCard = await page.locator('text=🤖 Automatisation N8N').count();
    expect(n8nCard).toBeGreaterThan(0);
    console.log('✅ N8N card visible');

    // ============================================================================
    // TEST 3: Select Locod.ai and verify GDPR
    // ============================================================================

    console.log('\n🧪 TEST 3: Locod.ai Selection + GDPR');
    console.log('-'.repeat(50));

    await page.locator('input[value="locodai-default"]').click();
    await page.waitForTimeout(1000);
    console.log('✅ Selected Locod.ai');

    const gdprConsent = await page.locator('text=Consentement GDPR requis').count();
    expect(gdprConsent).toBeGreaterThan(0);
    console.log('✅ GDPR consent form visible');

    const emailInput = await page.locator('input[type="email"][placeholder*="votre-email"]').count();
    expect(emailInput).toBe(1);
    console.log('✅ Business email input visible');

    // Fill and accept
    await page.fill('input[type="email"][placeholder*="votre-email"]', 'test-business@example.com');
    await page.locator('input[type="checkbox"]').last().click();
    await page.waitForTimeout(500);

    const consentAccepted = await page.locator('text=Consentement accepté').count();
    expect(consentAccepted).toBeGreaterThan(0);
    console.log('✅ GDPR consent accepted message visible');

    // ============================================================================
    // TEST 4: Select No Form and verify blocking
    // ============================================================================

    console.log('\n🧪 TEST 4: No Form Selection');
    console.log('-'.repeat(50));

    await page.locator('input[value="no-form"]').click();
    await page.waitForTimeout(1000);
    console.log('✅ Selected No Form');

    // Verify dependent cards show blocked state
    const blocked = await page.locator('text=pas de formulaire').count();
    expect(blocked).toBeGreaterThan(0);
    console.log('✅ Dependent features show blocked state');

    // ============================================================================
    // TEST 5: Other Feature Cards
    // ============================================================================

    console.log('\n🧪 TEST 5: Other Feature Cards');
    console.log('-'.repeat(50));

    const analyticsCard = await page.locator('text=📊 Google Analytics').count();
    expect(analyticsCard).toBeGreaterThan(0);
    console.log('✅ Analytics card found');

    const recaptchaCard = await page.locator('text=🛡️ Anti-Spam reCAPTCHA').count();
    expect(recaptchaCard).toBeGreaterThan(0);
    console.log('✅ reCAPTCHA card found');

    const comingSoonCard = await page.locator('text=🚀 Bientôt Disponible').count();
    expect(comingSoonCard).toBeGreaterThan(0);
    console.log('✅ Coming Soon card found');

    // ============================================================================
    // FINAL SUCCESS
    // ============================================================================

    console.log('\n✅ ALL TESTS PASSED');
    console.log('='.repeat(50));
    console.log('✅ Step 6 Feature Cards UI is working!');
    console.log('✅ All 3 email scenarios functional');
    console.log('✅ Dynamic states working correctly');
    console.log('✅ GDPR consent flow working');
    console.log('\n🎉 CYCLE 15 DIRECT TEST COMPLETE!');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error);

    // Take screenshot on failure
    try {
      await page.screenshot({ path: '/tmp/cycle15-failure.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/cycle15-failure.png');
    } catch (e) {
      console.log('Could not take screenshot');
    }

    throw error;
  }
});
