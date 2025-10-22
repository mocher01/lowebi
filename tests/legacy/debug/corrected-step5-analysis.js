const { chromium } = require('playwright');

async function correctedStep5Analysis() {
    console.log('🔍 CORRECTED Step 5 Analysis (Based on User Feedback)');
    console.log('=====================================================');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const issues = [];
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        console.log('📍 Testing what the user sees as "Step 5"...');
        
        // Let's check what happens when we navigate to step 5 FROM THE USER PERSPECTIVE
        // User clicks step 5 in the UI - what shows up?
        
        // First check: what is the step navigation showing?
        const stepNavigation = await page.evaluate(() => {
            const stepElements = document.querySelectorAll('[class*="step-"], .step, [data-step]');
            const progressSteps = document.querySelectorAll('.bg-blue-600, .bg-green-600, [class*="progress"]');
            
            // Find navigation elements
            const navElements = Array.from(document.querySelectorAll('button, .cursor-pointer')).filter(el => 
                el.textContent?.includes('step') || 
                el.textContent?.includes('étape') ||
                el.getAttribute('class')?.includes('step')
            );
            
            return {
                stepElementsFound: stepElements.length,
                progressElementsFound: progressSteps.length,
                navigationElements: navElements.map(el => el.textContent?.trim()),
                
                // Try to find the step indicator/progress bar
                progressIndicator: document.querySelector('.steps, .wizard-steps, [class*="step-indicator"]')?.innerHTML?.substring(0, 200)
            };
        });
        
        console.log('Step Navigation Analysis:', stepNavigation);
        
        // Try different approaches to reach "Step 5" as user expects it
        console.log('\n🧪 Testing Navigation to Step 5...');
        
        // Method 1: Set currentStep to 5 (user expectation)
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5; // USER EXPECTS STEP 5 = IMAGES
                if (alpineData.wizardData) alpineData.wizardData.currentStep = 5;
            }
        });
        
        await page.waitForTimeout(1000);
        
        const step5Test = await page.evaluate(() => {
            const step5Element = document.querySelector('[x-show="currentStep === 5"]');
            return {
                exists: !!step5Element,
                visible: step5Element?.offsetHeight > 0,
                title: step5Element?.querySelector('h2')?.textContent,
                contentPreview: step5Element?.textContent?.substring(0, 200) + '...',
                isImagesContent: step5Element?.textContent?.toLowerCase().includes('image') ||
                                step5Element?.textContent?.toLowerCase().includes('visual') ||
                                step5Element?.innerHTML?.includes('input[type="file"]')
            };
        });
        
        console.log('Step 5 (currentStep === 5) Analysis:', step5Test);
        
        if (!step5Test.exists) {
            issues.push('❌ CRITICAL: No element with x-show="currentStep === 5" found');
        } else if (!step5Test.isImagesContent) {
            issues.push(`❌ CONTENT MISMATCH: Step 5 shows "${step5Test.title}" instead of Images content`);
        }
        
        // Method 2: Set currentStep to 4 and see what shows
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 4;
                if (alpineData.wizardData) alpineData.wizardData.currentStep = 4;
            }
        });
        
        await page.waitForTimeout(1000);
        
        const step4Test = await page.evaluate(() => {
            const step4Element = document.querySelector('[x-show="currentStep === 4"]');
            return {
                exists: !!step4Element,
                visible: step4Element?.offsetHeight > 0,
                title: step4Element?.querySelector('h2')?.textContent,
                isImagesContent: step4Element?.textContent?.toLowerCase().includes('image') ||
                                step4Element?.textContent?.toLowerCase().includes('visual') ||
                                step4Element?.innerHTML?.includes('input[type="file"]')
            };
        });
        
        console.log('Step 4 (currentStep === 4) Analysis:', step4Test);
        
        // IDENTIFY THE CORE PROBLEM
        if (step4Test.isImagesContent && !step5Test.isImagesContent) {
            issues.push('❌ INDEX MISMATCH: Images content is at currentStep===4 but user expects it at Step 5');
            console.log('\n🚨 CORE PROBLEM IDENTIFIED:');
            console.log('   User UI shows: Step 5 = Images');
            console.log('   Code reality: currentStep === 4 = Images');
            console.log('   This creates confusion in navigation and bug reports');
        }
        
        // Now analyze the ACTUAL images step (wherever it is)
        const imagesStepIndex = step4Test.isImagesContent ? 4 : (step5Test.isImagesContent ? 5 : -1);
        
        if (imagesStepIndex === -1) {
            issues.push('❌ CRITICAL: Cannot find Images step at any index');
            return;
        }
        
        console.log(`\n🖼️ ANALYZING IMAGES STEP (currentStep === ${imagesStepIndex}):`);
        console.log('=======================================================');
        
        await page.evaluate((stepIndex) => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = stepIndex;
                if (alpineData.wizardData) alpineData.wizardData.currentStep = stepIndex;
            }
        }, imagesStepIndex);
        
        await page.waitForTimeout(1000);
        
        // Deep analysis of the Images step
        const imagesStepAnalysis = await page.evaluate((stepIndex) => {
            const stepElement = document.querySelector(`[x-show="currentStep === ${stepIndex}"]`);
            if (!stepElement) return { error: 'Images step not found' };
            
            // Check for nested steps (user reported issue #5)
            const nestedStepElements = stepElement.querySelectorAll('[x-show*="currentStep"]');
            const nestedSteps = Array.from(nestedStepElements).map(nested => ({
                condition: nested.getAttribute('x-show'),
                title: nested.querySelector('h2')?.textContent,
                visible: nested.offsetHeight > 0
            }));
            
            // Count buttons more precisely
            const allButtons = stepElement.querySelectorAll('button');
            const visibleButtons = Array.from(allButtons).filter(btn => btn.offsetHeight > 0);
            const hiddenButtons = Array.from(allButtons).filter(btn => btn.offsetHeight === 0);
            
            // Analyze button purposes
            const buttonAnalysis = Array.from(visibleButtons).map(btn => ({
                text: btn.textContent?.trim().substring(0, 50),
                isVisible: btn.offsetHeight > 0,
                isUploadBtn: btn.textContent?.toLowerCase().includes('upload') || btn.textContent?.toLowerCase().includes('télécharg'),
                isAIBtn: btn.textContent?.toLowerCase().includes('ia') || btn.textContent?.toLowerCase().includes('ai') || btn.textContent?.toLowerCase().includes('génér'),
                isNavBtn: btn.textContent?.toLowerCase().includes('précédent') || btn.textContent?.toLowerCase().includes('suivant')
            }));
            
            // File input analysis
            const fileInputs = stepElement.querySelectorAll('input[type="file"]');
            const fileInputAnalysis = Array.from(fileInputs).map((input, index) => ({
                index,
                id: input.id,
                visible: input.offsetHeight > 0 || input.offsetWidth > 0,
                hasLabel: !!input.closest('label') || !!document.querySelector(`label[for="${input.id}"]`),
                purpose: input.id.includes('service') ? 'service' : 
                        input.id.includes('hero') ? 'hero' : 
                        input.id.includes('logo') ? 'logo' : 'unknown'
            }));
            
            return {
                // Nesting issue
                hasNestedSteps: nestedSteps.length > 0,
                nestedSteps: nestedSteps,
                
                // Button analysis
                totalButtons: allButtons.length,
                visibleButtons: visibleButtons.length,
                hiddenButtons: hiddenButtons.length,
                buttonBreakdown: {
                    upload: buttonAnalysis.filter(b => b.isUploadBtn).length,
                    ai: buttonAnalysis.filter(b => b.isAIBtn).length,
                    navigation: buttonAnalysis.filter(b => b.isNavBtn).length,
                    other: buttonAnalysis.filter(b => !b.isUploadBtn && !b.isAIBtn && !b.isNavBtn).length
                },
                
                // File input analysis
                fileInputs: fileInputAnalysis.length,
                fileInputBreakdown: {
                    visible: fileInputAnalysis.filter(f => f.visible).length,
                    withLabels: fileInputAnalysis.filter(f => f.hasLabel).length,
                    services: fileInputAnalysis.filter(f => f.purpose === 'service').length,
                    hero: fileInputAnalysis.filter(f => f.purpose === 'hero').length,
                    logo: fileInputAnalysis.filter(f => f.purpose === 'logo').length,
                    unknown: fileInputAnalysis.filter(f => f.purpose === 'unknown').length
                },
                
                // Content structure
                mainSections: stepElement.querySelectorAll('div[class*="border"], div[class*="bg-"], div[class*="p-"]').length,
                hasTabStructure: stepElement.querySelector('[role="tab"], [class*="tab"]') !== null
            };
        }, imagesStepIndex);
        
        console.log('Images Step Deep Analysis:', imagesStepAnalysis);
        
        // Identify specific issues based on analysis
        if (imagesStepAnalysis.hasNestedSteps) {
            issues.push(`❌ NESTING BUG: Found ${imagesStepAnalysis.nestedSteps.length} nested step elements inside Images step`);
            imagesStepAnalysis.nestedSteps.forEach(nested => {
                issues.push(`   └── ${nested.condition} -> "${nested.title}" ${nested.visible ? '(VISIBLE)' : '(HIDDEN)'}`);
            });
        }
        
        if (imagesStepAnalysis.visibleButtons > 20) {
            issues.push(`❌ UI BLOAT: Too many visible buttons (${imagesStepAnalysis.visibleButtons}) in Images step`);
        }
        
        if (imagesStepAnalysis.fileInputBreakdown.unknown > 5) {
            issues.push(`❌ UNCLEAR INPUTS: ${imagesStepAnalysis.fileInputBreakdown.unknown} file inputs have unclear purpose`);
        }
        
        if (imagesStepAnalysis.fileInputBreakdown.visible < imagesStepAnalysis.fileInputs / 2) {
            issues.push(`❌ HIDDEN INPUTS: Many file inputs are hidden (${imagesStepAnalysis.fileInputs - imagesStepAnalysis.fileInputBreakdown.visible} out of ${imagesStepAnalysis.fileInputs})`);
        }
        
    } catch (error) {
        issues.push(`❌ CRITICAL ERROR: ${error.message}`);
        console.error('Test error:', error);
    }
    
    await browser.close();
    
    console.log('\n\n🔴 CORRECTED ISSUE LIST:');
    console.log('========================');
    
    if (issues.length === 0) {
        console.log('✅ No issues found after corrections!');
    } else {
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
        
        console.log(`\n📊 TOTAL ISSUES: ${issues.length}`);
    }
    
    return issues;
}

correctedStep5Analysis();