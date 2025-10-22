import { test, expect } from '@playwright/test';

test.describe('Unit Test: createWizardSession function', () => {
  
  test('Test createWizardSession function directly', async ({ page }) => {
    console.log('🧪 UNIT TEST: Testing createWizardSession function in isolation');
    
    // Login first
    await page.goto('https://dev.lowebi.com/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('Administrator2025');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    // Navigate to wizard to get access to the context
    await page.goto('https://dev.lowebi.com/wizard?new=true');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Capture console logs to see function execution
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`🧪 BROWSER LOG: ${text}`);
    });
    
    // Call createWizardSession directly via browser console
    const result = await page.evaluate(async () => {
      try {
        // Access wizard context
        const wizardContext = (window as any).wizardContext;
        if (!wizardContext) {
          return 'ERROR: No wizard context found';
        }
        
        // Check if createSession function exists
        if (typeof wizardContext.createSession !== 'function') {
          return 'ERROR: createSession function not found in wizard context';
        }
        
        // Prepare test data for session creation
        const testData = {
          siteName: 'UnitTestSite',
          siteId: 'unit-test-site-' + Date.now(),
          businessType: 'Technology',
          domain: '',
          slogan: 'Unit test slogan',
          businessDescription: 'Unit test description',
          termsAccepted: true,
          siteLanguage: 'fr',
          terminology: 'services',
          services: [],
          contact: { email: '', phone: '', address: '' },
          hero: { title: '', subtitle: '', description: '' },
          about: { title: '', subtitle: '', description: '', values: [] },
          testimonials: [],
          imageApproach: 'manual' as const,
          images: {},
          imageChoices: {},
          aiStyle: 'modern',
          otherImagesChoice: 'upload' as const,
          faq: [],
          enableBlog: false,
          enableNewsletter: false,
          integrations: {
            newsletter: {
              enabled: false,
              provider: 'n8n',
              hasGoogleAccount: false,
              gmailAddress: '',
              gmailAppPassword: '',
              apiKey: ''
            }
          },
          seoSettings: {
            title: '',
            description: '',
            keywords: []
          },
          heroContent: { title: '', subtitle: '', description: '' },
          aboutContent: { title: '', subtitle: '', description: '', values: [] }
        };
        
        // Call createSession directly
        await wizardContext.createSession(testData);
        return 'SUCCESS: createWizardSession called successfully';
        
      } catch (error) {
        return `ERROR: ${error.message}`;
      }
    });
    
    console.log('🧪 UNIT TEST RESULT:', result);
    
    // Wait for async operations to complete
    await page.waitForTimeout(3000);
    
    // Check the result
    expect(result).toContain('SUCCESS');
    
    // Verify that the session creation logs appeared
    const hasCreationLog = consoleMessages.some(msg => 
      msg.includes('📝 createWizardSession CALLED with siteName: UnitTestSite')
    );
    expect(hasCreationLog).toBe(true);
    
    // Verify that session was created successfully
    const hasSuccessLog = consoleMessages.some(msg => 
      msg.includes('💾 CREATED wizard session successfully')
    );
    expect(hasSuccessLog).toBe(true);
    
    // Now check if the session appears in My Sites
    console.log('🧪 Checking if UnitTestSite appears in My Sites...');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForLoadState('networkidle');
    
    // Look for UnitTestSite
    const unitTestSiteElements = page.locator('*:has-text("UnitTestSite")');
    const hasUnitTestSite = await unitTestSiteElements.count() > 0;
    
    console.log('🧪 UnitTestSite found in My Sites:', hasUnitTestSite);
    expect(hasUnitTestSite).toBe(true);
    
    if (hasUnitTestSite) {
      const siteTexts = await unitTestSiteElements.allTextContents();
      console.log('🧪 UnitTestSite elements:', siteTexts);
    }
  });
});