const { chromium } = require('playwright');

async function diagnoseStep5Nesting() {
    console.log('🔍 URGENT: Diagnosing Step 5 Display Mess');
    console.log('=========================================');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard');
        await page.waitForTimeout(2000);
        
        // Navigate to Step 5 (Images) - currentStep === 4
        console.log('📍 Navigating to Step 5 (Images)...');
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 4; // Step 5 (Images)
                if (alpineData.wizardData) alpineData.wizardData.currentStep = 4;
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Analyze the DOM structure of Step 5
        const step5Analysis = await page.evaluate(() => {
            const step5 = document.querySelector('[x-show="currentStep === 4"]');
            if (!step5) return { error: 'Step 5 not found' };
            
            // Find the 3 main choices
            const choiceElements = [];
            
            // Look for text indicating the choices
            const allDivs = step5.querySelectorAll('div');
            allDivs.forEach((div, index) => {
                const text = div.textContent?.toLowerCase() || '';
                if (text.includes("j'ai déjà mes images") || text.includes('jai deja mes images')) {
                    choiceElements.push({
                        type: 'choice1_manual',
                        element: div,
                        text: div.textContent?.substring(0, 100),
                        level: div.querySelectorAll('div').length, // nesting level
                        hasButtons: div.querySelectorAll('button').length,
                        buttonTexts: Array.from(div.querySelectorAll('button')).map(btn => btn.textContent?.trim().substring(0, 30))
                    });
                }
                if (text.includes('générer') && (text.includes('ia') || text.includes('ai'))) {
                    choiceElements.push({
                        type: 'choice2_ai',
                        element: div,
                        text: div.textContent?.substring(0, 100),
                        level: div.querySelectorAll('div').length,
                        hasButtons: div.querySelectorAll('button').length,
                        buttonTexts: Array.from(div.querySelectorAll('button')).map(btn => btn.textContent?.trim().substring(0, 30))
                    });
                }
                if (text.includes('mixte') || text.includes('approche mixte')) {
                    choiceElements.push({
                        type: 'choice3_mixed',
                        element: div,
                        text: div.textContent?.substring(0, 100),
                        level: div.querySelectorAll('div').length,
                        hasButtons: div.querySelectorAll('button').length,
                        buttonTexts: Array.from(div.querySelectorAll('button')).map(btn => btn.textContent?.trim().substring(0, 30))
                    });
                }
            });
            
            // Check for nested step elements inside Step 5
            const nestedSteps = [];
            const stepElements = step5.querySelectorAll('[x-show*="currentStep ==="]');
            stepElements.forEach(stepEl => {
                const condition = stepEl.getAttribute('x-show');
                const title = stepEl.querySelector('h2')?.textContent;
                const visible = stepEl.offsetHeight > 0;
                const buttons = stepEl.querySelectorAll('button').length;
                
                nestedSteps.push({
                    condition,
                    title,
                    visible,
                    buttons,
                    parentChoice: null // We'll determine this below
                });
            });
            
            // Check parent-child relationships
            choiceElements.forEach(choice => {
                choice.nestedSteps = [];
                choice.nestedChoices = [];
                
                // Find nested steps inside this choice
                const nestedStepEls = choice.element.querySelectorAll('[x-show*="currentStep ==="]');
                nestedStepEls.forEach(stepEl => {
                    const condition = stepEl.getAttribute('x-show');
                    const title = stepEl.querySelector('h2')?.textContent;
                    choice.nestedSteps.push({ condition, title });
                });
                
                // Find nested choices inside this choice
                const otherChoices = choice.element.querySelectorAll('div');
                otherChoices.forEach(div => {
                    const text = div.textContent?.toLowerCase() || '';
                    if (div !== choice.element) {
                        if (text.includes('générer') || text.includes('mixte') || text.includes('déjà')) {
                            choice.nestedChoices.push({
                                text: text.substring(0, 50) + '...',
                                buttons: div.querySelectorAll('button').length
                            });
                        }
                    }
                });
            });
            
            // Count total navigation buttons
            const allButtons = step5.querySelectorAll('button');
            const navButtons = [];
            allButtons.forEach(btn => {
                const text = btn.textContent?.toLowerCase() || '';
                if (text.includes('précédent') || text.includes('suivant') || text.includes('previous') || text.includes('next')) {
                    navButtons.push({
                        text: btn.textContent?.trim(),
                        visible: btn.offsetHeight > 0,
                        parentChoice: null // We'll try to determine this
                    });
                }
            });
            
            return {
                choiceElements,
                nestedSteps,
                navButtons,
                totalButtons: allButtons.length,
                totalVisibleButtons: Array.from(allButtons).filter(btn => btn.offsetHeight > 0).length
            };
        });
        
        console.log('\n📊 STEP 5 STRUCTURE ANALYSIS:');
        console.log('==============================');
        
        if (step5Analysis.error) {
            console.log('❌ Error:', step5Analysis.error);
            return;
        }
        
        console.log(`\n🎯 CHOICE ELEMENTS FOUND: ${step5Analysis.choiceElements.length}`);
        step5Analysis.choiceElements.forEach((choice, index) => {
            console.log(`\n${index + 1}. ${choice.type.toUpperCase()}`);
            console.log(`   Text: ${choice.text}...`);
            console.log(`   Nesting Level: ${choice.level} divs deep`);
            console.log(`   Own Buttons: ${choice.hasButtons}`);
            console.log(`   Button Texts: ${choice.buttonTexts.join(', ')}`);
            
            if (choice.nestedSteps.length > 0) {
                console.log(`   🚨 NESTED STEPS: ${choice.nestedSteps.length}`);
                choice.nestedSteps.forEach(step => {
                    console.log(`      └── ${step.condition} -> "${step.title}"`);
                });
            }
            
            if (choice.nestedChoices.length > 0) {
                console.log(`   🚨 NESTED CHOICES: ${choice.nestedChoices.length}`);
                choice.nestedChoices.forEach(nested => {
                    console.log(`      └── ${nested.text} (${nested.buttons} buttons)`);
                });
            }
        });
        
        console.log(`\n🔧 NAVIGATION BUTTONS: ${step5Analysis.navButtons.length}`);
        step5Analysis.navButtons.forEach((btn, index) => {
            console.log(`   ${index + 1}. "${btn.text}" ${btn.visible ? '(VISIBLE)' : '(HIDDEN)'}`);
        });
        
        console.log(`\n📊 BUTTON SUMMARY:`);
        console.log(`   Total buttons: ${step5Analysis.totalButtons}`);
        console.log(`   Visible buttons: ${step5Analysis.totalVisibleButtons}`);
        console.log(`   Navigation buttons: ${step5Analysis.navButtons.length}`);
        
        console.log(`\n🚨 NESTED STEPS IN STEP 5: ${step5Analysis.nestedSteps.length}`);
        step5Analysis.nestedSteps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step.condition} -> "${step.title}" ${step.visible ? '(VISIBLE)' : '(HIDDEN)'} (${step.buttons} buttons)`);
        });
        
        // DIAGNOSIS
        console.log('\n\n🔴 DIAGNOSIS:');
        console.log('=============');
        
        if (step5Analysis.nestedSteps.length > 0) {
            console.log('❌ CRITICAL: Steps nested inside Step 5 choices');
        }
        
        if (step5Analysis.navButtons.length > 2) {
            console.log(`❌ CRITICAL: Too many navigation buttons (${step5Analysis.navButtons.length}) - should be 2`);
        }
        
        const choicesWithNesting = step5Analysis.choiceElements.filter(c => c.nestedSteps.length > 0 || c.nestedChoices.length > 0);
        if (choicesWithNesting.length > 0) {
            console.log(`❌ CRITICAL: ${choicesWithNesting.length} choices have nested content inside them`);
        }
        
        if (step5Analysis.totalButtons > 20) {
            console.log(`❌ UI BLOAT: Too many buttons (${step5Analysis.totalButtons}) in Step 5`);
        }
        
    } catch (error) {
        console.error('❌ Diagnosis failed:', error);
    }
    
    await browser.close();
}

diagnoseStep5Nesting();