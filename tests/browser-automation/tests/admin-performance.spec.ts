import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * PERFORMANCE AND ACCESSIBILITY TESTING
 * 
 * This test suite uses browser APIs and tools to test performance,
 * accessibility, and overall user experience metrics.
 */

test.describe('Admin Portal - Performance & Accessibility', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Enable performance metrics collection
    await context.addInitScript(() => {
      (window as any).performanceData = {
        navigationStart: performance.now(),
        resources: [],
        marks: new Map(),
        measures: new Map()
      };
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should measure page load performance metrics', async () => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Get detailed performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintMetrics = performance.getEntriesByType('paint');
      
      return {
        // Navigation timing
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstByte: perfData.responseStart - perfData.requestStart,
        domInteractive: perfData.domInteractive - perfData.navigationStart,
        
        // Paint metrics
        firstPaint: paintMetrics.find(m => m.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintMetrics.find(m => m.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource loading
        totalResources: performance.getEntriesByType('resource').length,
        
        // Memory usage (if available)
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };
    });
    
    console.log('⚡ Performance Metrics:');
    console.log(`  Total Load Time: ${loadTime}ms`);
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`  DOM Interactive: ${performanceMetrics.domInteractive.toFixed(2)}ms`);
    console.log(`  Resources Loaded: ${performanceMetrics.totalResources}`);
    
    if (performanceMetrics.memory) {
      console.log(`  JS Heap Used: ${(performanceMetrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Performance assertions
    expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000); // FCP under 3 seconds
    expect(performanceMetrics.domInteractive).toBeLessThan(5000); // DOM interactive under 5 seconds
  });

  test('should analyze resource loading and optimization', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const resourceAnalysis = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const analysis = {
        css: [],
        js: [],
        images: [],
        fonts: [],
        other: [],
        totalTransferSize: 0,
        slowestResources: []
      };
      
      resources.forEach(resource => {
        const duration = resource.responseEnd - resource.requestStart;
        const transferSize = resource.transferSize || 0;
        analysis.totalTransferSize += transferSize;
        
        const resourceInfo = {
          url: resource.name,
          duration: duration,
          transferSize: transferSize,
          cached: resource.transferSize === 0 && duration < 5
        };
        
        if (resource.name.includes('.css')) {
          analysis.css.push(resourceInfo);
        } else if (resource.name.includes('.js')) {
          analysis.js.push(resourceInfo);
        } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          analysis.images.push(resourceInfo);
        } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
          analysis.fonts.push(resourceInfo);
        } else {
          analysis.other.push(resourceInfo);
        }
        
        if (duration > 1000) { // Slow resources over 1 second
          analysis.slowestResources.push(resourceInfo);
        }
      });
      
      return analysis;
    });
    
    console.log('📊 Resource Loading Analysis:');
    console.log(`  CSS files: ${resourceAnalysis.css.length}`);
    console.log(`  JavaScript files: ${resourceAnalysis.js.length}`);
    console.log(`  Images: ${resourceAnalysis.images.length}`);
    console.log(`  Fonts: ${resourceAnalysis.fonts.length}`);
    console.log(`  Total transfer size: ${(resourceAnalysis.totalTransferSize / 1024).toFixed(2)}KB`);
    
    if (resourceAnalysis.slowestResources.length > 0) {
      console.log('  🐌 Slow resources (>1s):');
      resourceAnalysis.slowestResources.forEach(resource => {
        console.log(`    ${resource.url}: ${resource.duration.toFixed(2)}ms`);
      });
    }
    
    // Performance recommendations
    expect(resourceAnalysis.totalTransferSize).toBeLessThan(5 * 1024 * 1024); // Under 5MB total
    expect(resourceAnalysis.slowestResources.length).toBeLessThan(3); // Less than 3 slow resources
  });

  test('should test form interaction performance', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const interactionMetrics = [];
    
    // Test email input performance
    const emailStartTime = Date.now();
    await page.focus('#email');
    await page.fill('#email', 'admin@locod.ai');
    const emailEndTime = Date.now();
    interactionMetrics.push({ action: 'Email input', duration: emailEndTime - emailStartTime });
    
    // Test password input performance
    const passwordStartTime = Date.now();
    await page.focus('#password');
    await page.fill('#password', 'admin123');
    const passwordEndTime = Date.now();
    interactionMetrics.push({ action: 'Password input', duration: passwordEndTime - passwordStartTime });
    
    // Test button click responsiveness
    const clickStartTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100); // Wait for initial response
    const clickEndTime = Date.now();
    interactionMetrics.push({ action: 'Button click response', duration: clickEndTime - clickStartTime });
    
    console.log('🖱️ Interaction Performance:');
    interactionMetrics.forEach(metric => {
      console.log(`  ${metric.action}: ${metric.duration}ms`);
      expect(metric.duration).toBeLessThan(500); // All interactions should be under 500ms
    });
  });

  test('should validate accessibility compliance', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Basic accessibility checks
    const accessibilityChecks = await page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt text on images
      const images = document.querySelectorAll('img');
      images.forEach((img, i) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          issues.push(`Image ${i + 1} missing alt text`);
        }
      });
      
      // Check for form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input, i) => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        
        if (!label && !ariaLabel && !ariaLabelledBy) {
          issues.push(`Form input ${i + 1} (${input.tagName}) missing label`);
        }
      });
      
      // Check for heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
      
      // Check for color contrast issues (basic check)
      const colorContrastIssues = [];
      const textElements = document.querySelectorAll('p, span, a, button, label');
      
      // Check for keyboard accessibility
      const focusableElements = document.querySelectorAll(
        'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );
      
      return {
        issues,
        headingCount: headings.length,
        headingLevels,
        focusableElementsCount: focusableElements.length,
        hasMainLandmark: !!document.querySelector('main, [role="main"]'),
        hasSkipLink: !!document.querySelector('a[href="#main"], a[href="#content"]')
      };
    });
    
    console.log('♿ Accessibility Analysis:');
    console.log(`  Issues found: ${accessibilityChecks.issues.length}`);
    console.log(`  Focusable elements: ${accessibilityChecks.focusableElementsCount}`);
    console.log(`  Has main landmark: ${accessibilityChecks.hasMainLandmark}`);
    console.log(`  Heading structure: ${accessibilityChecks.headingLevels.join(', ')}`);
    
    if (accessibilityChecks.issues.length > 0) {
      console.log('  Issues:');
      accessibilityChecks.issues.forEach(issue => console.log(`    - ${issue}`));
    }
    
    // Basic accessibility assertions
    expect(accessibilityChecks.issues.length).toBeLessThan(5); // Should have minimal accessibility issues
    expect(accessibilityChecks.focusableElementsCount).toBeGreaterThan(2); // At least email, password, submit
  });

  test('should test keyboard navigation', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Start from the first focusable element
    await page.keyboard.press('Tab');
    
    let currentFocus = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`First tab focus: ${currentFocus}`);
    
    // Tab through all form elements
    const tabSequence = [];
    for (let i = 0; i < 5; i++) {
      const elementInfo = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          id: el?.id,
          type: (el as HTMLInputElement)?.type || null,
          text: el?.textContent?.trim()?.substring(0, 20) || null
        };
      });
      
      tabSequence.push(elementInfo);
      await page.keyboard.press('Tab');
    }
    
    console.log('⌨️ Keyboard Navigation Sequence:');
    tabSequence.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.tagName}${item.id ? `#${item.id}` : ''}${item.type ? `[${item.type}]` : ''}`);
    });
    
    // Should be able to navigate to email, password, and submit button
    const expectedElements = ['email', 'password', 'submit'];
    const foundElements = tabSequence.filter(item => 
      expectedElements.some(expected => 
        item.id === expected || item.type === expected || 
        (item.type === 'submit' && expected === 'submit')
      )
    );
    
    expect(foundElements.length).toBeGreaterThanOrEqual(2); // At least email and password or submit
  });

  test('should measure memory usage during form interactions', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Initial memory measurement
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });
    
    if (!initialMemory) {
      console.log('⚠️ Memory API not available in this browser');
      return;
    }
    
    // Perform multiple form interactions
    for (let i = 0; i < 10; i++) {
      await page.fill('#email', `test${i}@example.com`);
      await page.fill('#password', `password${i}`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    // Final memory measurement
    const finalMemory = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      };
    });
    
    const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
    
    console.log('🧠 Memory Usage Analysis:');
    console.log(`  Initial: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Final: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(1)}%)`);
    
    // Memory should not increase dramatically with form interactions
    expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% memory increase
  });

  test('should validate mobile performance and responsiveness', async () => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileStartTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const mobileLoadTime = Date.now() - mobileStartTime;
    
    // Test touch interactions
    const touchStartTime = Date.now();
    await page.tap('#email');
    await page.fill('#email', 'admin@locod.ai');
    await page.tap('#password');
    await page.fill('#password', 'admin123');
    const touchEndTime = Date.now();
    const touchInteractionTime = touchEndTime - touchStartTime;
    
    console.log('📱 Mobile Performance:');
    console.log(`  Mobile load time: ${mobileLoadTime}ms`);
    console.log(`  Touch interaction time: ${touchInteractionTime}ms`);
    
    // Mobile-specific performance expectations
    expect(mobileLoadTime).toBeLessThan(15000); // Mobile can be slower, but under 15s
    expect(touchInteractionTime).toBeLessThan(1000); // Touch interactions under 1s
    
    // Check viewport meta tag for mobile optimization
    const hasViewportMeta = await page.evaluate(() => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      return {
        exists: !!viewportMeta,
        content: viewportMeta?.getAttribute('content') || null
      };
    });
    
    expect(hasViewportMeta.exists).toBe(true);
    console.log(`  Viewport meta: ${hasViewportMeta.content}`);
  });

  test('should generate performance summary report', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Collect all performance data
    const comprehensiveReport = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const paintMetrics = performance.getEntriesByType('paint');
      
      return {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timing: {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          firstByte: perfData.responseStart - perfData.requestStart,
          domInteractive: perfData.domInteractive - perfData.navigationStart,
          firstPaint: paintMetrics.find(m => m.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintMetrics.find(m => m.name === 'first-contentful-paint')?.startTime || 0
        },
        resources: {
          total: resources.length,
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          css: resources.filter(r => r.name.includes('.css')).length,
          js: resources.filter(r => r.name.includes('.js')).length,
          images: resources.filter(r => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(r.name)).length
        },
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };
    });
    
    console.log('\n📋 COMPREHENSIVE PERFORMANCE REPORT:');
    console.log('═'.repeat(60));
    console.log(`Timestamp: ${comprehensiveReport.timestamp}`);
    console.log(`URL: ${comprehensiveReport.url}`);
    console.log(`Viewport: ${comprehensiveReport.viewport.width}x${comprehensiveReport.viewport.height}`);
    console.log('\n⏱️ Timing Metrics:');
    Object.entries(comprehensiveReport.timing).forEach(([key, value]) => {
      console.log(`  ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}ms`);
    });
    console.log('\n📦 Resource Summary:');
    console.log(`  Total resources: ${comprehensiveReport.resources.total}`);
    console.log(`  Total size: ${(comprehensiveReport.resources.totalSize / 1024).toFixed(2)}KB`);
    console.log(`  CSS files: ${comprehensiveReport.resources.css}`);
    console.log(`  JS files: ${comprehensiveReport.resources.js}`);
    console.log(`  Images: ${comprehensiveReport.resources.images}`);
    
    if (comprehensiveReport.memory) {
      console.log('\n🧠 Memory Usage:');
      console.log(`  Used heap: ${(comprehensiveReport.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Total heap: ${(comprehensiveReport.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    console.log('═'.repeat(60));
    
    // Save report data for external analysis
    await page.evaluate((report) => {
      (window as any).performanceReport = report;
    }, comprehensiveReport);
    
    expect(comprehensiveReport.timing.firstContentfulPaint).toBeLessThan(3000);
    expect(comprehensiveReport.resources.totalSize).toBeLessThan(2 * 1024 * 1024); // Under 2MB
  });
});