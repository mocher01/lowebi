import { test, expect } from '@playwright/test';

test('Verify what user ACTUALLY sees in Step 5 color hints', async ({ page }) => {
  console.log('🔍 Vérification des hints visibles pour l\'utilisateur dans Step 5...\n');

  // 1. Start wizard
  await page.goto('http://localhost:7601/wizard?new=true');
  await page.waitForTimeout(2000);

  // 2. Navigate to Step 5 (Images & Logo)
  console.log('📍 Navigation vers Step 5...');

  // Step 1: Business Info
  await page.fill('input[name="siteName"]', 'Test Verification Hints');
  await page.fill('input[name="businessType"]', 'Boulangerie');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1000);

  // Step 2: Template selection
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1000);

  // Step 3: Services - skip AI generation
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1000);

  // Step 4: Content - skip AI generation
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1000);

  // NOW WE ARE ON STEP 5: Images & Logo
  console.log('✅ Arrivé sur Step 5 (Images & Logo)\n');

  // 3. Wait for page to fully load
  await page.waitForTimeout(2000);

  // 4. Check if color section exists
  const colorSectionExists = await page.locator('text=🎨 Palette de Couleurs').count() > 0;
  console.log(`🎨 Section "Palette de Couleurs" présente: ${colorSectionExists ? '✅ OUI' : '❌ NON'}\n`);

  // 5. Extract ALL visible text from color section
  const colorSection = page.locator('div:has(> h3:has-text("🎨 Palette de Couleurs"))').first();

  if (await colorSection.count() > 0) {
    const allText = await colorSection.innerText();
    console.log('📝 TEXTE VISIBLE PAR L\'UTILISATEUR:\n');
    console.log('═'.repeat(80));
    console.log(allText);
    console.log('═'.repeat(80));
    console.log('\n');

    // 6. Check specific hints
    const checks = {
      'Titre principal': await page.locator('text=🎨 Palette de Couleurs').count() > 0,
      'Description règle 60-30-10': await page.locator('text=Suivez la règle 60-30-10').count() > 0,
      'Astuce professionnelle': await page.locator('text=💡').count() > 0,
      'Couleur Primaire (60%)': await page.locator('text=🎯 Couleur Primaire (60%)').count() > 0,
      'Couleur Secondaire (30%)': await page.locator('text=🌈 Couleur Secondaire (30%)').count() > 0,
      'Couleur d\'Accent (10%)': await page.locator('text=✨ Couleur d\'Accent (10%)').count() > 0,
      'Hint Primaire - Navigation, en-têtes': await page.locator('text=Navigation, en-têtes').count() > 0,
      'Hint Secondaire - Dégradés de boutons': await page.locator('text=Dégradés de boutons').count() > 0,
      'Hint Accent - Boutons CTA, liens': await page.locator('text=Boutons CTA, liens').count() > 0,
    };

    console.log('🔍 ÉLÉMENTS DÉTECTÉS:\n');
    for (const [label, found] of Object.entries(checks)) {
      console.log(`${found ? '✅' : '❌'} ${label}`);
    }
    console.log('\n');

    // 7. Take screenshot
    await page.screenshot({
      path: '/tmp/step5-color-hints-screenshot.png',
      fullPage: true
    });
    console.log('📸 Capture d\'écran sauvegardée: /tmp/step5-color-hints-screenshot.png\n');

  } else {
    console.log('❌ ERREUR: Section couleurs non trouvée!\n');
  }

  // 8. Summary
  console.log('═'.repeat(80));
  console.log('RÉSUMÉ POUR L\'UTILISATEUR:');
  console.log('═'.repeat(80));

  if (colorSectionExists) {
    console.log('✅ La section "Palette de Couleurs" EXISTE dans le wizard');
    console.log('📍 Elle se trouve dans Step 5 (Images & Logo)');
    console.log('📸 Voir la capture: /tmp/step5-color-hints-screenshot.png');
  } else {
    console.log('❌ La section "Palette de Couleurs" N\'EST PAS VISIBLE');
    console.log('⚠️  Le code existe mais n\'est pas rendu dans le navigateur');
  }
  console.log('═'.repeat(80));
});
