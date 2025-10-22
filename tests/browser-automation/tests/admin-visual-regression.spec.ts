import { test, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * VISUAL REGRESSION TESTING for Form Width Consistency
 * 
 * This test suite takes screenshots and compares them to detect visual
 * regressions, particularly focusing on form width issues.
 */

test.describe('Admin Portal - Visual Regression Testing', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should capture baseline screenshots for form width comparison', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts and styles to load completely
    await page.waitForTimeout(1000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('admin-login-full-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take form-focused screenshot
    const formContainer = page.locator('.mx-auto.w-full.max-w-xs').first();
    await expect(formContainer).toHaveScreenshot('admin-login-form-container.png', {
      animations: 'disabled'
    });
    
    // Take input fields screenshot
    const formFields = page.locator('form');
    await expect(formFields).toHaveScreenshot('admin-login-form-fields.png', {
      animations: 'disabled'
    });
    
    console.log('✅ Baseline screenshots captured');
  });

  test('should verify form width consistency across browser resolutions', async () => {
    const resolutions = [
      { width: 1920, height: 1080, name: 'desktop-hd' },
      { width: 1366, height: 768, name: 'desktop-standard' },
      { width: 1024, height: 768, name: 'desktop-small' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 375, height: 667, name: 'mobile-iphone' },
      { width: 414, height: 896, name: 'mobile-large' },
    ];

    for (const resolution of resolutions) {
      console.log(`📱 Testing resolution: ${resolution.name} (${resolution.width}x${resolution.height})`);
      
      await page.setViewportSize({ width: resolution.width, height: resolution.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Allow layout to stabilize
      
      // Take screenshot for this resolution
      await expect(page).toHaveScreenshot(`admin-login-${resolution.name}.png`, {
        fullPage: false, // Viewport only
        animations: 'disabled'
      });
      
      // Measure form width at this resolution
      const formContainer = page.locator('.mx-auto.w-full.max-w-xs').first();
      const boundingBox = await formContainer.boundingBox();
      
      if (boundingBox) {
        const expectedMaxWidth = Math.min(320, resolution.width - 32); // 320px or viewport minus padding
        console.log(`  Form width: ${boundingBox.width}px (max expected: ${expectedMaxWidth}px)`);
        
        // Form should never exceed its max-width constraint
        expect(boundingBox.width).toBeLessThanOrEqual(expectedMaxWidth + 10);
        
        // Form should be reasonably sized (not too small)
        expect(boundingBox.width).toBeGreaterThan(Math.min(280, resolution.width * 0.8));
      }
    }
  });

  test('should detect form layout changes during interaction', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Screenshot before any interaction
    await expect(page).toHaveScreenshot('form-before-interaction.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Fill email field and screenshot
    await page.fill('#email', 'admin@locod.ai');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('form-email-filled.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Fill password field and screenshot
    await page.fill('#password', 'admin123');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('form-both-filled.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Focus on submit button
    await page.locator('button[type="submit"]').hover();
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('form-button-hovered.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✅ Interaction screenshots captured');
  });

  test('should capture error state screenshots', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('form-validation-error.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Submit with invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message to appear
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('form-login-error.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✅ Error state screenshots captured');
  });

  test('should verify visual consistency of loading states', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Fill form
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    
    // Click submit and immediately try to capture loading state
    await page.click('button[type="submit"]');
    
    // Try to capture the loading state (this might be brief)
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('form-loading-state.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 1000
    });
    
    // Wait for response and capture final state
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('form-after-submit.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✅ Loading state screenshots captured');
  });

  test('should compare form appearance with design specifications', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure and validate key design elements
    const measurements = await page.evaluate(() => {
      const formContainer = document.querySelector('.mx-auto.w-full.max-w-xs:nth-of-type(2)') as HTMLElement;
      const emailInput = document.querySelector('#email') as HTMLInputElement;
      const passwordInput = document.querySelector('#password') as HTMLInputElement;
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      if (!formContainer || !emailInput || !passwordInput || !submitButton) {
        return null;
      }
      
      const formStyles = window.getComputedStyle(formContainer);
      const inputStyles = window.getComputedStyle(emailInput);
      const buttonStyles = window.getComputedStyle(submitButton);
      
      return {
        form: {
          width: formContainer.offsetWidth,
          maxWidth: formStyles.maxWidth,
          margin: formStyles.margin,
          padding: formStyles.padding
        },
        input: {
          width: emailInput.offsetWidth,
          height: emailInput.offsetHeight,
          padding: inputStyles.padding,
          border: inputStyles.border,
          borderRadius: inputStyles.borderRadius
        },
        button: {
          width: submitButton.offsetWidth,
          height: submitButton.offsetHeight,
          backgroundColor: buttonStyles.backgroundColor,
          borderRadius: buttonStyles.borderRadius
        }
      };
    });
    
    if (measurements) {
      console.log('📐 Design Measurements:');
      console.log(JSON.stringify(measurements, null, 2));
      
      // Validate against design specifications
      expect(measurements.form.maxWidth).toBe('20rem'); // max-w-xs = 20rem
      expect(measurements.form.width).toBeLessThanOrEqual(320); // 20rem ≈ 320px
      expect(measurements.input.height).toBeGreaterThan(35); // Should have reasonable height
      expect(measurements.button.width).toBe(measurements.form.width); // Full width button
    }
    
    // Take a detailed measurement screenshot
    await expect(page).toHaveScreenshot('form-design-measurements.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should validate CSS-in-JS and Tailwind class application', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that Tailwind classes are properly applied
    const tailwindClassValidation = await page.evaluate(() => {
      const formContainer = document.querySelector('.mx-auto.w-full.max-w-xs:nth-of-type(2)') as HTMLElement;
      const emailInput = document.querySelector('#email') as HTMLInputElement;
      
      if (!formContainer || !emailInput) return null;
      
      const containerClasses = formContainer.className.split(' ');
      const inputClasses = emailInput.className.split(' ');
      
      return {
        containerHasRequiredClasses: [
          'mx-auto',
          'w-full',
          'max-w-xs'
        ].every(cls => containerClasses.includes(cls)),
        inputHasRequiredClasses: [
          'appearance-none',
          'block',
          'w-full',
          'px-3',
          'py-2',
          'border',
          'border-gray-300',
          'rounded-md'
        ].every(cls => inputClasses.includes(cls)),
        containerClasses,
        inputClasses
      };
    });
    
    if (tailwindClassValidation) {
      console.log('🎨 CSS Class Validation:');
      console.log(JSON.stringify(tailwindClassValidation, null, 2));
      
      expect(tailwindClassValidation.containerHasRequiredClasses).toBe(true);
      expect(tailwindClassValidation.inputHasRequiredClasses).toBe(true);
    }
    
    // Visual verification screenshot
    await expect(page).toHaveScreenshot('form-css-validation.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should test dark mode and theme variations (if applicable)', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test with different color schemes
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('form-dark-mode.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test with high contrast
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addStyleTag({
      content: `
        * {
          filter: contrast(150%) !important;
        }
      `
    });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('form-high-contrast.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✅ Theme variation screenshots captured');
  });
});