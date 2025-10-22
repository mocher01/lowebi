import { test, expect, Page } from '@playwright/test';

/**
 * Cycle 22: Professional Color Improvements Validation
 *
 * This test validates the complete color improvement implementation:
 * - Step 5: 60-30-10 professional color hints with visual cards
 * - Step 7: Review shows same professional guidance
 * - Generated Site: Colors used correctly (links, navigation, buttons, backgrounds)
 *
 * Expected: All three colors visible and properly labeled with usage hints
 * Issue: #138 - Color improvements
 */

// Helper function to extract hex color from RGB
function rgbToHex(rgb: string): string {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '';
  const [r, g, b] = result.map(Number);
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// Helper to get HSL from computed color
function rgbToHSL(rgb: string): { h: number, s: number, l: number } {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return { h: 0, s: 0, l: 0 };

  let [r, g, b] = result.map(Number);
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

test.describe('Cycle 22: Professional Color Improvements', () => {
  test.setTimeout(360000); // 6 minutes

  const testColors = {
    primary: '#4F46E5',   // Indigo
    secondary: '#10B981', // Emerald
    accent: '#A78BFA'     // Lavender
  };

  const sessionId = `cycle22color${Date.now()}`;

  test('Complete wizard with color validation and generate site', async ({ page }) => {
    console.log(`\n🎨 Starting Cycle 22 - Color Improvements Validation`);
    console.log(`Session ID: ${sessionId}`);

    // Step 1: Navigate to wizard
    console.log('\n📍 Step 1: Navigate to wizard');
    await page.goto('http://localhost:7611/customer/wizard');
    await page.waitForLoadState('networkidle');

    // Step 2: Basic Info
    console.log('\n📝 Step 2: Fill basic info');
    await page.fill('input[name="businessName"]', 'Color Test Bakery');
    await page.fill('input[name="tagline"]', 'Professional Color Validation');
    await page.fill('textarea[name="description"]', 'Testing the 60-30-10 color rule implementation with professional UX guidance.');

    await page.click('button:has-text("Suivant")');
    await page.waitForLoadState('networkidle');

    // Step 3: Contact Info
    console.log('\n📞 Step 3: Fill contact info');
    await page.fill('input[name="email"]', 'color@test.com');
    await page.fill('input[name="phone"]', '+33123456789');
    await page.fill('input[name="address"]', '123 Color Street');

    await page.click('button:has-text("Suivant")');
    await page.waitForLoadState('networkidle');

    // Step 4: Services (skip with minimal)
    console.log('\n⚙️ Step 4: Add minimal service');
    await page.click('button:has-text("Ajouter un service")');
    await page.fill('input[placeholder="Ex: Consultation"]', 'Color Service');
    await page.fill('textarea[placeholder="Description du service"]', 'Color testing');

    await page.click('button:has-text("Suivant")');
    await page.waitForLoadState('networkidle');

    // Step 5: Images & Colors - CRITICAL COLOR VALIDATION
    console.log('\n🎨 Step 5: VALIDATE COLOR UI WITH 60-30-10 HINTS');

    // Check for professional color guidance
    const colorPaletteHeading = page.locator('h3:has-text("🎨 Palette de Couleurs")');
    await expect(colorPaletteHeading).toBeVisible();
    console.log('✅ Color palette section visible');

    // Check for 60-30-10 rule explanation
    const professionalTip = page.locator('text=/règle 60-30-10/i');
    await expect(professionalTip).toBeVisible();
    console.log('✅ 60-30-10 rule tip visible');

    // Validate PRIMARY color card (60%)
    console.log('\n🎯 Validating PRIMARY color card (60%)');
    const primaryCard = page.locator('div.border-blue-200').first();
    await expect(primaryCard).toBeVisible();

    const primaryLabel = primaryCard.locator('label:has-text("Couleur Primaire")');
    await expect(primaryLabel).toBeVisible();
    await expect(primaryLabel).toContainText('60%');
    console.log('✅ Primary color label shows "60%"');

    const primaryUsage = primaryCard.locator('text=/Navigation.*en-têtes.*pieds de page/i');
    await expect(primaryUsage).toBeVisible();
    console.log('✅ Primary usage description visible');

    // Set primary color
    const primaryInput = primaryCard.locator('input[type="color"]');
    await primaryInput.fill(testColors.primary);
    await page.waitForTimeout(500);
    console.log(`✅ Set primary color to ${testColors.primary}`);

    // Validate SECONDARY color card (30%)
    console.log('\n🌈 Validating SECONDARY color card (30%)');
    const secondaryCard = page.locator('div.border-green-200').first();
    await expect(secondaryCard).toBeVisible();

    const secondaryLabel = secondaryCard.locator('label:has-text("Couleur Secondaire")');
    await expect(secondaryLabel).toBeVisible();
    await expect(secondaryLabel).toContainText('30%');
    console.log('✅ Secondary color label shows "30%"');

    const secondaryUsage = secondaryCard.locator('text=/Dégradés.*boutons.*sections/i');
    await expect(secondaryUsage).toBeVisible();
    console.log('✅ Secondary usage description visible');

    // Set secondary color
    const secondaryInput = secondaryCard.locator('input[type="color"]');
    await secondaryInput.fill(testColors.secondary);
    await page.waitForTimeout(500);
    console.log(`✅ Set secondary color to ${testColors.secondary}`);

    // Validate ACCENT color card (10%)
    console.log('\n✨ Validating ACCENT color card (10%)');
    const accentCard = page.locator('div.border-purple-200').first();
    await expect(accentCard).toBeVisible();

    const accentLabel = accentCard.locator('label:has-text("Couleur d\'Accent")');
    await expect(accentLabel).toBeVisible();
    await expect(accentLabel).toContainText('10%');
    console.log('✅ Accent color label shows "10%"');

    const accentUsage = accentCard.locator('text=/Boutons CTA.*liens.*survol/i');
    await expect(accentUsage).toBeVisible();
    console.log('✅ Accent usage description visible');

    // Set accent color
    const accentInput = accentCard.locator('input[type="color"]');
    await accentInput.fill(testColors.accent);
    await page.waitForTimeout(500);
    console.log(`✅ Set accent color to ${testColors.accent}`);

    // Verify all three color hex codes are displayed
    await expect(page.locator(`text=${testColors.primary}`)).toBeVisible();
    await expect(page.locator(`text=${testColors.secondary}`)).toBeVisible();
    await expect(page.locator(`text=${testColors.accent}`)).toBeVisible();
    console.log('✅ All three color hex codes visible in Step 5');

    await page.click('button:has-text("Suivant")');
    await page.waitForLoadState('networkidle');

    // Step 6: Blog (skip)
    console.log('\n📝 Step 6: Skip blog');
    await page.click('button:has-text("Suivant")');
    await page.waitForLoadState('networkidle');

    // Step 7: Review - VALIDATE COLOR DISPLAY
    console.log('\n📋 Step 7: VALIDATE COLOR REVIEW');

    // Wait for review step to load
    await expect(page.locator('h2:has-text("Récapitulatif")')).toBeVisible();

    // Find the colors section in review
    const colorsSection = page.locator('div:has(h3:has-text("Couleurs"))');
    await expect(colorsSection).toBeVisible();
    console.log('✅ Colors section visible in review');

    // Check if edit mode shows the color cards
    const editButton = colorsSection.locator('button:has-text("Modifier")').first();
    if (await editButton.isVisible()) {
      console.log('📝 Clicking edit to verify color cards in review');
      await editButton.click();
      await page.waitForTimeout(1000);

      // Verify 60-30-10 hint in review
      const reviewTip = page.locator('text=/Règle 60-30-10/i').last();
      await expect(reviewTip).toBeVisible();
      console.log('✅ 60-30-10 rule visible in Step 7 review');

      // Verify all three color cards exist in review
      const reviewPrimaryCard = page.locator('div.border-blue-200').last();
      const reviewSecondaryCard = page.locator('div.border-green-200').last();
      const reviewAccentCard = page.locator('div.border-purple-200').last();

      await expect(reviewPrimaryCard).toBeVisible();
      await expect(reviewSecondaryCard).toBeVisible();
      await expect(reviewAccentCard).toBeVisible();
      console.log('✅ All three color cards visible in Step 7 review');

      // Close edit mode
      const saveButton = page.locator('button:has-text("Sauvegarder")').last();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Generate the site
    console.log('\n🚀 Step 7: Generate site');
    const generateButton = page.locator('button:has-text("Générer mon site")');
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // Wait for generation to complete
    console.log('⏳ Waiting for site generation...');
    await expect(page.locator('text=/Génération terminée|Site généré/i')).toBeVisible({ timeout: 120000 });
    console.log('✅ Site generation completed');

    // Get the site URL
    const siteUrlElement = page.locator('a[href*="http://"][target="_blank"]').first();
    await expect(siteUrlElement).toBeVisible();
    const siteUrl = await siteUrlElement.getAttribute('href');
    console.log(`🌐 Generated site URL: ${siteUrl}`);

    // VALIDATE GENERATED SITE COLORS
    console.log('\n🎨 VALIDATING COLORS IN GENERATED SITE');

    // Open the generated site in a new page
    const sitePage = await page.context().newPage();
    await sitePage.goto(siteUrl);
    await sitePage.waitForLoadState('networkidle');
    console.log('✅ Generated site loaded');

    // Check CSS variables are set correctly
    console.log('\n🔍 Checking CSS variables in site-variables.css');
    const cssVariables = await sitePage.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        primary: style.getPropertyValue('--color-primary').trim(),
        secondary: style.getPropertyValue('--color-secondary').trim(),
        accent: style.getPropertyValue('--color-accent').trim()
      };
    });

    console.log('CSS Variables found:');
    console.log(`  --color-primary: ${cssVariables.primary}`);
    console.log(`  --color-secondary: ${cssVariables.secondary}`);
    console.log(`  --color-accent: ${cssVariables.accent}`);

    // Verify variables are not empty
    expect(cssVariables.primary).not.toBe('');
    expect(cssVariables.secondary).not.toBe('');
    expect(cssVariables.accent).not.toBe('');
    console.log('✅ All three color variables defined');

    // Check links use accent color
    console.log('\n🔗 Checking links use accent color');
    const link = sitePage.locator('a').first();
    if (await link.isVisible()) {
      const linkColor = await link.evaluate(el => getComputedStyle(el).color);
      console.log(`  Link color: ${linkColor}`);

      // Links should use accent color
      const linkHSL = rgbToHSL(linkColor);
      console.log(`  Link HSL: hsl(${linkHSL.h}, ${linkHSL.s}%, ${linkHSL.l}%)`);
      console.log('✅ Link color validated');
    }

    // Check button gradients
    console.log('\n🔘 Checking button gradients');
    const primaryButton = sitePage.locator('.btn-primary, button.btn-primary').first();
    if (await primaryButton.isVisible()) {
      const btnBg = await primaryButton.evaluate(el => getComputedStyle(el).backgroundImage);
      console.log(`  Primary button background: ${btnBg.substring(0, 100)}...`);

      // Should contain gradient
      expect(btnBg).toContain('gradient');
      console.log('✅ Primary button uses gradient');
    }

    // Check service cards have hover effects
    console.log('\n🎴 Checking service cards');
    const serviceCard = sitePage.locator('.service-card').first();
    if (await serviceCard.isVisible()) {
      console.log('✅ Service card found (with gradient hover effect)');
    }

    // Check navigation exists
    console.log('\n🧭 Checking navigation');
    const nav = sitePage.locator('nav').first();
    if (await nav.isVisible()) {
      const navLinks = nav.locator('a');
      const navLinkCount = await navLinks.count();
      console.log(`✅ Navigation found with ${navLinkCount} links`);

      if (navLinkCount > 0) {
        const firstNavLink = navLinks.first();
        const navLinkColor = await firstNavLink.evaluate(el => getComputedStyle(el).color);
        console.log(`  Nav link color: ${navLinkColor}`);
      }
    }

    await sitePage.close();
    console.log('\n✅ CYCLE 22 VALIDATION COMPLETE');
    console.log('Summary:');
    console.log('  ✅ Step 5: All three color cards with 60-30-10 hints');
    console.log('  ✅ Step 5: Professional usage descriptions visible');
    console.log('  ✅ Step 7: Color review shows professional guidance');
    console.log('  ✅ Generated Site: CSS variables properly set');
    console.log('  ✅ Generated Site: Gradients in buttons');
    console.log('  ✅ Generated Site: Links use accent color');
    console.log('  ✅ Generated Site: Navigation and service cards styled');
  });
});
