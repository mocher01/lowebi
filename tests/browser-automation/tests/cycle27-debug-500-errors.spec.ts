import { test, expect } from '@playwright/test';

/**
 * DEBUG TEST: Capture 500 errors when clicking Manage button
 */

test('Debug: Capture 500 errors on Manage button click', async ({ page }) => {
  test.setTimeout(120000);

  const errors: any[] = [];
  const networkRequests: any[] = [];

  // Capture all network responses
  page.on('response', response => {
    const status = response.status();
    const url = response.url();

    networkRequests.push({
      url,
      status,
      statusText: response.statusText(),
    });

    // Log errors
    if (status >= 400) {
      console.log(`❌ HTTP ${status}: ${url}`);
      errors.push({
        url,
        status,
        statusText: response.statusText(),
      });
    }
  });

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 Console Error: ${msg.text()}`);
    }
  });

  console.log('🔐 Step 1: Login...');
  await page.goto('https://dev.lowebi.com/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('✅ Logged in\n');

  console.log('🏠 Step 2: Navigate to My Sites...');
  await page.goto('https://dev.lowebi.com/sites');
  await page.waitForTimeout(3000);
  console.log('✅ On My Sites\n');

  console.log('🔍 Step 3: Finding Manage button...');
  const targetSiteName = 'cycle26test1760385122507';
  const siteRow = page.locator(`tr:has-text("${targetSiteName}")`).first();
  const manageButton = siteRow.locator('button:has-text("Manage"), a:has-text("Manage")').first();

  const exists = await manageButton.count();
  if (exists === 0) {
    throw new Error('Manage button not found');
  }
  console.log('✅ Found Manage button\n');

  console.log('🎯 Step 4: Clicking Manage button...');
  console.log('📡 Watching for network errors...\n');

  // Clear previous errors
  errors.length = 0;

  await manageButton.click();
  await page.waitForTimeout(5000); // Wait longer to capture all requests

  const currentUrl = page.url();
  console.log(`\n📍 Current URL: ${currentUrl}`);

  // Report all errors
  console.log(`\n📊 Total errors captured: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach((err, index) => {
      console.log(`\n${index + 1}. HTTP ${err.status} ${err.statusText}`);
      console.log(`   URL: ${err.url}`);
    });
  } else {
    console.log('✅ No HTTP errors detected');
  }

  // Check for specific 500 errors
  const has500 = errors.some(e => e.status === 500);
  const has401 = errors.some(e => e.status === 401);
  const has403 = errors.some(e => e.status === 403);

  console.log(`\n🔍 Error Summary:`);
  console.log(`   500 errors: ${has500 ? '❌ YES' : '✅ NO'}`);
  console.log(`   401 errors: ${has401 ? '❌ YES' : '✅ NO'}`);
  console.log(`   403 errors: ${has403 ? '❌ YES' : '✅ NO'}`);

  if (has500) {
    const error500s = errors.filter(e => e.status === 500);
    console.log(`\n🚨 500 ERROR DETAILS:`);
    error500s.forEach(err => {
      console.log(`   URL: ${err.url}`);
    });
  }
});
