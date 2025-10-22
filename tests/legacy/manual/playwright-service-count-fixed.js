const { chromium } = require('playwright');

async function testServiceImageCountFixed() {
    console.log('🎭 PLAYWRIGHT TEST: SERVICE IMAGE COUNT VERIFICATION (FIXED)');
    console.log('='.repeat(70));
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    const page = await browser.newPage();
    
    try {
        console.log('📋 Step 1: Loading wizard...');
        await page.goto('http://162.55.213.90:3080/wizard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('✅ Step 2: Accepting terms...');
        await page.check('input[type="checkbox"]');
        await page.getByRole('button', { name: 'Commencer' }).click();
        await page.waitForTimeout(1000);
        
        console.log('✅ Step 3: Template step...');
        // Use more specific selector for the active step
        await page.locator('button:has-text("Suivant")').first().click();
        await page.waitForTimeout(1000);
        
        console.log('✅ Step 4: Business info step...');
        await page.fill('input[x-model="wizardData.siteName"]', 'Service Test');
        await page.fill('input[x-model="wizardData.domain"]', 'servicetest.com');
        await page.fill('input[x-model="wizardData.businessType"]', 'consulting');
        await page.waitForTimeout(500);
        
        // Use the enabled Next button for this step
        const businessNextButton = page.locator('button:has-text("Suivant")').filter({ hasText: /^Suivant$/ }).first();
        await businessNextButton.click();
        await page.waitForTimeout(1000);
        
        console.log('✅ Step 5: Creating services...');
        
        // Wait for the services section to load
        await page.waitForSelector('input[x-model="wizardData.services[0].name"]');
        
        // Fill 3 services
        await page.fill('input[x-model="wizardData.services[0].name"]', 'Service 1');
        await page.fill('textarea[x-model="wizardData.services[0].description"]', 'Description 1');
        
        // Add second service
        await page.click('button:has-text("Ajouter")');
        await page.waitForTimeout(500);
        await page.fill('input[x-model="wizardData.services[1].name"]', 'Service 2');
        await page.fill('textarea[x-model="wizardData.services[1].description"]', 'Description 2');
        
        // Add third service  
        await page.click('button:has-text("Ajouter")');
        await page.waitForTimeout(500);
        await page.fill('input[x-model="wizardData.services[2].name"]', 'Service 3');
        await page.fill('textarea[x-model="wizardData.services[2].description"]', 'Description 3');
        
        console.log('✅ Created 3 services successfully');
        
        // Proceed to next step (Images)
        const servicesNextButton = page.locator('button').filter({ hasText: 'Suivant' }).first();
        await servicesNextButton.click();
        await page.waitForTimeout(1500);
        
        console.log('🎯 Step 6: Now in Images step - Testing service image count...');
        
        // Select manual upload
        await page.click('text=J\'ai déjà mes images');
        await page.waitForTimeout(1000);
        
        // Now count service image upload fields
        console.log('🔍 Analyzing service image upload fields...');
        
        // Method 1: Count service file inputs directly
        const serviceInputs = await page.locator('input[type="file"][id*="serviceInput"]').count();
        console.log(`📊 Service file inputs found: ${serviceInputs}`);
        
        // Method 2: Count service upload containers
        const serviceContainers = await page.locator('div:has(input[id*="serviceInput"])').count();
        console.log(`📊 Service containers found: ${serviceContainers}`);
        
        // Method 3: Look for the specific service section
        const serviceSection = await page.locator('text=Images pour vos').first();
        const serviceSectionExists = await serviceSection.count() > 0;
        console.log(`📊 Service section exists: ${serviceSectionExists}`);
        
        if (serviceSectionExists) {
            // Get text content to see dynamic count
            const sectionText = await serviceSection.textContent();
            console.log(`📊 Service section text: "${sectionText}"`);
        }
        
        // Take screenshot for evidence
        await page.screenshot({ 
            path: 'tests/manual/playwright-service-verification.png', 
            fullPage: true 
        });
        console.log('📸 Screenshot saved: tests/manual/playwright-service-verification.png');
        
        // Final verdict
        console.log('\n🎯 PLAYWRIGHT TEST RESULTS:');
        console.log(`📊 Service image input fields detected: ${serviceInputs}`);
        
        if (serviceInputs === 3) {
            console.log('✅ SUCCESS: Found exactly 3 service image slots for 3 services');
            console.log('✅ SERVICE IMAGE COUNT FIX IS WORKING');
            return { success: true, count: serviceInputs, isFixed: true };
            
        } else if (serviceInputs === 6) {
            console.log('❌ FAILURE: Found 6 service image slots when should be 3');
            console.log('❌ SERVICE IMAGE COUNT FIX IS NOT WORKING');
            return { success: true, count: serviceInputs, isFixed: false };
            
        } else {
            console.log(`⚠️ UNEXPECTED: Found ${serviceInputs} service image slots`);
            return { success: true, count: serviceInputs, isFixed: false };
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: 'tests/manual/playwright-error.png' });
        return { success: false, error: error.message };
        
    } finally {
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// Run the test and report results
testServiceImageCountFixed().then(result => {
    console.log('\n🏁 FINAL PLAYWRIGHT VERDICT');
    console.log('='.repeat(50));
    
    if (result.success && result.isFixed) {
        console.log('🎉 ✅ CONFIRMED: Service image fix IS working correctly');
        console.log(`✅ Found ${result.count} service image slots for 3 services`);
        console.log('📋 If user still sees issues, it\'s browser caching on their end.');
        
    } else if (result.success && !result.isFixed) {
        console.log('❌ ❌ CONFIRMED: Service image fix is NOT working');
        console.log(`❌ Found ${result.count} service image slots, expected 3`);
        console.log('📋 There is still a hardcoded section that needs to be found.');
        
    } else {
        console.log('❌ Test could not complete due to technical issues');
        console.log('Error:', result.error);
    }
    
    console.log('\n📸 Check the screenshot for visual confirmation');
});