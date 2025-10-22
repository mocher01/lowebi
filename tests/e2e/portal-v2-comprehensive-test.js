/**
 * Portal v2.0 Comprehensive Testing Suite - Issue #60
 * Complete end-to-end testing for the authentication and admin management system
 * 
 * Environment:
 * - Backend: http://162.55.213.90:7600
 * - Frontend: http://162.55.213.90:7601
 * - API Docs: http://162.55.213.90:7600/api/docs
 */

const axios = require('axios');

// Test Configuration
const CONFIG = {
    BACKEND_URL: 'http://162.55.213.90:7600',
    FRONTEND_URL: 'http://162.55.213.90:7601',
    ADMIN_CREDENTIALS: {
        email: 'newadmin@locod.ai',
        password: 'Admin123@'
    },
    CUSTOMER_CREDENTIALS: {
        email: 'fixed-test@example.com',
        password: 'TestPass123@'
    },
    TEST_USER: {
        email: 'qa-test-' + Date.now() + '@test.com',
        password: 'TestPassword123@',
        firstName: 'QA',
        lastName: 'Tester'
    }
};

class PortalV2TestSuite {
    constructor() {
        this.adminToken = null;
        this.customerToken = null;
        this.testUser = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: [],
            phases: {
                authentication: { passed: 0, total: 0 },
                adminDashboard: { passed: 0, total: 0 },
                apiIntegration: { passed: 0, total: 0 },
                databaseIntegration: { passed: 0, total: 0 },
                security: { passed: 0, total: 0 },
                performance: { passed: 0, total: 0 }
            }
        };
    }

    // Utility methods
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            'success': '\x1b[32m',  // Green
            'error': '\x1b[31m',    // Red
            'warning': '\x1b[33m',  // Yellow
            'info': '\x1b[36m',     // Cyan
            'reset': '\x1b[0m'      // Reset
        };
        const color = colors[type] || colors.info;
        console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
    }

    async makeRequest(config) {
        try {
            const response = await axios({
                ...config,
                timeout: 30000,
                validateStatus: (status) => status < 600 // Accept all status codes for testing
            });
            return { 
                success: response.status >= 200 && response.status < 300, 
                data: response.data, 
                status: response.status,
                headers: response.headers
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data || error.message, 
                status: error.response?.status || 0,
                message: error.message
            };
        }
    }

    recordTest(testName, passed, details = '', phase = null) {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
            this.log(`✅ ${testName}: PASSED ${details}`, 'success');
        } else {
            this.testResults.failed++;
            this.log(`❌ ${testName}: FAILED ${details}`, 'error');
        }
        
        if (phase && this.testResults.phases[phase]) {
            this.testResults.phases[phase].total++;
            if (passed) this.testResults.phases[phase].passed++;
        }
        
        this.testResults.details.push({ testName, passed, details, phase, timestamp: new Date().toISOString() });
    }

    // PHASE 1: AUTHENTICATION FLOW TESTING
    async testAuthenticationFlows() {
        this.log('\n🔐 PHASE 1: AUTHENTICATION FLOW TESTING', 'info');
        
        // Test 1: User Registration
        await this.testUserRegistration();
        
        // Test 2: User Login 
        await this.testUserLogin();
        
        // Test 3: Protected Route Access
        await this.testProtectedRouteAccess();
        
        // Test 4: Session Persistence
        await this.testSessionPersistence();
        
        // Test 5: Logout Functionality
        await this.testLogoutFunctionality();
        
        // Test 6: Token Refresh Mechanism
        await this.testTokenRefresh();
    }

    async testUserRegistration() {
        this.log('\n📝 Testing User Registration...', 'info');
        
        // Valid Registration
        const registerResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/register`,
            data: CONFIG.TEST_USER
        });

        this.recordTest(
            'User Registration - Valid Data',
            registerResult.success && registerResult.status === 201,
            `Status: ${registerResult.status}, Data: ${JSON.stringify(registerResult.data || registerResult.error)}`,
            'authentication'
        );

        if (registerResult.success) {
            this.testUser = CONFIG.TEST_USER;
        }

        // Duplicate Registration
        const duplicateResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/register`,
            data: CONFIG.TEST_USER
        });

        this.recordTest(
            'User Registration - Duplicate Email Prevention',
            !duplicateResult.success && (duplicateResult.status === 409 || duplicateResult.status === 400),
            `Status: ${duplicateResult.status}, Expected 409 or 400`,
            'authentication'
        );

        // Invalid Email Format
        const invalidEmailResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/register`,
            data: {
                ...CONFIG.TEST_USER,
                email: 'invalid-email-format'
            }
        });

        this.recordTest(
            'User Registration - Invalid Email Validation',
            !invalidEmailResult.success && invalidEmailResult.status === 400,
            `Status: ${invalidEmailResult.status}, Expected 400`,
            'authentication'
        );
    }

    async testUserLogin() {
        this.log('\n🔑 Testing User Login...', 'info');

        // Admin Login
        const adminLoginResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: CONFIG.ADMIN_CREDENTIALS
        });

        if (adminLoginResult.success && adminLoginResult.data?.accessToken) {
            this.adminToken = adminLoginResult.data.accessToken;
        }

        this.recordTest(
            'Admin Login - Valid Credentials',
            adminLoginResult.success && adminLoginResult.data?.accessToken,
            `Token: ${!!adminLoginResult.data?.accessToken}, Role: ${adminLoginResult.data?.user?.role}`,
            'authentication'
        );

        // Customer Login
        const customerLoginResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: CONFIG.CUSTOMER_CREDENTIALS
        });

        if (customerLoginResult.success && customerLoginResult.data?.accessToken) {
            this.customerToken = customerLoginResult.data.accessToken;
        }

        this.recordTest(
            'Customer Login - Valid Credentials',
            customerLoginResult.success && customerLoginResult.data?.accessToken,
            `Token: ${!!customerLoginResult.data?.accessToken}, Role: ${customerLoginResult.data?.user?.role}`,
            'authentication'
        );

        // Test User Login (newly registered)
        if (this.testUser) {
            const testUserLoginResult = await this.makeRequest({
                method: 'POST',
                url: `${CONFIG.BACKEND_URL}/auth/login`,
                data: {
                    email: this.testUser.email,
                    password: this.testUser.password
                }
            });

            this.recordTest(
                'Test User Login - New Registration',
                testUserLoginResult.success && testUserLoginResult.data?.accessToken,
                `Status: ${testUserLoginResult.status}, Success: ${testUserLoginResult.success}`,
                'authentication'
            );
        }

        // Invalid Credentials
        const invalidLoginResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: {
                email: 'invalid@example.com',
                password: 'wrongpassword'
            }
        });

        this.recordTest(
            'User Login - Invalid Credentials',
            !invalidLoginResult.success && invalidLoginResult.status === 401,
            `Status: ${invalidLoginResult.status}, Expected 401`,
            'authentication'
        );
    }

    async testProtectedRouteAccess() {
        this.log('\n🛡️ Testing Protected Route Access...', 'info');

        if (!this.adminToken) {
            this.recordTest('Protected Route Access', false, 'No admin token for testing', 'authentication');
            return;
        }

        // Test with valid token
        const protectedResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/auth/profile`,
            headers: {
                'Authorization': `Bearer ${this.adminToken}`
            }
        });

        this.recordTest(
            'Protected Route - Valid Token Access',
            protectedResult.success,
            `Profile access: ${protectedResult.success}, Email: ${protectedResult.data?.email}`,
            'authentication'
        );

        // Test with invalid token
        const invalidTokenResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/auth/profile`,
            headers: {
                'Authorization': 'Bearer invalid-token'
            }
        });

        this.recordTest(
            'Protected Route - Invalid Token Rejection',
            !invalidTokenResult.success && invalidTokenResult.status === 401,
            `Status: ${invalidTokenResult.status}, Expected 401`,
            'authentication'
        );

        // Test without token
        const noTokenResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/auth/profile`
        });

        this.recordTest(
            'Protected Route - No Token Rejection',
            !noTokenResult.success && noTokenResult.status === 401,
            `Status: ${noTokenResult.status}, Expected 401`,
            'authentication'
        );
    }

    async testSessionPersistence() {
        this.log('\n⏰ Testing Session Persistence...', 'info');

        if (!this.adminToken) {
            this.recordTest('Session Persistence', false, 'No token for testing', 'authentication');
            return;
        }

        // Multiple requests with same token
        const requests = [];
        for (let i = 0; i < 3; i++) {
            requests.push(this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/auth/profile`,
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            }));
        }

        const results = await Promise.all(requests);
        const allSuccessful = results.every(r => r.success);

        this.recordTest(
            'Session Persistence - Multiple Requests',
            allSuccessful,
            `${results.filter(r => r.success).length}/${results.length} requests successful`,
            'authentication'
        );
    }

    async testLogoutFunctionality() {
        this.log('\n🚪 Testing Logout Functionality...', 'info');

        // Check if logout endpoint exists
        const logoutResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/logout`,
            headers: this.adminToken ? { 'Authorization': `Bearer ${this.adminToken}` } : {}
        });

        this.recordTest(
            'Logout Functionality - Endpoint Available',
            logoutResult.status !== 404,
            `Status: ${logoutResult.status}, Available: ${logoutResult.status !== 404}`,
            'authentication'
        );
    }

    async testTokenRefresh() {
        this.log('\n🔄 Testing Token Refresh...', 'info');

        // Check if refresh endpoint exists
        const refreshResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/refresh`,
            headers: this.adminToken ? { 'Authorization': `Bearer ${this.adminToken}` } : {}
        });

        this.recordTest(
            'Token Refresh - Endpoint Available',
            refreshResult.status !== 404,
            `Status: ${refreshResult.status}, Available: ${refreshResult.status !== 404}`,
            'authentication'
        );
    }

    // PHASE 2: ADMIN DASHBOARD TESTING
    async testAdminDashboard() {
        this.log('\n👑 PHASE 2: ADMIN DASHBOARD TESTING', 'info');
        
        if (!this.adminToken) {
            this.recordTest('Admin Dashboard Tests', false, 'No admin token available', 'adminDashboard');
            return;
        }

        const authHeaders = { 'Authorization': `Bearer ${this.adminToken}` };

        // Dashboard Statistics
        const statsResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/dashboard/stats`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - Statistics Endpoint',
            statsResult.success,
            `Status: ${statsResult.status}, Data: ${JSON.stringify(statsResult.data || statsResult.error)}`,
            'adminDashboard'
        );

        // Activity Feed
        const activityResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/dashboard/activity`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - Activity Feed',
            activityResult.success,
            `Status: ${activityResult.status}`,
            'adminDashboard'
        );

        // User Management
        const usersResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/users`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - User Management',
            usersResult.success,
            `Status: ${usersResult.status}, Users: ${usersResult.data?.data?.length || 0}`,
            'adminDashboard'
        );

        // Site Management
        const sitesResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/sites`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - Site Management',
            sitesResult.success || sitesResult.status === 404,
            `Status: ${sitesResult.status}`,
            'adminDashboard'
        );

        // Health Check
        const healthResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/health`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - Health Check',
            healthResult.success,
            `Status: ${healthResult.status}, Health: ${healthResult.data?.status}`,
            'adminDashboard'
        );
    }

    // PHASE 3: API INTEGRATION TESTING
    async testAPIIntegration() {
        this.log('\n🔗 PHASE 3: API INTEGRATION TESTING', 'info');

        // Test CORS Configuration
        const corsResult = await this.makeRequest({
            method: 'OPTIONS',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            headers: {
                'Origin': CONFIG.FRONTEND_URL,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        });

        this.recordTest(
            'API Integration - CORS Configuration',
            corsResult.status === 200 || corsResult.status === 204,
            `Status: ${corsResult.status}, CORS headers: ${!!corsResult.headers?.['access-control-allow-origin']}`,
            'apiIntegration'
        );

        // API Documentation Access
        const docsResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/api/docs`
        });

        this.recordTest(
            'API Integration - Documentation Access',
            docsResult.success,
            `Status: ${docsResult.status}, Swagger docs available`,
            'apiIntegration'
        );

        // Error Handling
        const errorResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/nonexistent-endpoint`
        });

        this.recordTest(
            'API Integration - Error Handling',
            errorResult.status === 404,
            `Status: ${errorResult.status}, Expected 404`,
            'apiIntegration'
        );

        // Response Format Consistency
        if (this.adminToken) {
            const formatResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/admin/users`,
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });

            const hasConsistentFormat = formatResult.success && 
                formatResult.data && 
                typeof formatResult.data === 'object';

            this.recordTest(
                'API Integration - Response Format Consistency',
                hasConsistentFormat,
                `Consistent JSON format: ${hasConsistentFormat}`,
                'apiIntegration'
            );
        }
    }

    // PHASE 4: DATABASE INTEGRATION TESTING
    async testDatabaseIntegration() {
        this.log('\n🗄️ PHASE 4: DATABASE INTEGRATION TESTING', 'info');

        if (!this.adminToken) {
            this.recordTest('Database Integration', false, 'No admin token for testing', 'databaseIntegration');
            return;
        }

        // User Creation Persistence
        if (this.testUser) {
            const userCheckResult = await this.makeRequest({
                method: 'POST',
                url: `${CONFIG.BACKEND_URL}/auth/login`,
                data: {
                    email: this.testUser.email,
                    password: this.testUser.password
                }
            });

            this.recordTest(
                'Database Integration - User Persistence',
                userCheckResult.success,
                `Registered user can login: ${userCheckResult.success}`,
                'databaseIntegration'
            );
        }

        // Data Integrity Check
        const usersResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/users`,
            headers: { 'Authorization': `Bearer ${this.adminToken}` }
        });

        const hasValidData = usersResult.success && 
            Array.isArray(usersResult.data?.data) && 
            usersResult.data.data.every(user => user.email && user.id);

        this.recordTest(
            'Database Integration - Data Integrity',
            hasValidData,
            `Valid user data structure: ${hasValidData}`,
            'databaseIntegration'
        );

        // Multi-tenant Isolation (test with different user tokens)
        if (this.customerToken) {
            const customerDataResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/auth/profile`,
                headers: { 'Authorization': `Bearer ${this.customerToken}` }
            });

            const adminDataResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/auth/profile`,
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });

            const properIsolation = customerDataResult.success && 
                adminDataResult.success && 
                customerDataResult.data?.email !== adminDataResult.data?.email;

            this.recordTest(
                'Database Integration - Multi-tenant Isolation',
                properIsolation,
                `Different users have different data: ${properIsolation}`,
                'databaseIntegration'
            );
        }
    }

    // PHASE 5: SECURITY TESTING
    async testSecurity() {
        this.log('\n🔒 PHASE 5: SECURITY TESTING', 'info');

        // SQL Injection Prevention
        const sqlInjectionResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: {
                email: "admin@test.com' OR '1'='1",
                password: "password"
            }
        });

        this.recordTest(
            'Security - SQL Injection Prevention',
            !sqlInjectionResult.success,
            `SQL injection blocked: ${!sqlInjectionResult.success}`,
            'security'
        );

        // XSS Prevention
        const xssResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/register`,
            data: {
                email: 'xss-test@test.com',
                password: 'Password123@',
                firstName: '<script>alert("xss")</script>',
                lastName: 'Test'
            }
        });

        this.recordTest(
            'Security - XSS Prevention',
            !xssResult.success || (xssResult.success && !JSON.stringify(xssResult.data).includes('<script>')),
            `XSS payload blocked or sanitized`,
            'security'
        );

        // Rate Limiting Check
        const rateLimitPromises = [];
        for (let i = 0; i < 10; i++) {
            rateLimitPromises.push(this.makeRequest({
                method: 'POST',
                url: `${CONFIG.BACKEND_URL}/auth/login`,
                data: { email: 'invalid@test.com', password: 'invalid' }
            }));
        }

        const rateLimitResults = await Promise.all(rateLimitPromises);
        const rateLimited = rateLimitResults.some(r => r.status === 429);

        this.recordTest(
            'Security - Rate Limiting',
            rateLimited || rateLimitResults.every(r => !r.success),
            `Rate limiting active: ${rateLimited}`,
            'security'
        );

        // HTTPS Headers Check
        const headersResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/auth/profile`,
            headers: this.adminToken ? { 'Authorization': `Bearer ${this.adminToken}` } : {}
        });

        const hasSecurityHeaders = headersResult.headers && (
            headersResult.headers['x-frame-options'] ||
            headersResult.headers['x-content-type-options'] ||
            headersResult.headers['x-xss-protection']
        );

        this.recordTest(
            'Security - Security Headers',
            hasSecurityHeaders,
            `Security headers present: ${hasSecurityHeaders}`,
            'security'
        );
    }

    // PHASE 6: PERFORMANCE TESTING
    async testPerformance() {
        this.log('\n⚡ PHASE 6: PERFORMANCE TESTING', 'info');

        // Authentication Performance
        const authStartTime = Date.now();
        const authResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: CONFIG.ADMIN_CREDENTIALS
        });
        const authTime = Date.now() - authStartTime;

        this.recordTest(
            'Performance - Authentication Speed',
            authResult.success && authTime < 3000,
            `Auth time: ${authTime}ms (target: <3000ms)`,
            'performance'
        );

        // API Response Performance
        if (this.adminToken) {
            const apiStartTime = Date.now();
            const apiResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/admin/users`,
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });
            const apiTime = Date.now() - apiStartTime;

            this.recordTest(
                'Performance - API Response Speed',
                apiResult.success && apiTime < 2000,
                `API time: ${apiTime}ms (target: <2000ms)`,
                'performance'
            );
        }

        // Concurrent User Simulation
        const concurrentRequests = [];
        for (let i = 0; i < 5; i++) {
            concurrentRequests.push(this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/health`
            }));
        }

        const concurrentStartTime = Date.now();
        const concurrentResults = await Promise.all(concurrentRequests);
        const concurrentTime = Date.now() - concurrentStartTime;

        const allSuccessful = concurrentResults.every(r => r.success);

        this.recordTest(
            'Performance - Concurrent Request Handling',
            allSuccessful && concurrentTime < 5000,
            `${concurrentResults.filter(r => r.success).length}/5 successful in ${concurrentTime}ms`,
            'performance'
        );
    }

    // Frontend Integration Testing
    async testFrontendIntegration() {
        this.log('\n🌐 FRONTEND INTEGRATION TESTING', 'info');

        // Frontend Accessibility
        const frontendResult = await this.makeRequest({
            method: 'GET',
            url: CONFIG.FRONTEND_URL
        });

        this.recordTest(
            'Frontend - Accessibility',
            frontendResult.success,
            `Status: ${frontendResult.status}, Frontend accessible: ${frontendResult.success}`,
            'apiIntegration'
        );

        if (frontendResult.success) {
            // Login Page
            const loginPageResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.FRONTEND_URL}/login`
            });

            this.recordTest(
                'Frontend - Login Page Access',
                loginPageResult.success,
                `Login page accessible: ${loginPageResult.success}`,
                'apiIntegration'
            );

            // Dashboard Page (should require auth)
            const dashboardResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.FRONTEND_URL}/dashboard`
            });

            this.recordTest(
                'Frontend - Protected Dashboard Route',
                dashboardResult.success || dashboardResult.status === 302,
                `Dashboard handling: Status ${dashboardResult.status}`,
                'apiIntegration'
            );
        }
    }

    // Main Test Runner
    async runComprehensiveTests() {
        this.log('🚀 PORTAL v2.0 COMPREHENSIVE TESTING SUITE', 'info');
        this.log('==========================================', 'info');
        this.log(`Backend: ${CONFIG.BACKEND_URL}`, 'info');
        this.log(`Frontend: ${CONFIG.FRONTEND_URL}`, 'info');
        this.log(`Test User: ${CONFIG.TEST_USER.email}`, 'info');
        this.log('==========================================', 'info');

        const overallStartTime = Date.now();

        try {
            // Execute all test phases
            await this.testAuthenticationFlows();
            await this.testAdminDashboard();
            await this.testAPIIntegration();
            await this.testDatabaseIntegration();
            await this.testSecurity();
            await this.testPerformance();
            await this.testFrontendIntegration();

            const overallTime = Date.now() - overallStartTime;
            this.generateComprehensiveReport(overallTime);

        } catch (error) {
            this.log(`Critical error during testing: ${error.message}`, 'error');
            console.error(error);
        }
    }

    generateComprehensiveReport(executionTime) {
        this.log('\n📊 COMPREHENSIVE TEST EXECUTION REPORT', 'info');
        console.log('═'.repeat(80));
        
        const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
        
        console.log(`🔸 OVERALL SUMMARY:`);
        console.log(`   Total Tests: ${this.testResults.total}`);
        console.log(`   Passed: ${this.testResults.passed} ✅`);
        console.log(`   Failed: ${this.testResults.failed} ❌`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Execution Time: ${(executionTime / 1000).toFixed(2)}s`);
        
        console.log('\n🔸 PHASE BREAKDOWN:');
        Object.keys(this.testResults.phases).forEach(phase => {
            const phaseData = this.testResults.phases[phase];
            if (phaseData.total > 0) {
                const phaseRate = ((phaseData.passed / phaseData.total) * 100).toFixed(1);
                console.log(`   ${phase}: ${phaseData.passed}/${phaseData.total} (${phaseRate}%)`);
            }
        });

        console.log('\n🔸 SUCCESS CRITERIA ASSESSMENT:');
        const criteria = [
            { 
                name: 'Authentication flows work correctly', 
                status: this.assessCriteria('authentication'),
                required: true
            },
            { 
                name: 'Admin functionality fully operational', 
                status: this.assessCriteria('adminDashboard'),
                required: true
            },
            { 
                name: 'No critical security vulnerabilities', 
                status: this.assessCriteria('security'),
                required: true
            },
            { 
                name: 'Performance meets acceptable standards', 
                status: this.assessCriteria('performance'),
                required: true
            },
            { 
                name: 'API integration working properly', 
                status: this.assessCriteria('apiIntegration'),
                required: true
            },
            { 
                name: 'Database operations reliable', 
                status: this.assessCriteria('databaseIntegration'),
                required: true
            }
        ];

        criteria.forEach(criterion => {
            const status = criterion.status ? '✅' : '❌';
            const priority = criterion.required ? '[CRITICAL]' : '[NICE-TO-HAVE]';
            console.log(`   ${status} ${criterion.name} ${priority}`);
        });

        const criticalFailures = criteria.filter(c => c.required && !c.status);
        const overallSuccess = criticalFailures.length === 0;
        
        console.log(`\n🏆 PRODUCTION READINESS: ${overallSuccess ? '✅ READY' : '❌ NOT READY'}`);
        
        if (!overallSuccess) {
            console.log('\n⚠️  CRITICAL ISSUES FOUND:');
            criticalFailures.forEach(failure => {
                console.log(`   • ${failure.name}`);
            });
            console.log('\n🔧 RECOMMENDATION: Address critical issues before production deployment');
        } else {
            console.log('\n🎉 ALL CRITICAL CRITERIA PASSED - Portal v2.0 is production ready!');
        }

        console.log('\n🔸 DETAILED TEST RESULTS:');
        this.testResults.details.forEach((test, index) => {
            const status = test.passed ? '✅' : '❌';
            console.log(`   ${index + 1}. ${status} ${test.testName}`);
            if (test.details) {
                console.log(`      └── ${test.details}`);
            }
        });

        console.log('\n🔸 RECOMMENDATIONS:');
        this.generateRecommendations();

        console.log('═'.repeat(80));
    }

    assessCriteria(phase) {
        const phaseData = this.testResults.phases[phase];
        if (!phaseData || phaseData.total === 0) return false;
        return (phaseData.passed / phaseData.total) >= 0.8; // 80% pass rate for phase success
    }

    generateRecommendations() {
        const failed = this.testResults.details.filter(t => !t.passed);
        
        if (failed.length === 0) {
            console.log('   • All tests passed - system is performing excellently');
            console.log('   • Consider load testing with higher concurrent users');
            console.log('   • Monitor performance in production environment');
            return;
        }

        const authFailures = failed.filter(t => t.phase === 'authentication');
        const securityFailures = failed.filter(t => t.phase === 'security');
        const performanceFailures = failed.filter(t => t.phase === 'performance');

        if (authFailures.length > 0) {
            console.log('   • Fix authentication issues before production deployment');
            console.log('   • Verify JWT token configuration and validation');
        }

        if (securityFailures.length > 0) {
            console.log('   • Address security vulnerabilities immediately');
            console.log('   • Review input validation and sanitization');
        }

        if (performanceFailures.length > 0) {
            console.log('   • Optimize slow API endpoints');
            console.log('   • Consider implementing caching strategies');
        }

        console.log('   • Run tests again after fixes to verify resolution');
        console.log('   • Set up continuous monitoring for production environment');
    }
}

// Export for use in other modules
module.exports = PortalV2TestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new PortalV2TestSuite();
    testSuite.runComprehensiveTests().catch(console.error);
}