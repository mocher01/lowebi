import { test, expect } from '@playwright/test';

test('Issue #147 - Site deletion with confirmation modal', async ({ page }) => {
  let loginResponse = null;

  // Monitor login API response
  page.on('response', response => {
    if (response.url().includes('/customer/auth/login')) {
      loginResponse = response.status();
      console.log(`✅ Login API Response: ${response.status()}`);
    }

    // Monitor delete API response
    if (response.url().includes('/customer/wizard-sessions') && response.request().method() === 'DELETE') {
      console.log(`🗑️ Delete API Response: ${response.status()}`);
    }
  });

  console.log('🌐 Step 1: Navigating to login page...');
  await page.goto('https://dev.lowebi.com/login', { timeout: 15000 });

  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  console.log('📝 Login form loaded');

  // Use testlogin@example.com which now has test sites assigned
  await page.fill('input[type="email"]', 'testlogin@example.com');
  await page.fill('input[type="password"]', 'TestPass123');
  console.log('✏️ Filled in credentials (testlogin@example.com)');

  await page.click('button[type="submit"]');
  console.log('🚀 Login submitted');

  // Wait for navigation after login
  await page.waitForTimeout(4000);

  const currentUrl = page.url();
  console.log(`🔗 Current URL after login: ${currentUrl}`);

  expect(loginResponse).toBe(200);
  console.log('✅ Login successful - API returned 200');

  // Navigate to sites page if not already there
  if (!currentUrl.includes('/sites')) {
    console.log('🌐 Step 2: Navigating to /sites page...');
    await page.goto('https://dev.lowebi.com/sites', { timeout: 15000 });
    await page.waitForTimeout(2000);
  } else {
    console.log('✅ Already on /sites page');
  }

  console.log('🔍 Step 3: Looking for existing sites to delete...');

  // Wait for the page to load sites
  await page.waitForTimeout(2000);

  // Take a screenshot before attempting delete
  await page.screenshot({ path: '/tmp/before-delete.png', fullPage: true });
  console.log('📸 Screenshot saved: /tmp/before-delete.png');

  // Look for specific test sites assigned to testlogin@example.com
  const targetSiteNames = ['okidoc', 'unique-site-1760265262033', 'unique-site-1760265566992'];
  let siteName = null;
  let deleteButton = null;

  for (const testSiteName of targetSiteNames) {
    // Try to find the site by name in table or card view
    const siteRow = page.locator(`tr:has-text("${testSiteName}"), div:has-text("${testSiteName}")`).first();
    const siteExists = await siteRow.count() > 0;

    if (siteExists) {
      siteName = testSiteName;
      console.log(`🎯 Found target site: ${siteName}`);

      // Find delete button within this site's row/card
      deleteButton = siteRow.locator('button:has(svg path[d*="M19 7"])').first();
      const buttonExists = await deleteButton.count() > 0;

      if (buttonExists) {
        console.log(`✅ Delete button found for site: ${siteName}`);
        break;
      }
    }
  }

  if (!deleteButton || !siteName) {
    console.log('❌ No test sites found with delete buttons');
    throw new Error('No test sites available for deletion test');
  }

  console.log('🗑️ Step 4: Clicking delete button...');
  await deleteButton.click();

  // Wait for confirmation modal to appear
  await page.waitForTimeout(1000);

  console.log('🔍 Step 5: Checking for confirmation modal...');

  // Look for modal with various selectors
  const modalVisible = await page.locator('div:has-text("Delete Site"), div:has-text("Are you sure"), [role="dialog"]').count();

  if (modalVisible === 0) {
    console.log('❌ Confirmation modal did NOT appear');
    await page.screenshot({ path: '/tmp/no-modal.png', fullPage: true });
    throw new Error('Confirmation modal did not appear after clicking delete');
  }

  console.log('✅ Confirmation modal appeared');
  await page.screenshot({ path: '/tmp/modal-visible.png', fullPage: true });
  console.log('📸 Screenshot saved: /tmp/modal-visible.png');

  // Verify modal content
  const modalText = await page.locator('div:has-text("Delete Site"), div:has-text("Are you sure")').first().textContent();
  console.log(`📝 Modal text: ${modalText}`);

  expect(modalText).toContain('Delete');
  expect(modalText).toContain('cannot be undone');

  console.log('🗑️ Step 6: Confirming deletion...');

  // Click the confirm button (usually red "Delete" button in modal)
  const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').filter({ hasText: /^Delete$|^Confirm$/ });
  await confirmButton.click();

  // Wait for deletion to complete
  await page.waitForTimeout(3000);

  console.log('🔍 Step 7: Verifying deletion...');

  // Check for success toast notification
  const toastVisible = await page.locator('div:has-text("deleted successfully"), div:has-text("Success"), [class*="toast"]').count();

  if (toastVisible > 0) {
    console.log('✅ Success toast notification appeared');
    const toastText = await page.locator('div:has-text("deleted successfully"), div:has-text("Success")').first().textContent();
    console.log(`📝 Toast message: ${toastText}`);
  } else {
    console.log('⚠️ No toast notification found (might have disappeared already)');
  }

  // Take a screenshot after deletion
  await page.screenshot({ path: '/tmp/after-delete.png', fullPage: true });
  console.log('📸 Screenshot saved: /tmp/after-delete.png');

  // Verify the site is no longer in the list
  const siteStillExists = await page.locator(`tr:has-text("${siteName}"), div:has-text("${siteName}")`).count();

  console.log(`📊 Site "${siteName}" still in list: ${siteStillExists > 0 ? 'YES ❌' : 'NO ✅'}`);
  expect(siteStillExists).toBe(0);

  console.log('\n🏆 === TEST COMPLETE ===');
  console.log('✅ Site deletion with confirmation modal works correctly');
  console.log('✅ Confirmation modal appeared as expected');
  console.log('✅ Site was removed from the list after confirmation');
  console.log('✅ Issue #147 - VERIFIED');
});
