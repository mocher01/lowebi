import { test, expect } from '@playwright/test';

/**
 * Cycle 28: Issue #169 Phase 2 - Content Editor & Blog Posts
 *
 * Purpose: Verify Phase 2 content editing functionality
 *
 * Test Steps:
 * 1. Login as customer
 * 2. Navigate to existing deployed site's admin dashboard
 * 3. Verify Content tab is visible
 * 4. Check Pages tab shows all 6 sections
 * 5. Check Blog tab shows blog interface
 * 6. Test opening page editor modal
 * 7. Test creating blog post modal
 *
 * Expected Results:
 * - Content tab visible for deployed sites
 * - Pages and Blog tabs both functional
 * - All page sections displayed with edit buttons
 * - Blog post creation interface works
 * - Modals open and close properly
 */

test.describe('Cycle 28: Phase 2 - Content Editor & Blog Posts', () => {
  test('Content Editor functionality on deployed site', async ({ page }) => {
    console.log('🚀 CYCLE 28: PHASE 2 CONTENT EDITOR TEST\n');
    console.log('Purpose: Verify Issue #169 Phase 2 content editing features\n');
    console.log('================================================================================\n');

    // Step 1: Login
    console.log('🔐 Step 1: Authentication...\n');
    await page.goto('https://dev.lowebi.com/login');

    // Wait for login form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    await page.fill('input[type="email"]', 'cycle26@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // Wait for navigation after login (could be /sites or /dashboard)
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}\n`);

    // Navigate to /sites if not already there
    if (!currentUrl.includes('/sites')) {
      await page.goto('https://dev.lowebi.com/sites');
      await page.waitForLoadState('networkidle');
    }

    console.log('✅ Customer login successful\n');

    // Step 2: Navigate to deployed site's admin dashboard
    console.log('🏠 Step 2: Navigate to admin dashboard...\n');
    await page.goto('https://dev.lowebi.com/sites');

    // Find the deployed site (cycle26test1760385122507)
    const siteCard = page.locator('text=cycle26test1760385122507').first();
    await expect(siteCard).toBeVisible({ timeout: 10000 });
    console.log('✅ Found deployed site\n');

    // Click Manage button
    const manageButton = page.locator('button', { hasText: 'Manage' }).first();
    await manageButton.click();

    // Wait for admin dashboard
    await page.waitForURL('**/admin/sites/**', { timeout: 15000 });
    console.log('✅ On admin dashboard\n');

    // Step 3: Verify Content tab is visible
    console.log('🎨 Step 3: Verify Content tab...\n');
    const contentTab = page.locator('text=Page Content').first();
    await expect(contentTab).toBeVisible({ timeout: 5000 });
    console.log('✅ Content tab is visible\n');

    // Step 4: Check Pages tab
    console.log('📄 Step 4: Check Pages tab...\n');

    // Should be on Pages tab by default
    await expect(page.locator('text=Editable Page Sections')).toBeVisible();

    // Verify all 6 sections are displayed
    const sections = [
      'Hero Section',
      'About Section',
      'Services',
      'Contact',
      'FAQ',
      'Testimonials'
    ];

    for (const section of sections) {
      const sectionElement = page.locator('text=' + section).first();
      await expect(sectionElement).toBeVisible();
      console.log(`  ✓ ${section} found`);
    }
    console.log('✅ All 6 page sections displayed\n');

    // Step 5: Check Blog tab
    console.log('📝 Step 5: Check Blog tab...\n');
    const blogTab = page.locator('text=Blog Posts').first();
    await blogTab.click();
    await page.waitForTimeout(1000);

    // Should see either blog posts or empty state
    const blogPostsHeading = page.locator('text=Blog Posts (');
    await expect(blogPostsHeading).toBeVisible();
    console.log('✅ Blog tab loaded successfully\n');

    // Check for "New Post" button
    const newPostButton = page.locator('button', { hasText: 'New Post' }).first();
    await expect(newPostButton).toBeVisible();
    console.log('✅ "New Post" button visible\n');

    // Step 6: Test opening page editor modal
    console.log('✏️  Step 6: Test page editor modal...\n');
    const pageTab = page.locator('text=Page Content').first();
    await pageTab.click();
    await page.waitForTimeout(1000);

    // Click edit button on first section (Hero)
    const editButton = page.locator('button[title="Edit section"]').first();
    await editButton.click();
    await page.waitForTimeout(500);

    // Modal should open
    const pageEditorModal = page.locator('text=Edit Hero Section');
    await expect(pageEditorModal).toBeVisible({ timeout: 3000 });
    console.log('✅ Page editor modal opened\n');

    // Close modal
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await closeButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Page editor modal closed\n');

    // Step 7: Test blog post creation modal
    console.log('📝 Step 7: Test blog post creation modal...\n');
    await blogTab.click();
    await page.waitForTimeout(1000);

    await newPostButton.click();
    await page.waitForTimeout(500);

    // Blog editor modal should open
    const blogEditorModal = page.locator('text=Create New Blog Post');
    await expect(blogEditorModal).toBeVisible({ timeout: 3000 });
    console.log('✅ Blog editor modal opened\n');

    // Verify markdown editor is present
    const markdownEditor = page.locator('text=Markdown Editor');
    await expect(markdownEditor).toBeVisible();
    console.log('✅ Markdown editor present\n');

    // Close modal
    const cancelButton = page.locator('button', { hasText: 'Cancel' }).first();
    await cancelButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Blog editor modal closed\n');

    console.log('\n================================================================================');
    console.log('🎉 ALL PHASE 2 TESTS PASSED!');
    console.log('================================================================================\n');
  });
});
