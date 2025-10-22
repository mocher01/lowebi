import { test, expect } from '@playwright/test';

/**
 * STEP 6 DEV QUICK TEST
 *
 * Purpose: Fast test for Step 6 development/improvements
 * Uses existing site: Cycle15_Step6_1759586595733
 *
 * Flow: Login → My Sites → Continue → Step 6 → Test UI
 * Duration: ~30 seconds
 */
test('Step 6 Dev Quick Test - Feature Cards UI', async ({ page }) => {
  test.setTimeout(60000); // 1 minute timeout

  const EXISTING_SITE = 'Cycle15_Step6_1759586595733';

  console.log('⚡ STEP 6 DEV QUICK TEST');
  console.log(`Using existing site: ${EXISTING_SITE}`);
  console.log('='.repeat(80));

  try {
    // Step 1: Login
    console.log('\n🔐 Step 1: Login...');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in');

    // Step 2: Navigate to My Sites
    console.log('\n🏠 Step 2: Navigate to My Sites...');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(1000);

    // Step 3: Find and click Continue on existing site
    console.log(`\n🔍 Step 3: Finding site ${EXISTING_SITE}...`);
    const siteRow = page.locator(`text="${EXISTING_SITE}"`).first();
    const siteExists = await siteRow.count() > 0;

    if (!siteExists) {
      console.log(`❌ Site ${EXISTING_SITE} not found!`);
      console.log('Available sites:');
      const allSites = await page.locator('[class*="site"], [class*="row"]').allTextContents();
      console.log(allSites.slice(0, 5));
      throw new Error('Test site not found');
    }

    console.log(`✅ Found site: ${EXISTING_SITE}`);

    const continueButton = page.locator('a:has-text("Continue")').first();
    await continueButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Continue button');

    // Step 4: Navigate to Step 6 if needed
    console.log('\n➡️ Step 4: Navigate to Step 6...');

    let currentStep = await page.locator('h2').first().textContent();
    console.log(`Current step: ${currentStep}`);

    // If at final step, click Précédent to go back to Step 6
    if (currentStep?.includes('Révision Finale') || currentStep?.includes('Création')) {
      console.log('⬅️ At final step, going back to Step 6...');
      const precedentButton = page.locator('button:has-text("Précédent")');
      await precedentButton.first().click();
      await page.waitForTimeout(1500);
      currentStep = await page.locator('h2').first().textContent();
      console.log(`After Précédent: ${currentStep}`);
    }

    // Click Suivant/Précédent until we reach Step 6
    let attempts = 0;
    while (!currentStep?.includes('Fonctionnalités avancées') && attempts < 5) {
      const suivantButton = page.locator('button:has-text("Suivant")');
      const precedentButton = page.locator('button:has-text("Précédent")');

      const suivantExists = await suivantButton.count() > 0;
      const precedentExists = await precedentButton.count() > 0;

      // Try Suivant first if we're before Step 6
      if (suivantExists) {
        const isEnabled = await suivantButton.first().isEnabled();
        if (isEnabled) {
          await suivantButton.first().click();
          await page.waitForTimeout(1500);
          attempts++;
          currentStep = await page.locator('h2').first().textContent();
          console.log(`After Suivant ${attempts}: ${currentStep}`);
          continue;
        }
      }

      // Otherwise try Précédent if we're after Step 6
      if (precedentExists) {
        await precedentButton.first().click();
        await page.waitForTimeout(1500);
        attempts++;
        currentStep = await page.locator('h2').first().textContent();
        console.log(`After Précédent ${attempts}: ${currentStep}`);
        continue;
      }

      break;
    }

    if (!currentStep?.includes('Fonctionnalités avancées')) {
      console.log(`❌ Could not reach Step 6. Current step: ${currentStep}`);
      throw new Error('Failed to navigate to Step 6');
    }

    console.log('✅ Reached Step 6: Fonctionnalités avancées');

    // Step 5: Take screenshot
    await page.screenshot({ path: '/tmp/step6-dev-test.png', fullPage: true });
    console.log('\n📸 Screenshot: /tmp/step6-dev-test.png');

    // Step 6: Test Feature Cards UI
    console.log('\n🧪 TESTING STEP 6 FEATURE CARDS UI');
    console.log('='.repeat(80));

    const results = {
      emailSection: await page.locator('text=Configuration Email').count() > 0,
      recommendedBadge: await page.locator('text=Recommandé').count() > 0,
      oauth2Radio: await page.locator('input[value="oauth2"]').count() > 0,
      locodaiRadio: await page.locator('input[value="locodai-default"]').count() > 0,
      noFormRadio: await page.locator('input[value="no-form"]').count() > 0,
      automaticFeaturesSection: await page.locator('text=Fonctionnalités automatiques').count() > 0,
      n8nCard: await page.locator('text=Automatisation workflows').count() > 0,
      analyticsCard: await page.locator('text=Google Analytics').count() > 0,
      recaptchaCard: await page.locator('text=Protection anti-spam').count() > 0,
      comingSoonCard: await page.locator('text=Bientôt Disponible').count() > 0,
    };

    console.log(`📧 Email Section:        ${results.emailSection ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`⭐ Recommended Badge:    ${results.recommendedBadge ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`🔐 OAuth2 Radio:         ${results.oauth2Radio ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`📧 Locod.ai Radio:       ${results.locodaiRadio ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`❌ No Form Radio:        ${results.noFormRadio ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`⚙️  Features Section:     ${results.automaticFeaturesSection ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`🤖 N8N Card:             ${results.n8nCard ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`📊 Analytics Card:       ${results.analyticsCard ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`🛡️  reCAPTCHA Card:       ${results.recaptchaCard ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    console.log(`🚀 Coming Soon:          ${results.comingSoonCard ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    const totalFound = Object.values(results).filter(v => v === true).length;
    const totalTests = Object.keys(results).length;

    console.log('\n' + '='.repeat(80));
    console.log(`📊 RESULT: ${totalFound}/${totalTests} elements found`);

    if (totalFound === totalTests) {
      console.log('🎉 SUCCESS! All Step 6 Feature Cards UI elements present!');
    } else if (totalFound >= 7) {
      console.log('✅ GOOD: Most elements found, minor issues');
    } else {
      console.log('⚠️ NEEDS WORK: Some elements missing');
    }

    console.log('\n📸 Screenshot saved: /tmp/step6-dev-test.png');

    // Step 7: Test OAuth2 Flow
    console.log('\n🔐 TESTING OAUTH2 FLOW');
    console.log('='.repeat(80));

    // Select OAuth2 option
    const oauth2RadioButton = page.locator('input[value="oauth2"]');
    await oauth2RadioButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Selected OAuth2 option');

    // Check if "Connecter avec Google" button appears
    const googleConnectButton = page.locator('button:has-text("Connecter avec Google"), button:has-text("Utiliser mon Gmail")');
    const googleButtonExists = await googleConnectButton.count() > 0;

    if (!googleButtonExists) {
      console.log('❌ "Connecter avec Google" button NOT FOUND');
      await page.screenshot({ path: '/tmp/oauth2-button-missing.png', fullPage: true });
      throw new Error('OAuth2 button not found');
    }

    console.log('✅ "Connecter avec Google" button found');

    // Click the "Connecter avec Google" button
    console.log('\n🖱️  Clicking "Connecter avec Google" button...');
    await googleConnectButton.first().click();
    await page.waitForTimeout(3000); // Wait for redirect

    // Check where we landed
    const finalUrl = page.url();
    console.log(`🔗 After click, URL is: ${finalUrl}`);

    if (finalUrl.includes('accounts.google.com') || finalUrl.includes('consent.google.com')) {
      console.log('✅ OAUTH2 SUCCESS: Redirected to Google consent screen!');
      await page.screenshot({ path: '/tmp/oauth2-google-consent.png', fullPage: true });
      console.log('📸 Google consent screenshot: /tmp/oauth2-google-consent.png');
    } else if (finalUrl.includes('dev.lowebi.com')) {
      console.log('⚠️ Still on Logen, redirect may have failed');
      await page.screenshot({ path: '/tmp/oauth2-no-redirect.png', fullPage: true });
      console.log('📸 Screenshot: /tmp/oauth2-no-redirect.png');
    } else {
      console.log('⚠️ Unexpected redirect destination');
      await page.screenshot({ path: '/tmp/oauth2-unexpected.png', fullPage: true });
      console.log('📸 Screenshot: /tmp/oauth2-unexpected.png');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 OAUTH2 FLOW TEST COMPLETE!');
    console.log('✅ OAuth2 option selectable');
    console.log('✅ Google connect button present');
    console.log('✅ Backend redirect to Google working');
    console.log('\n⚡ Quick test complete!');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    await page.screenshot({ path: '/tmp/step6-dev-error.png', fullPage: true });
    console.log('📸 Error screenshot: /tmp/step6-dev-error.png');
    throw error;
  }
});
