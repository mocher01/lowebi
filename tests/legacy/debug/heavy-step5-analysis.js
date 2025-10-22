const { chromium } = require('playwright');

async function heavyStep5Analysis() {
    console.log('🔍 HEAVY TESTING: Step 5 (Images) Comprehensive Analysis');
    console.log('==================================================');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    const issues = [];
    
    try {
        // Load wizard and navigate to Step 5
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(3000);
        
        console.log('📍 Navigating to Step 5 (Images)...');
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 4; // Step 5 is index 4
                if (alpineData.wizardData) alpineData.wizardData.currentStep = 4;
            }
        });
        
        await page.waitForTimeout(2000);
        
        // === TEST 1: Step Identification ===
        console.log('\n🧪 TEST 1: Step Identification & Numbering');
        const stepInfo = await page.evaluate(() => {
            const step5Element = document.querySelector('[x-show="currentStep === 4"]');
            const allSteps = document.querySelectorAll('[x-show*="currentStep ==="]');
            
            return {
                step5Exists: !!step5Element,
                step5Title: step5Element?.querySelector('h2')?.textContent,
                allStepsCount: allSteps.length,
                allStepsTitles: Array.from(allSteps).map((step, index) => ({
                    index,
                    condition: step.getAttribute('x-show'),
                    title: step.querySelector('h2')?.textContent
                }))
            };
        });
        
        console.log('Step 5 Info:', stepInfo);
        
        if (!stepInfo.step5Exists) {
            issues.push('❌ CRITICAL: Step 5 element not found with x-show="currentStep === 4"');
        }
        
        if (!stepInfo.step5Title?.includes('Images') && !stepInfo.step5Title?.includes('Image')) {
            issues.push(`❌ TITLE MISMATCH: Step 5 title is "${stepInfo.step5Title}" but should be Images-related`);
        }
        
        // === TEST 2: UI Elements Analysis ===
        console.log('\n🧪 TEST 2: UI Elements Analysis');
        const uiAnalysis = await page.evaluate(() => {
            const step5 = document.querySelector('[x-show="currentStep === 4"]');
            if (!step5) return { error: 'Step 5 not found' };
            
            return {
                // Basic structure
                hasTitle: !!step5.querySelector('h2'),
                hasDescription: !!step5.querySelector('p'),
                
                // Image upload elements
                fileInputs: step5.querySelectorAll('input[type="file"]').length,
                fileInputIds: Array.from(step5.querySelectorAll('input[type="file"]')).map(input => input.id),
                
                // Image preview areas
                imagePreviewAreas: step5.querySelectorAll('[class*="preview"], [class*="image-preview"], img').length,
                
                // Buttons
                buttons: step5.querySelectorAll('button').length,
                buttonTexts: Array.from(step5.querySelectorAll('button')).map(btn => btn.textContent?.trim()),
                
                // AI generation elements
                aiButtons: step5.querySelectorAll('button[class*="ai"], button:has(*:contains("IA")), button:has(*:contains("AI"))').length,
                
                // Radio buttons/choices
                radioButtons: step5.querySelectorAll('input[type="radio"]').length,
                checkboxes: step5.querySelectorAll('input[type="checkbox"]').length,
                
                // Content length
                totalContent: step5.textContent?.length || 0,
                
                // Visibility
                isVisible: step5.offsetHeight > 0,
                displayStyle: window.getComputedStyle(step5).display
            };
        });
        
        console.log('UI Analysis:', uiAnalysis);
        
        if (uiAnalysis.error) {
            issues.push('❌ CRITICAL: Cannot analyze UI - Step 5 not accessible');
        } else {
            if (uiAnalysis.fileInputs === 0) {
                issues.push('❌ MISSING: No file input elements found for image upload');
            }
            if (uiAnalysis.totalContent < 100) {
                issues.push(`❌ CONTENT TOO SHORT: Step 5 has only ${uiAnalysis.totalContent} characters of content`);
            }
            if (!uiAnalysis.isVisible) {
                issues.push('❌ VISIBILITY: Step 5 is not visible (height = 0)');
            }
        }
        
        // === TEST 3: JavaScript Functionality ===
        console.log('\n🧪 TEST 3: JavaScript Functionality');
        const jsAnalysis = await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            
            if (!alpineData) return { error: 'Alpine.js data not accessible' };
            
            return {
                currentStep: alpineData.currentStep,
                hasWizardData: !!alpineData.wizardData,
                hasImages: !!alpineData.wizardData?.images,
                imageStructure: alpineData.wizardData?.images ? Object.keys(alpineData.wizardData.images) : [],
                hasImageChoices: !!alpineData.wizardData?.imageChoices,
                imageChoicesStructure: alpineData.wizardData?.imageChoices ? Object.keys(alpineData.wizardData.imageChoices) : [],
                hasFileHandlers: typeof alpineData.handleFileUpload === 'function',
                hasNavigationMethods: typeof alpineData.nextStep === 'function' && typeof alpineData.prevStep === 'function'
            };
        });
        
        console.log('JavaScript Analysis:', jsAnalysis);
        
        if (jsAnalysis.error) {
            issues.push('❌ CRITICAL: Alpine.js data not accessible');
        } else {
            if (jsAnalysis.currentStep !== 4) {
                issues.push(`❌ NAVIGATION: Expected currentStep=4 but got ${jsAnalysis.currentStep}`);
            }
            if (!jsAnalysis.hasImages) {
                issues.push('❌ DATA STRUCTURE: wizardData.images object missing');
            }
            if (!jsAnalysis.hasFileHandlers) {
                issues.push('❌ FUNCTIONALITY: handleFileUpload function not found');
            }
        }
        
        // === TEST 4: Image Upload Testing ===
        console.log('\n🧪 TEST 4: Image Upload Functionality');
        const uploadTest = await page.evaluate(() => {
            const fileInputs = document.querySelectorAll('input[type="file"]');
            const results = [];
            
            fileInputs.forEach((input, index) => {
                results.push({
                    index,
                    id: input.id,
                    accept: input.accept,
                    multiple: input.multiple,
                    hasChangeHandler: input.onchange !== null || input.getAttribute('@change') !== null,
                    isVisible: input.offsetWidth > 0 || input.offsetHeight > 0
                });
            });
            
            return results;
        });
        
        console.log('Upload Test Results:', uploadTest);
        
        uploadTest.forEach((result, index) => {
            if (!result.hasChangeHandler) {
                issues.push(`❌ UPLOAD HANDLER: File input ${index} (${result.id}) has no change handler`);
            }
            if (!result.accept || !result.accept.includes('image')) {
                issues.push(`❌ FILE TYPE: File input ${index} (${result.id}) doesn't restrict to images`);
            }
        });
        
        // === TEST 5: AI Generation Features ===
        console.log('\n🧪 TEST 5: AI Generation Features');
        const aiAnalysis = await page.evaluate(() => {
            const aiButtons = document.querySelectorAll('button');
            const aiRelated = [];
            
            aiButtons.forEach(button => {
                const text = button.textContent?.toLowerCase() || '';
                if (text.includes('ia') || text.includes('ai') || text.includes('générer') || text.includes('generate')) {
                    aiRelated.push({
                        text: button.textContent?.trim(),
                        disabled: button.disabled,
                        hasClickHandler: button.onclick !== null || button.getAttribute('@click') !== null,
                        visible: button.offsetHeight > 0
                    });
                }
            });
            
            return aiRelated;
        });
        
        console.log('AI Features Analysis:', aiAnalysis);
        
        if (aiAnalysis.length === 0) {
            issues.push('❌ AI FEATURES: No AI generation buttons found');
        } else {
            aiAnalysis.forEach((ai, index) => {
                if (!ai.hasClickHandler) {
                    issues.push(`❌ AI HANDLER: AI button "${ai.text}" has no click handler`);
                }
                if (!ai.visible) {
                    issues.push(`❌ AI VISIBILITY: AI button "${ai.text}" is not visible`);
                }
            });
        }
        
        // === TEST 6: Navigation Testing ===
        console.log('\n🧪 TEST 6: Navigation Testing');
        const navigationTest = await page.evaluate(() => {
            const prevButton = document.querySelector('button[x-text*="previous"], button:contains("Précédent"), button[class*="prev"]');
            const nextButton = document.querySelector('button[x-text*="next"], button:contains("Suivant"), button[class*="next"]');
            
            return {
                hasPrevButton: !!prevButton,
                hasNextButton: !!nextButton,
                prevButtonText: prevButton?.textContent?.trim(),
                nextButtonText: nextButton?.textContent?.trim(),
                prevDisabled: prevButton?.disabled,
                nextDisabled: nextButton?.disabled
            };
        });
        
        console.log('Navigation Test:', navigationTest);
        
        if (!navigationTest.hasPrevButton) {
            issues.push('❌ NAVIGATION: Previous button not found');
        }
        if (!navigationTest.hasNextButton) {
            issues.push('❌ NAVIGATION: Next button not found');
        }
        
        // === TEST 7: Responsive Design ===
        console.log('\n🧪 TEST 7: Responsive Design Testing');
        
        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        const mobileTest = await page.evaluate(() => {
            const step5 = document.querySelector('[x-show="currentStep === 4"]');
            if (!step5) return { error: 'Step 5 not found' };
            
            return {
                visible: step5.offsetHeight > 0,
                width: step5.offsetWidth,
                hasOverflow: step5.scrollWidth > step5.offsetWidth
            };
        });
        
        console.log('Mobile Test:', mobileTest);
        
        if (mobileTest.hasOverflow) {
            issues.push('❌ RESPONSIVE: Content overflows on mobile view');
        }
        
        // Reset to desktop
        await page.setViewportSize({ width: 1200, height: 800 });
        
        // === TEST 8: Performance Analysis ===
        console.log('\n🧪 TEST 8: Performance Analysis');
        const performanceMetrics = await page.evaluate(() => {
            const step5 = document.querySelector('[x-show="currentStep === 4"]');
            if (!step5) return { error: 'Step 5 not found' };
            
            const startTime = performance.now();
            
            // Trigger re-render
            step5.style.display = 'none';
            step5.offsetHeight; // Force reflow
            step5.style.display = '';
            step5.offsetHeight; // Force reflow
            
            const endTime = performance.now();
            
            return {
                renderTime: endTime - startTime,
                elementCount: step5.querySelectorAll('*').length,
                imageElements: step5.querySelectorAll('img, [style*="background-image"]').length
            };
        });
        
        console.log('Performance Metrics:', performanceMetrics);
        
        if (performanceMetrics.renderTime > 100) {
            issues.push(`⚠️ PERFORMANCE: Step 5 re-render took ${performanceMetrics.renderTime}ms (>100ms threshold)`);
        }
        
    } catch (error) {
        issues.push(`❌ CRITICAL ERROR: Test failed with error: ${error.message}`);
        console.error('Test error:', error);
    }
    
    await browser.close();
    
    // === FINAL REPORT ===
    console.log('\n\n🔴 ISSUES FOUND:');
    console.log('================');
    
    if (issues.length === 0) {
        console.log('✅ No issues found! Step 5 appears to be working correctly.');
    } else {
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
        
        console.log(`\n📊 SUMMARY: Found ${issues.length} issues in Step 5 (Images)`);
        
        // Categorize issues
        const critical = issues.filter(i => i.includes('❌ CRITICAL'));
        const missing = issues.filter(i => i.includes('❌ MISSING'));
        const functionality = issues.filter(i => i.includes('❌') && !i.includes('CRITICAL') && !i.includes('MISSING'));
        const warnings = issues.filter(i => i.includes('⚠️'));
        
        console.log(`\n📈 BREAKDOWN:`);
        console.log(`   Critical: ${critical.length}`);
        console.log(`   Missing Features: ${missing.length}`);
        console.log(`   Functionality Issues: ${functionality.length}`);
        console.log(`   Warnings: ${warnings.length}`);
    }
    
    return issues;
}

heavyStep5Analysis();