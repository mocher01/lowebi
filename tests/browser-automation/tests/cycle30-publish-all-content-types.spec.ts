import { test, expect } from '@playwright/test';

test.describe('Cycle 30: Publish All Content Types', () => {
  let siteDomain: string;
  const testTimestamp = Date.now();

  test('should update hero, create blog article, and verify both appear after publish', async ({ page }) => {
    // Step 1: Login via UI
    console.log('🔐 Logging in...');
    await page.goto('https://dev.lowebi.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Login successful');

    // Step 2: Find deployed site with Manage button
    console.log('🔍 Finding deployed site...');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForLoadState('networkidle');

    const manageRow = page.locator('tr:has(button:has-text("Manage"))').first();
    const domainLink = manageRow.locator('a[href^="https://"]').first();
    siteDomain = await domainLink.textContent() || '';
    console.log(`✅ Found site: ${siteDomain}`);

    await manageRow.locator('button:has-text("Manage")').click();
    await page.waitForLoadState('networkidle');

    // Step 3: Go to Content tab
    console.log('📑 Opening Content tab...');
    await page.click('button:has-text("Content"), a:has-text("Content")');
    await page.waitForTimeout(2000);

    // Step 4: Update Hero Section
    console.log('✏️ Updating hero section...');
    const newHeroTitle = `HERO UPDATE ${testTimestamp}`;
    const editButton = page.locator('button[title="Edit section"]').first();
    await editButton.click();
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.clear();
    await titleInput.fill(newHeroTitle);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    console.log(`✅ Hero updated: "${newHeroTitle}"`);

    // Step 5: Create New Blog Article
    console.log('📝 Creating new blog article...');
    await page.click('button:has-text("Blog Posts"), a:has-text("Blog Posts")');
    await page.waitForTimeout(1500);

    // Click Add/New/Create button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    await addButton.click();
    await page.waitForTimeout(1000);

    const newBlogTitle = `Test Article ${testTimestamp}`;
    const newBlogExcerpt = `This is a test article created at ${testTimestamp}`;
    const newBlogContent = `# Test Article ${testTimestamp}\n\nThis article should appear on the live site after publishing.\n\nCreated at: ${testTimestamp}`;

    // Fill in blog form
    await page.fill('input[placeholder="Enter post title"]', newBlogTitle);
    await page.fill('textarea[placeholder="Brief summary of your post (optional)"]', newBlogExcerpt);

    // Fill content in markdown editor (CodeMirror)
    const contentTextarea = page.locator('.cm-content[contenteditable="true"], textarea[placeholder*="Markdown" i]').first();
    await contentTextarea.click();
    await contentTextarea.fill(newBlogContent);

    // Set status to published using radio button
    await page.click('input[type="radio"][value="published"]');
    console.log('✅ Set status to published');

    // Save blog post - look for "Create Post" or "Update Post" button
    await page.click('button:has-text("Create Post"), button:has-text("Update Post")');
    await page.waitForTimeout(2000);
    console.log(`✅ Blog article created: "${newBlogTitle}"`);

    // Step 6: Go back to Page Content and click Publish
    console.log('🔄 Going back to Page Content...');
    await page.click('button:has-text("Page Content"), a:has-text("Page Content")');
    await page.waitForTimeout(1000);

    // Step 7: Click Publish Changes
    console.log('🚀 Publishing changes...');
    page.once('dialog', dialog => {
      console.log(`📋 Confirming: ${dialog.message()}`);
      dialog.accept();
    });

    await page.click('button:has-text("Publish Changes")');
    await page.waitForTimeout(2000);

    // Wait for publish to complete (2-3 minutes)
    console.log('⏳ Waiting for site rebuild (2-3 minutes)...');
    await page.waitForTimeout(150000); // 2.5 minutes

    // Step 8: Verify changes on live site
    console.log('🔍 Verifying changes on live site...');
    const verifyPage = await page.context().newPage();

    let heroUpdated = false;
    let blogAppeared = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && (!heroUpdated || !blogAppeared)) {
      try {
        console.log(`🔄 Verification attempt ${attempts + 1}/${maxAttempts}...`);

        await verifyPage.goto(`https://${siteDomain}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        // Check hero section
        const currentHero = await verifyPage.locator('h1').first().textContent() || '';
        heroUpdated = currentHero.includes(`${testTimestamp}`);
        console.log(`  📝 Hero: ${heroUpdated ? '✅ UPDATED' : '❌ NOT UPDATED'} - "${currentHero}"`);

        // Check blog page for new article
        await verifyPage.goto(`https://${siteDomain}/blog`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        const pageContent = await verifyPage.content();
        blogAppeared = pageContent.includes(`Test Article ${testTimestamp}`) || pageContent.includes(`test-article-${testTimestamp}`);

        console.log(`  📝 Blog: ${blogAppeared ? '✅ APPEARED' : '❌ NOT APPEARED'}`);

        if (heroUpdated && blogAppeared) {
          console.log('✅ Both changes verified!');
          break;
        }
      } catch (e) {
        console.log(`⚠️ Attempt ${attempts + 1} failed: ${e.message}`);
      }

      if (!heroUpdated || !blogAppeared) {
        console.log('⏳ Waiting 10 seconds before retry...');
        await page.waitForTimeout(10000);
      }
      attempts++;
    }

    await verifyPage.close();

    // Step 9: Assertions
    console.log('\n📊 FINAL RESULTS:');
    console.log(`  Hero Section Updated: ${heroUpdated ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  New Blog Article Appeared: ${blogAppeared ? '✅ PASS' : '❌ FAIL'}`);

    expect(heroUpdated).toBeTruthy();
    expect(blogAppeared).toBeTruthy();

    console.log('🎉 All content changes successfully published!');
  });
});
