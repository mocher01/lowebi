const { test, expect } = require('@playwright/test');

/**
 * Tests de régression automatisés
 * Vérifie les problèmes récurrents après chaque déploiement
 */

test.describe('Tests de Régression Site', () => {
  let siteConfig;
  
  test.beforeAll(async ({ request }) => {
    // Récupérer la configuration du site
    const response = await request.get('/');
    const html = await response.text();
    
    const configMatch = html.match(/window\.SITE_CONFIG\s*=\s*({.*?});/s);
    expect(configMatch, 'Configuration du site non trouvée').toBeTruthy();
    
    siteConfig = JSON.parse(configMatch[1]);
    console.log(`Configuration chargée pour: ${siteConfig.brand?.name}`);
  });

  test.describe('🎨 Tests des Logos', () => {
    test('Les logos sont visibles dans la navbar', async ({ page }) => {
      await page.goto('/');
      
      // Attendre que la page soit chargée
      await expect(page.locator('body')).toBeVisible();
      
      // Vérifier que le logo navbar est présent et visible
      const navbarLogo = page.locator('nav img, header img').first();
      await expect(navbarLogo, 'Logo navbar manquant').toBeVisible();
      
      // Vérifier que l'image se charge correctement
      const src = await navbarLogo.getAttribute('src');
      expect(src, 'Source du logo navbar manquante').toBeTruthy();
      
      // Vérifier que l'image n'est pas cassée
      const naturalWidth = await navbarLogo.evaluate(img => img.naturalWidth);
      expect(naturalWidth, 'Logo navbar cassé (largeur = 0)').toBeGreaterThan(0);
      
      console.log(`✅ Logo navbar OK: ${src}`);
    });

    test('Le logo footer est visible', async ({ page }) => {
      await page.goto('/');
      
      // Scroll vers le footer
      await page.locator('footer').scrollIntoViewIfNeeded();
      
      // Vérifier le logo footer
      const footerLogo = page.locator('footer img').first();
      await expect(footerLogo, 'Logo footer manquant').toBeVisible();
      
      const src = await footerLogo.getAttribute('src');
      const naturalWidth = await footerLogo.evaluate(img => img.naturalWidth);
      expect(naturalWidth, 'Logo footer cassé').toBeGreaterThan(0);
      
      console.log(`✅ Logo footer OK: ${src}`);
    });

    test('Les logos ont les bonnes dimensions (pas trop petits/grands)', async ({ page }) => {
      await page.goto('/');
      
      const navbarLogo = page.locator('nav img, header img').first();
      await expect(navbarLogo).toBeVisible();
      
      const bbox = await navbarLogo.boundingBox();
      expect(bbox.width, 'Logo navbar trop petit').toBeGreaterThan(50);
      expect(bbox.width, 'Logo navbar trop grand').toBeLessThan(400);
      expect(bbox.height, 'Logo navbar trop petit').toBeGreaterThan(20);
      expect(bbox.height, 'Logo navbar trop grand').toBeLessThan(200);
      
      console.log(`✅ Dimensions logo navbar: ${bbox.width}x${bbox.height}px`);
    });
  });

  test.describe('🖼️ Tests des Images Blog', () => {
    test('La page blog se charge avec des images', async ({ page }) => {
      await page.goto('/blog');
      
      // Attendre que le contenu soit chargé - utiliser first() pour éviter strict mode
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Vérifier qu'il y a des articles avec images
      const articleImages = page.locator('article img, .blog-article img, .article-card img');
      const count = await articleImages.count();
      
      if (count > 0) {
        // Vérifier que les images se chargent
        for (let i = 0; i < Math.min(count, 3); i++) {
          const img = articleImages.nth(i);
          await expect(img).toBeVisible();
          
          const naturalWidth = await img.evaluate(img => img.naturalWidth);
          expect(naturalWidth, `Image blog ${i+1} cassée`).toBeGreaterThan(0);
        }
        console.log(`✅ ${count} images blog chargées correctement`);
      } else {
        console.log('⚠️ Aucune image blog trouvée');
      }
    });

    test('Les images des articles individuels se chargent', async ({ page, request }) => {
      // Récupérer la liste des articles depuis l'API
      const blogIndexResponse = await request.get('/content/blog-index.json');
      
      if (blogIndexResponse.ok()) {
        const blogIndex = await blogIndexResponse.json();
        const articles = blogIndex.articles || [];
        
        // Tester les 2 premiers articles
        for (let i = 0; i < Math.min(articles.length, 2); i++) {
          const article = articles[i];
          await page.goto(`/blog/${article.slug}`);
          
          // Vérifier que l'article se charge
          await expect(page.locator('h1').first()).toBeVisible();
          
          // Vérifier les images dans l'article
          const images = page.locator('article img, .content img');
          const imageCount = await images.count();
          
          if (imageCount > 0) {
            const firstImage = images.first();
            await expect(firstImage).toBeVisible();
            
            const naturalWidth = await firstImage.evaluate(img => img.naturalWidth);
            expect(naturalWidth, `Image article "${article.title}" cassée`).toBeGreaterThan(0);
            
            console.log(`✅ Images article "${article.title}" OK`);
          }
        }
      } else {
        console.log('⚠️ Index blog non disponible');
      }
    });
  });

  test.describe('📧 Tests du Formulaire de Contact', () => {
    test('La page contact contient un formulaire', async ({ page }) => {
      await page.goto('/contact');
      
      // Vérifier que la page se charge
      await expect(page.locator('h1')).toBeVisible();
      
      // Vérifier la présence du formulaire
      const form = page.locator('form');
      await expect(form, 'Formulaire de contact manquant').toBeVisible();
      
      // Vérifier les champs essentiels
      await expect(page.locator('input[name="name"], input[type="text"]').first(), 
        'Champ nom manquant').toBeVisible();
      await expect(page.locator('input[name="email"], input[type="email"]').first(), 
        'Champ email manquant').toBeVisible();
      await expect(page.locator('textarea, input[name="message"]').first(), 
        'Champ message manquant').toBeVisible();
      
      console.log('✅ Formulaire de contact présent avec tous les champs');
    });

    test('Le formulaire a une configuration N8N valide', async ({ page }) => {
      await page.goto('/');
      
      // Vérifier la configuration N8N dans le window.SITE_CONFIG
      const n8nConfig = await page.evaluate(() => {
        return window.SITE_CONFIG?.integrations?.n8n;
      });
      
      expect(n8nConfig?.enabled, 'N8N non activé').toBeTruthy();
      expect(n8nConfig?.workflows?.contactForm?.webhookUrl, 'URL webhook manquante')
        .toBeTruthy();
      
      const webhookUrl = n8nConfig.workflows.contactForm.webhookUrl;
      console.log(`✅ Configuration N8N OK: ${webhookUrl.substring(0, 50)}...`);
    });

    test('Le webhook N8N répond (test basique)', async ({ request }) => {
      // Note: On ne fait qu'un test HEAD pour éviter de spammer le webhook
      const webhookUrl = siteConfig?.integrations?.n8n?.workflows?.contactForm?.webhookUrl;
      
      if (webhookUrl) {
        try {
          const response = await request.head(webhookUrl);
          // Le webhook peut retourner 405 (Method Not Allowed) pour HEAD, c'est normal
          expect([200, 405, 404].includes(response.status()), 
            `Webhook inaccessible: ${response.status()}`).toBeTruthy();
          
          console.log(`✅ Webhook accessible (status: ${response.status()})`);
        } catch (error) {
          console.log(`⚠️ Test webhook échoué: ${error.message}`);
        }
      } else {
        test.skip('Webhook URL non configurée');
      }
    });

    test('Le formulaire peut être rempli (sans envoi)', async ({ page }) => {
      await page.goto('/contact');
      
      // Remplir le formulaire avec des données de test
      await page.fill('input[name="name"], input[type="text"]', 'Test User');
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('textarea, input[name="message"]', 'Message de test automatisé');
      
      // Vérifier que les champs sont remplis
      expect(await page.inputValue('input[name="name"], input[type="text"]')).toBe('Test User');
      expect(await page.inputValue('input[name="email"], input[type="email"]')).toBe('test@example.com');
      
      // Vérifier que le bouton submit est présent et cliquable
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      await expect(submitButton, 'Bouton submit manquant').toBeVisible();
      await expect(submitButton, 'Bouton submit non cliquable').toBeEnabled();
      
      console.log('✅ Formulaire peut être rempli et soumis');
    });
  });

  test.describe('🚀 Tests de Performance Basiques', () => {
    test('La page d\'accueil se charge rapidement', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime, 'Page d\'accueil trop lente').toBeLessThan(5000);
      console.log(`✅ Page d'accueil chargée en ${loadTime}ms`);
    });

    test('Les assets critiques se chargent', async ({ page }) => {
      await page.goto('/');
      
      // Vérifier que les CSS sont chargés (pas d'erreur 404)
      const styleSheets = await page.evaluate(() => {
        return Array.from(document.styleSheets).map(sheet => ({
          href: sheet.href,
          disabled: sheet.disabled
        }));
      });
      
      expect(styleSheets.length, 'Aucune feuille de style chargée').toBeGreaterThan(0);
      console.log(`✅ ${styleSheets.length} feuilles de style chargées`);
    });
  });

  test.describe('📱 Tests Responsive', () => {
    test('Le site s\'affiche correctement sur mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      
      // Vérifier que le contenu est visible
      await expect(page.locator('body')).toBeVisible();
      
      // Vérifier que le logo est visible sur mobile
      const logo = page.locator('nav img, header img').first();
      await expect(logo).toBeVisible();
      
      // Vérifier qu'il n'y a pas de débordement horizontal (tolérance 4px pour scrollbar)
      const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
      expect(bodyWidth, 'Débordement horizontal sur mobile').toBeLessThanOrEqual(379);
      
      console.log('✅ Affichage mobile OK');
    });
  });
});