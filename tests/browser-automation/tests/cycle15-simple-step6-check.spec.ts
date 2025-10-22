import { test, expect } from '@playwright/test';

test('Cycle 15 Simple: Check Step 6 UI on existing site', async ({ page }) => {
  test.setTimeout(120000);
  console.log('🔍 CYCLE 15 SIMPLE: CHECKING STEP 6 UI');
  console.log('Using existing site from previous Cycle 15 test');
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

    // Navigate to My Sites
    console.log('\n📍 Step 2: Navigate to My Sites...');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(2000);

    // Find most recent Cycle15 site
    console.log('\n🔍 Step 3: Looking for Cycle15 site...');
    const cycle15Site = await page.locator('text=/Cycle15_Step6_/').first();
    const siteCount = await cycle15Site.count();

    if (siteCount === 0) {
      console.log('❌ No Cycle15 site found - test cannot proceed');
      return;
    }

    const siteName = await cycle15Site.textContent();
    console.log(`✅ Found site: ${siteName}`);

    // Click Continue button
    const continueButton = await page.locator('a:has-text("Continue")').first();
    await continueButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked Continue');

    // Check current step
    const currentStep = await page.locator('h2').first().textContent();
    console.log(`📍 Current step: ${currentStep}`);

    // Navigate to Step 6 if not already there
    if (!currentStep?.includes('Fonctionnalités avancées')) {
      console.log('\n➡️ Step 4: Navigating to Step 6...');

      // Click Suivant multiple times if needed
      for (let i = 0; i < 5; i++) {
        const stepTitle = await page.locator('h2').first().textContent();
        console.log(`Current step: ${stepTitle}`);

        if (stepTitle?.includes('Fonctionnalités avancées')) {
          console.log('✅ Reached Step 6!');
          break;
        }

        const suivantButton = page.locator('button:has-text("Suivant")');
        const suivantCount = await suivantButton.count();

        if (suivantCount > 0) {
          const isEnabled = await suivantButton.first().isEnabled();
          if (isEnabled) {
            await suivantButton.first().click();
            await page.waitForTimeout(2000);
            console.log(`Clicked Suivant (attempt ${i + 1})`);
          } else {
            console.log('⚠️ Suivant button disabled');
            break;
          }
        } else {
          console.log('⚠️ No Suivant button found');
          break;
        }
      }
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/cycle15-step6-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved: /tmp/cycle15-step6-check.png');

    // Check for Step 6 Feature Cards UI
    console.log('\n🧪 TESTING STEP 6 FEATURE CARDS UI');
    console.log('='.repeat(80));

    const step6Title = await page.locator('h2:has-text("Fonctionnalités avancées")').count();
    console.log(`Step 6 Title: ${step6Title > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    if (step6Title === 0) {
      console.log('\n❌ Not on Step 6 - cannot test Feature Cards');
      const actualTitle = await page.locator('h2').first().textContent();
      console.log(`Current page: ${actualTitle}`);
      return;
    }

    // Test Feature Cards
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
    console.log(`📊 SUMMARY: Found ${totalFound}/9 Feature Card elements`);

    if (totalFound === 9) {
      console.log('🎉 SUCCESS! All Step 6 Feature Cards UI elements are present!');
    } else if (totalFound >= 5) {
      console.log('✅ PARTIAL: Most Feature Cards found, some missing');
    } else {
      console.log('❌ FAILURE: Feature Cards UI not showing correctly');
    }

    console.log('\n📸 Screenshot: /tmp/cycle15-step6-check.png');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    await page.screenshot({ path: '/tmp/cycle15-error.png', fullPage: true });
    console.log('📸 Error screenshot: /tmp/cycle15-error.png');
    throw error;
  }
});
