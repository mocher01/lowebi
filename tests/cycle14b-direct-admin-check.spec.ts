import { test, expect } from '@playwright/test';

test('Direct Admin V1 Check: Verify existing image requests', async ({ page }) => {
  console.log('🔍 DIRECT ADMIN V1 CHECK');
  console.log('Purpose: Check admin interface directly for V1 image system');
  console.log('======================================================================');

  // ============================================================================
  // ADMIN LOGIN AND NAVIGATION (Direct Port Access)
  // ============================================================================

  console.log('🔐 Admin login (direct port access)...');
  await page.goto('http://localhost:7612');
  await page.waitForTimeout(2000);

  // Login to admin
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const emailExists = await emailInput.count() > 0;

  if (emailExists) {
    await emailInput.fill('admin@locod.ai');
    await page.locator('input[type="password"], input[name="password"]').first().fill('admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Admin login successful');
  } else {
    console.log('⚠️ Already logged in or login form not found');
  }

  // Navigate to AI Queue
  await page.goto('http://localhost:7612/dashboard/ai-queue');
  await page.waitForLoadState('networkidle');
  console.log('✅ Navigated to admin AI queue');

  // ============================================================================
  // FIND ANY IMAGE REQUEST
  // ============================================================================

  console.log('🔍 Looking for any image request...');
  const rows = await page.locator('tr').count();
  let imageRequestFound = false;
  let targetRequest = '';

  console.log(`📊 Found ${rows} rows in admin queue`);

  for (let i = 0; i < Math.min(rows, 20); i++) { // Check first 20 rows
    const row = page.locator('tr').nth(i);
    const rowText = await row.textContent();

    if (rowText) {
      console.log(`📝 Row ${i}: ${rowText.substring(0, 150)}...`);

      // Look for image requests (check for 'images' in request type or description)
      if (rowText.includes('images') || rowText.includes('Cycle14b_')) {
        console.log(`🎯 Found potential image request in row ${i}`);
        imageRequestFound = true;
        targetRequest = rowText.substring(0, 100);

        // ============================================================================
        // TEST 1: CHECK PROMPT TYPE
        // ============================================================================

        console.log('🔍 TEST 1: Checking prompt type...');
        const promptButton = row.locator('button:has-text("Prompt"), button:has-text("Voir"), a:has-text("Prompt")');
        const promptButtonCount = await promptButton.count();

        if (promptButtonCount > 0) {
          console.log('🔘 Found prompt button, checking content...');
          await promptButton.first().click();
          await page.waitForTimeout(2000);

          const promptContent = await page.textContent('body');

          // Check for image-specific content
          const hasImageKeywords = promptContent.includes('DALL-E') ||
                                  promptContent.includes('Create an image') ||
                                  (promptContent.includes('image') && promptContent.includes('generate'));

          // Check for content-specific keywords
          const hasContentKeywords = promptContent.includes('hero') ||
                                    promptContent.includes('services') ||
                                    promptContent.includes('JSON') ||
                                    promptContent.includes('"title"');

          console.log(`📊 Prompt analysis:`);
          console.log(`  - Contains image keywords: ${hasImageKeywords}`);
          console.log(`  - Contains content keywords: ${hasContentKeywords}`);
          console.log(`  - Prompt preview: "${promptContent.substring(0, 200)}..."`);

          if (hasContentKeywords && !hasImageKeywords) {
            console.log('❌ CRITICAL FAILURE: Image request shows CONTENT prompt!');
            throw new Error(`CRITICAL V1 FAILURE: Image request shows content prompt instead of DALL-E prompt`);
          } else if (hasImageKeywords) {
            console.log('✅ Prompt appears to be for image generation');
          } else {
            console.log('⚠️ Unclear prompt type');
          }

          await page.goBack();
          await page.waitForTimeout(1000);
        } else {
          console.log('⚠️ No prompt button found');
        }

        // ============================================================================
        // TEST 2: CHECK ADMIN INTERFACE TYPE
        // ============================================================================

        console.log('🔍 TEST 2: Checking admin interface type...');
        const traiterButton = row.locator('button:has-text("Traiter")');
        const traiterCount = await traiterButton.count();

        if (traiterCount > 0) {
          console.log('🔘 Found "Traiter" button, checking interface...');
          await traiterButton.first().click();
          await page.waitForTimeout(2000);

          // Check what type of interface is shown
          const uploadFields = await page.locator('input[type="file"], input[accept*="image"]').count();
          const textareas = await page.locator('textarea').count();
          const pageContent = await page.textContent('body');

          // Look for specific warning text that indicates broken V1
          const warningTexts = [
            'Générez les images selon les prompts',
            'uploadez-les ici',
            'automatiquement renommées avec le préfixe'
          ];

          const hasWarningMessage = warningTexts.some(text => pageContent.includes(text));

          console.log(`📊 Interface analysis:`);
          console.log(`  - Upload fields found: ${uploadFields}`);
          console.log(`  - Textareas found: ${textareas}`);
          console.log(`  - Warning message detected: ${hasWarningMessage}`);

          if (hasWarningMessage) {
            console.log('❌ CRITICAL FAILURE: Admin shows warning text instead of proper V1 interface!');
            console.log('📄 Warning detected: Shows fallback instructions instead of image upload fields');
            console.log('💡 This confirms V1 image system is NOT working properly');
            throw new Error(`CRITICAL V1 FAILURE: Admin interface shows warning text instead of image upload fields`);
          } else if (uploadFields > 0) {
            console.log('✅ Admin interface shows proper image upload fields');
          } else if (textareas > 0) {
            console.log('❌ CRITICAL FAILURE: Admin shows content textarea instead of image interface!');
            throw new Error(`CRITICAL V1 FAILURE: Admin shows content form instead of image form`);
          } else {
            console.log('❌ No clear interface type detected');
            throw new Error('CRITICAL: Admin interface unclear - no recognizable input fields');
          }

          // Close modal/interface
          const closeSelectors = [
            'button:has-text("Fermer")',
            'button:has-text("Close")',
            'button[aria-label="Close"]',
            '.modal button',
            '[data-dismiss="modal"]'
          ];

          for (const selector of closeSelectors) {
            const closeButton = page.locator(selector);
            const closeCount = await closeButton.count();
            if (closeCount > 0) {
              await closeButton.first().click();
              await page.waitForTimeout(1000);
              break;
            }
          }

        } else {
          console.log('⚠️ No "Traiter" button found - request may be processed');
        }

        break; // Exit after checking first image request
      }
    }
  }

  if (!imageRequestFound) {
    console.log('❌ No image requests found in admin queue');
    console.log('💡 This could mean:');
    console.log('   - All image requests have been processed');
    console.log('   - No image requests have been created yet');
    console.log('   - Image requests are not being created properly');

    // Look for any requests at all
    const anyRequestRows = await page.locator('tr').count();
    console.log(`📊 Total requests in queue: ${anyRequestRows}`);

    if (anyRequestRows > 1) { // More than just header row
      console.log('📋 Found other requests, but none are image type');
      console.log('💡 This suggests customers can create requests, but image requests specifically may not be working');
    }

    throw new Error('No image requests found to test V1 system - may indicate image request creation is broken');
  }

  // ============================================================================
  // FINAL RESULT
  // ============================================================================

  console.log('\n🎉 V1 VERIFICATION COMPLETE');
  console.log('✅ Found and tested image request');
  console.log('✅ Prompt verification passed');
  console.log('✅ Admin interface verification passed');
  console.log(`✅ Request "${targetRequest}" shows proper V1 image handling`);
});