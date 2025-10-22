const { test, expect } = require('@playwright/test');

/**
 * Tests de Navigation Complets
 * Vérifie TOUS les scénarios de navigation et scroll behavior
 */

test.describe('Tests Navigation Complets', () => {
  const baseUrl = 'http://162.55.213.90:3003';
  
  // Toutes les pages à tester
  const pages = [
    { name: 'Accueil', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Blog', url: '/blog' },
    { name: 'À propos', url: '/about' },
    { name: 'Contact', url: '/contact' },
    { name: 'Service Espagnol', url: '/service/traduction-espagnol' },
    { name: 'Service Portugais', url: '/service/traduction-portugais' },
    { name: 'Service Chinois', url: '/service/traduction-chinois' },
    { name: 'Service Interprétariat', url: '/service/interpretation' }
  ];

  // Liens de navigation (navbar + footer)
  const navLinks = [
    { name: 'Accueil', selector: 'nav a[href="/"], nav button:has-text("Accueil")' },
    { name: 'Services', selector: 'nav a[href="/services"], nav button:has-text("Services")' },
    { name: 'Blog', selector: 'nav a[href="/blog"], nav button:has-text("Blog")' },
    { name: 'À propos', selector: 'nav a[href="/about"], nav button:has-text("À propos")' },
    { name: 'Contact', selector: 'nav button:has-text("Demander un devis"), nav button:has-text("Contact")' }
  ];

  test.describe('🧭 Navigation Navbar - Scroll to Top', () => {
    // Test chaque combinaison: page source → lien navbar
    for (const sourcePage of pages) {
      for (const navLink of navLinks) {
        test(`${sourcePage.name} → Navbar ${navLink.name} (scroll to top)`, async ({ page }) => {
          console.log(`🎯 Test: ${sourcePage.name} → Navbar ${navLink.name}`);
          
          // 1. Aller sur page source
          await page.goto(`${baseUrl}${sourcePage.url}`);
          await page.waitForLoadState('networkidle');
          console.log(`✅ Page source chargée: ${sourcePage.name}`);
          
          // 2. Scroller vers le bas pour simuler position utilisateur
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await page.waitForTimeout(500);
          
          const scrollBefore = await page.evaluate(() => window.pageYOffset);
          console.log(`📍 Position avant navigation: ${scrollBefore}px`);
          expect(scrollBefore).toBeGreaterThan(100); // S'assurer qu'on est bien en bas
          
          // 3. Cliquer sur lien navbar
          const navButton = page.locator(navLink.selector).first();
          await expect(navButton).toBeVisible();
          await navButton.click();
          
          // 4. Attendre navigation
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000); // Laisser temps au scroll
          
          // 5. Vérifier URL correcte
          const currentUrl = page.url();
          console.log(`📍 URL après navigation: ${currentUrl}`);
          
          // 6. VÉRIFIER SCROLL TO TOP
          const scrollAfter = await page.evaluate(() => window.pageYOffset);
          console.log(`📍 Position après navigation: ${scrollAfter}px`);
          
          expect(scrollAfter, `Navigation ${sourcePage.name} → ${navLink.name} : page reste en bas`).toBeLessThan(100);
          console.log(`✅ Navigation ${sourcePage.name} → ${navLink.name} : scroll to top OK`);
        });
      }
    }
  });

  test.describe('🦶 Navigation Footer - Scroll to Top', () => {
    // Test navigation footer (déjà corrigée, mais on re-vérifie)
    const footerServiceLinks = [
      'Traduction Espagnol-Français',
      'Traduction Portugais-Français', 
      'Traduction Chinois-Français',
      'Interprétariat'
    ];

    for (const serviceName of footerServiceLinks) {
      test(`Footer → ${serviceName} (scroll to top)`, async ({ page }) => {
        console.log(`🎯 Test Footer → ${serviceName}`);
        
        // 1. Aller sur accueil et scroller vers footer
        await page.goto(`${baseUrl}/`);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        const scrollBefore = await page.evaluate(() => window.pageYOffset);
        expect(scrollBefore).toBeGreaterThan(100);
        
        // 2. Cliquer sur service dans footer
        const footerButton = page.locator(`footer button:has-text("${serviceName}")`);
        await expect(footerButton).toBeVisible();
        await footerButton.click();
        
        // 3. Vérifier navigation et scroll
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const scrollAfter = await page.evaluate(() => window.pageYOffset);
        expect(scrollAfter, `Footer → ${serviceName} : page reste en bas`).toBeLessThan(100);
        console.log(`✅ Footer → ${serviceName} : scroll to top OK`);
      });
    }
  });

  test.describe('🔗 Navigation Interne - Services', () => {
    // Test navigation entre services
    test('Services page → Service détaillé (scroll to top)', async ({ page }) => {
      // 1. Aller sur page services
      await page.goto(`${baseUrl}/services`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // 2. Cliquer sur premier service
      const firstServiceButton = page.locator('button:has-text("En savoir plus")').first();
      await expect(firstServiceButton).toBeVisible();
      await firstServiceButton.click();
      
      // 3. Vérifier scroll to top
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const scrollAfter = await page.evaluate(() => window.pageYOffset);
      expect(scrollAfter).toBeLessThan(100);
      console.log('✅ Services → Service détaillé : scroll to top OK');
    });

    test('Accueil services → Service détaillé (scroll to top)', async ({ page }) => {
      // 1. Aller sur accueil et scroller vers services
      await page.goto(`${baseUrl}/`);
      await page.locator('text=Nos services').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // 2. Cliquer sur service depuis section accueil
      const serviceLink = page.locator('.service-card a').first();
      await expect(serviceLink).toBeVisible();
      await serviceLink.click();
      
      // 3. Vérifier scroll to top
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const scrollAfter = await page.evaluate(() => window.pageYOffset);
      expect(scrollAfter).toBeLessThan(100);
      console.log('✅ Accueil services → Service détaillé : scroll to top OK');
    });
  });

  test.describe('⚓ Navigation avec Ancres', () => {
    test('Navigation vers ancres (FAQ)', async ({ page }) => {
      // Test navigation vers section FAQ depuis footer
      await page.goto(`${baseUrl}/`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      const faqLink = page.locator('footer button:has-text("FAQ")');
      if (await faqLink.isVisible()) {
        await faqLink.click();
        await page.waitForTimeout(1500);
        
        // Vérifier qu'on est sur la section FAQ (pas forcément top)
        const faqSection = page.locator('#faq, .faq-section');
        if (await faqSection.isVisible()) {
          console.log('✅ Navigation FAQ avec ancre OK');
        }
      }
    });
  });

  test.describe('📱 Navigation Mobile', () => {
    test('Navigation mobile - burger menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/service/traduction-portugais`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Ouvrir menu burger s'il existe
      const burgerButton = page.locator('button[aria-label*="menu"], .hamburger, .mobile-menu-button');
      if (await burgerButton.isVisible()) {
        await burgerButton.click();
        await page.waitForTimeout(500);
        
        // Cliquer sur Blog dans menu mobile
        const mobileBlogLink = page.locator('nav a:has-text("Blog"), .mobile-menu a:has-text("Blog")');
        if (await mobileBlogLink.isVisible()) {
          await mobileBlogLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          
          const scrollAfter = await page.evaluate(() => window.pageYOffset);
          expect(scrollAfter).toBeLessThan(100);
          console.log('✅ Navigation mobile : scroll to top OK');
        }
      }
    });
  });
});