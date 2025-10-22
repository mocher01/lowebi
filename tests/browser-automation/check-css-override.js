const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero-section', { timeout: 10000 });

  console.log('=== CHECKING CSS OVERRIDE ISSUES ===\n');

  //Check 1: Get ALL applied styles for .btn-primary
  const btnPrimaryStyles = await page.evaluate(() => {
    const btn = document.querySelector('.btn-primary');
    if (!btn) return null;

    const allClasses = btn.className;
    const computed = window.getComputedStyle(btn);

    return {
      classes: allClasses,
      background: computed.background,
      backgroundImage: computed.backgroundImage,
      backgroundColor: computed.backgroundColor,
    };
  });

  console.log('🔍 Primary Button (.btn-primary):');
  console.log('   Classes:', btnPrimaryStyles?.classes);
  console.log('   Background:', btnPrimaryStyles?.background);
  console.log('   Background Image:', btnPrimaryStyles?.backgroundImage);
  console.log('   Background Color:', btnPrimaryStyles?.backgroundColor);
  console.log('');

  // Check 2: Check if Tailwind .bg-primary is overriding
  const hasTailwindBg = await page.evaluate(() => {
    const btn = document.querySelector('.btn-primary');
    return btn ? btn.classList.contains('bg-primary') : false;
  });

  console.log('🔍 Tailwind Conflict Check:');
  console.log('   Has .bg-primary class?', hasTailwindBg);
  console.log('');

  await browser.close();
})();
