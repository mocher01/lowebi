import { test, expect } from '@playwright/test';

test('Cycle 14b: AI Image Generation - "Générer mes images par IA"', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes timeout
  console.log('🔄 CYCLE 14b: AI IMAGE GENERATION');
  console.log('Purpose: Complete Steps 1-13 + test AI image generation workflow');
  console.log('Variant: "Générer mes images par IA" with V1 prompt system');
  console.log('======================================================================');

  // Generate unique site name for this test
  const timestamp = Date.now();
  const siteName = `Cycle14b_${timestamp}`;
  console.log(`🆔 Generated site name: ${siteName}`);

  // ============================================================================
  // STEPS 1-13: COMPLETE CYCLE 13 WORKFLOW (FOUNDATION)
  // ============================================================================

  console.log('📋 Executing Steps 1-13 (Complete AI Content Workflow)...');

  // Step 1: Authentication
  console.log('🔐 Step 1: Authentication...');
  await page.goto('https://dev.lowebi.com/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Administrator2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('✅ Customer login successful');

  // Step 2: Navigate to My Sites
  console.log('🏠 Step 2: Navigate to My Sites...');
  await page.goto('https://dev.lowebi.com/sites');
  await page.waitForTimeout(3000);

  // Handle potential re-login
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    console.log('🔐 Re-login required...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(2000);
  }
  console.log('✅ On My Sites page');

  // Step 3: Create New Site
  console.log('➕ Step 3: Create New Site...');

  // Debug: Check what's on the page
  const pageContent = await page.textContent('body');
  console.log('📄 Page content preview:', pageContent.substring(0, 200));

  // Try different selectors for Create New Site
  const selectors = [
    'text="Create New Site"',
    'text="Créer un nouveau site"',
    'button:has-text("Create")',
    'a:has-text("Create")',
    '[href*="wizard"]',
    'a[href="/wizard?new=true"]'
  ];

  let createButtonFound = false;
  for (const selector of selectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✅ Found create button with selector: ${selector}`);
      await page.click(selector);
      createButtonFound = true;
      break;
    }
  }

  if (!createButtonFound) {
    console.log('❌ Create New Site button not found, trying direct navigation...');
    await page.goto('https://dev.lowebi.com/wizard?new=true');
  }

  await page.waitForTimeout(3000);

  // Navigate through wizard setup
  console.log('📋 Wizard setup...');
  const checkbox = page.locator('input[type="checkbox"]').first();
  const checkboxExists = await checkbox.count();
  if (checkboxExists > 0) {
    await checkbox.check();
    await page.waitForTimeout(1000);
  }

  const commencerButton = page.locator('button:has-text("Commencer")');
  const commencerExists = await commencerButton.count();
  if (commencerExists > 0) {
    await commencerButton.click();
    await page.waitForTimeout(3000);
  }
  console.log('✅ Started wizard');

  // Step 4: Navigate through wizard steps
  console.log('📋 Step 4: Navigate through wizard steps...');

  // Debug: Check what's on the page
  const wizardContent = await page.textContent('body');
  if (wizardContent.includes('Suivant')) {
    console.log('✅ Found "Suivant" button in page content');
  } else {
    console.log('❌ "Suivant" button not found in page content');
    const allButtons = await page.locator('button').allTextContents();
    console.log('Available buttons:', allButtons.join(', '));
  }

  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Step 5: Set timestamp site name in business info step
  console.log('✏️ Step 5: Modify Site Name with timestamp...');
  const siteNameField = page.getByPlaceholder('Mon Entreprise');
  await siteNameField.clear();
  await siteNameField.fill(siteName);
  await siteNameField.dispatchEvent('input');
  await siteNameField.dispatchEvent('change');
  await siteNameField.blur();
  await page.waitForTimeout(2000);
  console.log(`✅ Set site name to: ${siteName}`);

  // Fill business description for V1 theme detection
  const businessDescriptionField = page.locator('textarea[placeholder*="Décrivez votre entreprise"]');
  const testBusinessDescription = 'Notre boulangerie artisanale propose des pains frais, pâtisseries maison et plats cuisinés traditionnels. Nous utilisons uniquement des ingrédients de qualité et des recettes transmises de génération en génération.';
  await businessDescriptionField.fill(testBusinessDescription);
  console.log('📝 Business description filled (boulangerie theme for V1 detection)');

  // Step 6: Navigate to Step 4 "Contenu"
  console.log('➡️ Step 6: Navigate to Step 4 "Contenu"...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  const stepTitle = await page.textContent('h1, h2, h3').catch(() => '');
  console.log(`📍 Current step: ${stepTitle}`);

  // Step 10: Click "Générer par IA" for content
  console.log('🎨 Step 10: Request AI content generation...');
  const aiButton = page.locator('button:has-text("Générer par IA")').first();
  const aiButtonCount = await aiButton.count();

  if (aiButtonCount === 0) {
    console.log('❌ No "Générer par IA" button found - proceeding to Step 5');
  } else {
    await aiButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ AI content generation requested');

    // ============================================================================
    // STEP 11: VERIFY AI REQUEST IN ADMIN QUEUE
    // ============================================================================

    console.log('🔍 Step 11: Verify AI Request in Admin Queue...');

    // Open new page for admin portal
    const adminPage = await page.context().newPage();
    await adminPage.goto('https://admin.dev.lowebi.com');
    await adminPage.waitForTimeout(2000);

    // Admin login
    console.log('🔐 Admin login...');
    const emailSelectors = ['#email', 'input[type="email"]', 'input[name="email"]'];
    let emailFound = false;
    for (const selector of emailSelectors) {
      const count = await adminPage.locator(selector).count();
      if (count > 0) {
        await adminPage.fill(selector, 'admin@locod.ai');
        emailFound = true;
        break;
      }
    }

    const passwordSelectors = ['#password', 'input[type="password"]', 'input[name="password"]'];
    let passwordFound = false;
    for (const selector of passwordSelectors) {
      const count = await adminPage.locator(selector).count();
      if (count > 0) {
        await adminPage.fill(selector, 'admin123');
        passwordFound = true;
        break;
      }
    }

    await adminPage.click('button[type="submit"]');
    await adminPage.waitForTimeout(3000);
    console.log('✅ Admin login successful');

    // Navigate to AI queue
    await adminPage.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    await adminPage.waitForTimeout(3000);
    console.log('✅ Navigated to AI queue');

    // ============================================================================
    // STEP 12: PROCESS AI REQUEST AS EXPERT
    // ============================================================================

    console.log('🧠 Step 12: Process AI Request as Expert...');

    // Find the request row for our site
    const rows = await adminPage.locator('tr').count();
    let foundRequest = false;
    let requestProcessed = false;

    for (let i = 0; i < rows; i++) {
      const row = adminPage.locator('tr').nth(i);
      const rowText = await row.textContent();

      if (rowText && rowText.includes(siteName)) {
        console.log(`🎯 Found request for ${siteName} in row ${i}`);

        // Check if there's a "Traiter" button (needs processing)
        const traiterButton = row.locator('button:has-text("Traiter")');
        const traiterCount = await traiterButton.count();

        if (traiterCount > 0) {
          console.log('🔘 Found "Traiter" button - processing request...');
          await traiterButton.first().click();
          await adminPage.waitForTimeout(2000);

          // Generate AI result content
          const aiResult = JSON.stringify({
            hero: {
              title: "Boulangerie Artisanale Traditionnelle",
              subtitle: "Pains frais et pâtisseries maison depuis 1995",
              description: "Notre boulangerie propose des pains frais, pâtisseries maison et plats cuisinés traditionnels avec des ingrédients de qualité."
            },
            services: [
              {
                title: "Pains Artisanaux",
                description: "Pains frais cuits quotidiennement selon nos recettes traditionnelles transmises de génération en génération.",
                features: ["Pain de campagne", "Baguettes tradition", "Pains spéciaux"]
              },
              {
                title: "Pâtisseries Maison",
                description: "Délicieuses pâtisseries préparées avec soin par nos artisans boulangers-pâtissiers.",
                features: ["Croissants", "Éclairs", "Tartes aux fruits"]
              },
              {
                title: "Plats Cuisinés",
                description: "Plats traditionnels préparés avec des ingrédients frais et locaux.",
                features: ["Quiches", "Sandwichs", "Salades fraîches"]
              }
            ],
            about: {
              title: `À propos de ${siteName}`,
              subtitle: "Tradition boulangère depuis plus de 25 ans",
              description: "Notre boulangerie familiale perpétue les traditions artisanales avec passion et savoir-faire."
            }
          }, null, 2);

          // Fill the AI result textarea
          const resultTextarea = adminPage.locator('textarea[placeholder*="Collez ici"], textarea[placeholder*="Résultat"], textarea').first();
          await resultTextarea.clear();
          await resultTextarea.fill(aiResult);
          await adminPage.waitForTimeout(1000);

          // Click "Appliquer & Terminer"
          const completeButton = adminPage.locator('button:has-text("Appliquer"), button:has-text("Terminer"), button:has-text("Valider")').first();
          await completeButton.click();
          await adminPage.waitForTimeout(3000);
          console.log('✅ AI request processed successfully');

          foundRequest = true;
          requestProcessed = true;
          break;
        }
      }
    }

    await adminPage.close();

    // ============================================================================
    // STEP 13: VERIFY CONTENT PROCESSING SUCCESS (STAY IN WIZARD)
    // ============================================================================

    console.log('✅ Step 13: Content processing completed');

    // Navigate back to customer portal
    await page.goto('https://dev.lowebi.com');
    await page.waitForTimeout(2000);

    // Check if we need to re-login
    const currentPageUrl = page.url();
    if (currentPageUrl.includes('login')) {
      console.log('🔐 Re-logging into customer portal...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Administrator2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // EXACT COPY FROM CYCLE13 - Navigate back to customer portal
    await page.goto('https://dev.lowebi.com');
    await page.waitForTimeout(2000);

    // Check if we need to re-login
    const reloginCheckUrl = page.url();
    if (reloginCheckUrl.includes('login')) {
      console.log('🔐 Re-logging into customer portal...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Administrator2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // Navigate to My Sites
    console.log('🏠 Navigate to My Sites to find processed site...');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(2000);

    // Find our site by name and click Continue
    console.log(`🔍 Looking for site: ${siteName}`);
    const siteRows = await page.locator('tr').count();
    let siteFound = false;

    for (let i = 0; i < siteRows; i++) {
      const row = page.locator('tr').nth(i);
      const rowText = await row.textContent();

      if (rowText && rowText.includes(siteName)) {
        console.log(`✅ Found site ${siteName} in row ${i}`);
        console.log(`📄 Row content: "${rowText}"`);

        // Try different selectors for Continue button/link
        const continueSelectors = [
          'button:has-text("Continue")',
          'button:has-text("Continuer")',
          'a:has-text("Continue")',
          'a:has-text("Continuer")',
          '[href*="continue"]',
          'button:has-text("Voir")',
          'a:has-text("Voir")'
        ];

        let continueFound = false;
        for (const selector of continueSelectors) {
          const element = row.locator(selector);
          const count = await element.count();
          if (count > 0) {
            console.log(`🎯 Found clickable element with selector: ${selector}`);
            await element.first().click();
            await page.waitForTimeout(2000); // Wait for navigation
            continueFound = true;
            siteFound = true;
            break;
          }
        }

        if (!continueFound) {
          console.log(`⚠️ No clickable Continue element found. Checking all clickable elements...`);
          const allButtons = await row.locator('button').allTextContents();
          const allLinks = await row.locator('a').allTextContents();
          console.log(`Available buttons: ${allButtons.join(', ')}`);
          console.log(`Available links: ${allLinks.join(', ')}`);
        }

        // If we found and clicked Continue, break out of the row loop
        if (continueFound) {
          break;
        }
      }
    }

    if (!siteFound) {
      console.log(`❌ Site ${siteName} not found in My Sites!`);
      throw new Error(`Site ${siteName} not found`);
    }

    await page.waitForTimeout(3000);
    console.log('🎯 Successfully navigated to processed site via Continue button');
  }

  // ============================================================================
  // CYCLE 14b: AI IMAGE GENERATION TESTING
  // ============================================================================

  console.log('\n🎨 CYCLE 14b: AI IMAGE GENERATION TESTING');
  console.log('=========================================');

  // Navigate to Step 5 using EXACT same logic as successful steps 1-4
  console.log('➡️ Step 6: Navigate to Step 5 "Images & Logo"...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // ============================
  // CYCLE 14B: V1 IMAGE GENERATION TESTING (fixed)
  // ============================

  console.log('🎨 CYCLE 14B: V1 Image Generation Testing');

  // Find/ensure we're on Step 5 - Images
  const step5 = page.getByRole('region', { name: /images|étape\s*5/i }).first();
  // If your UI doesn't use regions/aria-labels, fall back to a title heading:
  // const step5 = page.locator('section:has(h2:has-text("Images"))').first();

  await expect(step5).toBeVisible({ timeout: 15_000 });

  // 14B.1 Select the "Générer mes images par IA" option (radio/label)
  console.log('📡 Step 14B.1: Select "Générer mes images par IA"...');

  // Preferred: testid or role
  const aiOptionLabel = step5.getByLabel(/générer mes images par ia/i).first();
  const aiOptionInput = step5.locator('input[type="radio"][value="ai-generation"], input[type="radio"][value="ai"]').first();

  // Use whichever exists:
  if (await aiOptionLabel.count()) {
    await aiOptionLabel.click();
  } else if (await aiOptionInput.count()) {
    await aiOptionInput.check();
  } else {
    // Corrected fallback: valid text engine
    await step5.getByText('Générer mes images par IA', { exact: false }).first().click();
  }

  // Assert radio really selected (defensive)
  if (await aiOptionInput.count()) {
    await expect(aiOptionInput).toBeChecked();
  }

  // Some UIs require choosing a style/template before enabling the CTA.
  // Try to select the first style card if present and not selected.
  const styleCard = step5.locator('[data-testid="style-card"]:not([aria-checked="true"])').first();
  if (await styleCard.count()) {
    await styleCard.click();
  }

  // Ensure the CTA is enabled
  const requestBtn = step5
    .getByRole('button', { name: /demander.*génération.*images|générer.*images/i })
    .first();
  await expect(requestBtn).toBeEnabled();

  // 14B.2 Click request and wait for the real network call
  console.log('🚀 Step 14B.2: Request generation + wait for API…');

  // Adjust the URL regex to your backend route
  const [req, resp] = await Promise.all([
    page.waitForRequest(/\/api\/images\/generate|\/images\/jobs/, { timeout: 30_000 }),
    page.waitForResponse((r) =>
      /\/api\/images\/generate|\/images\/jobs/.test(r.url()) && r.status() < 400
    , { timeout: 60_000 }),
    requestBtn.click(),
  ]);

  console.log(`📡 Fired: ${req.url()} → ${resp.status()}`);

  // 14B.3 Expect success UI signal (toast/badge) and resulting thumbnails
  // Adjust these selectors to your UI:
  const successToast = page.getByRole('status').filter({ hasText: /généré|envoyé|demande.*prise en compte|succès/i }).first();
  await expect(successToast).toBeVisible({ timeout: 30_000 });

  // If generation is async/queued, poll for at least one generated image/thumb
  console.log('🖼️ Waiting for at least one generated thumbnail…');
  await expect
    .poll(async () => await step5.locator('[data-testid="image-thumb"], img.thumbnail, .generated-image').count(), {
      timeout: 120_000,
      intervals: [1000, 2000, 5000],
    })
    .toBeGreaterThan(0);

  console.log('✅ 14B: Image generation requested and first thumbnail visible.');

});
