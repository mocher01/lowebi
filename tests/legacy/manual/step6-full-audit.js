const { chromium } = require('playwright');

async function auditStep6() {
    console.log('🔍 STEP 6 BLANK PAGE - FULL AUDIT & DIAGNOSIS');
    console.log('===============================================');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard', { timeout: 20000 });
        await page.waitForTimeout(1500);
        
        console.log('📋 PHASE 1: BASIC STEP 6 DETECTION');
        console.log('===================================');
        
        // Navigate directly to Step 6 (currentStep = 5)
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5; // Step 6
            }
        });
        
        await page.waitForTimeout(1000);
        
        // 1. Basic Step 6 element detection
        const basicDetection = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 element not found' };
            
            const computedStyle = window.getComputedStyle(step6);
            
            return {
                exists: true,
                tagName: step6.tagName,
                className: step6.className,
                offsetWidth: step6.offsetWidth,
                offsetHeight: step6.offsetHeight,
                clientWidth: step6.clientWidth,
                clientHeight: step6.clientHeight,
                scrollHeight: step6.scrollHeight,
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex,
                overflow: computedStyle.overflow,
                contentLength: step6.textContent?.length || 0,
                innerHTML: step6.innerHTML.substring(0, 200) + '...'
            };
        });
        
        if (basicDetection.error) {
            console.log('❌ CRITICAL:', basicDetection.error);
            return;
        }
        
        console.log('✅ Step 6 Element Found');
        console.log(`   Tag: ${basicDetection.tagName}`);
        console.log(`   Classes: ${basicDetection.className}`);
        console.log(`   Dimensions: ${basicDetection.offsetWidth}x${basicDetection.offsetHeight}px`);
        console.log(`   Client: ${basicDetection.clientWidth}x${basicDetection.clientHeight}px`);
        console.log(`   Scroll Height: ${basicDetection.scrollHeight}px`);
        console.log(`   Display: ${basicDetection.display}`);
        console.log(`   Visibility: ${basicDetection.visibility}`);
        console.log(`   Opacity: ${basicDetection.opacity}`);
        console.log(`   Content Length: ${basicDetection.contentLength} characters`);
        
        console.log('\n📋 PHASE 2: PARENT CHAIN ANALYSIS');
        console.log('==================================');
        
        // 2. Parent chain analysis
        const parentAnalysis = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 not found' };
            
            const parents = [];
            let current = step6.parentElement;
            let level = 1;
            
            while (current && level <= 5) {
                const computedStyle = window.getComputedStyle(current);
                parents.push({
                    level,
                    tagName: current.tagName,
                    className: current.className,
                    offsetWidth: current.offsetWidth,
                    offsetHeight: current.offsetHeight,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    overflow: computedStyle.overflow,
                    hasXShow: current.hasAttribute('x-show'),
                    xShowValue: current.getAttribute('x-show')
                });
                current = current.parentElement;
                level++;
            }
            
            return { parents };
        });
        
        console.log('📊 PARENT CHAIN:');
        parentAnalysis.parents.forEach(parent => {
            console.log(`   Level ${parent.level} (${parent.tagName}):`);
            console.log(`     Classes: ${parent.className}`);
            console.log(`     Dimensions: ${parent.offsetWidth}x${parent.offsetHeight}px`);
            console.log(`     Display: ${parent.display} | Visibility: ${parent.visibility} | Opacity: ${parent.opacity}`);
            if (parent.hasXShow) {
                console.log(`     ⚠️  x-show: "${parent.xShowValue}"`);
            }
            console.log('');
        });
        
        console.log('\n📋 PHASE 3: ALPINE.JS STATE ANALYSIS');
        console.log('=====================================');
        
        // 3. Alpine.js state analysis
        const alpineAnalysis = await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            if (!mainDiv) return { error: 'Alpine app not found' };
            
            const alpineData = mainDiv._x_dataStack?.[0];
            if (!alpineData) return { error: 'Alpine data not found' };
            
            return {
                currentStep: alpineData.currentStep,
                stepsLength: alpineData.steps?.length || 0,
                step6Title: alpineData.steps?.[5]?.title || 'N/A',
                step6Completed: alpineData.steps?.[5]?.completed || false,
                wizardDataCurrentStep: alpineData.wizardData?.currentStep
            };
        });
        
        if (alpineAnalysis.error) {
            console.log('❌ ALPINE ERROR:', alpineAnalysis.error);
        } else {
            console.log('✅ Alpine.js State:');
            console.log(`   currentStep: ${alpineAnalysis.currentStep}`);
            console.log(`   steps.length: ${alpineAnalysis.stepsLength}`);
            console.log(`   steps[5].title: ${alpineAnalysis.step6Title}`);
            console.log(`   steps[5].completed: ${alpineAnalysis.step6Completed}`);
            console.log(`   wizardData.currentStep: ${alpineAnalysis.wizardDataCurrentStep}`);
        }
        
        console.log('\n📋 PHASE 4: X-SHOW EVALUATION');
        console.log('==============================');
        
        // 4. x-show evaluation
        const xShowAnalysis = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 not found' };
            
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            const currentStep = alpineData?.currentStep;
            
            // Manually evaluate x-show condition
            const xShowCondition = currentStep === 5;
            
            return {
                currentStep,
                xShowCondition,
                shouldBeVisible: xShowCondition,
                actualVisibility: step6.offsetHeight > 0,
                hasXTransition: step6.hasAttribute('x-transition'),
                xTransitionValue: step6.getAttribute('x-transition')
            };
        });
        
        console.log('🔍 X-SHOW EVALUATION:');
        console.log(`   currentStep: ${xShowAnalysis.currentStep}`);
        console.log(`   currentStep === 5: ${xShowAnalysis.xShowCondition}`);
        console.log(`   Should be visible: ${xShowAnalysis.shouldBeVisible}`);
        console.log(`   Actually visible: ${xShowAnalysis.actualVisibility}`);
        console.log(`   Has x-transition: ${xShowAnalysis.hasXTransition}`);
        if (xShowAnalysis.hasXTransition) {
            console.log(`   x-transition: "${xShowAnalysis.xTransitionValue}"`);
        }
        
        console.log('\n📋 PHASE 5: CONTENT STRUCTURE ANALYSIS');
        console.log('=======================================');
        
        // 5. Content structure analysis
        const contentAnalysis = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 not found' };
            
            // Count different types of content
            const headings = step6.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
            const paragraphs = step6.querySelectorAll('p').length;
            const divs = step6.querySelectorAll('div').length;
            const inputs = step6.querySelectorAll('input, textarea, select').length;
            const buttons = step6.querySelectorAll('button').length;
            const tabs = step6.querySelectorAll('[\\@click*="activeTab"]').length;
            
            // Check for tab content
            const activeTabElements = step6.querySelectorAll('[x-show*="activeTab"]');
            const tabInfo = Array.from(activeTabElements).map(el => ({
                xShow: el.getAttribute('x-show'),
                visible: el.offsetHeight > 0,
                contentLength: el.textContent?.length || 0
            }));
            
            return {
                totalElements: step6.querySelectorAll('*').length,
                headings,
                paragraphs,
                divs,
                inputs,
                buttons,
                tabs,
                tabInfo,
                firstHeading: step6.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || 'None',
                hasActiveTabData: step6.hasAttribute('x-data') && step6.getAttribute('x-data').includes('activeTab')
            };
        });
        
        console.log('📊 CONTENT STRUCTURE:');
        console.log(`   Total elements: ${contentAnalysis.totalElements}`);
        console.log(`   Headings: ${contentAnalysis.headings}`);
        console.log(`   Paragraphs: ${contentAnalysis.paragraphs}`);
        console.log(`   Divs: ${contentAnalysis.divs}`);
        console.log(`   Inputs: ${contentAnalysis.inputs}`);
        console.log(`   Buttons: ${contentAnalysis.buttons}`);
        console.log(`   Tabs: ${contentAnalysis.tabs}`);
        console.log(`   First heading: "${contentAnalysis.firstHeading}"`);
        console.log(`   Has activeTab data: ${contentAnalysis.hasActiveTabData}`);
        
        if (contentAnalysis.tabInfo.length > 0) {
            console.log('\n   📋 TAB ANALYSIS:');
            contentAnalysis.tabInfo.forEach((tab, i) => {
                console.log(`     Tab ${i + 1}: ${tab.xShow}`);
                console.log(`       Visible: ${tab.visible}`);
                console.log(`       Content: ${tab.contentLength} chars`);
            });
        }
        
        console.log('\n📋 FINAL DIAGNOSIS');
        console.log('==================');
        
        // Determine the root cause
        if (!basicDetection.exists) {
            console.log('❌ ROOT CAUSE: Step 6 element does not exist in DOM');
        } else if (basicDetection.offsetHeight === 0) {
            if (basicDetection.display === 'none') {
                console.log('❌ ROOT CAUSE: Step 6 has display: none (likely Alpine x-show issue)');
            } else if (basicDetection.visibility === 'hidden') {
                console.log('❌ ROOT CAUSE: Step 6 has visibility: hidden');
            } else if (basicDetection.opacity === '0') {
                console.log('❌ ROOT CAUSE: Step 6 has opacity: 0 (likely transition issue)');
            } else {
                console.log('❌ ROOT CAUSE: Step 6 height is 0 but CSS seems normal - content/layout issue');
            }
        } else if (!xShowAnalysis.shouldBeVisible) {
            console.log('❌ ROOT CAUSE: Alpine currentStep !== 5, x-show condition false');
        } else if (contentAnalysis.totalElements === 0) {
            console.log('❌ ROOT CAUSE: Step 6 exists but has no content elements');
        } else {
            console.log('🤔 UNCLEAR: Step 6 appears to exist and have content but may have layout issues');
            console.log('   Further investigation needed on CSS/layout/Alpine interactions');
        }
        
    } catch (error) {
        console.error('❌ Audit failed:', error.message);
    } finally {
        await browser.close();
    }
}

auditStep6();