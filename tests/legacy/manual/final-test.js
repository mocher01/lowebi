const { chromium } = require('playwright');

async function testCurrentInterface() {
    console.log('🎯 Testing ACTUAL current interface...');
    
    const browser = await chromium.launch({ headless: false, slowMo: 1500 });
    const page = await browser.newPage();
    
    try {
        // Navigate to wizard
        console.log('📍 Loading wizard...');
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForLoadState('networkidle');
        
        // Step 0: Welcome
        await page.waitForSelector('text=Assistant de Création de Site Locod.AI', { timeout: 10000 });
        console.log('✅ Wizard loaded successfully');
        
        await page.check('input[type="checkbox"]');
        await page.click('button:has-text("Commencer")');
        console.log('✅ Step 0: Welcome completed');
        
        // Step 1: Template
        await page.waitForSelector('text=Sélection', { timeout: 10000 });
        
        // Check if there's any AI generation content in Step 1 (should be removed)
        const aiContentInStep1 = await page.locator('text=✓ Logo navbar').count();
        if (aiContentInStep1 > 0) {
            console.log('❌ AI content still found in Step 1!');
            return false;
        }
        console.log('✅ Step 1: No AI content found (correct)');
        
        await page.click('button:has-text("Suivant")');
        console.log('✅ Step 1: Template completed');
        
        // Step 2: Business Info (with input field, not select)
        await page.waitForSelector('input[x-model="wizardData.siteName"]', { timeout: 10000 });
        await page.fill('input[x-model="wizardData.siteName"]', 'Test Final Site');
        
        // Business type is now an input with suggestions
        const businessTypeInput = 'input[x-model="wizardData.businessType"]';
        await page.fill(businessTypeInput, 'traduction');
        
        // Wait for suggestions and click one
        await page.waitForSelector('text=Services de Traduction', { timeout: 5000 });
        await page.click('text=Services de Traduction');
        
        await page.fill('input[x-model="wizardData.domain"]', 'test-final.com');
        await page.fill('input[x-model="wizardData.slogan"]', 'Test Final Slogan');
        await page.click('button:has-text("Suivant")');
        console.log('✅ Step 2: Business Info completed');
        
        // Step 3: Content
        await page.waitForSelector('text=Contenu', { timeout: 10000 });
        
        // Add contact email (required)
        await page.fill('input[x-model="wizardData.contact.email"]', 'test@final.com');
        
        // Add a service
        const addServiceBtn = await page.locator('button:has-text("Ajouter")').first();
        await addServiceBtn.click();
        
        await page.fill('input[placeholder*="service"]', 'Final Test Service');
        await page.fill('textarea[placeholder*="description"]', 'Final test service description');
        
        await page.click('button:has-text("Suivant")');
        console.log('✅ Step 3: Content completed');
        
        // Step 4: Images - THE KEY TEST!
        console.log('🎯 TESTING STEP 4 - NEW SIMPLIFIED INTERFACE...');
        
        await page.waitForSelector('text=Images et Visuels', { timeout: 10000 });
        await page.screenshot({ path: 'step4-live.png' });
        
        // Check for the new 3-option interface
        const manualText = await page.locator('text=J\'ai déjà mes images').isVisible();
        const aiText = await page.locator('text=Générer mes images par IA').isVisible();
        const mixedText = await page.locator('text=Approche mixte').isVisible();
        
        console.log('🔍 Interface visibility check:');
        console.log('  - "J\'ai déjà mes images":', manualText);
        console.log('  - "Générer mes images par IA":', aiText);
        console.log('  - "Approche mixte":', mixedText);
        
        if (!manualText || !aiText || !mixedText) {
            // Check what text IS visible
            const bodyText = await page.evaluate(() => {
                const step4 = document.querySelector('[x-show="currentStep === 4"]');
                return step4 ? step4.textContent.substring(0, 1000) : 'Step 4 not found';
            });
            console.log('📝 Step 4 content:', bodyText);
            
            throw new Error('New 3-option interface not found!');
        }
        console.log('✅ New 3-option interface found');
        
        // Test each option
        console.log('🧪 Testing manual option...');
        await page.click('text=J\'ai déjà mes images');
        await page.waitForSelector('text=Uploadez vos propres logos', { timeout: 5000 });
        await page.screenshot({ path: 'step4-manual-live.png' });
        console.log('✅ Manual upload interface shows correctly');
        
        console.log('🧪 Testing AI option...');
        await page.click('text=Générer mes images par IA');
        await page.waitForSelector('text=Style visuel souhaité', { timeout: 5000 });
        await page.screenshot({ path: 'step4-ai-live.png' });
        console.log('✅ AI generation interface shows correctly');
        
        console.log('🧪 Testing mixed option...');
        await page.click('text=Approche mixte');
        await page.waitForSelector('text=Logo navigation', { timeout: 5000 });
        await page.screenshot({ path: 'step4-mixed-live.png' });
        console.log('✅ Mixed approach interface shows correctly');
        
        console.log('🎉 ALL TESTS PASSED - INTERFACE IS WORKING!');
        return true;
        
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        await page.screenshot({ path: 'test-failure-live.png' });
        return false;
    } finally {
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

testCurrentInterface().then(success => {
    if (success) {
        console.log('🏆 CURRENT INTERFACE IS WORKING CORRECTLY!');
        console.log('✅ All Step 4 fixes have been successfully deployed');
        process.exit(0);
    } else {
        console.log('💥 INTERFACE STILL HAS ISSUES!');
        process.exit(1);
    }
});