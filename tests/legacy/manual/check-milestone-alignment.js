const { chromium } = require('playwright');

async function checkMilestoneAlignment() {
    console.log('🔍 Milestone Pastille Alignment Check');
    console.log('====================================');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        // Navigate to Step 5 to see all milestones
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 4; // Step 5 (Images)
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Check milestone pastilles alignment
        const milestoneAnalysis = await page.evaluate(() => {
            // Find all milestone elements (step indicators)
            const milestones = Array.from(document.querySelectorAll('.flex')).find(el => 
                el.textContent?.includes('Step 1') || 
                el.textContent?.includes('Step 2') ||
                el.textContent?.includes('Step 3') ||
                el.textContent?.includes('Step 4') ||
                el.textContent?.includes('Step 5') ||
                el.textContent?.includes('Step 6')
            );
            
            if (!milestones) {
                return { error: 'Could not find milestone container' };
            }
            
            // Find individual step elements
            const stepElements = Array.from(milestones.children || milestones.querySelectorAll('*')).filter(el => 
                el.textContent?.includes('Step')
            );
            
            const stepInfo = stepElements.map((step, index) => {
                const rect = step.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(step);
                
                // Try to find the pastille/circle indicator
                const pastille = step.querySelector('.bg-blue-600, .bg-green-600, .bg-gray-300, [class*="rounded-full"]') || 
                                step.querySelector('div[class*="w-8"], div[class*="h-8"]') ||
                                step;
                
                const pastilleRect = pastille ? pastille.getBoundingClientRect() : rect;
                
                return {
                    stepNumber: index + 1,
                    text: step.textContent?.trim().substring(0, 50),
                    height: rect.height,
                    top: rect.top,
                    bottom: rect.bottom,
                    pastilleHeight: pastilleRect.height,
                    pastilleTop: pastilleRect.top,
                    pastilleBottom: pastilleRect.bottom,
                    classes: step.className,
                    isCurrentStep: step.className?.includes('bg-blue-600') || step.className?.includes('current')
                };
            });
            
            return { stepInfo, totalSteps: stepInfo.length };
        });
        
        if (milestoneAnalysis.error) {
            console.log('❌ Error:', milestoneAnalysis.error);
            return;
        }
        
        console.log('\n📊 MILESTONE ALIGNMENT ANALYSIS:');
        console.log('=================================');
        
        milestoneAnalysis.stepInfo.forEach((step, index) => {
            const currentMarker = step.isCurrentStep ? ' ← CURRENT' : '';
            console.log(`\nStep ${step.stepNumber}:${currentMarker}`);
            console.log(`  Text: ${step.text}`);
            console.log(`  Element height: ${step.height}px`);
            console.log(`  Element top: ${step.top}px`);
            console.log(`  Pastille height: ${step.pastilleHeight}px`);
            console.log(`  Pastille top: ${step.pastilleTop}px`);
            console.log(`  Classes: ${step.classes}`);
        });
        
        // Check for alignment issues
        console.log('\n🎯 ALIGNMENT ANALYSIS:');
        console.log('======================');
        
        if (milestoneAnalysis.stepInfo.length >= 3) {
            const step4 = milestoneAnalysis.stepInfo[3]; // Step 4 (index 3)
            const step5 = milestoneAnalysis.stepInfo[4]; // Step 5 (index 4)  
            const step6 = milestoneAnalysis.stepInfo[5]; // Step 6 (index 5)
            
            if (step4 && step5 && step6) {
                const step4Top = step4.pastilleTop;
                const step5Top = step5.pastilleTop;
                const step6Top = step6.pastilleTop;
                
                console.log(`Step 4 pastille top: ${step4Top}px`);
                console.log(`Step 5 pastille top: ${step5Top}px`);  
                console.log(`Step 6 pastille top: ${step6Top}px`);
                
                const step5Diff = Math.abs(step5Top - step4Top);
                const step6Diff = Math.abs(step6Top - step4Top);
                
                console.log(`\nStep 5 vs Step 4 difference: ${step5Diff}px`);
                console.log(`Step 6 vs Step 4 difference: ${step6Diff}px`);
                
                if (step5Diff > 5) {
                    console.log(`❌ ALIGNMENT ISSUE: Step 5 is ${step5Diff}px off from Step 4`);
                    if (step5Top > step4Top) {
                        console.log('   Step 5 pastille is LOWER than Step 4');
                    } else {
                        console.log('   Step 5 pastille is HIGHER than Step 4');
                    }
                } else {
                    console.log('✅ Step 5 alignment looks good');
                }
                
                if (step6Diff > 5) {
                    console.log(`❌ ALIGNMENT ISSUE: Step 6 is ${step6Diff}px off from Step 4`);
                } else {
                    console.log('✅ Step 6 alignment looks good');
                }
            } else {
                console.log('⚠️ Could not find Step 4, 5, or 6 for comparison');
            }
        } else {
            console.log('⚠️ Not enough steps found for alignment analysis');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

checkMilestoneAlignment();