#!/usr/bin/env node

/**
 * 🗜️ Multi-Tenant Database Manager v1.1.1.9.2.4.2.1.1
 * 
 * Manages SQLite database for multi-tenant website generator
 * Handles migrations, backups, and multi-tenant data isolation
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

class DatabaseManager {
    constructor(dbPath = null) {
        this.dbPath = dbPath || path.join(__dirname, 'website-generator.db');
        this.db = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection and create tables if needed
     */
    async initialize() {
        try {
            // Ensure database directory exists
            await fs.ensureDir(path.dirname(this.dbPath));

            // Connect to database
            this.db = new sqlite3.Database(this.dbPath);
            this.isConnected = true;

            // Enable foreign keys
            await this.runQuery('PRAGMA foreign_keys = ON');

            // Check if database is initialized
            const tables = await this.runQuery(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='customers'
            `);

            if (tables.length === 0) {
                console.log('🏗️ Initializing database schema...');
                await this.createSchema();
                console.log('✅ Database schema created successfully');
            } else {
                console.log('✅ Database connection established');
            }

            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create database schema from SQL file
     */
    async createSchema() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schemaSql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await this.runQuery(statement);
            }
        }
    }

    /**
     * Run a SQL query with promise wrapper
     */
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ 
                        lastID: this.lastID, 
                        changes: this.changes 
                    });
                });
            }
        });
    }

    /**
     * Customer Management Methods
     */

    async createCustomer(customerData) {
        const customerId = customerData.id || this.generateId();
        
        const sql = `
            INSERT INTO customers (
                id, email, name, company_name, plan_type, 
                max_sites, max_storage_mb, max_bandwidth_gb, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            customerId,
            customerData.email,
            customerData.name,
            customerData.company_name || null,
            customerData.plan_type || 'starter',
            customerData.max_sites || 5,
            customerData.max_storage_mb || 1000,
            customerData.max_bandwidth_gb || 10,
            JSON.stringify(customerData.metadata || {})
        ];

        await this.runQuery(sql, params);
        return await this.getCustomer(customerId);
    }

    async getCustomer(customerId) {
        const sql = 'SELECT * FROM customers WHERE id = ?';
        const customers = await this.runQuery(sql, [customerId]);
        
        if (customers.length === 0) {
            throw new Error(`Customer ${customerId} not found`);
        }

        const customer = customers[0];
        customer.metadata = customer.metadata ? JSON.parse(customer.metadata) : {};
        return customer;
    }

    async updateCustomer(customerId, updates) {
        const allowedFields = [
            'name', 'company_name', 'plan_type', 'status',
            'max_sites', 'max_storage_mb', 'max_bandwidth_gb', 'metadata'
        ];

        const setClause = [];
        const params = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                setClause.push(`${key} = ?`);
                params.push(key === 'metadata' ? JSON.stringify(value) : value);
            }
        }

        if (setClause.length === 0) {
            throw new Error('No valid fields to update');
        }

        setClause.push('updated_at = CURRENT_TIMESTAMP');
        params.push(customerId);

        const sql = `
            UPDATE customers 
            SET ${setClause.join(', ')} 
            WHERE id = ?
        `;

        await this.runQuery(sql, params);
        return await this.getCustomer(customerId);
    }

    /**
     * Site Management Methods
     */

    async createSite(customerId, siteData) {
        // Verify customer exists and hasn't exceeded limits
        const customer = await this.getCustomer(customerId);
        const existingSites = await this.getCustomerSites(customerId);
        
        if (existingSites.length >= customer.max_sites) {
            throw new Error(`Customer has reached maximum sites limit (${customer.max_sites})`);
        }

        const siteId = siteData.id || this.generateSiteId(siteData.name);
        
        const sql = `
            INSERT INTO sites (
                id, customer_id, name, domain, config, port, url
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            siteId,
            customerId,
            siteData.name,
            siteData.domain || null,
            JSON.stringify(siteData.config),
            siteData.port || null,
            siteData.url || null
        ];

        await this.runQuery(sql, params);
        return await this.getSite(siteId);
    }

    async getSite(siteId) {
        const sql = 'SELECT * FROM sites WHERE id = ?';
        const sites = await this.runQuery(sql, [siteId]);
        
        if (sites.length === 0) {
            throw new Error(`Site ${siteId} not found`);
        }

        const site = sites[0];
        site.config = JSON.parse(site.config);
        return site;
    }

    async getCustomerSites(customerId) {
        const sql = 'SELECT * FROM sites WHERE customer_id = ? ORDER BY created_at DESC';
        const sites = await this.runQuery(sql, [customerId]);
        
        return sites.map(site => {
            site.config = JSON.parse(site.config);
            return site;
        });
    }

    async updateSiteStatus(siteId, status, additionalData = {}) {
        const allowedStatuses = ['created', 'building', 'deploying', 'deployed', 'failed', 'error', 'archived'];
        
        if (!allowedStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        const updates = { status, ...additionalData };
        const setClause = [];
        const params = [];

        for (const [key, value] of Object.entries(updates)) {
            setClause.push(`${key} = ?`);
            params.push(value);
        }

        setClause.push('updated_at = CURRENT_TIMESTAMP');
        params.push(siteId);

        const sql = `
            UPDATE sites 
            SET ${setClause.join(', ')} 
            WHERE id = ?
        `;

        await this.runQuery(sql, params);
        return await this.getSite(siteId);
    }

    /**
     * Migration from file-based configs
     */

    async migrateFromFileConfigs(configsDir) {
        console.log('🔄 Starting migration from file-based configs...');
        
        const configDirs = await fs.readdir(configsDir);
        let migratedCount = 0;
        let errors = [];

        for (const siteId of configDirs) {
            try {
                const configPath = path.join(configsDir, siteId, 'site-config.json');
                
                if (await fs.pathExists(configPath)) {
                    const config = await fs.readJson(configPath);
                    
                    // Create default customer if not exists
                    const customerId = 'default-customer';
                    try {
                        await this.getCustomer(customerId);
                    } catch (error) {
                        await this.createCustomer({
                            id: customerId,
                            email: 'admin@locod.ai',
                            name: 'Default Customer',
                            plan_type: 'enterprise',
                            max_sites: 100
                        });
                    }

                    // Check if site already exists
                    try {
                        await this.getSite(siteId);
                        console.log(`⚠️ Site ${siteId} already exists, skipping...`);
                        continue;
                    } catch (error) {
                        // Site doesn't exist, create it
                    }

                    // Create site in database
                    await this.createSite(customerId, {
                        id: siteId,
                        name: config.brand?.name || siteId,
                        domain: config.meta?.domain,
                        config: config,
                        status: 'created'
                    });

                    migratedCount++;
                    console.log(`✅ Migrated site: ${siteId}`);
                }
            } catch (error) {
                errors.push({ siteId, error: error.message });
                console.error(`❌ Failed to migrate ${siteId}:`, error.message);
            }
        }

        console.log(`\n🎉 Migration completed: ${migratedCount} sites migrated`);
        if (errors.length > 0) {
            console.log(`⚠️ ${errors.length} errors occurred during migration`);
        }

        return { migratedCount, errors };
    }

    /**
     * Backup and restore functionality
     */

    async createSiteBackup(siteId, backupName, createdBy = 'system') {
        const site = await this.getSite(siteId);
        
        const sql = `
            INSERT INTO site_backups (
                site_id, backup_name, config_snapshot, created_by, backup_type
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const params = [
            siteId,
            backupName || `backup-${Date.now()}`,
            JSON.stringify(site.config),
            createdBy,
            'manual'
        ];

        const result = await this.runQuery(sql, params);
        return result.lastID;
    }

    async restoreFromBackup(backupId) {
        const sql = 'SELECT * FROM site_backups WHERE id = ?';
        const backups = await this.runQuery(sql, [backupId]);
        
        if (backups.length === 0) {
            throw new Error(`Backup ${backupId} not found`);
        }

        const backup = backups[0];
        const config = JSON.parse(backup.config_snapshot);

        // Update site with backup config
        const updateSql = `
            UPDATE sites 
            SET config = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;

        await this.runQuery(updateSql, [JSON.stringify(config), backup.site_id]);
        return await this.getSite(backup.site_id);
    }

    /**
     * Utility methods
     */

    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    generateSiteId(siteName) {
        const base = siteName.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '')
            .slice(0, 12);
            
        const timestamp = Date.now().toString().slice(-4);
        return `${base}${timestamp}`;
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.db && this.isConnected) {
            return new Promise((resolve) => {
                this.db.close(() => {
                    this.isConnected = false;
                    console.log('📫 Database connection closed');
                    resolve();
                });
            });
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.runQuery('SELECT 1');
            return { status: 'healthy', connected: this.isConnected };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
}

module.exports = { DatabaseManager };