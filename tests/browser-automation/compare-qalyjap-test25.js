const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Check qalyjap-3006
  const page1 = await browser.newPage();
  await page1.goto('http://localhost:3006', { waitUntil: 'networkidle' });
  await page1.waitForSelector('.hero-section', { timeout: 10000 });

  console.log('=== QALYJAP-3006 (WORKING) ===\n');

  const qalyjapGradient = await page1.evaluate(() => {
    const gradientText = document.querySelector('.gradient-text');
    const btnPrimary = document.querySelector('.btn-primary');
    const btnSecondary = document.querySelector('.btn-secondary');

    const computed1 = gradientText ? window.getComputedStyle(gradientText) : null;
    const computed2 = btnPrimary ? window.getComputedStyle(btnPrimary) : null;
    const computed3 = btnSecondary ? window.getComputedStyle(btnSecondary) : null;

    return {
      gradientText: {
        exists: !!gradientText,
        text: gradientText?.textContent.trim(),
        backgroundImage: computed1?.backgroundImage,
        backgroundColor: computed1?.backgroundColor,
        classes: gradientText?.className,
      },
      btnPrimary: {
        exists: !!btnPrimary,
        text: btnPrimary?.textContent.trim(),
        backgroundImage: computed2?.backgroundImage,
        backgroundColor: computed2?.backgroundColor,
        classes: btnPrimary?.className,
      },
      btnSecondary: {
        exists: !!btnSecondary,
        text: btnSecondary?.textContent.trim(),
        backgroundImage: computed3?.backgroundImage,
        backgroundColor: computed3?.backgroundColor,
        classes: btnSecondary?.className,
      },
    };
  });

  console.log('🔵 qalyjap .gradient-text:');
  console.log('   Text:', qalyjapGradient.gradientText.text);
  console.log('   Background Image:', qalyjapGradient.gradientText.backgroundImage);
  console.log('   Background Color:', qalyjapGradient.gradientText.backgroundColor);
  console.log('   Classes:', qalyjapGradient.gradientText.classes);
  console.log('');

  console.log('🔵 qalyjap .btn-primary:');
  console.log('   Text:', qalyjapGradient.btnPrimary.text);
  console.log('   Background Image:', qalyjapGradient.btnPrimary.backgroundImage);
  console.log('   Background Color:', qalyjapGradient.btnPrimary.backgroundColor);
  console.log('   Classes:', qalyjapGradient.btnPrimary.classes);
  console.log('');

  console.log('🔵 qalyjap .btn-secondary:');
  console.log('   Text:', qalyjapGradient.btnSecondary.text);
  console.log('   Background Image:', qalyjapGradient.btnSecondary.backgroundImage);
  console.log('   Background Color:', qalyjapGradient.btnSecondary.backgroundColor);
  console.log('   Classes:', qalyjapGradient.btnSecondary.classes);
  console.log('\n');

  await page1.close();

  // Check test25
  const page2 = await browser.newPage();
  await page2.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page2.waitForSelector('.hero-section', { timeout: 10000 });

  console.log('=== TEST25 (BROKEN) ===\n');

  const test25Gradient = await page2.evaluate(() => {
    const gradientText = document.querySelector('.gradient-text');
    const btnPrimary = document.querySelector('.btn-primary');
    const btnSecondary = document.querySelector('.btn-secondary');

    const computed1 = gradientText ? window.getComputedStyle(gradientText) : null;
    const computed2 = btnPrimary ? window.getComputedStyle(btnPrimary) : null;
    const computed3 = btnSecondary ? window.getComputedStyle(btnSecondary) : null;

    return {
      gradientText: {
        exists: !!gradientText,
        text: gradientText?.textContent.trim(),
        backgroundImage: computed1?.backgroundImage,
        backgroundColor: computed1?.backgroundColor,
        classes: gradientText?.className,
      },
      btnPrimary: {
        exists: !!btnPrimary,
        text: btnPrimary?.textContent.trim(),
        backgroundImage: computed2?.backgroundImage,
        backgroundColor: computed2?.backgroundColor,
        classes: btnPrimary?.className,
      },
      btnSecondary: {
        exists: !!btnSecondary,
        text: btnSecondary?.textContent.trim(),
        backgroundImage: computed3?.backgroundImage,
        backgroundColor: computed3?.backgroundColor,
        classes: btnSecondary?.className,
      },
    };
  });

  console.log('🔴 test25 .gradient-text:');
  console.log('   Text:', test25Gradient.gradientText.text);
  console.log('   Background Image:', test25Gradient.gradientText.backgroundImage);
  console.log('   Background Color:', test25Gradient.gradientText.backgroundColor);
  console.log('   Classes:', test25Gradient.gradientText.classes);
  console.log('');

  console.log('🔴 test25 .btn-primary:');
  console.log('   Text:', test25Gradient.btnPrimary.text);
  console.log('   Background Image:', test25Gradient.btnPrimary.backgroundImage);
  console.log('   Background Color:', test25Gradient.btnPrimary.backgroundColor);
  console.log('   Classes:', test25Gradient.btnPrimary.classes);
  console.log('');

  console.log('🔴 test25 .btn-secondary:');
  console.log('   Text:', test25Gradient.btnSecondary.text);
  console.log('   Background Image:', test25Gradient.btnSecondary.backgroundImage);
  console.log('   Background Color:', test25Gradient.btnSecondary.backgroundColor);
  console.log('   Classes:', test25Gradient.btnSecondary.classes);
  console.log('\n');

  await page2.close();
  await browser.close();

  console.log('=== COMPARISON ===');
  console.log('qalyjap gradient-text bg:', qalyjapGradient.gradientText.backgroundImage);
  console.log('test25 gradient-text bg:', test25Gradient.gradientText.backgroundImage);
  console.log('');
  console.log('qalyjap btn-primary bg:', qalyjapGradient.btnPrimary.backgroundImage);
  console.log('test25 btn-primary bg:', test25Gradient.btnPrimary.backgroundImage);
})();
