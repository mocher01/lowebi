import { test, expect } from '@playwright/test';

const WIZARD_BASE_URL = 'https://logen.locod-ai.com/wizard-v2';

test('Simple Step Validation', async ({ page }) => {
  await page.goto(WIZARD_BASE_URL, { waitUntil: 'networkidle' });

  // Check step counter shows "Étape 1 sur 7"
  const stepCounter = page.locator('text=Étape 1 sur 7');
  await expect(stepCounter).toBeVisible({ timeout: 10000 });

  // Check all 7 step titles exist in DOM
  const expectedTitles = [
    'Bienvenue',
    'Modèle', 
    'Informations',
    'Contenu',
    'Images',
    'Fonctionnalités',
    'Révision & Création'
  ];

  console.log('🔍 Checking for 7 correct step titles...');
  
  for (let i = 0; i < expectedTitles.length; i++) {
    const title = expectedTitles[i];
    const element = page.locator(`text=${title}`).first();
    await expect(element).toBeVisible({ timeout: 3000 });
    console.log(`✅ Step ${i + 1}: "${title}" found`);
  }

  // Explicitly check that OLD step names are NOT present
  const oldNames = [
    'Bienvenue & Conditions',
    'Sélection de Modèle',
    'Informations Business', 
    'Image & Logo',
    'Contenu & Services',
    'Révision du Contenu',
    'Fonctionnalités Avancées'
  ];

  console.log('🚫 Checking that old 8-step names are NOT present...');
  
  for (const oldName of oldNames) {
    const element = page.locator(`text=${oldName}`);
    const count = await element.count();
    expect(count).toBe(0);
    console.log(`✅ Old name "${oldName}" not found (good!)`);
  }

  console.log('🎉 All validation passed - 7 correct steps, no old names!');
});