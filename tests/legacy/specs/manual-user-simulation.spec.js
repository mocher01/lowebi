/**
 * 👤 Manual User Simulation Test
 * 
 * Simulate exactly what a real user would do step by step
 */

const { test, expect } = require('@playwright/test');

const PRODUCTION_BASE_URL = 'http://162.55.213.90:3080';
const WIZARD_URL = `${PRODUCTION_BASE_URL}/wizard`;

test.describe('👤 Manual User Simulation', () => {
    
    test('Simulate real user step-by-step journey', async ({ page }) => {
        // Enable slow motion to see what happens
        await page.goto(WIZARD_URL);
        
        console.log('👤 Starting manual user simulation...');
        console.log('🌐 Page loaded, waiting for Alpine.js...');
        
        // Wait longer for Alpine.js like a real user would
        await page.waitForTimeout(5000);
        
        // Step 0: Check if we see the welcome page
        const welcomeTitle = await page.locator('h1').textContent();
        console.log(`📄 Page title: "${welcomeTitle}"`);
        
        const welcomeStep = await page.locator('[x-show="currentStep === 0"]').isVisible();
        console.log(`👁️ Welcome step visible: ${welcomeStep}`);
        
        if (!welcomeStep) {
            console.log('❌ Welcome step not visible, checking current step...');
            const currentStep = await page.evaluate(() => {
                const app = window.Alpine?.$data(document.querySelector('[x-data]'));
                return app?.currentStep;
            });
            console.log(`📍 Current step: ${currentStep}`);
            return;
        }
        
        // Step 0: Accept terms (like a real user reading them)
        console.log('📋 Step 0: Reading terms and accepting...');
        
        const termsCheckbox = page.locator('input[x-model="wizardData.termsAccepted"]');
        await expect(termsCheckbox).toBeVisible();
        
        // Simulate user reading terms
        await page.waitForTimeout(2000);
        await termsCheckbox.check();
        await page.waitForTimeout(1000);
        
        // Click "Commencer"
        const startButton = page.locator('[x-show="currentStep === 0"] button');
        await expect(startButton).toBeEnabled();
        
        console.log('🚀 Clicking "Commencer" button...');
        await startButton.click();
        await page.waitForTimeout(2000);
        
        // Step 1: Template selection
        console.log('📋 Step 1: Template selection...');
        await expect(page.locator('[x-show="currentStep === 1"]')).toBeVisible();
        
        // User would look at templates, then click next
        await page.waitForTimeout(1500);
        const step1Next = page.locator('[x-show="currentStep === 1"] button:has-text("Suivant")');
        await expect(step1Next).toBeVisible();
        await step1Next.click();
        await page.waitForTimeout(2000);
        
        // Step 2: Fill business info (slowly like a real user)
        console.log('🏢 Step 2: Filling business information...');
        await expect(page.locator('[x-show="currentStep === 2"]')).toBeVisible();
        
        // Fill site name
        const siteNameInput = page.locator('[x-show="currentStep === 2"] input[x-model="wizardData.siteName"]');
        await siteNameInput.click();
        await siteNameInput.fill(''); // Clear first
        await page.waitForTimeout(500);
        await siteNameInput.type('Mon Site Test', { delay: 100 }); // Type slowly
        await page.waitForTimeout(500);
        
        // Select business type
        const businessSelect = page.locator('[x-show="currentStep === 2"] select[x-model="wizardData.businessType"]');
        await businessSelect.click();
        await page.waitForTimeout(500);
        await businessSelect.selectOption('business');
        await page.waitForTimeout(1000);
        
        // Fill domain
        const domainInput = page.locator('[x-show="currentStep === 2"] input[x-model="wizardData.domain"]');
        await domainInput.click();
        await domainInput.type('mon-site-test.com', { delay: 80 });
        await page.waitForTimeout(500);
        
        // Fill slogan
        const sloganInput = page.locator('[x-show="currentStep === 2"] input[x-model="wizardData.slogan"]');
        await sloganInput.click();
        await sloganInput.type('Mon slogan de test', { delay: 80 });
        await page.waitForTimeout(1000);
        
        const step2Next = page.locator('[x-show="currentStep === 2"] button:has-text("Suivant")');
        await expect(step2Next).toBeEnabled();
        console.log('➡️ Step 2 complete, clicking Next...');
        await step2Next.click();
        await page.waitForTimeout(2000);
        
        // Step 3: Branding (skip for now)
        console.log('🎨 Step 3: Branding & Assets...');
        await expect(page.locator('[x-show="currentStep === 3"]')).toBeVisible();
        
        await page.waitForTimeout(1500); // User would look at options
        const step3Next = page.locator('[x-show="currentStep === 3"] button:has-text("Suivant")');
        await step3Next.click();
        await page.waitForTimeout(2000);
        
        // Step 4: Content & Activities
        console.log('📝 Step 4: Content & Activities...');
        await expect(page.locator('[x-show="currentStep === 4"]')).toBeVisible();
        
        // Fill email (required)
        const emailInput = page.locator('[x-show="currentStep === 4"] input[x-model="wizardData.contact.email"]');
        await emailInput.click();
        await emailInput.type('test@mon-site.com', { delay: 80 });
        await page.waitForTimeout(500);
        
        // Try to add an activity if input exists
        const activityInputs = page.locator('[x-show="currentStep === 4"] input').first();
        if (await activityInputs.isVisible()) {
            await activityInputs.click();
            await activityInputs.type('Consultation professionelle', { delay: 80 });
            await page.waitForTimeout(500);
        }
        
        const step4Next = page.locator('[x-show="currentStep === 4"] button:has-text("Suivant")');
        await step4Next.click();
        await page.waitForTimeout(2000);
        
        // Step 5: Content Review
        console.log('👀 Step 5: Content Review...');
        await expect(page.locator('[x-show="currentStep === 5"]')).toBeVisible();
        
        await page.waitForTimeout(1500); // User would review
        const step5Next = page.locator('[x-show="currentStep === 5"] button:has-text("Suivant")');
        await step5Next.click();
        await page.waitForTimeout(2000);
        
        // Step 6: Advanced Features
        console.log('⚙️ Step 6: Advanced Features...');
        await expect(page.locator('[x-show="currentStep === 6"]')).toBeVisible();
        
        await page.waitForTimeout(1500);
        const step6Next = page.locator('[x-show="currentStep === 6"] button:has-text("Suivant")');
        await step6Next.click();
        await page.waitForTimeout(2000);
        
        // Step 7: Final step - the critical moment
        console.log('🎯 Step 7: Final Review & Creation...');
        await expect(page.locator('[x-show="currentStep === 7"]')).toBeVisible();
        
        // User would review everything
        await page.waitForTimeout(3000);
        
        // Check what the user sees
        const finalStepContent = await page.locator('[x-show="currentStep === 7"]').innerHTML();
        console.log('👁️ Final step content preview:', finalStepContent.substring(0, 300) + '...');
        
        // Find all buttons in final step
        const finalStepButtons = await page.locator('[x-show="currentStep === 7"] button').count();
        console.log(`🔘 Number of buttons in final step: ${finalStepButtons}`);
        
        for (let i = 0; i < finalStepButtons; i++) {
            const button = page.locator('[x-show="currentStep === 7"] button').nth(i);
            const text = await button.textContent();
            const visible = await button.isVisible();
            const enabled = await button.isEnabled();
            console.log(`  Button ${i}: "${text}" - visible: ${visible}, enabled: ${enabled}`);
        }
        
        // Look for the create button
        const createButton = page.locator('[x-show="currentStep === 7"] button').filter({ hasText: /Créer|créer/ });
        
        if (await createButton.count() === 0) {
            console.log('❌ No "Créer" button found!');
            
            // Try to find any button that might be the create button
            const allButtons = page.locator('[x-show="currentStep === 7"] button');
            const buttonCount = await allButtons.count();
            
            for (let i = 0; i < buttonCount; i++) {
                const btn = allButtons.nth(i);
                const btnText = await btn.textContent();
                const btnClass = await btn.getAttribute('class');
                console.log(`  Checking button: "${btnText}" with class: "${btnClass}"`);
                
                // Try clicking any button that looks like a primary action
                if (btnClass?.includes('bg-green') || btnClass?.includes('bg-blue') || 
                    btnText?.toLowerCase().includes('créer') || btnText?.toLowerCase().includes('create')) {
                    console.log(`🔄 Trying to click: "${btnText}"`);
                    
                    // Monitor for API calls
                    let apiCalled = false;
                    page.on('response', response => {
                        if (response.url().includes('/api/sites/create')) {
                            apiCalled = true;
                            console.log(`📡 API called: ${response.status()}`);
                        }
                    });
                    
                    await btn.click();
                    await page.waitForTimeout(5000);
                    
                    if (apiCalled) {
                        console.log('✅ API was called after button click!');
                    } else {
                        console.log('❌ No API call detected');
                    }
                    
                    break;
                }
            }
        } else {
            console.log('✅ Found "Créer" button, attempting click...');
            
            await expect(createButton).toBeVisible();
            await expect(createButton).toBeEnabled();
            
            // Monitor API calls
            let createApiResponse = null;
            page.on('response', response => {
                if (response.url().includes('/api/sites/create')) {
                    createApiResponse = response;
                }
            });
            
            console.log('🔄 User clicks "Créer mon site"...');
            await createButton.click();
            
            // Wait like a real user would
            await page.waitForTimeout(8000);
            
            if (createApiResponse) {
                console.log(`📡 API Response: ${createApiResponse.status()}`);
                
                // Check final state
                const finalState = await page.evaluate(() => {
                    const app = window.Alpine?.$data(document.querySelector('[x-data]'));
                    return {
                        currentStep: app?.currentStep,
                        creationResult: app?.creationResult,
                        isCreating: app?.isCreating
                    };
                });
                
                console.log('🏁 Final wizard state:', finalState);
                
                if (finalState.creationResult?.success) {
                    console.log('🎉 SUCCESS! Site created successfully');
                    console.log(`📝 Site ID: ${finalState.creationResult.siteId}`);
                } else {
                    console.log('❌ Creation failed:', finalState.creationResult?.error);
                }
            } else {
                console.log('❌ No API response - button click may not have worked');
            }
        }
        
        console.log('🏁 Manual user simulation complete');
    });
});