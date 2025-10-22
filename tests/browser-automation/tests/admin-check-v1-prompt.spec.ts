import { test, expect } from '@playwright/test';

test('Admin Check V1.1 Image Prompt', async ({ page }) => {
  console.log('🔍 CHECKING V1.1 IMAGE PROMPT IN ADMIN');

  // Login to admin
  await page.goto('https://admin.logen.locod-ai.com');
  await page.fill('#email', 'admin@locod.ai');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');

  // Go to AI queue
  await page.goto('https://admin.logen.locod-ai.com/dashboard/ai-queue');

  // Find any IMAGE request
  const allRows = await page.locator('tr').count();
  console.log(`📊 Total rows: ${allRows}`);

  for (let i = 0; i < Math.min(allRows, 20); i++) {
    const row = page.locator('tr').nth(i);
    const rowText = await row.textContent();

    if (rowText && (rowText.includes('images') || rowText.includes('🎨'))) {
      console.log(`✅ Found IMAGE request in row ${i}`);
      console.log(`🔍 Row: ${rowText.substring(0, 100)}...`);

      // Click Traiter to see prompt
      const traiterButton = row.locator('button:has-text("Traiter")');
      const traiterCount = await traiterButton.count();

      if (traiterCount > 0) {
        console.log('🔘 Clicking "Traiter" to see V1.1 prompt...');
        await traiterButton.first().click();

        // Get the full prompt content
        const promptContent = await page.textContent('body');
        console.log('\n=== PROMPT SUGGÉRÉ COMPLET ===');
        console.log(promptContent);
        console.log('\n=== FIN PROMPT ===\n');

        // Check for blog elements
        const blogElements = ['blog', 'article', 'articles', 'informatifs', 'éditorial', 'rédaction'];

        console.log('📝 ANALYSE DES ÉLÉMENTS BLOG:');
        let foundElements = 0;
        for (const element of blogElements) {
          if (promptContent.toLowerCase().includes(element.toLowerCase())) {
            foundElements++;
            console.log(`✅ Trouvé: ${element}`);
          } else {
            console.log(`❌ Manque: ${element}`);
          }
        }

        console.log(`\n📊 Éléments blog trouvés: ${foundElements}/${blogElements.length}`);
        console.log(`🎯 Prompt V1.1 ${foundElements >= 3 ? 'VALIDE' : 'INVALIDE'} pour blog`);

        return;
      } else {
        console.log('⚠️ Pas de bouton "Traiter" trouvé');
      }
    }
  }

  console.log('❌ Aucune requête IMAGE trouvée');
});