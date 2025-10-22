const { test, expect } = require('@playwright/test');

test.describe('Wizard Step 2 - Business Information', () => {
    const BASE_URL = process.env.TEST_URL || 'http://162.55.213.90:3080';
    
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/wizard`);
        
        // Complete Step 0 - Welcome & Terms
        await page.locator('input[x-model="wizardData.termsAccepted"]').check();
        await page.click('button:has-text("Commencer")');
        
        // Complete Step 1 - Template Selection (auto-selected)
        await page.waitForSelector('text=Sélection de Modèle');
        await page.click('button:has-text("Suivant")');
        
        // Should now be on Step 2
        await page.waitForSelector('text=Informations sur votre Entreprise');
    });

    test('should display Step 2 form correctly', async ({ page }) => {
        // Check page title and description
        await expect(page.locator('h2:has-text("Informations sur votre Entreprise")')).toBeVisible();
        await expect(page.locator('text=Parlez-nous de votre entreprise')).toBeVisible();
        
        // Check progress indicator
        await expect(page.locator('text=Étape 3 sur 8')).toBeVisible();
        
        // Check all form fields are present
        await expect(page.locator('input[placeholder="Mon Entreprise"]')).toBeVisible();
        await expect(page.locator('input[placeholder*="Traduction"]')).toBeVisible();
        await expect(page.locator('textarea[placeholder*="Décrivez votre entreprise"]')).toBeVisible();
        await expect(page.locator('input[placeholder="mon-entreprise.com"]')).toBeVisible();
        await expect(page.locator('input[placeholder*="Phrase accrocheuse"]')).toBeVisible();
        
        // Check navigation buttons
        await expect(page.locator('button:has-text("Précédent")')).toBeVisible();
        await expect(page.locator('button:has-text("Suivant")')).toBeVisible();
        await expect(page.locator('button:has-text("Suivant")')).toBeDisabled();
    });

    test('should validate required fields', async ({ page }) => {
        const nextButton = page.locator('button:has-text("Suivant")');
        
        // Initially disabled
        await expect(nextButton).toBeDisabled();
        
        // Fill site name too short
        await page.fill('input[placeholder="Mon Entreprise"]', 'Ab');
        await page.blur('input[placeholder="Mon Entreprise"]');
        await expect(page.locator('text=doit contenir au moins 3 caractères')).toBeVisible();
        await expect(nextButton).toBeDisabled();
        
        // Fill valid site name
        await page.fill('input[placeholder="Mon Entreprise"]', 'Ma Super Entreprise');
        await page.blur('input[placeholder="Mon Entreprise"]');
        await expect(page.locator('text=doit contenir au moins 3 caractères')).not.toBeVisible();
        
        // Fill business type too short
        await page.fill('input[placeholder*="Traduction"]', 'Te');
        await expect(nextButton).toBeDisabled();
        
        // Fill valid business type
        await page.fill('input[placeholder*="Traduction"]', 'Test Business');
        await expect(nextButton).toBeEnabled();
    });

    test('should show business type suggestions', async ({ page }) => {
        const businessTypeInput = page.locator('input[placeholder*="Traduction"]');
        
        // Focus and type to trigger suggestions
        await businessTypeInput.click();
        await businessTypeInput.fill('trad');
        
        // Should show suggestions dropdown
        await expect(page.locator('.absolute.z-10')).toBeVisible();
        await expect(page.locator('text=Services de traduction')).toBeVisible();
        
        // Click on suggestion
        await page.click('text=Services de traduction');
        
        // Should close dropdown and fill input
        await expect(page.locator('.absolute.z-10')).not.toBeVisible();
        // The input should be filled with the key value (translation)
    });

    test('should validate domain format', async ({ page }) => {
        await page.fill('input[placeholder="Mon Entreprise"]', 'Test Company');
        await page.fill('input[placeholder*="Traduction"]', 'Services');
        
        // Test invalid domain
        await page.fill('input[placeholder="mon-entreprise.com"]', 'invalid-domain');
        await page.blur('input[placeholder="mon-entreprise.com"]');
        await expect(page.locator('text=Format invalide')).toBeVisible();
        await expect(page.locator('button:has-text("Suivant")')).toBeDisabled();
        
        // Test valid domain
        await page.fill('input[placeholder="mon-entreprise.com"]', 'test-company.com');
        await page.blur('input[placeholder="mon-entreprise.com"]');
        await expect(page.locator('text=Format invalide')).not.toBeVisible();
        await expect(page.locator('button:has-text("Suivant")')).toBeEnabled();
        
        // Test empty domain (should be valid as it's optional)
        await page.fill('input[placeholder="mon-entreprise.com"]', '');
        await expect(page.locator('button:has-text("Suivant")')).toBeEnabled();
    });

    test('should show character counts', async ({ page }) => {
        // Test business description character count
        await page.fill('textarea[placeholder*="Décrivez votre entreprise"]', 'Test description');
        await expect(page.locator('text=16/200 caractères')).toBeVisible();
        
        // Test slogan character count
        await page.fill('input[placeholder*="Phrase accrocheuse"]', 'Test slogan');
        await expect(page.locator('text=11/100 caractères')).toBeVisible();
    });

    test('should generate site ID preview', async ({ page }) => {
        // Fill site name
        await page.fill('input[placeholder="Mon Entreprise"]', 'Ma Super Entreprise 2024!');
        
        // Should show generated site ID
        await expect(page.locator('text=Aperçu de l\'identifiant du site')).toBeVisible();
        await expect(page.locator('code')).toContainText('ma-super-entreprise-2024');
    });

    test('should navigate to next step when valid', async ({ page }) => {
        // Fill required fields
        await page.fill('input[placeholder="Mon Entreprise"]', 'Test Company');
        await page.fill('input[placeholder*="Traduction"]', 'Translation Services');
        await page.fill('textarea[placeholder*="Décrivez votre entreprise"]', 'We provide professional translation services');
        await page.fill('input[placeholder="mon-entreprise.com"]', 'test-company.com');
        await page.fill('input[placeholder*="Phrase accrocheuse"]', 'Quality translations for everyone');
        
        // Click next
        await page.click('button:has-text("Suivant")');
        
        // Should move to Step 3
        await page.waitForSelector('text=Étape 4 sur 8', { timeout: 5000 });
    });

    test('should navigate back to Step 1', async ({ page }) => {
        // Click previous button
        await page.click('button:has-text("Précédent")');
        
        // Should be back on Step 1
        await page.waitForSelector('text=Sélection de Modèle');
        await expect(page.locator('text=Étape 2 sur 8')).toBeVisible();
    });

    test('should auto-save data', async ({ page }) => {
        // Fill some data
        await page.fill('input[placeholder="Mon Entreprise"]', 'Auto Save Test');
        await page.fill('input[placeholder*="Traduction"]', 'Testing');
        
        // Reload page
        await page.reload();
        
        // Navigate back to Step 2
        await page.locator('input[x-model="wizardData.termsAccepted"]').check();
        await page.click('button:has-text("Commencer")');
        await page.click('button:has-text("Suivant")');
        
        // Data should be preserved
        await expect(page.locator('input[placeholder="Mon Entreprise"]')).toHaveValue('Auto Save Test');
        await expect(page.locator('input[placeholder*="Traduction"]')).toHaveValue('Testing');
    });
});