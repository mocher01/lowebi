import { test, expect } from '@playwright/test';

/**
 * TEST: Verify View Logs button works after container name fix
 */

test('Cycle 27: Test View Logs button functionality', async ({ page }) => {
  test.setTimeout(120000);

  console.log('🔐 Step 1: Login...');
  await page.goto('https://dev.lowebi.com/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('✅ Logged in\n');

  console.log('🏠 Step 2: Navigate to My Sites...');
  await page.goto('https://dev.lowebi.com/sites');
  await page.waitForTimeout(2000);
  console.log('✅ On My Sites\n');

  console.log('🔍 Step 3: Click Manage button...');
  const targetSiteName = 'cycle26test1760385122507';
  const siteRow = page.locator(`tr:has-text("${targetSiteName}")`).first();
  const manageButton = siteRow.locator('button:has-text("Manage"), a:has-text("Manage")').first();
  await manageButton.click();
  await page.waitForTimeout(3000);
  console.log('✅ On admin dashboard\n');

  console.log('🎯 Step 4: Click "View Logs" button...');
  const viewLogsButton = page.locator('button:has-text("View Logs")').first();
  await viewLogsButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Clicked View Logs\n');

  console.log('🔍 Step 5: Verify logs modal appears...');
  const logsModal = page.locator('text=Container Logs').first();
  const isVisible = await logsModal.isVisible();
  
  if (!isVisible) {
    throw new Error('Logs modal did not appear');
  }
  console.log('✅ Logs modal visible\n');

  console.log('🔍 Step 6: Check for error messages...');
  const errorText = await page.locator('text=/Error|not found|failed/i').count();
  
  if (errorText > 0) {
    const errorContent = await page.locator('text=/Error|not found|failed/i').first().textContent();
    console.log(`❌ Error found in logs modal: ${errorContent}`);
    throw new Error(`Logs modal shows error: ${errorContent}`);
  }
  
  console.log('✅ No errors in logs modal\n');

  console.log('🔍 Step 7: Verify logs content is present...');
  // Check if there's actual log content (not just "No logs available")
  const logContent = page.locator('.font-mono').first();
  const hasContent = await logContent.isVisible();
  
  if (!hasContent) {
    throw new Error('No log content found');
  }
  
  const logText = await logContent.textContent() || '';
  if (logText.includes('No logs available')) {
    throw new Error('Logs show "No logs available" - container may not be accessible');
  }
  
  console.log(`✅ Logs content present (${logText.length} chars)\n`);

  console.log('\n🎉 View Logs functionality: SUCCESS');
});
