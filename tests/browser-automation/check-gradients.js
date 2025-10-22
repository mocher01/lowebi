const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Wait for React to render
  await page.waitForSelector('.hero-section', { timeout: 10000 });

  console.log('=== CHECKING GRADIENTS IN TEST25 ===\n');

  // Check 1: Hero subtitle with gradient-text class
  const gradientText = await page.$('.gradient-text');
  if (gradientText) {
    const text = await gradientText.textContent();
    const styles = await gradientText.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        background: computed.background,
        backgroundImage: computed.backgroundImage,
        webkitBackgroundClip: computed.webkitBackgroundClip,
        backgroundClip: computed.backgroundClip,
        webkitTextFillColor: computed.webkitTextFillColor,
        color: computed.color,
      };
    });
    console.log('✅ Found .gradient-text element');
    console.log('   Text:', text.trim());
    console.log('   Background:', styles.backgroundImage);
    console.log('   Background Clip:', styles.backgroundClip);
    console.log('   Text Fill Color:', styles.webkitTextFillColor);
    console.log('');
  } else {
    console.log('❌ No .gradient-text element found\n');
  }

  // Check 2: Primary button gradient
  const btnPrimary = await page.$('.btn-primary');
  if (btnPrimary) {
    const text = await btnPrimary.textContent();
    const styles = await btnPrimary.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        background: computed.background,
        backgroundImage: computed.backgroundImage,
        backgroundColor: computed.backgroundColor,
      };
    });
    console.log('✅ Found .btn-primary button');
    console.log('   Text:', text.trim().substring(0, 50));
    console.log('   Background Image:', styles.backgroundImage);
    console.log('   Background Color:', styles.backgroundColor);
    console.log('');
  } else {
    console.log('❌ No .btn-primary button found\n');
  }

  // Check 3: Secondary button gradient
  const btnSecondary = await page.$('.btn-secondary');
  if (btnSecondary) {
    const text = await btnSecondary.textContent();
    const styles = await btnSecondary.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        background: computed.background,
        backgroundImage: computed.backgroundImage,
        backgroundColor: computed.backgroundColor,
      };
    });
    console.log('✅ Found .btn-secondary button');
    console.log('   Text:', text.trim().substring(0, 50));
    console.log('   Background Image:', styles.backgroundImage);
    console.log('   Background Color:', styles.backgroundColor);
    console.log('');
  } else {
    console.log('❌ No .btn-secondary button found\n');
  }

  // Check 4: Hero section text color
  const heroSection = await page.$('.hero-section');
  if (heroSection) {
    const styles = await heroSection.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });
    console.log('✅ Hero section found');
    console.log('   Text Color:', styles.color);
    console.log('   Background Color:', styles.backgroundColor);
    console.log('');
  }

  // Check 5: CSS Variables
  const cssVars = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      primary: root.getPropertyValue('--color-primary').trim(),
      secondary: root.getPropertyValue('--color-secondary').trim(),
      accent: root.getPropertyValue('--color-accent').trim(),
      heroText: root.getPropertyValue('--section-hero-text').trim(),
    };
  });
  console.log('✅ CSS Variables:');
  console.log('   --color-primary:', cssVars.primary);
  console.log('   --color-secondary:', cssVars.secondary);
  console.log('   --color-accent:', cssVars.accent);
  console.log('   --section-hero-text:', cssVars.heroText);

  await browser.close();
})();
