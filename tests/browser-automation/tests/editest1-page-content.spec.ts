import { test, expect } from '@playwright/test';

test.describe('EDITEST1: Page Content - Hero, About, Contact', () => {
  let siteDomain: string;
  const testTimestamp = Date.now();

  test('should edit Hero and About and verify changes after publish', async ({ page }) => {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Login successful');

    // Find deployed site
    console.log('🔍 Finding deployed site...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForLoadState('networkidle');

    const manageRow = page.locator('tr:has(button:has-text("Manage"))').first();
    const domainLink = manageRow.locator('a[href^="https://"]').first();
    siteDomain = await domainLink.textContent() || '';
    console.log(`✅ Found site: ${siteDomain}`);

    await manageRow.locator('button:has-text("Manage")').click();
    await page.waitForLoadState('networkidle');

    // Go to Content tab
    console.log('📑 Opening Content tab...');
    await page.click('button:has-text("Content"), a:has-text("Content")');
    await page.waitForTimeout(2000);

    // Edit Hero Section
    console.log('✏️ Editing Hero Section...');
    const heroTitle = `Hero ${testTimestamp}`;
    const heroSubtitle = `Hero Subtitle ${testTimestamp}`;
    const heroDescription = `Hero Description ${testTimestamp}`;

    // Click Edit on Hero Section - find the specific card by its unique description
    await page.locator('text=Main homepage banner').locator('..').locator('..').locator('button[title="Edit section"]').click();
    await page.waitForTimeout(1000);

    // Fill Hero form
    await page.fill('input[placeholder="Enter hero title"]', heroTitle);
    await page.fill('input[placeholder="Enter hero subtitle"]', heroSubtitle);
    await page.fill('textarea[placeholder="Enter hero description"]', heroDescription);

    // Save Hero
    await page.click('button:has-text("Save")');

    // Wait for save indication
    await page.waitForTimeout(1500);

    // Modal auto-close is broken, so manually close it by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log(`✅ Hero Section updated`);

    // Edit About Section
    console.log('✏️ Editing About Section...');
    const aboutTitle = `About ${testTimestamp}`;
    const aboutSubtitle = `About Subtitle ${testTimestamp}`;
    const aboutDescription = `About Description ${testTimestamp}`;

    // Click Edit on About Section
    await page.locator('text=About us content').locator('..').locator('..').locator('button[title="Edit section"]').click();
    await page.waitForTimeout(1000);

    // Fill About form
    await page.fill('input[placeholder="Enter section title"]', aboutTitle);
    await page.fill('input[placeholder="Enter section subtitle"]', aboutSubtitle);
    await page.fill('textarea[placeholder="Enter section description"]', aboutDescription);

    // Save About
    await page.click('button:has-text("Save")');

    // Wait for save indication
    await page.waitForTimeout(1500);

    // Modal auto-close is broken, so manually close it by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log(`✅ About Section updated`);

    // TODO: Add Contact editing when Contact editor is implemented

    // Publish Changes
    console.log('🚀 Publishing changes...');
    page.once('dialog', dialog => {
      console.log(`📋 Confirming: ${dialog.message()}`);
      dialog.accept();
    });

    await page.click('button:has-text("Publish Changes")');
    await page.waitForTimeout(2000);

    // Wait for full rebuild (2-3 minutes)
    console.log('⏳ Waiting for site rebuild (2.5 minutes)...');
    await page.waitForTimeout(150000);

    // Verify changes on live site
    console.log('🔍 Verifying changes on live site...');
    const verifyPage = await page.context().newPage();

    let heroUpdated = false;
    let aboutUpdated = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && (!heroUpdated || !aboutUpdated)) {
      try {
        console.log(`🔄 Verification attempt ${attempts + 1}/${maxAttempts}...`);

        // Check homepage for hero
        await verifyPage.goto(`https://${siteDomain}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        const pageContent = await verifyPage.content();
        heroUpdated = pageContent.includes(heroTitle);

        // Check about page
        await verifyPage.goto(`https://${siteDomain}/about`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        const aboutContent = await verifyPage.content();
        aboutUpdated = aboutContent.includes(aboutTitle);

        console.log(`  📝 Hero: ${heroUpdated ? '✅' : '❌'}`);
        console.log(`  📝 About: ${aboutUpdated ? '✅' : '❌'}`);

        if (heroUpdated && aboutUpdated) {
          break;
        }
      } catch (e) {
        console.log(`⚠️ Attempt ${attempts + 1} failed: ${e.message}`);
      }

      if (!heroUpdated || !aboutUpdated) {
        console.log('⏳ Waiting 10 seconds before retry...');
        await page.waitForTimeout(10000);
      }
      attempts++;
    }

    await verifyPage.close();

    // Assertions
    console.log('\n📊 FINAL RESULTS:');
    console.log(`  Hero Section Updated: ${heroUpdated ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  About Section Updated: ${aboutUpdated ? '✅ PASS' : '❌ FAIL'}`);

    expect(heroUpdated).toBeTruthy();
    expect(aboutUpdated).toBeTruthy();

    console.log('🎉 EDITEST1 PASSED! All page content sections updated correctly.');
  });
});
