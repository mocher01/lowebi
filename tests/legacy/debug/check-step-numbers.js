const { chromium } = require('playwright');

async function checkStepNumbers() {
    console.log('🔢 Checking step numbers and titles...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(3000);
        
        // Find all step elements and their titles
        for (let step = 1; step <= 8; step++) {
            const stepElement = await page.locator(`[x-show="currentStep === ${step}"]`);
            const exists = await stepElement.count() > 0;
            
            if (exists) {
                // Get the title of this step
                const title = await page.evaluate((stepNum) => {
                    const stepDiv = document.querySelector(`[x-show="currentStep === ${stepNum}"]`);
                    if (stepDiv) {
                        const h2 = stepDiv.querySelector('h2, h1, h3');
                        return h2 ? h2.textContent.trim() : 'No title found';
                    }
                    return 'Step element not found';
                }, step);
                
                console.log(`📍 Step ${step}: "${title}"`);
            } else {
                console.log(`❌ Step ${step}: Not found`);
            }
        }
        
        // Also check the step indicators/breadcrumb if any
        const stepIndicators = await page.locator('.step-indicator, .breadcrumb, [class*="step"]').count();
        console.log(`🗂️ Step indicators found: ${stepIndicators}`);
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
    
    await browser.close();
}

checkStepNumbers();