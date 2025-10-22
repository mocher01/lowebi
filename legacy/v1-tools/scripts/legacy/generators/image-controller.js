#!/usr/bin/env node
import { LogoProcessor } from './logo-processor.js';
import { AIImageGenerator } from './ai-image-generator.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * 🎛️ Image Controller - Orchestrateur principal
 * 
 * Point d'entrée unique pour toute la gestion des images
 * Coordonne les différents processeurs selon le mode
 */

class ImageController {
    constructor() {
        this.logoProcessor = null; // Will be initialized with siteId when needed
        this.aiGenerator = new AIImageGenerator();
        this.placeholderGenerator = null; // Lazy loaded when needed
    }

    /**
     * Extract siteId from config path
     */
    extractSiteId(siteConfigPath) {
        if (!siteConfigPath) return null;
        const match = siteConfigPath.match(/configs\/([^\/]+)\/site-config\.json/);
        return match ? match[1] : null;
    }

    /**
     * Génère/traite tous les assets d'un site
     */
    async generateAllAssets(siteConfigPath, outputDir) {
        try {
            // Initialize logo processor with site ID for intelligent processing
            const siteId = this.extractSiteId(siteConfigPath);
            this.logoProcessor = new LogoProcessor(siteId);
            
            // Récupérer le mode et les flags depuis les variables d'environnement
            // 🛡️ DÉFAUT SÉCURISÉ: process pour traiter les logos + copier images
            const mode = process.env.IMAGE_MODE || 'process';
            const forceRegenerate = process.env.FORCE_REGENERATE === 'true';
            const forceBlogImages = process.env.FORCE_BLOG_IMAGES === 'true';
            const forceHeroImages = process.env.FORCE_HERO_IMAGES === 'true';
            const forceServiceImages = process.env.FORCE_SERVICE_IMAGES === 'true';
            
            console.log('🎨 Starting unified image processing...');
            console.log(`📋 Mode: ${mode}`);
            console.log(`🔄 Force regenerate: ${forceRegenerate}`);
            
            if (forceBlogImages || forceHeroImages || forceServiceImages) {
                console.log('🎯 Selective force regeneration:');
                if (forceBlogImages) console.log('  • Blog images: ✅');
                if (forceHeroImages) console.log('  • Hero images: ✅');
                if (forceServiceImages) console.log('  • Service images: ✅');
            }
            
            // Charger la configuration
            const siteConfig = JSON.parse(await fs.readFile(siteConfigPath, 'utf8'));
            
            // 1. Traiter les logos/favicons selon le mode
            if (mode === 'copy') {
                console.log('\n📌 Step 1: Skipping logo processing (copy mode)...');
            } else {
                console.log('\n📌 Step 1: Processing logos and favicons...');
                await this.logoProcessor.processLogos(siteConfig, outputDir);
            }
            
            // 2. Traiter les autres images selon le mode
            if (mode === 'none') {
                console.log('\n⏭️  Skipping other image generation (mode: none)');
                return { success: true, mode: 'none' };
            }
            
            console.log('\n📌 Step 2: Processing other images...');
            
            // Créer les sous-dossiers nécessaires
            await fs.ensureDir(path.join(outputDir, 'blog/images'));
            
            // Préparer les données pour les générateurs
            let blogArticles = [];
            const blogIndexPath = path.join(path.dirname(outputDir), 'content', 'blog-index.json');
            if (await fs.pathExists(blogIndexPath)) {
                try {
                    const blogIndex = JSON.parse(await fs.readFile(blogIndexPath, 'utf8'));
                    blogArticles = blogIndex.articles || [];
                    console.log(`📰 Found ${blogArticles.length} blog articles`);
                } catch (error) {
                    console.warn('⚠️  Could not load blog index');
                }
            }
            
            let result;
            
            // Déterminer les options de régénération selon le mode
            const regenerateOptions = {
                all: forceRegenerate,
                blog: forceBlogImages,
                hero: forceHeroImages,
                services: forceServiceImages
            };
            
            // 🆕 Gestion des nouveaux modes unifiés
            if (mode === 'copy') {
                // Mode copy - copie simple des images sans traitement
                console.log('📋 Copying images without processing...');
                result = await this.copyImagesOnly(siteConfig, outputDir, siteConfigPath);
                
            } else if (mode === 'process') {
                // Mode process - traitement logos déjà fait + copie des autres images
                console.log('📋 Copying remaining images (logos already processed)...');
                result = await this.copyImagesOnly(siteConfig, outputDir, siteConfigPath);
                
            } else if (mode === 'placeholder') {
                // Mode placeholder/debug - génère des images avec le nom du fichier
                console.log('📋 Generating placeholder images...');
                
                // Lazy load placeholder generator
                if (!this.placeholderGenerator) {
                    try {
                        const { PlaceholderGenerator } = await import('./placeholder-generator.js');
                        this.placeholderGenerator = new PlaceholderGenerator();
                    } catch (error) {
                        console.error('❌ Could not load placeholder generator (canvas dependency missing):', error.message);
                        console.log('⚠️  Falling back to copy mode');
                        result = await this.copyImagesOnly(siteConfig, outputDir, siteConfigPath);
                        return;
                    }
                }
                
                result = await this.placeholderGenerator.generateAllPlaceholders(siteConfig, outputDir);
                
            } else if (mode.startsWith('ai')) {
                // Tous les modes AI
                console.log('🤖 AI Image generation mode...');
                
                // Configurer la clé API si disponible
                const apiKey = siteConfig.api?.openai || process.env.OPENAI_API_KEY;
                if (apiKey) {
                    this.aiGenerator.setApiKey(apiKey);
                }
                
                // Déterminer les options selon le sous-mode AI
                if (mode === 'ai:force') {
                    regenerateOptions.all = true;
                    console.log('🔄 Force regenerating ALL AI images');
                } else if (mode === 'ai:blog') {
                    regenerateOptions.blog = true;
                    console.log('🔄 Force regenerating BLOG AI images only');
                } else if (mode === 'ai:hero') {
                    regenerateOptions.hero = true;
                    console.log('🔄 Force regenerating HERO AI image only');
                } else if (mode === 'ai:services') {
                    regenerateOptions.services = true;
                    console.log('🔄 Force regenerating SERVICE AI images only');
                } else {
                    console.log('🤖 Generating missing images with AI...');
                }
                
                result = await this.aiGenerator.generateAllAssets(
                    siteConfig, 
                    outputDir, 
                    blogArticles, 
                    regenerateOptions
                );
                
            } else {
                console.warn(`⚠️  Unknown mode: ${mode}, falling back to copy mode`);
                result = await this.copyImagesOnly(siteConfig, outputDir, siteConfigPath);
            }
            
            console.log('\n🎉 Image processing completed!');
            return {
                success: true,
                mode: mode,
                result: result
            };
            
        } catch (error) {
            console.error('❌ Image processing failed:', error.message);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    /**
     * Copie les images sans traitement (pour modes copy et process)
     */
    async copyImagesOnly(siteConfig, outputDir, siteConfigPath = null) {
        try {
            console.log('📁 Copying existing images to output directory...');
            
            // Use the provided config path or fall back to process.argv or default
            const configPath = siteConfigPath || process.argv[2] || 'configs/default/site-config.json';
            const configDir = path.dirname(configPath);
            const assetsDir = path.join(configDir, 'assets');
            
            if (!(await fs.pathExists(assetsDir))) {
                console.log('⚠️  No assets directory found, creating placeholder structure');
                await fs.ensureDir(outputDir);
                return { copied: 0, message: 'No assets to copy' };
            }
            
            let copiedCount = 0;
            
            // Copier tous les fichiers d'assets SAUF les logos/favicons déjà traités
            const copyRecursive = async (srcDir, destDir) => {
                const entries = await fs.readdir(srcDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const srcPath = path.join(srcDir, entry.name);
                    const destPath = path.join(destDir, entry.name);
                    
                    if (entry.isDirectory()) {
                        await fs.ensureDir(destPath);
                        await copyRecursive(srcPath, destPath);
                    } else if (entry.isFile()) {
                        // Skip logos and favicons as they were already processed
                        if (entry.name.includes('logo') || entry.name.includes('favicon')) {
                            console.log(`  ⏭️  Skipped (already processed): ${entry.name}`);
                            continue;
                        }
                        
                        await fs.copy(srcPath, destPath);
                        copiedCount++;
                        console.log(`  ✅ Copied: ${entry.name}`);
                    }
                }
            };
            
            await copyRecursive(assetsDir, outputDir);
            
            console.log(`✅ Copied ${copiedCount} asset files`);
            return { 
                copied: copiedCount, 
                message: `Copied ${copiedCount} files` 
            };
            
        } catch (error) {
            console.error('❌ Error copying images:', error.message);
            return { 
                copied: 0, 
                error: error.message,
                message: 'Failed to copy images'
            };
        }
    }
}

// Export pour utilisation dans d'autres modules
export { ImageController };

// Si exécuté directement - check if this file is the main module
if (process.argv[1] && process.argv[1].endsWith('image-controller.js')) {
    async function main() {
        const [,, configPath, outputDir] = process.argv;
        
        if (!configPath || !outputDir) {
            console.error('Usage: node image-controller.js <configPath> <outputDir>');
            console.error('');
            console.error('Environment variables:');
            console.error('  IMAGE_MODE=ai|placeholder|none (default: ai)');
            console.error('  FORCE_REGENERATE=true|false (default: false)');
            process.exit(1);
        }
        
        const controller = new ImageController();
        const result = await controller.generateAllAssets(configPath, outputDir);
        
        if (!result.success) {
            console.error('Failed:', result.error);
            process.exit(1);
        }
    }
    
    main().catch(console.error);
}