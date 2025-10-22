#!/usr/bin/env node

/**
 * 🌐 Customer Portal API with Database v1.1.1.9.2.4.2.1.1
 * 
 * Enhanced web interface backend with multi-tenant database support
 * Replaces in-memory storage with persistent SQLite database
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { DatabaseManager } = require('../database/database-manager');
const { ConfigGenerator } = require('./config-generator');
const AIQueueAPI = require('./admin/queue-api');

class CustomerPortalDB {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3080;
        this.db = new DatabaseManager();
        this.configGenerator = new ConfigGenerator();
        this.adminAPI = new AIQueueAPI(this.db.dbPath);
        this.setupMiddleware();
        this.setupRoutes();
    }

    async initialize() {
        console.log('🗄️ Initializing database connection...');
        await this.db.initialize();
        console.log('✅ Database connected successfully');
    }

    setupMiddleware() {
        this.app.use(cors());
        // Increase JSON body limit to 50MB to handle base64 images
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
        
        // Database connection middleware
        this.app.use(async (req, res, next) => {
            if (!this.db.isConnected) {
                return res.status(503).json({ 
                    error: 'Database not available',
                    message: 'Please try again in a moment'
                });
            }
            next();
        });
    }

    setupRoutes() {
        // Health check with database status
        this.app.get('/api/health', async (req, res) => {
            const dbHealth = await this.db.healthCheck();
            res.json({ 
                status: 'healthy', 
                version: '1.1.1.9.2.4.2.1.1',
                service: 'Customer Portal API with Database',
                database: dbHealth
            });
        });

        // Site Generation Routes
        this.app.post('/api/sites/create', this.createSite.bind(this));
        
        // Site Management Routes
        this.app.post('/api/sites/:customerId/:siteId/deploy', this.deploySite.bind(this));
        this.app.post('/api/sites/:customerId/:siteId/patch', this.patchSite.bind(this));
        this.app.get('/api/sites/:customerId/:siteId', this.getSite.bind(this));
        this.app.put('/api/sites/:customerId/:siteId', this.updateSite.bind(this));
        this.app.delete('/api/sites/:customerId/:siteId', this.deleteSite.bind(this));
        
        // Customer Management Routes
        this.app.post('/api/customers', this.createCustomer.bind(this));
        this.app.get('/api/customers/:customerId', this.getCustomer.bind(this));
        this.app.put('/api/customers/:customerId', this.updateCustomer.bind(this));
        this.app.get('/api/customers/:customerId/sites', this.getCustomerSites.bind(this));
        
        // Configuration Routes
        this.app.get('/api/config/business-types', this.getBusinessTypes.bind(this));
        
        // Template Management Routes
        this.app.get('/api/templates', this.getTemplates.bind(this));
        this.app.get('/api/templates/:templateName', this.getTemplate.bind(this));
        this.app.post('/api/templates', this.createTemplate.bind(this));
        this.app.delete('/api/templates/:templateName', this.deleteTemplate.bind(this));
        
        // Customer Dashboard Routes
        this.app.get('/api/customer/:customerId/dashboard', this.getCustomerDashboard.bind(this));
        
        // Backup and Restore Routes
        this.app.post('/api/sites/:customerId/:siteId/backup', this.createBackup.bind(this));
        this.app.get('/api/sites/:customerId/:siteId/backups', this.getBackups.bind(this));
        this.app.post('/api/sites/:customerId/:siteId/restore/:backupId', this.restoreBackup.bind(this));
        
        // Admin AI Queue Routes (mounted FIRST to avoid conflicts)
        this.app.use('/admin', this.adminAPI.getRouter());
        
        // Admin Routes
        this.app.get('/api/admin/stats', this.getAdminStats.bind(this));
        this.app.get('/api/admin/customers', this.getAllCustomers.bind(this));
        
        // Wizard route
        this.app.get('/wizard', (req, res) => {
            res.sendFile(path.join(__dirname, 'portal-ui', 'wizard.html'));
        });
        
        // Admin dashboard route
        this.app.get('/admin-dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
        });
        
        // Serve static files (CSS, JS, images) AFTER API routes
        this.app.use(express.static(path.join(__dirname, 'portal-ui')));
        
        // Catch-all for SPA - serve index.html for non-API routes
        this.app.get('*', (req, res) => {
            // Only serve HTML for non-API requests
            if (!req.path.startsWith('/api/')) {
                res.sendFile(path.join(__dirname, 'portal-ui', 'index.html'));
            } else {
                res.status(404).json({ error: 'API endpoint not found' });
            }
        });
    }

    /**
     * Customer Management
     */
    
    async createCustomer(req, res) {
        try {
            const customerData = req.body;
            
            // Validate required fields
            if (!customerData.email || !customerData.name) {
                return res.status(400).json({
                    error: 'Missing required fields: email, name'
                });
            }

            const customer = await this.db.createCustomer(customerData);
            
            res.json({
                success: true,
                customer: {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    plan_type: customer.plan_type,
                    created_at: customer.created_at
                }
            });

        } catch (error) {
            console.error('Customer creation error:', error);
            res.status(500).json({
                error: 'Failed to create customer',
                details: error.message
            });
        }
    }

    async getCustomer(req, res) {
        try {
            const { customerId } = req.params;
            const customer = await this.db.getCustomer(customerId);
            
            res.json({
                success: true,
                customer: {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    company_name: customer.company_name,
                    plan_type: customer.plan_type,
                    status: customer.status,
                    created_at: customer.created_at,
                    quotas: {
                        max_sites: customer.max_sites,
                        max_storage_mb: customer.max_storage_mb,
                        max_bandwidth_gb: customer.max_bandwidth_gb
                    }
                }
            });

        } catch (error) {
            res.status(404).json({
                error: 'Customer not found',
                details: error.message
            });
        }
    }

    async updateCustomer(req, res) {
        try {
            const { customerId } = req.params;
            const updates = req.body;
            
            const customer = await this.db.updateCustomer(customerId, updates);
            
            res.json({
                success: true,
                customer: {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    plan_type: customer.plan_type,
                    updated_at: customer.updated_at
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to update customer',
                details: error.message
            });
        }
    }

    /**
     * Site Management
     */

    async createSite(req, res) {
        try {
            let { customerId, siteData } = req.body;
            
            // Validate input
            if (!siteData?.name) {
                return res.status(400).json({
                    error: 'Missing required field: siteData.name'
                });
            }
            
            // If no customerId provided, use default-customer
            if (!customerId || customerId === 'b131e26a1d916c086088491ea6ed0cfa' || customerId === 'wizard-user') {
                // Use the existing default-customer
                customerId = 'default-customer';
                console.log('✅ Using default-customer for site creation');
            }

            // Create site in database first to get the ID
            const site = await this.db.createSite(customerId, {
                name: siteData.name,
                domain: siteData.domain,
                config: {}, // Temporary empty config
                port: siteData.port
            });

            // Generate site configuration using ConfigGenerator with the actual site ID
            const siteConfig = this.configGenerator.generateConfig({
                siteId: site.id, // Pass the actual site ID
                siteName: siteData.name,
                businessType: siteData.businessType,
                domain: siteData.domain,
                slogan: siteData.slogan,
                colors: siteData.colors,
                services: siteData.services,
                activities: siteData.activities,
                terminology: siteData.terminology,
                contact: siteData.contact,
                n8nEnabled: siteData.n8nEnabled,
                features: siteData.features,
                seo: siteData.seo,
                template: siteData.template,
                generatedContent: siteData.generatedContent,
                about: siteData.about,
                hero: siteData.hero,
                testimonials: siteData.testimonials,
                faq: siteData.faq,
                blog: siteData.blog,
                integrations: siteData.integrations,
                images: siteData.images
            });
            
            // Update site with the complete config
            await this.db.runQuery(
                'UPDATE sites SET config = ? WHERE id = ?',
                [JSON.stringify(siteConfig), site.id]
            );

            // Save configuration file using ConfigGenerator with all assets
            const saveOptions = {
                saveAsTemplate: siteData.saveAsTemplate || false,
                templateName: siteData.templateName,
                images: siteData.images, // Pass actual base64 images
                blogArticles: siteData.blog // Pass blog articles for markdown generation
            };
            
            let configSaved = false;
            try {
                const saveResult = await this.configGenerator.saveConfig(siteConfig, saveOptions);
                console.log('✅ Config saved:', saveResult);
                configSaved = true;
            } catch (saveError) {
                console.error('❌ Failed to save config files:', saveError);
                // Continue anyway - site is created in DB even if files fail
                configSaved = false;
            }

            // Auto-deploy if requested AND config was saved successfully
            let deploymentInfo = null;
            if (siteData.deploy && configSaved) {
                console.log('🚀 Starting auto-deployment for site...', site.id);
                try {
                    // Find available port in range 3000-3100
                    const port = await this.findAvailablePort(3000, 3100);
                    
                    // Update site status to deploying
                    await this.db.updateSiteStatus(site.id, 'deploying', {
                        port: port
                    });
                    
                    // Start deployment asynchronously (don't wait)
                    const { spawn } = require('child_process');
                    const deploy = spawn('./scripts/deploy/quick-deploy.sh', [site.id, port.toString()], {
                        cwd: path.resolve(__dirname, '..'),
                        stdio: 'pipe',
                        detached: true
                    });
                    
                    // Handle deployment completion in background
                    deploy.on('close', async (code) => {
                        if (code === 0) {
                            // Update site with deployment info
                            await this.db.updateSiteStatus(site.id, 'deployed', {
                                deployed_at: new Date().toISOString(),
                                url: `http://162.55.213.90:${port}`,
                                port: port
                            });
                            console.log(`✅ Site ${site.id} deployed at http://162.55.213.90:${port}`);
                        } else {
                            await this.db.updateSiteStatus(site.id, 'error', {
                                build_logs: `Deployment failed with code ${code}`
                            });
                            console.error(`❌ Site ${site.id} deployment failed`);
                        }
                    });
                    
                    // Don't wait for deployment - return immediately
                    deploy.unref();
                    
                    deploymentInfo = {
                        status: 'deploying',
                        port: port,
                        message: 'Deployment started in background'
                    };
                    
                } catch (deployError) {
                    console.error('Failed to start deployment:', deployError);
                    await this.db.updateSiteStatus(site.id, 'error', {
                        build_logs: deployError.message
                    });
                }
            }

            res.json({
                success: true,
                site: {
                    id: site.id,
                    name: site.name,
                    status: deploymentInfo ? deploymentInfo.status : site.status,
                    created_at: site.created_at,
                    url: deploymentInfo?.url,
                    port: deploymentInfo?.port
                },
                deployment: deploymentInfo,
                next_steps: {
                    deploy: `/api/sites/${customerId}/${site.id}/deploy`,
                    manage: `/admin/${customerId}/${site.id}`
                }
            });

        } catch (error) {
            console.error('Site creation error:', error);
            res.status(500).json({
                error: 'Failed to create site',
                details: error.message
            });
        }
    }

    async getSite(req, res) {
        try {
            const { siteId } = req.params;
            const site = await this.db.getSite(siteId);
            
            res.json({
                success: true,
                site: {
                    id: site.id,
                    name: site.name,
                    domain: site.domain,
                    status: site.status,
                    url: site.url,
                    port: site.port,
                    created_at: site.created_at,
                    updated_at: site.updated_at,
                    config: site.config
                }
            });

        } catch (error) {
            res.status(404).json({
                error: 'Site not found',
                details: error.message
            });
        }
    }

    async getCustomerSites(req, res) {
        try {
            const { customerId } = req.params;
            const sites = await this.db.getCustomerSites(customerId);
            
            res.json({
                success: true,
                sites: sites.map(site => ({
                    id: site.id,
                    name: site.name,
                    domain: site.domain,
                    status: site.status,
                    url: site.url,
                    created_at: site.created_at,
                    updated_at: site.updated_at
                }))
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to get customer sites',
                details: error.message
            });
        }
    }

    async deploySite(req, res) {
        try {
            const { customerId, siteId } = req.params;
            const { port } = req.body;

            // Get site from database
            const site = await this.db.getSite(siteId);
            
            // Update site status to building
            await this.db.updateSiteStatus(siteId, 'building', {
                last_build_at: new Date().toISOString()
            });

            // Deploy using quick-deploy script for non-interactive deployment
            const { spawn } = require('child_process');
            const deployPort = port || this.getNextAvailablePort();
            
            const deploy = spawn('./scripts/deploy/quick-deploy.sh', [siteId, deployPort.toString()], {
                cwd: path.resolve(__dirname, '..'),
                stdio: 'pipe'
            });

            let output = '';
            deploy.stdout.on('data', (data) => {
                output += data.toString();
            });

            deploy.stderr.on('data', (data) => {
                output += data.toString();
            });

            deploy.on('close', async (code) => {
                try {
                    if (code === 0) {
                        const deployedSite = await this.db.updateSiteStatus(siteId, 'deployed', {
                            deployed_at: new Date().toISOString(),
                            url: `http://162.55.213.90:${deployPort}`,
                            port: deployPort,
                            build_status: 'success',
                            build_logs: output
                        });

                        res.json({
                            success: true,
                            status: 'deployed',
                            site: {
                                id: deployedSite.id,
                                url: deployedSite.url,
                                port: deployedSite.port,
                                deployed_at: deployedSite.deployed_at
                            }
                        });
                    } else {
                        await this.db.updateSiteStatus(siteId, 'error', {
                            build_status: 'error',
                            build_logs: output
                        });

                        res.status(500).json({
                            error: 'Deployment failed',
                            build_logs: output
                        });
                    }
                } catch (dbError) {
                    console.error('Database update error:', dbError);
                    res.status(500).json({
                        error: 'Deployment completed but database update failed',
                        details: dbError.message
                    });
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Deployment error',
                details: error.message
            });
        }
    }

    /**
     * Dashboard and Analytics
     */

    async getCustomerDashboard(req, res) {
        try {
            const { customerId } = req.params;
            const customer = await this.db.getCustomer(customerId);
            const sites = await this.db.getCustomerSites(customerId);
            
            const dashboard = {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    plan_type: customer.plan_type,
                    created_at: customer.created_at
                },
                sites: sites.map(site => ({
                    id: site.id,
                    name: site.name,
                    status: site.status,
                    url: site.url,
                    created_at: site.created_at,
                    deployed_at: site.deployed_at
                })),
                stats: {
                    totalSites: sites.length,
                    activeSites: sites.filter(s => s.status === 'deployed').length,
                    buildingSites: sites.filter(s => s.status === 'building').length,
                    errorSites: sites.filter(s => s.status === 'error').length
                },
                quotas: {
                    sites: {
                        used: sites.length,
                        max: customer.max_sites,
                        percentage: Math.round((sites.length / customer.max_sites) * 100)
                    },
                    storage: {
                        used: sites.reduce((sum, site) => sum + (site.storage_used_mb || 0), 0),
                        max: customer.max_storage_mb,
                        unit: 'MB'
                    }
                }
            };

            res.json({
                success: true,
                dashboard
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to get dashboard',
                details: error.message
            });
        }
    }

    async updateSite(req, res) {
        try {
            const { siteId } = req.params;
            const updates = req.body;
            
            // Get current site
            const site = await this.db.getSite(siteId);
            
            // Update configuration if provided
            if (updates.config) {
                site.config = { ...site.config, ...updates.config };
                await this.saveConfigFile(siteId, site.config);
            }
            
            // Update database
            const allowedFields = ['name', 'domain', 'status', 'port', 'url'];
            const dbUpdates = {};
            
            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    dbUpdates[key] = value;
                } else if (key === 'config') {
                    dbUpdates.config = JSON.stringify(site.config);
                }
            }
            
            if (Object.keys(dbUpdates).length > 0) {
                dbUpdates.updated_at = new Date().toISOString();
                
                const setClause = Object.keys(dbUpdates).map(key => `${key} = ?`);
                const params = [...Object.values(dbUpdates), siteId];
                
                await this.db.runQuery(`
                    UPDATE sites 
                    SET ${setClause.join(', ')} 
                    WHERE id = ?
                `, params);
            }
            
            const updatedSite = await this.db.getSite(siteId);
            
            res.json({
                success: true,
                site: {
                    id: updatedSite.id,
                    name: updatedSite.name,
                    status: updatedSite.status,
                    updated_at: updatedSite.updated_at
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to update site',
                details: error.message
            });
        }
    }

    async deleteSite(req, res) {
        try {
            const { siteId } = req.params;
            
            // Archive instead of delete to preserve history
            await this.db.updateSiteStatus(siteId, 'archived');
            
            res.json({
                success: true,
                message: 'Site archived successfully'
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete site',
                details: error.message
            });
        }
    }

    async patchSite(req, res) {
        try {
            const { customerId, siteId } = req.params;
            const { patchType, options } = req.body;

            // Get site to verify ownership
            const site = await this.db.getSite(siteId);
            if (site.customer_id !== customerId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Site does not belong to customer'
                });
            }

            // Create backup before patching
            const backupId = await this.db.createSiteBackup(
                siteId, 
                `pre-patch-${patchType}-${Date.now()}`,
                customerId
            );

            // Apply patch based on type
            let patchResult = {};
            
            switch (patchType) {
                case 'config':
                    if (options.config) {
                        const updatedConfig = { ...site.config, ...options.config };
                        await this.saveConfigFile(siteId, updatedConfig);
                        
                        await this.db.runQuery(`
                            UPDATE sites 
                            SET config = ?, updated_at = CURRENT_TIMESTAMP 
                            WHERE id = ?
                        `, [JSON.stringify(updatedConfig), siteId]);
                        
                        patchResult = { configUpdated: true };
                    }
                    break;
                    
                case 'status':
                    if (options.status) {
                        await this.db.updateSiteStatus(siteId, options.status);
                        patchResult = { statusUpdated: options.status };
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown patch type: ${patchType}`);
            }

            res.json({
                success: true,
                patchApplied: patchType,
                changes: patchResult,
                backupId: backupId
            });

        } catch (error) {
            res.status(500).json({
                error: 'Patch failed',
                details: error.message
            });
        }
    }

    /**
     * Backup and Restore
     */

    async createBackup(req, res) {
        try {
            const { siteId } = req.params;
            const { name } = req.body;
            
            const backupId = await this.db.createSiteBackup(
                siteId, 
                name || `backup-${Date.now()}`,
                'customer' // created_by
            );
            
            res.json({
                success: true,
                backup_id: backupId,
                message: 'Backup created successfully'
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to create backup',
                details: error.message
            });
        }
    }

    async getBackups(req, res) {
        try {
            const { siteId } = req.params;
            
            const backups = await this.db.runQuery(`
                SELECT id, backup_name, created_at, created_by, backup_type, size_mb
                FROM site_backups 
                WHERE site_id = ? 
                ORDER BY created_at DESC
            `, [siteId]);
            
            res.json({
                success: true,
                backups: backups.map(backup => ({
                    id: backup.id,
                    name: backup.backup_name,
                    created_at: backup.created_at,
                    created_by: backup.created_by,
                    type: backup.backup_type,
                    size_mb: backup.size_mb
                }))
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to get backups',
                details: error.message
            });
        }
    }

    async restoreBackup(req, res) {
        try {
            const { backupId } = req.params;
            
            const site = await this.db.restoreFromBackup(backupId);
            
            // Update config file for backward compatibility
            await this.saveConfigFile(site.id, site.config);
            
            res.json({
                success: true,
                site: {
                    id: site.id,
                    name: site.name,
                    updated_at: site.updated_at
                },
                message: 'Site restored from backup successfully'
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to restore backup',
                details: error.message
            });
        }
    }

    /**
     * Template Management
     */

    async getTemplates(req, res) {
        try {
            const templates = await this.configGenerator.listTemplates();
            
            res.json({
                success: true,
                templates: templates
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to get templates',
                details: error.message
            });
        }
    }

    async getTemplate(req, res) {
        try {
            const { templateName } = req.params;
            const template = await this.configGenerator.loadTemplate(templateName);
            
            res.json({
                success: true,
                template: template
            });

        } catch (error) {
            res.status(404).json({
                error: 'Template not found',
                details: error.message
            });
        }
    }

    async createTemplate(req, res) {
        try {
            const { templateName, config } = req.body;
            
            if (!templateName || !config) {
                return res.status(400).json({
                    error: 'Missing required fields: templateName, config'
                });
            }
            
            const templatePath = await this.configGenerator.saveAsTemplate(config, templateName);
            
            res.json({
                success: true,
                templateName: templateName,
                templatePath: templatePath,
                message: 'Template created successfully'
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to create template',
                details: error.message
            });
        }
    }

    async deleteTemplate(req, res) {
        try {
            const { templateName } = req.params;
            const templatePath = path.join(this.configGenerator.templatesDir, `${templateName}.json`);
            
            if (!await fs.pathExists(templatePath)) {
                return res.status(404).json({
                    error: 'Template not found'
                });
            }
            
            await fs.remove(templatePath);
            
            res.json({
                success: true,
                message: 'Template deleted successfully'
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete template',
                details: error.message
            });
        }
    }

    /**
     * Utility methods
     */

    async generateSiteConfig(siteData) {
        // Use existing logic from original customer-portal.js
        const businessTypes = {
            'translation': {
                defaultColors: { primary: '#059669', secondary: '#10B981', accent: '#34D399' },
                ctaDefaults: {
                    title: 'Prêt à démarrer votre projet de traduction ?',
                    description: 'Contactez-nous pour discuter de vos besoins et recevoir un devis personnalisé.'
                }
            },
            'education': {
                defaultColors: { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' },
                ctaDefaults: {
                    title: 'Prêt à commencer votre apprentissage ?',
                    description: 'Contactez-nous pour découvrir nos programmes et réserver votre cours d\'essai.'
                }
            }
        };

        const typeConfig = businessTypes[siteData.businessType] || businessTypes.translation;

        return {
            meta: {
                siteId: siteData.id,
                domain: siteData.domain || `${siteData.id}.example.com`,
                language: 'fr',
                timezone: 'Europe/Paris'
            },
            brand: {
                name: siteData.name,
                slogan: siteData.slogan,
                colors: typeConfig.defaultColors
            },
            content: {
                hero: {
                    title: siteData.slogan || siteData.name,
                    description: `Découvrez les services ${siteData.name}`,
                    cta: {
                        primary: 'Demander un devis',
                        secondary: 'Voir nos services'
                    }
                },
                services: siteData.services || [],
                cta: typeConfig.ctaDefaults
            },
            contact: siteData.contact || {},
            integrations: {
                n8n: {
                    enabled: siteData.n8nEnabled || false
                }
            }
        };
    }

    async saveConfigFile(siteId, config) {
        const configDir = path.join(__dirname, '..', 'configs', siteId);
        await fs.ensureDir(configDir);
        await fs.writeFile(
            path.join(configDir, 'site-config.json'),
            JSON.stringify(config, null, 2)
        );
    }

    getNextAvailablePort() {
        return 3000 + Math.floor(Math.random() * 100);
    }

    async findAvailablePort(startPort = 3000, endPort = 3100) {
        const net = require('net');
        
        // Get all deployed sites' ports from database
        const deployedSites = await this.db.runQuery(
            'SELECT port FROM sites WHERE status = "deployed" AND port IS NOT NULL'
        );
        const usedPorts = new Set(deployedSites.map(s => s.port));
        
        // Function to check if a port is available
        const checkPort = (port) => {
            return new Promise((resolve) => {
                if (usedPorts.has(port)) {
                    resolve(false);
                    return;
                }
                
                const server = net.createServer();
                server.unref();
                server.on('error', () => resolve(false));
                server.listen(port, '0.0.0.0', () => {
                    server.close(() => resolve(true));
                });
            });
        };
        
        // Find first available port in range
        for (let port = startPort; port <= endPort; port++) {
            if (await checkPort(port)) {
                return port;
            }
        }
        
        throw new Error(`No available ports in range ${startPort}-${endPort}`);
    }

    async getBusinessTypes(req, res) {
        // Same as original implementation
        const businessTypes = {
            'translation': {
                name: 'Services de traduction',
                description: 'Sites pour traducteurs et agences de traduction',
                features: ['Multilingue', 'Devis en ligne', 'Portfolio']
            },
            'education': {
                name: 'Formation/Éducation',
                description: 'Sites pour formateurs, écoles, cours en ligne',
                features: ['Système de réservation', 'Gestion des élèves', 'Contenu pédagogique']
            },
            'creative': {
                name: 'Services créatifs',
                description: 'Sites pour artistes, designers, photographes',
                features: ['Galerie d\'œuvres', 'Commandes personnalisées', 'Blog créatif']
            },
            'business': {
                name: 'Services d\'entreprise',
                description: 'Sites pour consultants, services B2B',
                features: ['Présentation de services', 'Témoignages', 'Contact professionnel']
            }
        };

        res.json({ businessTypes });
    }

    /**
     * Admin endpoints
     */

    async getAdminStats(req, res) {
        try {
            const customers = await this.db.runQuery('SELECT COUNT(*) as count FROM customers');
            const sites = await this.db.runQuery('SELECT COUNT(*) as count FROM sites');
            const deployments = await this.db.runQuery('SELECT COUNT(*) as count FROM site_deployments');
            const activeSites = await this.db.runQuery('SELECT COUNT(*) as count FROM sites WHERE status = "deployed"');

            res.json({
                success: true,
                stats: {
                    totalCustomers: customers[0].count,
                    totalSites: sites[0].count,
                    activeSites: activeSites[0].count,
                    totalDeployments: deployments[0].count
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to get admin stats',
                details: error.message
            });
        }
    }

    async getAllCustomers(req, res) {
        try {
            const customers = await this.db.runQuery(`
                SELECT c.*, COUNT(s.id) as site_count 
                FROM customers c 
                LEFT JOIN sites s ON c.id = s.customer_id 
                GROUP BY c.id 
                ORDER BY c.created_at DESC
            `);

            res.json({
                success: true,
                customers: customers.map(customer => ({
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    plan_type: customer.plan_type,
                    status: customer.status,
                    site_count: customer.site_count,
                    created_at: customer.created_at
                }))
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to get customers',
                details: error.message
            });
        }
    }

    /**
     * Start the server
     */
    async start() {
        try {
            await this.initialize();
            
            this.app.listen(this.port, () => {
                console.log(`🌐 Customer Portal with Database running on port ${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}/admin`);
                console.log(`🎯 Site Creator: http://localhost:${this.port}/create`);
                console.log(`💾 Database: ${this.db.dbPath}`);
            });
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🔄 Shutting down gracefully...');
        await this.db.close();
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    if (global.portalInstance) {
        await global.portalInstance.shutdown();
    }
});

process.on('SIGTERM', async () => {
    if (global.portalInstance) {
        await global.portalInstance.shutdown();
    }
});

// Start server if run directly
if (require.main === module) {
    const portal = new CustomerPortalDB();
    global.portalInstance = portal;
    portal.start();
}

module.exports = { CustomerPortalDB };