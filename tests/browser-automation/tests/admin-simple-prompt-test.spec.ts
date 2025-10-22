import { test, expect } from '@playwright/test';

/**
 * SIMPLE ADMIN PROMPT TEST
 * Just click any "Traiter" button and see what prompt displays
 */

test.describe('Simple Admin Prompt Test', () => {
  test('should click any Traiter button and capture the displayed prompt', async ({ page }) => {
    console.log('\n🔍 SIMPLE PROMPT DISPLAY TEST');
    console.log('═'.repeat(60));
    
    // Login
    await page.goto('https://admin.dev.lowebi.com');
    await page.fill('input[type="email"]', 'admin@locod.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Go to AI queue
    await page.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    await page.waitForTimeout(5000);
    
    console.log('🖱️ Clicking first available "Traiter" button...');
    
    // Click the first "Traiter" button
    const firstTraiterButton = page.locator('button:has-text("Traiter")').first();
    await firstTraiterButton.click();
    
    console.log('⏳ Waiting for modal...');
    await page.waitForTimeout(8000); // Longer wait for modal to fully load
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/prompt-modal.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    // Capture all text content from the page
    const pageContent = await page.textContent('body');
    
    // Look for prompt-like content
    if (pageContent) {
      // Find text that starts with "Génère"
      const generateMatch = pageContent.match(/Génère[\\s\\S]*?(?=\\n\\n|$)/);
      if (generateMatch) {
        const promptText = generateMatch[0];
        
        console.log('\\n🎯 FOUND PROMPT TEXT:');
        console.log('═'.repeat(60));
        console.log(promptText.substring(0, 1000) + (promptText.length > 1000 ? '...' : ''));
        console.log('═'.repeat(60));
        console.log(`📏 Length: ${promptText.length} characters`);
        
        // Analyze prompt type
        const isComprehensive = promptText.length > 4000 && 
                               promptText.includes('FORMAT JSON') &&
                               promptText.includes('"services":');
        
        if (isComprehensive) {
          console.log('✅ COMPREHENSIVE PROMPT DETECTED');
        } else {
          console.log('❌ FALLBACK PROMPT DETECTED');
        }
      } else {
        console.log('❌ No prompt text found');
        console.log('📄 Page content (first 2000 chars):');
        console.log(pageContent.substring(0, 2000) + '...');
      }
    }
    
    // Also look in specific elements that might contain the prompt
    const promptElements = [
      'textarea',
      'pre', 
      '.prompt',
      '[data-testid*="prompt"]',
      'div:has-text("Génère")'
    ];
    
    for (const selector of promptElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        const text = await element.first().textContent();
        if (text && text.includes('Génère') && text.length > 100) {
          console.log(`\\n📋 FOUND IN ${selector}:`);
          console.log(text.substring(0, 500) + '...');
          console.log(`Length: ${text.length} chars`);
        }
      }
    }
  });
});