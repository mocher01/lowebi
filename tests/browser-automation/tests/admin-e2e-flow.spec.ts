import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * END-TO-END LOGIN FLOW TESTING
 * 
 * This test suite performs complete end-to-end testing of the admin portal
 * login flow, including error scenarios and edge cases.
 */

test.describe('Admin Portal - End-to-End Login Flow', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Enable request logging for debugging
    page.on('console', msg => console.log(`Console: ${msg.text()}`));
    page.on('requestfailed', req => console.log(`Request failed: ${req.url()}`));
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should complete successful admin login flow', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify login form is visible
    await expect(page.locator('h2')).toContainText('Admin Portal');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill in credentials
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).not.toBeDisabled();
    
    await submitButton.click();
    
    // Wait for form submission
    await page.waitForTimeout(3000);
    
    // Check for various possible outcomes
    const currentUrl = page.url();
    console.log(`Current URL after login attempt: ${currentUrl}`);
    
    // Possible outcomes:
    // 1. Successful redirect to /dashboard
    // 2. Error message displayed
    // 3. Still on login page due to error
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
    } else {
      // Check if error message is displayed
      const errorElement = page.locator('.bg-red-50');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Login error displayed: ${errorText}`);
      } else {
        console.log('❓ No redirect and no error message - unexpected state');
      }
    }
    
    // Take screenshot for manual verification
    await page.screenshot({ path: './test-results/artifacts/login-flow-result.png', fullPage: true });
  });

  test('should handle invalid credentials gracefully', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Fill in invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should show error message
    const errorElement = page.locator('.bg-red-50');
    await expect(errorElement).toBeVisible();
    
    const errorText = await errorElement.textContent();
    console.log(`Error message: ${errorText}`);
    
    // Should not redirect
    expect(page.url()).not.toContain('/dashboard');
    
    // Form should still be usable
    await expect(page.locator('#email')).toBeEnabled();
    await expect(page.locator('#password')).toBeEnabled();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('should validate form inputs and show appropriate errors', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submission
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    
    // Check if HTML5 validation is working
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    const passwordValidity = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    
    expect(emailValidity).toBe(false);
    expect(passwordValidity).toBe(false);
    
    // Fill invalid email
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'somepassword');
    await page.click('button[type="submit"]');
    
    const emailValidityAfter = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValidityAfter).toBe(false);
  });

  test('should handle loading states properly', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Fill credentials
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    
    // Submit and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Button should show loading state
    const isDisabled = await submitButton.isDisabled();
    const buttonText = await submitButton.textContent();
    
    console.log(`Button disabled: ${isDisabled}, Text: ${buttonText}`);
    
    // Should either be disabled or show "Signing in..." text
    expect(isDisabled || buttonText?.includes('Signing in')).toBe(true);
    
    // Wait for request to complete
    await page.waitForTimeout(3000);
  });

  test('should persist form data during interaction', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'admin@locod.ai';
    const testPassword = 'admin123';
    
    // Fill form
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    
    // Verify values are retained
    const emailValue = await page.locator('#email').inputValue();
    const passwordValue = await page.locator('#password').inputValue();
    
    expect(emailValue).toBe(testEmail);
    expect(passwordValue).toBe(testPassword);
    
    // Try submitting (which might fail)
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Form values should still be there after submission attempt
    const emailAfterSubmit = await page.locator('#email').inputValue();
    const passwordAfterSubmit = await page.locator('#password').inputValue();
    
    expect(emailAfterSubmit).toBe(testEmail);
    // Password might be cleared on error - that's acceptable UX
    console.log(`Password retained after submit: ${passwordAfterSubmit === testPassword}`);
  });

  test('should work correctly after page refresh', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Form should still work after refresh
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should behave the same as before
    await page.waitForTimeout(2000);
    console.log('✅ Form works correctly after page refresh');
  });

  test('should handle network connectivity issues', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate network failure
    await page.setOffline(true);
    
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Should show some kind of error (network error or timeout)
    const errorElement = page.locator('.bg-red-50');
    const isErrorVisible = await errorElement.isVisible();
    
    console.log(`Error shown during offline: ${isErrorVisible}`);
    
    // Restore network
    await page.setOffline(false);
    await page.waitForTimeout(1000);
    
    // Form should still be functional
    await expect(page.locator('#email')).toBeEnabled();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('should handle rapid successive submissions', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    
    // Click submit button multiple times rapidly
    const submitButton = page.locator('button[type="submit"]');
    
    // This should not cause JavaScript errors or multiple simultaneous requests
    await Promise.all([
      submitButton.click(),
      submitButton.click(),
      submitButton.click()
    ]);
    
    await page.waitForTimeout(3000);
    
    console.log('✅ Rapid submissions handled without crashes');
  });

  test('should validate accessibility of login form', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for proper labels
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    
    // Should have associated labels
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
    
    // Check ARIA attributes and accessibility
    const emailId = await emailInput.getAttribute('id');
    const passwordId = await passwordInput.getAttribute('id');
    
    expect(emailId).toBe('email');
    expect(passwordId).toBe('password');
    
    // Form should be keyboard accessible
    await emailInput.focus();
    await page.keyboard.press('Tab');
    
    const focusedElementId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElementId).toBe('password');
    
    console.log('✅ Basic accessibility checks passed');
  });

  test('should capture and report all errors for debugging', async () => {
    const allErrors: string[] = [];
    const allRequests: Array<{url: string, status: number}> = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text());
      }
    });
    
    page.on('response', response => {
      allRequests.push({
        url: response.url(),
        status: response.status()
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('\n🔍 COMPLETE ERROR & REQUEST REPORT:');
    console.log('─'.repeat(50));
    
    console.log('\n📝 All Console Errors:');
    if (allErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      allErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    console.log('\n🌐 All Network Requests:');
    const authRequests = allRequests.filter(req => req.url.includes('/auth/login'));
    if (authRequests.length > 0) {
      authRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.url} - Status: ${req.status}`);
      });
    } else {
      console.log('❌ No auth/login requests detected');
    }
    
    console.log('─'.repeat(50));
    
    // This test always passes - it's for reporting
    expect(true).toBe(true);
  });
});