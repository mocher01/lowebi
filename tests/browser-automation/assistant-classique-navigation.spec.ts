import { test, expect, Page } from '@playwright/test';

/**
 * EXPERT QA SOLUTION: Assistant Classique Navigation Test
 * 
 * This test correctly validates the "Assistant Classique" workflow:
 * 1. Navigates to /sites/create
 * 2. Clicks "Assistant Classique" 
 * 3. Verifies navigation to /wizard?new=true
 * 4. Validates wizard initialization
 * 
 * FIXES THE ISSUES:
 * - Proper element targeting with multiple fallback selectors
 * - Correct navigation detection and waiting
 * - URL validation that expects change, not same URL
 * - Looking for wizard elements on correct page (/wizard, not /sites/create)
 */

test.describe('Assistant Classique Navigation - Expert Solution', () => {
  
  test('should navigate to wizard when clicking Assistant Classique', async ({ page }) => {
    console.log('🔍 EXPERT QA TEST: Starting Assistant Classique navigation test');
    
    // ===============================================
    // STEP 1: Navigate to sites/create page
    // ===============================================
    console.log('📍 Step 1: Navigating to sites/create page...');
    await page.goto('https://dev.lowebi.com/sites/create');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct starting page
    await expect(page).toHaveURL(/.*\/sites\/create/);
    await expect(page.locator('h1:has-text("Créer un Nouveau Site")')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot of starting state
    await page.screenshot({ path: 'test-results/expert-before-click.png', fullPage: true });
    console.log('✅ Successfully loaded sites/create page');
    
    // ===============================================
    // STEP 2: Find Assistant Classique with robust selectors
    // ===============================================
    console.log('🎯 Step 2: Finding Assistant Classique element...');
    
    // Use multiple selector strategies for maximum reliability
    const selectors = [
      'a[href="/wizard?new=true"]',                                    // Most specific
      'a:has-text("Assistant Classique")',                           // Text-based
      '.border-blue-300:has-text("Assistant Classique") a',          // Card-based
      '[data-testid="wizard-classic"] a',                            // If data-testid exists
      'a:has-text("Commencer"):near(:text("Assistant Classique"))'   // Button near title
    ];
    
    let assistantLink: any = null;
    let usedSelector = '';
    
    for (const selector of selectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          assistantLink = element;
          usedSelector = selector;
          console.log(`✅ Found Assistant Classique using: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`⏭️ Selector failed: ${selector}`);
      }
    }
    
    // Verify we found the element
    expect(assistantLink, 'Assistant Classique link should be found').not.toBeNull();
    await expect(assistantLink).toBeVisible();
    await expect(assistantLink).toBeEnabled();
    
    // Verify element properties
    const linkText = await assistantLink.textContent();
    const linkHref = await assistantLink.getAttribute('href');
    console.log(`📝 Link text: "${linkText?.trim()}"`);
    console.log(`🔗 Link href: "${linkHref}"`);
    
    // Verify it's the correct link
    expect(linkHref).toBe('/wizard?new=true');
    
    // ===============================================
    // STEP 3: Click with proper navigation handling
    // ===============================================
    console.log('👆 Step 3: Clicking Assistant Classique with navigation detection...');
    
    // Method 1: Promise.all approach (most reliable)
    const [response] = await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'networkidle', 
        timeout: 15000 
      }),
      assistantLink.click()
    ]);
    
    console.log(`🌐 Navigation response status: ${response?.status()}`);
    expect(response?.status()).toBeLessThan(400);
    
    // ===============================================
    // STEP 4: Verify navigation to wizard page  
    // ===============================================
    console.log('🔍 Step 4: Verifying navigation to wizard page...');
    
    // Check URL changed correctly
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // ✅ CORRECT: Expect URL to change to wizard page with new=true parameter
    await expect(page).toHaveURL(/.*\/wizard(\?|.*&)new=true/);
    
    // ===============================================
    // STEP 5: Verify wizard initialization
    // ===============================================
    console.log('🧙 Step 5: Verifying wizard initialization...');
    
    // Wait for wizard to fully load with multiple indicators
    await Promise.all([
      expect(page.locator('text="Assistant de Création"')).toBeVisible({ timeout: 15000 }),
      expect(page.locator('text="1"')).toBeVisible({ timeout: 15000 }), // Step 1 indicator
      page.waitForLoadState('networkidle')
    ]);
    
    // Verify 8-step navigation is present
    console.log('🔢 Checking 8-step navigation...');
    for (let i = 1; i <= 8; i++) {
      await expect(page.locator(`text="${i}"`).first()).toBeVisible({ timeout: 2000 });
    }
    
    // Verify French content is loaded
    const frenchTerms = [
      'Bienvenue',
      'Conditions', 
      'Modèle',
      'Informations'
    ];
    
    let foundFrenchTerms = 0;
    for (const term of frenchTerms) {
      try {
        await expect(page.locator(`text="${term}"`).first()).toBeVisible({ timeout: 2000 });
        foundFrenchTerms++;
      } catch (e) {
        // Term not found, continue
      }
    }
    
    console.log(`🇫🇷 Found ${foundFrenchTerms}/${frenchTerms.length} French terms`);
    expect(foundFrenchTerms).toBeGreaterThan(0);
    
    // Take screenshot of final state
    await page.screenshot({ path: 'test-results/expert-after-click.png', fullPage: true });
    
    console.log('✅ SUCCESS: Assistant Classique navigation completed successfully!');
  });
  
  test('should handle authentication and wizard state correctly', async ({ page }) => {
    console.log('🔐 Testing wizard with authentication considerations...');
    
    // Navigate and click Assistant Classique
    await page.goto('https://dev.lowebi.com/sites/create');
    await page.waitForLoadState('networkidle');
    
    const assistantLink = page.locator('a[href="/wizard?new=true"]');
    await expect(assistantLink).toBeVisible();
    
    // Click and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      assistantLink.click()
    ]);
    
    // Verify wizard loaded
    await expect(page).toHaveURL(/.*\/wizard\?new=true/);
    
    // Check if authentication is required
    const loginForm = page.locator('form:has(input[type="email"], input[type="password"])');
    const wizardContent = page.locator('text="Assistant de Création"');
    
    if (await loginForm.isVisible({ timeout: 5000 })) {
      console.log('🔐 Authentication required - wizard redirected to login');
      await expect(page).toHaveURL(/.*\/(login|auth)/);
    } else if (await wizardContent.isVisible({ timeout: 5000 })) {
      console.log('✅ Wizard loaded directly - user authenticated');
      // Verify wizard steps
      for (let i = 1; i <= 8; i++) {
        await expect(page.locator(`text="${i}"`).first()).toBeVisible();
      }
    } else {
      throw new Error('Neither login nor wizard content found - unexpected state');
    }
  });
  
  test('should debug navigation issues comprehensively', async ({ page }) => {
    console.log('🔧 DEBUGGING: Comprehensive navigation analysis...');
    
    // Set up debugging
    const logs: string[] = [];
    
    page.on('framenavigated', frame => {
      logs.push(`NAVIGATION: ${frame.url()}`);
    });
    
    page.on('console', msg => {
      logs.push(`CONSOLE: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      logs.push(`ERROR: ${error.message}`);
    });
    
    // Navigate to create page
    await page.goto('https://dev.lowebi.com/sites/create');
    await page.waitForLoadState('networkidle');
    
    // Log all Assistant Classique related elements
    const allLinks = await page.locator('a').all();
    console.log(`🔍 Found ${allLinks.length} links on page`);
    
    for (let i = 0; i < allLinks.length; i++) {
      try {
        const link = allLinks[i];
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text?.includes('Assistant') || text?.includes('Classique') || href?.includes('wizard')) {
          console.log(`🔗 Link ${i}: "${text?.trim()}" -> "${href}"`);
        }
      } catch (e) {
        // Skip broken links
      }
    }
    
    // Find and analyze target element
    const assistantLink = page.locator('a[href="/wizard?new=true"]');
    
    if (await assistantLink.isVisible({ timeout: 5000 })) {
      console.log('✅ Assistant Classique link found and visible');
      
      // Get element properties
      const boundingBox = await assistantLink.boundingBox();
      const isEnabled = await assistantLink.isEnabled();
      const text = await assistantLink.textContent();
      
      console.log('📊 Element properties:', {
        boundingBox,
        isEnabled,
        text: text?.trim()
      });
      
      // Try click
      await assistantLink.click();
      await page.waitForTimeout(3000);
      
      console.log(`📍 URL after click: ${page.url()}`);
    } else {
      console.log('❌ Assistant Classique link not found or not visible');
    }
    
    // Print all debugging logs
    console.log('\n📋 DEBUG LOGS:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
  });
});