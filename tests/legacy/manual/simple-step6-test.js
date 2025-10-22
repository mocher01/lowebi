const { chromium } = require('playwright');

async function testStep6() {
    console.log('🔍 Simple Step 6 Test (Working State)');
    console.log('=====================================');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        // Navigate to Step 6 (currentStep === 5)
        console.log('📍 Navigating to Step 6...');
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5; // Step 6
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Simple check - is Step 6 visible and has content?
        const step6Status = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 element not found' };
            
            return {
                exists: true,
                visible: step6.offsetHeight > 0,
                title: step6.querySelector('h2')?.textContent,
                contentLength: step6.textContent?.length || 0,
                hasParentIssues: step6.parentElement?.offsetHeight === 0
            };
        });
        
        console.log('📊 STEP 6 STATUS:');
        console.log('==================');
        console.log('✅ Step 6 exists:', step6Status.exists);
        console.log('👁️ Step 6 visible:', step6Status.visible);
        console.log('📝 Title:', step6Status.title);
        console.log('📏 Content length:', step6Status.contentLength, 'characters');
        console.log('👪 Parent height issue:', step6Status.hasParentIssues);
        
        if (step6Status.visible) {
            console.log('✅ STEP 6 IS WORKING - Content is visible');
        } else {
            console.log('❌ STEP 6 BLANK PAGE - Content exists but not visible');
            if (step6Status.contentLength > 0) {
                console.log('💡 Issue: Content exists but display/CSS problem');
            } else {
                console.log('💡 Issue: No content generated');
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testStep6();