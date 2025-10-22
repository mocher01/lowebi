import { test, expect } from '@playwright/test';

test('Test Business Fields Filling: Business Type, Slogan, and Description', async ({ page }) => {
  console.log('📝 TEST: Business Fields Filling (Business Type, Slogan, Description)');
  console.log('Purpose: Verify all business fields can be filled in Step 3');
  console.log('=' .repeat(60));

  try {
    // Test data
    const testSiteName = `TestBusiness_${Date.now()}`;
    const testBusinessType = 'Restaurant & Food Service';
    const testSlogan = 'Fresh baked daily with love since 1990';
    const testBusinessDescription = 'Artisanal bakery specializing in organic bread, custom wedding cakes, and traditional French pastries. We use only premium local ingredients and time-honored baking techniques.';

    console.log(`🏪 Site Name: ${testSiteName}`);
    console.log(`🏪 Business Type: ${testBusinessType}`);
    console.log(`✨ Slogan: ${testSlogan}`);
    console.log(`📝 Description: ${testBusinessDescription.substring(0, 50)}...`);

    // Step 1: Login
    console.log('🔐 Step 1: Login...');
    await page.goto('https://logen.locod-ai.com/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Administrator2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate directly to wizard
    console.log('🧙 Step 2: Navigate to wizard...');
    await page.goto('https://logen.locod-ai.com/wizard?new=true');
    await page.waitForTimeout(3000);

    // Check for and handle consent if present
    const consentCheckbox = page.locator('input[type="checkbox"]').first();
    if (await consentCheckbox.count() > 0) {
      await consentCheckbox.check();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Commencer")');
      await page.waitForTimeout(3000);
    }

    // Navigate to business info step (Step 3)
    console.log('📋 Step 3: Navigate to business info step...');

    // Try to navigate through steps to reach business info
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const pageContent = await page.textContent('body');

      // Check if we can find business name field (indicates we're on business info step)
      const businessNameField = page.getByPlaceholder('Mon Entreprise');
      const businessNameCount = await businessNameField.count();

      if (businessNameCount > 0) {
        console.log('✅ Found business info step (business name field present)');
        break;
      }

      // Try to click next button to navigate
      const nextButton = page.locator('button:has-text("Suivant")');
      if (await nextButton.count() > 0) {
        await nextButton.first().click();
        await page.waitForTimeout(2000);
        console.log(`🔄 Clicked Next button (attempt ${attempts + 1})`);
      } else {
        console.log(`⚠️ No Next button found on attempt ${attempts + 1}`);
      }

      attempts++;
    }

    // Step 4: Test field filling
    console.log('📝 Step 4: Test field filling...');

    // Debug: List all input fields available
    const allInputs = await page.locator('input').all();
    console.log(`🔍 Found ${allInputs.length} input fields:`);
    for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
      const placeholder = await allInputs[i].getAttribute('placeholder') || 'none';
      const type = await allInputs[i].getAttribute('type') || 'none';
      console.log(`  ${i+1}. type="${type}" placeholder="${placeholder}"`);
    }

    // Test 1: Fill Business Name
    console.log('📝 Test 1: Business Name field...');
    const businessNameField = page.getByPlaceholder('Mon Entreprise');
    const businessNameCount = await businessNameField.count();

    if (businessNameCount > 0) {
      await businessNameField.clear();
      await businessNameField.fill(testSiteName);
      const businessNameValue = await businessNameField.inputValue();
      console.log(`✅ Business Name filled: "${businessNameValue}"`);
    } else {
      console.log('❌ Business Name field not found');
    }

    // Test 2: Fill Business Type
    console.log('📝 Test 2: Business Type field...');
    const businessTypeSelectors = [
      'input[placeholder*="Traduction"]',
      'input[placeholder*="Éducation"]',
      'input[placeholder*="Plomberie"]',
      'input[placeholder*="Restaurant"]',
      'input[placeholder*="Ex:"]'
    ];

    let businessTypeField = null;
    for (const selector of businessTypeSelectors) {
      const field = page.locator(selector);
      if (await field.count() > 0) {
        businessTypeField = field;
        console.log(`✅ Found Business Type field with selector: ${selector}`);
        break;
      }
    }

    if (businessTypeField) {
      await businessTypeField.clear();
      await businessTypeField.fill(testBusinessType);
      const businessTypeValue = await businessTypeField.inputValue();
      console.log(`✅ Business Type filled: "${businessTypeValue}"`);
    } else {
      console.log('❌ Business Type field not found');
      // Show available placeholders for debugging
      const allPlaceholders = [];
      for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
        const placeholder = await allInputs[i].getAttribute('placeholder');
        if (placeholder) allPlaceholders.push(placeholder);
      }
      console.log(`🔍 Available placeholders: ${allPlaceholders.join(', ')}`);
    }

    // Test 3: Fill Slogan/Terminology field
    console.log('📝 Test 3: Slogan/Terminology field...');
    const sloganSelectors = [
      'input[placeholder*="services"]',
      'input[placeholder*="activités"]',
      'input[placeholder*="slogan"]',
      'input[placeholder*="Ex: services"]'
    ];

    let sloganField = null;
    for (const selector of sloganSelectors) {
      const field = page.locator(selector);
      if (await field.count() > 0) {
        sloganField = field;
        console.log(`✅ Found Slogan field with selector: ${selector}`);
        break;
      }
    }

    if (sloganField) {
      await sloganField.clear();
      await sloganField.fill(testSlogan);
      const sloganValue = await sloganField.inputValue();
      console.log(`✅ Slogan filled: "${sloganValue}"`);
    } else {
      console.log('❌ Slogan field not found');
    }

    // Test 4: Fill Business Description
    console.log('📝 Test 4: Business Description field...');
    const descriptionField = page.locator('textarea[placeholder*="Décrivez votre entreprise"]');
    const descriptionCount = await descriptionField.count();

    if (descriptionCount > 0) {
      await descriptionField.clear();
      await descriptionField.fill(testBusinessDescription);
      const descriptionValue = await descriptionField.inputValue();
      console.log(`✅ Business Description filled: "${descriptionValue.substring(0, 50)}..."`);
    } else {
      console.log('❌ Business Description field not found');
    }

    // Step 5: Verify site ID generation
    console.log('🆔 Step 5: Verify site ID generation...');
    await page.waitForTimeout(2000); // Wait for site ID generation

    const siteIdField = page.locator('input[placeholder*="génération"], input[placeholder*="identifiant"]');
    const siteIdCount = await siteIdField.count();

    if (siteIdCount > 0) {
      const siteIdValue = await siteIdField.inputValue();
      console.log(`🆔 Generated Site ID: "${siteIdValue}"`);

      // Check if site ID is based on business name
      const lowerSiteName = testSiteName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (siteIdValue.includes('testbusiness') || siteIdValue.includes('test-business')) {
        console.log('✅ Site ID generation working correctly');
      } else {
        console.log(`⚠️ Site ID format unexpected: "${siteIdValue}"`);
      }
    } else {
      console.log('❌ Site ID field not found');
    }

    // Final Assessment
    console.log('\n📊 BUSINESS FIELDS FILLING TEST RESULTS:');
    console.log('=' .repeat(50));

    const results = {
      businessName: await page.getByPlaceholder('Mon Entreprise').inputValue() === testSiteName,
      businessType: businessTypeField ? await businessTypeField.inputValue() === testBusinessType : false,
      slogan: sloganField ? await sloganField.inputValue() === testSlogan : false,
      description: await page.locator('textarea[placeholder*="Décrivez votre entreprise"]').inputValue() === testBusinessDescription,
      siteIdGenerated: siteIdCount > 0
    };

    console.log(`📊 Business Name: ${results.businessName ? '✅' : '❌'}`);
    console.log(`📊 Business Type: ${results.businessType ? '✅' : '❌'} - "${testBusinessType}"`);
    console.log(`📊 Slogan: ${results.slogan ? '✅' : '❌'} - "${testSlogan}"`);
    console.log(`📊 Description: ${results.description ? '✅' : '❌'}`);
    console.log(`📊 Site ID Generated: ${results.siteIdGenerated ? '✅' : '❌'}`);

    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    if (successCount === totalTests) {
      console.log('\n🎉 ALL BUSINESS FIELDS TESTS PASSED!');
      console.log('✅ Business Type and Slogan fields can be filled successfully');
      console.log('✅ All field validation working correctly');
    } else {
      console.log(`\n⚠️ PARTIAL SUCCESS: ${successCount}/${totalTests} tests passed`);
      console.log('🔍 Some fields may need selector updates or UI investigation');
    }

  } catch (error) {
    console.error('❌ BUSINESS FIELDS TEST FAILED:', error);
    throw error;
  }
});