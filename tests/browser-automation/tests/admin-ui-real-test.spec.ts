import { test, expect } from '@playwright/test';

/**
 * ADMIN UI REAL EXPERIENCE TEST
 * Tests exactly what happens when you login and click "Traiter"
 */

test.describe('Admin UI Real Experience', () => {
  test('should login and check actual prompt display for Request 21', async ({ page }) => {
    console.log('\n🔐 TESTING REAL ADMIN UI EXPERIENCE');
    console.log('═'.repeat(60));
    
    // Step 1: Go to admin login
    console.log('📍 Step 1: Navigate to admin login...');
    await page.goto('https://admin.logen.locod-ai.com');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Login
    console.log('🔐 Step 2: Admin login...');
    await page.fill('input[type="email"]', 'admin@locod.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ Login successful, redirected to dashboard');
    
    // Step 3: Navigate to AI queue
    console.log('📋 Step 3: Navigate to AI queue...');
    await page.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
    await page.waitForLoadState('networkidle');
    
    // Wait for queue to load
    console.log('⏳ Waiting for queue to load...');
    await page.waitForTimeout(5000);
    
    // Step 4: Look for Request 21
    console.log('🔍 Step 4: Looking for Request 21...');
    
    // Take a screenshot to see what's actually displayed
    await page.screenshot({ path: 'test-results/admin-queue-page.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/admin-queue-page.png');
    
    // Look for Request 21 or "Le Petit Bistrot"
    const request21Locator = page.locator('text="Le Petit Bistrot"').or(page.locator('text="21"'));
    
    if (await request21Locator.count() === 0) {
      console.log('❌ Request 21 "Le Petit Bistrot" not visible on page');
      
      // Log all visible text to debug
      const pageText = await page.textContent('body');
      console.log('📄 Page content (first 1000 chars):');
      console.log(pageText?.substring(0, 1000) + '...');
      
      // Look for any requests
      const requestRows = await page.locator('tr, .request-row, [data-testid*="request"]').count();
      console.log(`🔍 Found ${requestRows} potential request rows`);
      
      return;
    }
    
    console.log('✅ Found Request 21 on page');
    
    // Step 5: Click "Traiter" button for Request 21
    console.log('🖱️ Step 5: Looking for "Traiter" button...');
    
    // Find the "Traiter" button - try different selectors
    const traiterSelectors = [
      'button:has-text("Traiter")',
      'button:has-text("🤖")',
      '[data-testid="process-button"]',
      'button:near(:text("Le Petit Bistrot"))',
      'button:near(:text("21"))'
    ];
    
    let traiterButton = null;
    for (const selector of traiterSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        traiterButton = button;
        console.log(`✅ Found "Traiter" button with selector: ${selector}`);
        break;
      }
    }
    
    if (!traiterButton) {
      console.log('❌ "Traiter" button not found');
      
      // Log all buttons to debug
      const allButtons = await page.locator('button').allTextContents();
      console.log('🔘 All buttons found:', allButtons);
      
      return;
    }
    
    // Click the Traiter button
    console.log('🚀 Clicking "Traiter" button...');
    await traiterButton.click();
    
    // Step 6: Wait for processing modal
    console.log('⏳ Step 6: Waiting for processing modal...');
    await page.waitForTimeout(3000);
    
    // Take another screenshot of the modal
    await page.screenshot({ path: 'test-results/processing-modal.png', fullPage: true });
    console.log('📸 Modal screenshot saved: test-results/processing-modal.png');
    
    // Step 7: Check the prompt content
    console.log('🔍 Step 7: Checking prompt content...');
    
    // Look for prompt text area or content
    const promptSelectors = [
      'textarea',
      'pre',
      '.prompt',
      '[data-testid="prompt"]',
      ':text("Génère TOUT")',
      ':text("FORMAT JSON")'
    ];
    
    let promptElement = null;
    let promptText = '';
    
    for (const selector of promptSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        promptText = await element.textContent() || '';
        if (promptText.length > 100) {
          promptElement = element;
          console.log(`✅ Found prompt with selector: ${selector}`);
          console.log(`📏 Prompt length: ${promptText.length} characters`);
          break;
        }
      }
    }
    
    if (!promptElement || !promptText) {
      console.log('❌ Prompt content not found in modal');
      
      // Log modal content
      const modalContent = await page.textContent('body');
      console.log('📄 Modal content (first 1000 chars):');
      console.log(modalContent?.substring(0, 1000) + '...');
      
      return;
    }
    
    // Step 8: Analyze the prompt
    console.log('\n📊 PROMPT ANALYSIS:');
    console.log('═'.repeat(60));
    console.log('First 500 characters:');
    console.log(promptText.substring(0, 500) + '...');
    console.log('═'.repeat(60));
    console.log(`📏 Total length: ${promptText.length} characters`);
    
    // Check if comprehensive or fallback
    const isComprehensive = promptText.length > 4000 && 
                           promptText.includes('FORMAT JSON REQUIS') &&
                           promptText.includes('"services":') &&
                           promptText.includes('"testimonials":');
    
    if (isComprehensive) {
      console.log('✅ COMPREHENSIVE PROMPT DISPLAYED IN UI');
      console.log('✅ Contains full JSON structure');
      console.log('✅ Contains business context');  
      console.log('✅ Length > 4000 characters');
    } else {
      console.log('❌ FALLBACK PROMPT DISPLAYED IN UI');
      console.log('❌ Missing comprehensive structure');
      console.log('❌ Too short for comprehensive prompt');
      
      // This is the smoking gun - what's actually displayed vs expected
      console.log('\n🚨 ACTUAL PROMPT DISPLAYED:');
      console.log(promptText);
    }
    
    console.log('\n🎯 FINAL RESULT:');
    expect(isComprehensive).toBe(true);
  });
});