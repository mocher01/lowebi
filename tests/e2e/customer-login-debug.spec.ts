import { test, expect } from '@playwright/test';

test('Customer login network requests debug', async ({ page }) => {
  const requests = [];
  
  // Capture all network requests
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
  });

  // Go to the customer login page
  await page.goto('https://logen.locod-ai.com/login');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Fill out the login form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait a moment for the request to be made
  await page.waitForTimeout(2000);
  
  // Filter for auth-related requests
  const authRequests = requests.filter(req => 
    req.url.includes('/auth/') || req.url.includes('/customer/auth/')
  );
  
  console.log('All auth requests captured:');
  authRequests.forEach(req => {
    console.log(`${req.method} ${req.url}`);
    if (req.postData) {
      console.log('Post data:', req.postData);
    }
  });
  
  // Check if we're hitting the customer auth endpoint
  const customerLoginRequests = authRequests.filter(req => 
    req.url.includes('/customer/auth/login')
  );
  
  const staffLoginRequests = authRequests.filter(req => 
    req.url.includes('/auth/login') && !req.url.includes('/customer/')
  );
  
  console.log(`Customer auth requests: ${customerLoginRequests.length}`);
  console.log(`Staff auth requests: ${staffLoginRequests.length}`);
});