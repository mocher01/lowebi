const { chromium } = require('playwright');

async function checkStep6Parent() {
    console.log('🔍 STEP 6 PARENT INVESTIGATION');
    console.log('==============================');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard', { timeout: 20000 });
        await page.waitForTimeout(1500);
        
        // Navigate to Step 6
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 5; // Step 6
            }
        });
        
        await page.waitForTimeout(1000);
        
        const analysis = await page.evaluate(() => {
            const step6 = document.querySelector('[x-show="currentStep === 5"]');
            if (!step6) return { error: 'Step 6 not found' };
            
            // Check immediate parent
            const parent = step6.parentElement;
            
            // Check if Step 6 is somehow still nested in another step
            let currentEl = step6;
            let nestingIssue = null;
            let depth = 0;
            
            while (currentEl && depth < 10) {
                currentEl = currentEl.parentElement;
                if (currentEl) {
                    const xShow = currentEl.getAttribute('x-show');
                    if (xShow && xShow.includes('currentStep') && xShow !== 'currentStep === 5') {
                        nestingIssue = {
                            depth,
                            xShow,
                            tagName: currentEl.tagName,
                            className: currentEl.className
                        };
                        break;
                    }
                }
                depth++;
            }
            
            // Get all siblings
            const siblings = Array.from(parent.children);
            const step6Index = siblings.indexOf(step6);
            
            // Check what's around Step 6
            const before = step6Index > 0 ? siblings[step6Index - 1] : null;
            const after = step6Index < siblings.length - 1 ? siblings[step6Index + 1] : null;
            
            return {
                step6: {
                    exists: true,
                    xShow: step6.getAttribute('x-show'),
                    xData: step6.getAttribute('x-data'),
                    className: step6.className,
                    offsetHeight: step6.offsetHeight,
                    display: window.getComputedStyle(step6).display,
                    contentLength: step6.innerHTML.length
                },
                parent: {
                    tagName: parent.tagName,
                    className: parent.className,
                    xShow: parent.getAttribute('x-show'),
                    offsetHeight: parent.offsetHeight,
                    display: window.getComputedStyle(parent).display
                },
                nestingIssue,
                siblings: {
                    total: siblings.length,
                    step6Index,
                    before: before ? {
                        tagName: before.tagName,
                        xShow: before.getAttribute('x-show'),
                        className: before.className
                    } : null,
                    after: after ? {
                        tagName: after.tagName,
                        xShow: after.getAttribute('x-show'),
                        className: after.className
                    } : null
                }
            };
        });
        
        console.log('📊 STEP 6 ELEMENT:');
        console.log(`  x-show: "${analysis.step6.xShow}"`);
        console.log(`  x-data: "${analysis.step6.xData}"`);
        console.log(`  Classes: ${analysis.step6.className}`);
        console.log(`  Display: ${analysis.step6.display}`);
        console.log(`  Height: ${analysis.step6.offsetHeight}px`);
        console.log(`  Content: ${analysis.step6.contentLength} chars`);
        
        console.log('\n📊 PARENT ELEMENT:');
        console.log(`  Tag: ${analysis.parent.tagName}`);
        console.log(`  Classes: ${analysis.parent.className}`);
        console.log(`  x-show: ${analysis.parent.xShow || 'none'}`);
        console.log(`  Display: ${analysis.parent.display}`);
        console.log(`  Height: ${analysis.parent.offsetHeight}px`);
        
        if (analysis.nestingIssue) {
            console.log('\n❌ NESTING ISSUE FOUND:');
            console.log(`  Step 6 is nested inside: ${analysis.nestingIssue.xShow}`);
            console.log(`  At depth: ${analysis.nestingIssue.depth}`);
            console.log(`  Container: ${analysis.nestingIssue.tagName} (${analysis.nestingIssue.className})`);
        }
        
        console.log('\n📊 SIBLINGS:');
        console.log(`  Total siblings: ${analysis.siblings.total}`);
        console.log(`  Step 6 is at index: ${analysis.siblings.step6Index}`);
        if (analysis.siblings.before) {
            console.log(`  Before: ${analysis.siblings.before.tagName} with x-show="${analysis.siblings.before.xShow}"`);
        }
        if (analysis.siblings.after) {
            console.log(`  After: ${analysis.siblings.after.tagName} with x-show="${analysis.siblings.after.xShow}"`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

checkStep6Parent();