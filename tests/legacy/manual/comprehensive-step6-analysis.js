const { chromium } = require('playwright');
const fs = require('fs');

async function comprehensiveStep6Analysis() {
    console.log('🔬 COMPREHENSIVE STEP 6 ANALYSIS - LEAVING NO STONE UNTURNED');
    console.log('=============================================================\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard', { timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // ========================================
        // PHASE 1: DOM STRUCTURE VERIFICATION
        // ========================================
        console.log('📊 PHASE 1: DOM STRUCTURE VERIFICATION');
        console.log('======================================');
        
        const domStructure = await page.evaluate(() => {
            // Find ALL elements with x-show conditions
            const allXShowElements = Array.from(document.querySelectorAll('[x-show]'));
            const stepElements = allXShowElements.filter(el => 
                el.getAttribute('x-show')?.includes('currentStep'));
            
            // Map all step elements
            const steps = stepElements.map(el => {
                const xShow = el.getAttribute('x-show');
                const match = xShow?.match(/currentStep\s*===\s*(\d+)/);
                const stepNum = match ? parseInt(match[1]) : null;
                
                return {
                    stepNum,
                    xShow,
                    tagName: el.tagName,
                    classes: el.className,
                    hasContent: el.innerHTML.length > 0,
                    contentLength: el.innerHTML.length,
                    firstChild: el.firstElementChild?.tagName,
                    parentXShow: el.parentElement?.getAttribute('x-show'),
                    parentClasses: el.parentElement?.className,
                    id: el.id || 'no-id',
                    xData: el.getAttribute('x-data')
                };
            });
            
            return { 
                totalXShowElements: allXShowElements.length,
                stepElements: steps.filter(s => s.stepNum !== null).sort((a, b) => a.stepNum - b.stepNum)
            };
        });
        
        console.log(`Found ${domStructure.totalXShowElements} total x-show elements`);
        console.log(`Found ${domStructure.stepElements.length} step elements:\n`);
        
        domStructure.stepElements.forEach(step => {
            console.log(`Step ${step.stepNum + 1} (currentStep === ${step.stepNum}):`);
            console.log(`  Tag: ${step.tagName}, Classes: ${step.classes}`);
            console.log(`  Content: ${step.hasContent ? step.contentLength + ' chars' : 'EMPTY'}`);
            console.log(`  x-data: ${step.xData || 'none'}`);
            console.log(`  Parent x-show: ${step.parentXShow || 'none'}`);
            console.log('');
        });
        
        // ========================================
        // PHASE 2: STEP 6 SPECIFIC DEEP DIVE
        // ========================================
        console.log('📊 PHASE 2: STEP 6 (currentStep === 5) DEEP DIVE');
        console.log('================================================');
        
        // Navigate to Step 6
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5; // Step 6
            }
        });
        
        await page.waitForTimeout(1000);
        
        const step6Analysis = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 not found' };
            
            // Get complete parent chain
            const parentChain = [];
            let current = step6;
            let depth = 0;
            
            while (current && depth < 15) {
                const computed = window.getComputedStyle(current);
                parentChain.push({
                    depth,
                    tagName: current.tagName,
                    id: current.id || '',
                    className: current.className,
                    xShow: current.getAttribute('x-show'),
                    xData: current.getAttribute('x-data'),
                    xIf: current.getAttribute('x-if'),
                    xFor: current.getAttribute('x-for'),
                    display: computed.display,
                    visibility: computed.visibility,
                    opacity: computed.opacity,
                    position: computed.position,
                    zIndex: computed.zIndex,
                    overflow: computed.overflow,
                    height: computed.height,
                    maxHeight: computed.maxHeight,
                    minHeight: computed.minHeight,
                    offsetHeight: current.offsetHeight,
                    clientHeight: current.clientHeight,
                    scrollHeight: current.scrollHeight,
                    hasChildren: current.children.length > 0,
                    childrenCount: current.children.length
                });
                current = current.parentElement;
                depth++;
            }
            
            // Check Alpine.js bindings
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            
            // Check if content is actually there but hidden
            const step6Content = step6.innerHTML;
            const hasH2 = step6Content.includes('<h2');
            const hasButtons = step6Content.includes('<button');
            const hasDivs = step6Content.includes('<div');
            
            return {
                exists: true,
                parentChain,
                alpineState: {
                    currentStep: alpineData?.currentStep,
                    hasAlpineData: !!alpineData,
                    stepsLength: alpineData?.steps?.length
                },
                contentAnalysis: {
                    totalLength: step6Content.length,
                    hasH2,
                    hasButtons,
                    hasDivs,
                    firstTags: step6Content.substring(0, 500)
                },
                computedStyles: {
                    display: window.getComputedStyle(step6).display,
                    visibility: window.getComputedStyle(step6).visibility,
                    opacity: window.getComputedStyle(step6).opacity,
                    height: window.getComputedStyle(step6).height,
                    overflow: window.getComputedStyle(step6).overflow
                }
            };
        });
        
        if (step6Analysis.error) {
            console.log('❌ ERROR:', step6Analysis.error);
        } else {
            console.log('Step 6 Content Analysis:');
            console.log(`  Content Length: ${step6Analysis.contentAnalysis.totalLength} chars`);
            console.log(`  Has H2: ${step6Analysis.contentAnalysis.hasH2}`);
            console.log(`  Has Buttons: ${step6Analysis.contentAnalysis.hasButtons}`);
            console.log(`  Has Divs: ${step6Analysis.contentAnalysis.hasDivs}`);
            console.log('');
            
            console.log('Step 6 Computed Styles:');
            Object.entries(step6Analysis.computedStyles).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
            console.log('');
            
            console.log('Parent Chain Analysis:');
            step6Analysis.parentChain.forEach(parent => {
                if (parent.xShow || parent.display === 'none' || parent.offsetHeight === 0) {
                    const marker = parent.depth === 0 ? '📍 STEP 6' : '';
                    console.log(`[${parent.depth}] ${parent.tagName} ${marker}`);
                    console.log(`    Classes: ${parent.className}`);
                    if (parent.xShow) console.log(`    x-show: "${parent.xShow}"`);
                    console.log(`    Display: ${parent.display}, Height: ${parent.offsetHeight}px`);
                    if (parent.display === 'none' || parent.offsetHeight === 0) {
                        console.log(`    ⚠️ BLOCKING: This element is hiding content!`);
                    }
                    console.log('');
                }
            });
        }
        
        // ========================================
        // PHASE 3: SIBLINGS AND NESTING CHECK
        // ========================================
        console.log('📊 PHASE 3: SIBLINGS AND NESTING ANALYSIS');
        console.log('=========================================');
        
        const siblingAnalysis = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 not found' };
            
            const parent = step6.parentElement;
            const siblings = Array.from(parent.children);
            
            const siblingInfo = siblings.map((sibling, index) => {
                const xShow = sibling.getAttribute('x-show');
                const isStep6 = sibling === step6;
                
                return {
                    index,
                    isStep6,
                    tagName: sibling.tagName,
                    className: sibling.className,
                    xShow: xShow || '',
                    display: window.getComputedStyle(sibling).display,
                    offsetHeight: sibling.offsetHeight,
                    hasContent: sibling.innerHTML.length > 0,
                    contentLength: sibling.innerHTML.length
                };
            });
            
            // Check if Step 6 is inside another step
            let current = step6.parentElement;
            let nestedInStep = null;
            
            while (current) {
                const xShow = current.getAttribute('x-show');
                if (xShow && xShow.includes('currentStep') && xShow !== 'currentStep === 5') {
                    nestedInStep = xShow;
                    break;
                }
                current = current.parentElement;
            }
            
            return {
                parentTag: parent.tagName,
                parentClass: parent.className,
                totalSiblings: siblings.length,
                siblingInfo,
                nestedInStep
            };
        });
        
        console.log(`Step 6 Parent: ${siblingAnalysis.parentTag} (${siblingAnalysis.parentClass})`);
        console.log(`Total Siblings: ${siblingAnalysis.totalSiblings}`);
        
        if (siblingAnalysis.nestedInStep) {
            console.log(`\n❌ CRITICAL: Step 6 is nested inside: ${siblingAnalysis.nestedInStep}`);
        }
        
        console.log('\nSibling Elements:');
        siblingAnalysis.siblingInfo.forEach(sib => {
            const marker = sib.isStep6 ? ' 📍 THIS IS STEP 6' : '';
            const visible = sib.offsetHeight > 0 ? '✅' : '❌';
            console.log(`[${sib.index}] ${visible} ${sib.tagName}${marker}`);
            if (sib.xShow) console.log(`    x-show: ${sib.xShow}`);
            console.log(`    Display: ${sib.display}, Height: ${sib.offsetHeight}px, Content: ${sib.contentLength} chars`);
        });
        
        // ========================================
        // PHASE 4: HTML SOURCE ANALYSIS
        // ========================================
        console.log('\n📊 PHASE 4: HTML SOURCE CODE ANALYSIS');
        console.log('=====================================');
        
        const htmlContent = fs.readFileSync('../../api/portal-ui/wizard.html', 'utf8');
        const lines = htmlContent.split('\n');
        
        // Find Step 6 declaration in source
        let step6StartLine = -1;
        let step6EndLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('currentStep === 5') && lines[i].includes('x-show')) {
                step6StartLine = i + 1; // 1-based
                // Find the matching closing div
                let divCount = 1;
                for (let j = i + 1; j < lines.length && divCount > 0; j++) {
                    if (lines[j].includes('<div')) divCount++;
                    if (lines[j].includes('</div>')) divCount--;
                    if (divCount === 0) {
                        step6EndLine = j + 1; // 1-based
                        break;
                    }
                }
                break;
            }
        }
        
        console.log(`Step 6 in source: Lines ${step6StartLine} to ${step6EndLine}`);
        
        // Check what comes before and after Step 6
        if (step6StartLine > 0) {
            console.log('\nBEFORE Step 6:');
            for (let i = Math.max(0, step6StartLine - 6); i < step6StartLine - 1; i++) {
                console.log(`${i + 1}: ${lines[i]}`);
            }
            
            console.log('\nStep 6 START:');
            for (let i = step6StartLine - 1; i < Math.min(step6StartLine + 4, lines.length); i++) {
                console.log(`${i + 1}: ${lines[i]}`);
            }
        }
        
        // ========================================
        // PHASE 5: ALPINE.JS STATE INSPECTION
        // ========================================
        console.log('\n📊 PHASE 5: ALPINE.JS STATE DEEP INSPECTION');
        console.log('===========================================');
        
        const alpineInspection = await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            if (!mainDiv) return { error: 'Alpine app not found' };
            
            const alpineData = mainDiv._x_dataStack?.[0];
            if (!alpineData) return { error: 'Alpine data not found' };
            
            // Check all x-show conditions manually
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            const currentStep = alpineData.currentStep;
            
            // Evaluate x-show condition
            const shouldShow = currentStep === 5;
            
            // Check if Alpine has processed this element
            const hasAlpineProcessing = step6?._x_refs !== undefined || 
                                       step6?._x_effects !== undefined ||
                                       step6?._x_dataStack !== undefined;
            
            // Check parent's Alpine state
            const parent = step6?.parentElement;
            const parentXShow = parent?.getAttribute('x-show');
            let parentShouldShow = true;
            
            if (parentXShow) {
                // Try to evaluate parent's x-show
                if (parentXShow.includes('currentStep === 4')) {
                    parentShouldShow = currentStep === 4;
                }
            }
            
            return {
                currentStep,
                shouldShowStep6: shouldShow,
                actualDisplay: step6 ? window.getComputedStyle(step6).display : 'not found',
                hasAlpineProcessing,
                parentXShow,
                parentShouldShow,
                alpineVersion: window.Alpine?.version,
                allSteps: alpineData.steps?.map((s, i) => ({
                    index: i,
                    title: s.title,
                    completed: s.completed
                }))
            };
        });
        
        console.log('Alpine.js State:');
        console.log(`  Current Step: ${alpineInspection.currentStep}`);
        console.log(`  Should Show Step 6: ${alpineInspection.shouldShowStep6}`);
        console.log(`  Actual Display: ${alpineInspection.actualDisplay}`);
        console.log(`  Has Alpine Processing: ${alpineInspection.hasAlpineProcessing}`);
        console.log(`  Alpine Version: ${alpineInspection.alpineVersion}`);
        
        if (alpineInspection.parentXShow) {
            console.log(`\n  Parent x-show: "${alpineInspection.parentXShow}"`);
            console.log(`  Parent Should Show: ${alpineInspection.parentShouldShow}`);
        }
        
        // ========================================
        // FINAL DIAGNOSIS
        // ========================================
        console.log('\n🎯 FINAL DIAGNOSIS');
        console.log('==================');
        
        // Compile all findings
        const issues = [];
        
        if (step6Analysis.parentChain) {
            const blockingParent = step6Analysis.parentChain.find(p => 
                p.depth > 0 && (p.display === 'none' || p.offsetHeight === 0));
            if (blockingParent) {
                issues.push(`Parent at depth ${blockingParent.depth} (${blockingParent.tagName}) is blocking display`);
            }
        }
        
        if (siblingAnalysis.nestedInStep) {
            issues.push(`Step 6 is nested inside: ${siblingAnalysis.nestedInStep}`);
        }
        
        if (alpineInspection.parentXShow && !alpineInspection.parentShouldShow) {
            issues.push(`Parent has x-show="${alpineInspection.parentXShow}" which evaluates to false`);
        }
        
        if (issues.length > 0) {
            console.log('❌ ISSUES FOUND:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        } else {
            console.log('🤔 No obvious issues found - may be a complex CSS or Alpine timing issue');
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    } finally {
        await browser.close();
    }
}

comprehensiveStep6Analysis();