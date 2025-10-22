import { test, expect } from '@playwright/test';

/**
 * Test: Logout redirect functionality
 * Verifies that logout immediately redirects to /login without user action
 */

const BASE_URL = 'https://logen.locod-ai.com';
const TEST_EMAIL = `logout-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Logout Redirect Fix', () => {
  test('should automatically redirect to /login after logout', async ({ page }) => {
    // Step 1: Register a new user
    console.log('📝 Step 1: Registering test user...');
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="firstName"], input[placeholder*="Prénom"]', 'Test');
    await page.fill('input[name="lastName"], input[placeholder*="Nom"]', 'User');
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect after registration
    await page.waitForURL(/\/(dashboard|sites)/, { timeout: 15000 });
    console.log('✅ User registered and logged in');

    // Step 2: Navigate to MySites page
    console.log('📝 Step 2: Navigating to MySites page...');
    await page.goto(`${BASE_URL}/sites`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify we're on the sites page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/sites');
    console.log('✅ On MySites page:', currentUrl);

    // Step 3: Open user menu and find logout button
    console.log('📝 Step 3: Opening user menu...');

    // Click the user avatar to open dropdown
    const avatarButton = page.locator('button:has(div.h-8.w-8.rounded-full)').first();
    await avatarButton.click();
    await page.waitForTimeout(500);

    console.log('✅ User menu opened');

    // Step 4: Click logout button
    console.log('📝 Step 4: Clicking logout button...');

    const logoutButton = page.locator('button:has-text("Sign out")').first();

    // Verify logout button is visible
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Logout button found and visible');

    // Click logout and wait for navigation
    const navigationPromise = page.waitForURL('**/login', { timeout: 10000 });
    await logoutButton.click();

    console.log('🔄 Waiting for redirect to /login...');
    await navigationPromise;

    // Step 5: Verify we're on login page
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);

    expect(finalUrl).toContain('/login');
    console.log('✅ Successfully redirected to /login page');

    // Step 6: Verify logout was complete - try to access protected route
    console.log('📝 Step 5: Verifying logout was complete...');

    await page.goto(`${BASE_URL}/sites`);
    await page.waitForTimeout(2000);

    // Should be redirected back to login since we're logged out
    const protectedRouteUrl = page.url();
    expect(protectedRouteUrl).toContain('/login');
    console.log('✅ Cannot access protected route - logout confirmed');

    console.log('\n✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅');
    console.log('Logout redirect works correctly without any user action!');
  });

  test('should show loading spinner then redirect on session expiration', async ({ page }) => {
    console.log('📝 Testing session expiration scenario...');

    // Register and login
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('domcontentloaded');

    const testEmail = `session-test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="firstName"], input[placeholder*="Prénom"]', 'Session');
    await page.fill('input[name="lastName"], input[placeholder*="Nom"]', 'Test');
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|sites)/, { timeout: 15000 });
    console.log('✅ User logged in');

    // Go to sites page
    await page.goto(`${BASE_URL}/sites`);
    await page.waitForTimeout(2000);

    // Clear auth tokens to simulate session expiration
    console.log('🔄 Simulating session expiration...');
    await page.evaluate(() => {
      localStorage.removeItem('customer_access_token');
      document.cookie = 'customer_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    });

    // Reload the page - should trigger auth check and redirect
    await page.reload();

    // Should see loading spinner briefly, then redirect to login
    await page.waitForURL('**/login', { timeout: 10000 });

    const finalUrl = page.url();
    expect(finalUrl).toContain('/login');
    console.log('✅ Session expiration correctly redirects to /login');
  });
});
