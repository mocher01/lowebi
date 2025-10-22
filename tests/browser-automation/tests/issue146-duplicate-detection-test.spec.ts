import { test, expect } from '@playwright/test';

test.describe('Issue #146: Duplicate Site Name Detection', () => {
  const TEST_EMAIL = 'playwright-test-' + Date.now() + '@example.com';
  const TEST_PASSWORD = 'TestPassword123@';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Register a new test user
    console.log('Creating test user:', TEST_EMAIL);
    const registerResponse = await request.post('http://localhost:7600/auth/register', {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        firstName: 'Playwright',
        lastName: 'Test'
      }
    });

    if (!registerResponse.ok()) {
      console.error('Registration failed:', registerResponse.status());
      const text = await registerResponse.text();
      console.error('Response:', text);
    }

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    authToken = registerData.accessToken;
    console.log('✅ Test user created successfully');

    // Create a site named "test-duplicate" so we can test duplicate detection
    console.log('Creating initial site for duplicate testing...');
    const sessionId = 'test-session-' + Date.now();
    await request.post('http://localhost:7600/customer/wizard-sessions/' + sessionId, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        siteName: 'test-duplicate',
        businessType: 'Test Business',
        siteId: 'test-duplicate'
      }
    });
    console.log('✅ Initial test site created');
  });

  test('should show duplicate warning immediately when typing existing site name', async ({ page }) => {
    console.log('\n=== TEST START: Duplicate Detection ===\n');

    // 1. Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:7601/login');
    await page.waitForLoadState('networkidle');

    // 2. Login
    console.log('Step 2: Logging in with test user...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect (could be /dashboard or /sites)
    await page.waitForURL(/\/(dashboard|sites)/, { timeout: 10000 });
    console.log('✅ Login successful, redirected to:', page.url());

    // 3. Navigate to wizard
    console.log('Step 3: Navigating to wizard...');
    await page.goto('http://localhost:7601/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 4. Navigate to Step 2 if on welcome step
    console.log('Step 4: Checking current wizard step...');
    const welcomeHeader = page.locator('h1, h2').filter({ hasText: /bienvenue|welcome/i }).first();
    const welcomeVisible = await welcomeHeader.isVisible().catch(() => false);

    if (welcomeVisible) {
      console.log('On welcome step, clicking Next...');
      const nextButton = page.locator('button').filter({ hasText: /suivant|next/i }).first();
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // 5. Verify we're on Business Info step
    console.log('Step 5: Verifying Business Info step...');
    const businessInfoHeader = page.locator('h2').filter({ hasText: /informations sur votre entreprise/i });
    await expect(businessInfoHeader).toBeVisible({ timeout: 5000 });
    console.log('✅ On Business Info step (Step 2)');

    // 6. Enable console logging to see our debug messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('checkDuplicate') || text.includes('Duplicate') || text.includes('🔍') || text.includes('📡') || text.includes('⚠️')) {
        console.log('  [BROWSER]', text);
      }
    });

    // 7. Find and clear site name input
    console.log('Step 6: Finding site name input...');
    const siteNameInput = page.locator('input').filter({
      hasText: ''
    }).and(page.locator('[placeholder*="Entreprise"], [placeholder*="entreprise"]')).first();

    if (!await siteNameInput.isVisible()) {
      // Try alternative selector
      const allInputs = await page.locator('input[type="text"]').all();
      console.log('Found', allInputs.length, 'text inputs');
      // Site name is typically the first input
      await allInputs[0].clear();
      await allInputs[0].fill('test-duplicate');
    } else {
      await siteNameInput.clear();
      await siteNameInput.fill('test-duplicate');
    }

    console.log('Step 7: Typed "test-duplicate" (duplicate name)');

    // 8. Wait for duplicate check to complete (API call + UI update)
    console.log('Step 8: Waiting for duplicate check...');
    await page.waitForTimeout(3000); // Give it time for async call

    // 9. Check for duplicate warning
    console.log('Step 9: Checking for duplicate warning...');
    const duplicateWarning = page.locator('div#duplicateError, div').filter({
      hasText: /ce nom de site est déjà utilisé/i
    });

    const warningVisible = await duplicateWarning.isVisible();

    if (warningVisible) {
      console.log('✅ DUPLICATE WARNING IS VISIBLE!');

      // Get warning text
      const warningText = await duplicateWarning.textContent();
      console.log('Warning text:', warningText);

      // Check for suggestion button
      const suggestionButton = page.locator('button').filter({ hasText: /utiliser/i });
      const suggestionVisible = await suggestionButton.isVisible();

      if (suggestionVisible) {
        const suggestionText = await suggestionButton.textContent();
        console.log('✅ Suggestion button found:', suggestionText);

        // Click suggestion button
        console.log('Step 10: Clicking suggestion button...');
        await suggestionButton.click();
        await page.waitForTimeout(1000);

        // Verify warning disappeared
        const warningStillVisible = await duplicateWarning.isVisible();
        if (!warningStillVisible) {
          console.log('✅ Warning disappeared after accepting suggestion!');
        } else {
          console.log('⚠️ Warning still visible after clicking suggestion');
        }

        // Get updated site name
        const updatedValue = await siteNameInput.inputValue();
        console.log('Updated site name:', updatedValue);

        expect(updatedValue).not.toBe('test-duplicate');
        expect(updatedValue).toMatch(/test-duplicate-\d+/);
        console.log('✅ Site name updated to suggestion');
      } else {
        console.log('❌ Suggestion button NOT found');
      }

      expect(warningVisible).toBeTruthy();
      console.log('\n✅ TEST PASSED: Duplicate detection working!\n');
    } else {
      console.log('❌ DUPLICATE WARNING NOT VISIBLE!');

      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/duplicate-test-failed.png', fullPage: true });
      console.log('Screenshot saved to /tmp/duplicate-test-failed.png');

      // Get page HTML for debugging
      const html = await page.content();
      console.log('Page HTML snippet:', html.substring(0, 500));

      expect(warningVisible).toBeTruthy();
    }
  });

  test('should NOT show warning for unique site name', async ({ page }) => {
    console.log('\n=== TEST START: Unique Name (No Warning) ===\n');

    // Login
    await page.goto('http://localhost:7601/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|sites)/, { timeout: 10000 });

    // Navigate to wizard
    await page.goto('http://localhost:7601/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get to Step 2
    const welcomeHeader = page.locator('h1, h2').filter({ hasText: /bienvenue|welcome/i }).first();
    const welcomeVisible = await welcomeHeader.isVisible().catch(() => false);
    if (welcomeVisible) {
      const nextButton = page.locator('button').filter({ hasText: /suivant|next/i }).first();
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Type unique name
    const uniqueName = 'unique-site-' + Date.now();
    console.log('Typing unique name:', uniqueName);

    const siteNameInput = page.locator('input').filter({
      hasText: ''
    }).and(page.locator('[placeholder*="Entreprise"], [placeholder*="entreprise"]')).first();

    if (!await siteNameInput.isVisible()) {
      const allInputs = await page.locator('input[type="text"]').all();
      await allInputs[0].clear();
      await allInputs[0].fill(uniqueName);
    } else {
      await siteNameInput.clear();
      await siteNameInput.fill(uniqueName);
    }

    await page.waitForTimeout(3000);

    // Verify NO warning
    const duplicateWarning = page.locator('div#duplicateError, div').filter({
      hasText: /ce nom de site est déjà utilisé/i
    });
    const warningVisible = await duplicateWarning.isVisible();

    if (!warningVisible) {
      console.log('✅ NO warning for unique name (correct!)');
    } else {
      console.log('❌ WARNING appeared for unique name (incorrect!)');
    }

    expect(warningVisible).toBeFalsy();
    console.log('\n✅ TEST PASSED: No warning for unique names!\n');
  });
});
