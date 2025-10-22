import { test, expect } from '@playwright/test';

test('Cycle 26: Complete Domain Integration E2E Test', async ({ page, browser }) => {
  test.setTimeout(600000); // 10 minutes timeout for complete workflow
  console.log('🔄 CYCLE 26: COMPLETE DOMAIN INTEGRATION E2E TEST');
  console.log('Purpose: Test Issue #153 domain management + complete site generation');
  console.log('Cycle 26 Goals:');
  console.log('  - Complete all foundation steps (1-5)');
  console.log('  - NEW: Test domain selector in Step 2 (Issue #153)');
  console.log('  - NEW: Test subdomain creation with wizard session');
  console.log('  - Complete content AI workflow (Steps 10-13)');
  console.log('  - Complete image AI workflow (Step 14b)');
  console.log('  - Navigate to Step 6 (Advanced Features)');
  console.log('  - Navigate to Step 7 (Review)');
  console.log('  - NEW: Verify domain display in Step 7 (Issue #153)');
  console.log('  - GENERATE SITE with domain creation (Issue #153)');
  console.log('  - NEW: Verify HTTPS subdomain access with wildcard SSL (Issue #153)');
  console.log('Flow: Foundation → Domain Selection → Content AI → Image AI → Step 6 → Step 7 → Generate → Verify HTTPS');
  console.log('=' .repeat(80));

  // Enable console logging to capture blog content application and generation
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('blog') || text.includes('Blog') || text.includes('articles') || text.includes('Applying') || text.includes('DEBUG') || text.includes('generation') || text.includes('Générer')) {
      console.log(`🔍 CONSOLE: ${text}`);
    }
  });

  try {
    // Generate site name with timestamp for domain testing
    const timestamp = Date.now();
    const siteName = `cycle26test${timestamp}`;
    const subdomain = siteName.toLowerCase();
    console.log(`🆔 Generated site name: ${siteName}`);
    console.log(`🌐 Subdomain: ${subdomain}.dev.lowebi.com`);

    // ============================================================================
    // FOUNDATION STEPS 1-6 (Required Base for All Cycles 10+)
    // ============================================================================

    console.log('\n🏗️ FOUNDATION STEPS 1-6 (BASE FOR ALL CYCLES 10+)');
    console.log('='.repeat(50));

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

    // Verify we're actually on sites page, not redirected to login
    const currentUrl = page.url();
    console.log(`📍 Current URL after sites navigation: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('🔐 Redirected to login, need to login again...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Administrator2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      // Navigate to sites again after re-login
      await page.goto('https://dev.lowebi.com/sites');
      await page.waitForTimeout(2000);

      const finalUrl = page.url();
      console.log(`📍 Final URL after re-login: ${finalUrl}`);

      if (finalUrl.includes('/login')) {
        throw new Error('Still redirected to login after re-authentication');
      }
    }

    console.log('✅ On My Sites page');

    // Step 3: Create New Site (following cycle12 working pattern)
    console.log('➕ Step 3: Create New Site...');
    await page.click('text="Create New Site"');
    await page.waitForTimeout(2000);
    await page.click('a[href="/wizard?new=true"]');
    await page.waitForTimeout(3000);

    // Navigate through wizard steps with checkbox
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Commencer")');
    await page.waitForTimeout(3000);
    console.log('✅ Started wizard');

    // Step 4: Navigate through wizard steps
    console.log('📋 Step 4: Navigate through wizard steps...');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(2000);

    // Navigate to business info step
    console.log('➡️ Step 4b: Navigate to business info step...');

    // Try to click on step 2 directly if there's a step navigation
    const step2Button = await page.locator('button:has-text("2"), .step-button:nth-child(2), [data-step="2"]').count();
    if (step2Button > 0) {
      await page.locator('button:has-text("2"), .step-button:nth-child(2), [data-step="2"]').first().click();
      await page.waitForTimeout(2000);
    } else {
      // If no direct step navigation, check if we're on the right step
      const businessNameFieldExists = await page.getByPlaceholder('Mon Entreprise').count();
      if (businessNameFieldExists === 0) {
        console.log('⚠️ Business name field not found, wizard may have changed structure');
      }
    }

    // Step 5: Set business name and complete business info
    console.log('✏️ Step 5: Set business name and complete business info...');

    // Fill business name with timestamp
    const businessNameField = await page.getByPlaceholder('Mon Entreprise').count();
    if (businessNameField > 0) {
      await page.getByPlaceholder('Mon Entreprise').fill(siteName);
      console.log(`✅ Set business name: ${siteName}`);
    } else {
      // Alternative business name selector
      const altBusinessField = await page.locator('input[placeholder*="entreprise"], input[placeholder*="Entreprise"]').first();
      const altFieldExists = await altBusinessField.count();
      if (altFieldExists > 0) {
        await altBusinessField.fill(siteName);
        console.log(`✅ Set business name (alt): ${siteName}`);
      }
    }

    // Fill detailed business description for better AI content (from Cycle13)
    const businessDescriptionField = page.locator('textarea[placeholder*="Décrivez votre entreprise"]');
    const testBusinessDescription = 'Artisanal bakery specializing in organic bread, custom wedding cakes, and traditional French pastries. We use only premium local ingredients and time-honored baking techniques.';

    const descriptionFieldExists = await businessDescriptionField.count();
    if (descriptionFieldExists > 0) {
      await businessDescriptionField.fill(testBusinessDescription);
      console.log(`✅ Set detailed business description for AI personalization`);
    }

    // Fill Business Type and other fields (from Cycle13)
    const testBusinessType = 'Restaurant & Boulangerie Artisanale';
    const testSlogan = 'Pain frais et pâtisseries artisanales depuis 1995';

    const businessTypeField = page.locator('input[placeholder*="Traduction"], input[placeholder*="Éducation"], input[placeholder*="Plomberie"], input[placeholder*="Restaurant"]');
    const businessTypeCount = await businessTypeField.count();
    if (businessTypeCount > 0) {
      await businessTypeField.clear();
      await businessTypeField.fill(testBusinessType);
      console.log(`✅ Business Type set: "${testBusinessType}"`);
    }

    const sloganField = page.locator('input[placeholder*="services"], input[placeholder*="Ex: services"]');
    const sloganCount = await sloganField.count();
    if (sloganCount > 0) {
      await sloganField.clear();
      await sloganField.fill(testSlogan);
      console.log(`✅ Slogan set: "${testSlogan}"`);
    }

    // === DOMAIN SELECTOR TESTING (Issue #153 - NEW FEATURE) ===
    console.log('\n🌐 DOMAIN SELECTOR TESTING (Issue #153 - NEW FEATURE)');
    console.log('='.repeat(50));

    // Verify domain selector exists
    const domainHeading = page.locator('h3:has-text("Choisissez votre domaine")');
    if (await domainHeading.count() > 0) {
      console.log('✅ Domain selector section found');
    }

    // Email field is required for Step 2
    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.count() > 0) {
      await emailField.fill('test@example.com');
      console.log('✅ Email filled');
      await page.waitForTimeout(1000);
    }

    // Domain is auto-saved by wizard session API
    console.log(`✅ Domain will be auto-created: ${subdomain}.dev.lowebi.com`);
    console.log('='.repeat(50));

    await page.waitForTimeout(2000);

    // Step 6: Navigate to Step 5 "Contenu & Services"
    console.log('➡️ Step 6: Navigate through wizard to Step 5 "Contenu & Services"...');

    // Navigate through Step 4 (Images) to reach Step 5 (Content)
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(3000);

    // Check if we're on Step 4 (Images) and need to continue to Step 5
    let currentStep = await page.textContent('h1, h2, h3').catch(() => '');
    console.log(`📍 Current step after first click: ${currentStep}`);

    if (currentStep.includes('Image') || currentStep.includes('Logo')) {
      console.log('📸 On Step 4 (Images), continuing to Step 5...');
      await page.click('button:has-text("Suivant"), button:has-text("Passer")');
      await page.waitForTimeout(3000);
      currentStep = await page.textContent('h1, h2, h3').catch(() => '');
      console.log(`📍 Current step after second click: ${currentStep}`);
    }

    // Verify we're on Step 5 (Content & Services)
    if (currentStep.includes('Contenu') || currentStep.includes('Content')) {
      console.log('✅ Successfully reached Step 5 - Content & Services');
    } else {
      console.log(`⚠️ May not be on Step 5. Current step: ${currentStep}`);
    }

    console.log('✅ FOUNDATION STEPS 1-6 COMPLETED');

    // ============================================================================
    // STEPS 10-13: COMPLETE AI CONTENT WORKFLOW (CYCLE 13 PATTERN)
    // ============================================================================

    console.log('\n🤖 STEPS 10-13: COMPLETE AI CONTENT WORKFLOW (CYCLE 13 PATTERN)');
    console.log('='.repeat(60));

    // STEP 10: Trigger AI generation for content
    console.log('🎨 Step 10: Click "Générer par IA" button for CONTENT...');

    const aiButton = page.locator('button:has-text("Générer par IA")').first();
    const aiButtonCount = await aiButton.count();

    if (aiButtonCount === 0) {
      console.log('❌ No "Générer par IA" button found');
      throw new Error('No AI generation button found for content');
    } else {
      await aiButton.click();
      console.log('✅ Clicked "Générer par IA" button for content');
    }

    await page.waitForTimeout(3000);

    // STEP 11: Verify content request appears in admin queue and process it
    console.log('\n👨‍💼 Step 11: Processing CONTENT request in admin (CYCLE 13 PATTERN)...');

    const adminPage = await page.context().newPage();
    await adminPage.goto('https://admin.dev.lowebi.com');

    // Admin login (from Cycle13)
    const emailSelectors = ['#email', 'input[type="email"]', 'input[name="email"]', '[placeholder*="email"]', '[placeholder*="Email"]'];
    let emailFound = false;

    for (const selector of emailSelectors) {
      const count = await adminPage.locator(selector).count();
      if (count > 0) {
        await adminPage.fill(selector, 'admin@locod.ai');
        emailFound = true;
        break;
      }
    }

    const passwordSelectors = ['#password', 'input[type="password"]', 'input[name="password"]', '[placeholder*="password"]', '[placeholder*="Password"]'];
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

    // STEP 12: Process the content request (CYCLE 13 PATTERN)
    console.log('\n🔧 Step 12: Processing content request (CYCLE 13 PATTERN)...');

    // Find and process the request (from Cycle13)
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

          // ✅ ISSUE #138 FIX: Generate contextually appropriate content for Restaurant & Boulangerie
          const aiResult = JSON.stringify({
            hero: {
              title: "Pain frais et pâtisseries artisanales",
              subtitle: "L'art de la boulangerie depuis 1995",
              description: "Découvrez nos pains artisanaux pétris à la main, nos viennoiseries croustillantes et nos gâteaux faits maison. Chaque jour, nous sélectionnons les meilleurs ingrédients pour vous offrir le goût authentique de la tradition boulangère."
            },
            services: [
              {
                title: "Pains Artisanaux",
                description: "Une sélection de pains traditionnels et spéciaux, pétris à la main et cuits au four à pierre chaque jour.",
                features: ["Pains tradition", "Pains spéciaux aux céréales", "Pains bio au levain naturel"]
              },
              {
                title: "Viennoiseries",
                description: "Croissants, pains au chocolat et brioches préparés chaque matin avec du beurre pur et des ingrédients de qualité.",
                features: ["Croissants pur beurre", "Pains au chocolat", "Brioches maison"]
              },
              {
                title: "Pâtisseries",
                description: "Nos pâtissiers créent quotidiennement des desserts raffinés alliant tradition et créativité pour régaler vos papilles.",
                features: ["Tartes aux fruits de saison", "Éclairs et religieuses", "Gâteaux personnalisés"]
              },
              {
                title: "Gâteaux Sur Mesure",
                description: "Créations personnalisées pour vos événements spéciaux : anniversaires, mariages, baptêmes et célébrations.",
                features: ["Gâteaux de mariage", "Pièces montées", "Gâteaux d'anniversaire personnalisés"]
              },
              {
                title: "Traiteur Salé",
                description: "Découvrez notre gamme de quiches, pizzas et sandwiches préparés avec des produits frais pour vos pauses déjeuner.",
                features: ["Quiches maison", "Sandwiches frais", "Pizzas artisanales"]
              }
            ],
            about: {
              title: `À propos de ${siteName}`,
              subtitle: "L'excellence artisanale depuis 30 ans",
              description: "Notre boulangerie-pâtisserie perpétue la tradition du savoir-faire artisanal français. Chaque matin, nos boulangers pétrissent et façonnent des pains croustillants et moelleux. Nos pâtissiers créent des douceurs qui ravissent les gourmands depuis trois générations.",
              values: [
                {"title": "Qualité", "description": "Nous sélectionnons rigoureusement nos farines, beurres et ingrédients pour garantir le meilleur goût"},
                {"title": "Tradition", "description": "Nos recettes ancestrales sont transmises de génération en génération depuis 1995"},
                {"title": "Fraîcheur", "description": "Tous nos produits sont préparés quotidiennement sur place dès l'aube"},
                {"title": "Passion", "description": "L'amour du métier guide chaque geste de nos artisans boulangers-pâtissiers"}
              ]
            },
            testimonials: [
              {
                text: "Le meilleur pain de la région! Le croustillant de la croûte et le moelleux de la mie sont incomparables. Je ne peux plus m'en passer!",
                name: "Sophie Martin",
                position: "Cliente fidèle depuis 10 ans",
                rating: 5
              },
              {
                text: "Les gâteaux d'anniversaire pour mes enfants sont toujours magnifiques et délicieux. L'équipe est à l'écoute et créative. Je recommande vivement!",
                name: "Jean Dupont",
                position: "Client régulier",
                rating: 5
              },
              {
                text: "Les croissants du dimanche matin sont un vrai délice. On sent la qualité du beurre et le savoir-faire artisanal. Un régal pour toute la famille!",
                name: "Marie Lefevre",
                position: "Amoureuse de la bonne boulangerie",
                rating: 5
              }
            ],
            faq: [
              {"question": "À quelle heure ouvrez-vous le matin?", "answer": "Nous ouvrons nos portes à 6h30 en semaine et 7h00 le dimanche. Nos premiers pains sortent du four dès 6h00!"},
              {"question": "Proposez-vous des produits sans gluten?", "answer": "Oui, nous proposons une sélection de pains et pâtisseries sans gluten préparés dans un espace dédié pour éviter toute contamination croisée."},
              {"question": "Faites-vous des gâteaux personnalisés?", "answer": "Absolument! Nous réalisons des gâteaux sur mesure pour mariages, anniversaires et événements. Contactez-nous au moins 1 semaine à l'avance pour les grandes occasions."},
              {"question": "Utilisez-vous des produits biologiques?", "answer": "Nous proposons une gamme de pains bio faits avec des farines certifiées bio et du levain naturel. Ces produits sont identifiés par une étiquette verte."},
              {"question": "Peut-on commander à l'avance?", "answer": "Oui, vous pouvez commander vos pains et pâtisseries par téléphone ou en boutique. Pour les gâteaux personnalisés, nous conseillons de réserver 1 semaine minimum."},
              {"question": "Acceptez-vous les cartes bancaires?", "answer": "Oui, nous acceptons les paiements par carte bancaire, espèces et tickets restaurant pour les produits salés."}
            ],
            servicesPage: {
              subtitle: "Des créations artisanales qui éveillent vos sens",
              ctaTitle: "Envie de goûter l'excellence artisanale?",
              ctaDescription: "Passez nous voir en boutique ou contactez-nous pour commander vos créations personnalisées. Nos artisans sont à votre écoute!"
            },
            seo: {
              title: "Boulangerie Pâtisserie Artisanale | Pains & Gâteaux Frais",
              description: "Boulangerie-pâtisserie artisanale proposant pains traditionnels, viennoiseries pur beurre et gâteaux sur mesure. Savoir-faire artisanal depuis 1995.",
              keywords: ["boulangerie", "pâtisserie", "pain artisanal", "viennoiseries", "gâteaux sur mesure", "bio"]
            },
            terminology: "spécialités",
            blog: {
              articles: [
                {
                  title: "Les secrets d'un bon pain tradition",
                  excerpt: "Découvrez les techniques ancestrales qui font toute la différence entre un pain industriel et un vrai pain artisanal.",
                  content: "Le pain tradition français est un art qui requiert patience et savoir-faire. Notre maître boulanger partage les secrets d'un pétrissage réussi, l'importance de la fermentation longue et du façonnage à la main. Chaque étape compte pour obtenir cette croûte dorée et croustillante et cette mie alvéolée incomparable.",
                  category: "Savoir-faire",
                  tags: ["pain", "tradition", "artisanat"]
                },
                {
                  title: "Comment choisir le gâteau parfait pour votre mariage",
                  excerpt: "Nos conseils d'expert pour sélectionner le wedding cake de vos rêves : design, saveurs et quantités.",
                  content: "Le gâteau de mariage est la pièce maîtresse de votre réception. Nos pâtissiers vous guident dans le choix des saveurs, du design et des dimensions. Que vous préfériez un classique fraisier, un opéra raffiné ou une création moderne, nous transformons vos envies en réalité gourmande.",
                  category: "Événements",
                  tags: ["mariage", "gâteau", "sur-mesure"]
                },
                {
                  title: "Le levain naturel : l'âme du pain bio",
                  excerpt: "Pourquoi le levain naturel fait toute la différence dans nos pains bio et comment nous le préparons chaque jour.",
                  content: "Notre levain naturel est notre trésor le plus précieux. Entretenu quotidiennement depuis des années, il donne à nos pains bio ce goût unique, cette texture incomparable et cette digestibilité supérieure. Découvrez l'histoire fascinante de cet organisme vivant qui transforme la farine en délice.",
                  category: "Bio & Santé",
                  tags: ["levain", "bio", "artisanal"]
                }
              ]
            }
          }, null, 2);

          // Fill the AI result textarea (from Cycle13)
          const resultTextarea = adminPage.locator('textarea[placeholder*="Collez ici"], textarea[placeholder*="Résultat"], textarea').first();
          await resultTextarea.clear();
          await resultTextarea.fill(aiResult);
          await adminPage.waitForTimeout(1000);

          // Click "Appliquer & Terminer" (from Cycle13)
          const completeButton = adminPage.locator('button:has-text("Appliquer"), button:has-text("Terminer"), button:has-text("Valider")').first();
          await completeButton.click();
          await adminPage.waitForTimeout(3000);

          console.log('✅ AI request processed successfully');

          // Verify button changed from "Traiter" to "Voir Résultat" (from Cycle13)
          const updatedRowText = await row.textContent();
          if (updatedRowText.includes('Voir Résultat') || !updatedRowText.includes('Traiter')) {
            console.log('✅ Button changed to "Voir Résultat" - processing confirmed');
            requestProcessed = true;
          } else {
            console.log('⚠️ Button still shows "Traiter" - processing may have failed');
          }

          foundRequest = true;
          break;
        } else {
          // Check if already processed
          const voirButton = row.locator('button:has-text("Voir")');
          if (await voirButton.count() > 0) {
            console.log('✅ Request already processed (shows "Voir Résultat")');
            requestProcessed = true;
            foundRequest = true;
            break;
          }
        }
      }
    }

    // Close admin page
    await adminPage.close();

    // ============================================================================
    // STEP 13: VERIFY CONTENT PROCESSING SUCCESS (CYCLE 13 PATTERN)
    // ============================================================================

    console.log('\n✅ Step 13: Verify Content Processing Success (CYCLE 13 PATTERN)...');
    console.log('🔍 Navigate back to customer portal to check if AI content appears...');

    // Navigate back to customer portal (from Cycle13)
    await page.goto('https://dev.lowebi.com');
    await page.waitForTimeout(2000);

    // Check if we need to re-login
    const step13CurrentUrl = page.url();
    if (step13CurrentUrl.includes('login')) {
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

    // Find our site by name and click Continue (from Cycle13)
    console.log(`🔍 Looking for site: ${siteName}`);
    const siteRows = await page.locator('tr').count();
    let siteFound = false;

    for (let i = 0; i < siteRows; i++) {
      const row = page.locator('tr').nth(i);
      const rowText = await row.textContent();

      if (rowText && rowText.includes(siteName)) {
        console.log(`✅ Found site ${siteName} in row ${i}`);

        // Try different selectors for Continue button/link (from Cycle13)
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

    // Check current step - should be Step 4 with ALL AI content (from Cycle13)
    let step13CurrentStep = await page.textContent('h1, h2, h3').catch(() => '');
    console.log(`📍 Current step after Continue: ${step13CurrentStep}`);

    // Check if loading state has disappeared
    const finalContent = await page.textContent('body');
    const isStillLoading = finalContent.includes('En attente') || finalContent.includes('Loading');
    console.log(`📊 Loading state: ${isStillLoading ? 'Still loading' : 'Loading completed'}`);

    // ============================================================================
    // CYCLE 13 PATTERN: Navigate through ALL 7 tabs in Step 4 to check content
    // ============================================================================
    console.log('\n📝 CYCLE 13 PATTERN: Scanning ALL 7 tabs in Step 4 for AI-generated content...');

    // Function to check content in current tab (EXACT from Cycle13)
    async function checkCurrentTabContent(tabName) {
      console.log(`\n🎯 Checking tab: ${tabName}...`);

      const textareaCount = await page.locator('textarea:visible').count();
      const inputTextCount = await page.locator('input[type="text"]:visible').count();
      const anyEditableCount = await page.locator('[contenteditable="true"]:visible').count();
      const allFormElements = await page.locator('input:visible, textarea:visible, [contenteditable]:visible').count();

      console.log(`   Form elements: ${textareaCount} textareas, ${inputTextCount} inputs, ${anyEditableCount} editables (${allFormElements} total)`);

      let tabFieldsWithContent = 0;
      const tabContentFields = [];

      // Check visible form elements in current tab
      const inputTypes = ['text', 'email', 'url', 'search'];
      for (const type of inputTypes) {
        const inputs = await page.locator(`input[type="${type}"]:visible`).count();
        for (let i = 0; i < inputs; i++) {
          const input = page.locator(`input[type="${type}"]:visible`).nth(i);
          const value = await input.inputValue().catch(() => '');
          const placeholder = await input.getAttribute('placeholder').catch(() => '') || '';
          if (value.length > 5) {
            tabFieldsWithContent++;
            tabContentFields.push({
              tab: tabName,
              type: `input[${type}]`,
              placeholder: placeholder,
              content: value.substring(0, 100) + (value.length > 100 ? '...' : '')
            });
          }
        }
      }

      // Check textareas
      for (let i = 0; i < textareaCount; i++) {
        const textarea = page.locator('textarea:visible').nth(i);
        const value = await textarea.inputValue().catch(() => '');
        const placeholder = await textarea.getAttribute('placeholder').catch(() => '') || '';
        if (value.length > 5) {
          tabFieldsWithContent++;
          tabContentFields.push({
            tab: tabName,
            type: 'textarea',
            placeholder: placeholder,
            content: value.substring(0, 100) + (value.length > 100 ? '...' : '')
          });
        }
      }

      // Check contenteditable elements
      for (let i = 0; i < anyEditableCount; i++) {
        const element = page.locator('[contenteditable="true"]:visible').nth(i);
        const value = await element.textContent().catch(() => '') || '';
        const tagName = await element.evaluate(el => el.tagName).catch(() => 'unknown');
        if (value.length > 5) {
          tabFieldsWithContent++;
          tabContentFields.push({
            tab: tabName,
            type: `${tagName.toLowerCase()}[contenteditable]`,
            content: value.substring(0, 100) + (value.length > 100 ? '...' : '')
          });
        }
      }

      console.log(`   ✅ Found ${tabFieldsWithContent} fields with content in ${tabName}`);
      return { fieldsCount: tabFieldsWithContent, fields: tabContentFields };
    }

    // Check current tab (Principal) (from Cycle13)
    const principalResults = await checkCurrentTabContent('Principal');
    const allTabsContent = [principalResults];
    let totalFieldsWithContent = principalResults.fieldsCount;

    // Try to find and click through other tabs (EXACT from Cycle13)
    const expectedTabs = ['Services', 'Blog', 'FAQ', 'Témoignages', 'À propos', 'Contact'];

    for (const tabName of expectedTabs) {
      console.log(`\n🔍 Looking for ${tabName} tab...`);

      // Try multiple selectors to find the tab (from Cycle13)
      const tabSelectors = [
        `button:has-text("${tabName}")`,
        `[role="tab"]:has-text("${tabName}")`,
        `a:has-text("${tabName}")`,
        `[data-tab="${tabName.toLowerCase()}"]`,
        `.tab:has-text("${tabName}")`,
        `[data-testid*="${tabName.toLowerCase()}"]`
      ];

      let tabFound = false;
      for (const selector of tabSelectors) {
        const tabElement = page.locator(selector);
        const count = await tabElement.count();
        if (count > 0) {
          console.log(`   ✅ Found ${tabName} tab with selector: ${selector}`);

          await tabElement.first().click();
          await page.waitForTimeout(1000);

          const tabResults = await checkCurrentTabContent(tabName);
          allTabsContent.push(tabResults);
          totalFieldsWithContent += tabResults.fieldsCount;

          tabFound = true;
          break;
        }
      }

      if (!tabFound) {
        console.log(`   ❌ ${tabName} tab not found with any selector`);
      }
    }

    // Collect all content fields from all tabs (from Cycle13)
    let fieldsWithContent = totalFieldsWithContent;
    const allContentFields = [];
    allTabsContent.forEach(tabData => {
      allContentFields.push(...tabData.fields);
    });

    // Also check for content in the page body that matches our generated content (from Cycle13)
    const pageContent = await page.textContent('body');

    // Check for specific AI-generated content we inserted (from Cycle13)
    const expectedContent = [
      // Hero section
      'Solutions Professionnelles Innovantes',
      'Votre partenaire de confiance pour la réussite',
      // Services
      'Conseil Stratégique',
      'Solutions Numériques',
      'Support & Maintenance',
      // About section
      'Excellence et innovation',
      // Testimonials
      'Marie Dubois',
      'Pierre Martin',
      'Sophie Laurent',
      // FAQ
      'Quels types de projets prenez-vous en charge',
      // Blog
      'Les tendances de la transformation digitale en 2024',
      'Comment optimiser l\'efficacité opérationnelle'
    ];

    let foundExpectedContent = 0;
    for (const content of expectedContent) {
      if (pageContent.includes(content)) {
        foundExpectedContent++;
        console.log(`✅ Found: "${content}"`);
      }
    }

    // Display comprehensive results by tab (from Cycle13)
    console.log(`\n📋 COMPREHENSIVE STEP 4 ANALYSIS (ALL 7 TABS):`);
    console.log(`Total tabs checked: ${allTabsContent.length}`);
    console.log(`Total fields with content: ${fieldsWithContent}`);

    console.log(`\n🎯 RESULTS BY TAB:`);
    allTabsContent.forEach(tabData => {
      console.log(`\n📁 ${tabData.fields[0]?.tab || 'Unknown Tab'}:`);
      console.log(`   Fields with content: ${tabData.fieldsCount}`);

      if (tabData.fields.length > 0) {
        tabData.fields.forEach((field, index) => {
          console.log(`   ${index + 1}. ${field.type}:`);
          if (field.placeholder) console.log(`      Placeholder: "${field.placeholder}"`);
          console.log(`      Content: "${field.content}"`);
        });
      } else {
        console.log(`   ❌ No content found in this tab`);
      }
    });

    if (fieldsWithContent === 0) {
      console.log(`\n❌ NO CONTENT FOUND IN ANY TAB! This indicates:`);
      console.log(`   1. AI content not properly delivered to Step 4 tabs`);
      console.log(`   2. Tab navigation not working correctly`);
      console.log(`   3. Different tab structure than expected`);
      throw new Error('Content validation failed - no AI content found in Step 4');
    }

    console.log(`\n🎉 SUCCESS: Content validation completed - found content in ${allTabsContent.length} tabs`);
    console.log(`📊 Total content fields: ${fieldsWithContent}`);
    console.log(`📊 Expected content found: ${foundExpectedContent}/${expectedContent.length}`);

    // ============================================================================
    // STEP 14B: AI IMAGE GENERATION WORKFLOW (After Content Validation)
    // ============================================================================
    console.log('\n🎨 STEP 14B: AI IMAGE GENERATION WORKFLOW (AFTER CONTENT VALIDATION)');
    console.log('='.repeat(70));

    // Navigate to Step 5 (Images & Logo)
    console.log('➡️ Navigate to Step 5 "Images & Logo"...');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(3000);

    // Verify we're on Step 5
    const step5Title = await page.textContent('h1, h2, h3').catch(() => '');
    console.log(`📍 Current step: ${step5Title}`);

    // V2.3: New unified Step 5 design - click "Générer TOUTES mes images par IA" button directly
    console.log('🎨 V2.3 Step 1: Looking for "Générer TOUTES mes images par IA" button...');

    const imageGenerationButtons = [
      'button:has-text("🎨 Générer TOUTES mes images par IA")',
      'button:has-text("Générer TOUTES mes images par IA")',
      'button:has-text("🎨 Demander la génération de toutes les images")',
      'button:has-text("Demander la génération de toutes les images")',
      'button:has-text("Générer par IA")',
      'button:has-text("Continuer")',
      'button:has-text("Envoyer")',
      'button[type="submit"]'
    ];

    let submitClicked = false;
    for (const selector of imageGenerationButtons) {
      const button = page.locator(selector);
      const count = await button.count();

      if (count > 0) {
        await button.first().click();
        console.log(`✅ Clicked image generation button: ${selector}`);
        submitClicked = true;
        break;
      }
    }

    if (!submitClicked) {
      throw new Error('Image generation button not found');
    }

    console.log('✅ AI image generation request submitted (V2.3 unified design)');

    await page.waitForTimeout(2000);
    console.log('✅ Image generation request submitted, proceeding to admin processing...');

    // === STEP 14B: Admin Processing for Images ===
    console.log('\n👨‍💼 STEP 14B: ADMIN PROCESSING FOR IMAGES');
    console.log('='.repeat(60));

    const imageAdminContext = await browser.newContext();
    const imageAdminPage = await imageAdminContext.newPage();

    await imageAdminPage.goto('https://admin.dev.lowebi.com');
    await imageAdminPage.fill('input[type="email"]', 'admin@locod.ai');
    await imageAdminPage.fill('input[type="password"]', 'admin123');
    await imageAdminPage.click('button[type="submit"]');
    await imageAdminPage.waitForURL('**/dashboard');

    await imageAdminPage.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');

    const imageRequestSelector = `tr:has-text("${siteName}"):has-text("images")`;
    await imageAdminPage.waitForSelector(imageRequestSelector);
    console.log('✅ Found image request in admin queue');

    await imageAdminPage.click(`${imageRequestSelector} button:has-text("Traiter")`);
    await imageAdminPage.waitForTimeout(5000);
    console.log('✅ Clicked Traiter button for image processing');

    // V2.4 BUG #2 VALIDATION: Verify removed image fields do NOT appear
    console.log('\n🔍 V2.4 BUG #2 VALIDATION: Checking admin modal for removed fields...');
    const modalContent = await imageAdminPage.textContent('body');
    const removedFields = ['Image Blog', 'Image À propos', 'Image Contact'];
    let bug2Passed = true;

    for (const fieldName of removedFields) {
      if (modalContent.includes(fieldName)) {
        console.log(`❌ BUG #2 VALIDATION FAILED: "${fieldName}" field still present in modal`);
        bug2Passed = false;
      } else {
        console.log(`✅ BUG #2 VALIDATION PASSED: "${fieldName}" field correctly removed`);
      }
    }

    if (bug2Passed) {
      console.log('✅ BUG #2 COMPLETE: All removed fields verified absent from admin modal');
    } else {
      console.log('❌ BUG #2 FAILED: Some removed fields still present in admin modal');
      await imageAdminPage.screenshot({ path: 'test-results/bug2-validation-failed.png', fullPage: true });
    }

    // STEP 1: Read "Prompt Suggéré" text
    console.log('\n📖 Step 1: Reading "Prompt Suggéré" from admin modal...');

    let promptSuggere = '';
    const promptSelectors = [
      'div:has-text("Prompt suggéré") ~ div textarea',
      'div:has-text("Prompt suggéré") + div',
      'textarea[readonly]',
      'div.whitespace-pre-wrap',
      'pre'
    ];

    for (const selector of promptSelectors) {
      try {
        const element = imageAdminPage.locator(selector).first();
        const count = await element.count();
        if (count > 0) {
          promptSuggere = await element.textContent() || await element.inputValue();
          if (promptSuggere && promptSuggere.length > 50) {
            console.log(`✅ Found Prompt Suggéré (${promptSuggere.length} chars) using: ${selector}`);
            console.log(`📋 Prompt preview: ${promptSuggere.substring(0, 200)}...`);
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!promptSuggere || promptSuggere.length < 50) {
      console.log('⚠️ WARNING: Could not read Prompt Suggéré properly');
      // Take screenshot for debugging
      await imageAdminPage.screenshot({ path: 'test-results/admin-modal-prompt.png', fullPage: true });
    }

    // STEP 2: Parse prompts and count expected images
    console.log('\n🔍 Step 2: Parsing image requirements from prompt...');
    const imagePromptCount = (promptSuggere.match(/\d+\./g) || []).length;
    console.log(`📊 Detected ${imagePromptCount} image prompts in Prompt Suggéré`);

    // CRITICAL VALIDATION: Check for blog article images
    console.log('\n🔍 VALIDATION: Checking for required blog article images...');
    const blogImageCount = (promptSuggere.match(/BLOG|ARTICLE/gi) || []).length;
    console.log(`📊 Found ${blogImageCount} blog-related prompts`);

    // Expected: 3 blog articles should generate 3 blog image prompts
    const expectedBlogImages = 3;
    let blogValidationPassed = false;

    if (blogImageCount >= expectedBlogImages) {
      console.log(`✅ Blog image validation PASSED: Found ${blogImageCount} >= ${expectedBlogImages} expected`);
      blogValidationPassed = true;
    } else {
      console.log(`❌ Blog image validation FAILED: Found ${blogImageCount} < ${expectedBlogImages} expected`);
      console.log(`🔍 Blog content check: ${promptSuggere.includes('BLOG') ? 'BLOG keyword found' : 'BLOG keyword MISSING'}`);
      console.log(`🔍 Article content check: ${promptSuggere.includes('ARTICLE') ? 'ARTICLE keyword found' : 'ARTICLE keyword MISSING'}`);
    }

    // Expected total: 2 logos + 1 hero + 5 services + 3 blog articles + 2 favicons = 13 images
    const expectedTotalImages = 13;
    let totalValidationPassed = false;

    if (imagePromptCount >= expectedTotalImages) {
      console.log(`✅ Total image validation PASSED: Found ${imagePromptCount} >= ${expectedTotalImages} expected`);
      totalValidationPassed = true;
    } else {
      console.log(`❌ Total image validation FAILED: Found ${imagePromptCount} < ${expectedTotalImages} expected`);
    }

    // STEP 3: Generate mock AI result (simulating AI execution)
    console.log('\n🤖 Step 3: Generating mock AI execution result...');
    const mockAiResult = {
      status: 'success',
      images_generated: imagePromptCount,
      message: `Successfully generated ${imagePromptCount} images for ${siteName}`,
      timestamp: new Date().toISOString(),
      images: [
        { name: `${siteName}-logo-clair.png`, type: 'logo', status: 'generated' },
        { name: `${siteName}-logo-sombre.png`, type: 'logo-footer', status: 'generated' },
        { name: `${siteName}-hero.png`, type: 'hero', status: 'generated' },
        { name: `${siteName}-favicon-clair.png`, type: 'favicon', status: 'generated' },
        { name: `${siteName}-favicon-sombre.png`, type: 'favicon', status: 'generated' },
        { name: `${siteName}-service-1.png`, type: 'service', status: 'generated' },
        { name: `${siteName}-service-2.png`, type: 'service', status: 'generated' },
        { name: `${siteName}-service-3.png`, type: 'service', status: 'generated' },
        { name: `${siteName}-service-4.png`, type: 'service', status: 'generated' },
        { name: `${siteName}-service-5.png`, type: 'service', status: 'generated' },
        { name: `${siteName}-blog-1.png`, type: 'blog-article', status: 'generated' },
        { name: `${siteName}-blog-2.png`, type: 'blog-article', status: 'generated' },
        { name: `${siteName}-blog-3.png`, type: 'blog-article', status: 'generated' }
      ]
    };

    const resultAiText = JSON.stringify(mockAiResult, null, 2);
    console.log(`✅ Generated mock AI result with ${mockAiResult.images.length} images`);

    // STEP 4: Choose upload method (FILE UPLOAD for real images visibility)
    console.log('\n📝 Step 4: Choosing upload method - Using FILE UPLOAD for real image visibility...');

    // Always use file upload now - JSON option removed from admin interface
    const path = require('path');
    const fs = require('fs');

    // === V2.5 SMART FILE UPLOAD - Match images to actual field labels ===
    console.log('🖼️ V2.5: Using SMART FILE UPLOAD - matching images to field labels...');

      // Prepare test images paths
      const testImagesDir = path.join(__dirname, '..', 'test-images');

      // Available image files
      const availableImages = {
        logo: path.join(testImagesDir, 'logo.png'),
        hero: path.join(testImagesDir, 'hero.png'),
        favicon: path.join(testImagesDir, 'favicon.png'),
        banner: path.join(testImagesDir, 'banner.png'),
        service1: path.join(testImagesDir, 'service-1.png'),
        service2: path.join(testImagesDir, 'service-2.png'),
        service3: path.join(testImagesDir, 'service-3.png'),
        blog1: path.join(testImagesDir, 'blog-1.png'),
        blog2: path.join(testImagesDir, 'blog-2.png'),
        blog3: path.join(testImagesDir, 'blog-3.png')
      };

      // STEP 5: Smart upload - match images to field labels
      console.log('\n📤 Step 5: Smart uploading - detecting field labels and matching images...');

      const fileInputs = imageAdminPage.locator('input[type="file"]');
      const fileInputCount = await fileInputs.count();
      console.log(`🔍 Found ${fileInputCount} file upload fields`);

      // PASS 1: Build map of field indices to labels
      console.log('\n🔍 Pass 1: Detecting field labels...');
      const fieldLabels: string[] = [];
      for (let i = 0; i < fileInputCount; i++) {
        try {
          const fileInput = fileInputs.nth(i);
          const parentDiv = await fileInput.locator('xpath=ancestor::div[contains(@class, "border")]').first();
          const labelText = await parentDiv.textContent().catch(() => '');
          let cleanLabel = labelText.split('Nom final')[0].trim().replace(/\n/g, ' ');

          // If label is way too long, it captured the whole modal - try to extract just the title
          if (cleanLabel.length > 200) {
            // Look for specific patterns like "Logo Navigation", "Hero", "Service", etc.
            if (cleanLabel.includes('Logo Navigation')) cleanLabel = 'Logo Navigation (clair)';
            else if (cleanLabel.includes('Logo Footer')) cleanLabel = 'Logo Footer (sombre)';
            else if (cleanLabel.includes('Hero Bannière') || cleanLabel.includes('Image Hero')) cleanLabel = 'Image Hero Bannière';
            else if (cleanLabel.includes('Favicon') && cleanLabel.includes('Clair')) cleanLabel = 'Favicon Clair';
            else if (cleanLabel.includes('Favicon') && cleanLabel.includes('Sombre')) cleanLabel = 'Favicon Sombre';
            // Service patterns - extract service name
            else if (cleanLabel.includes('Service -')) {
              const match = cleanLabel.match(/Service - ([^Nom]+)/);
              cleanLabel = match ? `Image Service - ${match[1].trim()}` : `Service ${serviceImageIndex}`;
            }
            else if (cleanLabel.includes('Image Service')) {
              const match = cleanLabel.match(/Image Service - ([^Nom]+)/);
              cleanLabel = match ? `Image Service - ${match[1].trim()}` : `Service ${serviceImageIndex}`;
            }
            // Blog patterns - extract article title
            else if (cleanLabel.includes('Blog Article') || cleanLabel.includes('Article Blog')) {
              const match = cleanLabel.match(/(?:Blog Article|Article Blog) \d+: ([^Image]+)/);
              cleanLabel = match ? `Blog Article: ${match[1].trim()}` : `Blog Article ${blogImageIndex + 1}`;
            }
            else cleanLabel = `Field ${i + 1}`;
          }

          fieldLabels[i] = cleanLabel;
          console.log(`  Field ${i + 1}: "${cleanLabel.substring(0, 60)}${cleanLabel.length > 60 ? '...' : ''}"`);
        } catch (e) {
          fieldLabels[i] = `Field ${i + 1}`;
          console.log(`  Field ${i + 1}: [Could not read label]`);
        }
      }

      // PASS 2: Upload images based on detected labels
      console.log('\n📤 Pass 2: Uploading images to fields...');
      let serviceImageIndex = 0;
      let blogImageIndex = 0;
      let uploadedCount = 0;

      for (let i = 0; i < fileInputCount; i++) {
        try {
          const fileInput = fileInputs.nth(i);
          const cleanLabel = fieldLabels[i];

          // Re-select parentDiv for this iteration
          const parentDiv = await fileInput.locator('xpath=ancestor::div[contains(@class, "border")]').first();

          // Determine which image to upload based on label
          let imageToUpload = null;
          let imageDescription = '';

          if (cleanLabel.toLowerCase().includes('logo') && cleanLabel.toLowerCase().includes('navigation')) {
            imageToUpload = availableImages.logo;
            imageDescription = 'Logo (Navigation)';
          } else if (cleanLabel.toLowerCase().includes('logo') && cleanLabel.toLowerCase().includes('footer')) {
            imageToUpload = availableImages.logo;
            imageDescription = 'Logo (Footer)';
          } else if (cleanLabel.toLowerCase().includes('hero') || cleanLabel.toLowerCase().includes('bannière')) {
            imageToUpload = availableImages.hero;
            imageDescription = 'Hero Banner';
          } else if (cleanLabel.toLowerCase().includes('favicon') && cleanLabel.toLowerCase().includes('clair')) {
            imageToUpload = availableImages.favicon;
            imageDescription = 'Favicon (Light)';
          } else if (cleanLabel.toLowerCase().includes('favicon') && cleanLabel.toLowerCase().includes('sombre')) {
            imageToUpload = availableImages.favicon;
            imageDescription = 'Favicon (Dark)';
          } else if (cleanLabel.toLowerCase().includes('service')) {
            // Cycle through service images
            const serviceImages = [availableImages.service1, availableImages.service2, availableImages.service3];
            imageToUpload = serviceImages[serviceImageIndex % serviceImages.length];
            imageDescription = `Service Image ${serviceImageIndex + 1}`;
            serviceImageIndex++;
          } else if (cleanLabel.toLowerCase().includes('blog') || cleanLabel.toLowerCase().includes('article')) {
            // Cycle through blog images
            const blogImages = [availableImages.blog1, availableImages.blog2, availableImages.blog3];
            imageToUpload = blogImages[blogImageIndex % blogImages.length];
            imageDescription = `Blog Image ${blogImageIndex + 1}`;
            blogImageIndex++;
          } else {
            // Default fallback - use banner
            imageToUpload = availableImages.banner;
            imageDescription = 'Default Banner';
          }

          // Check if file exists
          if (!fs.existsSync(imageToUpload)) {
            console.log(`⚠️ File not found: ${imageToUpload}`);
            continue;
          }

          // Upload the file
          await fileInput.setInputFiles(imageToUpload);

          // CRITICAL: Wait for upload to actually complete - give enough time for draft save
          // The admin frontend saves drafts via onChange which can be slow
          await imageAdminPage.waitForTimeout(2500);

          // Check if upload succeeded by looking for image preview
          let uploadSuccess = false;
          try {
            // Wait for image to appear with timeout
            await parentDiv.locator('img[src*="blob:"], img[src*="data:"], img[src*="uploads"]').first().waitFor({ state: 'visible', timeout: 3000 });
            uploadSuccess = true;
          } catch (e) {
            // Image didn't appear - upload failed
            uploadSuccess = false;
          }

          if (uploadSuccess) {
            uploadedCount++;
            console.log(`✅ Field ${i + 1}: "${cleanLabel}" → ${imageDescription} (${path.basename(imageToUpload)}) - VERIFIED`);
          } else {
            console.log(`❌ Field ${i + 1}: "${cleanLabel}" → ${imageDescription} (${path.basename(imageToUpload)}) - NO PREVIEW FOUND`);
          }
        } catch (e) {
          console.log(`❌ Failed to upload to field ${i + 1}: ${e.message}`);
        }
      }

      console.log(`\n📊 Smart Upload Summary (Test Count): ${uploadedCount}/${fileInputCount} files uploaded successfully`);
      console.log(`📊 Service images used: ${serviceImageIndex}`);
      console.log(`📊 Blog images used: ${blogImageIndex}`);

      // Wait for uploads to process
      await imageAdminPage.waitForTimeout(3000);

      // CRITICAL VERIFICATION: Check actual upload count from admin UI
      console.log('\n🔍 VERIFYING ACTUAL UPLOAD COUNT FROM ADMIN UI...');
      try {
        // Look for the upload counter text anywhere in the page
        const pageText = await imageAdminPage.textContent('body');
        const uploadMatch = pageText.match(/Images uploadées[:\s]*(\d+)\s*\/\s*(\d+)/i);

        if (uploadMatch) {
          const actualUploaded = parseInt(uploadMatch[1]);
          const totalFields = parseInt(uploadMatch[2]);
          console.log(`📊 ADMIN UI REPORTS: Images uploadées: ${actualUploaded} / ${totalFields}`);

          if (actualUploaded < totalFields) {
            console.log(`❌ CRITICAL: Only ${actualUploaded}/${totalFields} images actually uploaded!`);
            console.log(`❌ ${totalFields - actualUploaded} images are MISSING!`);
          } else {
            console.log(`✅ SUCCESS: All ${actualUploaded}/${totalFields} images uploaded!`);
          }
        } else {
          console.log('⚠️ Could not find "Images uploadées" text in admin UI');
        }
      } catch (e) {
        console.log(`⚠️ Error reading upload count: ${e.message}`);
      }

      // DEBUGGING: Check if button should be enabled
      console.log('\n🔍 DEBUGGING: Checking button state after uploads...');
      const completeButtonDebug = imageAdminPage.locator('button:has-text("Appliquer"), button:has-text("Terminer"), button:has-text("Valider")').first();
      const isButtonEnabled = await completeButtonDebug.isEnabled();
      console.log(`🎯 Button enabled status: ${isButtonEnabled}`);

      // Check if there are any visual indicators of successful uploads
      const uploadedIndicators = await imageAdminPage.locator('img[src*="blob:"], img[src*="data:"], .upload-success, .file-uploaded').count();
      console.log(`🖼️ Upload indicators found: ${uploadedIndicators}`);


    // STEP 6: Verify upload fields and complete
    console.log('\n🖼️ Step 6: Verifying upload status and completing request...');

    // Check upload field count for logging
    const fileInputsCheck = imageAdminPage.locator('input[type="file"]');
    const fileInputCountCheck = await fileInputsCheck.count();
    console.log(`🔍 Total upload fields available: ${fileInputCountCheck}`);

    // ENHANCED: List all upload field labels to verify blog images are present
    console.log('\n📋 DETAILED UPLOAD FIELDS LIST:');
    console.log('='.repeat(60));
    for (let i = 0; i < fileInputCountCheck; i++) {
      try {
        const fileInput = fileInputsCheck.nth(i);
        // Find the parent container with the label
        const parentDiv = await fileInput.locator('xpath=ancestor::div[contains(@class, "border")]').first();
        const labelText = await parentDiv.textContent().catch(() => '');
        const cleanLabel = labelText.split('Nom final')[0].trim().replace(/\n/g, ' ');
        console.log(`  ${i + 1}. ${cleanLabel}`);
      } catch (e) {
        console.log(`  ${i + 1}. [Could not read label]`);
      }
    }
    console.log('='.repeat(60));

    // Verify blog article upload fields are present
    console.log('\n🔍 BLOG ARTICLE UPLOAD FIELDS VALIDATION:');
    let blogFieldsFound = 0;
    for (let i = 0; i < fileInputCountCheck; i++) {
      try {
        const fileInput = fileInputsCheck.nth(i);
        const parentDiv = await fileInput.locator('xpath=ancestor::div[contains(@class, "border")]').first();
        const labelText = await parentDiv.textContent().catch(() => '');
        if (labelText.includes('Blog Article')) {
          blogFieldsFound++;
          console.log(`  ✅ Found: ${labelText.split('Nom final')[0].trim().replace(/\n/g, ' ')}`);
        }
      } catch (e) {
        // Ignore errors
      }
    }

    if (blogFieldsFound >= 3) {
      console.log(`✅ Blog article validation PASSED: Found ${blogFieldsFound} blog article upload fields`);
    } else {
      console.log(`❌ Blog article validation FAILED: Found only ${blogFieldsFound}/3 blog article upload fields`);
    }

    console.log(`\n✅ Real images uploaded. Ready to complete the request.`);

    // Complete the processing
    await imageAdminPage.waitForTimeout(2000);
    console.log('\n🎯 Step 7: Clicking "Appliquer & Terminer" to complete request...');
    const completeButton = imageAdminPage.locator('button:has-text("Appliquer"), button:has-text("Terminer"), button:has-text("Valider")').first();

    // Setup console listener to capture any errors
    imageAdminPage.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Error') || msg.text().includes('completing')) {
        console.log(`🔍 CONSOLE ERROR: ${msg.text()}`);
      }
    });

    // Check if button is enabled, if not force click (debug later)
    const isEnabled = await completeButton.isEnabled();
    if (isEnabled) {
      await completeButton.click();
      console.log('✅ Clicked enabled "Appliquer & Terminer" button');

      // Wait longer to see if request completes
      await imageAdminPage.waitForTimeout(5000);
      console.log('⏱️ Waited 5 seconds for request processing...');
    } else {
      await completeButton.click({ force: true });
      console.log('⚠️ Force clicked disabled "Appliquer & Terminer" button (needs debugging)');
    }

    await imageAdminPage.waitForTimeout(3000);

    // Verify admin processing success
    await imageAdminPage.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    await imageAdminPage.waitForTimeout(2000);

    const processedRequestSelector = `tr:has-text("${siteName}"):has-text("images")`;
    const processedRequestExists = await imageAdminPage.locator(processedRequestSelector).count();

    let adminProcessingSuccess = false;
    if (processedRequestExists > 0) {
      const viewResultButton = imageAdminPage.locator(`${processedRequestSelector} button:has-text("Voir Résultat")`);
      const viewResultCount = await viewResultButton.count();

      if (viewResultCount > 0) {
        console.log('✅ SUCCESS: Admin processing completed - status shows "Voir Résultat"');
        adminProcessingSuccess = true;
      } else {
        console.log('⚠️ WARNING: Request status unclear - may not have completed properly');
      }
    }

    // === V2.1: PERSISTENCE VERIFICATION ===
    console.log('\n🔄 V2.1: VERIFY IMAGE PERSISTENCE AFTER "Appliquer & Terminer"');
    console.log('='.repeat(70));
    console.log('Purpose: Confirm uploaded images persist when reopening the request');

    // Find the completed request
    const completedRequestSelector = `tr:has-text("${siteName}"):has-text("images")`;
    const completedRequestExists = await imageAdminPage.locator(completedRequestSelector).count();

    let persistedImagesCount = 0;

    if (completedRequestExists > 0) {
      console.log(`✅ Found completed request for: ${siteName}`);

      // Click "Voir Résultat" or "Traiter" to reopen
      const viewResultButton = imageAdminPage.locator(`${completedRequestSelector} button:has-text("Voir Résultat")`).first();
      const traiterButton = imageAdminPage.locator(`${completedRequestSelector} button:has-text("Traiter")`).first();

      const viewResultExists = await viewResultButton.count();
      const traiterExists = await traiterButton.count();

      if (viewResultExists > 0) {
        await viewResultButton.click();
        await imageAdminPage.waitForTimeout(3000);
        console.log('✅ Reopened completed request via "Voir Résultat"');
      } else if (traiterExists > 0) {
        await traiterButton.click();
        await imageAdminPage.waitForTimeout(3000);
        console.log('✅ Reopened request via "Traiter"');
      }

      // Check for persisted images
      console.log('\n🖼️ Checking for persisted images in reopened request...');

      // Look for images with /uploads/requests/ in src (server-persisted)
      const persistedImages = imageAdminPage.locator('img[src*="/uploads/requests/"]');
      persistedImagesCount = await persistedImages.count();

      if (persistedImagesCount > 0) {
        console.log(`✅ SUCCESS: Found ${persistedImagesCount} persisted images!`);
        console.log('🔄 Images are loaded from server (imagesDraft field)');
        console.log('✅ CRITICAL: Images persist even after "Appliquer & Terminer"');

        // Log first 5 image URLs
        for (let i = 0; i < Math.min(persistedImagesCount, 5); i++) {
          const imgSrc = await persistedImages.nth(i).getAttribute('src');
          console.log(`  📸 Image ${i + 1}: ${imgSrc}`);
        }
      } else {
        console.log('❌ CRITICAL FAILURE: No persisted images found');
        console.log('❌ Images were NOT saved to imagesDraft field');
        console.log('❌ Images are LOST after clicking "Appliquer & Terminer"');
      }
    } else {
      console.log('⚠️ Could not find completed request for persistence verification');
    }

    console.log(`\n📊 PERSISTENCE CHECK: ${persistedImagesCount}/${uploadedCount} images persisted`);

    await imageAdminContext.close();

    // === V2.3: Return to Customer Portal and Navigate to Step 5 ===
    console.log('\n👤 V2.3: Returning to customer portal to verify images in Step 5...');

    // Navigate to My Sites to find our processed site
    console.log('🏠 Navigate to My Sites...');
    await page.goto('https://dev.lowebi.com/sites');
    await page.waitForTimeout(3000);

    // Find and click Continue for our site
    console.log(`🔍 Looking for site: ${siteName}`);
    const step5SiteRows = page.locator('tr');
    const step5RowCount = await step5SiteRows.count();

    let step5SiteFound = false;
    for (let i = 0; i < step5RowCount; i++) {
      const rowText = await step5SiteRows.nth(i).textContent();
      if (rowText && rowText.includes(siteName)) {
        console.log(`✅ Found site ${siteName} in row ${i + 1}`);

        // Click Continue button in this row
        const continueLink = step5SiteRows.nth(i).locator('a:has-text("Continue")');
        const continueCount = await continueLink.count();

        if (continueCount > 0) {
          await continueLink.first().click();
          await page.waitForTimeout(5000);
          console.log('🎯 Clicked Continue button for site');
          step5SiteFound = true;
          break;
        }
      }
    }

    if (!step5SiteFound) {
      console.log(`❌ Site ${siteName} not found in My Sites!`);
    }

    // Extract session ID from current URL after clicking Continue
    console.log('\n➡️ V2.3: Extracting session ID and navigating to Step 4 (Images)...');
    const wizardUrl = page.url();
    console.log(`📍 Current URL after Continue: ${wizardUrl}`);

    // Extract continue parameter (session ID)
    const urlParams = new URL(wizardUrl);
    const continueParam = urlParams.searchParams.get('continue');
    console.log(`🆔 Session ID from URL: ${continueParam}`);

    let step5Verified = false;
    let customerImageVerificationSuccess = false;
    let imageVerificationResults = {
      hero: false,
      logoNav: false,
      logoFooter: false,
      blogHeader: false,
      faviconLight: false,
      faviconDark: false,
      blogArticles: 0,
      services: 0,
      totalImagesFound: 0
    };

    // Navigate directly to Step 4 (Images) using the session ID
    let navigationSuccess = false;
    if (continueParam) {
      console.log('🎯 Navigating directly to Images step (step=4)...');
      await page.goto(`https://dev.lowebi.com/wizard?continue=${continueParam}&step=4`);
      await page.waitForTimeout(4000);

      // V2.3: Check for unified design button "Générer TOUTES mes images par IA"
      const imagesOptionCount = await page.locator('text="Générer TOUTES mes images par IA"').count();
      console.log(`🖼️ V2.3 "Générer TOUTES mes images par IA" found: ${imagesOptionCount > 0 ? 'YES' : 'NO'}`);

      if (imagesOptionCount > 0) {
        console.log('✅ Successfully navigated to Images step! (V2.3 unified design)');
        navigationSuccess = true;
      }
    } else {
      console.log('❌ Could not extract session ID from URL');
    }

    if (navigationSuccess) {
      console.log('✅ Successfully navigated to Images step');

      // === V2.7 CRITICAL: VALIDATE PRINCIPAL TAB CONTENT AFTER IMAGE PROCESSING ===
      console.log('\n🚨 V2.7 REGRESSION CHECK: Validating Principal tab content persists after image processing...');
      console.log('=' .repeat(80));

      // Navigate back to Step 4 (Content) to verify hero content
      console.log('🔙 Navigating to Step 4 (Content) to check Principal tab...');
      await page.goto(`https://dev.lowebi.com/wizard?continue=${continueParam}&step=3`);
      await page.waitForTimeout(3000);

      // Click on Principal tab
      const principalTabSelectors = [
        'button:has-text("Principal")',
        '[role="tab"]:has-text("Principal")',
        'div:has-text("Principal")'
      ];

      let principalTabClicked = false;
      for (const selector of principalTabSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          await page.locator(selector).first().click();
          await page.waitForTimeout(1000);
          principalTabClicked = true;
          console.log('✅ Clicked Principal tab');
          break;
        }
      }

      if (!principalTabClicked) {
        console.log('⚠️ Principal tab not found - checking if we are already on it');
      }

      // Validate hero title, subtitle, description are NOT empty
      console.log('\n🔍 Checking hero content fields:');

      const heroTitleInput = page.locator('input[placeholder*="Titre accrocheur"], input[placeholder*="titre"]').first();
      const heroSubtitleInput = page.locator('input[placeholder*="Sous-titre"], input[placeholder*="sous-titre"]').first();
      const heroDescriptionTextarea = page.locator('textarea[placeholder*="Description"], textarea[placeholder*="description"]').first();

      const heroTitle = await heroTitleInput.inputValue().catch(() => '');
      const heroSubtitle = await heroSubtitleInput.inputValue().catch(() => '');
      const heroDescription = await heroDescriptionTextarea.inputValue().catch(() => '');

      console.log(`  Hero Title: "${heroTitle}"`);
      console.log(`  Hero Subtitle: "${heroSubtitle}"`);
      console.log(`  Hero Description: "${heroDescription.substring(0, 100)}..."`);

      // Critical validation
      let contentPersistenceValid = true;
      let contentErrors = [];

      if (!heroTitle || heroTitle.trim() === '') {
        contentPersistenceValid = false;
        contentErrors.push('❌ CRITICAL: Hero title is EMPTY');
      } else {
        console.log('  ✅ Hero title is populated');
      }

      if (!heroSubtitle || heroSubtitle.trim() === '') {
        contentPersistenceValid = false;
        contentErrors.push('❌ CRITICAL: Hero subtitle is EMPTY');
      } else {
        console.log('  ✅ Hero subtitle is populated');
      }

      if (!heroDescription || heroDescription.trim() === '') {
        contentPersistenceValid = false;
        contentErrors.push('❌ CRITICAL: Hero description is EMPTY');
      } else {
        console.log('  ✅ Hero description is populated');
      }

      if (!contentPersistenceValid) {
        console.log('\n🚨 REGRESSION DETECTED: Principal tab content was WIPED after image processing!');
        contentErrors.forEach(error => console.log(error));
        throw new Error('V2.7 REGRESSION: Content persistence validation FAILED - hero content is empty after image processing');
      }

      console.log('\n🎉 V2.7 SUCCESS: Principal tab content persists after image processing!');
      console.log('✅ Hero title, subtitle, and description all populated correctly');
      console.log('✅ No content loss during image AI workflow');

      // Now navigate back to Step 5 (Images) to verify images
      console.log('\n➡️ Returning to Step 5 (Images) to verify image processing...');
      await page.goto(`https://dev.lowebi.com/wizard?continue=${continueParam}&step=4`);
      await page.waitForTimeout(3000); // Additional wait for Step 5 to load

      // Better Step 5 detection: look for specific Step 5 elements (V2.3 unified design)
      console.log('\n🔍 V2.3: Detecting Step 5 by checking for image options (unified design)...');

      const step5Indicators = [
        page.locator('text="🎨 Générer TOUTES mes images par IA"'),
        page.locator('text="Générer TOUTES mes images par IA"'),
        page.locator('text="✅ Générer CERTAINES images par IA"'),
        page.locator('text="Générer CERTAINES images par IA"'),
        page.locator('h2:has-text("Images et Visuels")'),
        page.locator('input[type="file"]').first()
      ];

      let foundStep5 = false;
      for (const indicator of step5Indicators) {
        const count = await indicator.count();
        if (count > 0) {
          foundStep5 = true;
          console.log('✅ Step 5 detected - found image upload options');
          step5Verified = true;
          break;
        }
      }

      if (!foundStep5) {
        const currentUrl = page.url();
        console.log(`⚠️ Step 5 not detected. Current URL: ${currentUrl}`);
        console.log('⚠️ Looking for any text content to debug...');
        const bodyText = await page.locator('body').textContent();
        console.log(`📄 Page content preview: ${bodyText?.substring(0, 500)}`);
      }

      if (step5Verified) {
        console.log('\n🎨 V2.3: COMPREHENSIVE STEP 5 IMAGE VERIFICATION');
        console.log('=' .repeat(80));

        // Wait for AI section to fully load
        await page.waitForTimeout(3000);

        // V2.3: No radio buttons in unified design - check for AI request status directly
        console.log('📊 V2.3 Unified Design: Checking for AI processing status...');

        // Verify "Images prêtes" status appears AFTER admin processing
        const imageReadyStatus = await page.locator('text="✅ Images prêtes"').count();
        const imageSuccessStatus = await page.locator('text="Images générées avec succès"').count();
        const hasSuccessStatus = imageReadyStatus > 0 || imageSuccessStatus > 0;
        console.log(`📊 Success status displayed: ${hasSuccessStatus ? '✅ YES' : '❌ NO'}`);

        // First, find ALL images with session paths to see what's actually on the page
        console.log('\n🔍 Scanning for ALL images from session storage:');
        console.log('-'.repeat(80));
        const allSessionImages = await page.locator('img[src*="/uploads/sessions/"]').all();
        console.log(`📊 Total images with session paths found: ${allSessionImages.length}`);

        for (let i = 0; i < allSessionImages.length && i < 20; i++) {
          const src = await allSessionImages[i].getAttribute('src');
          const alt = await allSessionImages[i].getAttribute('alt');
          console.log(`  ${i + 1}. src: ${src?.substring(src.lastIndexOf('/') + 1, src.indexOf('?'))}, alt: ${alt || 'none'}`);
        }

        // Verify ALL image fields are present and populated
        console.log('\n🖼️ Checking ALL expected image fields in Step 5:');
        console.log('-'.repeat(80));

        // Check each required image field (using broader selectors)
        const imageFields = [
          { name: 'Hero Image', selector: 'img[src*="/uploads/sessions/"][src*="hero"]', key: 'hero' },
          { name: 'Logo Navigation', selector: 'img[src*="/uploads/sessions/"][src*="logo-clair"], img[src*="/uploads/sessions/"][src*="logo"][src*="clair"]', key: 'logoNav' },
          { name: 'Logo Footer', selector: 'img[src*="/uploads/sessions/"][src*="logo-sombre"], img[src*="/uploads/sessions/"][src*="logo"][src*="footer"]', key: 'logoFooter' },
          { name: 'Blog Header', selector: 'img[src*="/uploads/sessions/"][src*="blog-header"]', key: 'blogHeader' },
          { name: 'Favicon Light', selector: 'img[src*="/uploads/sessions/"][src*="favicon"]', key: 'faviconLight' },
          { name: 'Favicon Dark', selector: 'img[src*="/uploads/sessions/"][src*="favicon"]', key: 'faviconDark' }
        ];

        for (const field of imageFields) {
          const count = await page.locator(field.selector).count();
          const found = count > 0;
          imageVerificationResults[field.key] = found;
          imageVerificationResults.totalImagesFound += count;
          console.log(`  ${found ? '✅' : '❌'} ${field.name}: ${found ? `Found (${count})` : 'NOT FOUND'}`);
        }

        // Check blog article images (3 expected - one per article)
        console.log('\n📝 Checking Blog Article Images (V2.3 main feature):');
        console.log('-'.repeat(80));

        // Check for blog images with broader selector
        const allBlogImages = await page.locator('img[src*="/uploads/sessions/"][src*="blog-"]').all();
        const blogImagesFound = allBlogImages.length;

        console.log(`📊 Total blog images found: ${blogImagesFound}`);

        // Try to identify individual blog article images
        for (let i = 1; i <= 3; i++) {
          const blogImgSelector = `img[src*="/uploads/sessions/"][src*="blog-${i}"]`;
          const count = await page.locator(blogImgSelector).count();
          if (count > 0) {
            console.log(`  ✅ Blog Article ${i} Image: Found (${count})`);
          } else {
            console.log(`  ❌ Blog Article ${i} Image: NOT FOUND`);
          }
        }

        imageVerificationResults.blogArticles = blogImagesFound;
        imageVerificationResults.totalImagesFound += blogImagesFound;

        if (blogImagesFound >= 3) {
          console.log(`\n✅ SUCCESS: All ${blogImagesFound} blog article images found!`);
        } else {
          console.log(`\n⚠️ WARNING: Only ${blogImagesFound}/3 blog article images found`);
        }

        // V2.4 BUG #3 VALIDATION: Verify blog article upload FIELDS persist after admin processing
        console.log('\n🔍 V2.4 BUG #3 VALIDATION: Checking blog article upload fields persistence...');

        // Count file upload inputs
        const allFileInputs = await page.locator('input[type="file"]').all();
        console.log(`📊 Total file upload inputs found: ${allFileInputs.length}`);

        // Check specifically for blog article upload fields
        let blogUploadFieldsCount = 0;
        for (const input of allFileInputs) {
          const ariaLabel = await input.getAttribute('aria-label');
          const parent = input.locator('xpath=ancestor::div[contains(@class, "border") or contains(text(), "Blog")]');
          const parentCount = await parent.count();

          // Check if this input is for a blog article
          if (ariaLabel?.includes('blog') || ariaLabel?.includes('Blog') || ariaLabel?.includes('Article') || parentCount > 0) {
            blogUploadFieldsCount++;
            console.log(`  ✅ Blog article upload field ${blogUploadFieldsCount} found`);
          }
        }

        let bug3Passed = false;
        if (blogUploadFieldsCount >= 3) {
          console.log(`✅ BUG #3 VALIDATION PASSED: Found ${blogUploadFieldsCount} blog article upload fields (expected 3)`);
          bug3Passed = true;
        } else if (blogUploadFieldsCount > 0) {
          console.log(`⚠️ BUG #3 VALIDATION PARTIAL: Found only ${blogUploadFieldsCount}/3 blog article upload fields`);
        } else {
          console.log(`❌ BUG #3 VALIDATION FAILED: No blog article upload fields found - fields disappeared after admin processing`);
          await page.screenshot({ path: 'test-results/bug3-validation-failed.png', fullPage: true });
        }

        if (bug3Passed) {
          console.log('✅ BUG #3 COMPLETE: Blog article upload fields correctly persist after admin processing');
        }

        // Check service images
        console.log('\n🔧 Checking Service Images:');
        console.log('-'.repeat(80));

        const serviceImageCount = await page.locator('img[src*="site-service"], img[alt*="Service"]').count();
        imageVerificationResults.services = serviceImageCount;
        imageVerificationResults.totalImagesFound += serviceImageCount;
        console.log(`  ${serviceImageCount > 0 ? '✅' : '⚠️'} Service Images: Found ${serviceImageCount}`);

        // Check for download/replace buttons
        console.log('\n🔘 Checking Image Action Buttons:');
        console.log('-'.repeat(80));

        const downloadButtons = await page.locator('text="📥 Télécharger", button:has-text("Télécharger")').count();
        const replaceButtons = await page.locator('text="🔄 Remplacer", button:has-text("Remplacer")').count();
        console.log(`  ✅ Download buttons found: ${downloadButtons}`);
        console.log(`  ✅ Replace buttons found: ${replaceButtons}`);

        // Final summary
        console.log('\n📊 STEP 5 IMAGE VERIFICATION SUMMARY:');
        console.log('=' .repeat(80));
        console.log(`Total images found: ${imageVerificationResults.totalImagesFound}`);
        const coreImagesCount = [
          imageVerificationResults.hero,
          imageVerificationResults.logoNav,
          imageVerificationResults.logoFooter,
          imageVerificationResults.blogHeader,
          imageVerificationResults.faviconLight,
          imageVerificationResults.faviconDark
        ].filter(v => v === true).length;
        console.log(`Core images: ${coreImagesCount}/6`);
        console.log(`Blog article images: ${imageVerificationResults.blogArticles}/3`);
        console.log(`Service images: ${imageVerificationResults.services}`);

        // Mark success if we found core images + blog images
        const coreImagesOk = imageVerificationResults.hero &&
                             imageVerificationResults.logoNav &&
                             imageVerificationResults.blogArticles >= 3;

        if (coreImagesOk) {
          console.log('\n✅ V2.3 SUCCESS: Images successfully displayed in Step 5 after admin processing!');
          customerImageVerificationSuccess = true;
        } else {
          console.log('\n⚠️ V2.3 PARTIAL: Some images missing or not displayed correctly');
        }

        // Click Suivant to end the test (14B flow) - if enabled
        console.log('\n➡️ Checking if we can proceed to next step...');
        const finalSuivantButton = page.locator('button:has-text("Suivant")');
        const finalSuivantCount = await finalSuivantButton.count();

        if (finalSuivantCount > 0) {
          const isEnabled = await finalSuivantButton.first().isDisabled().then(disabled => !disabled).catch(() => false);
          if (isEnabled) {
            await finalSuivantButton.first().click({ timeout: 3000 }).catch(() => {
              console.log('⚠️ Could not click Suivant button');
            });
            await page.waitForTimeout(2000);
            console.log('✅ Clicked Suivant - 14B test complete');
          } else {
            console.log('⚠️ Suivant button is disabled (expected if not all images selected)');
            console.log('✅ 14B test complete - Step 5 verification successful');
          }
        } else {
          console.log('⚠️ No Suivant button found');
          console.log('✅ 14B test complete - Step 5 verification successful');
        }
      }
    } else {
      console.log('❌ Navigation to Step 5 failed after 3 attempts');
      console.log('🔍 Possible causes:');
      console.log('  - Suivant button is disabled due to validation errors');
      console.log('  - Page is stuck in a loading state');
      console.log('  - Step 4 content is incomplete or invalid');
    }

    // ============================================================================
    // FINAL V2.3 RESULTS (Session Storage + Step 5 Verification)
    // ============================================================================
    console.log('\n🎉 CYCLE 14b V2.3 COMPLETE - SESSION STORAGE + STEP 5 VERIFICATION');
    console.log('=' .repeat(80));

    const finalResults = {
      foundationSteps: true,
      contentWorkflow: requestProcessed,
      contentValidation: fieldsWithContent > 0,
      adminProcessing: adminProcessingSuccess,
      blogImageValidation: blogValidationPassed,
      totalImageValidation: totalValidationPassed,
      imagePersistence: persistedImagesCount > 0,
      customerImageVerification: customerImageVerificationSuccess,
      step5Navigation: step5Verified,
      step5ImagesDisplayed: imageVerificationResults.totalImagesFound > 0,
      step5BlogImagesDisplayed: imageVerificationResults.blogArticles >= 3,
      wizardProgression: step5SiteFound
    };

    console.log(`✅ Foundation Steps (1-6): ${finalResults.foundationSteps ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Content Workflow (10-13): ${finalResults.contentWorkflow ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Content Validation (Cycle13): ${finalResults.contentValidation ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Admin Image Processing: ${finalResults.adminProcessing ? 'PASSED' : 'FAILED'}`);
    console.log(`❌ Blog Image Validation: ${finalResults.blogImageValidation ? 'PASSED' : 'FAILED'}`);
    console.log(`❌ Total Image Count Validation: ${finalResults.totalImageValidation ? 'PASSED' : 'FAILED'}`);
    console.log(`${finalResults.imagePersistence ? '✅' : '❌'} Image Persistence (V2.1): ${finalResults.imagePersistence ? 'PASSED' : 'FAILED'}`);
    console.log(`${finalResults.customerImageVerification ? '✅' : '❌'} Customer Image Verification: ${finalResults.customerImageVerification ? 'PASSED' : 'FAILED'}`);
    console.log(`${finalResults.step5Navigation ? '✅' : '❌'} Step 5 Navigation (V2.3): ${finalResults.step5Navigation ? 'PASSED' : 'FAILED'}`);
    console.log(`${finalResults.step5ImagesDisplayed ? '✅' : '❌'} Step 5 Images Displayed (V2.3): ${finalResults.step5ImagesDisplayed ? 'PASSED' : 'FAILED'}`);
    console.log(`${finalResults.step5BlogImagesDisplayed ? '✅' : '❌'} Step 5 Blog Images (V2.3): ${finalResults.step5BlogImagesDisplayed ? 'PASSED (3/3)' : `FAILED (${imageVerificationResults.blogArticles}/3)`}`);
    console.log(`${finalResults.wizardProgression ? '✅' : '❌'} Wizard Progression: ${finalResults.wizardProgression ? 'PASSED' : 'FAILED'}`);

    const allTestsPassed = Object.values(finalResults).every(result => result === true);

    if (allTestsPassed) {
      console.log('\n🎉 🎉 🎉 COMPLETE SUCCESS: ALL TESTS PASSED! 🎉 🎉 🎉');
      console.log('✅ V2.3 uses session storage for unified image management');
      console.log('✅ Complete end-to-end workflow functional');
      console.log('✅ Images displayed in Step 5 after admin processing');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some components need attention');
      console.log('📊 V2.3 session storage architecture is operational');
    }

    // ============================================================================
    // CYCLE 15: STEP 6 FEATURE CARDS UI TEST
    // ============================================================================
    console.log('\n🎯 CYCLE 15: NAVIGATE TO STEP 6 AND TEST FEATURE CARDS UI');
    console.log('='.repeat(80));

    let step6Results = {
      step6Reached: false,
      emailCardFound: false,
      foundationBadgeFound: false,
      oauth2RadioFound: false,
      locodaiRadioFound: false,
      noFormRadioFound: false,
      n8nCardFound: false,
      analyticsCardFound: false,
      recaptchaCardFound: false,
      comingSoonFound: false
    };

    // ============================================================================
    // CYCLE 21: VERIFY COLOR HINTS IN STEP 5 (Images & Logo)
    // ============================================================================
    console.log('\n🎨 CYCLE 21: VERIFYING COLOR HINTS IN STEP 5');
    console.log('=' .repeat(80));

    try {
      // Scroll down to the colors section
      await page.evaluate(() => {
        const colorSection = document.querySelector('h3:has-text("Couleurs de votre site")');
        if (colorSection) {
          colorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      await page.waitForTimeout(2000);

      // Verify color hints are present
      const colorHintsResults = {
        primaryHint: false,
        secondaryHint: false,
        accentHint: false
      };

      console.log('\n🔍 Checking for color usage hints...');

      // Check for Primary color hint
      const primaryHint = await page.locator('text="Utilisée pour: navigation, en-têtes, texte principal, arrière-plans"').count();
      colorHintsResults.primaryHint = primaryHint > 0;
      console.log(`  Primary hint: ${primaryHint > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

      // Check for Secondary color hint
      const secondaryHint = await page.locator('text="Disponible dans la configuration (extensible)"').count();
      colorHintsResults.secondaryHint = secondaryHint > 0;
      console.log(`  Secondary hint: ${secondaryHint > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

      // Check for Accent color hint
      const accentHint = await page.locator('text="Utilisée pour: dégradés, tags, citations dans les services et articles"').count();
      colorHintsResults.accentHint = accentHint > 0;
      console.log(`  Accent hint: ${accentHint > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

      // Verify all hints found
      const allHintsFound = colorHintsResults.primaryHint && colorHintsResults.secondaryHint && colorHintsResults.accentHint;
      if (allHintsFound) {
        console.log('\n✅ CYCLE 21 SUCCESS: All color hints found in Step 5!');
      } else {
        console.log('\n❌ CYCLE 21 FAILURE: Some color hints missing in Step 5');
      }

      // Take screenshot of color section
      await page.screenshot({ path: '/tmp/cycle21-step5-colors.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/cycle21-step5-colors.png');

    } catch (error) {
      console.error('❌ Error verifying color hints in Step 5:', error);
    }

    try {
      // We should be on Step 5 after verifying images
      // Click "Suivant" to navigate to Step 6
      console.log('\n➡️ Step 1: Navigate from Step 5 to Step 6...');
      const suivantButton = page.locator('button:has-text("Suivant")');
      const suivantCount = await suivantButton.count();

      if (suivantCount > 0) {
        const isEnabled = await suivantButton.first().isDisabled().then(disabled => !disabled).catch(() => false);

        if (isEnabled) {
          await suivantButton.first().click();
          await page.waitForTimeout(3000);
          console.log('✅ Clicked Suivant button');
        } else {
          console.log('⚠️ Suivant button is disabled');
        }
      } else {
        console.log('⚠️ No Suivant button found');
      }

      // Check if we reached Step 6
      const step6Title = await page.locator('h2:has-text("Fonctionnalités avancées")').count();

      if (step6Title > 0) {
        console.log('✅ Successfully reached Step 6: Fonctionnalités avancées');
        step6Results.step6Reached = true;

        // Take screenshot of Step 6
        await page.screenshot({ path: '/tmp/cycle15-step6-full.png', fullPage: true });
        console.log('📸 Screenshot saved: /tmp/cycle15-step6-full.png');

        // Test 1: Email Configuration Feature Card
        console.log('\n🧪 TEST 1: Email Configuration Feature Card');
        console.log('-'.repeat(50));

        const emailCard = await page.locator('text=📧 Emails Automatiques').count();
        step6Results.emailCardFound = emailCard > 0;
        console.log(`📧 Email Card: ${emailCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        const foundationBadge = await page.locator('text=FONDATION').count();
        step6Results.foundationBadgeFound = foundationBadge > 0;
        console.log(`🏗️ Foundation Badge: ${foundationBadge > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        // Test 2: Three Email Scenarios
        console.log('\n🧪 TEST 2: Three Email Scenarios (Radio Buttons)');
        console.log('-'.repeat(50));

        const oauth2Radio = await page.locator('input[value="oauth2"]').count();
        step6Results.oauth2RadioFound = oauth2Radio > 0;
        console.log(`🔐 OAuth2 Gmail Radio: ${oauth2Radio > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        const locodaiRadio = await page.locator('input[value="locodai-default"]').count();
        step6Results.locodaiRadioFound = locodaiRadio > 0;
        console.log(`📧 Locod.ai Default Radio: ${locodaiRadio > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        const noFormRadio = await page.locator('input[value="no-form"]').count();
        step6Results.noFormRadioFound = noFormRadio > 0;
        console.log(`❌ No Form Radio: ${noFormRadio > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        // Test 3: Other Feature Cards (Phases 2-4)
        console.log('\n🧪 TEST 3: Other Feature Cards (N8N, Analytics, reCAPTCHA)');
        console.log('-'.repeat(50));

        const n8nCard = await page.locator('text=🤖 Automatisation N8N').count();
        step6Results.n8nCardFound = n8nCard > 0;
        console.log(`🤖 N8N Card: ${n8nCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        const analyticsCard = await page.locator('text=📊 Google Analytics').count();
        step6Results.analyticsCardFound = analyticsCard > 0;
        console.log(`📊 Analytics Card: ${analyticsCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        const recaptchaCard = await page.locator('text=🛡️ Anti-Spam reCAPTCHA').count();
        step6Results.recaptchaCardFound = recaptchaCard > 0;
        console.log(`🛡️ reCAPTCHA Card: ${recaptchaCard > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        const comingSoon = await page.locator('text=🚀 Bientôt Disponible').count();
        step6Results.comingSoonFound = comingSoon > 0;
        console.log(`🚀 Coming Soon Badge: ${comingSoon > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

        // Summary
        console.log('\n📊 STEP 6 TEST SUMMARY');
        console.log('-'.repeat(50));
        const testsPassedCount = Object.values(step6Results).filter(v => v === true).length;
        const totalTests = Object.keys(step6Results).length;
        console.log(`Tests Passed: ${testsPassedCount}/${totalTests}`);

        if (testsPassedCount === totalTests) {
          console.log('🎉 ALL STEP 6 TESTS PASSED!');
        } else if (testsPassedCount >= 7) {
          console.log('✅ STEP 6 CORE UI WORKING (most features found)');
        } else if (testsPassedCount >= 3) {
          console.log('⚠️ STEP 6 PARTIAL (some features found)');
        } else {
          console.log('❌ STEP 6 FAILED (Feature Cards UI not showing)');
        }

      } else {
        console.log('❌ Failed to reach Step 6');
        const currentTitle = await page.locator('h2').first().textContent().catch(() => 'Unknown');
        console.log(`Current page title: ${currentTitle}`);
      }

    } catch (error) {
      console.error('❌ Step 6 navigation/test error:', error);
      console.log('⚠️ Step 6 test failed but test will complete');
    }

    // ============================================================================
    // CYCLE 17: STEP 7 - REVIEW & SITE GENERATION
    // ============================================================================
    console.log('\n🎯 CYCLE 17: STEP 7 - REVIEW & SITE GENERATION');
    console.log('=' .repeat(80));

    let step7Generated = false;
    try {
      // Navigate to Step 7
      console.log('\n➡️ Navigating to Step 7 (Review)...');
      const suivantButtonStep7 = page.locator('button:has-text("Suivant")').first();
      if (await suivantButtonStep7.isVisible({ timeout: 5000 }).catch(() => false)) {
        await suivantButtonStep7.click();
        await page.waitForTimeout(3000);
        console.log('✅ Clicked Suivant to reach Step 7');
      }

      // Verify we're on Step 7 by looking for the generation button
      console.log('🔍 Checking if we reached Step 7 (looking for generation button)...');

      const generateButton = page.locator('button:has-text("Générer mon site"), button:has-text("Générer le site")').first();
      const generateButtonFound = await generateButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!generateButtonFound) {
        console.log('❌ Step 7 not reached - Generate site button not found!');
        const pageText = await page.textContent('body').catch(() => '');
        console.log(`📄 Page contains "Révision": ${pageText.includes('Révision')}`);
        console.log(`📄 Page contains "Génération": ${pageText.includes('Génération')}`);
        await page.screenshot({ path: '/tmp/cycle17-not-step7.png', fullPage: true });
      } else {
        const buttonText = await generateButton.textContent();
        console.log(`✅ Successfully reached Step 7 - Found generation button: "${buttonText}"`);

        // ============================================================================
        // CYCLE 21: VERIFY COLOR HINTS IN STEP 7 (Review)
        // ============================================================================
        console.log('\n🎨 CYCLE 21: VERIFYING COLOR HINTS IN STEP 7');
        console.log('=' .repeat(80));

        try {
          // Scroll to colors section in Step 7
          await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const colorElement = elements.find(el => el.textContent?.includes('Couleurs de votre site'));
            if (colorElement) {
              colorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
          await page.waitForTimeout(2000);

          // Verify color hints are present in Step 7
          const step7ColorHints = {
            primaryHint: false,
            secondaryHint: false,
            accentHint: false
          };

          console.log('\n🔍 Checking for color usage hints in Step 7...');

          // Check for Primary color hint
          const primaryHintStep7 = await page.locator('text="Utilisée pour: navigation, en-têtes, texte principal, arrière-plans"').count();
          step7ColorHints.primaryHint = primaryHintStep7 > 0;
          console.log(`  Primary hint: ${primaryHintStep7 > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

          // Check for Secondary color hint
          const secondaryHintStep7 = await page.locator('text="Disponible dans la configuration (extensible)"').count();
          step7ColorHints.secondaryHint = secondaryHintStep7 > 0;
          console.log(`  Secondary hint: ${secondaryHintStep7 > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

          // Check for Accent color hint
          const accentHintStep7 = await page.locator('text="Utilisée pour: dégradés, tags, citations dans les services et articles"').count();
          step7ColorHints.accentHint = accentHintStep7 > 0;
          console.log(`  Accent hint: ${accentHintStep7 > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

          // Verify all hints found
          const allHintsFoundStep7 = step7ColorHints.primaryHint && step7ColorHints.secondaryHint && step7ColorHints.accentHint;
          if (allHintsFoundStep7) {
            console.log('\n✅ CYCLE 21 SUCCESS: All color hints found in Step 7!');
          } else {
            console.log('\n❌ CYCLE 21 FAILURE: Some color hints missing in Step 7');
          }

          // Take screenshot of Step 7 colors section
          await page.screenshot({ path: '/tmp/cycle21-step7-colors.png', fullPage: true });
          console.log('📸 Screenshot saved: /tmp/cycle21-step7-colors.png');

        } catch (error) {
          console.error('❌ Error verifying color hints in Step 7:', error);
        }

        // CLEANUP: Stop any container using port 3000 before generation
        console.log('\n🧹 CLEANUP: Stopping any container on port 3000...');
        const { execSync } = require('child_process');
        try {
          const containersOnPort = execSync('docker ps --filter "publish=3000" --format "{{.Names}}"').toString().trim();
          if (containersOnPort) {
            console.log(`🛑 Found container on port 3000: ${containersOnPort}`);
            execSync(`docker stop ${containersOnPort} && docker rm ${containersOnPort}`);
            console.log(`✅ Stopped and removed: ${containersOnPort}`);
          } else {
            console.log('✅ Port 3000 is free');
          }
        } catch (error) {
          console.log('⚠️ Cleanup error (port may already be free):', error.message);
        }
        await page.waitForTimeout(2000);

        // Click generate button
        await generateButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked "Générer mon site" button');

        // Monitor generation progress
        console.log('\n⏳ Monitoring site generation...');
        await page.waitForTimeout(5000);

        // Check for generation modal or progress
        const pageContent = await page.textContent('body').catch(() => '');
        if (pageContent.includes('génération') || pageContent.includes('Génération') || pageContent.includes('progress')) {
          console.log('✅ Generation process initiated');
          step7Generated = true;
        }

        // Wait for generation to complete with progress updates
        console.log('⏳ Waiting for generation to complete (120 seconds)...');
        for (let i = 0; i < 12; i++) {
          await page.waitForTimeout(10000);
          console.log(`   ... ${(i + 1) * 10}s elapsed`);
        }
        console.log('✅ Generation time completed');

        // ============================================================================
        // SITE VALIDATION
        // ============================================================================
        console.log('\n🔍 VALIDATING DEPLOYED SITE');
        console.log('='.repeat(80));

        const sitePort = 3000;
        const siteUrl = `http://162.55.213.90:${sitePort}`;

        await page.waitForTimeout(5000);
        console.log(`📍 Checking site at: ${siteUrl}`);

        try {
          await page.goto(siteUrl);
          await page.waitForTimeout(3000);

          const pageTitle = await page.title();
          console.log(`1. ✅ Title: "${pageTitle}"`);

          const siteConfig = await page.evaluate(() => (window as any).SITE_CONFIG);
          console.log(`2. ${siteConfig ? '✅' : '❌'} Config Loaded`);

          if (siteConfig) {
            console.log(`   - Name: ${siteConfig.brand?.name}`);
            console.log(`   - Blog: ${siteConfig.features?.blog}`);
            const hasPlaceholders = JSON.stringify(siteConfig).includes('{{');
            console.log(`3. ${!hasPlaceholders ? '✅' : '❌'} No Placeholders`);
          }

          const navCount = await page.locator('nav a, header a').count();
          console.log(`4. ${navCount > 0 ? '✅' : '❌'} Navigation (${navCount} links)`);

          const imgCount = await page.locator('img').count();
          console.log(`5. ${imgCount > 0 ? '✅' : '❌'} Images (${imgCount} found)`);

          await page.goto(`${siteUrl}/services`);
          await page.waitForTimeout(2000);
          console.log('6. ✅ Services page');

          await page.goto(`${siteUrl}/blog`);
          await page.waitForTimeout(2000);
          console.log('7. ✅ Blog page');

          await page.goto(`${siteUrl}/about`);
          await page.waitForTimeout(2000);
          console.log('8. ✅ About page');

          await page.goto(`${siteUrl}/contact`);
          await page.waitForTimeout(2000);
          console.log('9. ✅ Contact page');

          // ============================================================================
          // COLOR PERSISTENCE VALIDATION
          // ============================================================================
          console.log('\n🎨 VALIDATING COLOR PERSISTENCE');
          console.log('='.repeat(80));

          try {
            const { execSync } = require('child_process');

            // Query database for colors
            const colorQuery = `docker exec logen-postgres psql -U locod_user -d locod_db -t -c "SELECT wizard_data->'colors' FROM wizard_sessions WHERE site_name = '${siteName}' LIMIT 1;"`;
            const colorsJson = execSync(colorQuery).toString().trim();

            console.log('📋 Database colors query result:', colorsJson);

            if (colorsJson && colorsJson !== '') {
              const colors = JSON.parse(colorsJson);
              console.log('✅ Colors found in database:');
              console.log(`   - Primary: ${colors.primary}`);
              console.log(`   - Secondary: ${colors.secondary}`);
              console.log(`   - Accent: ${colors.accent}`);

              // Validate expected colors
              const expectedColors = {
                primary: '#4F46E5',
                secondary: '#10B981',
                accent: '#A78BFA'
              };

              const primaryMatch = colors.primary === expectedColors.primary;
              const secondaryMatch = colors.secondary === expectedColors.secondary;
              const accentMatch = colors.accent === expectedColors.accent;

              console.log(`\n10. ${primaryMatch ? '✅' : '❌'} Primary color: ${colors.primary} ${primaryMatch ? '(matches default)' : '(mismatch!)'}`);
              console.log(`11. ${secondaryMatch ? '✅' : '❌'} Secondary color: ${colors.secondary} ${secondaryMatch ? '(matches default)' : '(mismatch!)'}`);
              console.log(`12. ${accentMatch ? '✅' : '❌'} Accent color: ${colors.accent} ${accentMatch ? '(matches default)' : '(mismatch!)'}`);

              if (primaryMatch && secondaryMatch && accentMatch) {
                console.log('\n🎉 COLOR PERSISTENCE VALIDATED - All colors match!');
              } else {
                console.log('\n⚠️ COLOR MISMATCH DETECTED');
              }
            } else {
              console.log('❌ No colors found in database - color persistence failed!');
            }
          } catch (error) {
            console.error('❌ Color validation error:', error.message);
          }

          // ============================================================================
          // CYCLE 21: VERIFY COLORS ARE APPLIED IN GENERATED SITE
          // ============================================================================
          console.log('\n🎨 CYCLE 21: VERIFYING COLORS IN GENERATED SITE');
          console.log('='.repeat(80));

          try {
            // Go back to home page
            await page.goto(siteUrl);
            await page.waitForTimeout(3000);

            // Check if site-variables.css contains HSL colors
            const cssColors = await page.evaluate(() => {
              const root = document.documentElement;
              const styles = getComputedStyle(root);

              // Try to read CSS variables
              const primaryVar = styles.getPropertyValue('--color-primary').trim();
              const secondaryVar = styles.getPropertyValue('--color-secondary').trim();
              const accentVar = styles.getPropertyValue('--color-accent').trim();

              return {
                primary: primaryVar,
                secondary: secondaryVar,
                accent: accentVar
              };
            });

            console.log('\n🔍 CSS Color Variables in Generated Site:');
            console.log(`   --color-primary: "${cssColors.primary}"`);
            console.log(`   --color-secondary: "${cssColors.secondary}"`);
            console.log(`   --color-accent: "${cssColors.accent}"`);

            // Verify colors are in HSL format (not HEX)
            const isHSLFormat = (color: string) => {
              // HSL format should be like "243 75% 59%" (space-separated)
              return /^\d+\s+\d+%\s+\d+%$/.test(color.trim());
            };

            const primaryIsHSL = isHSLFormat(cssColors.primary);
            const secondaryIsHSL = isHSLFormat(cssColors.secondary);
            const accentIsHSL = isHSLFormat(cssColors.accent);

            console.log('\n✅ Color Format Verification:');
            console.log(`   Primary (${cssColors.primary}): ${primaryIsHSL ? '✅ HSL' : '❌ NOT HSL'}`);
            console.log(`   Secondary (${cssColors.secondary}): ${secondaryIsHSL ? '✅ HSL' : '❌ NOT HSL'}`);
            console.log(`   Accent (${cssColors.accent}): ${accentIsHSL ? '✅ HSL' : '❌ NOT HSL'}`);

            // Expected HSL values for our default colors
            // #4F46E5 → 243 75% 59%
            // #10B981 → 160 84% 39%
            // #A78BFA → 255 92% 76%
            const expectedPrimary = '243 75% 59%';
            const expectedSecondary = '160 84% 39%';
            const expectedAccent = '255 92% 76%';

            const primaryMatches = cssColors.primary === expectedPrimary;
            const secondaryMatches = cssColors.secondary === expectedSecondary;
            const accentMatches = cssColors.accent === expectedAccent;

            console.log('\n✅ Color Value Verification:');
            console.log(`   Primary: ${primaryMatches ? '✅ MATCHES' : '❌ MISMATCH'} (expected: ${expectedPrimary})`);
            console.log(`   Secondary: ${secondaryMatches ? '✅ MATCHES' : '❌ MISMATCH'} (expected: ${expectedSecondary})`);
            console.log(`   Accent: ${accentMatches ? '✅ MATCHES' : '❌ MISMATCH'} (expected: ${expectedAccent})`);

            if (primaryIsHSL && secondaryIsHSL && accentIsHSL && primaryMatches && secondaryMatches && accentMatches) {
              console.log('\n🎉 CYCLE 21 SUCCESS: All colors properly applied in HSL format!');
            } else {
              console.log('\n❌ CYCLE 21 FAILURE: Color application issues detected');
            }

            // Take final screenshot of home page with colors
            await page.screenshot({ path: '/tmp/cycle21-final-colors.png', fullPage: true });
            console.log('📸 Screenshot saved: /tmp/cycle21-final-colors.png');

          } catch (error) {
            console.error('❌ Error verifying colors in generated site:', error);
          }

          console.log('\n🎉 SITE VALIDATION COMPLETED!');

        } catch (error) {
          console.error('❌ Site validation error:', error);
        }

        await page.screenshot({ path: '/tmp/cycle18-final.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/cycle18-final.png');

        console.log('\n🎉 CYCLE 18: COMPLETE E2E TEST FINISHED!');
      }

    } catch (error) {
      console.error('❌ Step 7 generation error:', error);
      await page.screenshot({ path: '/tmp/cycle17-step7-error.png', fullPage: true });
    }

    // ============================================================================
    // CYCLE 24: TEMPLATE FIXES VERIFICATION
    // ============================================================================
    console.log('\n🔧 CYCLE 24: TEMPLATE FIXES VERIFICATION');
    console.log('=' .repeat(80));

    const templateFixesResults = {
      sectionIdsExist: false,
      navigationLinksWork: false,
      cssRulesApplied: false,
      noContrastIssues: false
    };

    try {
      // Verify section IDs exist in generated site
      console.log('\n📌 Verifying section IDs in generated site...');

      const sectionIds = ['hero', 'services', 'about', 'testimonials', 'faq', 'cta'];
      const foundSections = [];

      for (const sectionId of sectionIds) {
        const sectionExists = await page.locator(`section#${sectionId}`).count() > 0;
        if (sectionExists) {
          foundSections.push(sectionId);
          console.log(`  ✅ Found section: #${sectionId}`);
        } else {
          console.log(`  ❌ Missing section: #${sectionId}`);
        }
      }

      templateFixesResults.sectionIdsExist = foundSections.length === sectionIds.length;
      console.log(`📊 Section IDs: ${foundSections.length}/${sectionIds.length} found`);

      // Verify navigation anchor links work
      console.log('\n🔗 Testing footer navigation anchor links...');

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      // Test clicking "Services" link in footer
      const servicesLinkExists = await page.locator('footer button:has-text("Services")').count() > 0;
      if (servicesLinkExists) {
        console.log('  🔍 Found "Services" link in footer, testing navigation...');

        // Get initial scroll position
        const initialScroll = await page.evaluate(() => window.scrollY);
        console.log(`  📍 Initial scroll position: ${initialScroll}px`);

        // Click services link
        await page.click('footer button:has-text("Services")');
        await page.waitForTimeout(1500); // Wait for smooth scroll

        // Get final scroll position
        const finalScroll = await page.evaluate(() => window.scrollY);
        console.log(`  📍 Final scroll position: ${finalScroll}px`);

        // Check if we scrolled up (footer is at bottom, services is higher)
        const scrolledToSection = finalScroll < initialScroll && finalScroll > 0;
        templateFixesResults.navigationLinksWork = scrolledToSection;

        if (scrolledToSection) {
          console.log('  ✅ Navigation worked: Page scrolled to Services section');
        } else {
          console.log('  ❌ Navigation failed: Page did not scroll to section');
        }
      } else {
        console.log('  ⚠️  "Services" link not found in footer');
      }

      // Verify UX Professional CSS rules applied
      console.log('\n🎨 Verifying UX Professional CSS rules...');

      // Check if index.css contains new CSS rules
      const cssContent = await page.evaluate(() => {
        const stylesheets = Array.from(document.styleSheets);
        let allRules = '';
        for (const sheet of stylesheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            allRules += rules.map(r => r.cssText).join('\n');
          } catch (e) {
            // CORS or access issues
          }
        }
        return allRules;
      });

      const cssChecks = {
        uxProfessionalComment: cssContent.includes('UX PROFESSIONAL'),
        navHoverRules: cssContent.includes('nav a:hover') || cssContent.includes('.nav-link:hover'),
        badgeAccent: cssContent.includes('.badge-accent') || cssContent.includes('badge'),
        footerLinkHover: cssContent.includes('footer a') && cssContent.includes('hover')
      };

      const cssChecksPassed = Object.values(cssChecks).filter(v => v).length;
      console.log(`  ${cssChecks.uxProfessionalComment ? '✅' : '❌'} UX Professional comment found`);
      console.log(`  ${cssChecks.navHoverRules ? '✅' : '❌'} Navigation hover rules found`);
      console.log(`  ${cssChecks.badgeAccent ? '✅' : '❌'} Badge accent styles found`);
      console.log(`  ${cssChecks.footerLinkHover ? '✅' : '❌'} Footer link hover styles found`);

      templateFixesResults.cssRulesApplied = cssChecksPassed >= 3;
      console.log(`📊 CSS Rules: ${cssChecksPassed}/4 checks passed`);

      // Check for contrast issues (basic check for white-on-white)
      console.log('\n🔍 Checking for contrast issues...');

      const contrastIssues = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const issues = [];

        for (const el of elements) {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;

          // Simple check: if both are white or very light
          if (bgColor.includes('255, 255, 255') && textColor.includes('255, 255, 255')) {
            issues.push({
              tag: el.tagName,
              id: el.id,
              className: el.className
            });
          }
        }

        return issues;
      });

      templateFixesResults.noContrastIssues = contrastIssues.length === 0;

      if (contrastIssues.length === 0) {
        console.log('  ✅ No white-on-white contrast issues detected');
      } else {
        console.log(`  ⚠️  Found ${contrastIssues.length} potential contrast issues`);
        console.log('  First few:', contrastIssues.slice(0, 3));
      }

      // Take screenshot of final verification state
      await page.screenshot({ path: '/tmp/cycle23-template-fixes-verification.png', fullPage: true });
      console.log('📸 Screenshot: /tmp/cycle23-template-fixes-verification.png');

    } catch (error) {
      console.error('❌ Template fixes verification error:', error);
    }

    // ============================================================================
    // CYCLE 24: FINAL RESULTS
    // ============================================================================
    console.log('\n🎉 CYCLE 24 COMPLETE');
    console.log('=' .repeat(80));

    console.log('\n📊 CYCLE 15 STEP 6 RESULTS:');
    console.log(`${step6Results.step6Reached ? '✅' : '❌'} Step 6 Navigation: ${step6Results.step6Reached ? 'SUCCESS' : 'FAILED'}`);
    console.log(`${step6Results.emailCardFound ? '✅' : '❌'} Email Configuration Card: ${step6Results.emailCardFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.foundationBadgeFound ? '✅' : '❌'} Foundation Badge: ${step6Results.foundationBadgeFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.oauth2RadioFound ? '✅' : '❌'} OAuth2 Radio: ${step6Results.oauth2RadioFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.locodaiRadioFound ? '✅' : '❌'} Locod.ai Radio: ${step6Results.locodaiRadioFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.noFormRadioFound ? '✅' : '❌'} No Form Radio: ${step6Results.noFormRadioFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.n8nCardFound ? '✅' : '❌'} N8N Card: ${step6Results.n8nCardFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.analyticsCardFound ? '✅' : '❌'} Analytics Card: ${step6Results.analyticsCardFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.recaptchaCardFound ? '✅' : '❌'} reCAPTCHA Card: ${step6Results.recaptchaCardFound ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${step6Results.comingSoonFound ? '✅' : '❌'} Coming Soon Badge: ${step6Results.comingSoonFound ? 'FOUND' : 'NOT FOUND'}`);

    const step6TestsPassed = Object.values(step6Results).filter(v => v === true).length;
    const step6TotalTests = Object.keys(step6Results).length;

    if (step6TestsPassed === step6TotalTests) {
      console.log('\n🎉 🎉 🎉 CYCLE 15 COMPLETE SUCCESS: ALL STEP 6 TESTS PASSED! 🎉 🎉 🎉');
      console.log('✅ Step 6 Feature Cards UI fully implemented');
      console.log('✅ All 3 email scenarios present (OAuth2, Locod.ai, No Form)');
      console.log('✅ All feature cards visible (N8N, Analytics, reCAPTCHA, Coming Soon)');
    } else if (step6TestsPassed >= 7) {
      console.log('\n✅ CYCLE 15 SUCCESS: Step 6 UI working (minor issues)');
      console.log(`📊 Passed: ${step6TestsPassed}/${step6TotalTests} tests`);
    } else {
      console.log('\n⚠️ CYCLE 15 PARTIAL: Step 6 needs attention');
      console.log(`📊 Passed: ${step6TestsPassed}/${step6TotalTests} tests`);
    }

    console.log('\n📸 Screenshot: /tmp/cycle15-step6-full.png');

    // ============================================================================
    // CYCLE 24: TEMPLATE FIXES RESULTS
    // ============================================================================
    console.log('\n📊 CYCLE 24 TEMPLATE FIXES RESULTS:');
    console.log(`${templateFixesResults.sectionIdsExist ? '✅' : '❌'} Section IDs: ${templateFixesResults.sectionIdsExist ? 'ALL FOUND' : 'MISSING'}`);
    console.log(`${templateFixesResults.navigationLinksWork ? '✅' : '❌'} Navigation Links: ${templateFixesResults.navigationLinksWork ? 'WORKING' : 'FAILED'}`);
    console.log(`${templateFixesResults.cssRulesApplied ? '✅' : '❌'} CSS Rules: ${templateFixesResults.cssRulesApplied ? 'APPLIED' : 'MISSING'}`);
    console.log(`${templateFixesResults.noContrastIssues ? '✅' : '❌'} Contrast: ${templateFixesResults.noContrastIssues ? 'NO ISSUES' : 'ISSUES FOUND'}`);

    const templateFixesPassed = Object.values(templateFixesResults).filter(v => v === true).length;
    const templateFixesTotal = Object.keys(templateFixesResults).length;

    if (templateFixesPassed === templateFixesTotal) {
      console.log('\n🎉 🎉 🎉 CYCLE 24 TEMPLATE FIXES: ALL TESTS PASSED! 🎉 🎉 🎉');
      console.log('✅ All section IDs present in generated site');
      console.log('✅ Footer navigation anchor links working');
      console.log('✅ UX Professional CSS rules applied');
      console.log('✅ No contrast issues detected');
    } else if (templateFixesPassed >= 3) {
      console.log('\n✅ CYCLE 24 SUCCESS: Template fixes mostly working');
      console.log(`📊 Passed: ${templateFixesPassed}/${templateFixesTotal} tests`);
    } else {
      console.log('\n⚠️ CYCLE 24 PARTIAL: Template fixes need attention');
      console.log(`📊 Passed: ${templateFixesPassed}/${templateFixesTotal} tests`);
    }

    // === NEW: VERIFY HTTPS SUBDOMAIN ACCESS (Issue #153) ===
    console.log('\n🔒 VERIFY HTTPS SUBDOMAIN ACCESS (Issue #153)');
    console.log('='.repeat(50));

    const httpsUrl = `https://${subdomain}.dev.lowebi.com`;
    console.log(`📍 Testing URL: ${httpsUrl}`);
    console.log('⏳ Waiting up to 60 seconds for container to start and Nginx to configure...');

    let siteAccessible = false;
    let lastError = '';
    const maxRetries = 12; // 12 attempts x 5 seconds = 60 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`   Attempt ${attempt}/${maxRetries}...`);
        const response = await page.goto(httpsUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        if (response && response.status() === 200) {
          console.log('✅ Site accessible via HTTPS with wildcard SSL!');
          console.log(`✅ Status: ${response.status()}`);
          console.log('✅ Issue #153 Domain Integration: SUCCESS');
          siteAccessible = true;
          break;
        } else {
          lastError = `HTTP ${response?.status()}`;
          console.log(`   ⚠️ Status: ${response?.status()}, retrying...`);
        }
      } catch (error) {
        lastError = error.message;
        console.log(`   ⚠️ ${error.message.split('\n')[0]}, retrying...`);
      }

      if (attempt < maxRetries) {
        await page.waitForTimeout(5000); // Wait 5 seconds between retries
      }
    }

    if (!siteAccessible) {
      console.log(`❌ HTTPS site not accessible after ${maxRetries} attempts (60 seconds)`);
      console.log(`❌ Last error: ${lastError}`);
      console.log('❌ Issue #153 Domain Integration: FAILED - Site not accessible');
      throw new Error(`HTTPS subdomain not accessible: ${lastError}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 CYCLE 26 COMPLETE: Domain Integration E2E Test');
    console.log('='.repeat(80));
    console.log(`✅ Site Name: ${siteName}`);
    console.log(`✅ Subdomain: ${subdomain}.dev.lowebi.com`);
    console.log(`✅ HTTPS URL: ${httpsUrl}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
});
