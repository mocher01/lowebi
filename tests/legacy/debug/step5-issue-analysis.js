const { chromium } = require('playwright');

async function analyzeStep5Issues() {
    console.log('🔍 Step 5 (Images) Issue Analysis');
    console.log('================================');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const issues = [];
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        // Navigate to Step 5
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 4;
                if (alpineData.wizardData) alpineData.wizardData.currentStep = 4;
            }
        });
        
        await page.waitForTimeout(1000);
        
        // CRITICAL DISCOVERY: Step numbering mismatch
        const stepAnalysis = await page.evaluate(() => {
            return {
                currentStepInData: document.querySelector('[x-data="enhancedWizardApp()"]')?._x_dataStack?.[0]?.currentStep,
                allSteps: Array.from(document.querySelectorAll('[x-show*="currentStep ==="]')).map((step, index) => ({
                    index,
                    condition: step.getAttribute('x-show'),
                    title: step.querySelector('h2')?.textContent?.trim(),
                    visible: step.offsetHeight > 0
                })),
                step4Content: document.querySelector('[x-show="currentStep === 4"]')?.querySelector('h2')?.textContent,
                step5Content: document.querySelector('[x-show="currentStep === 5"]')?.querySelector('h2')?.textContent
            };
        });
        
        console.log('\n📊 STEP NUMBERING ANALYSIS:');
        console.log('===========================');
        console.log('Current step in Alpine data:', stepAnalysis.currentStepInData);
        console.log('Step 4 title:', stepAnalysis.step4Content);
        console.log('Step 5 title:', stepAnalysis.step5Content);
        
        console.log('\nAll steps:');
        stepAnalysis.allSteps.forEach(step => {
            console.log(`  ${step.condition} -> "${step.title}" ${step.visible ? '(VISIBLE)' : '(HIDDEN)'}`);
        });
        
        // ISSUE 1: Step numbering confusion
        if (stepAnalysis.step4Content?.includes('Images')) {
            console.log('\n✅ CONFIRMED: Step 5 (Images) is actually at index 4');
            console.log('   User expects: Step 5 = Images');
            console.log('   Code reality: currentStep === 4 = Images');
        } else {
            issues.push('❌ STEP MISMATCH: Images step not found at expected index');
        }
        
        // ISSUE 2: Multiple steps with similar titles
        const revisionSteps = stepAnalysis.allSteps.filter(s => 
            s.title?.includes('Révision') || s.title?.includes('Review')
        );
        
        if (revisionSteps.length > 1) {
            issues.push(`❌ DUPLICATE STEPS: Found ${revisionSteps.length} revision steps`);
            revisionSteps.forEach(step => {
                console.log(`     ${step.condition} -> "${step.title}"`);
            });
        }
        
        // ISSUE 3: Steps 6,7,8 still exist (should have been removed)
        const extraSteps = stepAnalysis.allSteps.filter(s => {
            const match = s.condition.match(/currentStep === (\d+)/);
            return match && parseInt(match[1]) >= 6;
        });
        
        if (extraSteps.length > 0) {
            issues.push(`❌ UNWANTED STEPS: Steps 6,7,8 still exist (${extraSteps.length} found)`);
            extraSteps.forEach(step => {
                console.log(`     ${step.condition} -> "${step.title}"`);
            });
        }
        
        // Detailed Step 5 (Images) analysis
        console.log('\n🖼️ STEP 5 (IMAGES) DETAILED ANALYSIS:');
        console.log('=====================================');
        
        const step5Analysis = await page.evaluate(() => {
            const step5 = document.querySelector('[x-show="currentStep === 4"]');
            if (!step5) return { error: 'Step 5 not found' };
            
            const fileInputs = step5.querySelectorAll('input[type="file"]');
            const buttons = step5.querySelectorAll('button');
            const radioInputs = step5.querySelectorAll('input[type="radio"]');
            const imagePreviewElements = step5.querySelectorAll('[class*="preview"], img, [style*="background-image"]');
            
            return {
                visible: step5.offsetHeight > 0,
                contentLength: step5.textContent?.length || 0,
                
                // File inputs
                fileInputCount: fileInputs.length,
                fileInputIds: Array.from(fileInputs).map(input => ({
                    id: input.id,
                    accept: input.accept,
                    name: input.name,
                    hasHandler: input.getAttribute('@change') !== null
                })),
                
                // Buttons
                buttonCount: buttons.length,
                buttonTexts: Array.from(buttons).map(btn => btn.textContent?.trim()),
                
                // Radio buttons (for choices)
                radioCount: radioInputs.length,
                radioNames: Array.from(radioInputs).map(r => r.name),
                
                // Image previews
                imagePreviewCount: imagePreviewElements.length,
                
                // Text content analysis
                hasUploadText: step5.textContent?.includes('upload') || step5.textContent?.includes('télécharg'),
                hasAIText: step5.textContent?.includes('IA') || step5.textContent?.includes('AI') || step5.textContent?.includes('générer'),
                
                // Structure
                sections: step5.querySelectorAll('div[class*="border"], .bg-').length
            };
        });
        
        console.log('Step 5 Analysis:', step5Analysis);
        
        if (step5Analysis.error) {
            issues.push('❌ CRITICAL: Step 5 (Images) element not accessible');
        } else {
            // File upload issues
            if (step5Analysis.fileInputCount === 0) {
                issues.push('❌ NO FILE INPUTS: Step 5 has no file upload inputs');
            } else {
                step5Analysis.fileInputIds.forEach((input, index) => {
                    if (!input.hasHandler) {
                        issues.push(`❌ NO HANDLER: File input "${input.id}" has no @change handler`);
                    }
                    if (!input.accept || !input.accept.includes('image')) {
                        issues.push(`❌ NO IMAGE FILTER: File input "${input.id}" doesn't restrict to images`);
                    }
                });
            }
            
            // Content issues
            if (step5Analysis.contentLength < 500) {
                issues.push(`❌ THIN CONTENT: Step 5 has only ${step5Analysis.contentLength} characters`);
            }
            
            if (!step5Analysis.hasUploadText && !step5Analysis.hasAIText) {
                issues.push('❌ MISSING GUIDANCE: No upload or AI generation guidance text');
            }
            
            // Navigation issues
            if (step5Analysis.buttonCount < 2) {
                issues.push(`❌ NAVIGATION: Expected prev/next buttons, found only ${step5Analysis.buttonCount} buttons`);
            }
        }
        
        // Check navigation functionality
        console.log('\n🧭 NAVIGATION TESTING:');
        console.log('======================');
        
        const navigationTest = await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            
            if (!alpineData) return { error: 'No Alpine data' };
            
            const originalStep = alpineData.currentStep;
            
            // Test navigation methods
            const hasNextStep = typeof alpineData.nextStep === 'function';
            const hasPrevStep = typeof alpineData.prevStep === 'function';
            
            let canGoNext = false;
            let canGoPrev = false;
            
            if (hasNextStep) {
                try {
                    alpineData.nextStep();
                    canGoNext = alpineData.currentStep !== originalStep;
                    alpineData.currentStep = originalStep; // Reset
                } catch (e) {
                    console.error('nextStep error:', e);
                }
            }
            
            if (hasPrevStep) {
                try {
                    alpineData.prevStep();
                    canGoPrev = alpineData.currentStep !== originalStep;
                    alpineData.currentStep = originalStep; // Reset
                } catch (e) {
                    console.error('prevStep error:', e);
                }
            }
            
            return {
                hasNextStep,
                hasPrevStep,
                canGoNext,
                canGoPrev,
                currentStep: originalStep,
                stepsArrayLength: alpineData.steps?.length || 0
            };
        });
        
        console.log('Navigation Test:', navigationTest);
        
        if (!navigationTest.hasNextStep) {
            issues.push('❌ NAVIGATION: nextStep() method not found');
        }
        if (!navigationTest.hasPrevStep) {
            issues.push('❌ NAVIGATION: prevStep() method not found');
        }
        if (!navigationTest.canGoNext && navigationTest.currentStep < 5) {
            issues.push('❌ NAVIGATION: Cannot navigate to next step from Step 5');
        }
        
    } catch (error) {
        issues.push(`❌ CRITICAL ERROR: ${error.message}`);
        console.error('Test error:', error);
    }
    
    await browser.close();
    
    console.log('\n\n🔴 ALL ISSUES FOUND:');
    console.log('====================');
    
    if (issues.length === 0) {
        console.log('✅ No issues found!');
    } else {
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
        
        console.log(`\n📊 TOTAL ISSUES: ${issues.length}`);
    }
    
    return issues;
}

analyzeStep5Issues();