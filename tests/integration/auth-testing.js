/**
 * Comprehensive Authentication and Admin System Testing Suite
 * Tests for Portal v2.0 - SPRINT TASK #54
 * 
 * Environment:
 * - Backend: 162.55.213.90:6000
 * - Frontend: 162.55.213.90:6001
 * - Test Accounts: newadmin@locod.ai / fixed-test@example.com
 */

const axios = require('axios');
const colors = require('colors');

// Test Configuration
const CONFIG = {
    BACKEND_URL: 'http://162.55.213.90:6000',
    FRONTEND_URL: 'http://162.55.213.90:6001',
    ADMIN_CREDENTIALS: {
        email: 'newadmin@locod.ai',
        password: 'Admin123@'
    },
    CUSTOMER_CREDENTIALS: {
        email: 'fixed-test@example.com',
        password: 'TestPass123@'
    },
    TEST_USER: {
        email: 'test-auth-' + Date.now() + '@test.com',
        password: 'TestPassword123@',
        firstName: 'Test',
        lastName: 'User'
    }
};

class AuthTestSuite {
    constructor() {
        this.adminToken = null;
        this.customerToken = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    // Utility methods
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

    async makeRequest(config) {
        try {
            const response = await axios(config);
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data || error.message, 
                status: error.response?.status 
            };
        }
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

    // PHASE 1: AUTHENTICATION SYSTEM TESTING
    async testUserRegistration() {
        this.log('\n🔐 Testing User Registration Flow', 'info');
        
        // Test 1: Valid Registration
        const registerResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/register`,
            data: CONFIG.TEST_USER
        });

        this.recordTest(
            'User Registration - Valid Data',
            registerResult.success && registerResult.status === 201,
            `Status: ${registerResult.status}, Response: ${JSON.stringify(registerResult.data?.message || registerResult.error)}`
        );

        // Test 2: Duplicate Registration
        const duplicateResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/register`,
            data: CONFIG.TEST_USER
        });

        this.recordTest(
            'User Registration - Duplicate Email',
            !duplicateResult.success && duplicateResult.status === 409,
            `Status: ${duplicateResult.status}, Expected 409`
        );

        // Test 3: Invalid Email Format
        const invalidEmailResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/register`,
            data: {
                ...CONFIG.TEST_USER,
                email: 'invalid-email'
            }
        });

        this.recordTest(
            'User Registration - Invalid Email',
            !invalidEmailResult.success && invalidEmailResult.status === 400,
            `Status: ${invalidEmailResult.status}, Expected 400`
        );
    }

    async testUserLogin() {
        this.log('\n🔑 Testing User Login Flow', 'info');

        // Test 1: Valid Admin Login
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
            `Token received: ${!!adminLoginResult.data?.accessToken}, Role: ${adminLoginResult.data?.user?.role}`
        );

        // Test 2: Valid Customer Login
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
            `Token received: ${!!customerLoginResult.data?.accessToken}, Role: ${customerLoginResult.data?.user?.role}`
        );

        // Test 3: Invalid Credentials
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
            `Status: ${invalidLoginResult.status}, Expected 401`
        );

        // Test 4: Test User Login (newly registered)
        const testUserLoginResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: {
                email: CONFIG.TEST_USER.email,
                password: CONFIG.TEST_USER.password
            }
        });

        this.recordTest(
            'Test User Login - New Registration',
            testUserLoginResult.success && testUserLoginResult.data?.accessToken,
            `Login after registration: ${testUserLoginResult.success ? 'SUCCESS' : 'FAILED'} (Status: ${testUserLoginResult.status || 'N/A'})`
        );
    }

    async testJWTTokenManagement() {
        this.log('\n🎫 Testing JWT Token Management', 'info');

        if (!this.adminToken) {
            this.recordTest('JWT Token Management', false, 'No admin token available for testing');
            return;
        }

        // Test 1: Access Protected Endpoint with Valid Token
        const protectedResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/auth/profile`,
            headers: {
                'Authorization': `Bearer ${this.adminToken}`
            }
        });

        this.recordTest(
            'JWT Token - Access Protected Endpoint',
            protectedResult.success,
            `Profile access: ${protectedResult.success}, User: ${protectedResult.data?.email}`
        );

        // Test 2: Access with Invalid Token
        const invalidTokenResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/auth/profile`,
            headers: {
                'Authorization': 'Bearer invalid-token-here'
            }
        });

        this.recordTest(
            'JWT Token - Invalid Token Rejection',
            !invalidTokenResult.success && invalidTokenResult.status === 401,
            `Status: ${invalidTokenResult.status}, Expected 401`
        );

        // Test 3: Access without Token
        const noTokenResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/auth/profile`
        });

        this.recordTest(
            'JWT Token - No Token Rejection',
            !noTokenResult.success && noTokenResult.status === 401,
            `Status: ${noTokenResult.status}, Expected 401`
        );
    }

    // PHASE 2: ADMIN DASHBOARD API TESTING
    async testAdminDashboardEndpoints() {
        this.log('\n👑 Testing Admin Dashboard Endpoints', 'info');

        if (!this.adminToken) {
            this.recordTest('Admin Dashboard Tests', false, 'No admin token available');
            return;
        }

        const authHeaders = { 'Authorization': `Bearer ${this.adminToken}` };

        // Test 1: Dashboard Stats
        const statsResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/dashboard/stats`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - Statistics',
            statsResult.success,
            `Stats retrieved: ${statsResult.success}, Data: ${JSON.stringify(statsResult.data)}`
        );

        // Test 2: Activity Feed
        const activityResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/dashboard/activity`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - Activity Feed',
            activityResult.success,
            `Activity feed: ${activityResult.success}`
        );

        // Test 3: Health Check
        const healthResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/health`,
            headers: authHeaders
        });

        this.recordTest(
            'Admin Dashboard - Health Check',
            healthResult.success,
            `Health status: ${healthResult.success}, Status: ${healthResult.data?.status}`
        );
    }

    async testUserManagementAPI() {
        this.log('\n👥 Testing User Management API', 'info');

        if (!this.adminToken) {
            this.recordTest('User Management Tests', false, 'No admin token available');
            return;
        }

        const authHeaders = { 'Authorization': `Bearer ${this.adminToken}` };

        // Test 1: List Users
        const usersResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/users`,
            headers: authHeaders
        });

        this.recordTest(
            'User Management - List Users',
            usersResult.success,
            `Users retrieved: ${usersResult.success}, Count: ${usersResult.data?.data?.length || 0}`
        );

        // Test 2: Get User Details (if we have users)
        if (usersResult.success && usersResult.data?.data?.length > 0) {
            const userId = usersResult.data.data[0].id;
            const userDetailResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/admin/users/${userId}`,
                headers: authHeaders
            });

            this.recordTest(
                'User Management - Get User Details',
                userDetailResult.success,
                `User details: ${userDetailResult.success}, ID: ${userId}`
            );
        }

        // Test 3: Unauthorized Access (Customer Token)
        if (this.customerToken) {
            const unauthorizedResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/admin/users`,
                headers: { 'Authorization': `Bearer ${this.customerToken}` }
            });

            this.recordTest(
                'User Management - Unauthorized Access',
                !unauthorizedResult.success && unauthorizedResult.status === 403,
                `Status: ${unauthorizedResult.status}, Expected 403`
            );
        }
    }

    async testSessionManagementAPI() {
        this.log('\n📱 Testing Session Management API', 'info');

        if (!this.adminToken) {
            this.recordTest('Session Management Tests', false, 'No admin token available');
            return;
        }

        const authHeaders = { 'Authorization': `Bearer ${this.adminToken}` };

        // Test 1: List All Sessions
        const sessionsResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/sessions`,
            headers: authHeaders
        });

        this.recordTest(
            'Session Management - List Sessions',
            sessionsResult.success,
            `Sessions retrieved: ${sessionsResult.success}, Count: ${sessionsResult.data?.length || 0}`
        );
    }

    // PHASE 3: SECURITY & INTEGRATION TESTING
    async testRoleBasedAccessControl() {
        this.log('\n🛡️ Testing Role-Based Access Control', 'info');

        // Test 1: Admin Endpoints with Admin Token
        if (this.adminToken) {
            const adminAccessResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/admin/dashboard/stats`,
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });

            this.recordTest(
                'RBAC - Admin Access to Admin Endpoints',
                adminAccessResult.success,
                `Admin access granted: ${adminAccessResult.success}`
            );
        }

        // Test 2: Customer Endpoints with Customer Token
        if (this.customerToken) {
            const customerAccessResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/admin/dashboard/stats`,
                headers: { 'Authorization': `Bearer ${this.customerToken}` }
            });

            this.recordTest(
                'RBAC - Customer Access to Admin Endpoints',
                !customerAccessResult.success && customerAccessResult.status === 403,
                `Customer access denied: ${!customerAccessResult.success}, Status: ${customerAccessResult.status}`
            );
        }

        // Test 3: Unauthenticated Access
        const unauthResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.BACKEND_URL}/admin/dashboard/stats`
        });

        this.recordTest(
            'RBAC - Unauthenticated Access',
            !unauthResult.success && unauthResult.status === 401,
            `Unauthenticated access denied: ${!unauthResult.success}, Status: ${unauthResult.status}`
        );
    }

    async testAPISecurity() {
        this.log('\n🔒 Testing API Security', 'info');

        // Test 1: SQL Injection Prevention
        const sqlInjectionResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: {
                email: "admin@test.com' OR '1'='1",
                password: "password"
            }
        });

        this.recordTest(
            'API Security - SQL Injection Prevention',
            !sqlInjectionResult.success,
            `SQL injection blocked: ${!sqlInjectionResult.success}`
        );

        // Test 2: XSS Prevention in Registration
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
            'API Security - XSS Prevention',
            !xssResult.success || (xssResult.success && !xssResult.data?.message?.includes('<script>')),
            `XSS prevented: ${!xssResult.success || !xssResult.data?.message?.includes('<script>')}`
        );
    }

    // PHASE 4: PERFORMANCE TESTING
    async testPerformance() {
        this.log('\n⚡ Testing Performance', 'info');

        // Test 1: Authentication Response Time
        const startTime = Date.now();
        const authResult = await this.makeRequest({
            method: 'POST',
            url: `${CONFIG.BACKEND_URL}/auth/login`,
            data: CONFIG.ADMIN_CREDENTIALS
        });
        const authTime = Date.now() - startTime;

        this.recordTest(
            'Performance - Authentication Speed',
            authResult.success && authTime < 3000,
            `Auth time: ${authTime}ms (target: <3000ms)`
        );

        // Test 2: API Response Time
        if (this.adminToken) {
            const apiStartTime = Date.now();
            const apiResult = await this.makeRequest({
                method: 'GET',
                url: `${CONFIG.BACKEND_URL}/admin/dashboard/stats`,
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });
            const apiTime = Date.now() - apiStartTime;

            this.recordTest(
                'Performance - API Response Speed',
                apiResult.success && apiTime < 2000,
                `API time: ${apiTime}ms (target: <2000ms) - ${apiResult.success ? 'FAST' : 'FAILED'}`
            );
        }
    }

    // Test Frontend Integration
    async testFrontendIntegration() {
        this.log('\n🌐 Testing Frontend Integration', 'info');

        // Test 1: Frontend Accessibility
        const frontendResult = await this.makeRequest({
            method: 'GET',
            url: CONFIG.FRONTEND_URL
        });

        this.recordTest(
            'Frontend - Accessibility',
            frontendResult.success,
            `Frontend accessible: ${frontendResult.success}, Status: ${frontendResult.status}`
        );

        // Test 2: Login Page
        const loginPageResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.FRONTEND_URL}/login`
        });

        this.recordTest(
            'Frontend - Login Page',
            loginPageResult.success,
            `Login page accessible: ${loginPageResult.success}`
        );

        // Test 3: Dashboard Page (should redirect without auth)
        const dashboardResult = await this.makeRequest({
            method: 'GET',
            url: `${CONFIG.FRONTEND_URL}/dashboard`
        });

        this.recordTest(
            'Frontend - Protected Route Handling',
            dashboardResult.success || dashboardResult.status === 302,
            `Dashboard handling: Status ${dashboardResult.status}`
        );
    }

    // Main Test Runner
    async runAllTests() {
        this.log('🚀 Starting Comprehensive Portal v2.0 Testing Suite', 'info');
        this.log(`Testing Backend: ${CONFIG.BACKEND_URL}`, 'info');
        this.log(`Testing Frontend: ${CONFIG.FRONTEND_URL}`, 'info');

        try {
            // Phase 1: Authentication System Testing
            await this.testUserRegistration();
            await this.testUserLogin();
            await this.testJWTTokenManagement();

            // Phase 2: Admin Dashboard API Testing
            await this.testAdminDashboardEndpoints();
            await this.testUserManagementAPI();
            await this.testSessionManagementAPI();

            // Phase 3: Security & Integration Testing
            await this.testRoleBasedAccessControl();
            await this.testAPISecurity();

            // Phase 4: Performance Testing
            await this.testPerformance();

            // Frontend Integration
            await this.testFrontendIntegration();

            // Generate Report
            this.generateReport();

        } catch (error) {
            this.log(`Critical error during testing: ${error.message}`, 'error');
        }
    }

    generateReport() {
        this.log('\n📊 TEST EXECUTION REPORT', 'info');
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

        console.log('\n🎯 SUCCESS CRITERIA STATUS:');
        const criteria = [
            { name: 'Authentication flows work correctly', status: this.checkAuthenticationCriteria() },
            { name: 'Admin APIs accessible only to admin users', status: this.checkAdminAccessCriteria() },
            { name: 'Security measures prevent unauthorized access', status: this.checkSecurityCriteria() },
            { name: 'Performance meets requirements', status: this.checkPerformanceCriteria() },
            { name: 'Frontend-backend integration seamless', status: this.checkIntegrationCriteria() }
        ];

        criteria.forEach(criterion => {
            const status = criterion.status ? '✅' : '❌';
            console.log(`${status} ${criterion.name}`);
        });

        const overallSuccess = criteria.every(c => c.status);
        console.log(`\n🏆 OVERALL STATUS: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (!overallSuccess) {
            console.log('\n⚠️  CRITICAL ISSUES FOUND - Review failed tests before deployment');
        }
    }

    // Criteria checking methods
    checkAuthenticationCriteria() {
        const authTests = this.testResults.details.filter(t => 
            t.testName.includes('Login') || t.testName.includes('Registration') || t.testName.includes('JWT')
        );
        return authTests.length > 0 && authTests.every(t => t.passed);
    }

    checkAdminAccessCriteria() {
        const adminTests = this.testResults.details.filter(t => 
            t.testName.includes('Admin') || t.testName.includes('RBAC')
        );
        return adminTests.length > 0 && adminTests.every(t => t.passed);
    }

    checkSecurityCriteria() {
        const securityTests = this.testResults.details.filter(t => 
            t.testName.includes('Security') || t.testName.includes('Unauthorized')
        );
        return securityTests.length > 0 && securityTests.every(t => t.passed);
    }

    checkPerformanceCriteria() {
        const performanceTests = this.testResults.details.filter(t => 
            t.testName.includes('Performance')
        );
        return performanceTests.length > 0 && performanceTests.every(t => t.passed);
    }

    checkIntegrationCriteria() {
        const integrationTests = this.testResults.details.filter(t => 
            t.testName.includes('Frontend')
        );
        return integrationTests.length > 0 && integrationTests.every(t => t.passed);
    }
}

// Run the tests
if (require.main === module) {
    const testSuite = new AuthTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = AuthTestSuite;