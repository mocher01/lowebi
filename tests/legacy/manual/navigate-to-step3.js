const { chromium } = require('playwright');

(async () => {
    console.log('🎭 STARTING WIZARD INSTANCE - NAVIGATING TO STEP 3');
    console.log('='.repeat(60));
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 800,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    
    try {
        console.log('📋 Step 1: Loading wizard...');
        await page.goto('http://162.55.213.90:3080/wizard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('✅ Step 2: Accepting terms...');
        await page.check('input[type="checkbox"]');
        await page.click('button:has-text("Commencer")');
        await page.waitForTimeout(1500);
        
        console.log('✅ Step 3: Skipping template selection to reach Business Info...');
        // Template step - just click Suivant to skip template selection
        const templateNextButton = page.locator('button:has-text("Suivant")').first();
        await templateNextButton.click();
        await page.waitForTimeout(1500);
        
        console.log('✅ Step 4: Filling basic business information...');
        await page.fill('input[x-model="wizardData.siteName"]', 'Debug Site');
        await page.fill('input[x-model="wizardData.domain"]', 'debug.com');
        await page.fill('input[x-model="wizardData.businessType"]', 'consulting');
        await page.waitForTimeout(500);
        
        // Move to Content step (Step 3 in your workflow)
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(1500);
        
        console.log('🎯 REACHED STEP 3 (CONTENT) - Ready for user!');
        console.log('');
        console.log('👀 CURRENT STATE:');
        console.log('   - Site Name: Debug Site');
        console.log('   - Domain: debug.com'); 
        console.log('   - Business Type: consulting');
        console.log('   - Current Step: Content (Services creation)');
        console.log('');
        console.log('🔄 USER INSTRUCTIONS:');
        console.log('   1. The browser window is open and ready');
        console.log('   2. You are now in Step 3 - Content creation');
        console.log('   3. Create your services here (add exactly the number you want)');
        console.log('   4. Continue through the wizard as normal');
        console.log('   5. When you reach Step 5, check the Images tab');
        console.log('   6. Count the service upload slots vs actual services created');
        console.log('');
        console.log('⏰ Browser will stay open for 5 minutes for you to continue...');
        
        // Wait for 5 minutes to let user continue manually
        await page.waitForTimeout(300000); // 5 minutes
        
    } catch (error) {
        console.error('❌ Navigation failed:', error.message);
        await page.screenshot({ path: 'tests/manual/navigate-error.png' });
    } finally {
        console.log('🔚 Closing browser instance...');
        await browser.close();
    }
})();