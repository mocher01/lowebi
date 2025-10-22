import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * CRITICAL ISSUE TESTING: Form Width Issues
 * 
 * The human reported that form input fields are taking full page width 
 * despite claims they use max-w-xs (320px). This test measures ACTUAL 
 * rendered widths in the browser, not just CSS classes.
 */

test.describe('Admin Portal - Form Width Issues', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
    
    // Monitor network failures
    page.on('requestfailed', request => {
      console.log(`Network Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should measure actual form container width - expecting max-w-xs (320px)', async () => {
    await page.goto('/');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Find the form container with max-w-xs class
    const formContainer = page.locator('.mx-auto.w-full.max-w-xs').first(); // The form container
    await expect(formContainer).toBeVisible();
    
    // Measure the actual rendered width
    const boundingBox = await formContainer.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    const actualWidth = boundingBox!.width;
    console.log(`Actual form container width: ${actualWidth}px`);
    
    // max-w-xs in Tailwind CSS is 320px
    // Allow some margin for padding/borders, but it should be close to 320px
    expect(actualWidth).toBeLessThanOrEqual(330); // 10px tolerance
    expect(actualWidth).toBeGreaterThan(300); // Should not be too narrow
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: './test-results/artifacts/form-width-measurement.png',
      fullPage: true 
    });
  });

  test('should measure actual input field widths within form container', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure email input field
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    
    const emailBoundingBox = await emailInput.boundingBox();
    expect(emailBoundingBox).not.toBeNull();
    
    const emailWidth = emailBoundingBox!.width;
    console.log(`Email input actual width: ${emailWidth}px`);
    
    // Measure password input field
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    
    const passwordBoundingBox = await passwordInput.boundingBox();
    expect(passwordBoundingBox).not.toBeNull();
    
    const passwordWidth = passwordBoundingBox!.width;
    console.log(`Password input actual width: ${passwordWidth}px`);
    
    // Both inputs should have similar widths and be contained within the form
    expect(Math.abs(emailWidth - passwordWidth)).toBeLessThan(5); // Should be nearly identical
    
    // Inputs should not be full page width (assuming 1280px viewport)
    expect(emailWidth).toBeLessThan(400); // Much less than full width
    expect(passwordWidth).toBeLessThan(400);
    
    // They should have some reasonable width for usability
    expect(emailWidth).toBeGreaterThan(200);
    expect(passwordWidth).toBeGreaterThan(200);
  });

  test('should verify Tailwind CSS classes are properly applied', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the form container has the expected classes
    const formContainer = page.locator('div').filter({ hasText: /Email address.*Password.*Sign in/i }).nth(0);
    await expect(formContainer).toHaveClass(/mx-auto/);
    await expect(formContainer).toHaveClass(/w-full/);
    await expect(formContainer).toHaveClass(/max-w-xs/);
    
    // Check input classes
    const emailInput = page.locator('#email');
    await expect(emailInput).toHaveClass(/w-full/);
    await expect(emailInput).toHaveClass(/px-3/);
    await expect(emailInput).toHaveClass(/py-2/);
    
    // Get computed styles to verify actual CSS application
    const computedMaxWidth = await formContainer.evaluate(el => {
      return window.getComputedStyle(el).maxWidth;
    });
    
    console.log(`Computed max-width: ${computedMaxWidth}`);
    
    // max-w-xs should compute to 20rem = 320px (assuming 16px base font size)
    expect(computedMaxWidth).toBe('20rem');
  });

  test('should measure widths across different viewport sizes', async () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1280, height: 720, name: 'Desktop Medium' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const formContainer = page.locator('.mx-auto.w-full.max-w-xs').first();
      const boundingBox = await formContainer.boundingBox();
      expect(boundingBox).not.toBeNull();
      
      const actualWidth = boundingBox!.width;
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): Form width = ${actualWidth}px`);
      
      // On mobile, the form might be constrained by viewport width, but should never exceed max-w-xs
      const expectedMaxWidth = Math.min(320, viewport.width - 32); // Account for padding
      expect(actualWidth).toBeLessThanOrEqual(expectedMaxWidth + 10); // Small tolerance
      
      await page.screenshot({ 
        path: `./test-results/artifacts/form-width-${viewport.name.toLowerCase().replace(' ', '-')}.png` 
      });
    }
  });

  test('should detect if CSS is loading properly', async () => {
    await page.goto('/');
    
    // Wait for stylesheets to load
    await page.waitForLoadState('networkidle');
    
    // Check if Tailwind CSS is loaded by testing a known Tailwind utility
    const bgColor = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // The page should have bg-gray-50, which should not be the default white
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
    expect(bgColor).not.toBe('rgb(255, 255, 255)'); // Not default white
    
    // Check that Tailwind's max-w-xs class exists and has the correct value
    const testElement = await page.addStyleTag({
      content: '.test-max-w-xs { max-width: 20rem; }'
    });
    
    const maxWidthValue = await page.evaluate(() => {
      const style = document.createElement('div');
      style.className = 'max-w-xs';
      document.body.appendChild(style);
      const computedStyle = window.getComputedStyle(style);
      const maxWidth = computedStyle.maxWidth;
      document.body.removeChild(style);
      return maxWidth;
    });
    
    console.log(`Tailwind max-w-xs computed value: ${maxWidthValue}`);
    expect(maxWidthValue).toBe('20rem');
  });

  test('should check for CSS specificity conflicts', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all applied styles for the form container
    const appliedStyles = await page.locator('.mx-auto.w-full.max-w-xs').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        maxWidth: styles.maxWidth,
        width: styles.width,
        marginLeft: styles.marginLeft,
        marginRight: styles.marginRight,
        display: styles.display,
        boxSizing: styles.boxSizing
      };
    });
    
    console.log('Applied styles:', JSON.stringify(appliedStyles, null, 2));
    
    // Verify that the expected styles are applied
    expect(appliedStyles.maxWidth).toBe('20rem');
    expect(appliedStyles.width).toBe('100%');
    expect(appliedStyles.marginLeft).toBe('auto');
    expect(appliedStyles.marginRight).toBe('auto');
  });
});