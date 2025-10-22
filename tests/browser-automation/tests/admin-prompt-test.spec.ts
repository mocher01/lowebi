import { test, expect } from '@playwright/test';

/**
 * ADMIN PROMPT DISPLAY TEST
 * Specifically test the prompt that shows when clicking "Traiter" on Request 21
 */

test.describe('Admin Prompt Display', () => {
  test('should click Traiter on Request 21 and show the actual prompt', async ({ page }) => {
    console.log('\n🔍 TESTING REQUEST 21 PROMPT DISPLAY');
    console.log('═'.repeat(60));
    
    // Login first
    await page.goto('https://admin.dev.lowebi.com');
    await page.fill('input[type="email"]', 'admin@locod.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Go to AI queue
    await page.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    await page.waitForTimeout(3000);
    
    console.log('🔍 Looking for Request #21...');
    
    // Find Request #21 row specifically
    const request21Row = page.locator('text="#21"').or(page.locator(':has-text("#21")'));
    
    if (await request21Row.count() === 0) {
      console.log('❌ Request #21 not found');
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/queue-debug.png', fullPage: true });
      return;
    }
    
    console.log('✅ Found Request #21');
    
    // Find the "Traiter" button in the same row as Request #21
    console.log('🖱️ Looking for "Traiter" button for Request #21...');
    
    // Look for "Traiter" button near #21
    const traiterButton = page.locator('text="#21"').locator('xpath=../..').locator('button:has-text("Traiter")');
    
    if (await traiterButton.count() === 0) {
      console.log('❌ "Traiter" button not found for Request #21');
      console.log('🔍 Trying alternative selector...');
      
      // Alternative: find any "Traiter" button (there should be many)
      const anyTraiterButton = page.locator('button:has-text("Traiter")').first();
      if (await anyTraiterButton.count() > 0) {
        console.log('✅ Using first available "Traiter" button');
        await anyTraiterButton.click();
      } else {
        console.log('❌ No "Traiter" buttons found at all');
        return;
      }
    } else {
      console.log('✅ Found "Traiter" button for Request #21');
      await traiterButton.click();
    }
    
    console.log('⏳ Waiting for modal to open...');
    await page.waitForTimeout(5000);
    
    // Take screenshot of modal
    await page.screenshot({ path: 'test-results/modal-opened.png', fullPage: true });
    console.log('📸 Modal screenshot saved');
    
    // Look for prompt content in modal
    console.log('🔍 Looking for prompt content...');
    
    // Try to find any text that looks like a prompt
    const promptCandidates = [
      'text="Génère TOUT"',
      'text="FORMAT JSON"', 
      'textarea',
      'pre',
      '.prompt',
      '[data-testid*="prompt"]'
    ];
    
    let actualPromptText = '';
    
    for (const selector of promptCandidates) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        const text = await element.textContent();
        if (text && text.length > 100) {
          actualPromptText = text;
          console.log(`✅ Found prompt content with selector: ${selector}`);
          console.log(`📏 Length: ${text.length} characters`);
          break;
        }
      }
    }
    
    if (!actualPromptText) {
      console.log('❌ No prompt content found in modal');
      console.log('📄 Modal content:');
      const modalText = await page.textContent('body');
      console.log(modalText?.substring(0, 2000) + '...');
      return;
    }
    
    // CRITICAL: Show what is actually displayed
    console.log('\n🎯 ACTUAL PROMPT DISPLAYED IN ADMIN UI:');
    console.log('═'.repeat(60));
    console.log(actualPromptText);
    console.log('═'.repeat(60));
    console.log(`📏 Length: ${actualPromptText.length} characters`);
    
    // Analyze if comprehensive or fallback
    const isComprehensive = actualPromptText.length > 4000;
    const hasJSONStructure = actualPromptText.includes('FORMAT JSON') || actualPromptText.includes('"services":');
    const hasBusinessContext = actualPromptText.includes('Le Petit Bistrot') || actualPromptText.includes('Bistrot');
    
    console.log('\n📊 PROMPT ANALYSIS:');
    console.log(`✅ Comprehensive length (>4000): ${isComprehensive}`);
    console.log(`✅ JSON structure: ${hasJSONStructure}`);
    console.log(`✅ Business context: ${hasBusinessContext}`);
    
    if (isComprehensive && hasJSONStructure && hasBusinessContext) {
      console.log('🎉 COMPREHENSIVE PROMPT CONFIRMED IN UI');
    } else {
      console.log('🚨 FALLBACK PROMPT DETECTED IN UI');
      console.log('This explains why user sees short prompt instead of comprehensive one');
    }
  });
});