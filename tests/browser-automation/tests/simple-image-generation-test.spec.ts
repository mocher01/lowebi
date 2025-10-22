import { test, expect } from '@playwright/test';

test('Simple Image Generation to Test V1.2 Enhanced Blog Elements', async ({ page, browser }) => {
  console.log('🎨 SIMPLE IMAGE GENERATION TO TEST V1.2 ENHANCED BLOG ELEMENTS');

  const timestamp = Date.now();
  const siteName = `TestV1.2_${timestamp}`;

  // Login
  await page.goto('https://dev.lowebi.com/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');

  // Go to sites
  await page.goto('https://dev.lowebi.com/sites');

  // Find existing site with Continue button
  console.log('🔍 Looking for existing site with Continue button...');
  const rows = await page.locator('tr').count();

  for (let i = 0; i < Math.min(rows, 10); i++) {
    const row = page.locator('tr').nth(i);
    const continueButton = row.locator('button:has-text("Continue"), a:has-text("Continue")');

    if (await continueButton.count() > 0) {
      console.log(`✅ Found site with Continue button in row ${i}`);
      await continueButton.first().click();
      break;
    }
  }

  // Navigate to images step (Step 5)
  console.log('➡️ Navigate to Step 5 (Images)...');

  // Click through steps to reach images
  const nextButtons = await page.locator('button:has-text("Suivant")').count();
  if (nextButtons > 0) {
    await page.click('button:has-text("Suivant")');

    // Check if we need to continue
    const currentStep = await page.textContent('h1, h2, h3').catch(() => '');
    console.log(`Current step: ${currentStep}`);

    if (!currentStep.includes('Image') && !currentStep.includes('Logo')) {
      await page.click('button:has-text("Suivant")');
    }
  }

  // Select AI radio button
  console.log('🎨 Select "Générer mes images par IA"...');
  const aiContainer = page.locator('div').filter({ hasText: 'Générer mes images par IA' });
  const aiContainerCount = await aiContainer.count();

  if (aiContainerCount > 0) {
    await aiContainer.first().click();
    console.log('✅ Selected AI option');
  } else {
    // Try radio button directly
    const radios = page.locator('input[type="radio"]');
    const radioCount = await radios.count();
    if (radioCount >= 2) {
      await radios.nth(1).click();
      console.log('✅ Selected AI radio button');
    }
  }

  // Click generation button
  console.log('🚀 Click image generation button...');
  const buttonSelectors = [
    'button:has-text("Demander la génération de toutes les images")',
    'button:has-text("🎨 Demander la génération de toutes les images")',
    'button:has-text("Générer par IA")'
  ];

  let generated = false;
  for (const selector of buttonSelectors) {
    const button = page.locator(selector);
    if (await button.count() > 0) {
      await button.first().click();
      console.log('✅ Image generation requested');
      generated = true;
      break;
    }
  }

  if (!generated) {
    console.log('❌ No generation button found');
    return;
  }

  // Wait a bit then check admin
  console.log('⏳ Waiting 3 seconds for request to be created...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check admin queue
  const adminPage = await browser.newPage();
  await adminPage.goto('https://admin.dev.lowebi.com');
  await adminPage.fill('#email', 'admin@locod.ai');
  await adminPage.fill('#password', 'admin123');
  await adminPage.click('button[type="submit"]');

  await adminPage.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');

  // Look for the newest image request
  console.log('🔍 Looking for newest IMAGE request...');
  const adminRows = await adminPage.locator('tr').count();

  for (let i = 0; i < Math.min(adminRows, 5); i++) {
    const row = adminPage.locator('tr').nth(i);
    const rowText = await row.textContent();

    if (rowText && (rowText.includes('images') || rowText.includes('🎨'))) {
      console.log(`✅ Found IMAGE request in row ${i}`);

      const traiterButton = row.locator('button:has-text("Traiter")');
      if (await traiterButton.count() > 0) {
        console.log('🔘 Clicking "Traiter" to see V1.1 prompt...');
        await traiterButton.first().click();

        const promptContent = await adminPage.textContent('body');
        console.log('\n=== PROMPT SUGGÉRÉ V1.2 COMPLET ===');
        console.log(promptContent);
        console.log('\n=== FIN PROMPT V1.2 ===\n');

        // Analyze V1.2 enhanced blog elements
        const basicBlogElements = ['blog', 'article', 'articles'];
        const enhancedV12Elements = ['publication d\'articles', 'blog articles', 'contenu éditorial', 'articles réguliers'];

        console.log('📝 ANALYSE V1.2 ÉLÉMENTS BLOG DE BASE:');
        let foundBasicElements = 0;
        for (const element of basicBlogElements) {
          if (promptContent.toLowerCase().includes(element.toLowerCase())) {
            foundBasicElements++;
            console.log(`✅ V1.2 contient: ${element}`);
          } else {
            console.log(`❌ V1.2 manque: ${element}`);
          }
        }

        console.log('\n🚀 ANALYSE V1.2 ÉLÉMENTS AMÉLIORÉS:');
        let foundEnhancedElements = 0;
        for (const element of enhancedV12Elements) {
          if (promptContent.toLowerCase().includes(element.toLowerCase())) {
            foundEnhancedElements++;
            console.log(`✅ V1.2 enhanced contient: ${element}`);
          } else {
            console.log(`❌ V1.2 enhanced manque: ${element}`);
          }
        }

        console.log(`\n📊 V1.2 éléments blog de base: ${foundBasicElements}/${basicBlogElements.length}`);
        console.log(`📊 V1.2 éléments améliorés: ${foundEnhancedElements}/${enhancedV12Elements.length}`);

        const v12Success = (foundBasicElements >= 2 && foundEnhancedElements >= 2);
        console.log(`🎯 Prompt V1.2 ${v12Success ? 'AMÉLIORÉ ET FIXÉ ✅' : 'PAS ENCORE AMÉLIORÉ ❌'}`);

        await adminPage.close();
        return;
      }
    }
  }

  console.log('❌ Aucune nouvelle requête IMAGE trouvée');
  await adminPage.close();
});