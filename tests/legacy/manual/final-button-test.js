const puppeteer = require('puppeteer');

(async () => {
    console.log('🎯 FINAL BUTTON TEST - CLICKING ACTUAL BUTTONS');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true,
        slowMo: 200
    });
    
    const page = await browser.newPage();
    
    // Monitor console
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🔄') || text.includes('✅') || text.includes('👁️') || text.includes('🚀') || text.includes('❌')) {
            console.log(`🎯 ${text}`);
        }
    });
    
    console.log('🌐 Loading admin dashboard...');
    await page.goto('http://162.55.213.90:3080/admin-dashboard');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'admin@locod.ai');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login and queue loading
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔍 Checking Alpine.js queue data...');
    const queueInfo = await page.evaluate(() => {
        const dashboardEl = document.querySelector('[x-data]');
        if (dashboardEl && dashboardEl._x_dataStack) {
            const data = dashboardEl._x_dataStack[0];
            return {
                queueRequestsLength: data.queueRequests?.length || 0,
                firstRequest: data.queueRequests?.[0] || null,
                userId: data.user?.id
            };
        }
        return { error: 'No Alpine data' };
    });
    
    console.log('\n📊 ALPINE QUEUE INFO:');
    console.log(JSON.stringify(queueInfo, null, 2));
    
    // Force visibility check and click visible buttons
    console.log('\n🔍 Looking for visible buttons...');
    const visibleButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const actionButtons = buttons.filter(btn => 
            ['Voir', 'Assigner', 'Démarrer', 'Continuer'].includes(btn.textContent.trim())
        );
        
        return actionButtons.map(btn => ({
            text: btn.textContent.trim(),
            isVisible: btn.offsetParent !== null && getComputedStyle(btn).display !== 'none',
            computedStyle: getComputedStyle(btn).display,
            offsetParent: btn.offsetParent !== null,
            style: btn.getAttribute('style'),
            xShow: btn.getAttribute('x-show')
        }));
    });
    
    console.log('\n🔘 VISIBLE BUTTON STATUS:');
    visibleButtons.forEach((btn, i) => {
        console.log(`${i+1}. "${btn.text}" - Visible: ${btn.isVisible} (Display: ${btn.computedStyle})`);
    });
    
    // Try to click any visible buttons
    const visibleActionButtons = visibleButtons.filter(btn => btn.isVisible);
    
    if (visibleActionButtons.length > 0) {
        console.log(`\n🖱️ Found ${visibleActionButtons.length} visible buttons! Testing clicks...`);
        
        for (const visibleBtn of visibleActionButtons.slice(0, 2)) {
            try {
                console.log(`🖱️ Clicking "${visibleBtn.text}" button...`);
                await page.click(`button:has-text("${visibleBtn.text}")`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log(`✅ Clicked "${visibleBtn.text}" successfully`);
            } catch (e) {
                console.log(`❌ Failed to click "${visibleBtn.text}": ${e.message}`);
                
                // Try alternative approach
                await page.evaluate((buttonText) => {
                    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(buttonText));
                    if (btn) btn.click();
                }, visibleBtn.text);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    } else {
        console.log('\n❌ NO VISIBLE BUTTONS FOUND');
        console.log('The buttons exist but Alpine.js x-show conditions are hiding them all');
    }
    
    console.log('\n⏳ Keeping browser open for 15 seconds to observe...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    await browser.close();
    
    if (visibleActionButtons.length > 0) {
        console.log('\n🎉 SUCCESS: Buttons are visible and clickable!');
    } else {
        console.log('\n❌ ISSUE: Buttons exist but are all hidden by Alpine.js conditions');
    }
})().catch(console.error);