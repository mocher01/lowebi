#!/usr/bin/env node

/**
 * 🛡️ Template Isolation System v1.1.1.9.2.4
 * 
 * Prevents cross-site content contamination by ensuring all template content
 * is properly scoped to site-specific configurations
 */

const fs = require('fs-extra');
const path = require('path');

class TemplateIsolationValidator {
    constructor() {
        this.hardcodedPatterns = [
            // Educational content patterns that should be configurable
            /apprentissage/gi,
            /cours d'essai/gi,
            /formation/gi,
            /ateliers/gi,
            
            // Site-specific references that shouldn't appear
            /qalyarab/gi,
            /kalyarab/gi,
            /translatepro/gi,
            
            // Hardcoded CTA patterns
            /Prêt à commencer votre/gi,
            /Contactez-nous dès aujourd'hui pour réserver/gi,
            /découvrir votre nouvelle passion/gi
        ];
        
        this.allowedConfigPaths = [
            'config.content',
            'config.brand',
            'config.sections',
            'window.SITE_CONFIG'
        ];
    }

    /**
     * Scan template files for hardcoded content
     */
    async scanTemplates(templateDir) {
        const issues = [];
        const templateFiles = await this.getTemplateFiles(templateDir);
        
        for (const filePath of templateFiles) {
            const content = await fs.readFile(filePath, 'utf8');
            const fileIssues = this.analyzeFile(filePath, content);
            issues.push(...fileIssues);
        }
        
        return issues;
    }
    
    /**
     * Get all template files to scan
     */
    async getTemplateFiles(templateDir) {
        const files = [];
        
        const scanDirectory = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
        };
        
        await scanDirectory(templateDir);
        return files;
    }
    
    /**
     * Analyze a single file for hardcoded content
     */
    analyzeFile(filePath, content) {
        const issues = [];
        const lines = content.split('\\n');
        
        lines.forEach((line, index) => {
            this.hardcodedPatterns.forEach(pattern => {
                const matches = line.match(pattern);
                if (matches) {
                    // Check if it's in a config reference (allowed)
                    const isConfigReference = this.allowedConfigPaths.some(configPath => 
                        line.includes(configPath)
                    );
                    
                    if (!isConfigReference) {
                        issues.push({
                            file: path.relative(process.cwd(), filePath),
                            line: index + 1,
                            content: line.trim(),
                            pattern: pattern.source,
                            severity: this.getSeverity(pattern),
                            suggestion: this.getSuggestion(pattern)
                        });
                    }
                }
            });
        });
        
        return issues;
    }
    
    /**
     * Get severity level for different patterns
     */
    getSeverity(pattern) {
        const source = pattern.source.toLowerCase();
        
        if (source.includes('qalyarab') || source.includes('translatepro')) {
            return 'critical';
        }
        if (source.includes('apprentissage') || source.includes('cours')) {
            return 'high';
        }
        return 'medium';
    }
    
    /**
     * Get suggestion for fixing the pattern
     */
    getSuggestion(pattern) {
        const source = pattern.source.toLowerCase();
        
        if (source.includes('apprentissage')) {
            return 'Use config.content.cta.title or similar configurable property';
        }
        if (source.includes('cours')) {
            return 'Use config.content.services.type or business-type detection';
        }
        if (source.includes('qalyarab') || source.includes('translatepro')) {
            return 'Remove site-specific reference - use config.brand.name';
        }
        
        return 'Make this content configurable through site config';
    }
    
    /**
     * Generate isolation report
     */ 
    generateReport(issues) {
        if (issues.length === 0) {
            return {
                status: 'clean',
                message: '✅ No template isolation issues found',
                issues: []
            };
        }
        
        const grouped = this.groupIssuesBySeverity(issues);
        
        return {
            status: 'contaminated',
            message: `⚠️ Found ${issues.length} template isolation issues`,
            summary: {
                critical: grouped.critical?.length || 0,
                high: grouped.high?.length || 0,
                medium: grouped.medium?.length || 0
            },
            issues: grouped
        };
    }
    
    /**
     * Group issues by severity
     */
    groupIssuesBySeverity(issues) {
        return issues.reduce((groups, issue) => {
            const severity = issue.severity;
            if (!groups[severity]) {
                groups[severity] = [];
            }
            groups[severity].push(issue);
            return groups;
        }, {});
    }
    
    /**
     * Auto-fix some common patterns
     */
    async autoFix(templateDir, dryRun = true) {
        const fixes = [];
        const templateFiles = await this.getTemplateFiles(templateDir);
        
        for (const filePath of templateFiles) {
            let content = await fs.readFile(filePath, 'utf8');
            let modified = false;
            
            // Replace hardcoded CTA with configurable version
            const ctaFix = content.replace(
                /Prêt à commencer votre apprentissage \?/g,
                '{config.content?.cta?.title || "Prêt à démarrer votre projet ?"}'
            );
            
            if (ctaFix !== content) {
                content = ctaFix;
                modified = true;
                fixes.push({
                    file: filePath,
                    type: 'cta_title',
                    description: 'Replaced hardcoded CTA title with configurable version'
                });
            }
            
            // Replace hardcoded descriptions
            const descFix = content.replace(
                /pour réserver votre cours d'essai gratuit et découvrir votre nouvelle passion/g,
                '{config.content?.cta?.description || "pour discuter de vos besoins et obtenir un devis personnalisé"}'
            );
            
            if (descFix !== content) {
                content = descFix;
                modified = true;
                fixes.push({
                    file: filePath,
                    type: 'cta_description', 
                    description: 'Replaced hardcoded CTA description with configurable version'
                });
            }
            
            if (modified && !dryRun) {
                await fs.writeFile(filePath, content, 'utf8');
            }
        }
        
        return fixes;
    }
}

// Export for use in other modules
module.exports = { TemplateIsolationValidator };

// CLI usage
if (require.main === module) {
    async function main() {
        const [,, command, templateDir = 'template-base'] = process.argv;
        
        const validator = new TemplateIsolationValidator();
        
        switch (command) {
            case 'scan':
                console.log('🔍 Scanning templates for isolation issues...');
                const issues = await validator.scanTemplates(templateDir);
                const report = validator.generateReport(issues);
                console.log(JSON.stringify(report, null, 2));
                break;
                
            case 'fix':
                console.log('🔧 Auto-fixing template isolation issues...');
                const fixes = await validator.autoFix(templateDir, false);
                console.log(`✅ Applied ${fixes.length} fixes`);
                fixes.forEach(fix => {
                    console.log(`  • ${fix.file}: ${fix.description}`);
                });
                break;
                
            case 'dry-run':
                console.log('🧪 Dry-run: Analyzing potential fixes...');
                const dryFixes = await validator.autoFix(templateDir, true);
                console.log(`📋 Would apply ${dryFixes.length} fixes:`);
                dryFixes.forEach(fix => {
                    console.log(`  • ${fix.file}: ${fix.description}`);
                });
                break;
                
            default:
                console.log('Usage: node template-isolation.js <scan|fix|dry-run> [template-dir]');
                process.exit(1);
        }
    }
    
    main().catch(console.error);
}