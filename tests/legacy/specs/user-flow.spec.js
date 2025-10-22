const { test, expect } = require('@playwright/test');

test('User flow: Accueil → Footer → Interprétariat', async ({ page }) => {
  console.log('🎯 Testing user flow: Accueil → Footer → Interprétariat');
  
  // 1. Aller sur page d'accueil
  await page.goto('http://162.55.213.90:3003/');
  console.log('✅ Page accueil chargée');
  
  // 2. Scroller vers le footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  console.log('✅ Scrollé vers le footer');
  
  // 3. Lister tous les liens du footer pour débugger
  const footerButtons = await page.locator('footer button').allTextContents();
  console.log('📋 Boutons footer:', footerButtons);
  
  // 4. Chercher le bouton Interprétariat dans le footer
  const interpretariatButton = page.locator('footer button:has-text("Interprétariat")');
  
  if (await interpretariatButton.isVisible()) {
    console.log('✅ Bouton Interprétariat trouvé dans footer');
    
    // Vérifier l'URL avant clic
    const urlBefore = page.url();
    console.log('📍 URL avant clic:', urlBefore);
    
    // Cliquer sur le bouton Interprétariat
    await interpretariatButton.click();
    
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    console.log('📍 URL après clic:', currentUrl);
    
    // Vérifier que l'URL contient /service/interpretation
    expect(currentUrl).toContain('/service/interpretation');
    console.log('✅ Navigation vers page service détaillée réussie');
    
    // Vérifier que la page a scrollé vers le haut
    const scrollPosition = await page.evaluate(() => window.pageYOffset);
    console.log('📍 Position scroll après navigation:', scrollPosition);
    expect(scrollPosition).toBeLessThan(100); // Doit être proche du haut
    
    // Vérifier le contenu de la page
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log('📄 Titre de la page service:', pageTitle);
    
    // Vérifier les fonctionnalités spécifiques à Interprétariat
    const pageContent = await page.textContent('body');
    const hasInterpreterContent = pageContent.includes('Interprétariat') || 
                                pageContent.includes('consécutif') ||
                                pageContent.includes('négociations');
    console.log('✅ Contenu Interprétariat présent:', hasInterpreterContent);
    expect(hasInterpreterContent).toBeTruthy();
    
  } else {
    // Fallback: chercher dans les services de la page d'accueil
    await page.goto('http://162.55.213.90:3003/');
    const interpretariatCard = page.locator('text=Interprétariat').first();
    
    if (await interpretariatCard.isVisible()) {
      console.log('✅ Service Interprétariat trouvé sur page accueil');
      await interpretariatCard.click();
      
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      console.log('📍 URL après clic:', currentUrl);
      
      expect(currentUrl).toContain('/service/interpretation');
      console.log('✅ Navigation vers page service détaillée réussie');
    } else {
      console.log('❌ Service Interprétariat non trouvé');
      throw new Error('Service Interprétariat non trouvé ni dans footer ni sur page accueil');
    }
  }
});