const { chromium } = require('playwright');

async function checkCurrentStepDebug() {
    console.log('🧪 Debugging currentStep variable...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(3000);
        
        // Check initial state
        const initialCheck = await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            return {
                mainDivExists: !!mainDiv,
                alpineDataExists: !!alpineData,
                currentStep: alpineData?.currentStep,
                wizardDataCurrentStep: alpineData?.wizardData?.currentStep
            };
        });
        
        console.log('Initial state:', initialCheck);
        
        // Try to set currentStep to 5
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5;
                if (alpineData.wizardData) {
                    alpineData.wizardData.currentStep = 5;
                }
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Check after setting
        const afterCheck = await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            
            // Check all step elements
            const stepElements = {};
            for (let i = 0; i <= 8; i++) {
                const element = document.querySelector(`[x-show="currentStep === ${i}"]`);
                stepElements[`step${i}`] = {
                    exists: !!element,
                    display: element ? window.getComputedStyle(element).display : 'not found',
                    visible: element ? element.offsetHeight > 0 : false
                };
            }
            
            return {
                currentStep: alpineData?.currentStep,
                wizardDataCurrentStep: alpineData?.wizardData?.currentStep,
                stepElements
            };
        });
        
        console.log('After setting currentStep to 5:', afterCheck);
        
        // Try setting to step 6
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 6;
                if (alpineData.wizardData) {
                    alpineData.wizardData.currentStep = 6;
                }
            }
        });
        
        await page.waitForTimeout(1000);
        
        const step6Check = await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            
            const step6Element = document.querySelector('[x-show="currentStep === 6"]');
            return {
                currentStep: alpineData?.currentStep,
                step6Exists: !!step6Element,
                step6Display: step6Element ? window.getComputedStyle(step6Element).display : 'not found',
                step6Visible: step6Element ? step6Element.offsetHeight > 0 : false,
                step6Content: step6Element ? step6Element.innerHTML.substring(0, 200) + '...' : 'no content'
            };
        });
        
        console.log('Step 6 check:', step6Check);
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
    
    await browser.close();
}

checkCurrentStepDebug();