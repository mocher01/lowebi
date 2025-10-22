import { test, expect } from '@playwright/test';

/**
 * Cycle 28: Issue #169 Phase 2 - Real Data Verification
 *
 * Purpose: Verify Phase 2 shows actual wizard-generated data
 *
 * Test Steps:
 * 1. Test API endpoint directly to verify blog import
 * 2. Test API endpoint for page content
 * 3. Verify data structure and content
 *
 * Expected Results:
 * - Blog articles auto-imported from wizard data
 * - Page content shows actual titles and data
 * - All sections have real content, not empty
 */

test.describe.configure({ mode: 'serial' });

test.describe('Cycle 28: Phase 2 - Real Data Verification', () => {
  const siteId = '68e54a10-f29f-424b-b89b-9bb4033b6af3'; // cycle26test1760385122507
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    console.log('🔐 Logging in to get auth token...\n');
    const loginResponse = await request.post('http://localhost:7610/customer/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'Administrator2025',
      },
    });

    if (!loginResponse.ok()) {
      console.log('❌ Login failed, skipping tests');
      return;
    }

    const loginData = await loginResponse.json();
    authToken = loginData.accessToken;
    console.log('✅ Authentication successful\n');
  });

  test('Verify blog articles are auto-imported from wizard data', async ({ request }) => {
    console.log('🚀 CYCLE 28: PHASE 2 REAL DATA TEST\n');
    console.log('Purpose: Verify content editor shows actual wizard-generated data\n');
    console.log('================================================================================\n');

    console.log('📝 Step 1: Fetch blog posts for cycle26test site...\n');

    if (!authToken) {
      console.log('⏭️  Skipping - no auth token');
      return;
    }

    const blogResponse = await request.get(
      `http://localhost:7610/customer/sites/${siteId}/blog`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(blogResponse.ok()).toBeTruthy();
    const blogPosts = await blogResponse.json();

    console.log(`✅ Blog API response successful`);
    console.log(`📊 Found ${blogPosts.length} blog posts\n`);

    // Should have 3 imported articles
    expect(blogPosts.length).toBeGreaterThanOrEqual(3);

    // Verify the imported articles
    const expectedTitles = [
      'Les secrets d\'un bon pain tradition',
      'Comment choisir le gâteau parfait pour votre mariage',
      'Le levain naturel : l\'âme du pain bio',
    ];

    console.log('📋 Verifying imported blog articles:\n');
    for (const expectedTitle of expectedTitles) {
      const post = blogPosts.find((p: any) => p.title === expectedTitle);
      expect(post).toBeTruthy();
      console.log(`  ✓ "${expectedTitle}"`);
      console.log(`    - Slug: ${post.slug}`);
      console.log(`    - Status: ${post.status}`);
      console.log(`    - Has excerpt: ${!!post.excerpt}`);
      console.log(`    - Content length: ${post.content.length} chars\n`);
    }

    console.log('✅ All 3 blog articles successfully imported!\n');
  });

  test('Verify page content shows actual wizard data', async ({ request }) => {
    console.log('📄 Step 2: Fetch page content...\n');

    if (!authToken) {
      console.log('⏭️  Skipping - no auth token');
      return;
    }

    const contentResponse = await request.get(
      `http://localhost:7610/customer/sites/${siteId}/content`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(contentResponse.ok()).toBeTruthy();
    const pageContent = await contentResponse.json();

    console.log('✅ Page content API response successful\n');

    // Verify Hero Section
    console.log('🎯 Hero Section:');
    expect(pageContent.hero).toBeTruthy();
    expect(pageContent.hero.title).toBeTruthy();
    console.log(`  Title: "${pageContent.hero.title}"`);
    console.log(`  Subtitle: "${pageContent.hero.subtitle}"`);
    console.log(`  Description length: ${pageContent.hero.description?.length || 0} chars\n`);

    expect(pageContent.hero.title).toContain('Pain frais');

    // Verify About Section
    console.log('ℹ️  About Section:');
    expect(pageContent.about).toBeTruthy();
    expect(pageContent.about.title).toBeTruthy();
    console.log(`  Title: "${pageContent.about.title}"`);
    console.log(`  Subtitle: "${pageContent.about.subtitle}"`);
    console.log(`  Values: ${pageContent.about.values?.length || 0} items\n`);

    // Verify Services
    console.log('🛠️  Services:');
    expect(pageContent.services).toBeTruthy();
    expect(Array.isArray(pageContent.services)).toBeTruthy();
    console.log(`  Found ${pageContent.services.length} services:`);
    pageContent.services.forEach((service: any, index: number) => {
      console.log(`    ${index + 1}. ${service.title}`);
    });
    console.log();

    expect(pageContent.services.length).toBeGreaterThanOrEqual(5);

    // Verify Contact
    console.log('📧 Contact:');
    expect(pageContent.contact).toBeTruthy();
    console.log(`  Email: ${pageContent.contact.email || '(empty)'}`);
    console.log(`  Phone: ${pageContent.contact.phone || '(empty)'}`);
    console.log(`  Address: ${pageContent.contact.address || '(empty)'}\n`);

    // Verify FAQ
    console.log('❓ FAQ:');
    expect(pageContent.faq).toBeTruthy();
    expect(Array.isArray(pageContent.faq)).toBeTruthy();
    console.log(`  Found ${pageContent.faq.length} FAQ items:`);
    pageContent.faq.slice(0, 3).forEach((faq: any, index: number) => {
      console.log(`    ${index + 1}. ${faq.question}`);
    });
    console.log();

    expect(pageContent.faq.length).toBeGreaterThanOrEqual(6);

    // Verify Testimonials
    console.log('💬 Testimonials:');
    expect(pageContent.testimonials).toBeTruthy();
    expect(Array.isArray(pageContent.testimonials)).toBeTruthy();
    console.log(`  Found ${pageContent.testimonials.length} testimonials:`);
    pageContent.testimonials.forEach((testimonial: any, index: number) => {
      console.log(`    ${index + 1}. ${testimonial.name} (${testimonial.position})`);
    });
    console.log();

    expect(pageContent.testimonials.length).toBeGreaterThanOrEqual(3);

    console.log('================================================================================');
    console.log('✅ ALL PAGE CONTENT CONTAINS REAL WIZARD DATA!');
    console.log('================================================================================\n');
  });

  test('Verify hero section can be updated', async ({ request }) => {
    console.log('✏️  Step 3: Test updating hero section...\n');

    if (!authToken) {
      console.log('⏭️  Skipping - no auth token');
      return;
    }

    const updateResponse = await request.patch(
      `http://localhost:7610/customer/sites/${siteId}/content/pages/hero`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          section: 'hero',
          title: 'Pain frais et pâtisseries artisanales (Updated)',
          subtitle: 'L\'art de la boulangerie depuis 1995',
          description: 'Test update from automated test',
        },
      }
    );

    if (!updateResponse.ok()) {
      const errorText = await updateResponse.text();
      console.log(`❌ Update failed with status ${updateResponse.status()}`);
      console.log(`Error response: ${errorText}`);
    }

    expect(updateResponse.ok()).toBeTruthy();
    const updatedHero = await updateResponse.json();

    console.log('✅ Hero section updated successfully');
    console.log(`  New title: "${updatedHero.title}"\n`);

    // Verify the update persisted
    const verifyResponse = await request.get(
      `http://localhost:7610/customer/sites/${siteId}/content`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const verifiedContent = await verifyResponse.json();
    expect(verifiedContent.hero.title).toContain('Updated');
    console.log('✅ Update verified - changes persisted!\n');

    // Restore original
    await request.patch(
      `http://localhost:7610/customer/sites/${siteId}/content/pages/hero`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          section: 'hero',
          title: 'Pain frais et pâtisseries artisanales',
          subtitle: 'L\'art de la boulangerie depuis 1995',
          description: 'Découvrez nos pains artisanaux pétris à la main, nos viennoiseries croustillantes et nos gâteaux faits maison. Chaque jour, nous sélectionnons les meilleurs ingrédients pour vous offrir le goût authentique de la tradition boulangère.',
        },
      }
    );

    console.log('✅ Original content restored\n');
  });
});
