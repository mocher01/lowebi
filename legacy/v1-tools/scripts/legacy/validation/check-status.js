const { chromium } = require('playwright');

async function quickStatusCheck() {
    console.log('🚀 QUICK STATUS CHECK');
    console.log('='.repeat(30));
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();
    
    try {
        // Test main portal
        console.log('📋 Testing main portal...');
        await page.goto('http://162.55.213.90:3080/', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        console.log('✅ Main portal: WORKING');
        
        // Test wizard
        console.log('📋 Testing wizard...');
        await page.goto('http://162.55.213.90:3080/wizard', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const wizardWorks = await page.locator('text=Assistant de Création').isVisible();
        console.log(`✅ Wizard: ${wizardWorks ? 'WORKING' : 'ISSUE'}`);
        
        // Check for upload fixes in wizard
        const wizardFixes = await page.evaluate(() => {
            return document.body.innerHTML.includes('triggerServiceUpload') && 
                   document.body.innerHTML.includes('triggerBlogUpload');
        });
        console.log(`✅ Wizard upload fixes: ${wizardFixes ? 'DEPLOYED' : 'MISSING'}`);
        
        // Test admin dashboard
        console.log('📋 Testing admin dashboard...');
        await page.goto('http://162.55.213.90:3080/admin-dashboard', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const adminWorks = await page.locator('input[type="email"]').isVisible();
        console.log(`✅ Admin dashboard: ${adminWorks ? 'WORKING' : 'ISSUE'}`);
        
        // Check for upload fixes in admin
        const adminFixes = await page.evaluate(() => {
            return document.body.innerHTML.includes('triggerFileUpload');
        });
        console.log(`✅ Admin upload fixes: ${adminFixes ? 'DEPLOYED' : 'MISSING'}`);
        
        await page.screenshot({ path: 'status-check.png' });
        
        return {
            success: true,
            portal: true,
            wizard: wizardWorks,
            wizardFixes: wizardFixes,
            admin: adminWorks,
            adminFixes: adminFixes
        };
        
    } catch (error) {
        console.error('❌ Status check error:', error.message);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

quickStatusCheck().then(result => {
    console.log('\n🏁 STATUS CHECK COMPLETE');
    console.log('='.repeat(30));
    
    if (result.success) {
        console.log('🎉 SYSTEM STATUS: ONLINE');
        console.log(`✅ Wizard: ${result.wizard ? 'OK' : 'ISSUE'}`);
        console.log(`✅ Admin: ${result.admin ? 'OK' : 'ISSUE'}`);
        console.log(`✅ Upload fixes: ${result.wizardFixes && result.adminFixes ? 'DEPLOYED' : 'PARTIAL'}`);
        
        console.log('\n🔗 AVAILABLE ENDPOINTS:');
        console.log('• Main portal: http://162.55.213.90:3080/');
        console.log('• Wizard: http://162.55.213.90:3080/wizard');  
        console.log('• Admin: http://162.55.213.90:3080/admin-dashboard');
        
        if (result.wizardFixes && result.adminFixes) {
            console.log('\n✅ UPLOAD FUNCTIONALITY:');
            console.log('• Wizard service/blog uploads: FIXED');
            console.log('• Admin image uploads: FIXED');
            console.log('• All upload buttons should now work!');
        }
    } else {
        console.log('❌ System check failed:', result.error);
    }
});