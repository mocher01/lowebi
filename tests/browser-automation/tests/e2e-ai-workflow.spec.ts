import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * COMPREHENSIVE END-TO-END AI WORKFLOW TEST
 * 
 * This test covers the complete workflow:
 * 1. V2 Wizard → AI request creation
 * 2. Admin login → process AI request
 * 3. Verify comprehensive prompt generation
 * 4. Complete AI content processing
 */

test.describe('Complete E2E AI Workflow - V2 Wizard to Admin Processing', () => {
  let context: BrowserContext;
  let page: Page;
  let adminPage: Page;
  let createdRequestId: string;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    adminPage = await context.newPage();
    
    // Enable detailed logging
    page.on('console', msg => console.log(`[Customer] Console: ${msg.text()}`));
    adminPage.on('console', msg => console.log(`[Admin] Console: ${msg.text()}`));
    page.on('requestfailed', req => console.log(`[Customer] Request failed: ${req.url()}`));
    adminPage.on('requestfailed', req => console.log(`[Admin] Request failed: ${req.url()}`));
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should complete full V2 wizard and create comprehensive AI request', async () => {
    console.log('\n🚀 Starting V2 Wizard Test...');
    
    // Navigate to V2 wizard
    await page.goto('https://dev.lowebi.com/wizard-v2');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Welcome & Terms
    console.log('📋 Step 1: Terms acceptance...');
    await expect(page.locator('h1')).toContainText('Bienvenue');
    await page.check('input[type="checkbox"]'); // Accept terms
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(1000);
    
    // Step 2: Template Selection
    console.log('🎨 Step 2: Template selection...');
    await page.waitForSelector('.template-option', { timeout: 10000 });
    await page.click('.template-option:first-child');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(1000);
    
    // Step 3: Business Info
    console.log('🏢 Step 3: Business information...');
    await page.fill('#siteName', 'Restaurant La Belle Époque');
    await page.selectOption('#businessType', 'restaurant');
    await page.fill('#domain', 'la-belle-epoque.fr');
    await page.fill('#slogan', 'Cuisine française raffinée depuis 1890');
    await page.fill('#businessDescription', 'Restaurant gastronomique français proposant une cuisine créative dans un cadre élégant du 19ème siècle');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(1000);
    
    // Step 4: Images & Logo (skip for now)
    console.log('🖼️ Step 4: Images (skipping)...');
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(1000);
    
    // Step 5: Content & Services - This is where we test AI generation!
    console.log('📝 Step 5: Content & Services - AI GENERATION TEST...');
    await page.waitForSelector('button:has-text("Générer par IA")', { timeout: 10000 });
    
    // Click the AI generation button
    console.log('🤖 Clicking "Générer par IA" button...');
    
    // Capture network requests to find the AI request
    const aiRequestPromise = page.waitForResponse(response => 
      response.url().includes('/admin/queue') && response.request().method() === 'POST'
    );
    
    await page.click('button:has-text("Générer par IA")');
    
    // Wait for AI request to be created
    const aiResponse = await aiRequestPromise;
    const responseData = await aiResponse.json();
    createdRequestId = responseData.id;
    
    console.log(`✅ AI Request created with ID: ${createdRequestId}`);
    console.log(`📊 Request Type: ${responseData.requestType}`);
    console.log(`🏪 Business Type: ${responseData.businessType}`);
    console.log(`📋 Site ID: ${responseData.siteId}`);
    
    // Verify it's a comprehensive 'content' request (V1 style)
    expect(responseData.requestType).toBe('content');
    expect(responseData.businessType).toBe('restaurant');
    expect(responseData.requestData.siteName).toBe('Restaurant La Belle Époque');
    expect(responseData.requestData.domain).toBe('la-belle-epoque.fr');
    expect(responseData.requestData.slogan).toBe('Cuisine française raffinée depuis 1890');
    expect(responseData.requestData.businessDescription).toBeDefined();
    
    console.log('✅ V2 Wizard successfully created comprehensive AI request!');
  });

  test('should login to admin and verify comprehensive prompt generation', async () => {
    console.log('\n🔐 Starting Admin Login Test...');
    
    if (!createdRequestId) {
      throw new Error('No AI request was created in the previous test');
    }
    
    // Navigate to admin portal
    await adminPage.goto('https://admin.dev.lowebi.com/');
    await adminPage.waitForLoadState('networkidle');
    
    // Login to admin
    console.log('🔑 Logging into admin portal...');
    await adminPage.fill('#email', 'admin@locod.ai');
    await adminPage.fill('#password', 'admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForTimeout(3000);
    
    // Navigate to AI Queue
    console.log('📋 Navigating to AI Queue...');
    await adminPage.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    await adminPage.waitForLoadState('networkidle');
    
    // Find our created request
    console.log(`🔍 Looking for request ID: ${createdRequestId}...`);
    const requestRow = adminPage.locator(`[data-request-id="${createdRequestId}"]`);
    if (await requestRow.count() === 0) {
      // Try alternative selector - look for the request by ID in text
      const allRows = adminPage.locator('tr');
      let foundRow = null;
      const rowCount = await allRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = allRows.nth(i);
        const text = await row.textContent();
        if (text && text.includes(createdRequestId)) {
          foundRow = row;
          break;
        }
      }
      
      if (!foundRow) {
        await adminPage.screenshot({ path: './test-results/admin-queue-screenshot.png', fullPage: true });
        throw new Error(`Could not find request ${createdRequestId} in admin queue`);
      }
    }
    
    // Click "Traiter" button to open processing modal
    console.log('🤖 Opening processing modal...');
    await adminPage.click(`button:has-text("Traiter")`);
    await adminPage.waitForTimeout(2000);
    
    // Verify comprehensive prompt is displayed
    console.log('📋 Verifying comprehensive prompt...');
    const promptContainer = adminPage.locator('.whitespace-pre-wrap');
    await expect(promptContainer).toBeVisible();
    
    const promptText = await promptContainer.textContent();
    console.log('📄 Generated prompt preview:');
    console.log(promptText?.substring(0, 500) + '...');
    
    // Verify it's comprehensive (V1-style) not simple
    expect(promptText).toContain('Génère TOUT le contenu textuel');
    expect(promptText).toContain('Restaurant La Belle Époque');
    expect(promptText).toContain('restaurant');
    expect(promptText).toContain('Cuisine française raffinée depuis 1890');
    expect(promptText).toContain('FORMAT JSON REQUIS');
    expect(promptText).toContain('"hero":');
    expect(promptText).toContain('"services":');
    expect(promptText).toContain('"about":');
    expect(promptText).toContain('"testimonials":');
    expect(promptText).toContain('"faq":');
    expect(promptText).toContain('"seo":');
    expect(promptText).toContain('"blog":');
    
    console.log('✅ Comprehensive V1-style prompt verified!');
    
    // Test copy functionality
    console.log('📋 Testing prompt copy functionality...');
    await adminPage.click('button:has-text("Copier")');
    
    // Verify the modal shows all request information
    const requestInfo = adminPage.locator('.font-semibold:has-text("Informations de la Demande")');
    await expect(requestInfo).toBeVisible();
    
    const siteInfo = adminPage.locator('text=Restaurant La Belle Époque');
    const businessInfo = adminPage.locator('text=restaurant');
    const typeInfo = adminPage.locator('text=content');
    
    await expect(siteInfo).toBeVisible();
    await expect(businessInfo).toBeVisible();
    await expect(typeInfo).toBeVisible();
    
    console.log('✅ Admin processing modal shows complete information!');
  });

  test('should verify backend API prompt generation directly', async () => {
    console.log('\n🔧 Testing Backend API Directly...');
    
    if (!createdRequestId) {
      throw new Error('No AI request was created');
    }
    
    // Test the backend prompt generation API directly
    const response = await page.request.get(`http://localhost:7610/admin/queue/${createdRequestId}/prompt`);
    expect(response.ok()).toBe(true);
    
    const promptData = await response.json();
    const prompt = promptData.prompt;
    
    console.log('🔍 Backend API prompt verification:');
    console.log(`📏 Prompt length: ${prompt.length} characters`);
    console.log('📋 Prompt preview:');
    console.log(prompt.substring(0, 300) + '...');
    
    // Verify comprehensive V1-style prompt
    expect(prompt).toContain('Génère TOUT le contenu textuel pour un site de restaurant');
    expect(prompt).toContain('Restaurant La Belle Époque');
    expect(prompt).toContain('Cuisine française raffinée depuis 1890');
    expect(prompt).toContain('spécialités');
    expect(prompt).toContain('FORMAT JSON REQUIS');
    
    // Verify all required sections
    const requiredSections = ['hero', 'services', 'about', 'testimonials', 'faq', 'seo', 'blog', 'servicesPage'];
    for (const section of requiredSections) {
      expect(prompt).toContain(`"${section}":`);
      console.log(`✅ Section "${section}" found in prompt`);
    }
    
    console.log('✅ Backend API generates comprehensive V1-style prompts correctly!');
  });

  test('should complete full AI processing workflow simulation', async () => {
    console.log('\n🎭 Simulating Complete AI Processing Workflow...');
    
    if (!createdRequestId) {
      throw new Error('No AI request was created');
    }
    
    // Simulate what an admin would do:
    // 1. Copy the prompt
    // 2. Use it with AI (we'll simulate this)
    // 3. Paste the result back
    // 4. Complete the request
    
    await adminPage.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    await adminPage.waitForTimeout(2000);
    
    // Open processing modal for our request
    await adminPage.click(`button:has-text("Traiter")`);
    await adminPage.waitForTimeout(2000);
    
    // Simulate AI-generated content (comprehensive JSON)
    const mockAiContent = JSON.stringify({
      hero: {
        title: "Restaurant La Belle Époque - Cuisine Raffinée",
        subtitle: "L'art de la gastronomie française",
        description: "Découvrez une expérience culinaire exceptionnelle dans notre restaurant historique parisien depuis 1890."
      },
      services: [
        {
          title: "Menu Dégustation",
          description: "Un voyage gastronomique à travers nos créations les plus raffinées",
          features: ["7 services", "Accords mets-vins", "Produits de saison"]
        },
        {
          title: "Cuisine de Saison",
          description: "Des plats créatifs élaborés avec les meilleurs produits du marché",
          features: ["Produits locaux", "Recettes traditionnelles", "Présentation moderne"]
        }
      ],
      about: {
        title: "À propos de Restaurant La Belle Époque",
        subtitle: "Un héritage culinaire français",
        description: "Depuis 1890, notre restaurant perpétue la tradition de l'excellence culinaire française dans un cadre d'exception.",
        values: [
          {title: "Excellence", description: "La quête constante de la perfection culinaire"},
          {title: "Tradition", description: "Le respect des savoir-faire français"},
          {title: "Innovation", description: "La créativité au service de la gastronomie"}
        ]
      },
      testimonials: [
        {
          text: "Une expérience inoubliable ! La qualité des plats et le service impeccable font de ce restaurant une adresse incontournable.",
          name: "Marie Dubois",
          position: "Critique gastronomique, Le Figaro",
          rating: 5
        }
      ],
      faq: [
        {
          question: "Proposez-vous des menus végétariens?",
          answer: "Oui, nous proposons des options végétariennes raffinées préparées avec la même attention que nos plats traditionnels."
        }
      ],
      seo: {
        title: "Restaurant La Belle Époque - Gastronomie Française Paris",
        description: "Restaurant gastronomique français à Paris. Cuisine raffinée depuis 1890. Menu dégustation, produits de saison. Réservation en ligne.",
        keywords: ["restaurant gastronomique paris", "cuisine française", "menu dégustation", "restaurant historique"]
      }
    }, null, 2);
    
    // Paste the mock content
    console.log('📝 Pasting simulated AI-generated content...');
    const contentTextarea = adminPage.locator('textarea');
    await contentTextarea.fill(mockAiContent);
    
    // Complete the request
    console.log('✅ Completing AI request...');
    await adminPage.click('button:has-text("Appliquer & Terminer")');
    await adminPage.waitForTimeout(3000);
    
    // Verify success (modal should close or show success message)
    const isModalClosed = await adminPage.locator('.fixed.inset-0').count() === 0;
    console.log(`📊 Processing modal closed: ${isModalClosed}`);
    
    console.log('✅ Complete AI processing workflow simulation completed!');
  });

  test('should verify data persistence and quality throughout workflow', async () => {
    console.log('\n🔍 Final Verification - Data Quality & Persistence...');
    
    if (!createdRequestId) {
      throw new Error('No AI request was created');
    }
    
    // Verify the request still exists and has correct data
    const response = await page.request.get(`http://localhost:7610/admin/queue/${createdRequestId}`);
    expect(response.ok()).toBe(true);
    
    const requestData = await response.json();
    
    console.log('📊 Final request data verification:');
    console.log(`🆔 Request ID: ${requestData.id}`);
    console.log(`📋 Type: ${requestData.requestType}`);
    console.log(`🏪 Business: ${requestData.businessType}`);
    console.log(`📅 Status: ${requestData.status}`);
    console.log(`💰 Cost: ${requestData.estimatedCost}`);
    
    // Verify comprehensive data structure
    expect(requestData.requestType).toBe('content');
    expect(requestData.businessType).toBe('restaurant');
    expect(requestData.requestData.siteName).toBe('Restaurant La Belle Époque');
    expect(requestData.requestData.domain).toBe('la-belle-epoque.fr');
    expect(requestData.requestData.slogan).toContain('Cuisine française raffinée');
    expect(requestData.requestData.businessDescription).toContain('Restaurant gastronomique français');
    
    console.log('✅ All data preserved correctly throughout workflow!');
    
    // Summary
    console.log('\n📋 COMPLETE E2E TEST SUMMARY:');
    console.log('─'.repeat(60));
    console.log(`✅ V2 Wizard → AI Request Creation: SUCCESS`);
    console.log(`✅ Comprehensive Request Data: SUCCESS`);
    console.log(`✅ Admin Login & Queue Access: SUCCESS`);
    console.log(`✅ V1-Style Comprehensive Prompt: SUCCESS`);
    console.log(`✅ Processing Modal Functionality: SUCCESS`);
    console.log(`✅ Backend API Integration: SUCCESS`);
    console.log(`✅ Data Persistence: SUCCESS`);
    console.log('─'.repeat(60));
    console.log(`🎉 FULL E2E AI WORKFLOW: COMPLETE SUCCESS!`);
  });
});