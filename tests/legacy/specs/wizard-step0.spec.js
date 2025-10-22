/**
 * 🎯 Wizard Step 0 - Welcome & Terms Test (v1.1.1.9.2.4.1.2)
 * 
 * Tests Issue #30: Wizard Welcome & Terms Acceptance Screen
 */

const { test, expect } = require('@playwright/test');

const PRODUCTION_BASE_URL = 'http://162.55.213.90:3080';
const WIZARD_URL = `${PRODUCTION_BASE_URL}/wizard`;

test.describe('🧙‍♂️ Wizard Step 0 - Welcome & Terms - Issue #30', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(WIZARD_URL);
        await page.waitForTimeout(3000); // Wait for Alpine.js
    });

    test('Navigation Context - Should load wizard correctly', async ({ page }) => {
        console.log('🔍 Testing navigation context...');
        
        // Check URL
        expect(page.url()).toBe(WIZARD_URL);
        
        // Check header
        const header = page.locator('h1');
        await expect(header).toContainText('Assistant de Création de Site Locod.AI');
        
        console.log('✅ Navigation context validated');
    });

    test('Enhanced Progress Indicator - Should show professional design', async ({ page }) => {
        console.log('🔍 Testing enhanced progress indicator...');
        
        // Check step counter (dynamically generated)
        const stepCounter = page.locator('span').filter({ hasText: /Étape.*sur 8/ });
        await expect(stepCounter).toBeVisible();
        
        // Check visual progress bar
        const progressBar = page.locator('.bg-blue-600.h-2.rounded-full');
        await expect(progressBar).toBeVisible();
        
        // Progress should be 12.5% (1/8) - check if style contains width calculation
        const progressStyle = await progressBar.getAttribute('style');
        expect(progressStyle).toMatch(/width.*12\.5%|width.*1[0-9]%/);
        
        // Check step circles
        const stepCircles = page.locator('.w-12.h-12.rounded-full');
        const circleCount = await stepCircles.count();
        expect(circleCount).toBe(8);
        
        // Check active step (first circle should be blue)
        const activeCircle = stepCircles.first();
        await expect(activeCircle).toHaveClass(/bg-blue-600/);
        
        // Check step labels - be more specific to avoid duplicates
        await expect(page.locator('.max-w-20 span').filter({ hasText: 'Bienvenue' })).toBeVisible();
        await expect(page.locator('.max-w-20 span').filter({ hasText: 'Modèle' })).toBeVisible();
        await expect(page.locator('.max-w-20 span').filter({ hasText: 'Informations' })).toBeVisible();
        
        console.log('✅ Enhanced progress indicator validated');
    });

    test('Welcome Content - Should display correct French content', async ({ page }) => {
        console.log('🔍 Testing welcome content...');
        
        // Wait for Alpine.js to load content
        await page.waitForTimeout(2000);
        
        // Check main title (with x-text)
        const title = page.locator('h2[x-text="text.welcome.title"]');
        await expect(title).toBeVisible();
        
        // Check subtitle (with x-text)
        const subtitle = page.locator('p[x-text="text.welcome.subtitle"]');
        await expect(subtitle).toBeVisible();
        
        // Check if content is not empty (Alpine.js loaded)
        const titleContent = await title.textContent();
        expect(titleContent).toBeTruthy();
        expect(titleContent).not.toBe('');
        
        console.log('✅ Welcome content validated');
    });

    test('Site Language Selection - Should be for website language', async ({ page }) => {
        console.log('🔍 Testing site language selection...');
        
        // Check label
        const label = page.locator('text=Langue de votre site web');
        await expect(label).toBeVisible();
        
        // Check dropdown
        const languageSelect = page.locator('select[x-model="wizardData.siteLanguage"]');
        await expect(languageSelect).toBeVisible();
        
        // Check default selection (French)
        const selectedValue = await languageSelect.inputValue();
        expect(selectedValue).toBe('fr');
        
        // Check all options
        const options = languageSelect.locator('option');
        await expect(options.nth(0)).toHaveText('Français');
        await expect(options.nth(1)).toHaveText('English');
        await expect(options.nth(2)).toHaveText('Español');
        await expect(options.nth(3)).toHaveText('Deutsch');
        
        // Test changing language
        await languageSelect.selectOption('en');
        const newValue = await languageSelect.inputValue();
        expect(newValue).toBe('en');
        
        console.log('✅ Site language selection validated');
    });

    test('Terms & Conditions Section - Should have proper styling and functionality', async ({ page }) => {
        console.log('🔍 Testing terms & conditions section...');
        
        // Wait for Alpine.js content
        await page.waitForTimeout(2000);
        
        // Check gray background box - be more specific for terms section
        const termsBox = page.locator('.text-left.bg-gray-50.p-6.rounded-lg.mb-6');
        await expect(termsBox).toBeVisible();
        
        // Check title (with x-text) - be very specific for terms section
        const termsTitle = page.locator('.text-left.bg-gray-50 h3');
        await expect(termsTitle).toBeVisible();
        
        // Check bullet points (li elements in terms section only)
        const bulletPoints = page.locator('.text-left.bg-gray-50 ul li');
        const bulletCount = await bulletPoints.count();
        expect(bulletCount).toBeGreaterThanOrEqual(3);
        
        // Check checkbox
        const checkbox = page.locator('input[type="checkbox"][x-model="wizardData.termsAccepted"]');
        await expect(checkbox).toBeVisible();
        await expect(checkbox).not.toBeChecked();
        
        // Check checkbox label
        const checkboxLabel = page.locator('label').filter({ has: checkbox });
        await expect(checkboxLabel).toBeVisible();
        
        console.log('✅ Terms & conditions section validated');
    });

    test('Navigation Button - Should have correct disabled/enabled behavior', async ({ page }) => {
        console.log('🔍 Testing navigation button behavior...');
        
        // Wait for Alpine.js
        await page.waitForTimeout(2000);
        
        // Check button exists (with x-text)
        const commencerButton = page.locator('button[x-text="text.common.start"]');
        await expect(commencerButton).toBeVisible();
        
        // Button should be disabled initially
        await expect(commencerButton).toBeDisabled();
        await expect(commencerButton).toHaveClass(/bg-gray-300/);
        await expect(commencerButton).toHaveClass(/cursor-not-allowed/);
        
        // Check terms checkbox
        const checkbox = page.locator('input[type="checkbox"][x-model="wizardData.termsAccepted"]');
        
        // Accept terms
        await checkbox.check();
        await page.waitForTimeout(1000); // Wait for Alpine.js to update
        
        // Button should now be enabled
        await expect(commencerButton).toBeEnabled();
        await expect(commencerButton).toHaveClass(/bg-blue-600/);
        await expect(commencerButton).not.toHaveClass(/cursor-not-allowed/);
        
        console.log('✅ Navigation button behavior validated');
    });

    test('Step Navigation - Should move to Step 1 when terms accepted', async ({ page }) => {
        console.log('🔍 Testing step navigation...');
        
        // Accept terms
        const checkbox = page.locator('input[type="checkbox"][x-model="wizardData.termsAccepted"]');
        await checkbox.check();
        await page.waitForTimeout(500);
        
        // Click Commencer button
        const commencerButton = page.locator('button[x-text="text.common.start"]');
        await commencerButton.click();
        await page.waitForTimeout(1000);
        
        // Check progress updated (should show step 2)
        const stepCounter = page.locator('span').filter({ hasText: /Étape.*sur 8/ });
        await expect(stepCounter).toBeVisible();
        
        // Check progress bar updated (25% for step 2)
        const progressBar = page.locator('.bg-blue-600.h-2.rounded-full');
        const progressStyle = await progressBar.getAttribute('style');
        expect(progressStyle).toMatch(/width.*25%|width.*2[0-9]%/);
        
        // Check first step is marked as completed (green)
        const completedCircle = page.locator('.bg-green-600').first();
        await expect(completedCircle).toBeVisible();
        
        console.log('✅ Step navigation validated');
    });

    test('Responsive Design - Should work on different screen sizes', async ({ page }) => {
        console.log('🔍 Testing responsive design...');
        
        // Test desktop view
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(500);
        
        // Progress bar should be horizontal - be more specific
        const progressContainer = page.locator('.flex.justify-between.items-center.relative');
        await expect(progressContainer).toBeVisible();
        
        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Elements should still be visible and functional
        await expect(page.locator('span').filter({ hasText: /Étape.*sur 8/ })).toBeVisible();
        await expect(page.locator('text=Langue de votre site web')).toBeVisible();
        
        console.log('✅ Responsive design validated');
    });

    test('Data Persistence - Should maintain state correctly', async ({ page }) => {
        console.log('🔍 Testing data persistence...');
        
        // Change language
        const languageSelect = page.locator('select[x-model="wizardData.siteLanguage"]');
        await languageSelect.selectOption('en');
        
        // Accept terms
        const checkbox = page.locator('input[type="checkbox"][x-model="wizardData.termsAccepted"]');
        await checkbox.check();
        
        // Check values are maintained
        const langValue = await languageSelect.inputValue();
        expect(langValue).toBe('en');
        
        const isChecked = await checkbox.isChecked();
        expect(isChecked).toBe(true);
        
        console.log('✅ Data persistence validated');
    });
});