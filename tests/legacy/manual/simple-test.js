const { chromium } = require('playwright');

async function simpleTest() {
    console.log('Testing wizard page...');
    
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot
        await page.screenshot({ path: 'current-wizard.png' });
        
        // Check what's on the page
        const title = await page.title();
        console.log('Page title:', title);
        
        // Check for key elements
        const elements = await page.evaluate(() => {
            return {
                hasWizard: !!document.querySelector('[x-data]'),
                hasSteps: document.querySelectorAll('.step').length,
                hasAlpine: typeof window.Alpine !== 'undefined',
                bodyText: document.body.textContent.substring(0, 500)
            };
        });
        
        console.log('Page elements:', elements);
        
        // Wait to see what happens
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('Error:', error.message);
        await page.screenshot({ path: 'error-wizard.png' });
    } finally {
        await browser.close();
    }
}

simpleTest();