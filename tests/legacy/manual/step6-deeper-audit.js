const { chromium } = require('playwright');

async function deeperStep6Audit() {
    console.log('🔍 STEP 6 DEEPER INVESTIGATION');
    console.log('===============================');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard', { timeout: 20000 });
        await page.waitForTimeout(1500);
        
        console.log('📋 PHASE 1: FINDING ALL x-show ELEMENTS');
        console.log('========================================');
        
        // Find all elements with x-show attributes
        const allXShowElements = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('[x-show]'));
            return elements.map((el, index) => {
                const computedStyle = window.getComputedStyle(el);
                return {
                    index,
                    xShow: el.getAttribute('x-show'),
                    tagName: el.tagName,
                    classes: el.className,
                    display: computedStyle.display,
                    offsetHeight: el.offsetHeight,
                    contentLength: el.textContent?.length || 0,
                    firstText: el.textContent?.trim().substring(0, 100) || 'No text'
                };
            });
        });
        
        console.log(`Found ${allXShowElements.length} elements with x-show attributes:`);
        allXShowElements.forEach(el => {
            const visible = el.offsetHeight > 0 ? '✅' : '❌';
            console.log(`  ${visible} [${el.index}] x-show="${el.xShow}"`);
            console.log(`      Display: ${el.display} | Height: ${el.offsetHeight}px | Content: ${el.contentLength} chars`);
            console.log(`      Text: "${el.firstText}"`);
            console.log('');
        });
        
        console.log('\n📋 PHASE 2: TESTING DIFFERENT CURRENTSTEP VALUES');
        console.log('==================================================');
        
        // Test what happens with different currentStep values
        for (let stepValue = 0; stepValue <= 7; stepValue++) {
            console.log(`\n🔍 Testing currentStep = ${stepValue}:`);
            
            await page.evaluate((step) => {
                const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
                const alpineData = mainDiv?._x_dataStack?.[0];
                if (alpineData) {
                    alpineData.currentStep = step;
                }
            }, stepValue);
            
            await page.waitForTimeout(300);
            
            const stepVisibility = await page.evaluate(() => {
                const step6 = document.querySelector('[x-show="currentStep === 5"]');
                if (!step6) return { error: 'Step 6 not found' };
                
                const computedStyle = window.getComputedStyle(step6);
                const parent = step6.parentElement;
                const parentStyle = parent ? window.getComputedStyle(parent) : null;
                
                return {
                    step6Display: computedStyle.display,
                    step6Height: step6.offsetHeight,
                    step6Visible: step6.offsetHeight > 0,
                    parentXShow: parent?.getAttribute('x-show') || 'none',
                    parentDisplay: parentStyle?.display || 'unknown',
                    parentHeight: parent?.offsetHeight || 0
                };
            });
            
            if (stepVisibility.error) {
                console.log(`    ❌ ${stepVisibility.error}`);
            } else {
                const marker = stepVisibility.step6Visible ? '✅' : '❌';
                console.log(`    ${marker} Step 6: display=${stepVisibility.step6Display}, height=${stepVisibility.step6Height}px`);
                console.log(`        Parent: x-show="${stepVisibility.parentXShow}", display=${stepVisibility.parentDisplay}, height=${stepVisibility.parentHeight}px`);
            }
        }
        
        console.log('\n📋 PHASE 3: DOM STRUCTURE MAPPING');
        console.log('==================================');
        
        // Reset to step 6 and map the exact DOM structure
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5; // Step 6
            }
        });
        
        await page.waitForTimeout(500);
        
        const domStructure = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 not found' };
            
            // Map the DOM path up to the root
            const path = [];
            let current = step6;
            
            while (current && path.length < 10) {
                const computedStyle = window.getComputedStyle(current);
                path.push({
                    tagName: current.tagName,
                    className: current.className,
                    id: current.id || '',
                    xShow: current.getAttribute('x-show') || '',
                    xData: current.getAttribute('x-data') || '',
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    height: current.offsetHeight,
                    isStep6: current === step6
                });
                current = current.parentElement;
            }
            
            // Also check siblings at Step 6's level
            const siblings = Array.from(step6.parentElement?.children || []).map(sibling => ({
                tagName: sibling.tagName,
                className: sibling.className,
                xShow: sibling.getAttribute('x-show') || '',
                display: window.getComputedStyle(sibling).display,
                height: sibling.offsetHeight,
                isStep6: sibling === step6
            }));
            
            return { path, siblings };
        });
        
        console.log('🏗️  DOM PATH (Step 6 → Root):');
        domStructure.path.forEach((element, index) => {
            const marker = element.isStep6 ? '📍 STEP 6' : '';
            console.log(`  [${index}] ${element.tagName} ${marker}`);
            console.log(`      Class: "${element.className}"`);
            if (element.xShow) console.log(`      x-show: "${element.xShow}"`);
            if (element.xData) console.log(`      x-data: "${element.xData}"`);
            console.log(`      CSS: display=${element.display}, height=${element.height}px`);
            console.log('');
        });
        
        console.log('👫 SIBLINGS (same parent level):');
        domStructure.siblings.forEach((sibling, index) => {
            const marker = sibling.isStep6 ? '📍 THIS IS STEP 6' : '';
            const visible = sibling.height > 0 ? '✅' : '❌';
            console.log(`  ${visible} [${index}] ${sibling.tagName} ${marker}`);
            console.log(`      Class: "${sibling.className}"`);
            if (sibling.xShow) console.log(`      x-show: "${sibling.xShow}"`);
            console.log(`      Display: ${sibling.display}, Height: ${sibling.height}px`);
            console.log('');
        });
        
        console.log('\n📋 PHASE 4: ALPINE.JS EVALUATION TEST');
        console.log('======================================');
        
        // Test if Alpine.js is properly evaluating the x-show
        const alpineTest = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            
            // Manual evaluation
            const currentStep = alpineData?.currentStep;
            const shouldShow = currentStep === 5;
            
            // Check if Alpine has processed this element
            const hasAlpineData = step6?._x_dataStack?.length > 0;
            const hasAlpineEffects = step6?._x_effects?.size > 0;
            
            return {
                currentStep,
                shouldShow,
                hasAlpineData,
                hasAlpineEffects,
                alpineDataExists: !!alpineData,
                manualEvaluation: eval(`${currentStep} === 5`) // Direct evaluation
            };
        });
        
        console.log('🧪 ALPINE.JS EVALUATION:');
        console.log(`   currentStep: ${alpineTest.currentStep}`);
        console.log(`   currentStep === 5: ${alpineTest.shouldShow}`);
        console.log(`   Manual eval: ${alpineTest.manualEvaluation}`);
        console.log(`   Alpine data exists: ${alpineTest.alpineDataExists}`);
        console.log(`   Step 6 has Alpine data: ${alpineTest.hasAlpineData}`);
        console.log(`   Step 6 has Alpine effects: ${alpineTest.hasAlpineEffects}`);
        
        console.log('\n📋 UPDATED DIAGNOSIS');
        console.log('====================');
        
        // Find the problematic parent
        const problemParent = domStructure.path.find(element => 
            element.xShow && element.display === 'none' && !element.isStep6
        );
        
        if (problemParent) {
            console.log('❌ ROOT CAUSE IDENTIFIED:');
            console.log(`   Step 6 is inside a parent with x-show="${problemParent.xShow}"`);
            console.log(`   This parent has display: none, hiding Step 6`);
            console.log(`   The parent's x-show condition is evaluating to false`);
        } else if (!alpineTest.alpineDataExists) {
            console.log('❌ ROOT CAUSE: Alpine.js not initialized properly');
        } else if (!alpineTest.shouldShow) {
            console.log('❌ ROOT CAUSE: currentStep !== 5, Alpine evaluation correct');
        } else {
            console.log('🤔 MYSTERY: Alpine should show Step 6 but something else is preventing it');
            console.log('   Need to investigate CSS, transitions, or other hiding mechanisms');
        }
        
    } catch (error) {
        console.error('❌ Investigation failed:', error.message);
    } finally {
        await browser.close();
    }
}

deeperStep6Audit();