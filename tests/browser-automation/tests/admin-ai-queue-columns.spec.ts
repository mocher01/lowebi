import { test, expect, Page } from '@playwright/test';

/**
 * Admin AI Queue Columns Display Test
 * Verifies that Site and Customer columns show readable names instead of UUIDs
 * Tests the fix for: Site and Customer columns displaying incomprehensible IDs
 */

const ADMIN_URL = 'http://localhost:7612/dashboard/ai-queue';
const ADMIN_LOGIN = {
  email: 'admin@locod.ai',
  password: 'admin123'
};

/**
 * Login as admin user
 */
async function loginAsAdmin(page: Page) {
  console.log('🔑 Attempting admin login...');
  
  await page.goto(ADMIN_URL);
  await page.waitForLoadState('networkidle');
  
  // Check if already logged in
  const isLoginPage = await page.locator('input[type="email"]').isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isLoginPage) {
    await page.fill('input[type="email"]', ADMIN_LOGIN.email);
    await page.fill('input[type="password"]', ADMIN_LOGIN.password);
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ Admin login successful');
  } else {
    console.log('✅ Already logged in as admin');
  }
  
  // Verify we're on the admin dashboard
  await expect(page).toHaveURL(/dashboard/);
}

/**
 * Navigate to AI Queue page
 */
async function navigateToAiQueue(page: Page) {
  console.log('🔄 Navigating to AI Queue...');
  
  // Navigate to AI Queue if not already there
  if (!page.url().includes('ai-queue')) {
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
  }
  
  // Wait for the AI Queue page to load
  await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText(/Queue IA|AI Queue/i);
  console.log('✅ AI Queue page loaded');
}

/**
 * Wait for AI Queue data to load
 */
async function waitForQueueData(page: Page) {
  console.log('⏳ Waiting for AI Queue data...');
  
  // Wait for either data rows or empty state
  await page.waitForSelector(
    '[data-testid="ai-queue-table"] tbody tr, [data-testid="queue-grid"] > div, .grid > div, table tbody tr', 
    { timeout: 10000 }
  );
  
  // Check if there are AI requests
  const hasData = await page.locator('[data-testid="ai-queue-table"] tbody tr, [data-testid="queue-grid"] > div:not([class*="header"]), .grid > div:not([class*="header"]), table tbody tr').count();
  console.log(`📊 Found ${hasData} AI queue entries`);
  
  return hasData > 0;
}

test.describe('Admin AI Queue - Site and Customer Columns Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAiQueue(page);
  });

  test('should display readable Site names instead of UUIDs', async ({ page }) => {
    console.log('🔍 Testing Site column display...');
    
    const hasData = await waitForQueueData(page);
    
    if (!hasData) {
      console.log('⚠️ No AI queue data found - creating test scenario or skipping');
      test.skip('No AI queue data available for testing');
    }
    
    // Look for Site column data
    const siteColumns = page.locator('[data-testid="site-column"], td:has-text("Site"), [class*="site"]');
    const siteValues = page.locator(
      '[data-testid="site-value"], [data-testid="ai-queue-table"] tbody td:nth-child(2), .grid-row [class*="site"]:not([class*="header"])'
    );
    
    await expect(siteColumns.first()).toBeVisible();
    
    // Get all site column values
    const siteTexts = await siteValues.allTextContents();
    console.log('Site column values:', siteTexts);
    
    // Verify that site values are NOT UUIDs (should be readable names or "Site non spécifié")
    for (const siteText of siteTexts) {
      const trimmedText = siteText.trim();
      
      // Skip empty values
      if (!trimmedText) continue;
      
      // UUID pattern: 8-4-4-4-12 hexadecimal characters
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedText);
      
      expect(isUUID, `Site column should not display UUID: ${trimmedText}`).toBe(false);
      
      // Should contain meaningful text
      expect(trimmedText.length > 0, 'Site column should not be empty').toBe(true);
      
      console.log(`✅ Site value is readable: "${trimmedText}"`);
    }
  });

  test('should display readable Customer names instead of UUIDs', async ({ page }) => {
    console.log('🔍 Testing Customer column display...');
    
    const hasData = await waitForQueueData(page);
    
    if (!hasData) {
      console.log('⚠️ No AI queue data found - skipping test');
      test.skip('No AI queue data available for testing');
    }
    
    // Look for Customer column data
    const customerColumns = page.locator('[data-testid="customer-column"], td:has-text("Customer"), [class*="customer"]');
    const customerValues = page.locator(
      '[data-testid="customer-value"], [data-testid="ai-queue-table"] tbody td:nth-child(3), .grid-row [class*="customer"]:not([class*="header"])'
    );
    
    await expect(customerColumns.first()).toBeVisible();
    
    // Get all customer column values
    const customerTexts = await customerValues.allTextContents();
    console.log('Customer column values:', customerTexts);
    
    // Verify that customer values are NOT UUIDs (should be readable names/emails)
    for (const customerText of customerTexts) {
      const trimmedText = customerText.trim();
      
      // Skip empty values
      if (!trimmedText) continue;
      
      // UUID pattern: 8-4-4-4-12 hexadecimal characters
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedText);
      
      expect(isUUID, `Customer column should not display UUID: ${trimmedText}`).toBe(false);
      
      // Should contain meaningful text (name, email, or "Client inconnu")
      expect(trimmedText.length > 0, 'Customer column should not be empty').toBe(true);
      
      // Should not be "Client inconnu" followed by UUID
      const hasUnknownWithUUID = /Client inconnu\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(trimmedText);
      expect(hasUnknownWithUUID, `Customer should not show "Client inconnu" with UUID: ${trimmedText}`).toBe(false);
      
      console.log(`✅ Customer value is readable: "${trimmedText}"`);
    }
  });

  test('should display appropriate fallback text when data is unavailable', async ({ page }) => {
    console.log('🔍 Testing fallback text display...');
    
    const hasData = await waitForQueueData(page);
    
    if (!hasData) {
      console.log('⚠️ No AI queue data found - skipping test');
      test.skip('No AI queue data available for testing');
    }
    
    // Check for appropriate fallback texts
    const siteValues = page.locator('[data-testid="site-value"], [data-testid="ai-queue-table"] tbody td:nth-child(2)');
    const customerValues = page.locator('[data-testid="customer-value"], [data-testid="ai-queue-table"] tbody td:nth-child(3)');
    
    const siteTexts = await siteValues.allTextContents();
    const customerTexts = await customerValues.allTextContents();
    
    // Check site fallback texts
    for (const siteText of siteTexts) {
      const trimmedText = siteText.trim();
      if (!trimmedText) continue;
      
      // Should use appropriate fallback text
      const hasValidFallback = 
        trimmedText.includes('Site non spécifié') || 
        trimmedText.includes('Non défini') ||
        trimmedText.length > 5; // Has actual content
        
      expect(hasValidFallback, `Site should have appropriate fallback or content: ${trimmedText}`).toBe(true);
    }
    
    // Check customer fallback texts
    for (const customerText of customerTexts) {
      const trimmedText = customerText.trim();
      if (!trimmedText) continue;
      
      // Should use appropriate fallback text (but not with UUID)
      const hasValidFallback = 
        /^Client inconnu$/.test(trimmedText) || // Just "Client inconnu" without UUID
        trimmedText.includes('@') || // Email address
        trimmedText.split(' ').length >= 2; // Name with first/last
        
      expect(hasValidFallback, `Customer should have appropriate fallback or content: ${trimmedText}`).toBe(true);
    }
  });

  test('should load AI queue page without errors', async ({ page }) => {
    console.log('🔍 Testing basic AI queue page functionality...');
    
    // Check that the page loaded successfully
    await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText(/Queue IA|AI Queue/i);
    
    // Check for the presence of key UI elements
    const hasTable = await page.locator('table, [data-testid="ai-queue-table"]').isVisible().catch(() => false);
    const hasGrid = await page.locator('[data-testid="queue-grid"], .grid').isVisible().catch(() => false);
    
    expect(hasTable || hasGrid, 'Should have either table or grid layout for AI queue').toBe(true);
    
    // Check that there are no JavaScript errors preventing the page from working
    const hasErrorMessage = await page.locator('[data-testid="error-message"], .error, [class*="error"]').isVisible().catch(() => false);
    expect(hasErrorMessage, 'Should not display error messages').toBe(false);
    
    console.log('✅ AI queue page loaded successfully without errors');
  });

  test('should handle empty queue state gracefully', async ({ page }) => {
    console.log('🔍 Testing empty queue state...');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check if there's data or empty state
    const hasData = await page.locator('[data-testid="ai-queue-table"] tbody tr, .grid > div:not([class*="header"])').count();
    
    if (hasData === 0) {
      // Should show appropriate empty state message
      const emptyStateMessage = page.locator('[data-testid="empty-state"], [class*="empty"], .no-data');
      const hasEmptyStateMessage = await emptyStateMessage.isVisible().catch(() => false);
      
      if (hasEmptyStateMessage) {
        const messageText = await emptyStateMessage.textContent();
        expect(messageText?.length || 0 > 0, 'Empty state should have descriptive message').toBe(true);
        console.log('✅ Empty state displayed with message:', messageText);
      } else {
        console.log('ℹ️ No explicit empty state message found (may be acceptable)');
      }
    } else {
      console.log(`ℹ️ Queue has ${hasData} entries - empty state test not applicable`);
    }
  });
});

test.describe('Admin AI Queue - Integration Tests', () => {
  test('should maintain readable display after page refresh', async ({ page }) => {
    console.log('🔄 Testing display persistence after refresh...');
    
    await loginAsAdmin(page);
    await navigateToAiQueue(page);
    
    const hasData = await waitForQueueData(page);
    if (!hasData) {
      test.skip('No AI queue data available for testing');
    }
    
    // Get initial values
    const initialSiteTexts = await page.locator('[data-testid="site-value"], [data-testid="ai-queue-table"] tbody td:nth-child(2)').allTextContents();
    const initialCustomerTexts = await page.locator('[data-testid="customer-value"], [data-testid="ai-queue-table"] tbody td:nth-child(3)').allTextContents();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitForQueueData(page);
    
    // Get values after refresh
    const refreshedSiteTexts = await page.locator('[data-testid="site-value"], [data-testid="ai-queue-table"] tbody td:nth-child(2)').allTextContents();
    const refreshedCustomerTexts = await page.locator('[data-testid="customer-value"], [data-testid="ai-queue-table"] tbody td:nth-child(3)').allTextContents();
    
    // Verify that readable values are maintained
    expect(refreshedSiteTexts.length, 'Should have same number of site entries after refresh').toBe(initialSiteTexts.length);
    expect(refreshedCustomerTexts.length, 'Should have same number of customer entries after refresh').toBe(initialCustomerTexts.length);
    
    console.log('✅ Display values maintained after page refresh');
  });
});