import { test } from '@playwright/test';

/**
 * CYCLE 17: SIMPLE STEP 7 TEST
 * Creates basic site (Steps 1-6) then tests Step 7 generation
 */
test('Cycle 17: Simple Step 7 Generation', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes

  const timestamp = Date.now();
  const siteName = `Cycle17_${timestamp}`;

  console.log(`🚀 CYCLE 17 SIMPLE: ${siteName}`);

  // Login
  console.log('🔐 Login...');
  await page.goto('https://logen.locod-ai.com/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  console.log('✅ Logged in');

  // Create new wizard
  console.log('🆕 Create new wizard...');
  await page.goto('https://logen.locod-ai.com/wizard?new=true');
  await page.waitForTimeout(2000);

  // Step 1: Business type
  console.log('📋 Step 1: Business type...');
  const businessCard = page.locator('div.cursor-pointer').first();
  if (await businessCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await businessCard.click();
  }
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1500);

  // Step 2: Design (skip)
  console.log('🎨 Step 2: Design (skip)...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1500);

  // Step 3: Layout + Business name
  console.log('📐 Step 3: Layout...');
  const nameField = page.getByPlaceholder('Mon Entreprise');
  if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameField.fill(siteName);
    console.log(`✅ Business name: ${siteName}`);
  }
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1500);

  // Step 4: Content (skip AI)
  console.log('📝 Step 4: Content (skip AI)...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1500);

  // Step 5: Images (skip AI)
  console.log('🖼️ Step 5: Images (skip AI)...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1500);

  // Step 6: Features (skip)
  console.log('⚙️ Step 6: Features (skip)...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(2000);

  // Step 7: Review & Generate
  console.log('🎯 Step 7: Review & Generate...');
  const stepTitle = await page.textContent('h1, h2, h3').catch(() => '');
  console.log(`📍 Step: ${stepTitle}`);

  // Find generate button
  const generateBtn = page.locator('button:has-text("Générer mon site"), button:has-text("Générer le site")').first();
  const btnFound = await generateBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (!btnFound) {
    await page.screenshot({ path: '/tmp/cycle17-simple-no-btn.png', fullPage: true });
    throw new Error('Generate button not found');
  }

  console.log('✅ Found generate button');
  await generateBtn.click();
  await page.waitForTimeout(3000);
  console.log('✅ Clicked generate');

  // Wait for generation
  console.log('⏳ Waiting for generation...');
  await page.waitForTimeout(15000);

  await page.screenshot({ path: '/tmp/cycle17-simple-final.png', fullPage: true });
  console.log('✅ Test completed');
});
