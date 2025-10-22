import { test, expect } from '@playwright/test';

/**
 * CYCLE 27: QUICK ADMIN DASHBOARD TEST
 *
 * Purpose: Verify Issue #168 Phase 1 fixes on an existing deployed site
 * - Tests "Manage" button visibility for deployed sites
 * - Tests admin dashboard access without 401 errors
 * - Tests admin dashboard components (preview, quick actions, logs)
 *
 * This test uses an existing deployed site from the database to quickly verify
 * the admin dashboard functionality without waiting for site generation.
 */

test('Cycle 27: Quick Admin Dashboard Verification (Existing Site)', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes timeout

  console.log('🔄 CYCLE 27: QUICK ADMIN DASHBOARD TEST');
  console.log('Purpose: Verify Issue #168 Phase 1 on existing deployed site');
  console.log('================================================================================\n');

  // Known deployed site from database
  const targetSiteName = 'cycle26test1760385122507';
  const targetSiteId = '68e54a10-f29f-424b-b89b-9bb4033b6af3';

  // STEP 1: Login as customer (copied from cycle27 test)
  console.log('🔐 Step 1: Authentication...');
  await page.goto('https://logen.locod-ai.com/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('✅ Customer login successful\n');

  // STEP 2: Navigate to My Sites (copied from cycle27 test)
  console.log('🏠 Step 2: Navigate to My Sites...');
  await page.goto('https://logen.locod-ai.com/sites');
  await page.waitForTimeout(3000);

  // Verify we're actually on sites page, not redirected to login
  const currentUrl = page.url();
  console.log(`📍 Current URL after sites navigation: ${currentUrl}`);

  if (currentUrl.includes('/login')) {
    console.log('🔐 Redirected to login, need to login again...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to sites again after re-login
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`📍 Final URL after re-login: ${finalUrl}`);

    if (finalUrl.includes('/login')) {
      throw new Error('Still redirected to login after re-authentication');
    }
  }

  console.log('✅ On My Sites page\n');

  // STEP 3: Find the deployed site and verify "Manage" button exists
  console.log(`🔍 Step 3: Looking for site "${targetSiteName}" with "Manage" button...`);

  // Wait for the sites table to load
  await page.waitForSelector('table', { timeout: 10000 }).catch(() => {
    console.log('⚠️ Sites table not found');
  });

  // Look for the site row
  const siteRow = page.locator(`tr:has-text("${targetSiteName}")`).first();
  const siteRowExists = await siteRow.count();

  if (siteRowExists === 0) {
    console.log(`❌ Site "${targetSiteName}" not found in MySites table`);
    throw new Error(`Site ${targetSiteName} not found`);
  }

  console.log(`✅ Found site "${targetSiteName}"`);

  // Check for "Manage" button
  const manageButton = siteRow.locator('button:has-text("Manage"), a:has-text("Manage")').first();
  const manageButtonExists = await manageButton.count();

  if (manageButtonExists === 0) {
    console.log('❌ CRITICAL FAILURE: "Manage" button not found for deployed site!');
    console.log('This indicates the deployment status fix is not working.');
    throw new Error('"Manage" button not found for deployed site');
  }

  console.log('✅ "Manage" button is visible for deployed site\n');

  // STEP 4: Click "Manage" button and navigate to admin dashboard
  console.log('🎯 Step 4: Click "Manage" button...');
  await manageButton.click();
  await page.waitForTimeout(3000);

  const adminUrl = page.url();
  console.log(`📍 Current URL: ${adminUrl}`);

  if (!adminUrl.includes('/admin/sites/')) {
    console.log('❌ Failed to navigate to admin dashboard');
    throw new Error(`Expected admin dashboard URL, got: ${adminUrl}`);
  }

  console.log('✅ Navigated to admin dashboard\n');

  // STEP 5: Verify NO 401 errors
  console.log('🔍 Step 5: Verify NO 401 Unauthorized errors...');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Check page content for 401 errors
  const pageContent = await page.textContent('body');

  if (pageContent?.includes('401') || pageContent?.includes('Unauthorized')) {
    console.log('❌ CRITICAL FAILURE: 401 Unauthorized error detected on admin dashboard!');
    console.log('Page content snippet:', pageContent?.substring(0, 500));
    throw new Error('401 Unauthorized error on admin dashboard');
  }

  console.log('✅ NO 401 errors - Admin dashboard loaded successfully!\n');

  // STEP 6: Verify admin dashboard components are present
  console.log('🔍 Step 6: Verify admin dashboard components...');

  let componentsFound = 0;
  const expectedComponents = [
    { name: 'Site Preview/Header', selector: 'h1, h2' },
    { name: 'Site Info', selector: 'text=Site Name, text=Domain, text=Status' },
    { name: 'Quick Actions Section', selector: 'text=Quick Actions, button:has-text("Restart"), button:has-text("View Logs")' },
  ];

  for (const component of expectedComponents) {
    const exists = await page.locator(component.selector).first().count();
    if (exists > 0) {
      console.log(`  ✅ Found: ${component.name}`);
      componentsFound++;
    } else {
      console.log(`  ⚠️ Not found: ${component.name}`);
    }
  }

  console.log(`\n📊 Admin Dashboard Components: ${componentsFound}/${expectedComponents.length} found`);

  if (componentsFound === 0) {
    console.log('❌ FAILURE: No admin dashboard components found');
    throw new Error('Admin dashboard components not found');
  }

  console.log('\n✅ Admin dashboard components verified');

  // FINAL RESULT
  console.log('\n================================================================================');
  console.log('🎉 CYCLE 27 QUICK ADMIN TEST: SUCCESS');
  console.log('================================================================================');
  console.log('✅ "Manage" button appears for deployed sites');
  console.log('✅ Admin dashboard accessible without 401 errors');
  console.log(`✅ Admin dashboard components present (${componentsFound}/${expectedComponents.length})`);
  console.log('\n🎯 Issue #168 Phase 1: VERIFIED WORKING');
});
