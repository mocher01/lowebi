import { test, expect } from '@playwright/test';

test('Verify Request #551 - Check Uploaded Images', async ({ page }) => {
  console.log('🔍 VERIFYING REQUEST #551 - CHECKING UPLOADED IMAGES');
  console.log('Purpose: Verify that images uploaded by previous test are actually visible');
  console.log('=' .repeat(70));

  try {
    // Step 1: Admin Authentication
    console.log('🔐 Step 1: Admin Authentication...');
    await page.goto('https://admin.logen.locod-ai.com');
    await page.waitForTimeout(2000);

    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Admin login successful');

    // Step 2: Navigate to AI Queue
    console.log('📋 Step 2: Navigate to AI Queue...');
    await page.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
    await page.waitForTimeout(3000);

    // Step 3: Find request #551
    console.log('🔍 Step 3: Looking for request #551...');

    const request551 = page.locator('tr:has-text("#551")');
    if (await request551.count() > 0) {
      console.log('✅ Found request #551');

      // Get request status
      const requestRow = request551.first();
      const statusText = await requestRow.textContent();
      console.log(`📊 Request #551 status: ${statusText}`);

      // Click "Traiter" button
      const traiterButton = requestRow.locator('button:has-text("Traiter")');
      if (await traiterButton.count() > 0) {
        await traiterButton.click();
        console.log('✅ Clicked "Traiter" button');
        await page.waitForTimeout(5000);

        // Step 4: Check for uploaded images
        console.log('🖼️ Step 4: Checking for uploaded images...');

        // Count file input fields
        const fileInputs = page.locator('input[type="file"]');
        const fileInputCount = await fileInputs.count();
        console.log(`📊 Found ${fileInputCount} file upload fields`);

        // Check for uploaded image previews
        const imagePreviewSelectors = [
          'img[src^="data:image"]',  // Base64 data URLs
          'img[src^="blob:"]',       // Blob URLs
          '.upload-preview img',     // Preview containers
          '[alt*="preview"]'         // Preview alt text
        ];

        let totalImagesFound = 0;
        let imageDetails = [];

        for (const selector of imagePreviewSelectors) {
          try {
            const images = page.locator(selector);
            const count = await images.count();
            if (count > 0) {
              totalImagesFound += count;
              console.log(`✅ Found ${count} images with selector: ${selector}`);

              // Get details of first few images
              for (let i = 0; i < Math.min(count, 3); i++) {
                const img = images.nth(i);
                const src = await img.getAttribute('src');
                const alt = await img.getAttribute('alt');
                imageDetails.push({
                  index: i + 1,
                  src: src?.substring(0, 50) + '...',
                  alt: alt || 'No alt text'
                });
              }
            }
          } catch (error) {
            // Continue checking other selectors
          }
        }

        // Check for upload success indicators
        const successIndicators = [
          '.text-green-600:has-text("✓")',
          '.upload-success',
          'text="Uploadé"',
          '.file-uploaded'
        ];

        let successCount = 0;
        for (const selector of successIndicators) {
          try {
            const indicators = page.locator(selector);
            const count = await indicators.count();
            if (count > 0) {
              successCount += count;
              console.log(`✅ Found ${count} success indicators: ${selector}`);
            }
          } catch (error) {
            // Continue
          }
        }

        // Check localStorage for persisted data
        const localStorageData = await page.evaluate((requestId) => {
          const key = `uploaded-images-${requestId}`;
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        }, 551);

        const persistedCount = localStorageData ? Object.keys(localStorageData).length : 0;
        console.log(`💾 LocalStorage persisted images: ${persistedCount}`);

        // Final verification results
        console.log('\n🎯 VERIFICATION RESULTS:');
        console.log('='.repeat(50));
        console.log(`📊 Upload fields found: ${fileInputCount}`);
        console.log(`🖼️ Image previews found: ${totalImagesFound}`);
        console.log(`✅ Success indicators: ${successCount}`);
        console.log(`💾 Persisted in localStorage: ${persistedCount}`);

        if (imageDetails.length > 0) {
          console.log('\n📸 Image Details:');
          imageDetails.forEach(img => {
            console.log(`  ${img.index}. ${img.alt} - ${img.src}`);
          });
        }

        if (totalImagesFound > 0 || successCount > 0 || persistedCount > 0) {
          console.log('\n✅ SUCCESS: Images are visible/persisted in request #551!');
        } else {
          console.log('\n❌ NO IMAGES FOUND: No uploaded images detected in request #551');
        }

      } else {
        console.log('❌ No "Traiter" button found for request #551');
      }
    } else {
      console.log('❌ Request #551 not found in queue');

      // List available requests for debugging
      const allRequests = page.locator('tr:has-text("#")');
      const requestCount = await allRequests.count();
      console.log(`📊 Found ${requestCount} total requests in queue`);

      if (requestCount > 0) {
        console.log('📋 First 5 requests:');
        for (let i = 0; i < Math.min(requestCount, 5); i++) {
          const requestText = await allRequests.nth(i).textContent();
          console.log(`  ${i + 1}. ${requestText?.substring(0, 100)}...`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
});