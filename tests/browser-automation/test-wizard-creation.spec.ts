import { test, expect } from '@playwright/test';

test('Test wizard session creation with console logs', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => {
    console.log(`BROWSER LOG [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Login
  await page.goto('https://logen.locod-ai.com/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('Administrator2025');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  
  // Navigate to create site
  await page.goto('https://logen.locod-ai.com/sites/create');
  await page.waitForLoadState('networkidle');
  
  // Click Assistant Classique
  console.log('🔍 Clicking Assistant Classique...');
  const assistantLink = page.locator('a[href="/wizard?new=true"]');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    assistantLink.click()
  ]);
  
  console.log('✅ Navigated to:', page.url());
  
  // Wait to see console logs
  await page.waitForTimeout(5000);
  
  // Check terms and click Commencer
  console.log('🔍 Accepting terms and clicking Commencer...');
  const termsCheckbox = page.locator('input[type="checkbox"]').first();
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check();
    await page.waitForTimeout(1000);
    
    const commencerButton = page.locator('button:has-text("Commencer")');
    if (await commencerButton.isVisible()) {
      await commencerButton.click();
      console.log('✅ Clicked Commencer');
    }
  }
  
  // Wait for console logs
  await page.waitForTimeout(5000);
  
  // Navigate back to My Sites
  await page.goto('https://logen.locod-ai.com/sites');
  await page.waitForLoadState('networkidle');
  
  // Check what's in My Sites
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log(`\n📋 Sites in My Sites (${rowCount} rows):`);
  
  for (let i = 0; i < Math.min(rowCount, 5); i++) {
    const rowText = await rows.nth(i).textContent();
    console.log(`Row ${i + 1}: ${rowText?.trim()}`);
  }
});