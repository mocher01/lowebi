import { test, expect } from '@playwright/test';

test('Simple login test', async ({ page }) => {
  console.log('Going to login page...');
  await page.goto('http://localhost:7601/login');

  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');

  console.log('Clicking submit...');
  await page.click('button[type="submit"]');

  // Wait for a bit to see what happens
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'after-login.png', fullPage: true });

  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check if we're still on login page
  if (currentUrl.includes('/login')) {
    console.log('Still on login page!');

    // Check for error message
    const errorMsg = await page.locator('text="Login failed"').textContent().catch(() => 'No error found');
    console.log('Error message:', errorMsg);

    // Check console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    console.log('Console logs:', consoleLogs);
  } else {
    console.log('Login successful! Redirected to:', currentUrl);
  }

  expect(currentUrl).not.toContain('/login');
});
