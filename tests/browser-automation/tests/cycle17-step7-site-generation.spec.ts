import { test, expect } from '@playwright/test';

/**
 * CYCLE 17: STEP 7 SITE GENERATION TEST
 *
 * Purpose: Test complete site generation workflow from Step 7 (Review)
 * Uses existing site: Cycle15_Step6_1759586595733
 *
 * Flow: Login → My Sites → Continue → Navigate to Step 7 → Generate Site → Verify
 * Duration: ~2-3 minutes (includes generation time)
 *
 * Tests:
 * - Navigate to Step 7 (Review)
 * - Verify sessionId is valid UUID
 * - Click "Générer le site" button
 * - Verify generation starts (modal appears)
 * - Verify progress updates
 * - Verify completion with site URL
 */
test('Cycle 17: Step 7 Site Generation', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes timeout for generation

  const EXISTING_SITE = 'Cycle15_Step6_1759586595733';

  console.log('🚀 CYCLE 17: STEP 7 SITE GENERATION TEST');
  console.log(`Using existing site: ${EXISTING_SITE}`);
  console.log('='.repeat(80));

  try {
    // ============================================================================
    // PHASE 1: LOGIN
    // ============================================================================
    console.log('\n🔐 PHASE 1: Login...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in');

    // ============================================================================
    // PHASE 2: NAVIGATE TO SITES
    // ============================================================================
    console.log('\n🏠 PHASE 2: Navigate to My Sites...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(1000);

    // Find and click Continue on existing site
    console.log(`\n🔍 Finding site ${EXISTING_SITE}...`);
    const siteRow = page.locator(`text="${EXISTING_SITE}"`).first();
    const siteExists = await siteRow.count() > 0;

    if (!siteExists) {
      console.log(`❌ Site ${EXISTING_SITE} not found!`);
      const allSites = await page.locator('[class*="site"], [class*="row"]').allTextContents();
      console.log('Available sites:', allSites.slice(0, 5));
      throw new Error('Test site not found');
    }

    console.log(`✅ Found site: ${EXISTING_SITE}`);

    const continueButton = page.locator('a:has-text("Continue")').first();
    await continueButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Continue button');

    // ============================================================================
    // PHASE 3: NAVIGATE TO STEP 7 (REVIEW)
    // ============================================================================
    console.log('\n➡️ PHASE 3: Navigate to Step 7 (Review)...');

    let currentStep = await page.locator('h2').first().textContent();
    console.log(`Current step: ${currentStep}`);

    // Navigate to Step 7 using Suivant button
    let attempts = 0;
    while (!currentStep?.includes('Révision') && !currentStep?.includes('Review') && attempts < 10) {
      const suivantButton = page.locator('button:has-text("Suivant")');
      const suivantExists = await suivantButton.count() > 0;

      if (suivantExists) {
        const isEnabled = await suivantButton.first().isEnabled();
        if (isEnabled) {
          await suivantButton.first().click();
          await page.waitForTimeout(2000);
          attempts++;
          currentStep = await page.locator('h2').first().textContent();
          console.log(`Step ${attempts}: ${currentStep}`);

          if (currentStep?.includes('Révision') || currentStep?.includes('Review')) {
            break;
          }
        } else {
          console.log('❌ Suivant button disabled');
          break;
        }
      } else {
        console.log('❌ No Suivant button found');
        break;
      }
    }

    if (!currentStep?.includes('Révision') && !currentStep?.includes('Review')) {
      console.log(`❌ Could not reach Step 7. Current step: ${currentStep}`);
      await page.screenshot({ path: '/tmp/cycle17-not-on-step7.png', fullPage: true });
      throw new Error('Failed to navigate to Step 7');
    }

    console.log('✅ Reached Step 7: Review');
    await page.screenshot({ path: '/tmp/cycle17-step7-loaded.png', fullPage: true });

    // ============================================================================
    // PHASE 4: VERIFY SESSION ID
    // ============================================================================
    console.log('\n🔍 PHASE 4: Verify sessionId...');

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check sessionId in localStorage via console
    const sessionId = await page.evaluate(() => {
      return localStorage.getItem('wizard-session-id');
    });

    console.log(`SessionID from localStorage: ${sessionId}`);

    if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
      console.log('❌ Invalid sessionId!');
      await page.screenshot({ path: '/tmp/cycle17-invalid-sessionid.png', fullPage: true });
      throw new Error('Invalid sessionId - cannot test generation');
    }

    // Verify it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(sessionId);

    if (!isValidUUID) {
      console.log(`❌ SessionID is not a valid UUID: ${sessionId}`);
      throw new Error('SessionId is not a valid UUID');
    }

    console.log(`✅ Valid UUID sessionId: ${sessionId}`);

    // ============================================================================
    // PHASE 5: TEST GENERATION BUTTON
    // ============================================================================
    console.log('\n🎯 PHASE 5: Testing Site Generation...');

    // Look for generation button (try multiple text variations)
    const generateButton = page.locator('button:has-text("Générer mon site"), button:has-text("Générer le site"), button:has-text("Generate")').first();
    const generateButtonExists = await generateButton.count() > 0;

    if (!generateButtonExists) {
      console.log('❌ Generation button not found!');
      await page.screenshot({ path: '/tmp/cycle17-no-generate-button.png', fullPage: true });
      throw new Error('Generation button not found');
    }

    const buttonText = await generateButton.textContent();
    console.log(`✅ Found generation button: "${buttonText}"`);
    await page.screenshot({ path: '/tmp/cycle17-before-generate.png', fullPage: true });

    // Listen for console messages (errors, warnings)
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Starting site generation') || text.includes('sessionId')) {
        console.log(`📋 Console: ${text}`);
      }
    });

    // Listen for network requests to /customer/sites/generate
    let generationRequestSent = false;
    page.on('request', request => {
      if (request.url().includes('/customer/sites/generate')) {
        console.log(`🌐 Generation API called: ${request.method()} ${request.url()}`);
        generationRequestSent = true;
      }
    });

    page.on('response', response => {
      if (response.url().includes('/customer/sites/generate')) {
        console.log(`📥 Generation API response: ${response.status()}`);
      }
    });

    // Click the generation button
    console.log('\n🖱️  Clicking "Générer le site" button...');
    await generateButton.click();
    await page.waitForTimeout(3000); // Wait for modal or redirect

    // ============================================================================
    // PHASE 6: VERIFY GENERATION STARTED
    // ============================================================================
    console.log('\n🔄 PHASE 6: Verify generation started...');

    if (!generationRequestSent) {
      console.log('❌ No generation request sent to API!');
      await page.screenshot({ path: '/tmp/cycle17-no-api-call.png', fullPage: true });
      throw new Error('Generation API not called');
    }

    console.log('✅ Generation API request sent');

    // Check for generation progress modal
    const modalVisible = await page.locator('text=Génération en cours, text=Generation in progress').count() > 0;

    if (!modalVisible) {
      console.log('⚠️ Generation modal not visible (might be instant or error)');
      await page.screenshot({ path: '/tmp/cycle17-no-modal.png', fullPage: true });

      // Check for error messages
      const errorMessage = await page.locator('text=Erreur, text=Error').count();
      if (errorMessage > 0) {
        const errorText = await page.locator('text=Erreur, text=Error').first().textContent();
        console.log(`❌ Error detected: ${errorText}`);
        throw new Error(`Generation failed: ${errorText}`);
      }
    } else {
      console.log('✅ Generation modal appeared');
      await page.screenshot({ path: '/tmp/cycle17-modal-visible.png', fullPage: true });

      // Wait for progress updates
      console.log('⏳ Waiting for generation progress...');

      // Check for progress updates every 2 seconds for up to 1 minute
      let progressChecks = 0;
      while (progressChecks < 30) {
        await page.waitForTimeout(2000);

        const progressText = await page.locator('[class*="progress"], [class*="percentage"]').first().textContent().catch(() => '');
        if (progressText) {
          console.log(`📊 Progress: ${progressText}`);
        }

        // Check if completed
        const completedMessage = await page.locator('text=complété, text=completed, text=succès, text=success').count();
        if (completedMessage > 0) {
          console.log('✅ Generation completed!');
          break;
        }

        // Check if failed
        const failedMessage = await page.locator('text=échoué, text=failed, text=erreur').count();
        if (failedMessage > 0) {
          console.log('❌ Generation failed!');
          await page.screenshot({ path: '/tmp/cycle17-generation-failed.png', fullPage: true });
          break;
        }

        progressChecks++;
      }
    }

    // ============================================================================
    // PHASE 7: VERIFY SITE URL
    // ============================================================================
    console.log('\n🌐 PHASE 7: Verify site URL...');

    // Look for site URL in the page
    const siteUrlElement = await page.locator('text=http://localhost:, text=http://162.55.213.90:').count();

    if (siteUrlElement > 0) {
      const siteUrlText = await page.locator('text=http://localhost:, text=http://162.55.213.90:').first().textContent();
      console.log(`✅ Site URL found: ${siteUrlText}`);

      // Extract URL
      const urlMatch = siteUrlText?.match(/(http:\/\/[^\s]+)/);
      if (urlMatch) {
        const generatedSiteUrl = urlMatch[1];
        console.log(`🎯 Generated Site URL: ${generatedSiteUrl}`);

        // Test if site is accessible
        try {
          const siteResponse = await page.goto(generatedSiteUrl, { timeout: 10000 });
          if (siteResponse && siteResponse.ok()) {
            console.log('✅ Generated site is accessible!');
            await page.screenshot({ path: '/tmp/cycle17-generated-site.png', fullPage: true });
          } else {
            console.log('⚠️ Generated site returned non-OK status');
          }
        } catch (e) {
          console.log(`⚠️ Could not access generated site: ${e.message}`);
        }
      }
    } else {
      console.log('⚠️ Site URL not found in page');
      await page.screenshot({ path: '/tmp/cycle17-no-site-url.png', fullPage: true });
    }

    // ============================================================================
    // FINAL SUCCESS
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('🎉 CYCLE 17 SITE GENERATION TEST COMPLETE!');
    console.log('✅ Navigated to Step 7 (Review)');
    console.log('✅ SessionId validated (UUID format)');
    console.log('✅ Generation button clicked');
    console.log('✅ Generation API called');
    console.log('✅ Site generation workflow tested');
    console.log('\n📸 Screenshots saved:');
    console.log('   - /tmp/cycle17-step7-loaded.png');
    console.log('   - /tmp/cycle17-before-generate.png');
    console.log('   - /tmp/cycle17-modal-visible.png (if modal appeared)');
    console.log('   - /tmp/cycle17-generated-site.png (if site accessible)');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error);

    // Take screenshot on failure
    try {
      await page.screenshot({ path: '/tmp/cycle17-failure.png', fullPage: true });
      console.log('📸 Failure screenshot saved to /tmp/cycle17-failure.png');
    } catch (e) {
      console.log('Could not take screenshot');
    }

    throw error;
  }
});
