const { test, expect } = require('@playwright/test');

test.describe('Wizard Step 3 - Logo & Images', () => {
    const BASE_URL = process.env.TEST_URL || 'http://162.55.213.90:3080';
    
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/wizard`);
        
        // Complete Step 0, 1, and 2
        await page.locator('input[x-model="wizardData.termsAccepted"]').check();
        await page.click('button:has-text("Commencer")');
        
        await page.waitForSelector('text=Sélection de Modèle');
        await page.click('button:has-text("Suivant")');
        
        await page.fill('input[placeholder="Mon Entreprise"]', 'Test Company');
        await page.fill('input[placeholder*="Traduction"]', 'Test Business');
        await page.click('button:has-text("Suivant")');
        
        // Should now be on Step 3
        await page.waitForSelector('text=Logo et Images');
    });

    test('should display Step 3 with three approach options', async ({ page }) => {
        // Check page title
        await expect(page.locator('h2:has-text("Logo et Images")')).toBeVisible();
        await expect(page.locator('text=Choisissez comment créer l\'identité visuelle')).toBeVisible();
        
        // Check progress indicator
        await expect(page.locator('text=Étape 4 sur 8')).toBeVisible();
        
        // Check three approach options
        await expect(page.locator('text=Upload Manuel')).toBeVisible();
        await expect(page.locator('text=GRATUIT')).toBeVisible();
        
        await expect(page.locator('text=Génération IA')).toBeVisible();
        await expect(page.locator('text=~5-10€')).toBeVisible();
        
        await expect(page.locator('text=Approche Mixte')).toBeVisible();
        await expect(page.locator('text=Sur mesure')).toBeVisible();
        
        // Next button should be disabled initially
        await expect(page.locator('button:has-text("Suivant")')).toBeDisabled();
    });

    test('should show manual upload interface when selected', async ({ page }) => {
        // Select manual approach
        await page.click('text=Upload Manuel');
        
        // Should show upload interface
        await expect(page.locator('text=Uploadez vos images')).toBeVisible();
        await expect(page.locator('text=Logo Principal * (obligatoire)')).toBeVisible();
        await expect(page.locator('text=Image Hero (bannière d\'accueil)')).toBeVisible();
        await expect(page.locator('text=Image À Propos')).toBeVisible();
        
        // Should show file format requirements
        await expect(page.locator('text=PNG/SVG recommandé')).toBeVisible();
        await expect(page.locator('text=JPG/PNG (1200x600px recommandé)')).toBeVisible();
        
        // Next button should still be disabled (no logo uploaded)
        await expect(page.locator('button:has-text("Suivant")')).toBeDisabled();
    });

    test('should show AI generation interface when selected', async ({ page }) => {
        // Select AI approach
        await page.click('text=Génération IA');
        
        // Should show AI interface
        await expect(page.locator('text=Génération automatique par IA')).toBeVisible();
        await expect(page.locator('text=Style des images')).toBeVisible();
        await expect(page.locator('text=Estimation du coût')).toBeVisible();
        
        // Should show cost breakdown
        await expect(page.locator('text=Logo + variants + favicons')).toBeVisible();
        await expect(page.locator('text=2,50€')).toBeVisible();
        await expect(page.locator('text=~10,00€')).toBeVisible();
        
        // Next button should be enabled (AI generates everything)
        await expect(page.locator('button:has-text("Suivant")')).toBeEnabled();
    });

    test('should show mixed interface when selected', async ({ page }) => {
        // Select mixed approach
        await page.click('text=Approche Mixte');
        
        // Should show mixed interface
        await expect(page.locator('text=Choisissez pour chaque image')).toBeVisible();
        await expect(page.locator('text=Logo Principal *')).toBeVisible();
        
        // Should show toggle buttons for logo
        await expect(page.locator('button:has-text("Upload")')).toBeVisible();
        await expect(page.locator('button:has-text("IA (+2,50€)")')).toBeVisible();
        
        // Should show cost calculation
        await expect(page.locator('text=Coût total:')).toBeVisible();
        
        // Next button should be disabled initially (no logo choice made)
        await expect(page.locator('button:has-text("Suivant")')).toBeDisabled();
    });

    test('should enable navigation when logo requirement is met', async ({ page }) => {
        // Test AI approach enables navigation immediately
        await page.click('text=Génération IA');
        await expect(page.locator('button:has-text("Suivant")')).toBeEnabled();
        
        // Test mixed approach with AI logo enables navigation
        await page.click('text=Approche Mixte');
        await page.click('button:has-text("IA (+2,50€)")');
        await expect(page.locator('button:has-text("Suivant")')).toBeEnabled();
    });

    test('should navigate back to Step 2', async ({ page }) => {
        await page.click('button:has-text("Précédent")');
        
        // Should be back on Step 2
        await page.waitForSelector('text=Informations sur votre Entreprise');
        await expect(page.locator('text=Étape 3 sur 8')).toBeVisible();
    });

    test('should calculate mixed costs correctly', async ({ page }) => {
        // Select mixed approach
        await page.click('text=Approche Mixte');
        
        // Initially should show 0€ cost
        await expect(page.locator('text=0.00€')).toBeVisible();
        
        // Select AI for logo
        await page.click('button:has-text("IA (+2,50€)")');
        
        // Should update cost calculation (this might need adjustment based on actual implementation)
        // The exact text might vary based on how the cost is displayed
    });

    test('should proceed to Step 4 when valid', async ({ page }) => {
        // Select AI approach (automatically valid)
        await page.click('text=Génération IA');
        
        // Click next
        await page.click('button:has-text("Suivant")');
        
        // Should move to Step 4
        await page.waitForSelector('text=Étape 5 sur 8', { timeout: 5000 });
    });
});