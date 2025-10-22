import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * CRITICAL ISSUE TESTING: JavaScript Execution and Console Errors
 * 
 * The human reported the error "Cannot read properties of undefined (reading 'accessToken')"
 * This suggests the response structure from the API is not what the frontend expects.
 * This test suite monitors JavaScript execution and catches console errors.
 */

test.describe('Admin Portal - JavaScript Execution & Console Errors', () => {
  let context: BrowserContext;
  let page: Page;
  let consoleErrors: string[] = [];
  let networkErrors: Array<{url: string, error: string}> = [];

  test.beforeEach(async ({ browser }) => {
    // Reset error arrays for each test
    consoleErrors = [];
    networkErrors = [];
    
    context = await browser.newContext();
    page = await context.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`Console ${msg.type()}: ${text}`);
      
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });
    
    // Capture network failures
    page.on('requestfailed', request => {
      const error = request.failure()?.errorText || 'Unknown error';
      console.log(`Network Request Failed: ${request.url()} - ${error}`);
      networkErrors.push({ url: request.url(), error });
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`JavaScript Error: ${error.message}`);
      consoleErrors.push(`JavaScript Error: ${error.message}`);
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should load page without JavaScript errors', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more to ensure all JavaScript has executed
    await page.waitForTimeout(2000);
    
    // Check for console errors
    expect(consoleErrors, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toHaveLength(0);
    
    // Check for network errors
    expect(networkErrors, `Network errors found: ${JSON.stringify(networkErrors, null, 2)}`).toHaveLength(0);
  });

  test('should not have the "Cannot read properties of undefined (reading accessToken)" error on page load', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for any async operations to complete
    await page.waitForTimeout(3000);
    
    // Check specifically for the reported error
    const accessTokenError = consoleErrors.find(error => 
      error.includes('accessToken') && error.includes('undefined')
    );
    
    expect(accessTokenError, 'The specific accessToken error should not occur on page load').toBeUndefined();
  });

  test('should handle form interactions without JavaScript errors', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear any initial errors
    consoleErrors.length = 0;
    
    // Fill in the email field
    await page.fill('#email', 'admin@locod.ai');
    await page.waitForTimeout(500);
    
    // Fill in the password field
    await page.fill('#password', 'admin123');
    await page.waitForTimeout(500);
    
    // Check for errors after form interaction
    expect(consoleErrors, `Console errors after form interaction: ${JSON.stringify(consoleErrors, null, 2)}`).toHaveLength(0);
  });

  test('should capture the actual login submission error', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear initial errors
    consoleErrors.length = 0;
    networkErrors.length = 0;
    
    // Fill in credentials
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    
    // Set up response monitoring
    const responses: Array<{url: string, status: number, data: any}> = [];
    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        try {
          const data = await response.json();
          responses.push({
            url: response.url(),
            status: response.status(),
            data: data
          });
          console.log(`Login Response: Status=${response.status()}, Data=`, JSON.stringify(data, null, 2));
        } catch (e) {
          console.log(`Failed to parse login response: ${e}`);
        }
      }
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for the request to complete
    await page.waitForTimeout(3000);
    
    // Log all captured information
    console.log('Console Errors:', JSON.stringify(consoleErrors, null, 2));
    console.log('Network Errors:', JSON.stringify(networkErrors, null, 2));
    console.log('Responses:', JSON.stringify(responses, null, 2));
    
    // If there are console errors, analyze them
    if (consoleErrors.length > 0) {
      const accessTokenErrors = consoleErrors.filter(error => 
        error.includes('accessToken') || error.includes('tokens')
      );
      
      if (accessTokenErrors.length > 0) {
        console.log('AccessToken related errors found:', accessTokenErrors);
        
        // Check what the actual response structure looks like
        if (responses.length > 0) {
          const loginResponse = responses.find(r => r.url.includes('/auth/login'));
          if (loginResponse) {
            console.log('Analyzing response structure...');
            console.log('Response has tokens property:', 'tokens' in loginResponse.data);
            console.log('Response has token property:', 'token' in loginResponse.data);
            console.log('Response has accessToken property:', 'accessToken' in loginResponse.data);
            
            if ('tokens' in loginResponse.data) {
              console.log('tokens.accessToken exists:', 'accessToken' in loginResponse.data.tokens);
            }
          }
        }
      }
    }
    
    // The test passes by capturing and reporting the errors, not by asserting no errors
    // This is diagnostic - we want to see what's actually happening
  });

  test('should verify React component state management', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that React is loaded and working
    const isReactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || 
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('#__next') !== null;
    });
    
    expect(isReactLoaded, 'React should be loaded on the page').toBe(true);
    
    // Test state updates
    consoleErrors.length = 0;
    
    // Interact with form to trigger state changes
    await page.fill('#email', 'test@example.com');
    await page.waitForTimeout(100);
    
    await page.fill('#password', 'testpass');
    await page.waitForTimeout(100);
    
    // Clear the fields to trigger more state changes
    await page.fill('#email', '');
    await page.waitForTimeout(100);
    
    await page.fill('#email', 'admin@locod.ai');
    await page.waitForTimeout(100);
    
    expect(consoleErrors, 'No errors should occur during React state updates').toHaveLength(0);
  });

  test('should check for proper error handling in the handleSubmit function', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mock a failed network request to test error handling
    await page.route('/auth/login', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' })
      });
    });
    
    consoleErrors.length = 0;
    
    // Fill and submit the form
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Check that error is displayed in UI (not just console)
    const errorElement = page.locator('.bg-red-50');
    await expect(errorElement).toBeVisible();
    
    // Should not have JavaScript errors even when API call fails
    const jsErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties') || 
      error.includes('undefined')
    );
    
    expect(jsErrors, `JavaScript errors during error handling: ${JSON.stringify(jsErrors, null, 2)}`).toHaveLength(0);
  });

  test('should validate expected API response structure', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mock the successful login response with the EXPECTED structure
    // Based on the React code, it expects: data.tokens.accessToken
    await page.route('/auth/login', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { role: 'ADMIN' },
            tokens: {
              accessToken: 'test-access-token',
              refreshToken: 'test-refresh-token'
            }
          })
        });
      } else {
        route.continue();
      }
    });
    
    consoleErrors.length = 0;
    
    // Submit the form with correct structure
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for the response handling
    await page.waitForTimeout(2000);
    
    // Should not have any JavaScript errors with correct response structure
    expect(consoleErrors, `Console errors with correct API structure: ${JSON.stringify(consoleErrors, null, 2)}`).toHaveLength(0);
    
    // Should attempt to redirect (or show success state)
    // The test might show a 404 for /dashboard, but that's expected - no JS errors is what matters
  });

  test('should identify the exact cause of accessToken error', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mock an incorrect API response structure (likely the current problem)
    await page.route('/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          // Wrong structure - missing 'tokens' wrapper
          user: { role: 'ADMIN' },
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token'
        })
      });
    });
    
    consoleErrors.length = 0;
    
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    console.log('Testing with incorrect API response structure...');
    console.log('Console Errors:', JSON.stringify(consoleErrors, null, 2));
    
    // This SHOULD produce the accessToken error, confirming our hypothesis
    const accessTokenError = consoleErrors.find(error => 
      error.includes('accessToken') && error.includes('undefined')
    );
    
    if (accessTokenError) {
      console.log('✅ CONFIRMED: The error occurs when API response has wrong structure');
      console.log('Expected structure: { tokens: { accessToken: "..." } }');
      console.log('Actual structure likely: { accessToken: "..." } (missing tokens wrapper)');
    } else {
      console.log('❓ UNEXPECTED: Error did not occur with wrong structure. Need to investigate further.');
    }
  });
});