/**
 * 🎯 Portal Entry Screen Test (v1.1.1.9.2.4.1.1)
 * 
 * Tests Issue #11: Portal Main Entry Page
 */

const { test, expect } = require('@playwright/test');

const PRODUCTION_BASE_URL = 'http://162.55.213.90:3080';
const PORTAL_URL = PRODUCTION_BASE_URL;

test.describe('🏠 Portal Entry Screen - Issue #11', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(PORTAL_URL);
        await page.waitForTimeout(2000); // Wait for Alpine.js
    });

    test('Portal Header - Should display correct title and version', async ({ page }) => {
        console.log('🔍 Testing portal header...');
        
        // Check main title
        const title = page.locator('h1');
        await expect(title).toContainText('Locod.AI Customer Portal');
        
        // Check version number
        const version = page.locator('text=v1.1.1.9.2.4.1.1');
        await expect(version).toBeVisible();
        
        console.log('✅ Header validation passed');
    });

    test('Three Main Cards - Should display all three options', async ({ page }) => {
        console.log('🔍 Testing three main option cards...');
        
        // Check Assistant Guidé card
        const wizardCard = page.locator('text=Assistant Guidé').locator('..');
        await expect(wizardCard).toBeVisible();
        await expect(page.locator('text=Créez votre site étape par étape avec notre wizard interactif')).toBeVisible();
        
        // Check Mode Rapide card
        const quickCard = page.locator('text=Mode Rapide').locator('..');
        await expect(quickCard).toBeVisible();
        await expect(page.locator('text=Création rapide avec configuration minimale')).toBeVisible();
        
        // Check Administration card
        const adminCard = page.locator('text=Administration').locator('..');
        await expect(adminCard).toBeVisible();
        await expect(page.locator('text=Gérer vos sites existants, facturation et workflows')).toBeVisible();
        
        console.log('✅ All three cards are visible');
    });

    test('Assistant Guidé Card - Should have correct content and navigation', async ({ page }) => {
        console.log('🔍 Testing Assistant Guidé card...');
        
        // Check wizard icon (purple background)
        const wizardIcon = page.locator('.bg-purple-100');
        await expect(wizardIcon).toBeVisible();
        
        // Check button text and link
        const wizardButton = page.locator('a[href="/wizard"]');
        await expect(wizardButton).toContainText('Lancer l\'assistant');
        await expect(wizardButton).toHaveClass(/bg-purple-600/);
        
        console.log('✅ Assistant Guidé card validation passed');
    });

    test('Mode Rapide Card - Should show form when clicked', async ({ page }) => {
        console.log('🔍 Testing Mode Rapide card...');
        
        // Check quick mode icon (blue background)
        const quickIcon = page.locator('.bg-blue-100');
        await expect(quickIcon).toBeVisible();
        
        // Check button - be more specific to avoid conflicts
        const quickButton = page.locator('text=Mode Rapide').locator('..').locator('button').filter({ hasText: 'Commencer' });
        await expect(quickButton).toBeVisible();
        await expect(quickButton).toHaveClass(/bg-blue-600/);
        
        // Click the button
        await quickButton.click();
        await page.waitForTimeout(1000);
        
        // Check if form appears
        const form = page.locator('form');
        await expect(form).toBeVisible();
        
        // Check form title - be more specific
        await expect(page.locator('form').locator('..').locator('h2')).toContainText('Créer votre site');
        
        console.log('✅ Mode Rapide shows form correctly');
    });

    test('Administration Card - Should have correct styling and function', async ({ page }) => {
        console.log('🔍 Testing Administration card...');
        
        // Check admin icon (green background) - be more specific
        const adminIcon = page.locator('text=Administration').locator('..').locator('.bg-green-100');
        await expect(adminIcon).toBeVisible();
        
        // Check button
        const adminButton = page.locator('button').filter({ hasText: 'Accéder' });
        await expect(adminButton).toBeVisible();
        await expect(adminButton).toHaveClass(/bg-green-600/);
        
        console.log('✅ Administration card validation passed');
    });

    test('Quick Mode Form - Should have all required fields', async ({ page }) => {
        console.log('🔍 Testing Quick Mode form fields...');
        
        // Click Mode Rapide to show form
        const quickButton = page.locator('button').filter({ hasText: 'Commencer' });
        await quickButton.click();
        await page.waitForTimeout(1000);
        
        // Check required fields exist
        await expect(page.locator('input[x-model="siteForm.brandName"]')).toBeVisible();
        await expect(page.locator('input[x-model="siteForm.slogan"]')).toBeVisible();
        await expect(page.locator('select[x-model="siteForm.businessType"]')).toBeVisible();
        await expect(page.locator('input[x-model="siteForm.contact.email"]')).toBeVisible();
        
        // Check submit button
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
        
        console.log('✅ Quick Mode form has all required fields');
    });

    test('Responsive Design - Should work on different screen sizes', async ({ page }) => {
        console.log('🔍 Testing responsive design...');
        
        // Test desktop view
        await page.setViewportSize({ width: 1200, height: 800 });
        await expect(page.locator('.grid-cols-1.md\\:grid-cols-3')).toBeVisible();
        
        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Cards should still be visible on mobile
        await expect(page.locator('text=Assistant Guidé')).toBeVisible();
        await expect(page.locator('text=Mode Rapide')).toBeVisible();
        await expect(page.locator('text=Administration')).toBeVisible();
        
        console.log('✅ Responsive design works correctly');
    });

    test('Navigation - Assistant Guidé should redirect to wizard', async ({ page }) => {
        console.log('🔍 Testing navigation to wizard...');
        
        const wizardLink = page.locator('a[href="/wizard"]');
        await expect(wizardLink).toBeVisible();
        
        // Click should navigate (we'll just check the href attribute)
        const href = await wizardLink.getAttribute('href');
        expect(href).toBe('/wizard');
        
        console.log('✅ Navigation link is correct');
    });
});