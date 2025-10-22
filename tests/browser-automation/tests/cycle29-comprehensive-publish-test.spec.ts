import { test, expect } from '@playwright/test';

test.describe('Cycle 29: Comprehensive Publish Test - All Content Types', () => {
  let siteDomain: string;
  let testTimestamp: number;

  test('should publish ALL content changes correctly', async ({ page }) => {
    testTimestamp = Date.now();

    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Login successful');

    // Step 2: Find site with Manage button
    console.log('🔍 Finding site...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForLoadState('networkidle');

    const manageRow = page.locator('tr:has(button:has-text("Manage"))').first();
    const domainLink = manageRow.locator('a[href^="https://"]').first();
    siteDomain = await domainLink.textContent() || '';
    console.log(`✅ Found site: ${siteDomain}`);

    await manageRow.locator('button:has-text("Manage")').click();
    await page.waitForLoadState('networkidle');

    // Step 3: Click Content tab
    console.log('📑 Opening Content tab...');
    await page.click('button:has-text("Content"), a:has-text("Content")');
    await page.waitForTimeout(2000);

    // Step 4: Record original live site content
    console.log('📸 Capturing original live site state...');
    const originalPage = await page.context().newPage();
    await originalPage.goto(`https://${siteDomain}`, { timeout: 30000 });
    await originalPage.waitForLoadState('networkidle');

    const originalHero = await originalPage.locator('h1').first().textContent() || '';
    const originalBlogCount = await originalPage.locator('article, .blog-card, [class*="blog"]').count();

    console.log(`📝 Original hero: "${originalHero}"`);
    console.log(`📝 Original blog article count: ${originalBlogCount}`);
    await originalPage.close();

    // Step 5: Edit Hero Section
    console.log('✏️ Editing hero section...');
    const newHeroTitle = `HERO TEST ${testTimestamp}`;
    const editButton = page.locator('button[title="Edit section"]').first();
    await editButton.click();
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.clear();
    await titleInput.fill(newHeroTitle);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    console.log(`✅ Hero updated: "${newHeroTitle}"`);

    // Step 6: Add a new blog article
    console.log('📝 Adding new blog article...');
    await page.click('button:has-text("Blog Posts"), a:has-text("Blog Posts")');
    await page.waitForTimeout(1000);

    // Click "Add New Post" or similar button
    const addPostButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    await addPostButton.click();
    await page.waitForTimeout(1000);

    const newBlogTitle = `Blog Article ${testTimestamp}`;
    const newBlogContent = `This is a test blog article created at ${testTimestamp}. It should appear on the live site after publishing.`;

    await page.fill('input[name="title"], input[placeholder*="title" i]', newBlogTitle);
    await page.fill('textarea[name="excerpt"], textarea[placeholder*="excerpt" i]', `Test excerpt for ${testTimestamp}`);
    await page.fill('textarea[name="content"], textarea[placeholder*="content" i], .CodeMirror textarea, [contenteditable="true"]', newBlogContent);

    // Set status to published
    const statusSelect = page.locator('select[name="status"], [role="combobox"]:has-text("Status")');
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('published');
    }

    // Save the blog post
    await page.click('button:has-text("Save"), button:has-text("Create"), button:has-text("Publish")');
    await page.waitForTimeout(2000);
    console.log(`✅ Blog article created: "${newBlogTitle}"`);

    // Step 7: Go back to Page Content tab for publish button
    await page.click('button:has-text("Page Content"), a:has-text("Page Content")');
    await page.waitForTimeout(1000);

    // Step 8: Click Publish Changes
    console.log('🚀 Publishing changes...');
    page.once('dialog', dialog => {
      console.log(`📋 Confirming: ${dialog.message()}`);
      dialog.accept();
    });

    await page.click('button:has-text("Publish Changes")');
    await page.waitForTimeout(1000);

    // Wait for full rebuild (2-3 minutes)
    console.log('⏳ Waiting for full site rebuild (2-3 minutes)...');
    await page.waitForTimeout(120000); // 2 minutes

    // Step 9: Verify changes on live site
    console.log('🔍 Verifying changes on live site...');
    const verifyPage = await page.context().newPage();

    let heroUpdated = false;
    let blogAppeared = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && (!heroUpdated || !blogAppeared)) {
      try {
        await verifyPage.goto(`https://${siteDomain}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        // Check hero section
        const currentHero = await verifyPage.locator('h1').first().textContent() || '';
        heroUpdated = currentHero.includes(newHeroTitle);
        console.log(`📝 Hero check (attempt ${attempts + 1}): ${heroUpdated ? '✅' : '❌'} "${currentHero}"`);

        // Check for new blog article
        const blogTitles = await verifyPage.locator('h2, h3, .blog-title, article h2, article h3').allTextContents();
        blogAppeared = blogTitles.some(title => title.includes(`Blog Article ${testTimestamp}`));
        console.log(`📝 Blog check (attempt ${attempts + 1}): ${blogAppeared ? '✅' : '❌'} Found ${blogTitles.length} blog titles`);

        if (heroUpdated && blogAppeared) {
          break;
        }
      } catch (e) {
        console.log(`⚠️ Attempt ${attempts + 1} failed, retrying...`);
      }

      await page.waitForTimeout(5000);
      attempts++;
    }

    await verifyPage.close();

    // Step 10: Assertions
    console.log('\n📊 FINAL RESULTS:');
    console.log(`  Hero Section Updated: ${heroUpdated ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  New Blog Article Appeared: ${blogAppeared ? '✅ PASS' : '❌ FAIL'}`);

    expect(heroUpdated).toBeTruthy();
    expect(blogAppeared).toBeTruthy();

    console.log('✅ All content changes successfully published!');
  });
});
