const { chromium } = require('playwright');

async function testAdminInterface() {
  console.log('🧪 Testing Admin Interface Updates...\n');
  
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // Test 1: French login page text
    console.log('1. Testing French login page...');
    await page.goto('http://localhost:7602/', { waitUntil: 'networkidle' });
    
    const loginText = await page.textContent('p');
    if (loginText && loginText.includes('Accès administratif sécurisé')) {
      console.log('   ✅ French login text confirmed');
    } else {
      console.log('   ❌ French login text not found:', loginText);
    }
    
    // Test 2: Login and check French admin interface
    console.log('2. Testing admin login...');
    await page.fill('input[type="email"]', 'admin@locod.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ Successfully logged in to admin dashboard');
      
      // Test 3: Check French header text
      console.log('3. Testing French header text...');
      const headerText = await page.textContent('.text-sm.text-gray-500');
      if (headerText && headerText.includes('Gérez votre plateforme')) {
        console.log('   ✅ French header text confirmed');
      } else {
        console.log('   ❌ French header text not found:', headerText);
      }
      
      // Test 4: Navigate to AI Queue and check improvements
      console.log('4. Testing AI Queue page...');
      await page.click('a[href="/dashboard/ai-queue"]');
      await page.waitForTimeout(2000);
      
      // Check for compact header (no duplicate titles)
      const queueTitles = await page.$$eval('h1, h2', els => 
        els.map(el => el.textContent).filter(text => text.includes('Queue'))
      );
      
      if (queueTitles.length === 1) {
        console.log('   ✅ No duplicate "Queue IA" titles - header optimized');
      } else {
        console.log('   ❌ Found duplicate titles:', queueTitles);
      }
      
      // Check for table layout (not cards)
      const tableExists = await page.$('table') !== null;
      const cardExists = await page.$('.grid') !== null;
      
      if (tableExists) {
        console.log('   ✅ Table layout confirmed (not cards)');
      } else if (cardExists) {
        console.log('   ⚠️  Still showing card layout, not table');
      } else {
        console.log('   ℹ️  No requests in queue to test layout');
      }
      
      console.log('\n🎉 Admin interface test completed!');
      
    } else {
      console.log('   ❌ Login failed or redirected incorrectly:', currentUrl);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAdminInterface();