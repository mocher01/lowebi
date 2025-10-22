import { test, expect } from '@playwright/test';

test('Issue #146: Duplicate Site Name Detection', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes timeout

  console.log('\n🔍 ISSUE #146: DUPLICATE SITE NAME DETECTION TEST');
  console.log('='.repeat(80));

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('checkDuplicate') || text.includes('Duplicate') || text.includes('🔍') || text.includes('📡') || text.includes('⚠️') || text.includes('✅')) {
      console.log(`  [BROWSER] ${text}`);
    }
  });

  try {
    // Step 1: Login
    console.log('\n🔐 Step 1: Authentication...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Customer login successful');

    // Step 2: Navigate to My Sites
    console.log('\n🏠 Step 2: Navigate to My Sites...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(3000);

    // Verify we're on sites page
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('🔐 Redirected to login, need to login again...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Administrator2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      await page.goto('https://logen.locod-ai.com/sites');
      await page.waitForTimeout(2000);
    }

    console.log('✅ On My Sites page');

    // Step 3: Create New Site
    console.log('\n➕ Step 3: Create New Site...');
    await page.click('text="Create New Site"');
    await page.waitForTimeout(2000);
    await page.click('a[href="/wizard?new=true"]');
    await page.waitForTimeout(3000);

    // Check checkbox and start wizard
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Commencer")');
    await page.waitForTimeout(3000);
    console.log('✅ Started wizard');

    // Step 4: Navigate to business info step (Step 2)
    console.log('\n➡️ Step 4: Navigate to business info step...');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(2000);

    // Step 5: Type duplicate site name "okidoc"
    console.log('\n✏️ Step 5: Testing duplicate detection with "okidoc"...');

    const businessNameField = page.locator('input[placeholder*="Entreprise"], input[placeholder*="entreprise"]').first();
    const fieldExists = await businessNameField.count();

    if (fieldExists > 0) {
      await businessNameField.clear();
      console.log('Typing "okidoc" (duplicate name)...');
      await businessNameField.fill('okidoc');
      console.log('✅ Typed "okidoc"');
    } else {
      throw new Error('Business name field not found!');
    }

    // Step 6: Wait for duplicate check to complete
    console.log('\n⏳ Step 6: Waiting for duplicate check API call...');
    await page.waitForTimeout(4000); // Give time for API call + UI update

    // Step 7: Check for duplicate warning
    console.log('\n🔍 Step 7: Checking for duplicate warning...');

    const duplicateWarning = page.locator('div#duplicateError, div:has-text("Ce nom de site est déjà utilisé")');
    const warningVisible = await duplicateWarning.isVisible().catch(() => false);

    if (warningVisible) {
      console.log('✅✅✅ DUPLICATE WARNING IS VISIBLE! ✅✅✅');

      const warningText = await duplicateWarning.textContent();
      console.log('Warning text:', warningText);

      // Check for suggestion button
      const suggestionButton = page.locator('button:has-text("Utiliser")');
      const suggestionVisible = await suggestionButton.isVisible().catch(() => false);

      if (suggestionVisible) {
        const suggestionText = await suggestionButton.textContent();
        console.log('✅ Suggestion button found:', suggestionText);

        // Click suggestion
        console.log('\n👆 Step 8: Clicking suggestion button...');
        await suggestionButton.click();
        await page.waitForTimeout(2000);

        // Verify warning disappeared
        const warningStillVisible = await duplicateWarning.isVisible().catch(() => false);
        if (!warningStillVisible) {
          console.log('✅ Warning disappeared after accepting suggestion!');
        }

        // Get updated site name
        const updatedValue = await businessNameField.inputValue();
        console.log('Updated site name:', updatedValue);

        expect(updatedValue).not.toBe('okidoc');
        console.log('✅ Site name was updated to suggestion');
      } else {
        console.log('⚠️ Suggestion button NOT found');
      }

      expect(warningVisible).toBeTruthy();
    } else {
      console.log('❌❌❌ DUPLICATE WARNING NOT VISIBLE! ❌❌❌');

      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/duplicate-test-failed.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/duplicate-test-failed.png');

      throw new Error('Duplicate warning did not appear!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 TEST PASSED: Duplicate detection working correctly!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: '/tmp/duplicate-test-error.png', fullPage: true });
    throw error;
  }
});

test('Issue #146: Unique Site Name (No Warning)', async ({ page }) => {
  test.setTimeout(120000);

  console.log('\n✨ ISSUE #146: UNIQUE NAME TEST (NO WARNING)');
  console.log('='.repeat(80));

  try {
    // Login
    console.log('\n🔐 Step 1: Authentication...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to sites
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(3000);

    // Create new site
    await page.click('text="Create New Site"');
    await page.waitForTimeout(2000);
    await page.click('a[href="/wizard?new=true"]');
    await page.waitForTimeout(3000);

    // Start wizard
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Commencer")');
    await page.waitForTimeout(3000);

    // Navigate to Step 2
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(2000);

    // Type unique name
    const uniqueName = 'unique-site-' + Date.now();
    console.log('\n✏️ Step 2: Typing unique name:', uniqueName);

    const businessNameField = page.locator('input[placeholder*="Entreprise"], input[placeholder*="entreprise"]').first();
    await businessNameField.clear();
    await businessNameField.fill(uniqueName);
    console.log('✅ Typed unique name');

    // Wait for check
    await page.waitForTimeout(4000);

    // Verify NO warning
    const duplicateWarning = page.locator('div#duplicateError, div:has-text("Ce nom de site est déjà utilisé")');
    const warningVisible = await duplicateWarning.isVisible().catch(() => false);

    if (!warningVisible) {
      console.log('✅✅✅ NO WARNING for unique name (correct!) ✅✅✅');
    } else {
      console.log('❌ WARNING appeared for unique name (incorrect!)');
    }

    expect(warningVisible).toBeFalsy();

    console.log('\n' + '='.repeat(80));
    console.log('🎉 TEST PASSED: Unique names accepted correctly!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    throw error;
  }
});
