const { chromium } = require('playwright');

(async () => {
    console.log('🔍 CHECKING STEP 5 DEPLOYMENT');
    console.log('='.repeat(50));
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 800 
    });
    const page = await browser.newPage();
    
    try {
        console.log('📋 Going to wizard...');
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        // Accept terms and navigate quickly to Step 5
        await page.check('input[type="checkbox"]');
        await page.click('button:has-text("Commencer")');
        await page.waitForTimeout(1000);
        
        // Skip template
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(1000);
        
        // Fill basic info quickly
        await page.fill('input[x-model="wizardData.siteName"]', 'Test');
        await page.fill('input[x-model="wizardData.domain"]', 'test.com');
        await page.fill('input[x-model="wizardData.businessType"]', 'test');
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(1000);
        
        // Skip Step 3 (Content) - add minimal content
        await page.fill('input[x-model="wizardData.contact.email"]', 'test@test.com');
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(1000);
        
        // Skip Step 4 (Images) 
        await page.click('text=J\'ai déjà mes images');
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(1500);
        
        console.log('🎯 Now in Step 5 - Checking Images tab...');
        
        // Click on Images tab
        const imagesTab = page.locator('button:has-text("Images & Design")');
        await imagesTab.click();
        await page.waitForTimeout(1000);
        
        // Check for new layout
        console.log('📊 Checking for new layout elements...');
        
        const newHeroSection = await page.locator('text=🏠 Image Bannière (Hero)').count();
        const groupedLogos = await page.locator('text=🏢 Logos du Site').count();
        const faviconSection = await page.locator('text=🔖 Favicons').count();
        const oldLayout = await page.locator('text=🖼️ Images Principales').count();
        
        console.log(`📊 New Hero Section: ${newHeroSection > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
        console.log(`📊 Grouped Logos: ${groupedLogos > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
        console.log(`📊 Favicon Section: ${faviconSection > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
        console.log(`📊 Old Layout: ${oldLayout > 0 ? '❌ STILL PRESENT' : '✅ REMOVED'}`);
        
        // Take screenshot
        await page.screenshot({ path: 'tests/manual/step5-deployment-check.png', fullPage: true });
        console.log('📸 Screenshot saved: tests/manual/step5-deployment-check.png');
        
        // Check page source
        const pageContent = await page.content();
        const hasNewCode = pageContent.includes('🏠 Image Bannière (Hero)');
        console.log(`📊 Page source contains new code: ${hasNewCode ? '✅ YES' : '❌ NO'}`);
        
        if (newHeroSection > 0 && groupedLogos > 0 && faviconSection > 0 && oldLayout === 0) {
            console.log('\n🎉 ✅ NEW LAYOUT IS DEPLOYED AND VISIBLE!');
        } else {
            console.log('\n⚠️ ❌ NEW LAYOUT NOT FULLY VISIBLE');
            console.log('This could be a browser cache issue or Alpine.js rendering problem.');
        }
        
        console.log('\n⏰ Keeping browser open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: 'tests/manual/step5-check-error.png' });
    } finally {
        await browser.close();
    }
})();