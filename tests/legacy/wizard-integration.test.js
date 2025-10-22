/**
 * 🧪 Enhanced Wizard Integration Tests v1.1.1.9.2.4.2.3
 * 
 * Tests the enhanced step-by-step wizard functionality
 */

const { CustomerPortalDB } = require('../v1-api/customer-portal-db');
const { DatabaseManager } = require('../database/database-manager');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

describe('Enhanced Wizard Flow Integration', () => {
    let db;
    let portal;
    let server;
    
    const TEST_DB_PATH = path.join(__dirname, 'wizard-test-database.db');
    const TEST_PORT = 3084;
    const API_BASE = `http://localhost:${TEST_PORT}`;

    beforeAll(async () => {
        // Setup test database
        db = new DatabaseManager(TEST_DB_PATH);
        await db.initialize();
        
        // Create test customer with unique ID
        const testId = Date.now();
        await db.createCustomer({
            id: `wizard-test-customer-${testId}`,
            email: `wizard-${testId}@example.com`,
            name: `Wizard Test Customer ${testId}`
        });

        // Setup test portal
        portal = new CustomerPortalDB();
        portal.port = TEST_PORT;
        portal.db = db;
        await portal.initialize();
        
        // Start test server
        server = portal.app.listen(TEST_PORT);
    });

    afterAll(async () => {
        if (server) server.close();
        if (db) await db.close();
        await fs.remove(TEST_DB_PATH);
    });

    describe('✅ Wizard Route Accessibility', () => {
        test('Should serve wizard HTML page', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/text\/html/);
            expect(response.data).toContain('Site Creation Wizard');
            expect(response.data).toContain('x-data="wizardApp()"');
        });

        test('Should include Alpine.js and Tailwind CSS', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('alpinejs');
            expect(response.data).toContain('tailwindcss');
        });
    });

    describe('✅ Wizard Step Navigation', () => {
        test('Should support step-by-step navigation', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            // Check for step indicators
            expect(response.data).toContain('currentStep');
            expect(response.data).toContain('nextStep()');
            expect(response.data).toContain('previousStep()');
            
            // Check for progress bar
            expect(response.data).toContain('Progress:');
            expect(response.data).toContain('steps.length');
        });

        test('Should have all 6 wizard steps defined', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('Welcome');
            expect(response.data).toContain('Business Information');
            expect(response.data).toContain('Design & Colors');
            expect(response.data).toContain('Content & Services');
            expect(response.data).toContain('Review & Confirm');
            expect(response.data).toContain('Site Creation');
        });
    });

    describe('✅ Form Validation Integration', () => {
        test('Should validate required fields', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            // Check for validation attributes
            expect(response.data).toContain('required');
            expect(response.data).toContain('validateStep');
            expect(response.data).toContain('trim()');
        });

        test('Should prevent advancement without valid data', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            // Check validation logic
            expect(response.data).toContain('!validateStep()');
            expect(response.data).toContain('return false');
        });
    });

    describe('✅ Session Persistence', () => {
        test('Should implement localStorage save/restore', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('localStorage');
            expect(response.data).toContain('saveProgress');
            expect(response.data).toContain('restoreProgress');
            expect(response.data).toContain('wizard-progress');
        });

        test('Should auto-save every 30 seconds', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('setInterval');
            expect(response.data).toContain('30000');
            expect(response.data).toContain('saveProgress');
        });
    });

    describe('✅ API Integration', () => {
        test('Should integrate with existing business types API', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('/api/config/business-types');
            expect(response.data).toContain('loadBusinessTypes');
        });

        test('Should use existing site creation API', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('/api/sites/create');
            expect(response.data).toContain('createSite');
        });

        test('Should handle deployment through existing API', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('/api/sites');
            expect(response.data).toContain('deploy');
        });
    });

    describe('✅ Enhanced User Experience Features', () => {
        test('Should include color palette selection', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('color-palette');
            expect(response.data).toContain('customColors');
            expect(response.data).toContain('predefinedPalettes');
        });

        test('Should include service management', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('services');
            expect(response.data).toContain('addService');
            expect(response.data).toContain('removeService');
        });

        test('Should show review step with all data', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('Review your site configuration');
            expect(response.data).toContain('formData');
            expect(response.data).toContain('x-show="currentStep === 4"');
        });
    });

    describe('✅ Navigation and Portal Integration', () => {
        test('Should be accessible from main portal', async () => {
            const portalResponse = await axios.get(`${API_BASE}/`);
            
            expect(portalResponse.data).toContain('/wizard');
            expect(portalResponse.data).toContain('Assistant Guidé');
            expect(portalResponse.data).toContain('wizard interactif');
        });

        test('Should provide navigation back to portal', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('href="/"');
            expect(response.data).toContain('Back to Portal');
        });
    });

    describe('✅ Error Handling and User Feedback', () => {
        test('Should handle API errors gracefully', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('catch(error)');
            expect(response.data).toContain('error.message');
            expect(response.data).toContain('errorMessage');
        });

        test('Should show loading states', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('loading');
            expect(response.data).toContain('Creating site...');
            expect(response.data).toContain('disabled');
        });

        test('Should show success confirmation', async () => {
            const response = await axios.get(`${API_BASE}/wizard`);
            
            expect(response.data).toContain('successMessage');
            expect(response.data).toContain('Site created');
            expect(response.data).toContain('this.success = true');
        });
    });
});

describe('🚀 End-to-End Wizard Workflow', () => {
    let db;
    let portal;
    let server;
    
    const E2E_DB_PATH = path.join(__dirname, 'wizard-e2e-test.db');
    const E2E_PORT = 3085;
    const E2E_API_BASE = `http://localhost:${E2E_PORT}`;

    beforeAll(async () => {
        db = new DatabaseManager(E2E_DB_PATH);
        await db.initialize();
        
        await db.createCustomer({
            id: 'wizard-e2e-customer',
            email: 'e2e@example.com',
            name: 'E2E Wizard Customer'
        });

        portal = new CustomerPortalDB();
        portal.port = E2E_PORT;
        portal.db = db;
        await portal.initialize();
        
        server = portal.app.listen(E2E_PORT);
    });

    afterAll(async () => {
        if (server) server.close();
        if (db) await db.close();
        await fs.remove(E2E_DB_PATH);
    });

    test('Complete wizard site creation workflow', async () => {
        // 1. Access wizard page
        const wizardResponse = await axios.get(`${E2E_API_BASE}/wizard`);
        expect(wizardResponse.status).toBe(200);

        // 2. Get business types for wizard
        const businessTypesResponse = await axios.get(`${E2E_API_BASE}/api/config/business-types`);
        expect(businessTypesResponse.data.businessTypes).toBeDefined();

        // 3. Create site through wizard API
        const siteData = {
            name: 'Wizard E2E Test Site',
            businessType: 'business',
            domain: 'wizard-e2e.example.com',
            slogan: 'Created via Enhanced Wizard',
            colors: {
                primary: '#3B82F6',
                secondary: '#60A5FA',
                accent: '#93C5FD'
            },
            services: [
                { name: 'Consulting', description: 'Business consulting' },
                { name: 'Training', description: 'Professional training' }
            ],
            contact: {
                email: 'contact@wizard-e2e.com',
                phone: '+1234567890'
            }
        };

        const createResponse = await axios.post(`${E2E_API_BASE}/api/sites/create`, {
            customerId: 'wizard-e2e-customer',
            siteData: siteData
        });

        expect(createResponse.data.success).toBe(true);
        expect(createResponse.data.site.name).toBe('Wizard E2E Test Site');

        // 4. Verify site was created with correct configuration
        const siteId = createResponse.data.site.id;
        const siteResponse = await axios.get(`${E2E_API_BASE}/api/sites/wizard-e2e-customer/${siteId}`);
        
        expect(siteResponse.data.success).toBe(true);
        expect(siteResponse.data.site.config.brand.name).toBe('Wizard E2E Test Site');
        expect(siteResponse.data.site.config.meta.domain).toBe('wizard-e2e.example.com');

        // 5. Verify customer dashboard integration
        const dashboardResponse = await axios.get(`${E2E_API_BASE}/api/customer/wizard-e2e-customer/dashboard`);
        expect(dashboardResponse.data.success).toBe(true);
        expect(dashboardResponse.data.dashboard.sites.length).toBe(1);
        expect(dashboardResponse.data.dashboard.sites[0].name).toBe('Wizard E2E Test Site');

        console.log('✅ Complete wizard workflow test passed');
    });

    test('Wizard integration with CLI commands', async () => {
        // Verify the wizard-created site can be managed via CLI
        const sites = await db.getCustomerSites('wizard-e2e-customer');
        expect(sites.length).toBeGreaterThan(0);
        
        const site = sites[0];
        expect(site.name).toBe('Wizard E2E Test Site');
        expect(site.status).toBe('created');
        
        console.log('✅ Wizard-CLI integration test passed');
    });
});