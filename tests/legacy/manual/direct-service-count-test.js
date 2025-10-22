const { chromium } = require('playwright');

async function directServiceCountTest() {
    console.log('🎭 DIRECT SERVICE COUNT TEST - STEP 4 ANALYSIS');
    console.log('='.repeat(60));
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();
    
    try {
        console.log('📋 Loading wizard and injecting test data...');
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        // Inject test data directly via JavaScript to skip navigation issues
        await page.evaluate(() => {
            // Set up wizard data with 3 services
            window.wizardData = {
                siteName: 'Test Site',
                domain: 'test.com',
                businessType: 'consulting',
                services: [
                    { id: 1, name: 'Service 1', description: 'Description 1' },
                    { id: 2, name: 'Service 2', description: 'Description 2' },
                    { id: 3, name: 'Service 3', description: 'Description 3' }
                ],
                blog: {
                    articles: [
                        { title: 'Article 1', excerpt: 'Excerpt 1' },
                        { title: 'Article 2', excerpt: 'Excerpt 2' },
                        { title: 'Article 3', excerpt: 'Excerpt 3' }
                    ]
                }
            };
            
            // Force step 4 (Images step)
            window.currentStep = 4;
            window.imageApproach = 'manual';
            
            console.log('Test data injected - 3 services, 3 blog articles, step 4');
        });
        
        await page.waitForTimeout(2000);
        
        console.log('🔍 Analyzing service image sections in Step 4...');
        
        // Method 1: Count all service-related file inputs
        const serviceInputs = await page.locator('input[type="file"][id*="serviceInput"], input[type="file"][x-ref*="serviceInput"]').count();
        console.log(`📊 Service file inputs: ${serviceInputs}`);
        
        // Method 2: Count service upload areas
        const serviceUploadAreas = await page.locator('div[class*="border-dashed"]:has(input[id*="serviceInput"]), div[class*="border-dashed"]:has(input[x-ref*="serviceInput"])').count();
        console.log(`📊 Service upload areas: ${serviceUploadAreas}`);
        
        // Method 3: Look for service sections specifically
        const serviceSections = await page.locator('text=Images pour vos').count();
        console.log(`📊 "Images pour vos" sections: ${serviceSections}`);
        
        // Method 4: Count elements with service-related click handlers
        const serviceClickHandlers = await page.locator('[onclick*="service"], [x-click*="service"], [click*="service"]').count();
        console.log(`📊 Service click handlers: ${serviceClickHandlers}`);
        
        // Method 5: Check for specific hardcoded patterns
        const pageContent = await page.content();
        
        // Look for hardcoded loops
        const hardcodedLoops = (pageContent.match(/x-for="[^"]*i in \d+[^"]*"/g) || []);
        console.log(`📊 Hardcoded loops found: ${hardcodedLoops.length}`);
        if (hardcodedLoops.length > 0) {
            console.log('   Hardcoded loops:', hardcodedLoops);
        }
        
        // Look for slice operations
        const sliceOperations = (pageContent.match(/\.slice\(0,\s*\d+\)/g) || []);
        console.log(`📊 Slice operations found: ${sliceOperations.length}`);
        if (sliceOperations.length > 0) {
            console.log('   Slice operations:', sliceOperations);
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: 'tests/manual/direct-service-count-test.png', 
            fullPage: true 
        });
        console.log('📸 Screenshot saved: tests/manual/direct-service-count-test.png');
        
        console.log('\n🎯 ANALYSIS RESULTS:');
        console.log(`Expected: 3 service image slots`);
        console.log(`Found: ${serviceInputs} service file inputs`);
        
        let diagnosis = '';
        if (serviceInputs === 3) {
            diagnosis = '✅ SUCCESS: Service count matches expected (3)';
        } else if (serviceInputs === 6) {
            diagnosis = '❌ PROBLEM: Found 6 service slots, indicates hardcoded section or duplicate';
        } else if (serviceInputs === 0) {
            diagnosis = '⚠️ NO INPUTS: Service section might not be visible or test data not applied';
        } else {
            diagnosis = `⚠️ UNEXPECTED: Found ${serviceInputs} service slots`;
        }
        
        console.log(diagnosis);
        
        return {
            serviceInputs,
            serviceSections,
            hardcodedLoops: hardcodedLoops.length,
            sliceOperations: sliceOperations.length,
            diagnosis
        };
        
    } catch (error) {
        console.error('❌ Direct test failed:', error.message);
        await page.screenshot({ path: 'tests/manual/direct-test-error.png' });
        return { error: error.message };
        
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

// Run the direct test
directServiceCountTest().then(result => {
    console.log('\n🏁 DIRECT TEST VERDICT');
    console.log('='.repeat(40));
    
    if (result.error) {
        console.log('❌ Test failed:', result.error);
    } else {
        console.log('📊 Results Summary:');
        console.log(`   Service inputs: ${result.serviceInputs}`);
        console.log(`   Service sections: ${result.serviceSections}`);
        console.log(`   Hardcoded loops: ${result.hardcodedLoops}`);
        console.log(`   Slice operations: ${result.sliceOperations}`);
        console.log('\n' + result.diagnosis);
        
        if (result.serviceInputs === 6) {
            console.log('\n📋 ACTION NEEDED: Find and remove the hardcoded/duplicate service section');
        } else if (result.serviceInputs === 3) {
            console.log('\n📋 CONCLUSION: Fix is working, user issue is likely browser caching');
        }
    }
});