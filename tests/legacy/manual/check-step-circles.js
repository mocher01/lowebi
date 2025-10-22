const { chromium } = require('playwright');

async function checkStepCircles() {
    console.log('🔍 Step Circle Alignment Check');
    console.log('==============================');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/wizard', { timeout: 20000 });
        await page.waitForTimeout(1500);
        
        // Go to Step 5 (currentStep = 4) to see all completed milestones
        await page.evaluate(() => {
            const mainDiv = document.querySelector('[x-data="enhancedWizardApp()"]');
            const alpineData = mainDiv?._x_dataStack?.[0];
            if (alpineData) {
                alpineData.currentStep = 4; // Step 5 (Images)
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Analyze step circles alignment
        const circleAnalysis = await page.evaluate(() => {
            // Find the step circles container
            const container = document.querySelector('.flex.justify-between.items-center.relative');
            if (!container) {
                return { error: 'Step circles container not found' };
            }
            
            // Find all step circle divs within flex-col containers
            const stepContainers = Array.from(container.querySelectorAll('.flex.flex-col.items-center'));
            if (stepContainers.length === 0) {
                return { error: 'No step containers found' };
            }
            
            const circlePositions = stepContainers.map((container, index) => {
                // Find the circle element (w-12 h-12 rounded-full)
                const circle = container.querySelector('.w-12.h-12.rounded-full');
                if (!circle) return null;
                
                const containerRect = container.getBoundingClientRect();
                const circleRect = circle.getBoundingClientRect();
                
                return {
                    step: index + 1,
                    containerTop: containerRect.top,
                    containerHeight: containerRect.height,
                    circleTop: circleRect.top,
                    circleHeight: circleRect.height,
                    circleClasses: circle.className,
                    isActive: circle.className.includes('bg-blue-600'),
                    isCompleted: circle.className.includes('bg-green-600')
                };
            }).filter(pos => pos !== null);
            
            return { circlePositions };
        });
        
        if (circleAnalysis.error) {
            console.log('❌', circleAnalysis.error);
            return;
        }
        
        console.log('📊 STEP CIRCLE POSITIONS:');
        console.log('=========================');
        
        circleAnalysis.circlePositions.forEach(pos => {
            const status = pos.isActive ? ' ← ACTIVE' : pos.isCompleted ? ' ✓ COMPLETED' : '';
            console.log(`Step ${pos.step}:${status}`);
            console.log(`  Container top: ${pos.containerTop}px`);
            console.log(`  Circle top: ${pos.circleTop}px`);
            console.log(`  Circle height: ${pos.circleHeight}px`);
            console.log(`  Classes: ${pos.circleClasses.substring(0, 80)}`);
            console.log('');
        });
        
        // Focus on Steps 4, 5, 6 alignment
        const positions = circleAnalysis.circlePositions;
        if (positions.length >= 6) {
            const step4 = positions[3]; // Step 4 (index 3)
            const step5 = positions[4]; // Step 5 (index 4)
            const step6 = positions[5]; // Step 6 (index 5)
            
            console.log('🎯 STEPS 4-5-6 ALIGNMENT ANALYSIS:');
            console.log('==================================');
            console.log(`Step 4 circle top: ${step4.circleTop}px`);
            console.log(`Step 5 circle top: ${step5.circleTop}px`);
            console.log(`Step 6 circle top: ${step6.circleTop}px`);
            
            const step5Diff = step5.circleTop - step4.circleTop;
            const step6Diff = step6.circleTop - step4.circleTop;
            
            console.log(`\nStep 5 vs Step 4 difference: ${step5Diff > 0 ? '+' : ''}${step5Diff}px`);
            console.log(`Step 6 vs Step 4 difference: ${step6Diff > 0 ? '+' : ''}${step6Diff}px`);
            
            if (Math.abs(step5Diff) > 2) {
                console.log(`❌ CONFIRMED: Step 5 circle is ${Math.abs(step5Diff)}px ${step5Diff > 0 ? 'LOWER' : 'HIGHER'} than Step 4`);
                if (Math.abs(step6Diff) <= 2) {
                    console.log('✅ Step 6 alignment is correct');
                    console.log('💡 Issue: Only Step 5 is misaligned');
                }
            } else {
                console.log('✅ All steps appear properly aligned');
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

checkStepCircles();