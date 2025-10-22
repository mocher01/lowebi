import { test, expect } from '@playwright/test';

test('COMPLETE Continue Button Test - Cycles 1-9 Full End-to-End Test', async ({ page }) => {
  console.log('🚀 COMPLETE CONTINUE BUTTON TEST - CYCLES 1-9');
  console.log('Following our debugging strategy exactly from Cycle 1');
  console.log('=' .repeat(70));

  try {
    // Generate timestamp for site name
    const timestamp = Date.now();
    const siteName = `Site_${timestamp}`;
    console.log(`🕐 Using timestamp site name: ${siteName}`);

    // ===========================================
    // CYCLE 1: AUTHENTICATION (Step 1)
    // ===========================================
    console.log('\n🔐 CYCLE 1: AUTHENTICATION');
    console.log('Testing: Login as test@example.com');

    await page.goto('https://dev.lowebi.com/login');
    await page.waitForTimeout(2000);

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');

    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Verify we're logged in (should be on dashboard or sites page)
    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      throw new Error('CYCLE 1 FAILED: Still on login page - authentication failed');
    }

    console.log(`✅ CYCLE 1 SUCCESS: Authenticated, now on: ${loginUrl}`);

    // ===========================================
    // CYCLE 2: NAVIGATE TO MY SITES (Steps 1+2)
    // ===========================================
    console.log('\n🏠 CYCLE 2: NAVIGATE TO MY SITES');
    console.log('Testing: Go to My Sites page and verify existing sites');

    // Navigate to My Sites if not already there
    if (!loginUrl.includes('/sites')) {
      await page.goto('https://dev.lowebi.com/sites');
      await page.waitForTimeout(3000);
    }

    // Verify we're on My Sites page
    const sitesUrl = page.url();
    if (!sitesUrl.includes('/sites')) {
      throw new Error(`CYCLE 2 FAILED: Expected /sites page, got: ${sitesUrl}`);
    }

    // Check if sites are displayed
    const tableExists = await page.locator('table').count() > 0;
    if (!tableExists) {
      throw new Error('CYCLE 2 FAILED: Sites table not found');
    }

    const siteCount = await page.locator('table tbody tr').count();
    console.log(`✅ CYCLE 2 SUCCESS: On My Sites page with ${siteCount} existing sites`);

    // ===========================================
    // CYCLE 3: CREATE NEW SITE (Steps 1+2+3)
    // ===========================================
    console.log('\n➕ CYCLE 3: CREATE NEW SITE');
    console.log('Testing: Click Create New Site and start wizard');

    // Click Create New Site button
    const createButton = page.locator('text="Create New Site"');
    if (await createButton.count() === 0) {
      throw new Error('CYCLE 3 FAILED: "Create New Site" button not found');
    }

    await createButton.click();
    await page.waitForTimeout(3000);

    // Should be on sites/create page
    const createUrl = page.url();
    if (!createUrl.includes('/sites/create')) {
      throw new Error(`CYCLE 3 FAILED: Expected /sites/create, got: ${createUrl}`);
    }

    // Click "Commencer" button in Assistant Classique section
    const commencerButton = page.locator('a[href="/wizard?new=true"]');
    if (await commencerButton.count() === 0) {
      throw new Error('CYCLE 3 FAILED: "Commencer" button not found');
    }

    await commencerButton.click();
    await page.waitForTimeout(5000);

    // Should be in wizard
    const wizardUrl = page.url();
    if (!wizardUrl.includes('/wizard')) {
      throw new Error(`CYCLE 3 FAILED: Expected /wizard, got: ${wizardUrl}`);
    }

    console.log(`✅ CYCLE 3 SUCCESS: Started wizard at: ${wizardUrl}`);

    // ===========================================
    // CYCLE 4: COMPLETE STEPS 1-3 (Steps 1+2+3+4)
    // ===========================================
    console.log('\n📋 CYCLE 4: COMPLETE WIZARD STEPS 1-3');
    console.log('Testing: Complete Bienvenue, Modèle, and Informations steps');

    // Step 1: Bienvenue (Welcome) - Check agreement checkbox and click Commencer
    console.log('  📍 Step 1: Completing "Bienvenue" (Welcome)...');

    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.count() === 0) {
      throw new Error('CYCLE 4 FAILED: Welcome step checkbox not found');
    }

    await checkbox.check();
    await page.waitForTimeout(1000);

    const commencerBtn = page.locator('button:has-text("Commencer")');
    if (await commencerBtn.count() === 0) {
      throw new Error('CYCLE 4 FAILED: "Commencer" button not found in Step 1');
    }

    await commencerBtn.click();
    await page.waitForTimeout(4000);

    // Step 2: Modèle (Template) - Click Suivant
    console.log('  📍 Step 2: Completing "Modèle" (Template)...');

    let suivantBtn = page.locator('button:has-text("Suivant")');
    if (await suivantBtn.count() === 0) {
      throw new Error('CYCLE 4 FAILED: "Suivant" button not found in Step 2');
    }

    await suivantBtn.click();
    await page.waitForTimeout(4000);

    // Step 3: Informations (Business Info) - Fill site name and continue
    console.log('  📍 Step 3: Completing "Informations" (Business Info)...');

    // Verify we're on Informations step
    const stepTitle = await page.textContent('h2').catch(() => 'Unknown');
    if (!stepTitle.includes('Informations')) {
      console.log(`⚠️ Expected "Informations" step, got: "${stepTitle}"`);
    }

    // Fill in the site name with our timestamp
    const siteNameField = page.getByPlaceholder('Mon Entreprise');
    if (await siteNameField.count() === 0) {
      throw new Error('CYCLE 4 FAILED: Site name field not found');
    }

    await siteNameField.clear();
    await siteNameField.fill(siteName);
    await siteNameField.dispatchEvent('input');
    await siteNameField.dispatchEvent('change');
    await siteNameField.blur();
    await page.waitForTimeout(2000);

    console.log(`  ✏️ Set site name to: ${siteName}`);

    console.log(`✅ CYCLE 4 SUCCESS: Completed Steps 1-3, ready for Step 4`);

    // ===========================================
    // CYCLE 5: REACH STEP 4 CONTENU (Steps 1+2+3+4+5)
    // ===========================================
    console.log('\n📝 CYCLE 5: REACH STEP 4 "CONTENU"');
    console.log('Testing: Navigate to Step 4 Contenu');

    // Click Suivant to go to Step 4
    suivantBtn = page.locator('button:has-text("Suivant")');
    if (await suivantBtn.count() === 0) {
      throw new Error('CYCLE 5 FAILED: "Suivant" button not found in Step 3');
    }

    await suivantBtn.click();
    await page.waitForTimeout(4000);

    // Verify we're on Step 4 "Contenu"
    const step4Title = await page.textContent('h2').catch(() => 'Unknown');
    if (!step4Title.includes('Contenu')) {
      throw new Error(`CYCLE 5 FAILED: Expected Step 4 "Contenu", got: "${step4Title}"`);
    }

    console.log(`✅ CYCLE 5 SUCCESS: Reached Step 4: ${step4Title}`);

    // ===========================================
    // CYCLE 6: VERIFY ON STEP 4 (Steps 1+2+3+4+5+6)
    // ===========================================
    console.log('\n✅ CYCLE 6: VERIFY WE ARE ON STEP 4 CONTENU');
    console.log('Testing: Confirm we are exactly on Step 4 with correct content');

    // Double-check we're on the right step
    const contentTitle = await page.textContent('h2').catch(() => 'Unknown');
    if (!contentTitle.includes('Contenu')) {
      throw new Error(`CYCLE 6 FAILED: Not on Contenu step, got: "${contentTitle}"`);
    }

    // Check for Quitter button (should be available to exit)
    const quitterBtn = page.locator('button:has-text("Quitter")');
    if (await quitterBtn.count() === 0) {
      throw new Error('CYCLE 6 FAILED: "Quitter" button not found on Step 4');
    }

    console.log(`✅ CYCLE 6 SUCCESS: Confirmed on Step 4 "${contentTitle}", Quitter button available`);

    // ===========================================
    // CYCLE 7: EXIT VIA QUITTER (Steps 1+2+3+4+5+6+7)
    // ===========================================
    console.log('\n🚪 CYCLE 7: EXIT VIA QUITTER BUTTON');
    console.log('Testing: Click Quitter to save progress and return to My Sites');

    // Click Quitter button
    await quitterBtn.click();
    await page.waitForTimeout(4000);

    // Should be redirected to My Sites
    const afterQuitUrl = page.url();
    if (!afterQuitUrl.includes('/sites')) {
      throw new Error(`CYCLE 7 FAILED: Expected /sites page, got: ${afterQuitUrl}`);
    }

    console.log(`✅ CYCLE 7 SUCCESS: Exited via Quitter, back on My Sites: ${afterQuitUrl}`);

    // ===========================================
    // CYCLE 8: VERIFY MY SITES DISPLAY (Steps 1+2+3+4+5+6+7+8)
    // ===========================================
    console.log('\n🔍 CYCLE 8: VERIFY MY SITES DISPLAY');
    console.log('Testing: Confirm timestamped site appears with correct step display');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if our timestamped site appears
    const pageContent = await page.textContent('body');
    if (!pageContent.includes(siteName)) {
      throw new Error(`CYCLE 8 FAILED: Timestamped site '${siteName}' not found in My Sites`);
    }

    console.log(`✅ Found timestamped site '${siteName}' in My Sites`);

    // Find our site in the table and verify details
    const tableRows = await page.locator('table tbody tr').count();
    let foundSiteDetails = false;

    for (let i = 0; i < tableRows; i++) {
      const row = page.locator('table tbody tr').nth(i);
      const rowSiteName = await row.locator('td').nth(0).textContent().catch(() => 'N/A');

      if (rowSiteName.includes(siteName)) {
        const progress = await row.locator('td').nth(1).textContent().catch(() => 'N/A');
        const businessType = await row.locator('td').nth(2).textContent().catch(() => 'N/A');
        const currentStep = await row.locator('td').nth(3).textContent().catch(() => 'N/A');
        const lastUpdated = await row.locator('td').nth(4).textContent().catch(() => 'N/A');

        console.log(`📊 Site Details Found:`);
        console.log(`     Name: ${rowSiteName}`);
        console.log(`     Progress: ${progress}`);
        console.log(`     Business Type: ${businessType}`);
        console.log(`     Current Step: ${currentStep}`);
        console.log(`     Last Updated: ${lastUpdated}`);

        // CRITICAL: Step should show "Contenu" not "3"
        if (currentStep !== 'Contenu') {
          throw new Error(`CYCLE 8 FAILED: Expected step "Contenu", got: "${currentStep}"`);
        }

        // Check for Continue button
        const continueButton = await row.locator('td').nth(5).locator('text="Continue"').count();
        if (continueButton === 0) {
          throw new Error('CYCLE 8 FAILED: Continue button not found');
        }

        foundSiteDetails = true;
        break;
      }
    }

    if (!foundSiteDetails) {
      throw new Error(`CYCLE 8 FAILED: Could not find details for site '${siteName}'`);
    }

    console.log(`✅ CYCLE 8 SUCCESS: Site displays correctly with "Contenu" step and Continue button`);

    // ===========================================
    // CYCLE 9: TEST CONTINUE BUTTON (Steps 1+2+3+4+5+6+7+8+9)
    // ===========================================
    console.log('\n🎯 CYCLE 9: TEST CONTINUE BUTTON - THE ULTIMATE TEST!');
    console.log('Testing: Click Continue button and verify we land on Step 4 Contenu');

    // Find our site again and click Continue
    let continueClicked = false;
    const updatedRows = await page.locator('table tbody tr').count();

    for (let i = 0; i < updatedRows; i++) {
      const row = page.locator('table tbody tr').nth(i);
      const rowSiteName = await row.locator('td').nth(0).textContent().catch(() => 'N/A');

      if (rowSiteName.includes(siteName)) {
        console.log(`🎯 Clicking Continue button for: ${rowSiteName}`);

        const continueButton = row.locator('td').nth(5).locator('text="Continue"');
        await continueButton.click();
        continueClicked = true;
        break;
      }
    }

    if (!continueClicked) {
      throw new Error('CYCLE 9 FAILED: Could not click Continue button');
    }

    // Wait for navigation
    await page.waitForTimeout(6000);

    // ULTIMATE VERIFICATION: Check where we landed
    const finalUrl = page.url();
    console.log(`📍 Final URL after Continue: ${finalUrl}`);

    // Should be on wizard page
    if (!finalUrl.includes('/wizard')) {
      throw new Error(`CYCLE 9 FAILED: Expected /wizard page, got: ${finalUrl}`);
    }

    // Check what step we're on
    await page.waitForTimeout(3000); // Let wizard load
    const finalStepTitle = await page.textContent('h2').catch(() => '');
    console.log(`📍 Final Step Title: "${finalStepTitle}"`);

    // CRITICAL TEST: Should be on Step 4 "Contenu", NOT Step 1 "Bienvenue"
    if (finalStepTitle.includes('Contenu')) {
      console.log('🎉 ULTIMATE SUCCESS: Landed on Step 4 "Contenu" - Continue button works!');
    } else if (finalStepTitle.includes('Bienvenue') || finalStepTitle.includes('Bienvenu')) {
      throw new Error('CYCLE 9 CRITICAL FAILURE: Landed on Step 1 "Bienvenue" - Continue button is BROKEN!');
    } else {
      // If title is unclear, check page content
      const finalPageContent = await page.textContent('body');
      console.log('🔍 Checking page content for step identification...');

      if (finalPageContent.includes('Contenu')) {
        console.log('🎉 SUCCESS: Page contains "Contenu" - Continue button works!');
      } else if (finalPageContent.includes('Bienvenue')) {
        throw new Error('CYCLE 9 CRITICAL FAILURE: Page contains "Bienvenue" - Continue button defaults to Step 1!');
      } else {
        throw new Error(`CYCLE 9 UNCLEAR: Cannot determine step from title "${finalStepTitle}"`);
      }
    }

    // Check URL parameters
    const finalUrlObj = new URL(finalUrl);
    const continueParam = finalUrlObj.searchParams.get('continue');
    const stepParam = finalUrlObj.searchParams.get('step');

    console.log(`🔍 URL Parameters: continue=${continueParam}, step=${stepParam}`);

    console.log('\n🏆 COMPLETE TEST SUMMARY:');
    console.log('✅ CYCLE 1: Authentication - SUCCESS');
    console.log('✅ CYCLE 2: Navigate to My Sites - SUCCESS');
    console.log('✅ CYCLE 3: Create New Site - SUCCESS');
    console.log('✅ CYCLE 4: Complete Steps 1-3 - SUCCESS');
    console.log('✅ CYCLE 5: Reach Step 4 Contenu - SUCCESS');
    console.log('✅ CYCLE 6: Verify on Step 4 - SUCCESS');
    console.log('✅ CYCLE 7: Exit via Quitter - SUCCESS');
    console.log('✅ CYCLE 8: Verify My Sites Display - SUCCESS');
    console.log('✅ CYCLE 9: Test Continue Button - SUCCESS');

    console.log('\n🎉 COMPLETE CONTINUE BUTTON TEST PASSED!');
    console.log('🎯 Continue button correctly takes users to the exact step where they left off!');

  } catch (error) {
    console.error(`❌ COMPLETE CONTINUE BUTTON TEST FAILED: ${error.message}`);
    console.error('💥 This indicates the Continue button functionality is BROKEN!');
    throw error;
  }
});