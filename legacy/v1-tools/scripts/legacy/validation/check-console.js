const { chromium } = require('playwright');

async function checkConsole() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    const logs = [];
    page.on('console', (msg) => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    const errors = [];
    page.on('pageerror', (error) => {
        errors.push(error.message);
    });
    
    await page.goto('http://162.55.213.90:3080/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('ERRORS:', errors);
    console.log('CONSOLE LOGS:', logs.filter(l => l.includes('error') || l.includes('Error')));
    
    await browser.close();
}

checkConsole();