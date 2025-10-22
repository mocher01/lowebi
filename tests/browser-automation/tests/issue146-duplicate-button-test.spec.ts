import { test, expect } from '@playwright/test';

test.describe('Issue #146 - Duplicate Name Button Behavior', () => {
  test('should disable Suivant button when duplicate detected and re-enable when name becomes unique', async ({ page }) => {
    test.setTimeout(120000);

    console.log('\n🔍 ISSUE #146: DUPLICATE BUTTON BEHAVIOR TEST');
    console.log('='.repeat(80));

    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('DUPLICATE') || text.includes('Navigation validation') || text.includes('isDuplicateSiteName') || text.includes('📤')) {
        console.log(`  [BROWSER] ${text}`);
      }
    });

    try {
      // Login
      console.log('\n🔐 Step 1: Authentication...');
      await page.goto('https://dev.lowebi.com/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Administrator2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      console.log('✅ Customer login successful');

      // Navigate to sites page
      console.log('\n🏠 Step 2: Navigate to My Sites...');
      await page.goto('https://dev.lowebi.com/sites');
      await page.waitForTimeout(3000);

      // Create New Site
      console.log('\n➕ Step 3: Create New Site...');
      await page.click('text="Create New Site"');
      await page.waitForTimeout(2000);
      await page.click('a[href="/wizard?new=true"]');
      await page.waitForTimeout(3000);

      // Start wizard
      console.log('\n✅ Step 4: Starting wizard...');
      await page.locator('input[type="checkbox"]').first().check();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Commencer")');
      await page.waitForTimeout(3000);
      console.log('✅ Started wizard');

      // Navigate to Business Info step
      console.log('\n➡️ Step 5: Navigate to Business Info step...');
      await page.click('button:has-text("Suivant")');
      await page.waitForTimeout(2000);

      // Test duplicate detection
      console.log('\n✏️ Step 6: Testing duplicate detection with "oki"...');
      const businessNameField = page.locator('input[placeholder*="Entreprise"], input[placeholder*="entreprise"]').first();
      await businessNameField.clear();
      await businessNameField.fill('oki');
      console.log('Typed "oki", waiting for duplicate check (800ms debounce + API)...');
      await page.waitForTimeout(3000);

      // Verify duplicate error appears
      console.log('\n🔍 Step 7: Checking for duplicate warning...');
      const duplicateError = page.locator('text=/Ce nom de site est déjà utilisé/i');
      await expect(duplicateError).toBeVisible({ timeout: 5000 });
      console.log('✅ Duplicate error message is visible');

      // Verify red error block
      const redErrorBlock = page.locator('text=/Impossible de continuer/i');
      await expect(redErrorBlock).toBeVisible();
      console.log('✅ Red error block is visible');

      // Verify Suivant button is disabled
      const suivantButton = page.locator('button:has-text("Suivant")');
      await expect(suivantButton).toBeDisabled();
      console.log('✅ Suivant button is DISABLED (correct)');

      // Make name unique with timestamp
      const uniqueName = 'unique-test-' + Date.now();
      console.log(`\n✏️ Step 8: Making name unique by typing "${uniqueName}"...`);
      await businessNameField.clear();
      await businessNameField.fill(uniqueName);
      console.log(`Typed "${uniqueName}", waiting for duplicate check...`);
      await page.waitForTimeout(3000);

      // Verify duplicate error disappears
      console.log('\n🔍 Step 9: Verifying error messages disappeared...');
      await expect(duplicateError).not.toBeVisible({ timeout: 5000 });
      console.log('✅ Duplicate error message disappeared');

      await expect(redErrorBlock).not.toBeVisible();
      console.log('✅ Red error block disappeared');

      // Fill in other required fields
      console.log('\n📝 Step 10: Filling other required fields...');
      await page.fill('textarea[placeholder*="entreprise"]', 'Test business type description');
      await page.fill('input[type="email"]', 'contact@test.com');

      // Select domain
      const domainSelector = page.locator('select').first();
      await domainSelector.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      console.log('✅ Filled all required fields');

      // CRITICAL TEST: Check if button is enabled
      console.log('\n🎯 Step 11: CRITICAL TEST - Checking if Suivant button is enabled...');
      await page.screenshot({ path: 'test-results/before-suivant-check.png' });

      const isDisabled = await suivantButton.isDisabled();
      console.log('  Button disabled state:', isDisabled);

      if (isDisabled) {
        console.log('  ❌ FAIL: Button is still disabled after name became unique!');
        await page.screenshot({ path: 'test-results/button-still-disabled.png' });

        // Try to log wizard data
        const wizardState = await page.evaluate(() => {
          return JSON.stringify((window as any).__WIZARD_DATA__ || 'not found', null, 2);
        });
        console.log('  Wizard state:', wizardState);
      } else {
        console.log('  ✅ SUCCESS: Button is enabled as expected!');
      }

      await expect(suivantButton).not.toBeDisabled({ timeout: 5000 });
      console.log('✅ Suivant button is ENABLED (correct)');

      // Verify we can click it
      await suivantButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Successfully clicked Suivant button');

      console.log('\n' + '='.repeat(80));
      console.log('🎉 TEST PASSED: Button behavior working correctly!');
      console.log('='.repeat(80));

    } catch (error) {
      console.error('\n❌ TEST FAILED:', error.message);
      await page.screenshot({ path: '/tmp/button-test-error.png', fullPage: true });
      throw error;
    }
  });
});
