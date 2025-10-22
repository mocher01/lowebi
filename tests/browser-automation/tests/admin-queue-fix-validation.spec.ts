import { test, expect } from '@playwright/test';

test.describe('Admin Queue IA - Fix Validation', () => {
  test('should display readable site and customer names instead of UUIDs', async ({ page }) => {
    // Navigate to admin login
    await page.goto('https://admin.dev.lowebi.com/');
    
    // Login with admin credentials
    await page.fill('input[type="email"]', 'admin@logen.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForLoadState('networkidle');
    
    // Navigate to AI Queue page
    await page.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    
    // Wait for the queue to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check that the page loaded without error
    const errorMessage = page.locator('text=Erreur lors du chargement');
    await expect(errorMessage).not.toBeVisible();
    
    // Verify table headers are present
    await expect(page.locator('th:has-text("ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Site")')).toBeVisible();
    await expect(page.locator('th:has-text("Customer")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Business")')).toBeVisible();
    await expect(page.locator('th:has-text("Statut")')).toBeVisible();
    
    // Get table rows
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      // Check first row data
      const firstRow = rows.first();
      
      // Verify Site column doesn't show "Site non spécifié" or UUID
      const siteCell = firstRow.locator('td').nth(2); // Site column (0=checkbox, 1=ID, 2=Site)
      const siteText = await siteCell.textContent();
      
      console.log('Site cell content:', siteText);
      
      // Site should not be "Site non spécifié" and should not contain long UUIDs
      expect(siteText).not.toContain('Site non spécifié');
      expect(siteText).not.toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
      
      // Verify Customer column doesn't show "Client inconnu" or UUID
      const customerCell = firstRow.locator('td').nth(5); // Customer column
      const customerText = await customerCell.textContent();
      
      console.log('Customer cell content:', customerText);
      
      // Customer should not be "Client inconnu" and should not contain long UUIDs
      expect(customerText).not.toContain('Client inconnu');
      expect(customerText).not.toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
      
      // Customer should have readable name format (e.g., "Test User")
      expect(customerText).toMatch(/[A-Za-z]+ [A-Za-z]+/); // First name + Last name pattern
      
      console.log('✅ Site and Customer columns show readable names!');
    } else {
      console.log('ℹ️ No AI requests found in queue');
    }
  });
  
  test('should load queue without Internal Server Error', async ({ page }) => {
    // Navigate directly to AI queue with authentication
    await page.goto('https://admin.dev.lowebi.com/');
    
    // Login
    await page.fill('input[type="email"]', 'admin@logen.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    
    // Go to queue page
    await page.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    
    // Wait for loading to complete
    await page.waitForTimeout(3000);
    
    // Check there's no "Internal Server Error" or "Erreur lors du chargement"
    const errorTexts = [
      'Internal Server Error',
      'Internal server error', 
      'Erreur lors du chargement',
      '500',
      'Server Error'
    ];
    
    for (const errorText of errorTexts) {
      const errorElement = page.locator(`text=${errorText}`);
      await expect(errorElement).not.toBeVisible();
    }
    
    // Verify the table loaded successfully
    await expect(page.locator('table')).toBeVisible();
    
    console.log('✅ Queue loaded without Internal Server Error!');
  });
});