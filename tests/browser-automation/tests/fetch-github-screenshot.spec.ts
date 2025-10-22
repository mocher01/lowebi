import { test } from '@playwright/test';

test('Fetch screenshot from GitHub issue', async ({ page }) => {
  console.log('📍 Navigating to GitHub issue #127...');

  await page.goto('https://github.com/mocher01/logen/issues/127');
  await page.waitForTimeout(8000); // Wait longer for images to load

  // Save full page first
  await page.screenshot({
    path: '/var/apps/logen/tests/browser-automation/github-issue-full-page.png',
    fullPage: true
  });
  console.log('✅ Full page screenshot saved');

  // Try multiple selectors for images
  const allImages = await page.locator('img').all();
  console.log(`📊 Total images on page: ${allImages.length}`);

  // Look for images in comment bodies
  const commentImages = await page.locator('.comment-body img').all();
  console.log(`📊 Images in comments: ${commentImages.length}`);

  if (commentImages.length > 0) {
    // Get the last image in comments (likely the user's screenshot)
    const lastImage = commentImages[commentImages.length - 1];
    const src = await lastImage.getAttribute('src');
    const width = await lastImage.getAttribute('width');
    const height = await lastImage.getAttribute('height');

    console.log(`📐 Image dimensions: ${width}x${height}`);
    console.log(`📸 Image src: ${src}`);

    // Try to get just the image
    const imageBox = await lastImage.boundingBox();
    if (imageBox) {
      console.log(`📦 Image bounding box: ${imageBox.width}x${imageBox.height} at (${imageBox.x}, ${imageBox.y})`);

      await page.screenshot({
        path: '/var/apps/logen/tests/browser-automation/user-uploaded-screenshot.png',
        clip: {
          x: Math.max(0, imageBox.x - 10),
          y: Math.max(0, imageBox.y - 10),
          width: Math.min(imageBox.width + 20, 1920),
          height: Math.min(imageBox.height + 20, 1080)
        }
      });
      console.log('✅ Cropped screenshot saved to: user-uploaded-screenshot.png');
    }
  } else {
    console.log('⚠️ No images found in comments');
  }
});
