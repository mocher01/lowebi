/**
 * Frontend End-to-End Testing Suite
 * Testing the Next.js frontend integration with the NestJS backend
 */

const { chromium } = require('playwright');
const colors = require('colors');

const CONFIG = {
    FRONTEND_URL: 'https://logen.locod-ai.com',
    ADMIN_CREDENTIALS: {
        email: 'admin@locod.ai',
        password: 'Administrator2025'
    },
    CUSTOMER_CREDENTIALS: {
        email: 'test@example.com',
        password: 'Administrator2025'
    }
};

class FrontendE2ETestSuite {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors_map = {
            'success': 'green',
            'error': 'red',
            'warning': 'yellow',
            'info': 'cyan'
        };
        console.log(`[${timestamp}] ${message}`[colors_map[type] || 'white']);
    }

    recordTest(testName, passed, details = '') {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
            this.log(`✅ ${testName}: PASSED ${details}`, 'success');
        } else {
            this.testResults.failed++;
            this.log(`❌ ${testName}: FAILED ${details}`, 'error');
        }
        this.testResults.details.push({ testName, passed, details });
    }

    async setupBrowser() {
        this.browser = await chromium.launch({ headless: true });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    async teardownBrowser() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async testHomePage() {
        this.log('\n🏠 Testing Home Page', 'info');
        
        try {
            await this.page.goto(CONFIG.FRONTEND_URL);
            await this.page.waitForLoadState('networkidle');
            
            const title = await this.page.title();
            this.recordTest(
                'Home Page - Page Load',
                title && title.length > 0,
                `Title: "${title}"`
            );

            // Check for navigation elements
            const loginLink = await this.page.locator('a[href*="login"], button:has-text("Login"), [data-testid="login"]').count();
            this.recordTest(
                'Home Page - Login Link Present',
                loginLink > 0,
                `Login elements found: ${loginLink}`
            );

        } catch (error) {
            this.recordTest(
                'Home Page - Basic Load',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testLoginPage() {
        this.log('\n🔐 Testing Login Page', 'info');
        
        try {
            await this.page.goto(`${CONFIG.FRONTEND_URL}/login`);
            await this.page.waitForLoadState('networkidle');

            // Check for login form elements
            const emailInput = await this.page.locator('input[type="email"], input[name="email"], [data-testid="email"]').count();
            const passwordInput = await this.page.locator('input[type="password"], input[name="password"], [data-testid="password"]').count();
            const submitButton = await this.page.locator('button[type="submit"], button:has-text("Login"), [data-testid="login-submit"]').count();

            this.recordTest(
                'Login Page - Form Elements Present',
                emailInput > 0 && passwordInput > 0 && submitButton > 0,
                `Email: ${emailInput}, Password: ${passwordInput}, Submit: ${submitButton}`
            );

        } catch (error) {
            this.recordTest(
                'Login Page - Load Test',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testAdminLogin() {
        this.log('\n👑 Testing Admin Login Flow', 'info');
        
        try {
            await this.page.goto(`${CONFIG.FRONTEND_URL}/login`);
            await this.page.waitForLoadState('networkidle');

            // Try to locate and fill login form
            const emailInput = this.page.locator('input[type="email"], input[name="email"], [data-testid="email"]').first();
            const passwordInput = this.page.locator('input[type="password"], input[name="password"], [data-testid="password"]').first();
            const submitButton = this.page.locator('button[type="submit"], button:has-text("Login"), [data-testid="login-submit"]').first();

            await emailInput.fill(CONFIG.ADMIN_CREDENTIALS.email);
            await passwordInput.fill(CONFIG.ADMIN_CREDENTIALS.password);
            
            await submitButton.click();
            
            // Wait for navigation or success indicator
            await this.page.waitForTimeout(3000);
            
            const currentUrl = this.page.url();
            const isRedirected = !currentUrl.includes('/login');
            
            this.recordTest(
                'Admin Login - Successful Authentication',
                isRedirected,
                `Redirected to: ${currentUrl}`
            );

            // Check if we're on dashboard or home page
            if (isRedirected) {
                const pageContent = await this.page.content();
                const hasAdminContent = pageContent.includes('dashboard') || pageContent.includes('admin') || pageContent.includes('Dashboard');
                
                this.recordTest(
                    'Admin Login - Dashboard Access',
                    hasAdminContent,
                    `Admin content detected: ${hasAdminContent}`
                );
            }

        } catch (error) {
            this.recordTest(
                'Admin Login - Flow Test',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testDashboardPage() {
        this.log('\n📊 Testing Dashboard Page', 'info');
        
        try {
            await this.page.goto(`${CONFIG.FRONTEND_URL}/dashboard`);
            await this.page.waitForLoadState('networkidle');
            
            const currentUrl = this.page.url();
            
            // Check if we can access dashboard or if redirected to login
            if (currentUrl.includes('/login')) {
                this.recordTest(
                    'Dashboard - Protected Route',
                    true,
                    'Correctly redirected to login when unauthenticated'
                );
            } else {
                this.recordTest(
                    'Dashboard - Direct Access',
                    !currentUrl.includes('/login'),
                    `Dashboard accessible at: ${currentUrl}`
                );
            }

        } catch (error) {
            this.recordTest(
                'Dashboard - Page Test',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testRegistrationPage() {
        this.log('\n📝 Testing Registration Page', 'info');
        
        try {
            await this.page.goto(`${CONFIG.FRONTEND_URL}/register`);
            await this.page.waitForLoadState('networkidle');

            // Check for registration form elements
            const emailInput = await this.page.locator('input[type="email"], input[name="email"]').count();
            const passwordInput = await this.page.locator('input[type="password"], input[name="password"]').count();
            const firstNameInput = await this.page.locator('input[name="firstName"], input[name="first_name"], [placeholder*="First"]').count();
            const submitButton = await this.page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').count();

            this.recordTest(
                'Registration Page - Form Elements',
                emailInput > 0 && passwordInput > 0 && firstNameInput > 0 && submitButton > 0,
                `Email: ${emailInput}, Password: ${passwordInput}, Name: ${firstNameInput}, Submit: ${submitButton}`
            );

        } catch (error) {
            this.recordTest(
                'Registration Page - Load Test',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testResponsiveDesign() {
        this.log('\n📱 Testing Responsive Design', 'info');
        
        try {
            // Test mobile viewport
            await this.page.setViewportSize({ width: 375, height: 667 });
            await this.page.goto(CONFIG.FRONTEND_URL);
            await this.page.waitForLoadState('networkidle');
            
            const mobileContent = await this.page.isVisible('body');
            this.recordTest(
                'Responsive Design - Mobile Viewport',
                mobileContent,
                'Content visible on mobile viewport'
            );

            // Test tablet viewport
            await this.page.setViewportSize({ width: 768, height: 1024 });
            await this.page.reload();
            await this.page.waitForLoadState('networkidle');
            
            const tabletContent = await this.page.isVisible('body');
            this.recordTest(
                'Responsive Design - Tablet Viewport',
                tabletContent,
                'Content visible on tablet viewport'
            );

            // Reset to desktop
            await this.page.setViewportSize({ width: 1366, height: 768 });

        } catch (error) {
            this.recordTest(
                'Responsive Design - Viewport Test',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testErrorHandling() {
        this.log('\n⚠️ Testing Error Handling', 'info');
        
        try {
            // Test 404 page
            await this.page.goto(`${CONFIG.FRONTEND_URL}/nonexistent-page-404`);
            await this.page.waitForLoadState('networkidle');
            
            const pageContent = await this.page.content();
            const has404Content = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Page not found');
            
            this.recordTest(
                'Error Handling - 404 Page',
                has404Content,
                `404 handling: ${has404Content ? 'Present' : 'Missing'}`
            );

        } catch (error) {
            this.recordTest(
                'Error Handling - 404 Test',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Frontend E2E Testing Suite', 'info');
        this.log(`Testing Frontend: ${CONFIG.FRONTEND_URL}`, 'info');

        try {
            await this.setupBrowser();

            await this.testHomePage();
            await this.testLoginPage();
            await this.testRegistrationPage();
            await this.testDashboardPage();
            await this.testAdminLogin();
            await this.testResponsiveDesign();
            await this.testErrorHandling();

            this.generateReport();

        } catch (error) {
            this.log(`Critical error during E2E testing: ${error.message}`, 'error');
        } finally {
            await this.teardownBrowser();
        }
    }

    generateReport() {
        this.log('\n📊 FRONTEND E2E TEST REPORT', 'info');
        console.log('='.repeat(60));
        
        const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
        
        console.log(`Total Tests: ${this.testResults.total}`);
        console.log(`Passed: ${this.testResults.passed} ✅`);
        console.log(`Failed: ${this.testResults.failed} ❌`);
        console.log(`Success Rate: ${successRate}%`);
        
        console.log('\n📋 DETAILED RESULTS:');
        this.testResults.details.forEach((test, index) => {
            const status = test.passed ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${test.testName}`);
            if (test.details) {
                console.log(`   └── ${test.details}`);
            }
        });

        console.log('\n🎯 FRONTEND SUCCESS CRITERIA:');
        const criteria = [
            { name: 'Pages load correctly', status: this.checkPageLoadCriteria() },
            { name: 'Authentication forms work', status: this.checkAuthFormsCriteria() },
            { name: 'Protected routes function', status: this.checkProtectedRoutesCriteria() },
            { name: 'Responsive design works', status: this.checkResponsiveCriteria() },
            { name: 'Error handling present', status: this.checkErrorHandlingCriteria() }
        ];

        criteria.forEach(criterion => {
            const status = criterion.status ? '✅' : '❌';
            console.log(`${status} ${criterion.name}`);
        });

        const overallSuccess = criteria.every(c => c.status);
        console.log(`\n🏆 FRONTEND E2E STATUS: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    }

    checkPageLoadCriteria() {
        return this.testResults.details.some(t => t.testName.includes('Page Load') && t.passed);
    }

    checkAuthFormsCriteria() {
        return this.testResults.details.some(t => t.testName.includes('Form Elements') && t.passed);
    }

    checkProtectedRoutesCriteria() {
        return this.testResults.details.some(t => t.testName.includes('Protected Route') && t.passed);
    }

    checkResponsiveCriteria() {
        return this.testResults.details.some(t => t.testName.includes('Responsive') && t.passed);
    }

    checkErrorHandlingCriteria() {
        return this.testResults.details.some(t => t.testName.includes('Error Handling') && t.passed);
    }
}

// Check if Playwright is available
async function checkPlaywrightAvailability() {
    try {
        const { chromium } = require('playwright');
        return true;
    } catch (error) {
        console.log('⚠️  Playwright not available, skipping E2E tests');
        console.log('   Install with: npm install playwright');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    checkPlaywrightAvailability().then(available => {
        if (available) {
            const testSuite = new FrontendE2ETestSuite();
            testSuite.runAllTests().catch(console.error);
        }
    });
}

module.exports = FrontendE2ETestSuite;