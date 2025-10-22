import { test, expect } from '@playwright/test';

test.describe('Issue #153 - Domain Management Simple Tests', () => {

  test('Test 1: Verify domain selector is visible in wizard step 2', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 1: Verify domain selector visibility in Step 2');

    // Login (from cycle18)
    console.log('🔐 Step 1: Authentication...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Customer login successful');

    // Navigate to My Sites
    console.log('🏠 Step 2: Navigate to My Sites...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(3000);
    console.log('✅ On My Sites page');

    // Create New Site (following cycle18 pattern)
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

    // Navigate to Step 2
    console.log('📋 Step 4: Navigate to Step 2 (Business Info)...');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(2000);

    // Verify we're on Business Info step
    const businessInfoHeader = await page.locator('h2:has-text("Informations sur votre Entreprise")');
    await expect(businessInfoHeader).toBeVisible({ timeout: 5000 });
    console.log('✅ On Business Info step (Step 2)');

    // Verify domain section is visible
    const domainSection = page.locator('h3:has-text("Choisissez votre domaine")');
    await expect(domainSection).toBeVisible({ timeout: 5000 });
    console.log('✅ Domain section is visible');

    // Verify subdomain option is visible
    const subdomainOption = page.locator('button:has-text("Sous-domaine")');
    await expect(subdomainOption).toBeVisible({ timeout: 3000 });
    console.log('✅ Subdomain option is visible');

    // Verify it shows "Gratuit" badge
    const gratuitBadge = page.locator('span:has-text("Gratuit")');
    await expect(gratuitBadge).toBeVisible({ timeout: 2000 });
    console.log('✅ "Gratuit" badge is visible');

    // Verify custom domain option is visible
    const customDomainOption = page.locator('button:has-text("Domaine personnalisé")');
    await expect(customDomainOption).toBeVisible({ timeout: 3000 });
    console.log('✅ Custom domain option is visible');

    // Verify it shows "Premium" badge
    const premiumBadge = page.locator('span:has-text("Premium")');
    await expect(premiumBadge).toBeVisible({ timeout: 2000 });
    console.log('✅ "Premium" badge is visible');

    console.log('🎉 Test 1 passed!');
  });
});
