/**
 * 🔍 Wizard Debug Test - Diagnose exact UI state
 */

const { test, expect } = require('@playwright/test');

const PRODUCTION_BASE_URL = 'http://162.55.213.90:3080';
const WIZARD_URL = `${PRODUCTION_BASE_URL}/wizard`;

test.describe('🔍 Wizard Debug Tests', () => {
    
    test('Debug wizard state and button visibility', async ({ page }) => {
        await page.goto(WIZARD_URL);
        
        // Wait for Alpine.js
        await page.waitForTimeout(3000);
        
        // Get current wizard state
        const wizardState = await page.evaluate(() => {
            try {
                const appElement = document.querySelector('[x-data="enhancedWizardApp()"]');
                const data = window.Alpine?.$data(appElement);
                
                return {
                    currentStep: data?.currentStep,
                    selectedTemplate: data?.wizardData?.selectedTemplate,
                    termsAccepted: data?.wizardData?.termsAccepted,
                    language: data?.language,
                    stepsCount: data?.steps?.length,
                    currentStepTitle: data?.steps?.[data?.currentStep]?.title
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('🔍 Wizard State:', JSON.stringify(wizardState, null, 2));
        
        // Check all steps visibility
        for (let stepIndex = 0; stepIndex < 8; stepIndex++) {
            const stepVisible = await page.locator(`[x-show="currentStep === ${stepIndex}"]`).isVisible();
            console.log(`📍 Step ${stepIndex} visible: ${stepVisible}`);
        }
        
        // Check checkbox state
        const checkboxExists = await page.locator('input[type="checkbox"]').count();
        const checkboxChecked = checkboxExists > 0 ? await page.locator('input[type="checkbox"]').isChecked() : false;
        console.log(`☑️ Checkbox exists: ${checkboxExists}, checked: ${checkboxChecked}`);
        
        // Find all "Suivant" buttons
        const suivantButtons = await page.locator('button:has-text("Suivant")').count();
        console.log(`🔘 Total "Suivant" buttons found: ${suivantButtons}`);
        
        // Check each button's visibility and state
        for (let i = 0; i < suivantButtons; i++) {
            const button = page.locator('button:has-text("Suivant")').nth(i);
            const visible = await button.isVisible();
            const enabled = visible ? await button.isEnabled() : false;
            const disabled = visible ? await button.getAttribute('disabled') : null;
            
            console.log(`🔘 Button ${i}: visible=${visible}, enabled=${enabled}, disabled=${disabled}`);
            
            if (visible) {
                // Get button's parent step
                const stepContainer = await button.locator('xpath=ancestor::div[contains(@class, "wizard-step")]').count();
                console.log(`🔘 Button ${i} in wizard-step container: ${stepContainer > 0}`);
            }
        }
        
        // Try to check terms if not checked
        if (checkboxExists > 0 && !checkboxChecked) {
            console.log('☑️ Checking terms checkbox...');
            await page.check('input[type="checkbox"]');
            await page.waitForTimeout(1000);
            
            // Recheck button state after checking terms
            const buttonAfter = page.locator('button:has-text("Suivant")').first();
            const visibleAfter = await buttonAfter.isVisible();
            const enabledAfter = visibleAfter ? await buttonAfter.isEnabled() : false;
            console.log(`🔘 After checking terms: visible=${visibleAfter}, enabled=${enabledAfter}`);
        }
        
        // Check current step content
        const currentStepContent = await page.locator('[x-show="currentStep === 0"]').innerHTML();
        console.log('📝 Step 0 content preview:', currentStepContent.substring(0, 200) + '...');
        
        // Final state check
        const finalState = await page.evaluate(() => {
            const appElement = document.querySelector('[x-data="enhancedWizardApp()"]');
            const data = window.Alpine?.$data(appElement);
            return {
                currentStep: data?.currentStep,
                termsAccepted: data?.wizardData?.termsAccepted,
                selectedTemplate: data?.wizardData?.selectedTemplate
            };
        });
        
        console.log('🏁 Final State:', JSON.stringify(finalState, null, 2));
    });
    
    test('Test manual step navigation', async ({ page }) => {
        await page.goto(WIZARD_URL);
        await page.waitForTimeout(3000);
        
        // Try to manually trigger nextStep
        const result = await page.evaluate(() => {
            try {
                const appElement = document.querySelector('[x-data="enhancedWizardApp()"]');
                const data = window.Alpine?.$data(appElement);
                
                console.log('Before:', data.currentStep);
                
                // Check terms
                data.wizardData.termsAccepted = true;
                
                // Try nextStep
                if (typeof data.nextStep === 'function') {
                    data.nextStep();
                }
                
                console.log('After:', data.currentStep);
                
                return {
                    success: true,
                    currentStep: data.currentStep
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        console.log('🎯 Manual navigation result:', result);
    });
});