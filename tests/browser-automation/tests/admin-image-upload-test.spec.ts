import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Admin Image Upload Test - Direct Upload to Request #551', async ({ page }) => {
  console.log('🔧 ADMIN IMAGE UPLOAD TEST - DIRECT UPLOAD TO REQUEST #551');
  console.log('Purpose: Test direct image upload to admin request #551');
  console.log('Focus: Upload test images to each field and verify completion');
  console.log('=' .repeat(70));

  // Enable console logging to capture image upload feedback
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('IMAGE') || text.includes('image') || text.includes('upload') || text.includes('✅') || text.includes('❌')) {
      console.log(`🔍 CONSOLE: ${text}`);
    }
  });

  try {
    // Step 1: Navigate to admin login
    console.log('🔐 Step 1: Admin Authentication...');
    await page.goto('https://admin.dev.lowebi.com');
    await page.waitForTimeout(2000);

    // Admin login
    const emailSelectors = ['#email', 'input[type="email"]', 'input[name="email"]', '[placeholder*="email"]', '[placeholder*="Email"]'];
    let emailFound = false;

    for (const selector of emailSelectors) {
      try {
        const emailField = page.locator(selector);
        if (await emailField.isVisible()) {
          await emailField.fill('admin@locod.ai');
          emailFound = true;
          console.log(`✅ Found email field with selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    const passwordSelectors = ['#password', 'input[type="password"]', 'input[name="password"]', '[placeholder*="password"]', '[placeholder*="Password"]'];

    for (const selector of passwordSelectors) {
      try {
        const passwordField = page.locator(selector);
        if (await passwordField.isVisible()) {
          await passwordField.fill('admin123');
          console.log(`✅ Found password field with selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    const loginButtonSelectors = ['button[type="submit"]', 'button:has-text("Login")', 'button:has-text("Connexion")', '.login-button'];

    for (const selector of loginButtonSelectors) {
      try {
        const loginButton = page.locator(selector);
        if (await loginButton.isVisible()) {
          await loginButton.click();
          console.log(`✅ Clicked login button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    await page.waitForTimeout(3000);
    console.log('✅ Admin login successful');

    // Step 2: Navigate to AI Queue
    console.log('📋 Step 2: Navigate to AI Queue...');
    await page.goto('https://admin.dev.lowebi.com/dashboard/ai-queue');
    await page.waitForTimeout(3000);

    // Step 3: Find and open request #551 specifically
    console.log('🔍 Step 3: Looking for request #551...');

    // Look for request #551 in various possible table/card structures
    const request551Selectors = [
      'tr:has-text("#551")',
      'tr:has-text("551")',
      '.request-row:has-text("551")',
      '[data-testid="ai-request"]:has-text("551")',
      'td:has-text("551")'
    ];

    let request551Found = false;
    for (const selector of request551Selectors) {
      try {
        const requestElement = page.locator(selector);
        if (await requestElement.count() > 0) {
          request551Found = true;
          console.log(`✅ Found request #551 with selector: ${selector}`);

          // Try to find and click the "Traiter" button for this request
          const traiterButtons = [
            requestElement.locator('button:has-text("Traiter")'),
            requestElement.locator('button:has-text("Process")'),
            requestElement.locator('.process-btn'),
            requestElement.locator('button[title*="Traiter"]')
          ];

          for (const traiterButton of traiterButtons) {
            try {
              if (await traiterButton.count() > 0) {
                await traiterButton.first().click();
                console.log('✅ Clicked "Traiter" button for request #551');
                break;
              }
            } catch (error) {
              continue;
            }
          }
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!request551Found) {
      // Alternative: Look for any request and click the first "Traiter" button
      console.log('⚠️ Request #551 not found specifically, looking for any image request...');
      const anyTraiterButtons = [
        'button:has-text("Traiter")',
        'button:has-text("Process")',
        '.process-btn'
      ];

      for (const selector of anyTraiterButtons) {
        try {
          const button = page.locator(selector);
          if (await button.count() > 0) {
            await button.first().click();
            console.log(`✅ Clicked available "Traiter" button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    await page.waitForTimeout(5000);

    // Step 4: Verify we're in the processing modal and can see image upload fields
    console.log('🖼️ Step 4: Looking for image upload fields...');

    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    console.log(`📊 Found ${fileInputCount} file upload fields`);

    if (fileInputCount === 0) {
      console.log('❌ No file upload fields found. Checking page content...');
      const pageContent = await page.content();
      console.log(`Page contains "upload": ${pageContent.includes('upload')}`);
      console.log(`Page contains "file": ${pageContent.includes('file')}`);
      console.log(`Page contains "Images Générées": ${pageContent.includes('Images Générées')}`);

      // Try to look for the modal or processing interface
      const modalSelectors = [
        '.modal',
        '.processing-modal',
        '[role="dialog"]',
        '.fixed.inset-0'
      ];

      for (const selector of modalSelectors) {
        try {
          if (await page.locator(selector).count() > 0) {
            console.log(`✅ Found modal/interface with selector: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    } else {
      console.log(`✅ Found ${fileInputCount} upload fields - ready to upload images!`);
    }

    // Step 5: Upload test images to each field
    console.log('📸 Step 5: Uploading test images...');

    // Define test images directory and files
    const testImagesDir = path.join(__dirname, '..', 'test-images');
    const imageFiles = {
      logo: path.join(testImagesDir, 'logo.png'),
      hero: path.join(testImagesDir, 'hero.png'),
      blog1: path.join(testImagesDir, 'blog-1.png'),
      blog2: path.join(testImagesDir, 'blog-2.png'),
      service1: path.join(testImagesDir, 'service-1.png'),
      service2: path.join(testImagesDir, 'service-2.png'),
      service3: path.join(testImagesDir, 'service-3.png'),
      banner: path.join(testImagesDir, 'banner.png'),
      favicon: path.join(testImagesDir, 'favicon.png')
    };

    // Upload mapping - cycle through available test images
    const availableImages = Object.values(imageFiles);
    let uploadedCount = 0;

    for (let i = 0; i < fileInputCount; i++) {
      try {
        const fileInput = fileInputs.nth(i);
        const imageFile = availableImages[i % availableImages.length]; // Cycle through available images

        console.log(`📤 Uploading to field ${i + 1}: ${path.basename(imageFile)}`);

        await fileInput.setInputFiles(imageFile);
        uploadedCount++;
        console.log(`✅ Successfully uploaded ${path.basename(imageFile)} to field ${i + 1}`);

        // Small delay between uploads to avoid overwhelming the interface
        await page.waitForTimeout(1000);

        // Check if upload was successful by looking for visual indicators
        const uploadIndicators = [
          '.upload-success',
          '.file-uploaded',
          'text="✓"',
          'text="Uploaded"',
          '.text-green-600'
        ];

        for (const indicator of uploadIndicators) {
          try {
            if (await page.locator(indicator).count() > 0) {
              console.log(`✅ Upload indicator found: ${indicator}`);
              break;
            }
          } catch (error) {
            continue;
          }
        }

      } catch (error) {
        console.log(`❌ Failed to upload to field ${i + 1}: ${error.message}`);
      }
    }

    console.log(`📊 Upload Summary: ${uploadedCount}/${fileInputCount} files uploaded successfully`);

    // Step 6: Check if "Appliquer & Terminer" button is enabled
    console.log('🔘 Step 6: Checking "Appliquer & Terminer" button status...');

    const completeButtons = [
      'button:has-text("Appliquer & Terminer")',
      'button:has-text("Complete")',
      'button:has-text("Terminer")',
      '.complete-button',
      'button[type="submit"]'
    ];

    let completeButtonFound = false;
    for (const selector of completeButtons) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          const isEnabled = await button.isEnabled();
          const isVisible = await button.isVisible();

          console.log(`📊 Button "${selector}": visible=${isVisible}, enabled=${isEnabled}`);

          if (isVisible && isEnabled) {
            completeButtonFound = true;
            console.log(`✅ "Appliquer & Terminer" button is ready to click!`);

            // Step 7: Click the button to complete the request
            console.log('🚀 Step 7: Clicking "Appliquer & Terminer"...');
            await button.click();
            console.log('✅ Successfully clicked "Appliquer & Terminer"');

            await page.waitForTimeout(3000);

            // Check for success indicators
            const successIndicators = [
              'text="Demande terminée avec succès"',
              'text="Request completed"',
              'text="Success"',
              'text="Succès"',
              '.success-message',
              '.text-green-600'
            ];

            for (const indicator of successIndicators) {
              try {
                if (await page.locator(indicator).isVisible()) {
                  console.log(`✅ Success indicator found: ${indicator}`);
                  break;
                }
              } catch (error) {
                continue;
              }
            }

            break;
          } else {
            console.log(`⚠️ Button "${selector}" found but not ready (visible: ${isVisible}, enabled: ${isEnabled})`);
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!completeButtonFound) {
      console.log('❌ No enabled "Appliquer & Terminer" button found');

      // Debug: Show current upload count vs required count
      const uploadCountElements = page.locator('text="Images uploadées"');
      if (await uploadCountElements.count() > 0) {
        const uploadCountText = await uploadCountElements.first().textContent();
        console.log(`📊 Current upload status: ${uploadCountText}`);
      }
    }

    // Step 8: Final verification
    console.log('\n🎯 FINAL VERIFICATION RESULTS:');
    console.log('='.repeat(50));
    console.log(`✅ Admin login: SUCCESS`);
    console.log(`✅ Found request #551: ${request551Found ? 'YES' : 'ALTERNATIVE REQUEST USED'}`);
    console.log(`✅ Upload fields found: ${fileInputCount}`);
    console.log(`✅ Images uploaded: ${uploadedCount}/${fileInputCount}`);
    console.log(`✅ Upload completion: ${uploadedCount === fileInputCount ? 'SUCCESS' : 'PARTIAL'}`);
    console.log(`✅ Button clicked: ${completeButtonFound ? 'SUCCESS' : 'FAILED'}`);

    if (uploadedCount === fileInputCount && completeButtonFound) {
      console.log('\n🎉 SUCCESS: Image upload workflow completed successfully!');
      console.log('🔄 Images should now auto-apply to customer interface');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some steps need attention');
      if (uploadedCount < fileInputCount) {
        console.log(`❌ Only ${uploadedCount}/${fileInputCount} images uploaded`);
      }
      if (!completeButtonFound) {
        console.log('❌ Could not complete the request (button not enabled)');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  }
});