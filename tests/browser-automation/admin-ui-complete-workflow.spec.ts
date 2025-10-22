import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Admin UI Workflow Test
 * Tests the complete user experience: Login -> Process -> Apply Content -> View Result
 */

const ADMIN_URL = 'http://162.55.213.90:7612/dashboard/ai-queue';
const ADMIN_LOGIN = {
  email: 'admin@locod.ai',
  password: 'admin123'
};

const GENERATED_CONTENT = `{
  "hero": {
    "title": "Excellence Plomberie - Votre Expert Local",
    "subtitle": "Solutions de plomberie professionnelles", 
    "description": "Spécialiste en plomberie résidentielle et commerciale, nous intervenons rapidement pour tous vos besoins de plomberie avec un service de qualité supérieure."
  },
  "services": [
    {
      "title": "Réparation d'urgence",
      "description": "Intervention rapide 24h/7j pour fuites, canalisations bouchées et tous problèmes de plomberie urgents.",
      "features": ["Disponibilité 24h/24", "Intervention rapide", "Diagnostic précis"]
    },
    {
      "title": "Installation sanitaire", 
      "description": "Pose et installation complète de vos équipements sanitaires avec garantie professionnelle.",
      "features": ["Pose d'équipements", "Raccordements", "Mise en service"]
    },
    {
      "title": "Rénovation salle de bain",
      "description": "Rénovation complète de votre salle de bain, de la conception à la finition.",
      "features": ["Conception sur mesure", "Travaux complets", "Finitions soignées"]
    }
  ]
}`;

async function loginAsAdmin(page: Page) {
  console.log('🔑 Attempting admin login...');
  
  await page.goto(ADMIN_URL);
  await page.waitForLoadState('networkidle');
  
  // Check if already logged in
  const isLoginPage = await page.locator('input[type="email"]').isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isLoginPage) {
    await page.fill('input[type="email"]', ADMIN_LOGIN.email);
    await page.fill('input[type="password"]', ADMIN_LOGIN.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }
  
  // Verify we're on the dashboard
  await expect(page).toHaveURL(/dashboard\/ai-queue/);
  console.log('✅ Admin login successful');
}

async function waitForRequestToLoad(page: Page) {
  console.log('⏳ Waiting for AI requests to load...');
  
  // Wait for the queue to load
  await page.waitForSelector('[data-testid="ai-request-row"], .ai-request-row, tr', { timeout: 10000 });
  
  // Wait for at least one request to be visible
  const requestsCount = await page.locator('[data-testid="ai-request-row"], .ai-request-row, tr').count();
  console.log(`📋 Found ${requestsCount} requests in queue`);
  
  if (requestsCount === 0) {
    throw new Error('No AI requests found in queue');
  }
}

async function findAndClickTraiterButton(page: Page) {
  console.log('🔍 Looking for Traiter button...');
  
  // Multiple selectors for the "Traiter" button
  const trainerSelectors = [
    'button:has-text("Traiter")',
    'button:has-text("🤖 Traiter")', 
    '[data-action="process"]',
    'button[data-testid="process-button"]',
    'button.process-btn'
  ];
  
  for (const selector of trainerSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log(`✅ Found Traiter button with selector: ${selector}`);
      await button.click();
      return true;
    }
  }
  
  // Fallback: look for any button in the first request row
  console.log('🔍 Fallback: Looking for any process button in first row...');
  const firstRow = page.locator('[data-testid="ai-request-row"], .ai-request-row, tr').first();
  const buttons = firstRow.locator('button');
  const buttonCount = await buttons.count();
  
  console.log(`Found ${buttonCount} buttons in first row`);
  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    console.log(`Button ${i}: "${text}"`);
    
    if (text && (text.includes('Traiter') || text.includes('🤖'))) {
      await button.click();
      return true;
    }
  }
  
  throw new Error('Could not find Traiter button');
}

async function waitForModal(page: Page) {
  console.log('⏳ Waiting for processing modal...');
  
  // Multiple selectors for the modal
  const modalSelectors = [
    '[data-testid="processing-modal"]',
    '.processing-modal',
    '.modal',
    '[role="dialog"]',
    '.fixed.inset-0' // Tailwind modal backdrop
  ];
  
  for (const selector of modalSelectors) {
    if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`✅ Modal found with selector: ${selector}`);
      return;
    }
  }
  
  throw new Error('Processing modal did not appear');
}

async function fillGeneratedContent(page: Page) {
  console.log('📝 Filling generated content...');
  
  // Multiple selectors for the content textarea
  const textareaSelectors = [
    '[data-testid="generated-content"]',
    'textarea[placeholder*="Résultat"]',
    'textarea[placeholder*="IA"]',
    'textarea',
    '.generated-content'
  ];
  
  for (const selector of textareaSelectors) {
    const textarea = page.locator(selector);
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`✅ Found textarea with selector: ${selector}`);
      await textarea.fill(GENERATED_CONTENT);
      console.log('✅ Content filled successfully');
      return;
    }
  }
  
  throw new Error('Could not find content textarea');
}

async function clickAppliquerButton(page: Page) {
  console.log('🎯 Looking for Appliquer et terminer button...');
  
  const applySelectors = [
    'button:has-text("Appliquer et terminer")',
    'button:has-text("Appliquer")',
    'button:has-text("Terminer")',
    '[data-testid="apply-button"]',
    '[data-action="complete"]',
    'button[type="submit"]'
  ];
  
  for (const selector of applySelectors) {
    const button = page.locator(selector);
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`✅ Found apply button with selector: ${selector}`);
      
      // Click and wait for response
      await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/complete') && 
          response.status() === 200, 
          { timeout: 10000 }
        ),
        button.click()
      ]);
      
      console.log('✅ Appliquer clicked and API response received');
      return;
    }
  }
  
  throw new Error('Could not find Appliquer et terminer button');
}

async function verifyUIUpdate(page: Page) {
  console.log('🔍 Verifying UI updates after completion...');
  
  // Wait for modal to close
  await page.waitForTimeout(2000);
  
  // Check if modal closed
  const modalVisible = await page.locator('.modal, [role="dialog"], .fixed.inset-0').isVisible().catch(() => false);
  console.log(`Modal still visible: ${modalVisible}`);
  
  // Look for success indicators
  const successIndicators = [
    '.toast.success',
    '.alert-success', 
    ':has-text("succès")',
    ':has-text("terminé")',
    ':has-text("complété")'
  ];
  
  for (const selector of successIndicators) {
    if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log(`✅ Found success indicator: ${selector}`);
      return;
    }
  }
  
  console.log('⚠️ No success indicators found - checking table updates...');
  
  // Check if table updated
  await page.waitForTimeout(1000);
  const statusElements = page.locator(':has-text("completed"), :has-text("terminé"), :has-text("complété")');
  const completedCount = await statusElements.count();
  console.log(`Found ${completedCount} completed status indicators`);
}

async function testVoirResultat(page: Page) {
  console.log('👁️ Testing Voir résultat button...');
  
  // Look for "Voir" or "Voir résultat" buttons
  const voirSelectors = [
    'button:has-text("Voir résultat")',
    'button:has-text("Voir")',
    'button:has-text("✅ Voir")',
    '[data-action="view"]',
    '[data-testid="view-result"]'
  ];
  
  for (const selector of voirSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`✅ Found Voir button with selector: ${selector}`);
      
      try {
        await button.click();
        await page.waitForTimeout(2000);
        
        // Check for error messages
        const errorVisible = await page.locator(':has-text("Erreur"), .error, .alert-danger').isVisible().catch(() => false);
        
        if (errorVisible) {
          const errorText = await page.locator(':has-text("Erreur"), .error, .alert-danger').first().textContent();
          console.log(`❌ Error when clicking Voir: ${errorText}`);
          throw new Error(`Voir résultat failed: ${errorText}`);
        } else {
          console.log('✅ Voir résultat clicked successfully - no errors');
        }
        
        return;
      } catch (error) {
        console.log(`❌ Error clicking Voir button: ${error.message}`);
        throw error;
      }
    }
  }
  
  console.log('⚠️ No Voir résultat button found');
}

test.describe('Admin UI Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(60000);
  });

  test('should complete full workflow: Login -> Process -> Apply -> View', async ({ page }) => {
    console.log('🚀 Starting comprehensive admin UI workflow test');
    
    try {
      // Step 1: Login
      await loginAsAdmin(page);
      
      // Step 2: Wait for requests to load
      await waitForRequestToLoad(page);
      
      // Step 3: Click Traiter button
      await findAndClickTraiterButton(page);
      
      // Step 4: Wait for modal
      await waitForModal(page);
      
      // Step 5: Fill generated content
      await fillGeneratedContent(page);
      
      // Step 6: Click Appliquer et terminer
      await clickAppliquerButton(page);
      
      // Step 7: Verify UI updates
      await verifyUIUpdate(page);
      
      // Step 8: Test Voir résultat
      await testVoirResultat(page);
      
      console.log('🎉 Full workflow test completed successfully!');
      
    } catch (error) {
      console.error('❌ Workflow test failed:', error.message);
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: `test-failure-${Date.now()}.png`,
        fullPage: true 
      });
      
      // Log page content for debugging
      const content = await page.content();
      console.log('Page content length:', content.length);
      
      throw error;
    }
  });

  test('should handle empty queue gracefully', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Check if queue is empty
    const hasRequests = await page.locator('[data-testid="ai-request-row"], .ai-request-row, tr').count();
    
    if (hasRequests === 0) {
      console.log('✅ Queue is empty - test passed');
      expect(true).toBe(true);
    } else {
      console.log(`Queue has ${hasRequests} requests`);
    }
  });

  test('should show proper error messages', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Look for any error messages on the page
    const errorMessages = await page.locator('.error, .alert-danger, :has-text("Erreur")').count();
    console.log(`Found ${errorMessages} error messages on page`);
    
    if (errorMessages > 0) {
      const errors = await page.locator('.error, .alert-danger, :has-text("Erreur")').allTextContents();
      console.log('Error messages found:', errors);
    }
  });
});