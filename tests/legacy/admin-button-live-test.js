/**
 * 🧪 Live Admin Button Test with Puppeteer
 * Tests admin dashboard button functionality in a real browser environment
 */

const puppeteer = require('puppeteer');

async function testAdminButtons() {
    console.log('🚀 Starting Live Admin Button Test...\n');
    
    let browser;
    let page;
    
    try {
        // Launch browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'log') console.log(`🔧 BROWSER LOG: ${text}`);
            if (type === 'error') console.log(`❌ BROWSER ERROR: ${text}`);
            if (type === 'warn') console.log(`⚠️ BROWSER WARN: ${text}`);
        });
        
        // Enable error tracking
        page.on('pageerror', error => {
            console.log(`❌ PAGE ERROR: ${error.message}`);
        });
        
        page.on('requestfailed', request => {
            console.log(`❌ REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
        });
        
        // Navigate to admin dashboard
        console.log('📋 Navigating to admin dashboard...');
        await page.goto('http://162.55.213.90:3080/admin-dashboard', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForSelector('form', { timeout: 10000 });
        console.log('✅ Admin dashboard loaded');
        
        // Test 1: Login
        console.log('\n🔐 Testing login...');
        await page.type('input[type="email"]', 'admin@locod.ai');
        await page.type('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to appear
        await page.waitForSelector('.max-w-7xl', { timeout: 15000 });
        console.log('✅ Login successful');
        
        // Wait for queue data to load
        console.log('\n📊 Waiting for queue data to load...');
        await page.waitForTimeout(3000);
        
        // Check if Queue tab exists and click it
        try {
            await page.click('button:has-text("Queue")');
            console.log('✅ Switched to Queue tab');
            await page.waitForTimeout(2000);
        } catch (e) {
            console.log('⚠️ Queue tab not found, assuming already on queue view');
        }
        
        // Test 2: Check if requests are visible
        console.log('\n📋 Checking for requests in queue...');
        const requestRows = await page.$$('tbody tr:not(:has-text("Aucune demande"))');
        console.log(`📋 Found ${requestRows.length} requests in queue`);
        
        if (requestRows.length === 0) {
            console.log('⚠️ No requests found to test buttons with');
            return;
        }
        
        // Test 3: Test button clicks on first request
        const firstRow = requestRows[0];
        console.log('\n🔘 Testing buttons on first request...');
        
        // Check what buttons are available
        const buttons = await firstRow.$$('button');
        console.log(`🔘 Found ${buttons.length} buttons in first row`);
        
        for (let i = 0; i < buttons.length; i++) {
            try {
                const buttonText = await buttons[i].evaluate(el => el.textContent.trim());
                console.log(`🔘 Button ${i + 1}: "${buttonText}"`);
                
                // Clear console logs before clicking
                await page.evaluate(() => console.clear());
                
                // Click the button
                console.log(`🖱️ Clicking "${buttonText}" button...`);
                await buttons[i].click();
                
                // Wait for potential response
                await page.waitForTimeout(2000);
                
                // Check if modal appeared (for "Voir" button)
                if (buttonText === 'Voir') {
                    const modal = await page.$('[x-show="processingModal.show"]');
                    if (modal) {
                        const isVisible = await modal.evaluate(el => 
                            getComputedStyle(el).display !== 'none' && 
                            !el.hasAttribute('style') || 
                            !el.getAttribute('style').includes('display: none')
                        );
                        console.log(`👁️ Modal visible after click: ${isVisible}`);
                        
                        // Close modal if open
                        if (isVisible) {
                            const closeButton = await page.$('[x-show="processingModal.show"] button:has-text("Fermer")');
                            if (closeButton) await closeButton.click();
                        }
                    }
                }
                
                console.log(`✅ "${buttonText}" button clicked successfully`);
                
            } catch (error) {
                console.log(`❌ Error testing button ${i + 1}: ${error.message}`);
            }
        }
        
        // Test 4: Check console logs for debugging info
        console.log('\n🔍 Checking for JavaScript errors...');
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        
        // Trigger a button click to see debug logs
        try {
            const viewButton = await page.$('button:has-text("Voir")');
            if (viewButton) {
                console.log('🔧 Clicking View button to check debug logs...');
                await viewButton.click();
                await page.waitForTimeout(1000);
            }
        } catch (e) {
            console.log('⚠️ Could not find View button for debug test');
        }
        
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        console.log(`✅ Dashboard loaded successfully`);
        console.log(`✅ Login worked`);
        console.log(`✅ Found ${requestRows.length} requests`);
        console.log(`✅ Found ${buttons.length} buttons per request`);
        console.log(`🔧 Check browser console logs above for detailed debugging info`);
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
    } finally {
        if (browser) {
            console.log('\n🚀 Closing browser...');
            await browser.close();
        }
    }
}

// Run with error handling
testAdminButtons().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});