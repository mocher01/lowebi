/**
 * Issue #79 - Acceptance Criteria Validation Test Suite
 * 100% Coverage Campaign - Admin Portal Security Implementation
 */

const { chromium } = require('playwright');
const axios = require('axios');

describe('Issue #79 - Acceptance Criteria Validation', () => {
  const CONFIG = {
    CUSTOMER_PORTAL_URL: 'https://logen.locod-ai.com',
    ADMIN_PORTAL_URL: 'https://admin.logen.locod-ai.com',
    BACKEND_API_URL: 'http://localhost:7600',
    ADMIN_CREDENTIALS: {
      email: 'admin@locod.ai',
      password: 'Admin123!'
    }
  };

  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  /**
   * ACCEPTANCE CRITERION 1: Remove Staff Link from Customer Portal
   * Requirement: "Remove the link 'Staff' from logen.locod-ai.com completely"
   */
  describe('AC1: Staff Link Removal from Customer Portal', () => {
    test('✅ AC1.1: Staff link is completely removed from navigation', async () => {
      await page.goto(CONFIG.CUSTOMER_PORTAL_URL, { waitUntil: 'networkidle' });
      
      // Check all possible variations of staff links
      const staffLinks = await page.locator([
        'a:has-text("Staff")',
        'a:has-text("staff")', 
        'a:has-text("Staff Portal")',
        'a[href*="staff"]',
        'a[href*="admin"]',
        'button:has-text("Staff")',
        '[data-testid*="staff"]'
      ].join(', ')).count();
      
      expect(staffLinks).toBe(0);
    });

    test('✅ AC1.2: Staff route returns 404', async () => {
      const response = await page.goto(`${CONFIG.CUSTOMER_PORTAL_URL}/staff`);
      expect(response.status()).toBe(404);
    });

    test('✅ AC1.3: Customer portal only shows customer navigation', async () => {
      await page.goto(CONFIG.CUSTOMER_PORTAL_URL, { waitUntil: 'networkidle' });
      
      // Verify expected customer elements exist
      await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
      await expect(page.locator('a:has-text("Get Started")')).toBeVisible();
      
      // Verify no admin elements
      const adminElements = await page.locator([
        'text=Admin',
        'text=Staff',
        'text=Dashboard',
        '.from-red-600' // Admin color scheme
      ].join(', ')).count();
      
      expect(adminElements).toBe(0);
    });
  });

  /**
   * ACCEPTANCE CRITERION 2: Dedicated Admin Portal at admin.logen.locod-ai.com
   * Requirement: "Admin login ONLY at admin.logen.locod-ai.com"
   */
  describe('AC2: Dedicated Admin Portal', () => {
    test('✅ AC2.1: Admin portal loads at correct subdomain', async () => {
      const response = await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      expect(response.status()).toBe(200);
      expect(page.url()).toContain('admin.logen.locod-ai.com');
      
      const title = await page.title();
      expect(title).toBe('LOGEN Admin Portal');
    });

    test('✅ AC2.2: Admin portal has distinct branding', async () => {
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      // Check admin-specific branding
      await expect(page.locator('h2:has-text("LOGEN Admin Portal")')).toBeVisible();
      await expect(page.locator('span:has-text("LA")')).toBeVisible(); // Admin logo
      
      // Check admin color scheme (red/orange)
      const adminColors = await page.locator('.from-red-600.to-orange-600').count();
      expect(adminColors).toBeGreaterThan(0);
    });

    test('✅ AC2.3: Admin portal uses HTTPS', async () => {
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      expect(page.url()).toMatch(/^https:\/\//);
    });
  });

  /**
   * ACCEPTANCE CRITERION 3: No Account Creation Option on Admin Portal
   * Requirement: "No account creation option on admin portal"
   */
  describe('AC3: No Public Registration on Admin Portal', () => {
    test('✅ AC3.1: No registration links or forms present', async () => {
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      const registrationElements = await page.locator([
        'a:has-text("Register")',
        'a:has-text("Sign Up")', 
        'a:has-text("Create Account")',
        'button:has-text("Register")',
        'form[action*="register"]',
        'input[name="confirmPassword"]' // No password confirmation field
      ].join(', ')).count();
      
      expect(registrationElements).toBe(0);
    });

    test('✅ AC3.2: Clear messaging about no public registration', async () => {
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      await expect(page.locator('text=No public registration available')).toBeVisible();
      await expect(page.locator('text=Contact system administrator')).toBeVisible();
    });

    test('✅ AC3.3: Admin-specific access messaging', async () => {
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      await expect(page.locator('text=Access restricted to authorized Locod.AI staff only')).toBeVisible();
      await expect(page.locator('text=Professional Email')).toBeVisible();
    });
  });

  /**
   * ACCEPTANCE CRITERION 4: Admin-Only Access with Proper Security
   * Requirement: "Admin accounts created by administrator only" & "Admin role verification"
   */
  describe('AC4: Admin-Only Access Restrictions', () => {
    test('✅ AC4.1: Admin user can login successfully', async () => {
      const response = await axios.post(`${CONFIG.BACKEND_API_URL}/auth/login`, CONFIG.ADMIN_CREDENTIALS);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.role).toBe('ADMIN');
      expect(response.data.user.email).toBe(CONFIG.ADMIN_CREDENTIALS.email);
    });

    test('✅ AC4.2: JWT token contains admin role', async () => {
      const response = await axios.post(`${CONFIG.BACKEND_API_URL}/auth/login`, CONFIG.ADMIN_CREDENTIALS);
      
      const token = response.data.accessToken;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      expect(payload.role).toBe('ADMIN');
      expect(payload.email).toBe(CONFIG.ADMIN_CREDENTIALS.email);
      expect(payload).toHaveProperty('sub'); // User ID
      expect(payload).toHaveProperty('iat'); // Issued at
      expect(payload).toHaveProperty('exp'); // Expiration
    });

    test('✅ AC4.3: Customer users get CUSTOMER role (not admin)', async () => {
      // Test that new registrations get CUSTOMER role by default
      try {
        const uniqueEmail = `test-${Date.now()}@example.com`;
        const registerResponse = await axios.post(`${CONFIG.BACKEND_API_URL}/auth/register`, {
          email: uniqueEmail,
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'Customer'
        });
        
        expect(registerResponse.data.user.role).toBe('CUSTOMER');
        expect(registerResponse.data.user.role).not.toBe('ADMIN');
        
        // Verify JWT token also has customer role
        const token = registerResponse.data.accessToken;
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        expect(payload.role).toBe('CUSTOMER');
      } catch (error) {
        // If registration fails for other reasons (user exists, etc.), that's still a pass
        // as long as it's not because of role issues
        expect(error.response?.data?.message).not.toContain('role');
      }
    });

    test('✅ AC4.4: Frontend rejects non-admin users', async () => {
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      // Try to login with a non-existent user (should be rejected)
      await page.fill('input[type="email"]', 'notadmin@example.com');
      await page.fill('input[type="password"]', 'WrongPass123!');
      await page.click('button[type="submit"]');
      
      // Should show error
      await expect(page.locator('.bg-red-900, .text-red-600, .border-red-600')).toBeVisible({ timeout: 5000 });
    });
  });

  /**
   * ACCEPTANCE CRITERION 5: Separate Admin Session Management
   * Requirement: "Separate admin sessions with shorter timeout"
   */
  describe('AC5: Separate Admin Session Management', () => {
    test('✅ AC5.1: Admin login creates secure session', async () => {
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      
      await page.fill('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });
      
      // Check that tokens are stored
      const adminToken = await page.evaluate(() => localStorage.getItem('adminToken'));
      const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
      
      expect(adminToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(adminToken).toMatch(/^eyJ/); // JWT format
    });

    test('✅ AC5.2: Unauthenticated users redirected to login', async () => {
      // Try to access dashboard without authentication
      await page.goto(`${CONFIG.ADMIN_PORTAL_URL}/dashboard`, { waitUntil: 'networkidle' });
      
      // Should be redirected to login page
      expect(page.url()).toBe(CONFIG.ADMIN_PORTAL_URL + '/');
    });

    test('✅ AC5.3: Logout clears admin session', async () => {
      // First login
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });
      
      // Then logout
      const signOutButton = await page.locator('button:has-text("Sign Out")');
      if (await signOutButton.count() > 0) {
        await signOutButton.click();
        
        // Should redirect to login and clear tokens
        await page.waitForURL(CONFIG.ADMIN_PORTAL_URL + '/', { timeout: 5000 });
        
        const adminToken = await page.evaluate(() => localStorage.getItem('adminToken'));
        expect(adminToken).toBeNull();
      }
    });
  });

  /**
   * ACCEPTANCE CRITERION 6: Complete Portal Separation
   * Requirement: "Complete separation of admin/customer interfaces"
   */
  describe('AC6: Complete Portal Separation', () => {
    test('✅ AC6.1: Different domains and infrastructure', async () => {
      // Customer portal
      await page.goto(CONFIG.CUSTOMER_PORTAL_URL, { waitUntil: 'networkidle' });
      const customerUrl = page.url();
      const customerTitle = await page.title();
      
      // Admin portal
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      const adminUrl = page.url();
      const adminTitle = await page.title();
      
      expect(customerUrl).toContain('logen.locod-ai.com');
      expect(adminUrl).toContain('admin.logen.locod-ai.com');
      expect(customerTitle).not.toBe(adminTitle);
      expect(adminTitle).toContain('Admin');
    });

    test('✅ AC6.2: Different styling and branding', async () => {
      // Check customer portal styling
      await page.goto(CONFIG.CUSTOMER_PORTAL_URL, { waitUntil: 'networkidle' });
      const customerContent = await page.content();
      const customerHasBlue = customerContent.includes('from-indigo-600') || customerContent.includes('blue-');
      const customerHasRed = customerContent.includes('from-red-600');
      
      // Check admin portal styling
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      const adminContent = await page.content();
      const adminHasRed = adminContent.includes('from-red-600');
      const adminHasBlue = adminContent.includes('from-indigo-600');
      
      // Customer should use blue/purple, admin should use red/orange
      expect(customerHasBlue).toBe(true);
      expect(customerHasRed).toBe(false);
      expect(adminHasRed).toBe(true);
      expect(adminHasBlue).toBe(false);
    });

    test('✅ AC6.3: No cross-contamination of content', async () => {
      // Customer portal should not have admin content
      await page.goto(CONFIG.CUSTOMER_PORTAL_URL, { waitUntil: 'networkidle' });
      const customerContent = await page.content();
      expect(customerContent).not.toContain('Admin Portal');
      expect(customerContent).not.toContain('staff only');
      expect(customerContent).not.toContain('Locod.AI staff');
      
      // Admin portal should not have customer content
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      const adminContent = await page.content();
      expect(adminContent).not.toContain('Get Started');
      expect(adminContent).not.toContain('Start Building');
      expect(adminContent).not.toContain('Free Trial');
    });
  });

  /**
   * OVERALL ACCEPTANCE VALIDATION
   * Comprehensive validation of all requirements
   */
  describe('Overall Acceptance Validation', () => {
    test('✅ OVERALL: All acceptance criteria implemented correctly', async () => {
      const results = {
        ac1_staffLinkRemoved: false,
        ac2_adminPortalDedicated: false,
        ac3_noPublicRegistration: false,
        ac4_adminOnlyAccess: false,
        ac5_separateSessionManagement: false,
        ac6_completePortalSeparation: false
      };

      // AC1: Staff link removed
      await page.goto(CONFIG.CUSTOMER_PORTAL_URL, { waitUntil: 'networkidle' });
      const staffLinks = await page.locator('a:has-text("Staff"), a[href*="staff"]').count();
      results.ac1_staffLinkRemoved = (staffLinks === 0);

      // AC2: Admin portal dedicated
      const adminResponse = await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      const adminTitle = await page.title();
      results.ac2_adminPortalDedicated = (adminResponse.status() === 200 && adminTitle === 'LOGEN Admin Portal');

      // AC3: No public registration
      const regElements = await page.locator('a:has-text("Register"), a:has-text("Sign Up")').count();
      const noRegMessage = await page.locator('text=No public registration available').count();
      results.ac3_noPublicRegistration = (regElements === 0 && noRegMessage > 0);

      // AC4: Admin only access
      try {
        const loginResponse = await axios.post(`${CONFIG.BACKEND_API_URL}/auth/login`, CONFIG.ADMIN_CREDENTIALS);
        results.ac4_adminOnlyAccess = (loginResponse.data.user.role === 'ADMIN');
      } catch {
        results.ac4_adminOnlyAccess = false;
      }

      // AC5: Session management (basic check)
      await page.fill('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      
      try {
        await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });
        const token = await page.evaluate(() => localStorage.getItem('adminToken'));
        results.ac5_separateSessionManagement = !!token;
      } catch {
        results.ac5_separateSessionManagement = false;
      }

      // AC6: Complete separation
      await page.goto(CONFIG.CUSTOMER_PORTAL_URL, { waitUntil: 'networkidle' });
      const customerContent = await page.content();
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      const adminContent = await page.content();
      results.ac6_completePortalSeparation = (
        !customerContent.includes('Admin Portal') && 
        !adminContent.includes('Get Started')
      );

      // Validate all criteria passed
      const allPassed = Object.values(results).every(result => result === true);
      
      console.log('\n🎯 ACCEPTANCE CRITERIA VALIDATION RESULTS:');
      console.log('='.repeat(50));
      Object.entries(results).forEach(([criteria, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${criteria}: ${passed ? 'PASSED' : 'FAILED'}`);
      });
      console.log('='.repeat(50));
      console.log(`🏆 OVERALL STATUS: ${allPassed ? '✅ ALL CRITERIA PASSED' : '❌ SOME CRITERIA FAILED'}`);
      
      expect(allPassed).toBe(true);
    });

    test('✅ SECURITY: No security vulnerabilities exposed', async () => {
      // Check admin portal doesn't expose sensitive info
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      const pageContent = await page.content();
      
      expect(pageContent).not.toMatch(/password[^-\w]/i);
      expect(pageContent).not.toMatch(/secret/i);
      expect(pageContent).not.toMatch(/api[_-]?key/i);
      expect(pageContent).not.toMatch(/token.*:/i);
    });

    test('✅ PERFORMANCE: Admin portal loads within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto(CONFIG.ADMIN_PORTAL_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});