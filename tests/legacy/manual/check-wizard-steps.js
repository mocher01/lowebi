const { chromium } = require('playwright');

async function checkWizardSteps() {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('🔍 Checking wizard structure...\n');
        
        // Navigate to wizard
        await page.goto('http://162.55.213.90:3080/wizard', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        // Get current step
        const currentStep = await page.evaluate(() => {
            const app = document.querySelector('[x-data]')?.__x?.$data;
            return app?.currentStep ?? 'unknown';
        });
        console.log(`Current step: ${currentStep}`);
        
        // Accept terms and move to step 2
        await page.check('input[type="checkbox"]');
        await page.click('button:has-text("Commencer")');
        await page.waitForTimeout(1000);
        
        // Check what's visible now
        const visibleText = await page.evaluate(() => {
            const h2 = document.querySelector('h2');
            return h2?.textContent || 'No H2 found';
        });
        console.log(`Step 2 Title: ${visibleText}`);
        
        // Get all step titles from the milestone
        const stepTitles = await page.evaluate(() => {
            const steps = document.querySelectorAll('.milestone-step');
            return Array.from(steps).map(s => s.textContent.trim());
        });
        console.log('\nMilestone steps:');
        stepTitles.forEach((title, i) => {
            console.log(`  ${i + 1}. ${title}`);
        });
        
        // Navigate through each step and check titles
        console.log('\nNavigating through steps:');
        
        for (let i = 0; i < 6; i++) {
            // Click next/suivant button if it exists and is enabled
            const nextBtn = await page.$('button:has-text("Suivant"):not(:disabled), button:has-text("Commencer"):not(:disabled)');
            if (nextBtn) {
                await nextBtn.click();
                await page.waitForTimeout(1000);
                
                const stepTitle = await page.evaluate(() => {
                    const h2 = document.querySelector('.wizard-step:not([style*="display: none"]) h2');
                    return h2?.textContent || 'No title';
                });
                
                const stepNumber = await page.evaluate(() => {
                    const app = document.querySelector('[x-data]')?.__x?.$data;
                    return app?.currentStep ?? 'unknown';
                });
                
                console.log(`  Step ${stepNumber}: ${stepTitle}`);
                
                // For step 6, check if it's Advanced Features
                if (stepNumber === 5) {
                    const hasAdvancedFeatures = await page.isVisible('text=Fonctionnalités Avancées');
                    console.log(`    -> Advanced Features visible: ${hasAdvancedFeatures ? '✅' : '❌'}`);
                }
                
                // For step 7, check if it has tabs
                if (stepNumber === 6) {
                    const hasTabs = await page.isVisible('button:has-text("Configuration")');
                    const hasSummaryTab = await page.isVisible('button:has-text("Résumé")');
                    console.log(`    -> Has tabs: ${hasTabs ? '✅' : '❌'}`);
                    console.log(`    -> Has Summary tab: ${hasSummaryTab ? '✅' : '❌'}`);
                }
                
                // Fill minimal required fields to proceed
                if (stepNumber === 2) {
                    await page.fill('input[placeholder*="Nom de votre"]', 'Test');
                    await page.selectOption('select', { index: 1 });
                }
                if (stepNumber === 3) {
                    await page.fill('input[placeholder*="email"]', 'test@test.com');
                    await page.fill('input[placeholder*="Nom du service"]', 'Service 1');
                }
            } else {
                console.log('  No more navigation buttons found');
                break;
            }
        }
        
        console.log('\n✅ Structure check complete');
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
        await page.screenshot({ path: 'wizard-check-error.png', fullPage: true });
        console.log('📸 Screenshot saved as wizard-check-error.png');
    } finally {
        await browser.close();
    }
}

checkWizardSteps().catch(console.error);