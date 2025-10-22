#!/usr/bin/env node

/**
 * 🔥 Hot-Patch System v1.1.1.9.2.4
 * 
 * Live update system for deployed sites without full rebuild
 * Allows config changes, content updates, and style modifications
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class HotPatchSystem {
    constructor() {
        this.patchTypes = {
            'config': {
                name: 'Configuration Update',
                description: 'Update site configuration (colors, content, settings)',
                handler: this.patchConfig.bind(this)
            },
            'content': {
                name: 'Content Update',
                description: 'Update text content, blog posts, services',
                handler: this.patchContent.bind(this)
            },
            'assets': {
                name: 'Asset Update',
                description: 'Update images, logos, files',
                handler: this.patchAssets.bind(this)
            },
            'style': {
                name: 'Style Update',
                description: 'Update colors, fonts, CSS variables',
                handler: this.patchStyles.bind(this)
            },
            'template': {
                name: 'Template Hot-Fix',
                description: 'Apply template fixes without full rebuild',
                handler: this.patchTemplate.bind(this)
            }
        };
        
        this.serverHost = '162.55.213.90';
    }

    /**
     * Apply a hot patch to a live site
     */
    async applyPatch(siteId, patchType, options = {}) {
        const patchConfig = this.patchTypes[patchType];
        if (!patchConfig) {
            throw new Error(`Unknown patch type: ${patchType}`);
        }

        console.log(`🔥 Applying ${patchConfig.name} to ${siteId}...`);
        
        try {
            // 1. Validate site exists
            await this.validateSite(siteId);
            
            // 2. Create backup
            const backupId = await this.createBackup(siteId);
            console.log(`📦 Backup created: ${backupId}`);
            
            // 3. Apply the specific patch
            const result = await patchConfig.handler(siteId, options);
            
            // 4. Update live container if successful
            if (result.success) {
                await this.updateLiveContainer(siteId, patchType);
                console.log(`✅ ${patchConfig.name} applied successfully`);
                
                return {
                    success: true,
                    patchType,
                    backupId,
                    changes: result.changes
                };
            } else {
                // Rollback on failure
                await this.rollback(siteId, backupId);
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error(`❌ Patch failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate that site exists and is deployable
     */
    async validateSite(siteId) {
        const configPath = path.join('configs', siteId, 'site-config.json');
        const generatedPath = path.join('generated-sites', siteId);
        
        if (!(await fs.pathExists(configPath))) {
            throw new Error(`Site config not found: ${configPath}`);
        }
        
        if (!(await fs.pathExists(generatedPath))) {
            throw new Error(`Generated site not found: ${generatedPath}. Run full generation first.`);
        }
    }

    /**
     * Create backup before applying patch
     */
    async createBackup(siteId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `${siteId}-backup-${timestamp}`;
        const backupDir = path.join('backups', backupId);
        
        await fs.ensureDir('backups');
        await fs.copy(path.join('generated-sites', siteId), path.join(backupDir, 'generated'));
        await fs.copy(path.join('configs', siteId), path.join(backupDir, 'config'));
        
        return backupId;
    }

    /**
     * Patch site configuration
     */
    async patchConfig(siteId, options) {
        try {
            const configPath = path.join('configs', siteId, 'site-config.json');
            const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
            
            const changes = [];
            
            // Apply configuration changes
            if (options.colors) {
                config.brand.colors = { ...config.brand.colors, ...options.colors };
                changes.push(`Updated brand colors: ${Object.keys(options.colors).join(', ')}`);
            }
            
            if (options.content) {
                config.content = { ...config.content, ...options.content };
                changes.push('Updated content configuration');
            }
            
            if (options.integrations) {
                config.integrations = { ...config.integrations, ...options.integrations };
                changes.push('Updated integrations');
            }
            
            // Save updated config
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            // Regenerate config injection files
            await this.regenerateConfigFiles(siteId, config);
            
            return { success: true, changes };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Patch content updates
     */
    async patchContent(siteId, options) {
        try {
            const changes = [];
            
            // Update blog content
            if (options.blog) {
                for (const [slug, content] of Object.entries(options.blog)) {
                    const blogPath = path.join('configs', siteId, 'content', 'blog', `${slug}.md`);
                    await fs.writeFile(blogPath, content);
                    changes.push(`Updated blog post: ${slug}`);
                }
                
                // Regenerate blog index
                await this.regenerateBlogIndex(siteId);
                changes.push('Regenerated blog index');
            }
            
            // Update service descriptions
            if (options.services) {
                const configPath = path.join('configs', siteId, 'site-config.json');
                const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
                
                config.content.services = config.content.services.map(service => {
                    if (options.services[service.slug]) {
                        return { ...service, ...options.services[service.slug] };
                    }
                    return service;
                });
                
                await fs.writeFile(configPath, JSON.stringify(config, null, 2));
                changes.push('Updated service descriptions');
            }
            
            return { success: true, changes };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Patch asset updates
     */
    async patchAssets(siteId, options) {
        try {
            const changes = [];
            const assetsSource = path.join('configs', siteId, 'assets');
            const assetsTarget = path.join('generated-sites', siteId, 'public', 'assets');
            
            // Copy new assets
            if (options.files) {
                for (const [filename, sourcePath] of Object.entries(options.files)) {
                    await fs.copy(sourcePath, path.join(assetsSource, filename));
                    await fs.copy(sourcePath, path.join(assetsTarget, filename));
                    changes.push(`Updated asset: ${filename}`);
                }
            }
            
            // Process logos if updated
            if (options.processLogos) {
                const { LogoProcessor } = require('./logo-processor');
                const processor = new LogoProcessor();
                const config = JSON.parse(await fs.readFile(path.join('configs', siteId, 'site-config.json'), 'utf8'));
                
                await processor.processLogos(config, assetsTarget);
                changes.push('Reprocessed logos');
            }
            
            return { success: true, changes };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Patch CSS/style updates
     */
    async patchStyles(siteId, options) {
        try {
            const changes = [];
            const cssVarPath = path.join('generated-sites', siteId, 'src', 'styles', 'site-variables.css');
            
            if (options.cssVariables) {
                let css = await fs.readFile(cssVarPath, 'utf8');
                
                for (const [variable, value] of Object.entries(options.cssVariables)) {
                    const regex = new RegExp(`--${variable}:\\s*[^;]+;`, 'g');
                    css = css.replace(regex, `--${variable}: ${value};`);
                    changes.push(`Updated CSS variable: --${variable}`);
                }
                
                await fs.writeFile(cssVarPath, css);
            }
            
            return { success: true, changes };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Patch template hot-fixes
     */
    async patchTemplate(siteId, options) {
        try {
            const changes = [];
            const siteDir = path.join('generated-sites', siteId);
            
            if (options.fixes) {
                for (const fix of options.fixes) {
                    const filePath = path.join(siteDir, fix.file);
                    let content = await fs.readFile(filePath, 'utf8');
                    
                    if (fix.type === 'replace') {
                        content = content.replace(new RegExp(fix.search, 'g'), fix.replace);
                        await fs.writeFile(filePath, content);
                        changes.push(`Applied fix to: ${fix.file}`);
                    }
                }
            }
            
            return { success: true, changes };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update live Docker container with changes
     */
    async updateLiveContainer(siteId, patchType) {
        try {
            console.log(`🔄 Updating live container for ${siteId}...`);
            
            // Copy updated files to server
            execSync(`rsync -avz generated-sites/${siteId}/ root@${this.serverHost}:/var/apps/website-generator/generated-sites/${siteId}/`, {
                stdio: 'inherit'
            });
            
            // Restart container to pick up changes
            execSync(`ssh root@${this.serverHost} "docker restart ${siteId}-current"`, {
                stdio: 'inherit'
            });
            
            console.log(`✅ Live container updated`);
            
        } catch (error) {
            console.error(`❌ Failed to update live container: ${error.message}`);
            throw error;
        }
    }

    /**
     * Rollback to backup
     */
    async rollback(siteId, backupId) {
        console.log(`🔄 Rolling back to backup: ${backupId}...`);
        
        const backupDir = path.join('backups', backupId);
        await fs.copy(path.join(backupDir, 'generated'), path.join('generated-sites', siteId));
        await fs.copy(path.join(backupDir, 'config'), path.join('configs', siteId));
        
        // Update live container with rollback
        await this.updateLiveContainer(siteId, 'rollback');
        
        console.log(`✅ Rollback completed`);
    }

    /**
     * Regenerate configuration files after config changes
     */
    async regenerateConfigFiles(siteId, config) {
        // Regenerate CSS variables
        const cssContent = this.generateCSSVariables(config);
        await fs.writeFile(
            path.join('generated-sites', siteId, 'src', 'styles', 'site-variables.css'),
            cssContent
        );
        
        // Update public config.json
        await fs.writeFile(
            path.join('generated-sites', siteId, 'public', 'config.json'),
            JSON.stringify(config, null, 2)
        );
        
        // Update index.html with new config
        const indexPath = path.join('generated-sites', siteId, 'index.html');
        let html = await fs.readFile(indexPath, 'utf8');
        html = html.replace(
            /window\\.SITE_CONFIG\\s*=\\s*{[^}]+};?/,
            `window.SITE_CONFIG = ${JSON.stringify(config)};`
        );
        await fs.writeFile(indexPath, html);
    }

    /**
     * Generate CSS variables from config
     */
    generateCSSVariables(config) {
        const colors = config.brand?.colors || {};
        return `:root {
  --color-primary: ${colors.primary || '#3B82F6'};
  --color-secondary: ${colors.secondary || '#60A5FA'};
  --color-accent: ${colors.accent || '#93C5FD'};
  /* Add more variables as needed */
}`;
    }

    /**
     * Regenerate blog index after content changes
     */
    async regenerateBlogIndex(siteId) {
        const { execSync } = require('child_process');
        execSync(`node scripts/core/generate-blog-index.js configs/${siteId} generated-sites/${siteId}/public/content/`, {
            stdio: 'inherit'
        });
    }

    /**
     * List available patches for a site
     */
    async listPatches() {
        console.log('🔥 Available Hot-Patch Types:\\n');
        
        Object.entries(this.patchTypes).forEach(([key, config]) => {
            console.log(`${key.padEnd(10)} - ${config.name}`);
            console.log(`${''.padEnd(13)}${config.description}\\n`);
        });
    }
}

// CLI usage
if (require.main === module) {
    async function main() {
        const [,, command, siteId, patchType, ...args] = process.argv;
        const hotPatch = new HotPatchSystem();
        
        switch (command) {
            case 'list':
                await hotPatch.listPatches();
                break;
                
            case 'apply':
                if (!siteId || !patchType) {
                    console.log('Usage: node hot-patch.js apply <siteId> <patchType> [options]');
                    process.exit(1);
                }
                
                // Parse options from remaining args
                const options = {};
                for (let i = 0; i < args.length; i += 2) {
                    if (args[i] && args[i + 1]) {
                        options[args[i].replace(/^--/, '')] = args[i + 1];
                    }
                }
                
                await hotPatch.applyPatch(siteId, patchType, options);
                break;
                
            default:
                console.log('Usage:');
                console.log('  node hot-patch.js list                    - List available patch types');
                console.log('  node hot-patch.js apply <site> <type>     - Apply a hot patch');
                console.log('');
                console.log('Examples:');
                console.log('  node hot-patch.js apply translatepro config --colors \'{"primary":"#059669"}\'');
                console.log('  node hot-patch.js apply translatepro content --blog \'{"post-slug":"new content"}\'');
                process.exit(1);
        }
    }
    
    main().catch(console.error);
}

module.exports = { HotPatchSystem };