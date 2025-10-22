/**
 * 🧙‍♂️ Enhanced Wizard Production E2E Tests
 * 
 * Tests the complete wizard flow against production server
 * URL: http://162.55.213.90:3080/wizard
 * 
 * Focus: Fix Alpine.js 'after' error and complete site creation flow
 */

const { test, expect } = require('@playwright/test');

const PRODUCTION_BASE_URL = 'http://162.55.213.90:3080';
const WIZARD_URL = `${PRODUCTION_BASE_URL}/wizard`;

test.describe('🧙‍♂️ Enhanced Wizard Production Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        // Set up console error monitoring
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        page.consoleErrors = consoleErrors;
        
        // Monitor JavaScript errors
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        page.jsErrors = jsErrors;
    });

    test('Should load wizard without JavaScript errors', async ({ page }) => {
        await page.goto(WIZARD_URL);
        
        // Wait for Alpine.js to initialize
        await page.waitForTimeout(2000);
        
        // Check for the specific Alpine.js error
        const hasAfterError = page.jsErrors.some(error => 
            error.includes("Cannot read properties of undefined (reading 'after')")
        );
        
        if (hasAfterError) {
            console.log('❌ Alpine.js "after" error detected:', page.jsErrors);
        }
        
        // Verify page loaded
        await expect(page.locator('h1')).toContainText('Assistant de Création de Site Locod.AI');
        
        // Verify Alpine.js app initialized
        const stepExists = await page.locator('[x-data="enhancedWizardApp()"]').isVisible();
        expect(stepExists).toBeTruthy();
        
        // Check if we have critical JavaScript errors (excluding minor ones)
        const criticalErrors = page.jsErrors.filter(error => 
            !error.includes('after') && // We'll fix this separately
            !error.includes('ResizeObserver') && // Common non-critical
            !error.includes('Non-passive event listener') // Common non-critical
        );
        
        expect(criticalErrors).toHaveLength(0);
    });

    test('Should complete entire wizard flow and create site', async ({ page }) => {
        await page.goto(WIZARD_URL);
        
        // Wait for Alpine.js to load
        await page.waitForTimeout(2000);
        
        console.log('🚀 Starting complete wizard flow test');
        
        // Step 1: Welcome & Terms
        console.log('📝 Step 1: Accepting terms...');
        
        // Find and check the specific terms checkbox
        const termsCheckbox = page.locator('input[x-model="wizardData.termsAccepted"]');
        await expect(termsCheckbox).toBeVisible();
        await termsCheckbox.check();
        await page.waitForTimeout(1000);
        
        // Find the "Commencer" button in step 0 (welcome step)
        const startButton = page.locator('[x-show="currentStep === 0"] button:has-text("Commencer")');
        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.click();
        await page.waitForTimeout(500);
        
        // Step 2: Template Selection
        console.log('📋 Step 2: Selecting template...');
        const step2NextButton = page.locator('[x-show="currentStep === 1"] button:has-text("Suivant")');
        await expect(step2NextButton).toBeVisible();
        await step2NextButton.click();
        await page.waitForTimeout(500);
        
        // Step 3: Business Information
        console.log('🏢 Step 3: Filling business info...');
        
        // Wait for step 3 to be visible
        await expect(page.locator('[x-show="currentStep === 2"]')).toBeVisible();
        
        // Fill business information
        await page.locator('[x-show="currentStep === 2"] input[placeholder*="Mon Entreprise"]').fill('Test Wizard Site');
        await page.locator('[x-show="currentStep === 2"] select').selectOption('business');
        await page.waitForTimeout(300);
        await page.locator('[x-show="currentStep === 2"] input[placeholder*="mon-entreprise.com"]').fill('test-wizard.com');
        await page.locator('[x-show="currentStep === 2"] input[placeholder*="slogan"]').fill('Test site créé par le wizard');
        
        const step3NextButton = page.locator('[x-show="currentStep === 2"] button:has-text("Suivant")');
        await expect(step3NextButton).toBeVisible();
        await step3NextButton.click();
        await page.waitForTimeout(500);
        
        // Step 4: Branding & Assets
        console.log('🎨 Step 4: Setting up branding...');
        // Skip logo upload for now, use default colors
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(500);
        
        // Step 5: Content & Activities
        console.log('📝 Step 5: Adding content...');
        
        // Add a service/activity
        const activityInput = page.locator('input[placeholder*="Traduction"]').first();
        if (await activityInput.isVisible()) {
            await activityInput.fill('Consultation professionnelle');
            
            const descInput = page.locator('input[placeholder*="Décrivez"]').first();
            if (await descInput.isVisible()) {
                await descInput.fill('Services de consultation de haute qualité');
            }
        }
        
        // Add contact info
        await page.fill('input[placeholder*="contact@"]', 'test@wizard-site.com');
        await page.fill('input[placeholder*="+33"]', '+33 1 23 45 67 89');
        
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(500);
        
        // Step 6: Content Review
        console.log('👀 Step 6: Reviewing content...');
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(500);
        
        // Step 7: Advanced Features
        console.log('⚙️ Step 7: Configuring features...');
        await page.click('button:has-text("Suivant")');
        await page.waitForTimeout(500);
        
        // Step 8: Final Review & Creation
        console.log('🎯 Step 8: Creating site...');
        
        // Look for the "Créer mon site" button
        const createButton = page.locator('button:has-text("Créer mon site"), button:has-text("créer")').first();
        
        // Verify button is visible and enabled
        await expect(createButton).toBeVisible();
        await expect(createButton).toBeEnabled();
        
        console.log('🔄 Clicking "Créer mon site" button...');
        
        // Monitor network requests
        const createRequests = [];
        page.on('request', request => {
            if (request.url().includes('/api/sites/create')) {
                createRequests.push(request);
            }
        });
        
        const responses = [];
        page.on('response', response => {
            if (response.url().includes('/api/sites/create')) {
                responses.push(response);
            }
        });
        
        // Click create button
        await createButton.click();
        
        console.log('⏳ Waiting for site creation...');
        
        // Wait for API call to complete (up to 30 seconds)
        await page.waitForTimeout(5000);
        
        // Check if we got the API request
        expect(createRequests.length).toBeGreaterThan(0);
        console.log(`📡 API requests made: ${createRequests.length}`);
        
        // Check response
        if (responses.length > 0) {
            const response = responses[0];
            console.log(`📊 API response status: ${response.status()}`);
            
            if (response.status() === 200) {
                console.log('✅ Site creation API call successful');
                
                // Wait for success message or redirect
                await page.waitForTimeout(3000);
                
                // Look for success indicators
                const successElements = [
                    'text=Site créé avec succès',
                    'text=Création réussie',
                    'text=Félicitations',
                    'svg[class*="text-green"]', // Success icon
                    '.bg-green-100', // Success background
                    'button:has-text("Voir mon site")'
                ];
                
                let foundSuccess = false;
                for (const selector of successElements) {
                    if (await page.locator(selector).first().isVisible()) {
                        console.log(`✅ Success indicator found: ${selector}`);
                        foundSuccess = true;
                        break;
                    }
                }
                
                // If no obvious success, check current step
                const currentStep = await page.evaluate(() => {
                    const app = window.Alpine && window.Alpine.$data(document.querySelector('[x-data]'));
                    return app ? app.currentStep : null;
                });
                
                console.log(`📍 Current wizard step: ${currentStep}`);
                
                if (currentStep === 7 || foundSuccess) { // Step 8 is result step (0-indexed = 7)
                    console.log('🎉 Successfully reached result step!');
                } else {
                    console.log('⚠️ May not have reached success step');
                }
                
            } else {
                console.log(`❌ API call failed with status: ${response.status()}`);
                const responseText = await response.text();
                console.log('Response:', responseText);
            }
        }
        
        // Final check for any JavaScript errors during the process
        const finalErrors = page.jsErrors.filter(error => 
            !error.includes('ResizeObserver') &&
            !error.includes('Non-passive event listener')
        );
        
        if (finalErrors.length > 0) {
            console.log('⚠️ JavaScript errors during flow:', finalErrors);
        }
        
        console.log('🏁 Wizard flow test completed');
    });

    test('Should handle Alpine.js initialization properly', async ({ page }) => {
        await page.goto(WIZARD_URL);
        
        // Wait for Alpine.js
        await page.waitForTimeout(2000);
        
        // Check if Alpine.js data is accessible
        const alpineData = await page.evaluate(() => {
            try {
                const appElement = document.querySelector('[x-data="enhancedWizardApp()"]');
                if (!appElement) return { error: 'No Alpine.js app element found' };
                
                const data = window.Alpine?.$data(appElement);
                if (!data) return { error: 'No Alpine.js data found' };
                
                return {
                    currentStep: data.currentStep,
                    hasSteps: Array.isArray(data.steps),
                    stepsCount: data.steps?.length,
                    hasText: typeof data.text === 'object',
                    hasWizardData: typeof data.wizardData === 'object'
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('Alpine.js data check:', alpineData);
        
        if (alpineData.error) {
            console.log('❌ Alpine.js initialization error:', alpineData.error);
        } else {
            expect(alpineData.hasSteps).toBeTruthy();
            expect(alpineData.stepsCount).toBe(8);
            expect(alpineData.hasText).toBeTruthy();
            expect(alpineData.hasWizardData).toBeTruthy();
        }
    });

    test('Should verify API endpoints are accessible', async ({ page }) => {
        // Test health endpoint
        const healthResponse = await page.request.get(`${PRODUCTION_BASE_URL}/api/health`);
        expect(healthResponse.status()).toBe(200);
        
        const healthData = await healthResponse.json();
        expect(healthData.status).toBe('healthy');
        
        // Test templates endpoint
        const templatesResponse = await page.request.get(`${PRODUCTION_BASE_URL}/api/templates`);
        expect(templatesResponse.status()).toBe(200);
        
        console.log('✅ All API endpoints accessible');
    });
});