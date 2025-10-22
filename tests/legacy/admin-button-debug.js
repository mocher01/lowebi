/**
 * 🐛 Admin Dashboard Button Functionality Debug Script
 * This script will test all admin dashboard button functionality end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://162.55.213.90:3080';

class AdminButtonDebugger {
    constructor() {
        this.token = null;
        this.user = null;
        this.testResults = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🔧';
        const logMessage = `[${timestamp}] ${emoji} ${message}`;
        console.log(logMessage);
        this.testResults.push({ timestamp, type, message });
    }

    async authenticate() {
        this.log('Testing admin authentication...');
        try {
            const response = await axios.post(`${BASE_URL}/admin/auth/login`, {
                email: 'admin@locod.ai',
                password: 'admin123'
            });

            if (response.data.success) {
                this.token = response.data.token;
                this.user = response.data.user;
                this.log(`Authentication successful - User: ${this.user.email}`, 'success');
                return true;
            } else {
                this.log(`Authentication failed: ${response.data.message}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`Authentication error: ${error.message}`, 'error');
            return false;
        }
    }

    async testApiEndpoints() {
        this.log('Testing API endpoints...');
        
        const endpoints = [
            { method: 'GET', path: '/admin/queue', name: 'Queue List' },
            { method: 'GET', path: '/admin/queue/23', name: 'View Request #23' },
            { method: 'PUT', path: '/admin/queue/23/assign', name: 'Assign Request #23' },
            { method: 'PUT', path: '/admin/queue/23/start', name: 'Start Request #23' },
            { method: 'GET', path: '/admin/dashboard/stats', name: 'Dashboard Stats' }
        ];

        for (const endpoint of endpoints) {
            try {
                const config = {
                    method: endpoint.method,
                    url: `${BASE_URL}${endpoint.path}`,
                    headers: { 'Authorization': `Bearer ${this.token}` }
                };

                if (endpoint.method === 'PUT') {
                    config.headers['Content-Type'] = 'application/json';
                }

                const response = await axios(config);
                
                if (response.status === 200) {
                    this.log(`${endpoint.name}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`, 'success');
                } else {
                    this.log(`${endpoint.name}: ${response.status}`, 'warning');
                }
            } catch (error) {
                this.log(`${endpoint.name}: Error - ${error.response?.status || error.message}`, 'error');
            }
        }
    }

    async testQueueData() {
        this.log('Testing queue data structure...');
        try {
            const response = await axios.get(`${BASE_URL}/admin/queue`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const requests = response.data.requests || [];
            this.log(`Queue contains ${requests.length} requests`, 'info');

            if (requests.length > 0) {
                const firstRequest = requests[0];
                this.log(`First request analysis:`, 'info');
                this.log(`  - ID: ${firstRequest.id}`, 'info');
                this.log(`  - Status: ${firstRequest.status}`, 'info');
                this.log(`  - Admin ID: ${firstRequest.admin_id || 'null'}`, 'info');
                this.log(`  - Site Name (DB): ${firstRequest.site_name || 'null'}`, 'info');
                this.log(`  - Site Name (Data): ${firstRequest.request_data?.siteName || 'null'}`, 'info');
                this.log(`  - User ID: ${this.user?.id}`, 'info');
                
                // Test button visibility logic
                const showAssign = firstRequest.status === 'pending';
                const showStart = firstRequest.status === 'assigned' && firstRequest.admin_id === this.user?.id;
                const showContinue = firstRequest.status === 'processing' && firstRequest.admin_id === this.user?.id;
                
                this.log(`Button visibility for request ${firstRequest.id}:`, 'info');
                this.log(`  - Show Assign: ${showAssign}`, showAssign ? 'success' : 'info');
                this.log(`  - Show Start: ${showStart}`, showStart ? 'success' : 'info');
                this.log(`  - Show Continue: ${showContinue}`, showContinue ? 'success' : 'info');
                this.log(`  - Show View: true (always visible)`, 'success');
            }
        } catch (error) {
            this.log(`Queue data error: ${error.message}`, 'error');
        }
    }

    async testButtonActions() {
        this.log('Testing button actions...');
        
        // First get a request to work with
        try {
            const queueResponse = await axios.get(`${BASE_URL}/admin/queue`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const requests = queueResponse.data.requests || [];
            if (requests.length === 0) {
                this.log('No requests found to test with', 'warning');
                return;
            }

            const testRequest = requests[0];
            this.log(`Testing actions on request ${testRequest.id} (status: ${testRequest.status})`);

            // Test View Action (always should work)
            try {
                const viewResponse = await axios.get(`${BASE_URL}/admin/queue/${testRequest.id}`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                
                if (viewResponse.status === 200) {
                    this.log(`View action: SUCCESS - Got request data`, 'success');
                } else {
                    this.log(`View action: FAILED - Status ${viewResponse.status}`, 'error');
                }
            } catch (error) {
                this.log(`View action: ERROR - ${error.response?.status || error.message}`, 'error');
            }

            // Test Assign Action (if pending)
            if (testRequest.status === 'pending') {
                try {
                    const assignResponse = await axios.put(`${BASE_URL}/admin/queue/${testRequest.id}/assign`, {}, {
                        headers: { 
                            'Authorization': `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (assignResponse.status === 200) {
                        this.log(`Assign action: SUCCESS - ${assignResponse.data.message}`, 'success');
                    } else {
                        this.log(`Assign action: FAILED - Status ${assignResponse.status}`, 'error');
                    }
                } catch (error) {
                    this.log(`Assign action: ERROR - ${error.response?.status || error.message}`, 'error');
                }
            } else {
                this.log(`Assign action: SKIPPED - Request not pending (status: ${testRequest.status})`, 'info');
            }

            // Test Start Action (if assigned to us)
            if (testRequest.status === 'assigned' && testRequest.admin_id === this.user?.id) {
                try {
                    const startResponse = await axios.put(`${BASE_URL}/admin/queue/${testRequest.id}/start`, {}, {
                        headers: { 
                            'Authorization': `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (startResponse.status === 200) {
                        this.log(`Start action: SUCCESS - ${startResponse.data.message}`, 'success');
                    } else {
                        this.log(`Start action: FAILED - Status ${startResponse.status}`, 'error');
                    }
                } catch (error) {
                    this.log(`Start action: ERROR - ${error.response?.status || error.message}`, 'error');
                }
            } else {
                this.log(`Start action: SKIPPED - Request not assigned to us or wrong status`, 'info');
            }

        } catch (error) {
            this.log(`Button actions test error: ${error.message}`, 'error');
        }
    }

    async testTokenExpiration() {
        this.log('Testing token expiration...');
        try {
            if (this.token) {
                const payload = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString());
                const expirationTime = new Date(payload.exp * 1000);
                const currentTime = new Date();
                const timeRemaining = expirationTime - currentTime;
                
                this.log(`Token expires at: ${expirationTime.toISOString()}`, 'info');
                this.log(`Current time: ${currentTime.toISOString()}`, 'info');
                this.log(`Time remaining: ${Math.round(timeRemaining / 1000 / 60)} minutes`, 'info');
                
                if (timeRemaining < 0) {
                    this.log('Token is EXPIRED! This could be why buttons don\'t work.', 'error');
                } else if (timeRemaining < 5 * 60 * 1000) { // Less than 5 minutes
                    this.log('Token expires soon - this could cause issues', 'warning');
                } else {
                    this.log('Token is valid and not expired', 'success');
                }
            }
        } catch (error) {
            this.log(`Token expiration check error: ${error.message}`, 'error');
        }
    }

    async checkDashboardHtml() {
        this.log('Analyzing dashboard HTML for JavaScript issues...');
        try {
            const response = await axios.get(`${BASE_URL}/admin-dashboard`);
            const html = response.data;
            
            // Check for our fixes
            const hasSiteNameFix = html.includes('request.request_data ? request.request_data.siteName : null');
            const hasContinueButton = html.includes('Continuer');
            const hasProcessingLogic = html.includes('processing\' && request.admin_id === user.id');
            
            this.log(`Dashboard HTML analysis:`, 'info');
            this.log(`  - Site name fix present: ${hasSiteNameFix}`, hasSiteNameFix ? 'success' : 'error');
            this.log(`  - Continue button present: ${hasContinueButton}`, hasContinueButton ? 'success' : 'error');
            this.log(`  - Processing logic present: ${hasProcessingLogic}`, hasProcessingLogic ? 'success' : 'error');
            
            // Check for potential JavaScript issues
            const hasAlpineJs = html.includes('alpinejs');
            const hasAdminApp = html.includes('adminApp()');
            const hasEventHandlers = html.includes('@click');
            
            this.log(`JavaScript structure:`, 'info');
            this.log(`  - Alpine.js loaded: ${hasAlpineJs}`, hasAlpineJs ? 'success' : 'error');
            this.log(`  - adminApp function: ${hasAdminApp}`, hasAdminApp ? 'success' : 'error');
            this.log(`  - Event handlers: ${hasEventHandlers}`, hasEventHandlers ? 'success' : 'error');
            
        } catch (error) {
            this.log(`Dashboard HTML check error: ${error.message}`, 'error');
        }
    }

    async runAllTests() {
        console.log('🐛 Starting Admin Button Debug Tests...\n');
        
        // Test 1: Authentication
        const authenticated = await this.authenticate();
        if (!authenticated) {
            console.log('\n❌ Cannot continue - authentication failed');
            return;
        }

        // Test 2: Token validation
        await this.testTokenExpiration();
        
        // Test 3: API endpoints
        await this.testApiEndpoints();
        
        // Test 4: Queue data structure
        await this.testQueueData();
        
        // Test 5: Button actions
        await this.testButtonActions();
        
        // Test 6: Dashboard HTML analysis
        await this.checkDashboardHtml();
        
        // Summary
        console.log('\n📊 DEBUG TEST SUMMARY');
        console.log('========================');
        
        const successCount = this.testResults.filter(r => r.type === 'success').length;
        const errorCount = this.testResults.filter(r => r.type === 'error').length;
        const warningCount = this.testResults.filter(r => r.type === 'warning').length;
        
        console.log(`✅ Successes: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`⚠️ Warnings: ${warningCount}`);
        
        if (errorCount > 0) {
            console.log('\n🔧 ISSUES FOUND:');
            this.testResults
                .filter(r => r.type === 'error')
                .forEach(r => console.log(`   - ${r.message}`));
        }
        
        console.log('\n🎯 CONCLUSION:');
        if (errorCount === 0) {
            console.log('   All tests passed! Button issues might be frontend JavaScript related.');
        } else {
            console.log('   Found API/backend issues that could cause button problems.');
        }
    }
}

// Run the debug tests
const buttonDebugger = new AdminButtonDebugger();
buttonDebugger.runAllTests().catch(error => {
    console.error('Debug test failed:', error.message);
});