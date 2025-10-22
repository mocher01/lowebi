const puppeteer = require('puppeteer');

(async () => {
    console.log('🎯 MANUAL BUTTON CLICK TEST');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true,
        slowMo: 500
    });
    
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.text().includes('👁️') || msg.text().includes('🚀') || msg.text().includes('❌')) {
            console.log(`🎯 CLICK EVENT: ${msg.text()}`);
        }
    });
    
    await page.goto('http://162.55.213.90:3080/admin-dashboard');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[type="email"]', 'admin@locod.ai');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    console.log('🔍 Looking for buttons manually...');
    
    // Force click buttons using JavaScript evaluation
    const clickResult = await page.evaluate(() => {
        const results = [];
        
        // Find all buttons with our text
        const allButtons = Array.from(document.querySelectorAll('button'));
        const actionButtons = allButtons.filter(btn => 
            ['Voir', 'Continuer', 'Assigner'].includes(btn.textContent.trim())
        );
        
        results.push(`Found ${actionButtons.length} action buttons`);
        
        for (const btn of actionButtons) {
            const text = btn.textContent.trim();
            const visible = btn.offsetParent !== null;
            const display = getComputedStyle(btn).display;
            const xShow = btn.getAttribute('x-show');
            const dataRequestId = btn.getAttribute('data-request-id');
            
            results.push(`Button "${text}": visible=${visible}, display=${display}, x-show=${xShow}, data-request-id=${dataRequestId}`);
            
            if (text === 'Voir' && visible) {
                try {
                    btn.click();
                    results.push(`✅ Clicked "${text}" button`);
                } catch (e) {
                    results.push(`❌ Failed to click "${text}": ${e.message}`);
                }
            }
        }
        
        return results;
    });
    
    clickResult.forEach(result => console.log(result));
    
    console.log('\n⏳ Waiting 10 seconds to observe results...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await browser.close();
})().catch(console.error);