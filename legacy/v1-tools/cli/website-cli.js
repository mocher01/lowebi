#!/usr/bin/env node

/**
 * 🖥️ Website Generator CLI v1.1.1.9.2.4.2.2
 * 
 * Command-line interface that integrates with Customer Portal API
 * Provides same functionality as web portal through interactive prompts
 */

const inquirer = require('inquirer');
const axios = require('axios');
const ora = require('ora');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class WebsiteCLI {
    constructor() {
        this.apiBase = process.env.PORTAL_API_URL || 'http://localhost:3080';
        this.customerId = process.env.CUSTOMER_ID || 'default-customer';
        this.version = '1.1.1.9.2.4.2.2';
    }

    async run() {
        try {
            console.log(chalk.blue(`
🌐 Website Generator CLI v${this.version}
==========================================
Connected to: ${this.apiBase}
Customer: ${this.customerId}
`));

            // Check portal connectivity
            await this.checkPortalHealth();

            const action = await this.getMainAction();
            
            switch (action) {
                case 'create':
                    await this.createSiteWizard();
                    break;
                case 'list':
                    await this.listSites();
                    break;
                case 'deploy':
                    await this.deploySiteWizard();
                    break;
                case 'dashboard':
                    await this.showDashboard();
                    break;
                case 'backup':
                    await this.backupSiteWizard();
                    break;
                case 'config':
                    await this.configureSettings();
                    break;
                default:
                    console.log(chalk.yellow('Goodbye! 👋'));
            }

        } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }

    async checkPortalHealth() {
        const spinner = ora('Checking portal connection...').start();
        
        try {
            const response = await axios.get(`${this.apiBase}/api/health`, {
                timeout: 5000
            });
            
            if (response.data.status === 'healthy') {
                spinner.succeed(chalk.green(`Portal connected (v${response.data.version})`));
                
                // Verify database is healthy too
                if (response.data.database?.status === 'healthy') {
                    console.log(chalk.gray('✓ Database: Connected'));
                }
            } else {
                spinner.fail('Portal unhealthy');
                throw new Error('Portal is not healthy');
            }
        } catch (error) {
            spinner.fail('Portal connection failed');
            throw new Error(`Cannot connect to portal at ${this.apiBase}. Is it running?`);
        }
    }

    async getMainAction() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '🚀 Create new site', value: 'create' },
                    { name: '📋 List my sites', value: 'list' },
                    { name: '🌐 Deploy site', value: 'deploy' },
                    { name: '📊 Show dashboard', value: 'dashboard' },
                    { name: '💾 Backup site', value: 'backup' },
                    { name: '⚙️ Configure settings', value: 'config' },
                    { name: '👋 Exit', value: 'exit' }
                ]
            }
        ]);

        return action;
    }

    async createSiteWizard() {
        console.log(chalk.blue('\n🚀 Create New Site'));
        console.log(chalk.gray('================'));

        // Get business types from portal
        const businessTypes = await this.getBusinessTypes();
        
        const siteData = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Site name:',
                validate: (input) => input.length > 0 || 'Site name is required'
            },
            {
                type: 'input',
                name: 'domain',
                message: 'Domain (optional):',
                default: ''
            },
            {
                type: 'list',
                name: 'businessType',
                message: 'Business type:',
                choices: Object.entries(businessTypes).map(([key, config]) => ({
                    name: `${config.name} - ${config.description}`,
                    value: key
                }))
            },
            {
                type: 'input',
                name: 'slogan',
                message: 'Site slogan/tagline:',
                default: ''
            }
        ]);

        // Advanced options
        const { wantAdvanced } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'wantAdvanced',
                message: 'Configure advanced options?',
                default: false
            }
        ]);

        if (wantAdvanced) {
            const advanced = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'email',
                    message: 'Contact email:',
                    default: ''
                },
                {
                    type: 'input',
                    name: 'phone',
                    message: 'Contact phone:',
                    default: ''
                },
                {
                    type: 'confirm',
                    name: 'n8nEnabled',
                    message: 'Enable N8N workflow integration?',
                    default: false
                }
            ]);

            siteData.contact = {
                email: advanced.email,
                phone: advanced.phone
            };
            siteData.n8nEnabled = advanced.n8nEnabled;
        }

        // Confirm before creation
        console.log(chalk.yellow('\n📋 Site Configuration:'));
        console.log(`Name: ${siteData.name}`);
        console.log(`Domain: ${siteData.domain || 'Auto-generated'}`);
        console.log(`Business Type: ${businessTypes[siteData.businessType].name}`);
        console.log(`Slogan: ${siteData.slogan || 'None'}`);

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Create this site?',
                default: true
            }
        ]);

        if (!confirm) {
            console.log(chalk.yellow('Site creation cancelled.'));
            return;
        }

        // Create site via portal API
        await this.createSiteViaAPI(siteData);
    }

    async createSiteViaAPI(siteData) {
        const spinner = ora('Creating site...').start();

        try {
            const response = await axios.post(`${this.apiBase}/api/sites/create`, {
                customerId: this.customerId,
                siteData: siteData
            });

            if (response.data.success) {
                spinner.succeed(chalk.green('Site created successfully!'));
                
                const site = response.data.site;
                console.log(chalk.blue('\n🎉 Site Details:'));
                console.log(`ID: ${site.id}`);
                console.log(`Name: ${site.name}`);
                console.log(`Status: ${site.status}`);
                console.log(`Created: ${new Date(site.created_at).toLocaleString()}`);

                // Ask if user wants to deploy immediately
                const { deployNow } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'deployNow',
                        message: 'Deploy site now?',
                        default: true
                    }
                ]);

                if (deployNow) {
                    await this.deploySite(site.id);
                }

            } else {
                spinner.fail('Site creation failed');
                console.error(chalk.red('Error:'), response.data.error || 'Unknown error');
            }

        } catch (error) {
            spinner.fail('Site creation failed');
            console.error(chalk.red('Error:'), error.response?.data?.details || error.message);
        }
    }

    async listSites() {
        console.log(chalk.blue('\n📋 Your Sites'));
        console.log(chalk.gray('============='));

        const spinner = ora('Loading sites...').start();

        try {
            const response = await axios.get(`${this.apiBase}/api/customers/${this.customerId}/sites`);
            
            if (response.data.success) {
                spinner.succeed('Sites loaded');
                
                const sites = response.data.sites;
                
                if (sites.length === 0) {
                    console.log(chalk.yellow('No sites found. Use "create" to make your first site!'));
                    return;
                }

                console.log(`\nFound ${sites.length} sites:\n`);
                
                sites.forEach((site, index) => {
                    const statusColor = site.status === 'deployed' ? 'green' : 
                                       site.status === 'error' ? 'red' : 'yellow';
                    
                    console.log(`${index + 1}. ${chalk.bold(site.name)}`);
                    console.log(`   ID: ${site.id}`);
                    console.log(`   Status: ${chalk[statusColor](site.status)}`);
                    console.log(`   Domain: ${site.domain || 'None'}`);
                    console.log(`   URL: ${site.url || 'Not deployed'}`);
                    console.log(`   Created: ${new Date(site.created_at).toLocaleString()}`);
                    console.log('');
                });

                // Ask if user wants to manage a site
                const { manageSite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'manageSite',
                        message: 'Manage a site?',
                        default: false
                    }
                ]);

                if (manageSite) {
                    await this.manageSiteWizard(sites);
                }

            } else {
                spinner.fail('Failed to load sites');
                console.error(chalk.red('Error:'), response.data.error);
            }

        } catch (error) {
            spinner.fail('Failed to load sites');
            console.error(chalk.red('Error:'), error.response?.data?.details || error.message);
        }
    }

    async manageSiteWizard(sites) {
        const { selectedSiteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedSiteId',
                message: 'Select site to manage:',
                choices: sites.map(site => ({
                    name: `${site.name} (${site.status})`,
                    value: site.id
                }))
            }
        ]);

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '🌐 Deploy site', value: 'deploy' },
                    { name: '📋 View details', value: 'details' },
                    { name: '💾 Create backup', value: 'backup' },
                    { name: '⚙️ Update config', value: 'update' },
                    { name: '🔙 Back to main menu', value: 'back' }
                ]
            }
        ]);

        switch (action) {
            case 'deploy':
                await this.deploySite(selectedSiteId);
                break;
            case 'details':
                await this.showSiteDetails(selectedSiteId);
                break;
            case 'backup':
                await this.createSiteBackup(selectedSiteId);
                break;
            case 'update':
                await this.updateSiteConfig(selectedSiteId);
                break;
        }
    }

    async deploySiteWizard() {
        console.log(chalk.blue('\n🌐 Deploy Site'));
        console.log(chalk.gray('=============='));

        // Get list of sites first
        const sites = await this.getSites();
        
        if (sites.length === 0) {
            console.log(chalk.yellow('No sites available to deploy. Create a site first!'));
            return;
        }

        const { siteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'siteId',
                message: 'Select site to deploy:',
                choices: sites.map(site => ({
                    name: `${site.name} (${site.status})`,
                    value: site.id
                }))
            }
        ]);

        await this.deploySite(siteId);
    }

    async deploySite(siteId) {
        const spinner = ora('Deploying site...').start();

        try {
            // Get available port
            const port = await this.getAvailablePort();
            
            const response = await axios.post(`${this.apiBase}/api/sites/${this.customerId}/${siteId}/deploy`, {
                port: port
            });

            if (response.data.success) {
                spinner.succeed(chalk.green('Site deployed successfully!'));
                
                console.log(chalk.blue('\n🚀 Deployment Details:'));
                console.log(`URL: ${response.data.site.url}`);
                console.log(`Port: ${response.data.site.port}`);
                console.log(`Deployed: ${new Date(response.data.site.deployed_at).toLocaleString()}`);
                
            } else {
                spinner.fail('Deployment failed');
                console.error(chalk.red('Error:'), response.data.error);
            }

        } catch (error) {
            spinner.fail('Deployment failed');
            console.error(chalk.red('Error:'), error.response?.data?.build_logs || error.response?.data?.details || error.message);
        }
    }

    async showDashboard() {
        console.log(chalk.blue('\n📊 Dashboard'));
        console.log(chalk.gray('============'));

        const spinner = ora('Loading dashboard...').start();

        try {
            const response = await axios.get(`${this.apiBase}/api/customer/${this.customerId}/dashboard`);
            
            if (response.data.success) {
                spinner.succeed('Dashboard loaded');
                
                const dashboard = response.data.dashboard;
                
                console.log(chalk.blue('\n👤 Customer Information:'));
                console.log(`Name: ${dashboard.customer.name}`);
                console.log(`Plan: ${dashboard.customer.plan_type}`);
                console.log(`Member since: ${new Date(dashboard.customer.created_at).toLocaleDateString()}`);
                
                console.log(chalk.blue('\n📈 Statistics:'));
                console.log(`Total Sites: ${dashboard.stats.totalSites}`);
                console.log(`Active Sites: ${dashboard.stats.activeSites}`);
                console.log(`Building Sites: ${dashboard.stats.buildingSites || 0}`);
                console.log(`Error Sites: ${dashboard.stats.errorSites || 0}`);
                
                console.log(chalk.blue('\n💾 Resource Usage:'));
                console.log(`Sites: ${dashboard.quotas.sites.used}/${dashboard.quotas.sites.max} (${dashboard.quotas.sites.percentage}%)`);
                console.log(`Storage: ${dashboard.quotas.storage.used} ${dashboard.quotas.storage.unit} / ${dashboard.quotas.storage.max} ${dashboard.quotas.storage.unit}`);
                
            } else {
                spinner.fail('Failed to load dashboard');
                console.error(chalk.red('Error:'), response.data.error);
            }

        } catch (error) {
            spinner.fail('Failed to load dashboard');
            console.error(chalk.red('Error:'), error.response?.data?.details || error.message);
        }
    }

    async backupSiteWizard() {
        console.log(chalk.blue('\n💾 Backup Site'));
        console.log(chalk.gray('=============='));

        const sites = await this.getSites();
        
        if (sites.length === 0) {
            console.log(chalk.yellow('No sites available to backup.'));
            return;
        }

        const { siteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'siteId',
                message: 'Select site to backup:',
                choices: sites.map(site => ({
                    name: `${site.name} (${site.status})`,
                    value: site.id
                }))
            }
        ]);

        await this.createSiteBackup(siteId);
    }

    async createSiteBackup(siteId) {
        const { backupName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'backupName',
                message: 'Backup name (optional):',
                default: `cli-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
            }
        ]);

        const spinner = ora('Creating backup...').start();

        try {
            const response = await axios.post(`${this.apiBase}/api/sites/${this.customerId}/${siteId}/backup`, {
                name: backupName
            });

            if (response.data.success) {
                spinner.succeed(chalk.green('Backup created successfully!'));
                console.log(`Backup ID: ${response.data.backup_id}`);
            } else {
                spinner.fail('Backup creation failed');
                console.error(chalk.red('Error:'), response.data.error);
            }

        } catch (error) {
            spinner.fail('Backup creation failed');
            console.error(chalk.red('Error:'), error.response?.data?.details || error.message);
        }
    }

    async configureSettings() {
        console.log(chalk.blue('\n⚙️ CLI Settings'));
        console.log(chalk.gray('==============='));

        const currentSettings = {
            apiBase: this.apiBase,
            customerId: this.customerId
        };

        console.log('Current settings:');
        console.log(`API URL: ${currentSettings.apiBase}`);
        console.log(`Customer ID: ${currentSettings.customerId}`);

        const { updateSettings } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'updateSettings',
                message: 'Update settings?',
                default: false
            }
        ]);

        if (updateSettings) {
            const newSettings = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'apiBase',
                    message: 'Portal API URL:',
                    default: currentSettings.apiBase
                },
                {
                    type: 'input',
                    name: 'customerId',
                    message: 'Customer ID:',
                    default: currentSettings.customerId
                }
            ]);

            // Save settings to config file
            const configPath = path.join(__dirname, 'cli-config.json');
            await fs.writeJson(configPath, newSettings, { spaces: 2 });
            
            console.log(chalk.green('✓ Settings saved to cli-config.json'));
            console.log(chalk.yellow('Note: Restart CLI to use new settings'));
        }
    }

    // Helper methods

    async getBusinessTypes() {
        try {
            const response = await axios.get(`${this.apiBase}/api/config/business-types`);
            return response.data.businessTypes;
        } catch (error) {
            console.error(chalk.red('Failed to load business types'));
            return {
                'business': {
                    name: 'General Business',
                    description: 'General business website'
                }
            };
        }
    }

    async getSites() {
        try {
            const response = await axios.get(`${this.apiBase}/api/customers/${this.customerId}/sites`);
            return response.data.success ? response.data.sites : [];
        } catch (error) {
            console.error(chalk.red('Failed to load sites'));
            return [];
        }
    }

    async getAvailablePort() {
        // Simple port assignment - in production this would check for available ports
        return 3000 + Math.floor(Math.random() * 100);
    }

    async showSiteDetails(siteId) {
        const spinner = ora('Loading site details...').start();

        try {
            const response = await axios.get(`${this.apiBase}/api/sites/${this.customerId}/${siteId}`);
            
            if (response.data.success) {
                spinner.succeed('Site details loaded');
                
                const site = response.data.site;
                
                console.log(chalk.blue('\n🌐 Site Details:'));
                console.log(`Name: ${site.name}`);
                console.log(`ID: ${site.id}`);
                console.log(`Status: ${chalk[site.status === 'deployed' ? 'green' : 'yellow'](site.status)}`);
                console.log(`Domain: ${site.domain || 'None'}`);
                console.log(`URL: ${site.url || 'Not deployed'}`);
                console.log(`Port: ${site.port || 'None'}`);
                console.log(`Created: ${new Date(site.created_at).toLocaleString()}`);
                console.log(`Updated: ${new Date(site.updated_at).toLocaleString()}`);
                
            } else {
                spinner.fail('Failed to load site details');
                console.error(chalk.red('Error:'), response.data.error);
            }

        } catch (error) {
            spinner.fail('Failed to load site details');
            console.error(chalk.red('Error:'), error.response?.data?.details || error.message);
        }
    }

    async updateSiteConfig(siteId) {
        console.log(chalk.yellow('Site configuration update coming soon!'));
        console.log(chalk.gray('This feature will allow you to modify site settings via CLI.'));
    }

    // Load CLI configuration
    async loadConfig() {
        try {
            const configPath = path.join(__dirname, 'cli-config.json');
            if (await fs.pathExists(configPath)) {
                const config = await fs.readJson(configPath);
                this.apiBase = config.apiBase || this.apiBase;
                this.customerId = config.customerId || this.customerId;
            }
        } catch (error) {
            // Ignore config loading errors
        }
    }
}

// Handle CLI arguments
async function main() {
    const cli = new WebsiteCLI();
    await cli.loadConfig();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🌐 Website Generator CLI v${cli.version}

Usage:
  npm run cli              Interactive mode
  node cli/website-cli.js  Direct execution

Environment Variables:
  PORTAL_API_URL    Portal API URL (default: http://localhost:3080)
  CUSTOMER_ID       Customer ID (default: default-customer)

Examples:
  npm run cli
  PORTAL_API_URL=http://162.55.213.90:3080 npm run cli
        `);
        return;
    }

    if (args.includes('--version') || args.includes('-v')) {
        console.log(cli.version);
        return;
    }

    await cli.run();
}

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        console.error(chalk.red('Fatal error:'), error.message);
        process.exit(1);
    });
}

module.exports = { WebsiteCLI };