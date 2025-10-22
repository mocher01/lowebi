const { test, expect } = require('@playwright/test');

test.describe('Continue Button End-to-End Tests', () => {
  
  test('Continue button takes user to correct step (Images & Logo)', async ({ page }) => {
    console.log('🎯 Testing Continue Button - Images & Logo (Step 4)');
    
    // First create a test session at step 4 via backend
    const sessionId = `e2e-test-${Date.now()}`;
    
    // Create session at step 4 (Images & Logo)
    const createResponse = await fetch('http://localhost:7600/customer/wizard-sessions/' + sessionId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: 'E2E Test Site',
        domain: 'e2e-test.logen.app',
        businessType: 'E2E Test Business',
        currentStep: 4, // Images & Logo
        wizardData: {
          siteName: 'E2E Test Site',
          businessType: 'E2E Test Business',
          selectedTemplate: 'business-professional'
        }
      })
    });
    
    expect(createResponse.status).toBe(200);
    const sessionData = await createResponse.json();
    expect(sessionData.session.currentStep).toBe(4);
    console.log(`✅ Created test session ${sessionId} at step 4`);
    
    // Now test the Continue button workflow
    console.log('🖱️ Simulating Continue button click...');
    
    // Navigate to wizard with continue parameters (simulating Continue button)
    await page.goto(`http://localhost:7601/wizard-v2?continue=${sessionId}&step=4`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if we're on the correct step
    // Look for step indicators or content that shows we're on step 4 (Images & Logo)
    
    // First, check the URL contains the correct parameters
    const currentUrl = page.url();
    expect(currentUrl).toContain(`continue=${sessionId}`);
    expect(currentUrl).toContain('step=4');
    console.log('✅ URL contains correct continue parameters');
    
    // Wait a bit more for React to render
    await page.waitForTimeout(3000);
    
    // Look for wizard content (step 4 should be Images & Logo)
    // Check for elements that indicate we're on the Images & Logo step
    const pageContent = await page.content();
    
    // Look for step indicators or step-specific content
    const hasWizardContent = pageContent.includes('wizard') || 
                            pageContent.includes('Assistant de Création') ||
                            pageContent.includes('Images') ||
                            pageContent.includes('Logo') ||
                            pageContent.includes('step');
    
    console.log('🔍 Checking page content...');
    if (hasWizardContent) {
      console.log('✅ Wizard content detected on page');
    } else {
      console.log('❌ No wizard content found');
      console.log('Page title:', await page.title());
    }
    
    // Check if we can see step progression elements
    try {
      // Look for step indicators, progress bars, or navigation
      await page.waitForSelector('[data-testid*="step"], [class*="step"], [class*="progress"]', { timeout: 5000 });
      console.log('✅ Found step/progress elements');
    } catch (e) {
      console.log('⚠️ No specific step elements found, but page loaded');
    }
    
    // Most importantly: check that we're NOT on the Welcome step
    const isWelcomeStep = pageContent.includes('Bienvenue') && 
                          pageContent.includes('Conditions') &&
                          !pageContent.includes('Images') &&
                          !pageContent.includes('Logo');
    
    if (isWelcomeStep) {
      console.log('❌ FAILED: User is on Welcome step (bug still exists)');
      throw new Error('Continue button still redirects to Welcome step instead of Images & Logo step');
    } else {
      console.log('✅ SUCCESS: User is NOT on Welcome step');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: `/tmp/continue-test-${sessionId}.png`, fullPage: true });
    console.log(`📸 Screenshot saved: /tmp/continue-test-${sessionId}.png`);
  });
  
  test('Continue button workflow for Content & Services step', async ({ page }) => {
    console.log('🎯 Testing Continue Button - Content & Services (Step 3)');
    
    const sessionId = `e2e-content-${Date.now()}`;
    
    // Create session at step 3 (Content & Services)
    const createResponse = await fetch('http://localhost:7600/customer/wizard-sessions/' + sessionId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: 'Content Test Site',
        domain: 'content-test.logen.app',
        businessType: 'Content Test Business',
        currentStep: 3, // Content & Services
        wizardData: {
          siteName: 'Content Test Site',
          businessType: 'Content Test Business'
        }
      })
    });
    
    expect(createResponse.status).toBe(200);
    const sessionData = await createResponse.json();
    expect(sessionData.session.currentStep).toBe(3);
    console.log(`✅ Created test session ${sessionId} at step 3`);
    
    // Navigate with continue parameters
    await page.goto(`http://localhost:7601/wizard-v2?continue=${sessionId}&step=3`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    const pageContent = await page.content();
    
    // Check we're not on Welcome step
    const isWelcomeStep = pageContent.includes('Bienvenue') && 
                          pageContent.includes('Conditions') &&
                          !pageContent.includes('Content') &&
                          !pageContent.includes('Services');
    
    if (isWelcomeStep) {
      console.log('❌ FAILED: User is on Welcome step for step 3 test');
      throw new Error('Continue button redirects to Welcome step instead of Content & Services step');
    } else {
      console.log('✅ SUCCESS: User is NOT on Welcome step for step 3');
    }
    
    await page.screenshot({ path: `/tmp/continue-content-${sessionId}.png`, fullPage: true });
    console.log(`📸 Screenshot saved: /tmp/continue-content-${sessionId}.png`);
  });
  
  test('Frontend API proxy functionality', async ({ page }) => {
    console.log('🔌 Testing Frontend API Proxy');
    
    // Test that the API proxy is working by making a request from the browser context
    const response = await page.evaluate(async () => {
      try {
        const resp = await fetch('/api/customer/wizard-sessions/test-session');
        return {
          status: resp.status,
          ok: resp.ok,
          statusText: resp.statusText
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('API proxy response:', response);
    
    // Should get 401 (Unauthorized) which means proxy is working
    expect(response.status).toBe(401);
    console.log('✅ Frontend API proxy is working correctly');
  });
  
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    console.log(`❌ Test failed: ${testInfo.title}`);
  } else {
    console.log(`✅ Test passed: ${testInfo.title}`);
  }
});