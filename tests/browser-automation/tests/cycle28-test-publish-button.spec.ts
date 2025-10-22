import { test, expect } from '@playwright/test';

test.describe('Cycle 28: Test Publish Button', () => {
  let siteId: string;
  let siteDomain: string;

  test('should publish content changes to live site', async ({ page }) => {
    // Step 0: Login
    console.log('🔐 Logging in as test@example.com...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Login successful');

    // Step 1: Navigate to My Sites and find first completed site with Manage button
    console.log('🔍 Finding site with Manage button...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForLoadState('networkidle');

    // Find first row with "Manage" button (100% complete sites)
    const manageRow = page.locator('tr:has(button:has-text("Manage"))').first();

    // Get site domain from that row
    const domainLink = manageRow.locator('a[href^="https://"]').first();
    siteDomain = await domainLink.textContent() || '';
    console.log(`✅ Found site: ${siteDomain}`);

    // Click Manage button
    await manageRow.locator('button:has-text("Manage")').click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Clicked Manage, now on admin page');

    // Step 2: Click on Content tab
    console.log('📑 Clicking Content tab...');
    await page.click('button:has-text("Content"), a:has-text("Content")');
    await page.waitForTimeout(2000);

    // Step 3: Get current hero title from live site
    console.log('🌐 Checking current live site...');
    const liveSitePage = await page.context().newPage();
    await liveSitePage.goto(`https://${siteDomain}`, { timeout: 30000 });
    await liveSitePage.waitForLoadState('networkidle');
    const originalHeroTitle = await liveSitePage.locator('h1').first().textContent();
    console.log(`📝 Original hero title: "${originalHeroTitle}"`);
    await liveSitePage.close();

    // Step 4: Edit hero section
    console.log('✏️ Editing hero section...');
    const newTitle = `PUBLISHED TEST ${Date.now()}`;

    // Find and click Edit button for Hero Section (first edit button)
    const editButton = page.locator('button[title="Edit section"]').first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Update the title in the modal
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.clear();
    await titleInput.fill(newTitle);

    // Save the changes
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    console.log(`✅ Saved new title: "${newTitle}"`);

    // Step 5: Click Publish Changes button
    console.log('🚀 Clicking Publish Changes...');

    // Confirm the dialog first
    page.once('dialog', dialog => {
      console.log(`📋 Confirming dialog: ${dialog.message()}`);
      dialog.accept();
    });

    await page.click('button:has-text("Publish Changes")');
    await page.waitForTimeout(1000);

    // Wait for publishing to complete (full rebuild: npm install + vite build + docker build takes 2-3 minutes)
    console.log('⏳ Waiting for publish to complete (this takes 2-3 minutes for full rebuild)...');
    await page.waitForTimeout(120000); // Wait 2 minutes for full site rebuild

    // Step 6: Verify changes on live site
    console.log('🔍 Checking live site for changes...');
    const verifyPage = await page.context().newPage();

    // Retry up to 10 times in case build is still finishing or container is restarting
    let attempts = 0;
    let updatedHeroTitle = '';
    while (attempts < 10) {
      try {
        await verifyPage.goto(`https://${siteDomain}`, { waitUntil: 'networkidle', timeout: 15000 });
        updatedHeroTitle = await verifyPage.locator('h1').first().textContent() || '';
        console.log(`📝 Live site hero title (attempt ${attempts + 1}): "${updatedHeroTitle}"`);

        if (updatedHeroTitle.includes(newTitle)) {
          break;
        }
      } catch (e) {
        console.log(`⚠️ Attempt ${attempts + 1} failed, retrying...`);
      }

      await page.waitForTimeout(5000); // Wait 5 seconds between retries
      attempts++;
    }

    await verifyPage.close();

    // Verify the change was published
    expect(updatedHeroTitle).toContain(newTitle);
    console.log('✅ Changes successfully published to live site!');
  });

});

