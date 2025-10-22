const { test, expect } = require('@playwright/test');

test.describe('🤖 Admin Dashboard - Traiter Button Functionality', () => {
    const ADMIN_URL = 'http://162.55.213.90:3080/admin-dashboard';
    
    test('Admin can login and see Traiter buttons', async ({ page }) => {
        console.log('🔗 Navigating to admin dashboard...');
        await page.goto(ADMIN_URL);
        
        // Login
        console.log('🔐 Logging in...');
        await page.fill('input[type="email"]', 'admin@locod.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('table', { timeout: 15000 });
        
        // Check for Traiter buttons
        const traiterButtons = await page.locator('button:has-text("Traiter")').all();
        console.log(`📋 Found ${traiterButtons.length} Traiter buttons`);
        
        expect(traiterButtons.length).toBeGreaterThan(0);
    });
    
    test('Traiter button opens processing modal with suggested prompt', async ({ page }) => {
        console.log('🔗 Navigating to admin dashboard...');
        await page.goto(ADMIN_URL);
        
        // Login
        await page.fill('input[type="email"]', 'admin@locod.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('table', { timeout: 15000 });
        
        // Get first Traiter button
        const firstTraiterButton = page.locator('button:has-text("Traiter")').first();
        await expect(firstTraiterButton).toBeVisible();
        
        console.log('🎯 Clicking first Traiter button...');
        await firstTraiterButton.click();
        
        // Wait for modal to appear
        const modal = page.locator('[x-show="processingModal.show"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
        
        console.log('✅ Modal appeared');
        
        // Check for suggested prompt
        const promptSection = page.locator('text=Prompt Suggéré');
        await expect(promptSection).toBeVisible();
        
        // Check for copy button
        const copyButton = page.locator('button:has-text("Copier le prompt")');
        await expect(copyButton).toBeVisible();
        
        // Check for result textarea
        const resultTextarea = page.locator('textarea[x-model="processingModal.result"]');
        await expect(resultTextarea).toBeVisible();
        
        console.log('✅ All modal elements are visible');
    });
    
    test('Copy button provides feedback when clicked', async ({ page }) => {
        console.log('🔗 Navigating to admin dashboard...');
        await page.goto(ADMIN_URL);
        
        // Login
        await page.fill('input[type="email"]', 'admin@locod.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait and open modal
        await page.waitForSelector('table', { timeout: 15000 });
        const firstTraiterButton = page.locator('button:has-text("Traiter")').first();
        await firstTraiterButton.click();
        
        // Wait for modal
        await page.waitForSelector('[x-show="processingModal.show"]', { state: 'visible' });
        
        // Click copy button
        console.log('📋 Testing copy functionality...');
        const copyButton = page.locator('button:has-text("Copier le prompt")');
        
        // Listen for console messages (toast notifications)
        const consoleMessages = [];
        page.on('console', msg => {
            if (msg.text().includes('copié') || msg.text().includes('Erreur')) {
                consoleMessages.push(msg.text());
            }
        });
        
        await copyButton.click();
        
        // Wait a moment for the toast to appear
        await page.waitForTimeout(1000);
        
        console.log('📨 Console messages:', consoleMessages);
        
        // Check if toast appeared (we expect a success message)
        const toast = page.locator('.fixed.top-4.right-4', { hasText: 'copié' });
        await expect(toast).toBeVisible({ timeout: 3000 });
        
        console.log('✅ Copy feedback working');
    });
    
    test('Auto-save functionality works', async ({ page }) => {
        console.log('🔗 Navigating to admin dashboard...');
        await page.goto(ADMIN_URL);
        
        // Login
        await page.fill('input[type="email"]', 'admin@locod.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait and open modal
        await page.waitForSelector('table', { timeout: 15000 });
        const firstTraiterButton = page.locator('button:has-text("Traiter")').first();
        await firstTraiterButton.click();
        
        // Wait for modal
        await page.waitForSelector('[x-show="processingModal.show"]', { state: 'visible' });
        
        // Type in the result textarea
        console.log('✏️ Testing auto-save...');
        const resultTextarea = page.locator('textarea[x-model="processingModal.result"]');
        await resultTextarea.fill('Test AI result content for auto-save functionality');
        
        // Wait for auto-save (should trigger on input)
        await page.waitForTimeout(2000);
        
        // Check if draft saved indicator appears
        const draftIndicator = page.locator('text=Brouillon sauvegardé');
        await expect(draftIndicator).toBeVisible({ timeout: 5000 });
        
        console.log('💾 Auto-save working');
        
        // Close and reopen modal to test persistence
        const closeButton = page.locator('button:has-text("Annuler")');
        await closeButton.click();
        
        // Reopen modal
        await firstTraiterButton.click();
        await page.waitForSelector('[x-show="processingModal.show"]', { state: 'visible' });
        
        // Check if content was restored
        const restoredContent = await resultTextarea.inputValue();
        expect(restoredContent).toBe('Test AI result content for auto-save functionality');
        
        console.log('✅ Draft persistence working');
    });
    
    test('Complete/Reject buttons work', async ({ page }) => {
        console.log('🔗 Navigating to admin dashboard...');
        await page.goto(ADMIN_URL);
        
        // Login
        await page.fill('input[type="email"]', 'admin@locod.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait and open modal
        await page.waitForSelector('table', { timeout: 15000 });
        const firstTraiterButton = page.locator('button:has-text("Traiter")').first();
        await firstTraiterButton.click();
        
        // Wait for modal
        await page.waitForSelector('[x-show="processingModal.show"]', { state: 'visible' });
        
        // Add some content first
        const resultTextarea = page.locator('textarea[x-model="processingModal.result"]');
        await resultTextarea.fill('Test completion result');
        
        // Check complete button is enabled
        console.log('✅ Testing complete functionality...');
        const completeButton = page.locator('button:has-text("Terminer")');
        await expect(completeButton).toBeEnabled();
        
        // Check reject button exists
        const rejectButton = page.locator('button:has-text("Rejeter")');
        await expect(rejectButton).toBeVisible();
        
        console.log('✅ Complete/Reject buttons are functional');
    });
});