import { test, expect } from '@playwright/test';

test.describe('Verify Image Persistence After Upload', () => {
  test('Request #551 should show all 16 uploaded images when reopened', async ({ page }) => {
    console.log('\n🔍 VERIFYING IMAGE PERSISTENCE IN REQUEST #551');
    console.log('Purpose: Confirm uploaded images are visible when reopening the request\n');
    console.log('======================================================================\n');

    // Step 1: Admin login
    console.log('🔐 Step 1: Admin Authentication...');
    await page.goto('http://admin.logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ Admin login successful\n');

    // Step 2: Navigate to AI Queue
    console.log('📋 Step 2: Navigate to AI Queue...');
    await page.goto('http://admin.logen.locod-ai.com/dashboard/ai-queue');
    await page.waitForLoadState('networkidle');
    console.log('✅ AI Queue page loaded\n');

    // Step 3: Find and open request #551
    console.log('🔍 Step 3: Looking for request #551...');
    const requestRow = page.locator('tr').filter({ hasText: '#551' }).first();
    await expect(requestRow).toBeVisible({ timeout: 10000 });
    console.log('✅ Found request #551\n');

    // Step 4: Click "Traiter" button
    console.log('🖱️  Step 4: Opening request #551...');
    const traiterButton = requestRow.locator('button', { hasText: 'Traiter' });
    await traiterButton.click();
    await page.waitForTimeout(2000); // Wait for modal to open and load images
    console.log('✅ Request #551 modal opened\n');

    // Step 5: Verify all 16 images are pre-loaded
    console.log('🖼️  Step 5: Checking for pre-loaded images...\n');

    const expectedImages = [
      { role: 'logo', label: 'Logo' },
      { role: 'hero', label: 'Image Hero' },
      { role: 'blog-1', label: 'Article Blog 1' },
      { role: 'blog-2', label: 'Article Blog 2' },
      { role: 'blog-3', label: 'Article Blog 3' },
      { role: 'service-1', label: 'Service 1' },
      { role: 'service-2', label: 'Service 2' },
      { role: 'service-3', label: 'Service 3' },
      { role: 'banner', label: 'Bannière' },
      { role: 'favicon', label: 'Favicon' },
      { role: 'logo-light', label: 'Logo (Clair)' },
      { role: 'logo-dark', label: 'Logo (Sombre)' },
      { role: 'favicon-light', label: 'Favicon (Clair)' },
      { role: 'favicon-dark', label: 'Favicon (Sombre)' },
      { role: 'image-1', label: 'Image 1' },
      { role: 'image-2', label: 'Image 2' },
    ];

    let loadedCount = 0;

    for (const img of expectedImages) {
      // Look for uploaded image previews (img tags with src containing /uploads/)
      const imagePreview = page.locator(`img[src*="/uploads/requests/551"]`).nth(loadedCount);

      try {
        await expect(imagePreview).toBeVisible({ timeout: 2000 });
        loadedCount++;
        console.log(`  ✅ Image ${loadedCount}/16 loaded: ${img.label} (${img.role})`);
      } catch (error) {
        console.log(`  ⚠️  Image not found: ${img.label} (${img.role})`);
      }
    }

    console.log(`\n📊 Final Result: ${loadedCount}/16 images pre-loaded from server`);

    // Assert that we found all 16 images
    expect(loadedCount).toBe(16);

    console.log('\n🎉 SUCCESS: All 16 images are persisted and visible when reopening the request!');
    console.log('✅ Server-side persistence is working correctly!\n');
  });
});