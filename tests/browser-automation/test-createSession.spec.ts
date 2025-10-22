import { test, expect } from '@playwright/test';

test('Unit Test: createSession function', async ({ page }) => {
  console.log('🧪 UNIT TEST: Testing createSession function');
  
  // Login
  await page.goto('https://logen.locod-ai.com/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('Administrator2025');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  
  // Navigate to wizard
  await page.goto('https://logen.locod-ai.com/wizard?new=true');
  await page.waitForLoadState('domcontentloaded');
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`🧪 BROWSER LOG: ${msg.text()}`);
  });
  
  // Wait for wizard to initialize
  await page.waitForTimeout(2000);
  
  // Call createSession directly via browser console
  const result = await page.evaluate(async () => {
    try {
      // Get the React component instance
      const wizardElement = document.querySelector('[data-testid="wizard-provider"]') || document.body;
      
      // Try to access wizard context via React DevTools global
      if (typeof window.React !== 'undefined') {
        const fiberKey = Object.keys(wizardElement).find(key => key.startsWith('__reactInternalInstance'));
        if (fiberKey) {
          let fiber = wizardElement[fiberKey];
          while (fiber && (!fiber.type || fiber.type.name !== 'WizardProvider')) {
            fiber = fiber.return;
          }
          if (fiber && fiber.stateNode) {
            return 'FOUND_PROVIDER';
          }
        }
      }
      
      // Alternative: try window global
      if ((window as any).wizardContext) {
        const testData = {
          siteName: 'UnitTestSite',
          siteId: 'unit-test-site',
          businessType: 'Technology',
          domain: '',
          slogan: 'Test slogan',
          businessDescription: 'Test description',
          termsAccepted: true,
          siteLanguage: 'fr',
          services: [],
          contact: { email: '', phone: '', address: '' },
          hero: { title: '', subtitle: '', description: '' },
          about: { title: '', subtitle: '', description: '', values: [] },
          testimonials: [],
          images: {}
        };
        
        await (window as any).wizardContext.createSession(testData);
        return 'SUCCESS: createSession called successfully';
      }
      
      return 'ERROR: Cannot access wizard context';
    } catch (error) {
      return `ERROR: ${error.message}`;
    }
  });
  
  console.log('🧪 UNIT TEST RESULT:', result);
  
  // Wait to see any console logs
  await page.waitForTimeout(3000);
  
  // Check if session appeared by going to My Sites
  await page.goto('https://logen.locod-ai.com/sites');
  await page.waitForLoadState('networkidle');
  
  // Look for "UnitTestSite"
  const hasUnitTestSite = await page.locator('*:has-text("UnitTestSite")').count() > 0;
  console.log('🧪 UnitTestSite found in My Sites:', hasUnitTestSite);
});