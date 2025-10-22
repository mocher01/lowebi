import { test, expect } from '@playwright/test';

test('Verify Step 6 Feature Cards UI - Using Existing Site', async ({ page }) => {
  test.setTimeout(120000);
  console.log('🔍 VERIFYING STEP 6 FEATURE CARDS UI');
  console.log('Using existing site: Cycle14b_V2.7_1759501855183');
  console.log('Session ID: wizard_1759501864736_kwf49b1b8');
  console.log('=' .repeat(80));

  try {
    // Login
    console.log('\n🔐 Step 1: Login...');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Logged in');

    // Navigate to existing wizard session
    console.log('\n📍 Step 2: Navigate to wizard session...');
    await page.goto('https://dev.lowebi.com/wizard?session=wizard_1759501864736_kwf49b1b8');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Take screenshot of current state
    await page.screenshot({ path: '/tmp/wizard-step-current.png', fullPage: true });
    console.log('📸 Screenshot 1: /tmp/wizard-step-current.png');

    // Try to navigate to Step 6
    console.log('\n🎯 Step 3: Navigate to Step 6...');

    // Try clicking Next button to reach Step 6
    for (let i = 0; i < 3; i++) {
      const pageTitle = await page.locator('h2').first().textContent();
      console.log(`Current page: ${pageTitle}`);

      if (pageTitle?.includes('Fonctionnalités avancées')) {
        console.log('✅ Already on Step 6!');
        break;
      }

      const nextButton = await page.locator('button:has-text("Suivant")').count();
      if (nextButton > 0) {
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(2000);
      }
    }

    await page.waitForTimeout(2000);

    // Take screenshot after navigation
    await page.screenshot({ path: '/tmp/wizard-step6-view.png', fullPage: true });
    console.log('📸 Screenshot 2: /tmp/wizard-step6-view.png');

    // Check for new Feature Cards components
    console.log('\n🧪 Step 4: Verify Feature Cards UI...');

    const emailCard = await page.locator('text=📧 Emails Automatiques').count();
    console.log(`📧 Email Card: ${emailCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const foundationBadge = await page.locator('text=FONDATION').count();
    console.log(`🏗️ Foundation Badge: ${foundationBadge > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const oauth2Radio = await page.locator('input[value="oauth2"]').count();
    console.log(`🔐 OAuth2 Radio: ${oauth2Radio > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const locodaiRadio = await page.locator('input[value="locodai-default"]').count();
    console.log(`📧 Locod.ai Radio: ${locodaiRadio > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const noFormRadio = await page.locator('input[value="no-form"]').count();
    console.log(`❌ No Form Radio: ${noFormRadio > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const n8nCard = await page.locator('text=🤖 Automatisation N8N').count();
    console.log(`🤖 N8N Card: ${n8nCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const analyticsCard = await page.locator('text=📊 Google Analytics').count();
    console.log(`📊 Analytics Card: ${analyticsCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const recaptchaCard = await page.locator('text=🛡️ Anti-Spam reCAPTCHA').count();
    console.log(`🛡️ reCAPTCHA Card: ${recaptchaCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const comingSoon = await page.locator('text=🚀 Bientôt Disponible').count();
    console.log(`🚀 Coming Soon: ${comingSoon > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    // Summary
    const totalFound = emailCard + foundationBadge + oauth2Radio + locodaiRadio + noFormRadio + n8nCard + analyticsCard + recaptchaCard + comingSoon;

    console.log('\n' + '='.repeat(80));
    console.log(`📊 SUMMARY: Found ${totalFound}/9 expected elements`);

    if (totalFound === 9) {
      console.log('🎉 SUCCESS! All Feature Cards UI elements are present!');
    } else if (totalFound > 0) {
      console.log('⚠️ PARTIAL: Some elements found, but not all');
    } else {
      console.log('❌ FAILURE: No new UI elements found - old Step 6 still showing');
    }

    console.log('\n📸 Screenshots saved:');
    console.log('  - /tmp/wizard-step-current.png (initial state)');
    console.log('  - /tmp/wizard-step6-view.png (Step 6 view)');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    await page.screenshot({ path: '/tmp/wizard-error.png', fullPage: true });
    console.log('📸 Error screenshot: /tmp/wizard-error.png');
    throw error;
  }
});
