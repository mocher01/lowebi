const puppeteer = require('puppeteer');

(async () => {
    console.log('🏥 Admin Dashboard Diagnostic');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true,
        slowMo: 200
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔗 Navigating to admin dashboard...');
        await page.goto('http://162.55.213.90:3080/admin-dashboard', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        console.log('✅ Page loaded');
        
        // Check if login form is present
        const hasEmailInput = await page.$('input[type="email"]') !== null;
        const hasPasswordInput = await page.$('input[type="password"]') !== null;
        const hasLoginButton = await page.$('button[type="submit"]') !== null;
        
        console.log('🔐 Login form elements:');
        console.log(`  Email input: ${hasEmailInput ? '✅' : '❌'}`);
        console.log(`  Password input: ${hasPasswordInput ? '✅' : '❌'}`);
        console.log(`  Login button: ${hasLoginButton ? '✅' : '❌'}`);
        
        if (hasEmailInput && hasPasswordInput && hasLoginButton) {
            console.log('🔐 Attempting login...');
            await page.type('input[type="email"]', 'admin@locod.ai');
            await page.type('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            
            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check current URL and page state
            const currentUrl = page.url();
            const pageTitle = await page.title();
            
            console.log(`📍 Current URL: ${currentUrl}`);
            console.log(`📄 Page title: ${pageTitle}`);
            
            // Check if we're authenticated (look for admin interface elements)
            const hasTable = await page.$('table') !== null;
            const hasLogoutButton = await page.locator('button:has-text("Déconnexion")').count() > 0;
            const hasStats = await page.$('.stats, [class*="stat"]') !== null;
            
            console.log('🎯 Admin interface elements:');
            console.log(`  Table: ${hasTable ? '✅' : '❌'}`);
            console.log(`  Logout button: ${hasLogoutButton ? '✅' : '❌'}`);
            console.log(`  Stats section: ${hasStats ? '✅' : '❌'}`);
            
            if (hasTable) {
                // Check for Traiter buttons
                const traiterButtons = await page.$$eval('button', buttons => 
                    buttons.filter(btn => btn.textContent.includes('Traiter')).length
                );
                
                console.log(`🔘 Traiter buttons found: ${traiterButtons}`);
                
                // Get all button texts
                const allButtonTexts = await page.$$eval('button', buttons => 
                    buttons.map(btn => btn.textContent.trim()).filter(t => t && t.length > 0)
                );
                
                console.log('🔘 All buttons on page:');
                allButtonTexts.forEach((text, i) => {
                    console.log(`  ${i + 1}. "${text}"`);
                });
                
                // Check table content
                const rowCount = await page.$$eval('table tbody tr', rows => rows.length);
                console.log(`📋 Table rows: ${rowCount}`);
                
                if (traiterButtons > 0) {
                    console.log('🎯 Testing first Traiter button click...');
                    
                    const clickResult = await page.evaluate(() => {
                        const traiterBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('Traiter')
                        );
                        
                        if (traiterBtn) {
                            traiterBtn.click();
                            return { clicked: true, buttonHTML: traiterBtn.outerHTML };
                        }
                        return { clicked: false, error: 'Button not found' };
                    });
                    
                    console.log('🎯 Click result:', clickResult.clicked ? '✅ Clicked' : '❌ Failed');
                    
                    if (clickResult.clicked) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Check for modal
                        const modalVisible = await page.evaluate(() => {
                            const modal = document.querySelector('[x-show="processingModal.show"]');
                            if (!modal) return { exists: false };
                            
                            const style = getComputedStyle(modal);
                            return {
                                exists: true,
                                display: style.display,
                                visibility: style.visibility,
                                hasXCloak: modal.hasAttribute('x-cloak')
                            };
                        });
                        
                        console.log('🪟 Modal status:', modalVisible);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
    }
    
    console.log('⏳ Keeping browser open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await browser.close();
    console.log('🏁 Diagnostic completed');
})().catch(console.error);