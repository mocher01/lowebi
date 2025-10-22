import { test, expect } from '@playwright/test';

test('Assistant Classique navigation - CORRECTED', async ({ page }) => {
  console.log('\n🔍 STEP 1: Login');
  await page.goto('https://logen.locod-ai.com/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('Administrator2025');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  
  console.log('\n🔍 STEP 2: Navigate to create page');
  await page.goto('https://logen.locod-ai.com/sites/create');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  console.log(`✅ At create page: ${page.url()}`);
  
  console.log('\n🔍 STEP 3: Find correct Assistant Classique element');
  
  // Try specific selectors first
  const selectors = [
    'a[href="/wizard?new=true"]',
    'a[href*="wizard"]',
    'button:has-text("Assistant Classique")',
    'a:has-text("Assistant Classique")',
    '[data-testid*="assistant"]'
  ];
  
  let assistantElement = null;
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible({ timeout: 2000 });
    console.log(`${selector}: visible = ${isVisible}`);
    
    if (isVisible && !assistantElement) {
      assistantElement = element;
      console.log(`✅ Using element with selector: ${selector}`);
      
      // Get href if it's a link
      const href = await element.getAttribute('href');
      if (href) {
        console.log(`✅ Link href: ${href}`);
      }
      break;
    }
  }
  
  if (!assistantElement) {
    console.log('❌ No Assistant Classique element found');
    return;
  }
  
  console.log('\n🔍 STEP 4: Click and wait for navigation');
  console.log(`Before click - URL: ${page.url()}`);
  
  // Click and wait for navigation
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
    assistantElement.click()
  ]);
  
  // Give wizard time to initialize
  await page.waitForTimeout(5000);
  
  const newUrl = page.url();
  console.log(`After click - URL: ${newUrl}`);
  
  console.log('\n🔍 STEP 5: Verify wizard loaded');
  
  if (newUrl.includes('/wizard') && newUrl.includes('new=true')) {
    console.log('✅ CORRECT: URL changed to wizard with new=true parameter');
    
    // Look for wizard elements
    const wizardSelectors = [
      'text="Assistant de Création"',
      'h1:has-text("Bienvenue")',
      'h2:has-text("Étape")',
      '[data-step]',
      '.wizard',
      'button:has-text("Suivant")'
    ];
    
    for (const selector of wizardSelectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible({ timeout: 5000 });
      console.log(`Wizard element ${selector}: visible = ${isVisible}`);
    }
    
    // Look for step navigation
    const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Next")').first();
    const hasNextButton = await nextButton.isVisible({ timeout: 5000 });
    console.log(`✅ Next button found: ${hasNextButton}`);
    
    console.log('🎉 SUCCESS: Assistant Classique properly triggers wizard!');
    
  } else {
    console.log('❌ FAILED: URL did not change to wizard page');
    console.log('Current headings:', await page.locator('h1, h2, h3').allTextContents());
  }
});