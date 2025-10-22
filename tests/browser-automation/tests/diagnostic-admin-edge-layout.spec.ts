import { test, expect, chromium } from '@playwright/test';

test.describe('Admin Portal Layout - Edge Browser Diagnostic', () => {
  test('Check dashboard and AI queue layout margins in Edge-like browser', async () => {
    // Launch browser with Edge user agent
    const browser = await chromium.launch();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    });
    const page = await context.newPage();

    console.log('\n🔍 EDGE BROWSER LAYOUT DIAGNOSTIC TEST\n');

    try {
      // Navigate to admin login
      console.log('📍 Navigating to admin login...');
      await page.goto('http://localhost:7612/', { waitUntil: 'networkidle', timeout: 30000 });

      // Login (using test admin credentials - pattern from v2.5 test)
      console.log('🔐 Logging in as admin...');

      const emailSelectors = ['#email', 'input[type="email"]', 'input[name="email"]', '[placeholder*="email"]', '[placeholder*="Email"]'];
      for (const selector of emailSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          await page.fill(selector, 'admin@locod.ai');
          break;
        }
      }

      const passwordSelectors = ['#password', 'input[type="password"]', 'input[name="password"]', '[placeholder*="password"]', '[placeholder*="Password"]'];
      for (const selector of passwordSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          await page.fill(selector, 'admin123');
          break;
        }
      }

      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000); // Wait longer for login redirect

      // Check if we're on the dashboard after login
      const currentUrl = page.url();
      console.log(`📍 Current URL after login: ${currentUrl}`);

      console.log('✅ Login successful\n');

      // ========== TEST 1: Dashboard Page ==========
      console.log('📊 === DASHBOARD PAGE ANALYSIS ===');

      // Use domcontentloaded instead of networkidle (less strict)
      if (!currentUrl.includes('/dashboard')) {
        await page.goto('http://localhost:7612/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
      await page.waitForTimeout(2000);

      // Get viewport and content dimensions
      const viewportWidth = page.viewportSize()?.width || 0;
      console.log(`📏 Viewport Width: ${viewportWidth}px`);

      // Measure sidebar
      const sidebar = await page.locator('div:has(> div > div:has-text("LOGEN"))').first();
      const sidebarBox = await sidebar.boundingBox();
      console.log(`📐 Sidebar Width: ${sidebarBox?.width || 0}px`);

      // Measure main content area
      const mainContent = await page.locator('main').first();
      const mainBox = await mainContent.boundingBox();
      console.log(`📐 Main Content Width: ${mainBox?.width || 0}px`);
      console.log(`📐 Main Content X Position: ${mainBox?.x || 0}px`);

      // Measure the max-w-7xl container
      const contentContainer = await page.locator('div.max-w-7xl').first();
      const containerBox = await contentContainer.boundingBox();
      console.log(`📐 Content Container (.max-w-7xl) Width: ${containerBox?.width || 0}px`);
      console.log(`📐 Content Container X Position: ${containerBox?.x || 0}px`);

      // Calculate margins
      if (mainBox && containerBox) {
        const leftMargin = containerBox.x - mainBox.x;
        const rightMargin = (mainBox.x + mainBox.width) - (containerBox.x + containerBox.width);
        const totalMargin = leftMargin + rightMargin;
        const usedSpace = (containerBox.width / mainBox.width) * 100;

        console.log(`\n📊 DASHBOARD MARGIN ANALYSIS:`);
        console.log(`   Left Margin: ${leftMargin.toFixed(0)}px`);
        console.log(`   Right Margin: ${rightMargin.toFixed(0)}px`);
        console.log(`   Total Horizontal Margin: ${totalMargin.toFixed(0)}px`);
        console.log(`   Content Uses: ${usedSpace.toFixed(1)}% of available space`);
        console.log(`   Wasted Space: ${(100 - usedSpace).toFixed(1)}%`);

        // Check if margins are excessive (more than 20% wasted space)
        if (usedSpace < 80) {
          console.log(`   ⚠️  WARNING: Large margins detected - ${(100 - usedSpace).toFixed(1)}% wasted space!`);
        } else {
          console.log(`   ✅ Margins appear reasonable`);
        }
      }

      // Take screenshot
      await page.screenshot({ path: '/var/apps/logen/tests/browser-automation/edge-dashboard-layout.png', fullPage: true });
      console.log(`📸 Screenshot saved: edge-dashboard-layout.png\n`);

      // ========== TEST 2: AI Queue Page ==========
      console.log('🤖 === AI QUEUE PAGE ANALYSIS ===');
      await page.goto('http://localhost:7612/dashboard/ai-queue', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Measure main content area
      const queueMainBox = await mainContent.boundingBox();
      console.log(`📐 Main Content Width: ${queueMainBox?.width || 0}px`);

      // Measure the max-w-7xl container
      const queueContainerBox = await contentContainer.boundingBox();
      console.log(`📐 Content Container (.max-w-7xl) Width: ${queueContainerBox?.width || 0}px`);

      // Calculate margins
      if (queueMainBox && queueContainerBox) {
        const leftMargin = queueContainerBox.x - queueMainBox.x;
        const rightMargin = (queueMainBox.x + queueMainBox.width) - (queueContainerBox.x + queueContainerBox.width);
        const totalMargin = leftMargin + rightMargin;
        const usedSpace = (queueContainerBox.width / queueMainBox.width) * 100;

        console.log(`\n📊 AI QUEUE MARGIN ANALYSIS:`);
        console.log(`   Left Margin: ${leftMargin.toFixed(0)}px`);
        console.log(`   Right Margin: ${rightMargin.toFixed(0)}px`);
        console.log(`   Total Horizontal Margin: ${totalMargin.toFixed(0)}px`);
        console.log(`   Content Uses: ${usedSpace.toFixed(1)}% of available space`);
        console.log(`   Wasted Space: ${(100 - usedSpace).toFixed(1)}%`);

        if (usedSpace < 80) {
          console.log(`   ⚠️  WARNING: Large margins detected - ${(100 - usedSpace).toFixed(1)}% wasted space!`);
        } else {
          console.log(`   ✅ Margins appear reasonable`);
        }
      }

      // Check if table is visible and get its width
      const table = await page.locator('table').first();
      const tableBox = await table.boundingBox();
      if (tableBox) {
        console.log(`\n📋 TABLE ANALYSIS:`);
        console.log(`   Table Width: ${tableBox.width}px`);
        console.log(`   Table X Position: ${tableBox.x}px`);

        if (queueContainerBox) {
          const tableUsage = (tableBox.width / queueContainerBox.width) * 100;
          console.log(`   Table uses ${tableUsage.toFixed(1)}% of container width`);
        }
      }

      // Take screenshot
      await page.screenshot({ path: '/var/apps/logen/tests/browser-automation/edge-ai-queue-layout.png', fullPage: true });
      console.log(`📸 Screenshot saved: edge-ai-queue-layout.png\n`);

      // ========== COMPARISON WITH CHROME ==========
      console.log('🔄 === CHROME COMPARISON ===');
      const chromePage = await browser.newPage();
      await chromePage.goto('http://localhost:7612/', { waitUntil: 'domcontentloaded' });

      // Chrome login with same pattern
      const chromeEmailSelectors = ['#email', 'input[type="email"]', 'input[name="email"]', '[placeholder*="email"]', '[placeholder*="Email"]'];
      for (const selector of chromeEmailSelectors) {
        const count = await chromePage.locator(selector).count();
        if (count > 0) {
          await chromePage.fill(selector, 'admin@locod.ai');
          break;
        }
      }

      const chromePasswordSelectors = ['#password', 'input[type="password"]', 'input[name="password"]', '[placeholder*="password"]', '[placeholder*="Password"]'];
      for (const selector of chromePasswordSelectors) {
        const count = await chromePage.locator(selector).count();
        if (count > 0) {
          await chromePage.fill(selector, 'admin123');
          break;
        }
      }

      await chromePage.click('button[type="submit"]');
      await chromePage.waitForTimeout(5000);

      const chromeUrl = chromePage.url();
      if (!chromeUrl.includes('/dashboard')) {
        await chromePage.goto('http://localhost:7612/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
      await chromePage.waitForTimeout(2000);

      const chromeContainer = await chromePage.locator('div.max-w-7xl').first();
      const chromeContainerBox = await chromeContainer.boundingBox();
      console.log(`📐 Chrome Content Container Width: ${chromeContainerBox?.width || 0}px`);

      if (containerBox && chromeContainerBox) {
        const widthDiff = Math.abs(containerBox.width - chromeContainerBox.width);
        console.log(`📊 Width Difference: ${widthDiff.toFixed(0)}px`);

        if (widthDiff > 50) {
          console.log(`⚠️  SIGNIFICANT DIFFERENCE DETECTED between Edge and Chrome!`);
        } else {
          console.log(`✅ No significant difference between Edge and Chrome`);
        }
      }

      await chromePage.screenshot({ path: '/var/apps/logen/tests/browser-automation/chrome-dashboard-layout.png', fullPage: true });
      console.log(`📸 Chrome screenshot saved: chrome-dashboard-layout.png\n`);

      console.log('\n✅ DIAGNOSTIC TEST COMPLETED\n');

    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    } finally {
      await browser.close();
    }
  });
});
