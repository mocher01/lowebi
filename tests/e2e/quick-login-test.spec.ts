import { test, expect } from '@playwright/test';

test('Quick customer login test', async ({ page }) => {
  const requests = [];
  
  // Capture all network requests
  page.on('request', request => {
    if (request.url().includes('/auth')) {
      requests.push({
        url: request.url(),
        method: request.method()
      });
    }
  });

  // Go to login page with a shorter timeout
  await page.goto('https://dev.lowebi.com/login', { timeout: 15000 });
  
  // Wait a bit for the page to load
  await page.waitForTimeout(3000);
  
  // Try to find and fill the email field
  try {
    await page.fill('input[type="email"]', 'test@example.com', { timeout: 5000 });
    await page.fill('input[type="password"]', 'testpassword', { timeout: 5000 });
    
    // Submit the form
    await page.click('button[type="submit"]', { timeout: 5000 });
    
    // Wait for auth request
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('Form interaction failed:', e.message);
  }
  
  // Check auth requests
  const authRequests = requests.filter(req => 
    req.url.includes('/auth/login') || req.url.includes('/customer/auth/login')
  );
  
  console.log('Auth requests found:');
  authRequests.forEach(req => {
    console.log(`${req.method} ${req.url}`);
  });
  
  const customerAuth = authRequests.filter(req => req.url.includes('/customer/auth/login'));
  const staffAuth = authRequests.filter(req => req.url.includes('/auth/login') && !req.url.includes('/customer/'));
  
  console.log(`Customer auth requests: ${customerAuth.length}`);
  console.log(`Staff auth requests: ${staffAuth.length}`);
});