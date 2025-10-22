#!/usr/bin/env node

/**
 * 🛠️ Database CLI v1.1.1.9.2.4.2.1.1
 * 
 * Command-line interface for database operations
 * Usage: node database/cli.js <command> [options]
 */

const { DatabaseManager } = require('./database-manager');
const path = require('path');
const fs = require('fs-extra');

class DatabaseCLI {
    constructor() {
        this.db = new DatabaseManager();
    }

    async run() {
        const command = process.argv[2];
        const args = process.argv.slice(3);

        try {
            switch (command) {
                case 'init':
                    await this.initDatabase();
                    break;
                case 'migrate':
                    await this.migrateFromFiles();
                    break;
                case 'backup':
                    await this.backupDatabase();
                    break;
                case 'status':
                    await this.showStatus();
                    break;
                case 'create-customer':
                    await this.createCustomer(args);
                    break;
                case 'list-customers':
                    await this.listCustomers();
                    break;
                case 'list-sites':
                    await this.listSites(args[0]);
                    break;
                case 'test':
                    await this.runTests();
                    break;
                default:
                    this.showHelp();
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        } finally {
            await this.db.close();
        }
    }

    async initDatabase() {
        console.log('🏗️ Initializing database...');
        await this.db.initialize();
        console.log('✅ Database initialized successfully');
    }

    async migrateFromFiles() {
        console.log('🔄 Starting migration from file-based configs...');
        await this.db.initialize();
        
        const configsDir = path.join(__dirname, '..', 'configs');
        
        if (!await fs.pathExists(configsDir)) {
            console.log('⚠️ No configs directory found, skipping migration');
            return;
        }

        const result = await this.db.migrateFromFileConfigs(configsDir);
        
        console.log('\n📊 Migration Summary:');
        console.log(`✅ Migrated: ${result.migratedCount} sites`);
        console.log(`❌ Errors: ${result.errors.length}`);
        
        if (result.errors.length > 0) {
            console.log('\n🐛 Errors encountered:');
            result.errors.forEach(({ siteId, error }) => {
                console.log(`  • ${siteId}: ${error}`);
            });
        }
    }

    async backupDatabase() {
        console.log('💾 Creating database backup...');
        await this.db.initialize();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, `backup-${timestamp}.db`);
        
        await fs.copy(this.db.dbPath, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);
    }

    async showStatus() {
        await this.db.initialize();
        
        const health = await this.db.healthCheck();
        console.log('📊 Database Status:');
        console.log(`Status: ${health.status}`);
        console.log(`Connected: ${health.connected}`);
        
        // Get counts
        const customers = await this.db.runQuery('SELECT COUNT(*) as count FROM customers');
        const sites = await this.db.runQuery('SELECT COUNT(*) as count FROM sites');
        const deployments = await this.db.runQuery('SELECT COUNT(*) as count FROM site_deployments');
        
        console.log(`\n📈 Statistics:`);
        console.log(`Customers: ${customers[0].count}`);
        console.log(`Sites: ${sites[0].count}`);
        console.log(`Deployments: ${deployments[0].count}`);
    }

    async createCustomer(args) {
        if (args.length < 2) {
            console.log('Usage: create-customer <email> <name> [company]');
            return;
        }

        await this.db.initialize();
        
        const customer = await this.db.createCustomer({
            email: args[0],
            name: args[1],
            company_name: args[2] || null
        });

        console.log('✅ Customer created:');
        console.log(`ID: ${customer.id}`);
        console.log(`Email: ${customer.email}`);
        console.log(`Name: ${customer.name}`);
    }

    async listCustomers() {
        await this.db.initialize();
        
        const customers = await this.db.runQuery('SELECT * FROM customers ORDER BY created_at DESC');
        
        console.log('👥 Customers:');
        console.log('─'.repeat(80));
        
        customers.forEach(customer => {
            console.log(`${customer.id} | ${customer.email} | ${customer.name} | ${customer.plan_type}`);
        });
    }

    async listSites(customerId) {
        if (!customerId) {
            console.log('Usage: list-sites <customer_id>');
            return;
        }

        await this.db.initialize();
        
        const sites = await this.db.getCustomerSites(customerId);
        
        console.log(`🌐 Sites for customer ${customerId}:`);
        console.log('─'.repeat(80));
        
        sites.forEach(site => {
            console.log(`${site.id} | ${site.name} | ${site.status} | ${site.url || 'N/A'}`);
        });
    }

    async runTests() {
        console.log('🧪 Running database tests...');
        await this.db.initialize();

        try {
            // Test customer creation
            console.log('Testing customer creation...');
            const customer = await this.db.createCustomer({
                email: 'test@example.com',
                name: 'Test Customer',
                company_name: 'Test Company'
            });
            console.log('✅ Customer creation test passed');

            // Test site creation
            console.log('Testing site creation...');
            const site = await this.db.createSite(customer.id, {
                name: 'Test Site',
                config: {
                    brand: { name: 'Test Site' },
                    meta: { domain: 'test.example.com' }
                }
            });
            console.log('✅ Site creation test passed');

            // Test backup creation
            console.log('Testing backup creation...');
            const backupId = await this.db.createSiteBackup(site.id, 'test-backup');
            console.log('✅ Backup creation test passed');

            // Cleanup
            console.log('Cleaning up test data...');
            await this.db.runQuery('DELETE FROM customers WHERE email = ?', ['test@example.com']);
            console.log('✅ All tests passed!');

        } catch (error) {
            console.error('❌ Test failed:', error.message);
            throw error;
        }
    }

    showHelp() {
        console.log(`
🗄️ Database CLI v1.1.1.9.2.4.2.1.1

Commands:
  init                     Initialize database and create schema
  migrate                  Migrate from file-based configs to database
  backup                   Create database backup
  status                   Show database status and statistics
  create-customer <email> <name> [company]  Create a new customer
  list-customers           List all customers
  list-sites <customer_id> List sites for a customer
  test                     Run database tests

Examples:
  node database/cli.js init
  node database/cli.js migrate
  node database/cli.js create-customer john@example.com "John Doe" "Acme Corp"
  node database/cli.js list-sites customer-123
        `);
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new DatabaseCLI();
    cli.run();
}

module.exports = { DatabaseCLI };