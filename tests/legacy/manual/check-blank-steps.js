const { chromium } = require('playwright');

async function checkBlankSteps() {
    console.log('🧪 Checking why Step 5 and Step 6 are blank...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(3000);
        
        // TEST STEP 5 (should be blank)
        console.log('\n📍 TESTING STEP 5 (Révision Finale - BLANK):');
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5;
            }
        });
        
        await page.waitForTimeout(2000);
        
        // Check if step 5 container is visible
        const step5Container = await page.locator('[x-show="currentStep === 5"]').isVisible();
        console.log(`Step 5 container visible: ${step5Container}`);
        
        // Check if title is visible
        const step5Title = await page.locator('h2:has-text("Révision Finale")').isVisible();
        console.log(`Step 5 title visible: ${step5Title}`);
        
        // Check if tabs are visible
        const configTab = await page.locator('button:has-text("Configuration")').isVisible();
        const imagesTab = await page.locator('button:has-text("Images")').isVisible();
        console.log(`Configuration tab visible: ${configTab}`);
        console.log(`Images tab visible: ${imagesTab}`);
        
        // Take screenshot
        await page.screenshot({ path: './tests/manual/step5-check-error.png' });
        console.log('📸 Step 5 screenshot: ./tests/manual/step5-check-error.png');
        
        // TEST STEP 6 (should be blank)
        console.log('\n📍 TESTING STEP 6 (Fonctionnalités Avancées - BLANK):');
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 6;
            }
        });
        
        await page.waitForTimeout(2000);
        
        // Check if step 6 container is visible  
        const step6Container = await page.locator('[x-show="currentStep === 6"]').isVisible();
        console.log(`Step 6 container visible: ${step6Container}`);
        
        // Check if title is visible
        const step6Title = await page.locator('h2:has-text("Fonctionnalités Avancées")').isVisible();
        console.log(`Step 6 title visible: ${step6Title}`);
        
        // Check if blog section is visible
        const blogSection = await page.locator('h3:has-text("Blog")').isVisible();
        console.log(`Blog section visible: ${blogSection}`);
        
        // Take screenshot
        await page.screenshot({ path: './tests/manual/step6-check-error.png' });
        console.log('📸 Step 6 screenshot: ./tests/manual/step6-check-error.png');
        
        // Check console errors
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        console.log(`\nJavaScript errors: ${errors.length}`);
        errors.forEach(error => console.log(`❌ ${error}`));
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser left open for manual inspection - close it when done');
    // await browser.close();
}

checkBlankSteps();