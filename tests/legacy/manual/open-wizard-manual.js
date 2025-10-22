const { chromium } = require('playwright');

(async () => {
    console.log('🎭 OPENING WIZARD FOR MANUAL NAVIGATION');
    console.log('='.repeat(50));
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 500,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    
    try {
        console.log('📋 Loading wizard...');
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        console.log('✅ WIZARD IS OPEN AND READY!');
        console.log('');
        console.log('👀 MANUAL STEPS FOR YOU:');
        console.log('   1. Accept terms and click "Commencer"');
        console.log('   2. Skip template selection (click "Suivant")');
        console.log('   3. Fill business info and click "Suivant"');
        console.log('   4. CREATE YOUR SERVICES (count them carefully!)');
        console.log('   5. Continue to Step 4 (Images)');
        console.log('   6. Continue to Step 5 (Revision)');
        console.log('   7. Click "Images & Design" tab');
        console.log('   8. Check service upload count vs services created');
        console.log('');
        console.log('⏰ Browser will stay open for 10 minutes...');
        
        // Wait 10 minutes for manual navigation
        await page.waitForTimeout(600000); // 10 minutes
        
    } catch (error) {
        console.error('❌ Failed:', error.message);
    } finally {
        console.log('🔚 Closing browser...');
        await browser.close();
    }
})();