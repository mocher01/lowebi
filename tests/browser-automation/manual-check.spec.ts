import { test, expect } from '@playwright/test';

test('Manual check My Sites page', async ({ page }) => {
  console.log('🔍 Logging in and checking My Sites...');
  
  // Login
  await page.goto('https://logen.locod-ai.com/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('Administrator2025');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  
  // Go to My Sites
  await page.goto('https://logen.locod-ai.com/sites');
  await page.waitForLoadState('networkidle');
  
  console.log('📋 Current sites in My Sites page:');
  
  // Get all table rows
  const rows = page.locator('tr');
  const rowCount = await rows.count();
  
  for (let i = 0; i < Math.min(rowCount, 20); i++) {
    const rowText = await rows.nth(i).textContent();
    if (rowText && rowText.trim().length > 0) {
      console.log(`Row ${i}: ${rowText.trim()}`);
    }
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'my-sites-current.png', fullPage: true });
  console.log('📸 Screenshot saved as my-sites-current.png');
  
  // Wait for manual inspection
  console.log('\n⏳ Waiting 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
});