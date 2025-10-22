import { test, expect } from '@playwright/test';

test.describe('Unit Tests: Session Creation Functions', () => {
  
  test('Test 1: forceCreateWizardSession function call', async ({ page }) => {
    // Navigate to wizard and inject test
    await page.goto('https://dev.lowebi.com/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('Administrator2025');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForLoadState('domcontentloaded');
    
    // Inject test to call forceCreateWizardSession directly
    const result = await page.evaluate(async () => {
      // Access the wizard context 
      const wizardContext = (window as any).wizardContext;
      if (!wizardContext) return 'ERROR: No wizard context found';
      
      try {
        const testData = {
          siteName: 'DirectTestSite',
          siteId: 'direct-test-site',
          businessType: 'Unknown',
          domain: '',
          slogan: '',
          businessDescription: '',
          termsAccepted: true,
          siteLanguage: 'fr'
        };
        
        // Call forceCreateWizardSession directly
        await wizardContext.forceCreateWizardSession(testData);
        return 'SUCCESS: forceCreateWizardSession called';
      } catch (error) {
        return `ERROR: ${error.message}`;
      }
    });
    
    console.log('🧪 Test 1 Result:', result);
  });

  test('Test 2: createSession alias function call', async ({ page }) => {
    await page.goto('https://dev.lowebi.com/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('Administrator2025');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForLoadState('domcontentloaded');
    
    // Inject test to call createSession (alias)
    const result = await page.evaluate(async () => {
      const wizardContext = (window as any).wizardContext;
      if (!wizardContext) return 'ERROR: No wizard context found';
      
      try {
        const testData = {
          siteName: 'AliasTestSite',
          siteId: 'alias-test-site',
          businessType: 'Unknown',
          domain: '',
          slogan: '',
          businessDescription: '',
          termsAccepted: true,
          siteLanguage: 'fr'
        };
        
        // Call createSession alias
        await wizardContext.createSession(testData);
        return 'SUCCESS: createSession alias called';
      } catch (error) {
        return `ERROR: ${error.message}`;
      }
    });
    
    console.log('🧪 Test 2 Result:', result);
  });

  test('Test 3: handleSiteNameChange function call', async ({ page }) => {
    await page.goto('https://dev.lowebi.com/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('Administrator2025');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to business info step
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
      const commencerButton = page.locator('button:has-text("Commencer")');
      if (await commencerButton.isVisible()) {
        await commencerButton.click();
        await page.waitForTimeout(2000);
        
        const suivantButton = page.locator('button:has-text("Suivant")').first();
        if (await suivantButton.isVisible()) {
          await suivantButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Try to trigger handleSiteNameChange by typing in the field
    console.log('🧪 Test 3: Looking for site name field...');
    const siteNameField = page.locator('input[placeholder="Mon Entreprise"]');
    
    if (await siteNameField.isVisible()) {
      console.log('🧪 Test 3: Site name field found, typing UnitTestSite...');
      
      // Listen for console logs
      page.on('console', msg => {
        if (msg.text().includes('🔥 FORCING IMMEDIATE SESSION CREATION')) {
          console.log('🧪 Test 3: handleSiteNameChange triggered successfully!');
        }
      });
      
      await siteNameField.fill('UnitTestSite');
      await page.waitForTimeout(2000);
      console.log('🧪 Test 3: Typed in field, waiting for function calls...');
    } else {
      console.log('🧪 Test 3: Site name field not found');
    }
  });
});