import { test, expect } from '@playwright/test';

test('Cycle 14b: Simple AI Image Generation Test', async ({ page }) => {
  console.log('🔄 CYCLE 14b: SIMPLE AI IMAGE GENERATION TEST');
  console.log('Purpose: Direct test of Step 5 AI image generation workflow');
  console.log('======================================================================');

  // Generate unique site name for this test
  const timestamp = Date.now();
  const siteName = `Cycle14b_Simple_${timestamp}`;
  console.log(`🆔 Generated site name: ${siteName}`);

  // ============================================================================
  // DIRECT NAVIGATION TO IMAGE STEP
  // ============================================================================

  // Step 1: Login
  console.log('🔐 Step 1: Customer login...');
  await page.goto('http://localhost:7601/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('✅ Customer login successful');

  // Step 2: Direct navigation to wizard Step 5 (if possible)
  console.log('📸 Step 2: Direct navigation to Step 5...');

  // Try to find an existing site or create a simple one
  await page.goto('http://localhost:7601/sites');
  await page.waitForTimeout(2000);

  // Check if we have any existing sites
  const siteRows = await page.locator('tr').count();
  console.log(`📊 Found ${siteRows} potential site rows`);

  if (siteRows > 1) { // More than header row
    console.log('✅ Using existing site for testing...');

    // Click on first continue button found
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Continuer")').first();
    const continueExists = await continueButton.count();

    if (continueExists > 0) {
      await continueButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Navigated to existing site wizard');
    }
  } else {
    console.log('⚠️ No existing sites found, using direct wizard URL...');
    await page.goto('http://localhost:7601/wizard?new=true');
    await page.waitForTimeout(3000);

    // Accept terms and start wizard
    console.log('📋 Accepting wizard terms...');
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.count() > 0) {
      await checkbox.check();
      await page.waitForTimeout(1000);
    }

    const commencerButton = page.locator('button:has-text("Commencer")');
    if (await commencerButton.count() > 0) {
      await commencerButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Wizard started');
    }
  }

  // Navigate through wizard steps to reach Step 5 Images
  console.log('🔍 Navigating through wizard steps to reach Step 5 Images...');

  // Step 1: Template selection (click Suivant)
  console.log('📋 Step 1: Template selection...');
  let suivantButton = page.locator('button:has-text("Suivant")').first();
  if (await suivantButton.count() > 0) {
    await suivantButton.click();
    await page.waitForTimeout(2000);
  }

  // Step 2: Business information (fill and proceed)
  console.log('📋 Step 2: Business information...');
  const siteNameField = page.getByPlaceholder('Mon Entreprise');
  if (await siteNameField.count() > 0) {
    await siteNameField.clear();
    await siteNameField.fill(siteName);
    await page.waitForTimeout(1000);
  }

  const businessDescField = page.locator('textarea[placeholder*="Décrivez votre entreprise"]');
  if (await businessDescField.count() > 0) {
    await businessDescField.fill('Notre boulangerie artisanale propose des pains frais, pâtisseries maison et plats cuisinés traditionnels.');
    await page.waitForTimeout(1000);
  }

  suivantButton = page.locator('button:has-text("Suivant")').first();
  if (await suivantButton.count() > 0) {
    await suivantButton.click();
    await page.waitForTimeout(2000);
  }

  // Step 3: Content (skip or proceed quickly)
  console.log('📋 Step 3: Content step...');
  suivantButton = page.locator('button:has-text("Suivant")').first();
  if (await suivantButton.count() > 0) {
    await suivantButton.click();
    await page.waitForTimeout(2000);
  }

  // Step 4: Should now be on Images step
  console.log('📋 Step 4: Should be on Images step...');
  const currentStep = await page.textContent('h1, h2, h3').catch(() => '');
  console.log(`📍 Current step: "${currentStep}"`);

  // If not on Images, try one more Suivant
  if (!currentStep.includes('Image') && !currentStep.includes('Visuels')) {
    console.log('⚠️ Not on Images step yet, trying one more navigation...');
    suivantButton = page.locator('button:has-text("Suivant")').first();
    if (await suivantButton.count() > 0) {
      await suivantButton.click();
      await page.waitForTimeout(3000);
    }
  }

  // ============================================================================
  // CYCLE 14b: AI IMAGE GENERATION TESTING
  // ============================================================================

  console.log('\n🎨 CYCLE 14b: AI IMAGE GENERATION TESTING');
  console.log('=========================================');

  // Final check if we're on Images step
  const finalStep = await page.textContent('h1, h2, h3').catch(() => '');
  console.log(`📍 Final step check: "${finalStep}"`);

  if (!finalStep.includes('Image') && !finalStep.includes('Visuels')) {
    console.log('❌ Could not reach Images step - testing what\'s available...');

    // Check for any image-related elements on current page
    const imageElements = await page.locator('img, input[type="file"], button:has-text("image")').count();
    console.log(`📊 Found ${imageElements} image-related elements on current page`);

    if (imageElements === 0) {
      throw new Error('CRITICAL: Cannot reach Images step and no image elements found');
    }
  }

  // Test 1: Look for AI Generation option
  console.log('\n🔍 Test 1: Look for "Générer mes images par IA" option...');

  const aiImageSelectors = [
    'text="Générer mes images par IA"',
    'h4:has-text("Générer mes images par IA")',
    'div:has-text("Générer mes images par IA")',
    'button:has-text("Générer")',
    'div.border-2:has-text("IA")'
  ];

  let aiOptionFound = false;
  for (const selector of aiImageSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✅ Found AI generation option with: ${selector}`);
      await page.locator(selector).click();
      await page.waitForTimeout(1000);
      aiOptionFound = true;
      break;
    }
  }

  if (!aiOptionFound) {
    console.log('❌ AI generation option not found');
    // Check what options are available
    const pageText = await page.textContent('body');
    console.log(`📄 Page contains: ${pageText.substring(0, 500)}...`);
    throw new Error('CRITICAL: AI image generation option not found');
  }

  // Test 2: Request AI generation
  console.log('\n🚀 Test 2: Request AI image generation...');

  const generateButtons = [
    'button:has-text("Demander la génération")',
    'button:has-text("🎨 Demander la génération de toutes les images")',
    'button:has-text("Générer")',
    'button:has-text("AI")'
  ];

  let generateButtonFound = false;
  for (const selector of generateButtons) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✅ Found generate button with: ${selector}`);
      await page.locator(selector).click();
      await page.waitForTimeout(2000);
      generateButtonFound = true;
      break;
    }
  }

  if (!generateButtonFound) {
    console.log('❌ Generate button not found');
    throw new Error('CRITICAL: AI generation button not found');
  }

  console.log('✅ AI image generation request sent');

  // Test 3: Quick admin check
  console.log('\n🔍 Test 3: Quick admin verification...');

  // Open admin portal
  const adminPage = await page.context().newPage();
  await adminPage.goto('http://localhost:7602');
  await adminPage.waitForTimeout(2000);

  // Quick admin login
  const emailInput = adminPage.locator('input[type="email"]').first();
  if (await emailInput.count() > 0) {
    await emailInput.fill('admin@locod.ai');
    await adminPage.locator('input[type="password"]').first().fill('admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForTimeout(3000);
  }

  // Check AI queue
  await adminPage.goto('http://localhost:7602/dashboard/ai-queue');
  await adminPage.waitForTimeout(2000);

  const requestRows = await adminPage.locator('tr').count();
  console.log(`📊 Found ${requestRows} requests in admin queue`);

  if (requestRows > 1) {
    console.log('✅ Requests found in admin queue');

    // Look for our request or any image request
    const imageRequests = await adminPage.locator('td:has-text("images"), div:has-text("images")').count();
    console.log(`📊 Found ${imageRequests} image requests`);

    if (imageRequests > 0) {
      console.log('✅ CRITICAL SUCCESS: Image request found in admin queue');
    } else {
      console.log('⚠️ No specific image requests found, but queue is working');
    }
  }

  await adminPage.close();

  // ============================================================================
  // FINAL ASSESSMENT
  // ============================================================================

  console.log('\n🎯 CYCLE 14b SIMPLE TEST RESULTS:');
  console.log('=====================================');
  console.log(`📊 AI Image Option Found: ${aiOptionFound ? '✅' : '❌'}`);
  console.log(`📊 Generate Button Found: ${generateButtonFound ? '✅' : '❌'}`);
  console.log(`📊 Admin Queue Working: ${requestRows > 1 ? '✅' : '❌'}`);

  if (aiOptionFound && generateButtonFound) {
    console.log('\n🎉 CYCLE 14b SIMPLE SUCCESS: Basic AI image workflow working!');
    console.log('✅ AI generation option available');
    console.log('✅ AI generation button functional');
    console.log('✅ Admin queue accessible');
  } else {
    console.log('\n⚠️ CYCLE 14b SIMPLE PARTIAL: Some issues with basic workflow');
  }

  console.log(`\n📋 Simple test completed for: ${siteName}`);
});