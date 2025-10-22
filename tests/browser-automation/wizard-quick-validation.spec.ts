import { test, expect } from '@playwright/test';

/**
 * Quick V2 Wizard Validation Test
 * Simple test to validate basic wizard functionality
 */

const WIZARD_BASE_URL = 'https://logen.locod-ai.com/wizard-v2';

test('V2 Wizard - Quick Validation', async ({ page }) => {
  // Navigate to wizard
  await page.goto(WIZARD_BASE_URL, { waitUntil: 'networkidle' });

  // Check if page loads
  await expect(page).toHaveTitle(/Website Generator v2/);

  // Check for main wizard heading
  const heading = page.locator('h1:has-text("Assistant de Création de Site Locod.AI")');
  await expect(heading).toBeVisible({ timeout: 10000 });

  // Check if we can see step counter
  const stepCounter = page.locator('text=Étape 1 sur 7');
  await expect(stepCounter).toBeVisible({ timeout: 5000 });

  // Check if "Commencer" button is present (even if disabled)
  const startButton = page.locator('button:has-text("Commencer")');
  await expect(startButton).toBeVisible({ timeout: 5000 });

  // Check if all 7 step titles are present in the DOM
  const stepTitles = [
    'Bienvenue',
    'Modèle', 
    'Informations',
    'Contenu',
    'Images',
    'Fonctionnalités',
    'Révision & Création'
  ];

  for (const title of stepTitles) {
    const titleElement = page.locator(`text=${title}`).first();
    await expect(titleElement).toBeVisible({ timeout: 3000 });
  }

  console.log('✅ V2 Wizard basic validation passed');
});