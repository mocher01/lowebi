import { test, expect } from '@playwright/test';

test.describe('Duplicate Site Name Detection - Immediate Warning', () => {

  test('should show duplicate warning immediately when typing existing site name', async ({ page }) => {
    // 1. Login
    console.log('Step 1: Logging in as test@example.com...');
    await page.goto('http://localhost:7611/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard/sites page
    await page.waitForURL(/\/(dashboard|sites)/, { timeout: 10000 });
    console.log('✅ Login successful');

    // 2. Navigate to wizard
    console.log('Step 2: Starting new wizard...');
    await page.goto('http://localhost:7611/wizard');
    await page.waitForLoadState('networkidle');

    // 3. Get to Step 2 (Business Info)
    console.log('Step 3: Navigating to Step 2 (Business Info)...');

    // Check if we're on welcome step (Step 1)
    const welcomeHeader = await page.locator('h1, h2').filter({ hasText: /bienvenue|welcome/i }).first();
    if (await welcomeHeader.isVisible()) {
      console.log('On welcome step, clicking Next...');
      await page.click('button:has-text("Suivant"), button:has-text("Next")');
      await page.waitForTimeout(500);
    }

    // Verify we're on Business Info step
    const businessInfoHeader = await page.locator('h2:has-text("Informations sur votre Entreprise")');
    await expect(businessInfoHeader).toBeVisible({ timeout: 5000 });
    console.log('✅ On Business Info step (Step 2)');

    // 4. Clear any existing site name
    const siteNameInput = page.locator('input[placeholder*="Mon Entreprise"], input[placeholder*="Entreprise"]').first();
    await siteNameInput.clear();
    console.log('Cleared site name field');

    // 5. Type "okidoc" (which exists in the database)
    console.log('Step 4: Typing "okidoc" (duplicate site name)...');
    await siteNameInput.fill('okidoc');

    // 6. Wait for duplicate check API call and verify warning appears IMMEDIATELY
    console.log('Step 5: Waiting for duplicate warning...');

    // The warning should appear within 2 seconds (no 500ms debounce!)
    const duplicateWarning = page.locator('div#duplicateError, div:has-text("Ce nom de site est déjà utilisé")');
    await expect(duplicateWarning).toBeVisible({ timeout: 3000 });
    console.log('✅ Duplicate warning appeared!');

    // 7. Verify warning message
    const warningText = await duplicateWarning.textContent();
    expect(warningText).toContain('Ce nom de site est déjà utilisé');
    console.log('✅ Warning message is correct:', warningText);

    // 8. Verify suggestion button exists
    const suggestionButton = page.locator('button:has-text("Utiliser")');
    await expect(suggestionButton).toBeVisible({ timeout: 2000 });
    const suggestionText = await suggestionButton.textContent();
    console.log('✅ Suggestion button found:', suggestionText);

    // 9. Click suggestion button
    console.log('Step 6: Clicking suggestion button...');
    await suggestionButton.click();
    await page.waitForTimeout(500);

    // 10. Verify warning disappears
    console.log('Step 7: Verifying warning disappears...');
    await expect(duplicateWarning).not.toBeVisible({ timeout: 3000 });
    console.log('✅ Warning disappeared!');

    // 11. Verify site name was updated with suggestion
    const updatedSiteName = await siteNameInput.inputValue();
    console.log('Updated site name:', updatedSiteName);
    expect(updatedSiteName).not.toBe('okidoc'); // Should be different from original
    expect(updatedSiteName).toMatch(/okidoc-\d+/); // Should be okidoc-1, okidoc-2, etc.
    console.log('✅ Site name updated to suggestion:', updatedSiteName);

    // 12. Verify status indicator shows ready
    const statusIndicator = page.locator('span:has-text("Étape prête")');
    await expect(statusIndicator).toBeVisible({ timeout: 2000 });
    console.log('✅ Status indicator shows "Étape prête"');

    console.log('\n🎉 All tests passed! Duplicate detection works immediately.');
  });

  test('should NOT show warning for unique site name', async ({ page }) => {
    // 1. Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:7611/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|sites)/, { timeout: 10000 });

    // 2. Navigate to wizard
    console.log('Step 2: Starting new wizard...');
    await page.goto('http://localhost:7611/wizard');
    await page.waitForLoadState('networkidle');

    // 3. Get to Step 2
    const welcomeHeader = await page.locator('h1, h2').filter({ hasText: /bienvenue|welcome/i }).first();
    if (await welcomeHeader.isVisible()) {
      await page.click('button:has-text("Suivant"), button:has-text("Next")');
      await page.waitForTimeout(500);
    }

    // 4. Type unique site name
    const uniqueName = `unique-site-${Date.now()}`;
    console.log(`Step 3: Typing unique site name: ${uniqueName}...`);
    const siteNameInput = page.locator('input[placeholder*="Mon Entreprise"], input[placeholder*="Entreprise"]').first();
    await siteNameInput.clear();
    await siteNameInput.fill(uniqueName);

    // 5. Wait a moment for any API call
    await page.waitForTimeout(2000);

    // 6. Verify NO warning appears
    console.log('Step 4: Verifying no duplicate warning...');
    const duplicateWarning = page.locator('div#duplicateError, div:has-text("Ce nom de site est déjà utilisé")');
    await expect(duplicateWarning).not.toBeVisible();
    console.log('✅ No warning appeared for unique name');

    // 7. Verify status indicator shows ready (assuming businessType is filled)
    // Note: We need to fill businessType too for the status to be ready
    const businessTypeInput = page.locator('input[placeholder*="Traduction"]').first();
    await businessTypeInput.fill('Test Business');

    await page.waitForTimeout(500);
    const statusIndicator = page.locator('span:has-text("Étape prête")');
    await expect(statusIndicator).toBeVisible({ timeout: 2000 });
    console.log('✅ Status indicator shows "Étape prête" for unique name');

    console.log('\n🎉 Unique name test passed!');
  });
});
