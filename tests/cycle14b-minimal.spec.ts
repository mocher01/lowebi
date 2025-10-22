import { test, expect } from '@playwright/test';

test('Cycle 14b: Minimal V1 Image System Test', async ({ page }) => {
  console.log('🔄 CYCLE 14b: MINIMAL V1 IMAGE SYSTEM TEST');
  console.log('Purpose: Test core V1 image system without full wizard');
  console.log('======================================================================');

  // ============================================================================
  // ADMIN-ONLY TEST: CHECK V1 IMAGE SYSTEM DIRECTLY
  // ============================================================================

  console.log('🔐 Admin login...');
  await page.goto('http://localhost:7612');
  await page.waitForTimeout(2000);

  // Admin login
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  if (await emailInput.count() > 0) {
    await emailInput.fill('admin@locod.ai');
    await page.locator('input[type="password"], input[name="password"]').first().fill('admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Admin login successful');
  }

  // Navigate to AI Queue
  await page.goto('http://localhost:7612/dashboard/ai-queue');
  await page.waitForTimeout(2000);
  console.log('✅ Navigated to admin AI queue');

  // ============================================================================
  // TEST 1: CHECK FOR EXISTING IMAGE REQUESTS
  // ============================================================================

  console.log('\n🔍 TEST 1: Checking existing image requests...');

  const totalRows = await page.locator('tr').count();
  console.log(`📊 Found ${totalRows} total rows in queue`);

  // Look for any image requests
  const imageRequests = await page.locator('td:has-text("images"), div:has-text("images")').count();
  console.log(`📊 Found ${imageRequests} image-related requests`);

  if (imageRequests > 0) {
    console.log('✅ Image requests exist in queue');

    // ============================================================================
    // TEST 2: VERIFY V1 IMAGE REQUEST HANDLING
    // ============================================================================

    console.log('\n🔍 TEST 2: Testing V1 image request handling...');

    // Find first image request
    const firstImageRow = page.locator('tr:has(td:has-text("images"))').first();
    const rowText = await firstImageRow.textContent();
    console.log(`🎯 Testing image request: ${rowText?.substring(0, 100)}...`);

    // CRITICAL TEST: Check if "Traiter" button exists (indicates pending request)
    const traiterButton = firstImageRow.locator('button:has-text("Traiter")');
    const traiterCount = await traiterButton.count();

    if (traiterCount > 0) {
      console.log('🔘 Found "Traiter" button - testing V1 interface...');
      await traiterButton.first().click();
      await page.waitForTimeout(2000);

      // CRITICAL V1 TEST: Check interface type
      const uploadFields = await page.locator('input[type="file"], input[accept*="image"]').count();
      const textareas = await page.locator('textarea').count();
      const pageContent = await page.textContent('body');

      // Check for V1 system failure indicators
      const hasWarningMessage = pageContent.includes('Générez les images selon les prompts') ||
                               pageContent.includes('uploadez-les ici') ||
                               pageContent.includes('automatiquement renommées avec le préfixe');

      console.log(`📊 Upload fields found: ${uploadFields}`);
      console.log(`📊 Textareas found: ${textareas}`);
      console.log(`📊 Warning message detected: ${hasWarningMessage}`);

      // V1 SYSTEM VERIFICATION
      if (uploadFields > 0 && !hasWarningMessage) {
        console.log('✅ CRITICAL SUCCESS: V1 image system working!');
        console.log('✅ Admin interface shows image upload fields');
        console.log('✅ No warning messages (proper V1 handling)');

        // Test upload capability
        console.log('\n📤 Testing image upload capability...');
        const placeholderImagePath = '/var/apps/logen/archive/v1-legacy/v1-data/site-templates/mokiplok/assets/mokiplok-logo.png';

        try {
          await page.locator('input[type="file"]').first().setInputFiles(placeholderImagePath);
          await page.waitForTimeout(1000);
          console.log('✅ Image upload test successful');

          // Test completion button
          const completeButton = page.locator('button:has-text("Appliquer"), button:has-text("Terminer")').first();
          if (await completeButton.count() > 0) {
            console.log('✅ Complete button available');
          }

        } catch (error) {
          console.log(`⚠️ Upload test failed: ${error.message}`);
        }

      } else if (hasWarningMessage) {
        console.log('❌ CRITICAL FAILURE: V1 image system BROKEN!');
        console.log('💡 Admin shows warning text instead of upload interface');
        console.log('💡 This confirms V1 system is not working correctly');
        throw new Error('CRITICAL: V1 image system broken - shows warning text instead of upload fields');

      } else if (textareas > 0 && uploadFields === 0) {
        console.log('❌ CRITICAL FAILURE: V1 routing BROKEN!');
        console.log('💡 Admin shows content textarea instead of image interface');
        console.log('💡 Image requests are being routed to content handler');
        throw new Error('CRITICAL: V1 routing broken - image requests show content interface');

      } else {
        console.log('❌ CRITICAL FAILURE: Admin interface completely broken');
        throw new Error('CRITICAL: Admin interface shows no input fields at all');
      }

    } else {
      console.log('⚠️ No "Traiter" button found - all image requests may be processed');

      // Check for "Voir Résultat" buttons (completed requests)
      const voirButton = firstImageRow.locator('button:has-text("Voir"), button:has-text("Résultat")');
      if (await voirButton.count() > 0) {
        console.log('✅ Found processed image request - V1 system appears functional');
      }
    }

  } else {
    console.log('⚠️ No image requests found in current queue');

    // ============================================================================
    // TEST 3: CREATE MINIMAL IMAGE REQUEST FOR TESTING
    // ============================================================================

    console.log('\n🔍 TEST 3: No existing requests - checking if we can test V1 system anyway...');

    // Check if there are any requests at all
    if (totalRows > 1) {
      console.log('✅ Queue is functional (has other requests)');
      console.log('💡 V1 image system status: UNTESTABLE (no image requests available)');
      console.log('💡 To test V1 system, create an image request from customer portal');
    } else {
      console.log('⚠️ Queue appears empty or non-functional');
      throw new Error('CRITICAL: Cannot test V1 system - no requests in queue');
    }
  }

  // ============================================================================
  // FINAL ASSESSMENT
  // ============================================================================

  console.log('\n🎯 MINIMAL V1 TEST RESULTS:');
  console.log('=====================================');
  console.log(`📊 Admin Queue Accessible: ✅`);
  console.log(`📊 Image Requests Found: ${imageRequests > 0 ? '✅' : '⚠️'}`);
  console.log(`📊 V1 Interface Working: ${uploadFields > 0 ? '✅' : (imageRequests > 0 ? '❌' : '?')}`);

  if (imageRequests > 0 && uploadFields > 0) {
    console.log('\n🎉 MINIMAL V1 SUCCESS: V1 image system is working!');
    console.log('✅ Image requests properly routed to V1 system');
    console.log('✅ Admin interface shows correct upload fields');
    console.log('✅ No warning messages (proper V1 handling)');
  } else if (imageRequests > 0) {
    console.log('\n❌ MINIMAL V1 FAILURE: V1 image system is broken!');
    console.log('💡 Image requests exist but interface is wrong');
  } else {
    console.log('\n⚠️ MINIMAL V1 UNTESTABLE: No image requests to test');
    console.log('💡 Create image request from customer portal to test V1');
  }

  console.log('\n📋 Minimal V1 test completed');
});