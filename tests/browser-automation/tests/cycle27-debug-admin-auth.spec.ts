import { test, expect } from '@playwright/test';

test.describe('Debug Admin Authentication', () => {
  test('Debug auth state when navigating to admin page', async ({ page }) => {
    console.log('🔍 DEBUG TEST: Admin Authentication Issue');
    console.log('================================================================================\n');

    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log(`[PAGE LOG] ${msg.text()}`);
      }
    });

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/customer/auth') || request.url().includes('/admin/sites')) {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`);
        const headers = request.headers();
        if (headers['authorization']) {
          console.log(`[AUTH HEADER] ${headers['authorization'].substring(0, 30)}...`);
        }
      }
    });

    page.on('response', response => {
      if (response.url().includes('/customer/auth') || response.url().includes('/admin/sites')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    // Step 1: Login
    console.log('\n🔐 Step 1: Login...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check localStorage and cookies after login
    const authData = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('customer_access_token'),
        authStorage: localStorage.getItem('customer-auth-storage'),
        cookies: document.cookie
      };
    });

    console.log('\n📦 Auth Data After Login:');
    console.log('- Access Token:', authData.accessToken ? 'Present' : 'Missing');
    console.log('- Auth Storage:', authData.authStorage ? 'Present' : 'Missing');
    console.log('- Has Refresh Cookie:', authData.cookies.includes('customer_refresh_token'));

    // Step 2: Navigate to MySites
    console.log('\n🏠 Step 2: Navigate to MySites...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(2000);

    const sitesUrl = page.url();
    console.log(`📍 Current URL: ${sitesUrl}`);

    if (!sitesUrl.includes('/sites')) {
      throw new Error('Failed to navigate to MySites');
    }

    // Check auth data on MySites page
    const sitesAuthData = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('customer_access_token'),
        authStorage: localStorage.getItem('customer-auth-storage'),
      };
    });

    console.log('\n📦 Auth Data on MySites:');
    console.log('- Access Token:', sitesAuthData.accessToken ? 'Present' : 'Missing');
    console.log('- Auth Storage:', sitesAuthData.authStorage ? 'Present' : 'Missing');

    // Step 3: Find and click Manage button
    console.log('\n🎯 Step 3: Finding Manage button...');

    // Look for the deployed site
    const manageButton = await page.locator('a:has-text("Manage")').first();
    const isVisible = await manageButton.isVisible();

    if (!isVisible) {
      console.log('❌ No Manage button found - no deployed sites');
      return;
    }

    const manageHref = await manageButton.getAttribute('href');
    console.log(`📎 Manage button href: ${manageHref}`);

    // Inject logging before clicking
    await page.evaluate(() => {
      console.log('[CLIENT] About to navigate to admin page');
      console.log('[CLIENT] Current localStorage:', {
        accessToken: localStorage.getItem('customer_access_token') ? 'Present' : 'Missing',
        authStorage: localStorage.getItem('customer-auth-storage') ? 'Present' : 'Missing'
      });
    });

    // Click the Manage button
    console.log('\n🖱️ Clicking Manage button...');
    await manageButton.click();

    // Wait and check where we ended up
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log(`\n📍 Final URL: ${finalUrl}`);

    // Check auth data on final page
    const finalAuthData = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('customer_access_token'),
        authStorage: localStorage.getItem('customer-auth-storage'),
        pageContent: document.body.innerText.substring(0, 200)
      };
    });

    console.log('\n📦 Auth Data on Final Page:');
    console.log('- Access Token:', finalAuthData.accessToken ? 'Present' : 'Missing');
    console.log('- Auth Storage:', finalAuthData.authStorage ? 'Present' : 'Missing');
    console.log('- Page Content:', finalAuthData.pageContent);

    if (finalUrl.includes('/login')) {
      console.log('\n❌ REDIRECTED TO LOGIN - Authentication failed!');
    } else if (finalUrl.includes('/admin/sites')) {
      console.log('\n✅ Successfully reached admin page!');
    } else {
      console.log('\n⚠️ Unexpected URL:', finalUrl);
    }
  });
});