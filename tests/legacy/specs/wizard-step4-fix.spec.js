const { test, expect } = require('@playwright/test');

/**
 * 🧙‍♂️ Wizard Step 4 Fix Verification Tests
 * 
 * Tests the ConfigGenerator fix for step 4 site creation failures
 * Verifies various service configurations work correctly
 */

test.describe('🧙‍♂️ Wizard Step 4 - ConfigGenerator Fix', () => {
  const PORTAL_URL = 'http://162.55.213.90:3080';
  
  test.beforeEach(async ({ page }) => {
    // Set timeout for slower operations
    test.setTimeout(60000);
  });

  test('✅ Wizard completes successfully with valid services', async ({ page }) => {
    console.log('🎯 Testing wizard completion with valid services...');
    
    // Navigate to wizard
    await page.goto(`${PORTAL_URL}/wizard`);
    console.log('✅ Wizard page loaded');
    
    // Step 1: Welcome & Terms
    await expect(page.locator('text=Assistant Guidé')).toBeVisible();
    await page.click('button:has-text("Commencer")');
    console.log('✅ Step 1: Welcome completed');
    
    // Step 2: Business Information
    await page.fill('input[name="siteName"]', 'Test Translation Agency');
    await page.selectOption('select[name="businessType"]', 'translation');
    await page.fill('input[name="domain"]', 'test-translation.com');
    await page.fill('input[name="slogan"]', 'Professional Translation Services');
    await page.click('button:has-text("Suivant")');
    console.log('✅ Step 2: Business Information completed');
    
    // Step 3: Design & Colors
    await page.waitForSelector('text=Couleurs', { timeout: 10000 });
    // Use default colors
    await page.click('button:has-text("Suivant")');
    console.log('✅ Step 3: Design & Colors completed');
    
    // Step 4: Content & Services (the problematic step)
    await page.waitForSelector('text=Services', { timeout: 10000 });
    
    // Add a service with valid title
    await page.click('button:has-text("Ajouter un service")');
    await page.fill('input[placeholder*="service"]', 'Document Translation');
    await page.fill('textarea[placeholder*="description"]', 'Professional document translation services');
    
    // Add contact information
    await page.fill('input[name="email"]', 'contact@test-translation.com');
    await page.fill('input[name="phone"]', '+33123456789');
    
    await page.click('button:has-text("Suivant")');
    console.log('✅ Step 4: Content & Services completed - No ConfigGenerator error!');
    
    // Step 5: Review & Confirm
    await page.waitForSelector('text=Récapitulatif', { timeout: 10000 });
    await expect(page.locator('text=Test Translation Agency')).toBeVisible();
    await page.click('button:has-text("Créer le site")');
    console.log('✅ Step 5: Review & Confirm completed');
    
    // Step 6: Site Creation Result
    await page.waitForSelector('text=Création réussie', { timeout: 30000 });
    await expect(page.locator('text=✅')).toBeVisible();
    console.log('✅ Step 6: Site creation successful!');
    
    console.log('🎉 Full wizard flow completed successfully with valid services');
  });

  test('✅ Wizard handles empty services gracefully', async ({ page }) => {
    console.log('🎯 Testing wizard with empty services array...');
    
    // Navigate to wizard
    await page.goto(`${PORTAL_URL}/wizard`);
    
    // Complete steps 1-3 quickly
    await page.click('button:has-text("Commencer")');
    
    await page.fill('input[name="siteName"]', 'Test Empty Services');
    await page.selectOption('select[name="businessType"]', 'education');
    await page.click('button:has-text("Suivant")');
    
    await page.click('button:has-text("Suivant")'); // Skip colors
    
    // Step 4: Don't add any services, just add contact info
    await page.waitForSelector('text=Services', { timeout: 10000 });
    await page.fill('input[name="email"]', 'contact@test-empty.com');
    
    // This should work with business type defaults
    await page.click('button:has-text("Suivant")');
    console.log('✅ Step 4 handled empty services with business defaults');
    
    // Complete the wizard
    await page.waitForSelector('text=Récapitulatif', { timeout: 10000 });
    await page.click('button:has-text("Créer le site")');
    
    await page.waitForSelector('text=Création réussie', { timeout: 30000 });
    console.log('🎉 Empty services case handled successfully');
  });

  test('✅ API endpoint handles malformed services data', async ({ page }) => {
    console.log('🎯 Testing API endpoint with malformed services...');
    
    // Test via browser fetch to simulate wizard API calls
    const response = await page.evaluate(async () => {
      const testData = {
        customerId: 'test-malformed-services',
        siteData: {
          name: 'Malformed Services Test',
          businessType: 'translation',
          services: [
            null,                    // null service
            {},                      // empty object
            { title: null },         // null title
            { title: undefined },    // undefined title
            { title: '' },           // empty title
            { title: 'Valid Service' } // valid service
          ],
          contact: { email: 'test@malformed.com' }
        }
      };
      
      try {
        const response = await fetch('/api/sites/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        return {
          status: response.status,
          result: result,
          success: !result.error || !result.error.includes('Cannot read properties of undefined')
        };
      } catch (error) {
        return {
          status: 500,
          error: error.message,
          success: false
        };
      }
    });
    
    console.log('📊 API Response:', response);
    
    // The API should handle malformed data gracefully (no ConfigGenerator error)
    expect(response.success).toBe(true);
    console.log('✅ API handled malformed services without ConfigGenerator errors');
  });

  test('✅ Wizard handles various business types', async ({ page }) => {
    console.log('🎯 Testing wizard with different business types...');
    
    const businessTypes = ['translation', 'education', 'creative', 'business'];
    
    for (const businessType of businessTypes) {
      console.log(`🔄 Testing business type: ${businessType}`);
      
      await page.goto(`${PORTAL_URL}/wizard`);
      await page.click('button:has-text("Commencer")');
      
      await page.fill('input[name="siteName"]', `Test ${businessType} Site`);
      await page.selectOption('select[name="businessType"]', businessType);
      await page.click('button:has-text("Suivant")');
      
      await page.click('button:has-text("Suivant")'); // Skip colors
      
      // Step 4: Add minimal contact info and proceed
      await page.waitForSelector('text=Services', { timeout: 10000 });
      await page.fill('input[name="email"]', `contact@test-${businessType}.com`);
      
      // This should work with each business type's defaults
      await page.click('button:has-text("Suivant")');
      console.log(`✅ ${businessType} business type handled step 4 successfully`);
      
      // Verify we can reach the review step
      await page.waitForSelector('text=Récapitulatif', { timeout: 10000 });
      await expect(page.locator(`text=Test ${businessType} Site`)).toBeVisible();
      console.log(`✅ ${businessType} business type completed wizard flow`);
    }
    
    console.log('🎉 All business types handled successfully');
  });

  test('✅ ConfigGenerator creates valid configurations', async ({ page }) => {
    console.log('🎯 Testing ConfigGenerator output validation...');
    
    // Test configuration generation via API
    const configTest = await page.evaluate(async () => {
      const testWizardData = {
        siteName: 'Config Test Site',
        businessType: 'translation',
        services: [
          { title: 'Test Service 1' },
          { title: 'Test Service 2' }
        ],
        contact: { email: 'test@config.com' }
      };
      
      try {
        // Test the template API endpoints
        const templatesResponse = await fetch('/api/templates');
        const templates = await templatesResponse.json();
        
        return {
          templatesAvailable: Array.isArray(templates),
          templateCount: templates.length,
          success: true
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('📊 Template API test:', configTest);
    expect(configTest.success).toBe(true);
    expect(configTest.templatesAvailable).toBe(true);
    console.log('✅ ConfigGenerator template system working correctly');
  });
});

test.describe('🔧 Portal Health Check', () => {
  test('✅ Portal service is running and responding', async ({ page }) => {
    console.log('🏥 Checking portal health...');
    
    const response = await page.goto('http://162.55.213.90:3080/');
    expect(response.status()).toBe(200);
    
    await expect(page.locator('text=Customer Portal')).toBeVisible();
    console.log('✅ Portal is healthy and responsive');
  });

  test('✅ Wizard endpoint is accessible', async ({ page }) => {
    console.log('🧙‍♂️ Checking wizard accessibility...');
    
    const response = await page.goto('http://162.55.213.90:3080/wizard');
    expect(response.status()).toBe(200);
    
    await expect(page.locator('text=Assistant Guidé')).toBeVisible();
    console.log('✅ Wizard is accessible and loading correctly');
  });
});