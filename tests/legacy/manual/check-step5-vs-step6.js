const { chromium } = require('playwright');

async function checkStep5VsStep6() {
    console.log('🧪 Real Playwright test to compare Step 5 vs Step 6...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(3000);
        
        // Initialize wizard data
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.wizardData = {
                    ...alpineData.wizardData,
                    siteName: 'TestSite',
                    businessType: 'restaurant',
                    services: [
                        { name: 'Service 1', description: 'Desc 1' },
                        { name: 'Service 2', description: 'Desc 2' },
                        { name: 'Service 3', description: 'Desc 3' }
                    ]
                };
            }
        });
        
        // TEST STEP 5 (should work according to user)
        console.log('\n📍 TESTING STEP 5 (Révision Finale):');
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5;
                alpineData.wizardData.currentStep = 5;
            }
        });
        
        await page.waitForTimeout(2000);
        
        const step5Test = await page.evaluate(() => {
            const step5 = document.querySelector('[x-show="currentStep === 5"]');
            return {
                exists: !!step5,
                visible: step5 ? step5.offsetHeight > 0 && step5.offsetWidth > 0 : false,
                display: step5 ? window.getComputedStyle(step5).display : 'not found',
                height: step5 ? step5.offsetHeight : 0,
                width: step5 ? step5.offsetWidth : 0,
                titleFound: Array.from(document.querySelectorAll('h2')).some(h => h.textContent.includes('Révision')),
                contentLength: step5 ? step5.textContent.length : 0
            };
        });
        
        console.log('Step 5 Results:', step5Test);
        
        if (step5Test.visible) {
            console.log('✅ Step 5 is visible and working');
            
            // Check if tabs work
            const tabsWork = await page.evaluate(() => {
                const configTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Configuration'));
                const imagesTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Images'));
                return {
                    configTabFound: !!configTab,
                    imagesTabFound: !!imagesTab,
                    configTabVisible: configTab ? configTab.offsetHeight > 0 : false,
                    imagesTabVisible: imagesTab ? imagesTab.offsetHeight > 0 : false
                };
            });
            console.log('Step 5 Tabs:', tabsWork);
        } else {
            console.log('❌ Step 5 is NOT visible - user was wrong!');
        }
        
        await page.waitForTimeout(1000);
        
        // TEST STEP 6 (should be blank according to user)
        console.log('\n📍 TESTING STEP 6 (Fonctionnalités Avancées):');
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 6;
                alpineData.wizardData.currentStep = 6;
            }
        });
        
        await page.waitForTimeout(2000);
        
        const step6Test = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 6"]');
            return {
                exists: !!step6,
                visible: step6 ? step6.offsetHeight > 0 && step6.offsetWidth > 0 : false,
                display: step6 ? window.getComputedStyle(step6).display : 'not found',
                height: step6 ? step6.offsetHeight : 0,
                width: step6 ? step6.offsetWidth : 0,
                titleFound: Array.from(document.querySelectorAll('h2')).some(h => h.textContent.includes('Fonctionnalités')),
                contentLength: step6 ? step6.textContent.length : 0,
                parentDisplay: step6 && step6.parentElement ? window.getComputedStyle(step6.parentElement).display : 'no parent'
            };
        });
        
        console.log('Step 6 Results:', step6Test);
        
        if (!step6Test.visible) {
            console.log('❌ Step 6 is NOT visible - confirming user\'s issue');
            
            // Check what's wrong
            const problemAnalysis = await page.evaluate(() => {
                const step6 = document.querySelector('[x-show="currentStep === 6"]');
                if (!step6) return 'Step 6 element not found';
                
                const issues = [];
                if (step6.offsetHeight === 0) issues.push('zero height');
                if (step6.offsetWidth === 0) issues.push('zero width');
                if (window.getComputedStyle(step6).display === 'none') issues.push('display none');
                if (window.getComputedStyle(step6).visibility === 'hidden') issues.push('visibility hidden');
                
                // Check parent
                const parent = step6.parentElement;
                if (parent && window.getComputedStyle(parent).display === 'none') {
                    issues.push('parent hidden');
                }
                
                return issues.length > 0 ? issues.join(', ') : 'unknown issue';
            });
            
            console.log('Step 6 Problems:', problemAnalysis);
        } else {
            console.log('✅ Step 6 is visible - user issue not reproduced');
        }
        
        // Compare the two
        console.log('\n📊 COMPARISON:');
        console.log(`Step 5 visible: ${step5Test.visible} (height: ${step5Test.height})`);
        console.log(`Step 6 visible: ${step6Test.visible} (height: ${step6Test.height})`);
        
        // Take screenshots
        await page.screenshot({ path: './tests/manual/step5-screenshot.png' });
        console.log('📸 Step 5 screenshot: ./tests/manual/step5-screenshot.png');
        
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 6;
                alpineData.wizardData.currentStep = 6;
            }
        });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: './tests/manual/step6-screenshot.png' });
        console.log('📸 Step 6 screenshot: ./tests/manual/step6-screenshot.png');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
    
    await browser.close();
}

checkStep5VsStep6();