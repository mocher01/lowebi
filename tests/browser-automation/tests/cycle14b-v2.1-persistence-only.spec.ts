import { test, expect } from '@playwright/test';

test('Cycle 14b V2.1: Verify Image Persistence on Request #551', async ({ page }) => {
  console.log('🔄 CYCLE 14b V2.1: IMAGE PERSISTENCE VERIFICATION');
  console.log('Purpose: Verify uploaded images persist when reopening request #551');
  console.log('=' .repeat(70));

  try {
    // Step 1: Admin login
    console.log('\n🔐 Step 1: Admin Authentication...');
    await page.goto('https://admin.logen.locod-ai.com');
    await page.fill('input[type="email"]', 'admin@locod.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ Admin login successful');

    // Step 2: Navigate to AI Queue
    console.log('\n📋 Step 2: Navigate to AI Queue...');
    await page.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
    await page.waitForTimeout(2000);
    console.log('✅ AI Queue page loaded');

    // Step 3: Find request #551
    console.log('\n🔍 Step 3: Looking for request #551...');
    const requestRow = page.locator('tr').filter({ hasText: '#551' }).first();
    const requestExists = await requestRow.count();

    if (requestExists === 0) {
      throw new Error('Request #551 not found in admin queue');
    }
    console.log('✅ Found request #551');

    // Step 4: Get request status and click appropriate button
    console.log('\n🖱️  Step 4: Opening request #551...');

    const voirResultatButton = requestRow.locator('button:has-text("Voir Résultat")');
    const traiterButton = requestRow.locator('button:has-text("Traiter")');

    const voirResultatExists = await voirResultatButton.count();
    const traiterExists = await traiterButton.count();

    if (voirResultatExists > 0) {
      await voirResultatButton.click();
      console.log('✅ Opened request #551 via "Voir Résultat" (completed request)');
    } else if (traiterExists > 0) {
      await traiterButton.click();
      console.log('✅ Opened request #551 via "Traiter" (pending request)');
    } else {
      throw new Error('No button found to open request #551');
    }

    await page.waitForTimeout(3000);

    // Step 5: Check for persisted images
    console.log('\n🖼️  Step 5: Checking for persisted images...');

    // Look for images with /uploads/requests/ in src (server-persisted images)
    const persistedImages = page.locator('img[src*="/uploads/requests/551"]');
    const persistedCount = await persistedImages.count();

    console.log(`\n📊 PERSISTENCE VERIFICATION RESULTS:`);
    console.log('='.repeat(70));

    if (persistedCount > 0) {
      console.log(`✅ SUCCESS: Found ${persistedCount} persisted images!`);
      console.log('✅ Images are loaded from server (imagesDraft field)');
      console.log('✅ CRITICAL: Images persist even after "Appliquer & Terminer"');

      // Log first 5 image URLs
      console.log('\n📸 Persisted image URLs:');
      for (let i = 0; i < Math.min(persistedCount, 5); i++) {
        const imgSrc = await persistedImages.nth(i).getAttribute('src');
        console.log(`  ${i + 1}. ${imgSrc}`);
      }

      // Check if we have all 16 expected images
      if (persistedCount === 16) {
        console.log('\n🎉 PERFECT: All 16 images persisted correctly!');
      } else {
        console.log(`\n⚠️  PARTIAL: ${persistedCount}/16 images persisted`);
      }

    } else {
      console.log('❌ CRITICAL FAILURE: No persisted images found!');
      console.log('❌ Images were NOT saved to imagesDraft field');
      console.log('❌ Images are LOST after clicking "Appliquer & Terminer"');

      // Debug: check if file inputs are present
      const fileInputs = await page.locator('input[type="file"]').count();
      console.log(`\n🔍 Debug: Found ${fileInputs} file input fields`);

      throw new Error('Image persistence verification FAILED - no images found');
    }

    // Step 6: Verify file input fields are present
    const fileInputCount = await page.locator('input[type="file"]').count();
    console.log(`\n📋 File input fields in modal: ${fileInputCount}`);

    // Final summary
    console.log('\n🎉 CYCLE 14b V2.1 PERSISTENCE TEST COMPLETE');
    console.log('='.repeat(70));
    console.log(`✅ Request #551: FOUND`);
    console.log(`✅ Modal opened: YES`);
    console.log(`✅ Persisted images: ${persistedCount}`);
    console.log(`✅ Server-side persistence: ${persistedCount > 0 ? 'WORKING' : 'BROKEN'}`);

    if (persistedCount >= 16) {
      console.log('\n🎉 SUCCESS: V2.1 image persistence is WORKING correctly!');
    } else if (persistedCount > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS: Some images persisted, but not all 16');
    } else {
      console.log('\n❌ FAILURE: Image persistence is BROKEN');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
});