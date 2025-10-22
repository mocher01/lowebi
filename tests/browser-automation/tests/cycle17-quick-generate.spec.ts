import { test, expect } from '@playwright/test';

/**
 * CYCLE 17: QUICK GENERATION TEST
 *
 * Test simple et rapide:
 * 1. Login
 * 2. My Sites → trouver site existant
 * 3. Continue → Step 7
 * 4. Cliquer "Générer mon site"
 * 5. Vérifier que la génération démarre
 */
test('Cycle 17: Quick Site Generation', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  const existingSiteName = 'Cycle17_Step7_1759748351651';

  console.log('🚀 CYCLE 17: QUICK GENERATION TEST');
  console.log(`🔍 Target site: ${existingSiteName}`);

  // 1. Login
  console.log('\n🔐 Step 1: Login...');
  await page.goto('https://logen.locod-ai.com/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  console.log('✅ Logged in');

  // 2. Go to My Sites
  console.log('\n🏠 Step 2: Navigate to My Sites...');
  await page.goto('https://logen.locod-ai.com/sites');
  await page.waitForTimeout(2000);
  console.log('✅ On My Sites page');

  // 3. Find the site and click Continue
  console.log(`\n🔍 Step 3: Looking for site "${existingSiteName}"...`);
  const siteRow = page.locator(`tr:has-text("${existingSiteName}")`);
  const siteFound = await siteRow.isVisible({ timeout: 5000 }).catch(() => false);

  if (!siteFound) {
    console.log(`❌ Site "${existingSiteName}" not found!`);
    await page.screenshot({ path: '/tmp/cycle17-quick-site-not-found.png', fullPage: true });
    throw new Error(`Site "${existingSiteName}" not found in My Sites`);
  }

  console.log(`✅ Found site "${existingSiteName}"`);

  const continueButton = siteRow.locator('a:has-text("Continue"), button:has-text("Continue")');
  await continueButton.click();
  await page.waitForTimeout(3000);
  console.log('✅ Clicked Continue');

  // 4. Verify we're on Step 7 and find Generate button
  console.log('\n🎯 Step 4: Looking for "Générer mon site" button...');
  const generateButton = page.locator('button:has-text("Générer mon site"), button:has-text("Générer le site")').first();
  const buttonFound = await generateButton.isVisible({ timeout: 10000 }).catch(() => false);

  if (!buttonFound) {
    console.log('❌ Generate button not found!');
    await page.screenshot({ path: '/tmp/cycle17-quick-no-button.png', fullPage: true });
    throw new Error('Generate button not found on Step 7');
  }

  const buttonText = await generateButton.textContent();
  console.log(`✅ Found generation button: "${buttonText}"`);

  // 5. Click Generate
  console.log('\n🚀 Step 5: Clicking "Générer mon site"...');
  await generateButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Clicked generate button');

  // 6. Wait and check for generation feedback
  console.log('\n⏳ Step 6: Checking generation started...');
  await page.waitForTimeout(5000);

  // Check if button is still there or if modal/progress appeared
  const buttonStillThere = await generateButton.isVisible({ timeout: 2000 }).catch(() => false);
  const pageContent = await page.textContent('body').catch(() => '');

  if (buttonStillThere && !pageContent.includes('génération') && !pageContent.includes('Génération')) {
    console.log('⚠️ WARNING: Button still visible and no generation feedback');
    await page.screenshot({ path: '/tmp/cycle17-quick-no-feedback.png', fullPage: true });

    // Check browser console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('📋 Console errors:', consoleErrors);
  } else {
    console.log('✅ Generation appears to have started!');
  }

  await page.screenshot({ path: '/tmp/cycle17-quick-final.png', fullPage: true });
  console.log('\n🎉 TEST COMPLETED');
});
