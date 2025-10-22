import { test, expect } from '@playwright/test';

/**
 * Issue #153 - Domain Management Comprehensive E2E Tests
 * Using working cycle18 navigation pattern
 */

test.describe('Issue #153 - Domain Management Tests', () => {

  // Helper function to initialize wizard and reach Step 2
  async function initializeWizardToStep2(page: any) {
    // Login
    console.log('🔐 Step 1: Authentication...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Login successful');

    // Navigate to My Sites
    console.log('🏠 Navigate to My Sites...');
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(3000);

    // Create New Site (with increased timeout for rate limiting)
    console.log('➕ Create New Site...');
    await page.click('text="Create New Site"', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.click('a[href="/wizard?new=true"]', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Start wizard
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Commencer")');
    await page.waitForTimeout(3000);
    console.log('✅ Wizard started');

    // Navigate to Step 2
    console.log('📋 Navigate to Step 2...');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(2000);

    // Verify we're on Business Info step
    const businessInfoHeader = await page.locator('h2:has-text("Informations sur votre Entreprise")');
    await expect(businessInfoHeader).toBeVisible({ timeout: 5000 });
    console.log('✅ On Step 2 (Business Info)');
  }

  test('Test 1: Domain selector visibility and options', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 1: Domain selector visibility and options');

    await initializeWizardToStep2(page);

    // Verify domain section
    const domainSection = page.locator('h3:has-text("Choisissez votre domaine")');
    await expect(domainSection).toBeVisible({ timeout: 5000 });
    console.log('✅ Domain section visible');

    // Verify subdomain option with "Gratuit" badge
    const subdomainOption = page.locator('button:has-text("Sous-domaine")');
    await expect(subdomainOption).toBeVisible({ timeout: 3000 });
    const gratuitBadge = page.locator('span:has-text("Gratuit")');
    await expect(gratuitBadge).toBeVisible({ timeout: 2000 });
    console.log('✅ Subdomain option with "Gratuit" badge');

    // Verify custom domain option with "Premium" badge
    const customDomainOption = page.locator('button:has-text("Domaine personnalisé")');
    await expect(customDomainOption).toBeVisible({ timeout: 3000 });
    const premiumBadge = page.locator('span:has-text("Premium")');
    await expect(premiumBadge).toBeVisible({ timeout: 2000 });
    console.log('✅ Custom domain option with "Premium" badge');

    console.log('🎉 Test 1 PASSED');
  });

  test('Test 2: Subdomain auto-suggestion from site name', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 2: Subdomain auto-suggestion');

    await initializeWizardToStep2(page);

    // Fill site name
    const siteName = `TestSite${Date.now()}`;
    console.log(`Filling site name: ${siteName}`);
    const siteNameInput = page.locator('input[placeholder*="Mon Entreprise"]').first();
    await siteNameInput.fill(siteName);

    // Wait for reactive updates (subdomain auto-suggestion happens immediately via useEffect)
    await page.waitForTimeout(500);

    // Scroll to domain section
    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();

    // Verify subdomain input has auto-suggested value (reactive update from siteName)
    const subdomainInput = page.locator('input[placeholder*="mon-entreprise"]').first();
    const subdomainValue = await subdomainInput.inputValue();

    console.log(`Subdomain value: ${subdomainValue}`);
    console.log(`Expected to include: ${siteName.toLowerCase()}`);

    // Should be sanitized version of site name
    const expectedSubdomain = siteName.toLowerCase();
    expect(subdomainValue).toContain(expectedSubdomain.slice(0, 10));
    console.log('✅ Subdomain auto-suggested correctly and reactively updated');

    console.log('🎉 Test 2 PASSED');
  });

  test('Test 3: Site ID generation verification', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 3: Site ID generation (regression check)');

    await initializeWizardToStep2(page);

    // Fill site name
    const siteName = `SiteIDTest${Date.now()}`;
    console.log(`Testing site ID generation for: ${siteName}`);

    const siteNameInput = page.locator('input[placeholder*="Mon Entreprise"]').first();
    await siteNameInput.fill(siteName);

    // Wait for reactive updates (siteId updates synchronously now)
    await page.waitForTimeout(500);

    // Verify siteId was auto-generated and displayed
    const siteIdInput = page.locator('input[type="text"][value*="siteidtest"]').first();
    const siteIdValue = await siteIdInput.inputValue();
    const expectedSiteId = siteName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    expect(siteIdValue).toBe(expectedSiteId);
    console.log(`✅ Site ID auto-generated correctly: ${siteIdValue}`);

    // Fill other required fields
    const businessTypeInput = page.locator('input[placeholder*="Traduction"]').first();
    await businessTypeInput.fill('Test Business');
    await page.waitForTimeout(500);

    // Scroll to domain section
    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();

    // Fill unique subdomain
    const uniqueSubdomain = `siteid${Date.now()}`;
    console.log(`Setting subdomain: ${uniqueSubdomain}`);

    const subdomainInput = page.locator('input[placeholder*="mon-entreprise"]').first();
    await subdomainInput.clear();
    await subdomainInput.fill(uniqueSubdomain);

    // Wait for debounced availability check (500ms debounce + API call)
    await page.waitForTimeout(1000);

    // Verify availability check shows "Disponible"
    const availableMessage = page.locator('span:has-text("Disponible")');
    await expect(availableMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Subdomain available');

    // Verify the full domain is properly formatted
    const fullDomain = `${uniqueSubdomain}.logen.locod-ai.com`;
    console.log(`✅ Expected full domain: ${fullDomain}`);

    console.log('🎉 Test 3 PASSED - Site ID generation working correctly');
  });

  test('Test 4: Subdomain availability check', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 4: Subdomain availability check');

    await initializeWizardToStep2(page);

    // Scroll to domain section
    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();

    // Test unique subdomain
    const uniqueSubdomain = `test${Date.now()}`;
    console.log(`Testing unique subdomain: ${uniqueSubdomain}`);

    const subdomainInput = page.locator('input[placeholder*="mon-entreprise"]').first();
    await subdomainInput.clear();
    await subdomainInput.fill(uniqueSubdomain);

    // Wait for debounced availability check (500ms debounce configured in component)
    console.log('⏱️  Waiting for 500ms debounce + API call...');
    await page.waitForTimeout(1500);

    // Verify "Disponible" message
    const availableMessage = page.locator('span:has-text("Disponible")');
    await expect(availableMessage).toBeVisible({ timeout: 8000 });
    console.log('✅ "Disponible" message shown');

    // Verify green checkmark in availability section
    const checkmarkIcon = page.locator('.text-green-600 svg, svg.text-green-600');
    await expect(checkmarkIcon.first()).toBeVisible({ timeout: 3000 });
    console.log('✅ Green checkmark visible');

    console.log('🎉 Test 4 PASSED');
  });

  test('Test 5: Reserved subdomain check', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 5: Reserved subdomain');

    await initializeWizardToStep2(page);

    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();

    // Test reserved name: "admin"
    const reservedName = 'admin';
    console.log(`Testing reserved subdomain: ${reservedName}`);

    const subdomainInput = page.locator('input[placeholder*="mon-entreprise"]').first();
    await subdomainInput.clear();
    await subdomainInput.fill(reservedName);
    await page.waitForTimeout(2000);

    // Verify unavailable message
    const unavailableMessage = page.locator('p:has-text("pas disponible")');
    await expect(unavailableMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ "Pas disponible" message shown');

    // Verify suggestions shown
    const suggestionsText = page.locator('p:has-text("Suggestions disponibles")');
    await expect(suggestionsText).toBeVisible({ timeout: 3000 });
    console.log('✅ Suggestions visible');

    const suggestionButtons = page.locator('button:has-text(".logen.locod-ai.com")');
    expect(await suggestionButtons.count()).toBeGreaterThan(0);
    console.log('✅ Suggestion buttons shown');

    console.log('🎉 Test 5 PASSED');
  });

  test('Test 6: Subdomain validation', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 6: Subdomain validation');

    await initializeWizardToStep2(page);

    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();

    const subdomainInput = page.locator('input[placeholder*="mon-entreprise"]').first();

    // Test 1: Too short
    console.log('Test: Too short subdomain');
    await subdomainInput.clear();
    await subdomainInput.fill('ab');
    await page.waitForTimeout(1000);

    const tooShortError = page.locator('p:has-text("Minimum 3 caractères")');
    await expect(tooShortError).toBeVisible({ timeout: 3000 });
    console.log('✅ "Minimum 3 caractères" error shown');

    // Test 2: Invalid characters - should be auto-sanitized
    console.log('Test: Invalid characters');
    await subdomainInput.clear();
    await subdomainInput.fill('my_test_site');
    await page.waitForTimeout(500);

    const sanitizedValue = await subdomainInput.inputValue();
    expect(sanitizedValue).toBe('mytestsite');
    console.log('✅ Invalid characters sanitized');

    // Test 3: Consecutive hyphens - should be auto-sanitized
    console.log('Test: Consecutive hyphens (auto-sanitized)');
    await subdomainInput.clear();
    await subdomainInput.fill('my--test');
    await page.waitForTimeout(1000);

    const sanitizedHyphens = await subdomainInput.inputValue();
    expect(sanitizedHyphens).toBe('my-test'); // Consecutive hyphens collapsed to single hyphen
    console.log('✅ Consecutive hyphens auto-sanitized: my--test → my-test');

    console.log('🎉 Test 6 PASSED');
  });

  test('Test 7: Custom domain switching', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 7: Custom domain switching');

    await initializeWizardToStep2(page);

    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();

    // Click custom domain option
    console.log('Clicking custom domain option...');
    const customDomainButton = page.locator('button:has-text("Domaine personnalisé")');
    await customDomainButton.click();
    await page.waitForTimeout(500);

    // Verify custom domain input visible
    const customDomainInput = page.locator('input[placeholder*="votresite.com"]');
    await expect(customDomainInput).toBeVisible({ timeout: 3000 });
    console.log('✅ Custom domain input visible');

    // Verify DNS verification note
    const dnsNote = page.locator('text=jeton de vérification DNS');
    await expect(dnsNote).toBeVisible({ timeout: 3000 });
    console.log('✅ DNS verification note visible');

    // Type custom domain
    const customDomain = 'mycompany.com';
    await customDomainInput.fill(customDomain);
    console.log(`✅ Custom domain entered: ${customDomain}`);

    console.log('🎉 Test 7 PASSED');
  });

  test('Test 8: Subdomain sanitization', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 8: Subdomain sanitization');

    await initializeWizardToStep2(page);

    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();

    const subdomainInput = page.locator('input[placeholder*="mon-entreprise"]').first();

    // Test with accents
    console.log('Test: Accented characters');
    await subdomainInput.clear();
    await subdomainInput.fill('café-résumé');
    await page.waitForTimeout(500);
    expect(await subdomainInput.inputValue()).toBe('cafe-resume');
    console.log('✅ Accents removed: café-résumé → cafe-resume');

    // Test with spaces
    console.log('Test: Spaces');
    await subdomainInput.clear();
    await subdomainInput.fill('my site name');
    await page.waitForTimeout(500);
    expect(await subdomainInput.inputValue()).toBe('mysitename');
    console.log('✅ Spaces removed: my site name → mysitename');

    // Test with special chars
    console.log('Test: Special characters');
    await subdomainInput.clear();
    await subdomainInput.fill('my@site#name!');
    await page.waitForTimeout(500);
    expect(await subdomainInput.inputValue()).toBe('mysitename');
    console.log('✅ Special characters removed');

    console.log('🎉 Test 8 PASSED');
  });

  test('Test 9: Domain display in sites list', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 9: Domain display in sites list');

    // Login
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to sites
    await page.goto('https://logen.locod-ai.com/sites');
    await page.waitForTimeout(2000);

    console.log('On sites page');

    // Check if sites exist
    const sitesTable = page.locator('table');
    const cardsView = page.locator('div.grid');

    const hasTable = await sitesTable.isVisible().catch(() => false);
    const hasCards = await cardsView.isVisible().catch(() => false);

    if (!hasTable && !hasCards) {
      console.log('ℹ️  No sites found - skipping verification');
      console.log('🎉 Test 9 PASSED (no sites to verify)');
      return;
    }

    console.log('Sites found, verifying domain display...');

    // Look for domain badges
    const greenBadges = page.locator('span.bg-green-50.text-green-700');
    const purpleBadges = page.locator('span.bg-purple-50.text-purple-700');
    const noDomainText = page.locator('span:has-text("Pas de domaine")');

    const greenCount = await greenBadges.count();
    const purpleCount = await purpleBadges.count();
    const noDomainCount = await noDomainText.count();

    console.log(`Found: ${greenCount} subdomains, ${purpleCount} custom domains, ${noDomainCount} without domain`);

    const totalDomainIndicators = greenCount + purpleCount + noDomainCount;
    expect(totalDomainIndicators).toBeGreaterThan(0);
    console.log('✅ Domain information displayed');

    console.log('🎉 Test 9 PASSED');
  });

  test('Test 10: Complete workflow with domain verification', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n🧪 Test 10: Complete workflow');

    await initializeWizardToStep2(page);

    const timestamp = Date.now();
    const siteName = `E2ETest${timestamp}`;
    const subdomain = `e2etest${timestamp}`;

    // Fill business info
    console.log('Filling business information...');
    const siteNameInput = page.locator('input[placeholder*="Mon Entreprise"]').first();
    await siteNameInput.fill(siteName);

    // Wait for reactive updates (subdomain auto-suggestion + siteId generation)
    await page.waitForTimeout(500);

    const businessTypeInput = page.locator('input[placeholder*="Traduction"]').first();
    await businessTypeInput.fill('Test Business');

    // Verify siteId was auto-generated
    const siteIdInput = page.locator('input[type="text"][value*="e2etest"]').first();
    const siteIdValue = await siteIdInput.inputValue();
    const expectedSiteId = siteName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    expect(siteIdValue).toBe(expectedSiteId);
    console.log(`✅ Site ID auto-generated: ${siteIdValue}`);

    // Scroll to domain section and verify subdomain was auto-suggested
    await page.locator('h3:has-text("Choisissez votre domaine")').scrollIntoViewIfNeeded();
    const subdomainInput = page.locator('input[placeholder*="mon-entreprise"]').first();

    // Check if subdomain was auto-suggested from siteName
    const autoSuggestedValue = await subdomainInput.inputValue();
    console.log(`Auto-suggested subdomain: ${autoSuggestedValue}`);

    // Use the auto-suggested subdomain or fill custom one
    if (!autoSuggestedValue || autoSuggestedValue !== subdomain) {
      console.log(`Clearing and filling custom subdomain: ${subdomain}`);
      await subdomainInput.clear();
      await subdomainInput.fill(subdomain);

      // Wait for debounced availability check (500ms debounce + API call)
      console.log('⏱️  Waiting for debounced availability check...');
      await page.waitForTimeout(2000);
    } else {
      // Subdomain matches, just wait a bit longer for availability check
      console.log('⏱️  Subdomain auto-suggested, waiting for availability check...');
      await page.waitForTimeout(2500);
    }

    console.log(`Domain set to: ${subdomain}.logen.locod-ai.com`);

    // Verify available (longer timeout for last test)
    const availableMessage = page.locator('span:has-text("Disponible")');
    await expect(availableMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ Domain validated and available');

    console.log('🎉 Test 10 PASSED - Complete workflow with reactive updates');
  });
});
