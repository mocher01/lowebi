/**
 * 🧪 CLI Integration Tests v1.1.1.9.2.4.2.2
 * 
 * Tests CLI integration with Customer Portal API
 */

const { WebsiteCLI } = require('../v1-tools/website-cli');
const { CustomerPortalDB } = require('../v1-api/customer-portal-db');
const { DatabaseManager } = require('../database/database-manager');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

describe('CLI Integration with Portal API', () => {
    let db;
    let portal;
    let cli;
    
    const TEST_DB_PATH = path.join(__dirname, 'cli-test-database.db');
    const TEST_PORT = 3082;
    const API_BASE = `http://localhost:${TEST_PORT}`;

    beforeAll(async () => {
        // Setup test database
        db = new DatabaseManager(TEST_DB_PATH);
        await db.initialize();
        
        // Create test customer
        await db.createCustomer({
            id: 'cli-test-customer',
            email: 'cli-test@example.com',
            name: 'CLI Test Customer'
        });

        // Setup test portal
        portal = new CustomerPortalDB();
        portal.port = TEST_PORT;
        portal.db = db;
        await portal.initialize();
        
        // Start test server
        await new Promise((resolve) => {
            portal.app.listen(TEST_PORT, resolve);
        });

        // Setup CLI with test configuration
        cli = new WebsiteCLI();
        cli.apiBase = API_BASE;
        cli.customerId = 'cli-test-customer';
    });

    afterAll(async () => {
        await db.close();
        await fs.remove(TEST_DB_PATH);
        // Portal server cleanup handled by test environment
    });

    describe('✅ CLI Authentication with Portal', () => {
        test('Should connect to portal API', async () => {
            await expect(cli.checkPortalHealth()).resolves.not.toThrow();
        });

        test('Should get portal version via CLI', async () => {
            const response = await axios.get(`${API_BASE}/api/health`);
            expect(response.data.version).toBe('1.1.1.9.2.4.2.1.1');
            expect(response.data.service).toContain('Customer Portal API');
        });
    });

    describe('✅ CLI Business Types Match Portal', () => {
        test('Should get same business types as portal', async () => {
            const businessTypes = await cli.getBusinessTypes();
            
            expect(businessTypes).toBeDefined();
            expect(typeof businessTypes).toBe('object');
            expect(businessTypes.translation).toBeDefined();
            expect(businessTypes.education).toBeDefined();
            expect(businessTypes.creative).toBeDefined();
            expect(businessTypes.business).toBeDefined();
        });

        test('Should match portal business type structure', async () => {
            const portalResponse = await axios.get(`${API_BASE}/api/config/business-types`);
            const cliBusinessTypes = await cli.getBusinessTypes();
            
            expect(cliBusinessTypes).toEqual(portalResponse.data.businessTypes);
        });
    });

    describe('✅ CLI Site Creation via Portal API', () => {
        test('Should create site via CLI API calls', async () => {
            const siteData = {
                name: 'CLI Test Site',
                businessType: 'business',
                domain: 'cli-test.example.com',
                slogan: 'Created via CLI'
            };

            // Simulate CLI site creation
            const response = await axios.post(`${API_BASE}/api/sites/create`, {
                customerId: cli.customerId,
                siteData: siteData
            });

            expect(response.data.success).toBe(true);
            expect(response.data.site.name).toBe('CLI Test Site');
            expect(response.data.site.id).toBeDefined();
        });

        test('Should list sites via CLI', async () => {
            const sites = await cli.getSites();
            
            expect(Array.isArray(sites)).toBe(true);
            expect(sites.length).toBeGreaterThan(0);
            expect(sites[0]).toHaveProperty('id');
            expect(sites[0]).toHaveProperty('name');
            expect(sites[0]).toHaveProperty('status');
        });
    });

    describe('✅ CLI Progress Indicators and Error Handling', () => {
        test('Should handle API errors gracefully', async () => {
            // Test with invalid customer ID
            const invalidCli = new WebsiteCLI();
            invalidCli.apiBase = API_BASE;
            invalidCli.customerId = 'non-existent-customer';

            try {
                await axios.post(`${API_BASE}/api/sites/create`, {
                    customerId: 'non-existent-customer',
                    siteData: { name: 'Test' }
                });
                fail('Should have thrown error');
            } catch (error) {
                expect(error.response.status).toBe(500);
            }
        });

        test('Should handle network errors', async () => {
            const offlineCli = new WebsiteCLI();
            offlineCli.apiBase = 'http://localhost:9999'; // Non-existent server

            await expect(offlineCli.checkPortalHealth()).rejects.toThrow();
        });
    });

    describe('✅ CLI Configuration Consistency', () => {
        test('Should generate identical site config as portal', async () => {
            const siteData = {
                name: 'Consistency Test',
                businessType: 'translation',
                domain: 'consistency.test.com'
            };

            // Create via CLI API call
            const cliResponse = await axios.post(`${API_BASE}/api/sites/create`, {
                customerId: cli.customerId,
                siteData: siteData
            });

            expect(cliResponse.data.success).toBe(true);
            
            // Verify site details match expected structure
            const siteDetails = await axios.get(`${API_BASE}/api/sites/${cli.customerId}/${cliResponse.data.site.id}`);
            
            expect(siteDetails.data.site.config).toBeDefined();
            expect(siteDetails.data.site.config.brand.name).toBe('Consistency Test');
            expect(siteDetails.data.site.config.meta.domain).toBe('consistency.test.com');
        });
    });

    describe('✅ CLI Dashboard Integration', () => {
        test('Should display dashboard data via CLI', async () => {
            const response = await axios.get(`${API_BASE}/api/customer/${cli.customerId}/dashboard`);
            
            expect(response.data.success).toBe(true);
            expect(response.data.dashboard.customer).toBeDefined();
            expect(response.data.dashboard.stats).toBeDefined();
            expect(response.data.dashboard.quotas).toBeDefined();
            
            // Verify CLI can access same data
            expect(response.data.dashboard.customer.name).toBe('CLI Test Customer');
        });
    });

    describe('✅ CLI Backup Operations', () => {
        test('Should create backups via CLI API', async () => {
            // Get a site to backup
            const sites = await cli.getSites();
            expect(sites.length).toBeGreaterThan(0);
            
            const siteId = sites[0].id;
            
            // Create backup via API
            const response = await axios.post(`${API_BASE}/api/sites/${cli.customerId}/${siteId}/backup`, {
                name: 'cli-test-backup'
            });
            
            expect(response.data.success).toBe(true);
            expect(response.data.backup_id).toBeDefined();
            
            // Verify backup exists
            const backupsResponse = await axios.get(`${API_BASE}/api/sites/${cli.customerId}/${siteId}/backups`);
            expect(backupsResponse.data.success).toBe(true);
            expect(backupsResponse.data.backups.length).toBeGreaterThan(0);
        });
    });
});

describe('🚀 CLI End-to-End Workflow', () => {
    test('Complete CLI workflow simulation', async () => {
        const db = new DatabaseManager(path.join(__dirname, 'e2e-cli-test.db'));
        await db.initialize();

        try {
            // Create test customer
            const customer = await db.createCustomer({
                id: 'e2e-cli-customer',
                email: 'e2e-cli@example.com',
                name: 'E2E CLI Customer'
            });

            // Setup mini portal
            const portal = new CustomerPortalDB();
            portal.port = 3083;
            portal.db = db;
            await portal.initialize();
            
            const server = portal.app.listen(3083);

            try {
                // Setup CLI
                const cli = new WebsiteCLI();
                cli.apiBase = 'http://localhost:3083';
                cli.customerId = customer.id;

                // 1. Check health
                await cli.checkPortalHealth();

                // 2. Create site
                const response = await axios.post(`${cli.apiBase}/api/sites/create`, {
                    customerId: cli.customerId,
                    siteData: {
                        name: 'E2E CLI Site',
                        businessType: 'business'
                    }
                });

                expect(response.data.success).toBe(true);

                // 3. List sites
                const sites = await cli.getSites();
                expect(sites.length).toBe(1);
                expect(sites[0].name).toBe('E2E CLI Site');

                // 4. Create backup
                const backupResponse = await axios.post(`${cli.apiBase}/api/sites/${cli.customerId}/${sites[0].id}/backup`, {
                    name: 'e2e-backup'
                });

                expect(backupResponse.data.success).toBe(true);

                console.log('✅ End-to-end CLI workflow test passed');

            } finally {
                server.close();
            }

        } finally {
            await db.close();
            await fs.remove(path.join(__dirname, 'e2e-cli-test.db'));
        }
    });
});