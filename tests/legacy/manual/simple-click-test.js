const puppeteer = require('puppeteer');

(async () => {
    console.log('🔧 Simple Traiter Click Test');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true,
        slowMo: 1000
    });
    
    const page = await browser.newPage();
    
    // Listen for specific console messages
    page.on('console', msg => {
        if (msg.text().includes('🤖') || msg.text().includes('Opening') || msg.text().includes('Error')) {
            console.log(`📱 ${msg.type()}: ${msg.text()}`);
        }
    });
    
    try {
        await page.goto('http://162.55.213.90:3080/admin-dashboard', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.type('input[type="email"]', 'admin@locod.ai', { delay: 100 });
        await page.type('input[type="password"]', 'admin123', { delay: 100 });
        await page.click('button[type="submit"]');
        
        // Wait longer for login and data loading
        console.log('⏳ Waiting for dashboard to load...');
        await page.waitForFunction(() => {
            const table = document.querySelector('table');
            const buttons = document.querySelectorAll('button');
            return table && buttons.length > 5; // Wait for table and multiple buttons
        }, { timeout: 15000 });
        
        console.log('✅ Dashboard loaded, checking buttons...');
        
        // Get button information
        const buttonInfo = await page.evaluate(() => {
            const traiterButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent.includes('Traiter')
            );
            
            return {
                totalButtons: document.querySelectorAll('button').length,
                traiterButtons: traiterButtons.length,
                firstButtonText: traiterButtons[0]?.textContent?.trim() || 'none',
                firstButtonVisible: traiterButtons[0] ? getComputedStyle(traiterButtons[0]).display !== 'none' : false
            };
        });
        
        console.log('🔘 Button Info:', buttonInfo);
        
        if (buttonInfo.traiterButtons > 0) {
            console.log('🎯 Clicking first Traiter button...');
            
            // Add a click listener to detect if click is registered
            await page.evaluate(() => {
                const traiterButton = Array.from(document.querySelectorAll('button')).find(btn => 
                    btn.textContent.includes('Traiter')
                );
                
                if (traiterButton) {
                    traiterButton.addEventListener('click', (e) => {
                        console.log('🎯 CLICK DETECTED on Traiter button!', e);
                    });
                }
            });
            
            await page.click('button:has-text("Traiter")');
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check modal state
            const modalState = await page.evaluate(() => {
                const el = document.querySelector('[x-data]');
                const data = el?._x_dataStack?.[0];
                
                return {
                    modalShow: data?.processingModal?.show || false,
                    modalRequest: data?.processingModal?.request?.id || null
                };
            });
            
            console.log('🪟 Modal State:', modalState);
            
            if (modalState.modalShow) {
                console.log('✅ SUCCESS: Modal opened!');
            } else {
                console.log('❌ FAILED: Modal did not open');
            }
        } else {
            console.log('❌ No Traiter buttons found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    console.log('⏳ Keeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    await browser.close();
})().catch(console.error);