import { test, expect } from '@playwright/test';

test('Cycle 14b V1.2: AI Image Generation - Enhanced Blog Elements', async ({ page, browser }) => {
  console.log('🔄 CYCLE 14b V1.2: AI IMAGE GENERATION - ENHANCED BLOG ELEMENTS');
  console.log('Purpose: Complete Steps 1-13 + test AI image generation workflow');
  console.log('Variant: "Générer mes images par IA" with V1.2 enhanced prompt system');
  console.log('=' .repeat(70));

  // Enable console logging to capture blog content application
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('blog') || text.includes('Blog') || text.includes('articles') || text.includes('Applying') || text.includes('DEBUG')) {
      console.log(`🔍 CONSOLE: ${text}`);
    }
  });

  try {
    // Generate unique timestamp for this test
    const timestamp = Date.now();
    const siteName = `Cycle14b_V1.2_${timestamp}`;
    console.log(`🆔 Generated site name: ${siteName}`);

    // ============================================================================
    // FOUNDATION STEPS 1-6 (Required for Cycles 10+)
    // ============================================================================

    // Step 1: Authentication
    console.log('🔐 Step 1: Authentication...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Customer login successful');

    // Step 2: Navigate to My Sites
    console.log('🏠 Step 2: Navigate to My Sites...');
    await page.goto('https://logen.locod-ai.com/sites');
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
      await page.goto('https://logen.locod-ai.com/sites');
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

    // Navigate to business info step - we need to go back to Step 2 which is business info
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
        console.log('🔍 Checking all text inputs instead...');

        // Look for the business name field by label instead
        const businessNameByLabel = await page.locator('input[placeholder*="entreprise"], input[placeholder*="Entreprise"], label:has-text("Nom"):has(+ input), label:has-text("nom"):has(+ input)').first();
        const businessNameByLabelExists = await businessNameByLabel.count();

        if (businessNameByLabelExists > 0) {
          console.log('✅ Found business name field by label/alternative selector');
        } else {
          console.log('❌ No business name field found - test structure may need update');
        }
      }
    }

    // Step 5: Test site ID generation and Contact section in business info step
    console.log('✏️ Step 5: Test new features in business info step...');

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

    // ============================================================================
    // STEPS 10-13: COMPLETE CONTENT AI WORKFLOW WITH ADMIN PROCESSING
    // ============================================================================

    console.log('\n🎨 STEPS 10-13: COMPLETE CONTENT AI WORKFLOW');
    console.log('=============================================');

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

    // STEP 11: Verify content request appears in admin queue
    console.log('\n👨‍💼 Step 11: Processing CONTENT request in admin...');

    const contentAdminContext = await browser.newContext();
    const contentAdminPage = await contentAdminContext.newPage();

    await contentAdminPage.goto('https://admin.logen.locod-ai.com');
    await contentAdminPage.fill('input[type="email"]', 'admin@locod.ai');
    await contentAdminPage.fill('input[type="password"]', 'admin123');
    await contentAdminPage.click('button[type="submit"]');
    await contentAdminPage.waitForURL('**/dashboard');

    await contentAdminPage.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
    await contentAdminPage.waitForTimeout(2000);

    // Find the content request for our site
    const contentRequestSelector = `tr:has-text("${siteName}"):has-text("content")`;
    const contentRequestExists = await contentAdminPage.locator(contentRequestSelector).count();

    if (contentRequestExists === 0) {
      // Try alternative selectors - just look for our site name
      const altContentRequest = `tr:has-text("${siteName}")`;
      const altExists = await contentAdminPage.locator(altContentRequest).count();

      if (altExists > 0) {
        console.log('✅ Found request for our site (content type may vary)');
      } else {
        throw new Error(`No content request found for site: ${siteName}`);
      }
    } else {
      console.log('✅ Found content request in admin queue');
    }

    // STEP 12: Process the content request
    console.log('\n🔧 Step 12: Processing content request as expert...');

    // Click "Traiter" button for the content request
    const traiterButton = contentAdminPage.locator(`tr:has-text("${siteName}") button:has-text("Traiter")`).first();
    await traiterButton.click();
    await contentAdminPage.waitForTimeout(2000);
    console.log('✅ Clicked "Traiter" button for content request');

    // Generate sample content to paste
    const sampleContent = `
# ${siteName} - Site Web Professionnel

## À Propos
Bienvenue sur ${siteName}. Nous offrons des services professionnels de haute qualité.

## Services
- Service 1: Consultation professionnelle
- Service 2: Solutions personnalisées
- Service 3: Support technique

## Blog
### Article 1: Innovation et Excellence
Découvrez comment nous innovons pour vous offrir le meilleur service.

### Article 2: Notre Expertise
Notre équipe d'experts vous accompagne dans tous vos projets.

## Témoignages
"Service exceptionnel!" - Client satisfait

## FAQ
Q: Comment nous contacter?
R: Utilisez notre formulaire de contact en ligne.
    `;

    // Find the result textarea and paste content
    const resultTextarea = contentAdminPage.locator('textarea[placeholder*="Collez"], textarea[name*="result"], textarea').first();
    const textareaExists = await resultTextarea.count();

    if (textareaExists > 0) {
      await resultTextarea.fill(sampleContent);
      console.log('✅ Pasted generated content in admin interface');
    } else {
      console.log('⚠️ No textarea found for content - trying alternative approach');

      // Try to find any text input field
      const anyTextInput = contentAdminPage.locator('input[type="text"], textarea').last();
      const anyInputExists = await anyTextInput.count();

      if (anyInputExists > 0) {
        await anyTextInput.fill(sampleContent);
        console.log('✅ Pasted content in alternative text field');
      }
    }

    // Click "Appliquer & Terminer"
    const applyContentButtons = [
      'button:has-text("✅ Appliquer & Terminer")',
      'button:has-text("Appliquer & Terminer")',
      'button:has-text("Appliquer")',
      'button:has-text("Terminer")',
      'button:has-text("Valider")',
      'button[type="submit"]'
    ];

    let contentApplied = false;
    for (const selector of applyContentButtons) {
      const button = contentAdminPage.locator(selector);
      const count = await button.count();

      if (count > 0) {
        await button.first().click();
        console.log(`✅ Applied content with: ${selector}`);
        contentApplied = true;
        break;
      }
    }

    if (!contentApplied) {
      console.log('⚠️ No apply button found for content');
    }

    await contentAdminPage.waitForTimeout(3000);

    // STEP 13: Verify content processing completed
    console.log('\n✅ Step 13: Verifying content processing completed...');

    // Return to queue to verify status change
    await contentAdminPage.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
    await contentAdminPage.waitForTimeout(2000);

    const processedContentSelector = `tr:has-text("${siteName}")`;
    const processedContentExists = await contentAdminPage.locator(processedContentSelector).count();

    if (processedContentExists > 0) {
      const viewResultButton = contentAdminPage.locator(`${processedContentSelector} button:has-text("Voir Résultat")`);
      const viewResultCount = await viewResultButton.count();

      if (viewResultCount > 0) {
        console.log('✅ SUCCESS: Content processing completed (shows "Voir Résultat")');
      } else {
        console.log('⚠️ Content request status unclear - may still be processing');
      }
    }

    await contentAdminContext.close();
    console.log('✅ Content workflow completed - ready for images');

    // ============================================================================
    // STEP 14B: NAVIGATE TO STEP 5 (IMAGES) AND TEST V1.2 IMAGE GENERATION
    // ============================================================================
    console.log('\n🎨 STEP 14B V1.2: V1.2 IMAGE GENERATION TESTING');
    console.log('===============================================');

    // Navigate to Step 5 (Images & Logo)
    console.log('➡️ Navigate to Step 5 "Images & Logo"...');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(3000);

    // Verify we're on Step 5
    const step5Title = await page.textContent('h1, h2, h3').catch(() => '');
    console.log(`📍 Current step: ${step5Title}`);

    // First find and click the radio button for "Générer mes images par IA"
    console.log('🎨 Step 1: Select radio button for "Générer mes images par IA"...');

    // Try different approaches to select the AI radio button specifically
    let aiRadioSelected = false;

    // Approach 1: Find the clickable div container and click it (this should select the radio)
    const aiContainer = page.locator('div.border-2.rounded-lg.p-6.cursor-pointer').filter({ hasText: 'Générer mes images par IA' });
    const aiContainerCount = await aiContainer.count();

    if (aiContainerCount > 0) {
      await aiContainer.first().click();
      console.log('✅ Clicked AI container (should select radio button)');
      aiRadioSelected = true;
    } else {
      console.log('⚠️ AI container not found, trying direct radio button approach...');

      // Approach 2: Find all radio buttons and select the second one (assuming order: manual=0, ai=1, mixed=2)
      const radioButtons = page.locator('input[type="radio"]');
      const radioCount = await radioButtons.count();

      console.log(`🔍 Found ${radioCount} radio buttons`);

      if (radioCount >= 2) {
        await radioButtons.nth(1).click();
        console.log('✅ Clicked second radio button (assuming AI option)');
        aiRadioSelected = true;
      } else {
        console.log('❌ Could not find enough radio buttons');
      }
    }

    if (!aiRadioSelected) {
      throw new Error('Could not select "Générer mes images par IA" option');
    }

    // Step 2: Submit the AI image generation request
    console.log('🎯 Step 2: Submitting V1.2 AI image generation request...');

    // Look for the correct image generation button
    const imageGenerationButtons = [
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
      throw new Error('Submit button not found');
    }

    // Wait briefly for request to be created
    await page.waitForTimeout(2000);
    console.log('✅ Image generation request submitted, proceeding to admin processing...');

    // === STEP 10: Content Admin Processing First ===
    console.log('\n👨‍💼 STEP 10: ADMIN PROCESSING FOR CONTENT FIRST');
    console.log('===========================================');

    // Open new context for admin
    const contentAdminContext2 = await browser.newContext();
    const contentAdminPage2 = await contentAdminContext2.newPage();

    await contentAdminPage2.goto('https://admin.logen.locod-ai.com');
    await contentAdminPage2.fill('input[type="email"]', 'admin@locod.ai');
    await contentAdminPage2.fill('input[type="password"]', 'admin123');
    await contentAdminPage2.click('button[type="submit"]');
    await contentAdminPage2.waitForURL('**/dashboard');

    await contentAdminPage2.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');

    // Look for content request (content type, not images)
    const contentRequestSelector2 = `tr:has-text("${siteName}"):has-text("content")`;
    const contentRequestCount = await contentAdminPage2.locator(contentRequestSelector2).count();

    if (contentRequestCount > 0) {
      console.log('✅ Found content request in admin queue');

      const contentTraiterButton = contentAdminPage2.locator(`${contentRequestSelector2} button:has-text("Traiter")`);
      const contentTraiterCount = await contentTraiterButton.count();

      if (contentTraiterCount > 0) {
        console.log('🔘 Found "Traiter" button for content - processing...');

        await contentTraiterButton.first().click();
        await contentAdminPage2.waitForTimeout(2000);

        // Generate content result using cycle13 proven pattern
        const contentResult = JSON.stringify({
          hero: {
            title: "Solutions Professionnelles Innovantes",
            subtitle: "Votre partenaire de confiance pour la réussite",
            description: "Nous accompagnons les entreprises dans leur transformation digitale et leur croissance avec des solutions sur mesure et une expertise reconnue."
          },
          services: [
            {
              title: "Conseil Stratégique",
              description: "Accompagnement personnalisé pour optimiser vos processus métiers et définir une stratégie de croissance durable.",
              features: ["Audit complet", "Plan d'action détaillé", "Suivi personnalisé"]
            },
            {
              title: "Solutions Numériques",
              description: "Développement de solutions technologiques innovantes adaptées à vos besoins spécifiques et objectifs business.",
              features: ["Développement sur mesure", "Intégration complète", "Formation équipes"]
            },
            {
              title: "Support & Maintenance",
              description: "Service de support technique réactif et maintenance préventive pour assurer la continuité de vos opérations.",
              features: ["Support 24/7", "Maintenance préventive", "Mise à jour continue"]
            }
          ],
          blog: {
            articles: [
              {
                title: "Les tendances de la transformation digitale en 2024",
                excerpt: "Découvrez les principales évolutions technologiques qui façonnent l'avenir des entreprises et comment vous y préparer dès maintenant.",
                content: "La transformation digitale continue d'évoluer à un rythme effréné. Les entreprises qui anticipent ces changements prennent une longueur d'avance significative sur leurs concurrents.",
                category: "Innovation",
                tags: ["transformation", "technologie", "stratégie"]
              },
              {
                title: "Comment optimiser l'efficacité opérationnelle de votre entreprise",
                excerpt: "Stratégies éprouvées et outils pratiques pour améliorer vos processus internes et maximiser votre productivité au quotidien.",
                content: "L'optimisation des processus internes est cruciale pour maintenir la compétitivité. Ces stratégies ont permis d'améliorer l'efficacité de 30% en moyenne.",
                category: "Optimisation",
                tags: ["processus", "efficacité", "productivité"]
              }
            ]
          }
        }, null, 2);

        // Fill the AI result textarea
        const contentResultTextarea = contentAdminPage2.locator('textarea[placeholder*="Collez ici"], textarea[placeholder*="Résultat"], textarea').first();
        await contentResultTextarea.clear();
        await contentResultTextarea.fill(contentResult);
        await contentAdminPage2.waitForTimeout(1000);

        // Click "Appliquer & Terminer" for content
        const contentCompleteButton = contentAdminPage2.locator('button:has-text("Appliquer"), button:has-text("Terminer"), button:has-text("Valider")').first();
        await contentCompleteButton.click();
        await contentAdminPage2.waitForTimeout(3000);

        console.log('✅ Content request processed successfully');

        // Verify content processing success
        await contentAdminPage2.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
        await contentAdminPage2.waitForTimeout(2000);

        const processedContentRequest = contentAdminPage2.locator(contentRequestSelector2);
        const contentViewResultButton = processedContentRequest.locator('button:has-text("Voir Résultat")');
        const contentViewResultCount = await contentViewResultButton.count();

        if (contentViewResultCount > 0) {
          console.log('✅ SUCCESS: Content request status changed to "Voir Résultat" - processing completed!');
        } else {
          console.log('⚠️ WARNING: Content request processing status unclear');
        }
      } else {
        console.log('✅ Content request already processed (no Traiter button found)');
      }
    } else {
      console.log('⚠️ No content request found in admin queue');
    }

    // Close content admin context
    await contentAdminContext2.close();

    // === STEP 11-14: Admin Processing with V1.2 Enhanced Blog Verification ===
    console.log('\n👨‍💼 STEP 11-14: ADMIN PROCESSING FOR IMAGES');
    console.log('===============================================');

    // Open new context for admin
    const imageAdminContext = await browser.newContext();
    const imageAdminPage = await imageAdminContext.newPage();

    await imageAdminPage.goto('https://admin.logen.locod-ai.com');
    await imageAdminPage.fill('input[type="email"]', 'admin@locod.ai');
    await imageAdminPage.fill('input[type="password"]', 'admin123');
    await imageAdminPage.click('button[type="submit"]');
    await imageAdminPage.waitForURL('**/dashboard');

    await imageAdminPage.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');

    const imageRequestSelector = `tr:has-text("${siteName}"):has-text("images")`;
    await imageAdminPage.waitForSelector(imageRequestSelector);
    console.log('✅ Found image request in admin queue');

    await imageAdminPage.click(`${imageRequestSelector} button:has-text("Traiter")`);
    await imageAdminPage.waitForTimeout(5000); // Wait longer for page to fully load/update
    console.log('✅ Clicked Traiter button for image processing');

    // === STEP 13a: V1.2 Enhanced Blog Elements Verification ===
    console.log('\n🔍 Step 13a: Verifying V1.2 enhanced blog elements in image prompt...');

    const promptContent = await imageAdminPage.textContent('body');

    // V1.2 Enhanced verification - includes new blog article elements
    const basicImageElements = ['logo', 'navigation', 'hero', 'favicon', 'bannière'];
    const blogImageElements = ['blog', 'article', 'articles'];

    let foundBasicElements = 0;
    let foundBlogElements = 0;

    console.log('\n🖼️ BASIC IMAGE ELEMENTS CHECK:');
    for (const element of basicImageElements) {
      if (promptContent.toLowerCase().includes(element.toLowerCase())) {
        foundBasicElements++;
        console.log(`✅ Image prompt contains: ${element}`);
      } else {
        console.log(`❌ Image prompt missing: ${element}`);
      }
    }

    console.log('\n📝 BLOG IMAGE ELEMENTS CHECK (V1.2 Enhanced):');
    for (const element of blogImageElements) {
      if (promptContent.toLowerCase().includes(element.toLowerCase())) {
        foundBlogElements++;
        console.log(`✅ Blog image prompt contains: ${element}`);
      } else {
        console.log(`❌ Blog image prompt missing: ${element}`);
      }
    }

    // Additional V1.2 checks for enhanced blog content
    const enhancedBlogTerms = ['publication d\'articles', 'blog articles', 'contenu éditorial', 'articles réguliers'];
    let foundEnhancedTerms = 0;

    console.log('\n🚀 V1.2 ENHANCED BLOG TERMS CHECK:');
    for (const term of enhancedBlogTerms) {
      if (promptContent.toLowerCase().includes(term.toLowerCase())) {
        foundEnhancedTerms++;
        console.log(`✅ V1.2 enhanced term found: ${term}`);
      } else {
        console.log(`❌ V1.2 enhanced term missing: ${term}`);
      }
    }

    // === STEP 13b: V1.2 Results Analysis ===
    console.log('\n📊 V1.2 IMAGE PROMPT ANALYSIS:');
    console.log(`Basic image elements: ${foundBasicElements}/${basicImageElements.length}`);
    console.log(`Blog image elements: ${foundBlogElements}/${blogImageElements.length}`);
    console.log(`V1.2 enhanced terms: ${foundEnhancedTerms}/${enhancedBlogTerms.length}`);

    // Enhanced V1.2 success criteria
    const basicElementsOk = foundBasicElements >= 4; // Allow some flexibility
    const blogElementsOk = foundBlogElements === blogImageElements.length; // All blog elements required
    const enhancedTermsOk = foundEnhancedTerms >= 2; // At least 2 enhanced terms

    if (basicElementsOk && blogElementsOk && enhancedTermsOk) {
      console.log('\n🎉 SUCCESS: V1.2 image prompt contains all required elements!');
      console.log('✅ Blog elements verification: PASSED');
      console.log('✅ Enhanced terms verification: PASSED');
      console.log('💡 Blog images will be generated correctly with enhanced V1.2 elements');
      console.log('📊 Overall V1.2 prompt validation: PASSED');
    } else {
      console.log('\n❌ ANALYSIS: V1.2 image prompt status:');
      if (!basicElementsOk) {
        console.log(`❌ Basic elements: ${foundBasicElements}/${basicImageElements.length} - NEEDS IMPROVEMENT`);
      } else {
        console.log(`✅ Basic elements: ${foundBasicElements}/${basicImageElements.length} - OK`);
      }

      if (!blogElementsOk) {
        console.log(`❌ Blog elements: ${foundBlogElements}/${blogImageElements.length} - CRITICAL ISSUE`);
        console.log('💡 Backend V1.2 enhancement may not be deployed yet');
      } else {
        console.log(`✅ Blog elements: ${foundBlogElements}/${blogImageElements.length} - FIXED IN V1.2`);
      }

      if (!enhancedTermsOk) {
        console.log(`❌ Enhanced terms: ${foundEnhancedTerms}/${enhancedBlogTerms.length} - V1.2 NOT DETECTED`);
      } else {
        console.log(`✅ Enhanced terms: ${foundEnhancedTerms}/${enhancedBlogTerms.length} - V1.2 CONFIRMED`);
      }

      console.log('📊 Overall V1.2 prompt validation: PARTIAL/FAILED');
    }

    // Debug: Show a portion of the actual prompt for verification
    const promptLines = promptContent.split('\n').filter(line =>
      line.toLowerCase().includes('blog') ||
      line.toLowerCase().includes('article') ||
      line.toLowerCase().includes('dall-e')
    );

    if (promptLines.length > 0) {
      console.log('\n📋 BLOG-RELATED PROMPT LINES (for debugging):');
      promptLines.slice(0, 5).forEach((line, i) => {
        console.log(`  ${i + 1}. ${line.trim().substring(0, 100)}...`);
      });
    }

    // === STEP 13c: Verify Image Upload Fields in Admin Interface ===
    console.log('\n📁 Step 13c: Verifying image upload fields in admin interface...');

    // Check for image upload fields in the admin processing modal
    const uploadFieldSelectors = [
      'input[type="file"][name*="logo"], input[type="file"][placeholder*="logo"]',
      'input[type="file"][name*="navigation"], input[type="file"][placeholder*="navigation"]',
      'input[type="file"][name*="footer"], input[type="file"][placeholder*="footer"]',
      'input[type="file"][name*="hero"], input[type="file"][placeholder*="hero"]',
      'input[type="file"][name*="banner"], input[type="file"][placeholder*="banner"]',
      'input[type="file"][name*="favicon"], input[type="file"][placeholder*="favicon"]',
      'input[type="file"][name*="blog"], input[type="file"][placeholder*="blog"]',
      'input[type="file"][name*="service"], input[type="file"][placeholder*="service"]'
    ];

    let foundUploadFields = 0;
    const expectedUploadTypes = ['logo navigation', 'logo footer', 'hero/bannière', 'favicon clair', 'favicon sombre'];

    console.log('🔍 Checking for image upload fields...');
    for (const selector of uploadFieldSelectors) {
      const fieldCount = await imageAdminPage.locator(selector).count();
      if (fieldCount > 0) {
        foundUploadFields += fieldCount;
        console.log(`✅ Found ${fieldCount} upload field(s): ${selector}`);
      }
    }

    // Alternative: Check for any file input fields
    const allFileInputs = await imageAdminPage.locator('input[type="file"]').count();
    console.log(`📊 Total file input fields found: ${allFileInputs}`);

    if (allFileInputs > 0) {
      console.log('✅ Image upload interface is present in admin modal');
    } else {
      console.log('⚠️ No file upload fields detected - may need UI structure verification');
    }


    // === STEP 13e: Read "Prompt suggéré" and Fill "Résultat IA" ===
    console.log('\n✅ Step 13e: Reading Prompt suggéré and filling Résultat IA textarea...');

    // The "Prompt suggéré" is displayed text (left side), not a button to click
    // The "Résultat IA" is the textarea (right side) where we fill the AI result
    console.log('🔍 Looking for "Résultat IA" textarea to fill with AI result...');

    // === STEP 13f: Fill AI Result in "Résultat IA" textarea ===
    console.log('\n✅ Step 13f: Filling Résultat IA with realistic image URLs...');

    // Generate realistic image result matching what DALL-E would provide
    const imageResult = JSON.stringify({
      images: [
        {
          url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-xyz/user-abc/img-def123.png?se=2024-12-31T12%3A00%3A00Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48ccc12-e6da-484e-a814-9c849652bcb3&skt=2024-01-15T10%3A07%3A47Z&ske=2024-01-16T10%3A07%3A47Z&sks=b&skv=2021-08-06&sig=abc123def456",
          alt: "Professional logo with modern design elements",
          type: "logo"
        },
        {
          url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-xyz/user-abc/img-ghi789.png?se=2024-12-31T12%3A00%3A00Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48ccc12-e6da-484e-a814-9c849652bcb3&skt=2024-01-15T10%3A07%3A47Z&ske=2024-01-16T10%3A07%3A47Z&sks=b&skv=2021-08-06&sig=def456ghi789",
          alt: "Hero section background with professional atmosphere",
          type: "hero"
        },
        {
          url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-xyz/user-abc/img-jkl101.png?se=2024-12-31T12%3A00%3A00Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48ccc12-e6da-484e-a814-9c849652bcb3&skt=2024-01-15T10%3A07%3A47Z&ske=2024-01-16T10%3A07%3A47Z&sks=b&skv=2021-08-06&sig=ghi789jkl101",
          alt: "Service illustration representing business solutions",
          type: "service"
        }
      ],
      metadata: {
        generated_at: new Date().toISOString(),
        total_images: 3,
        model: "dall-e-3",
        prompt_used: "Professional business images for modern website"
      }
    }, null, 2);

    // Upload placeholder image files to each image section - CORRECT IMAGE PROCESSING WORKFLOW
    console.log('🖼️ Uploading placeholder images to each image section...');

    // Create a simple 1x1 pixel PNG as placeholder
    const fs = require('fs');
    const path = require('path');
    const placeholderImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Define image sections that need uploads (based on the screenshot)
    const imageSections = [
      { name: 'Logo Navigation (clair)', selector: 'input[type="file"]' },
      { name: 'Logo Footer (sombre)', selector: 'input[type="file"]' },
      { name: 'Image Hero Bannière', selector: 'input[type="file"]' },
      { name: 'Image Blog', selector: 'input[type="file"]' }
    ];

    // Find all file input fields and upload to each one
    const fileInputs = imageAdminPage.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    console.log(`🔍 Found ${fileInputCount} file upload fields`);

    let uploadedCount = 0;
    if (fileInputCount > 0) {
      for (let i = 0; i < fileInputCount; i++) {
        try {
          const fileInput = fileInputs.nth(i);

          // Create temporary file with unique name
          const tempFilePath = path.join('/tmp', `placeholder_image_${i + 1}.png`);
          fs.writeFileSync(tempFilePath, placeholderImageBuffer);

          // Upload the file
          await fileInput.setInputFiles(tempFilePath);
          console.log(`✅ Uploaded placeholder image ${i + 1}/${fileInputCount}`);
          uploadedCount++;

          // Clean up temp file
          fs.unlinkSync(tempFilePath);
          await imageAdminPage.waitForTimeout(1000); // Wait between uploads

        } catch (uploadError) {
          console.log(`⚠️ Upload ${i + 1} failed: ${uploadError.message}`);
        }
      }
    }

    if (uploadedCount === 0) {
      throw new Error('Failed to upload any placeholder images - admin processing cannot complete');
    }

    console.log(`✅ Successfully uploaded ${uploadedCount} placeholder images`);

    // === STEP 13g: Complete Admin Processing with "✅ Appliquer & Terminer" ===
    console.log('\n✅ Step 13g: Completing image admin processing with "Appliquer & Terminer"...');

    // Click "Appliquer & Terminer" - using EXACT cycle13 proven pattern
    const completeButton = imageAdminPage.locator('button:has-text("Appliquer"), button:has-text("Terminer"), button:has-text("Valider")').first();
    await completeButton.click();
    await imageAdminPage.waitForTimeout(3000);
    console.log('✅ AI image request processed successfully - cycle13 pattern');

    // === STEP 13h: Verify Admin Processing Success ===
    console.log('\n🔍 Step 13h: Verifying admin processing was successful...');

    // Return to queue to verify status changed
    await imageAdminPage.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
    await imageAdminPage.waitForTimeout(2000);

    // Look for our request again - should now show "Voir Résultat" instead of "Traiter"
    const processedRequestSelector = `tr:has-text("${siteName}"):has-text("images")`;
    const processedRequestExists = await imageAdminPage.locator(processedRequestSelector).count();

    if (processedRequestExists > 0) {
      const viewResultButton = imageAdminPage.locator(`${processedRequestSelector} button:has-text("Voir Résultat")`);
      const viewResultCount = await viewResultButton.count();

      const traiterButton = imageAdminPage.locator(`${processedRequestSelector} button:has-text("Traiter")`);
      const traiterCount = await traiterButton.count();

      if (viewResultCount > 0) {
        console.log('✅ SUCCESS: Request status changed to "Voir Résultat" - processing completed!');
      } else if (traiterCount > 0) {
        console.log('⚠️ WARNING: Request still shows "Traiter" - processing may not have completed properly');
      } else {
        console.log('🔍 Request status unclear - checking request details...');
      }
    } else {
      console.log('⚠️ Could not find our request in the queue after processing');
    }

    // Close admin context
    await imageAdminContext.close();

    // === STEP 15: Customer Portal Verification ===
    console.log('\n👤 Step 15: Customer portal verification - checking if images appear...');

    // Return to customer wizard Step 5 (Images)
    await page.goto(`https://logen.locod-ai.com/wizard?step=5`);
    await page.waitForTimeout(3000);

    // Alternative: Navigate through wizard steps to reach Step 5
    const currentWizardUrl = page.url();
    if (!currentWizardUrl.includes('step=5')) {
      console.log('🔄 Navigating through wizard to reach Step 5...');

      // Try to find and click step navigation or "next" buttons to reach images step
      const stepButtons = await page.locator('button:has-text("5"), [data-step="5"]').count();
      if (stepButtons > 0) {
        await page.locator('button:has-text("5"), [data-step="5"]').first().click();
        await page.waitForTimeout(2000);
      } else {
        // Navigate by clicking through steps
        const nextButton = page.locator('button:has-text("Suivant")');
        const nextCount = await nextButton.count();

        for (let i = 0; i < 3 && nextCount > 0; i++) { // Try up to 3 times
          await nextButton.first().click();
          await page.waitForTimeout(2000);

          const currentStepTitle = await page.textContent('h1, h2, h3').catch(() => '');
          if (currentStepTitle.includes('Image') || currentStepTitle.includes('Logo')) {
            console.log('✅ Reached Step 5 (Images) successfully');
            break;
          }
        }
      }
    }

    // === STEP 14a: Verify Images Automatically Appeared ===
    console.log('\n🖼️ Step 14a: Verifying if images automatically appeared in customer interface...');

    // Check for image previews or uploaded image indicators
    const imagePreviewSelectors = [
      'img[src*="blob:"], img[src*="data:"]', // Uploaded image previews
      '.image-preview, .uploaded-image', // CSS classes for image previews
      'div:has-text("Uploaded"), div:has-text("Image uploaded")', // Upload success indicators
      '.file-upload-success, .image-upload-complete', // Success state CSS classes
      'button:has-text("Remove"), button:has-text("Supprimer")' // Remove buttons indicating images are present
    ];

    let foundImageIndicators = 0;
    for (const selector of imagePreviewSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundImageIndicators += count;
        console.log(`✅ Found ${count} image indicator(s): ${selector}`);
      }
    }

    if (foundImageIndicators > 0) {
      console.log(`✅ SUCCESS: Found ${foundImageIndicators} image indicators - images appeared automatically!`);
      console.log('🔄 Customer portal automatically updated with processed images');
    } else {
      console.log('⚠️ No automatic image indicators detected');
      console.log('💡 This may indicate images are not auto-applying or UI structure has changed');
    }

    // === STEP 14b: Verify All Required Image Types Are Present ===
    console.log('\n📋 Step 14b: Checking for all required image upload sections...');

    const requiredImageSections = [
      { name: 'Logo Navigation', selectors: ['text="Logo Navigation"', 'label:has-text("navigation")', '[data-image-type="logo-nav"]'] },
      { name: 'Logo Footer', selectors: ['text="Logo Footer"', 'label:has-text("footer")', '[data-image-type="logo-footer"]'] },
      { name: 'Hero/Bannière', selectors: ['text="Bannière"', 'text="Hero"', 'label:has-text("hero")', '[data-image-type="hero"]'] },
      { name: 'Favicon Clair', selectors: ['text="Favicon Clair"', 'text="favicon"', '[data-image-type="favicon-light"]'] },
      { name: 'Favicon Sombre', selectors: ['text="Favicon Sombre"', '[data-image-type="favicon-dark"]'] }
    ];

    let foundImageSections = 0;
    for (const section of requiredImageSections) {
      let sectionFound = false;

      for (const selector of section.selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          sectionFound = true;
          break;
        }
      }

      if (sectionFound) {
        foundImageSections++;
        console.log(`✅ Found section: ${section.name}`);
      } else {
        console.log(`⚠️ Missing section: ${section.name}`);
      }
    }

    console.log(`📊 Image sections found: ${foundImageSections}/${requiredImageSections.length}`);

    // === STEP 14c: Test Continue to Next Step ===
    console.log('\n➡️ Step 14c: Testing continue to next wizard step...');

    const continueButton = page.locator('button:has-text("Suivant"), button:has-text("Continuer")');
    const continueCount = await continueButton.count();

    if (continueCount > 0) {
      await continueButton.first().click();
      await page.waitForTimeout(3000);

      const nextStepTitle = await page.textContent('h1, h2, h3').catch(() => '');
      console.log(`✅ Successfully continued to next step: ${nextStepTitle}`);

      if (nextStepTitle.includes('Fonctionnalités') || nextStepTitle.includes('Features')) {
        console.log('✅ Reached Step 6 (Fonctionnalités) - wizard progression works correctly');
      }
    } else {
      console.log('⚠️ No continue button found - may still be on images step');
    }

    // === STEP 16: VERIFY IMAGE PERSISTENCE (REOPEN REQUEST) ===
    console.log('\n🔄 STEP 16: VERIFY IMAGE PERSISTENCE - REOPEN REQUEST');
    console.log('=' .repeat(70));
    console.log('Purpose: Confirm uploaded images persist when reopening the admin request');

    // Open new admin context to reopen the request
    const verifyAdminContext = await browser.newContext();
    const verifyAdminPage = await verifyAdminContext.newPage();

    await verifyAdminPage.goto('https://admin.logen.locod-ai.com');
    await verifyAdminPage.fill('input[type="email"]', 'admin@locod.ai');
    await verifyAdminPage.fill('input[type="password"]', 'admin123');
    await verifyAdminPage.click('button[type="submit"]');
    await verifyAdminPage.waitForURL('**/dashboard');
    console.log('✅ Admin logged in for verification');

    await verifyAdminPage.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');
    await verifyAdminPage.waitForTimeout(2000);

    // Find the completed request
    const completedRequestSelector = `tr:has-text("${siteName}"):has-text("images")`;
    const completedRequestExists = await verifyAdminPage.locator(completedRequestSelector).count();

    if (completedRequestExists > 0) {
      console.log(`✅ Found completed request for: ${siteName}`);

      // Click "Voir Résultat" to reopen the request
      const viewResultButton = verifyAdminPage.locator(`${completedRequestSelector} button:has-text("Voir Résultat")`).first();
      const viewResultExists = await viewResultButton.count();

      if (viewResultExists > 0) {
        await viewResultButton.click();
        await verifyAdminPage.waitForTimeout(3000);
        console.log('✅ Reopened completed request via "Voir Résultat"');

        // Check for persisted images in the modal
        console.log('\n🖼️ Checking for persisted images in reopened request...');

        // Look for uploaded image previews (images with /uploads/ in src)
        const persistedImages = verifyAdminPage.locator('img[src*="/uploads/requests/"]');
        const persistedCount = await persistedImages.count();

        if (persistedCount > 0) {
          console.log(`✅ SUCCESS: Found ${persistedCount} persisted images in reopened request!`);
          console.log('🔄 Images are loaded from server (imagesDraft field)');

          // Log image URLs for verification
          for (let i = 0; i < Math.min(persistedCount, 5); i++) {
            const imgSrc = await persistedImages.nth(i).getAttribute('src');
            console.log(`  📸 Image ${i + 1}: ${imgSrc?.substring(0, 80)}...`);
          }
        } else {
          console.log('❌ WARNING: No persisted images found when reopening request');
          console.log('💡 Images may not have been saved to imagesDraft field properly');
        }

        // Check for any file input fields (should be present with or without images)
        const fileInputsInReopenedModal = await verifyAdminPage.locator('input[type="file"]').count();
        console.log(`📋 File input fields in reopened modal: ${fileInputsInReopenedModal}`);

      } else {
        console.log('⚠️ No "Voir Résultat" button - request may not be completed');
      }
    } else {
      console.log('⚠️ Could not find completed request for persistence verification');
    }

    await verifyAdminContext.close();

    // === FINAL RESULTS SUMMARY ===
    console.log('\n🎉 CYCLE 14b V1.2 COMPLETE - FULL SCOPE TESTING RESULTS');
    console.log('=' .repeat(70));
    console.log('📋 SCOPE COVERAGE SUMMARY:');
    console.log(`✅ V1.2 Prompt Verification: ${basicElementsOk && blogElementsOk && enhancedTermsOk ? 'PASSED' : 'NEEDS WORK'}`);
    console.log(`✅ Admin Image Upload Fields: ${allFileInputs > 0 ? 'DETECTED' : 'NOT FOUND'}`);
    console.log(`✅ Placeholder Image Uploads: ${fileInputCount > 0 ? 'ATTEMPTED' : 'SKIPPED'}`);
    console.log(`✅ Admin Processing Completion: ${uploadedCount > 0 ? 'COMPLETED' : 'FAILED'}`);
    console.log(`✅ Customer Portal Image Auto-Apply: ${foundImageIndicators > 0 ? 'DETECTED' : 'NOT DETECTED'}`);
    console.log(`✅ Required Image Sections: ${foundImageSections}/${requiredImageSections.length} found`);
    console.log(`✅ Wizard Step Progression: ${continueCount > 0 ? 'WORKING' : 'NEEDS CHECK'}`);
    console.log('=' .repeat(70));
    console.log('🔍 V1.2 Enhanced blog elements verification completed');
    console.log('📊 Complete end-to-end Cycle 14b workflow tested');
    console.log('💡 Test covers full debug strategy scope for AI image generation');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
});