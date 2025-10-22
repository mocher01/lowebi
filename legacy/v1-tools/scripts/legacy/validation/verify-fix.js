const puppeteer = require('puppeteer');

(async () => {
    console.log('✅ Verifying Modal Fix');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true,
        slowMo: 500
    });
    
    const page = await browser.newPage();
    
    try {
        await page.goto('http://162.55.213.90:3080/admin-dashboard');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.type('input[type="email"]', 'admin@locod.ai');
        await page.type('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const verifyResults = await page.evaluate(() => {
            const modal = document.querySelector('[x-show="processingModal.show"]');
            const style = modal ? getComputedStyle(modal) : null;
            
            const buttons = Array.from(document.querySelectorAll('button'));
            const traiterButtons = buttons.filter(btn => btn.textContent.includes('Traiter'));
            
            return {
                modalExists: !!modal,
                modalDisplay: style?.display || 'none',
                modalBlocking: modal && style.display !== 'none',
                traiterButtonsFound: traiterButtons.length,
                canAccessButtons: traiterButtons.length > 0
            };
        });
        
        console.log('🔍 Verification Results:');
        console.log(`   Modal exists: ${verifyResults.modalExists ? '✅' : '❌'}`);
        console.log(`   Modal display: ${verifyResults.modalDisplay}`);
        console.log(`   Modal blocking: ${verifyResults.modalBlocking ? '❌' : '✅'}`);
        console.log(`   Traiter buttons found: ${verifyResults.traiterButtonsFound} ${verifyResults.traiterButtonsFound > 0 ? '✅' : '❌'}`);
        console.log(`   Can access buttons: ${verifyResults.canAccessButtons ? '✅' : '❌'}`);
        
        if (!verifyResults.modalBlocking && verifyResults.canAccessButtons) {
            console.log('🎉 SUCCESS: Fix verified! Modal no longer blocks interactions.');
            
            // Test actual button click
            console.log('🎯 Testing Traiter button click...');
            const clickResult = await page.evaluate(() => {
                const traiterBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                    btn.textContent.includes('Traiter')
                );
                
                if (traiterBtn) {
                    traiterBtn.click();
                    return { clicked: true };
                }
                return { clicked: false };
            });
            
            if (clickResult.clicked) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const modalAfterClick = await page.evaluate(() => {
                    const modal = document.querySelector('[x-show="processingModal.show"]');
                    const style = modal ? getComputedStyle(modal) : null;
                    
                    return {
                        modalDisplay: style?.display || 'none',
                        modalVisible: style?.display !== 'none'
                    };
                });
                
                console.log(`🪟 Modal after click: ${modalAfterClick.modalVisible ? 'Visible ✅' : 'Hidden ❌'}`);
            }
            
        } else {
            console.log('❌ Fix failed - modal still blocking or buttons not accessible');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
    console.log('🏁 Verification completed');
})().catch(console.error);