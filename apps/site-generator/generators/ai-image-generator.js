#!/usr/bin/env node
import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

/**
 * 🤖 AI Image Generator - OpenAI DALL-E
 * Génère des images thématiques adaptées au contenu du site
 */

class AIImageGenerator {
    constructor(apiKey = null) {
        this.openai = null;
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        
        if (this.apiKey) {
            this.openai = new OpenAI({
                apiKey: this.apiKey
            });
        }
        
        // Templates de prompts adaptatifs
        this.promptTemplates = {
            logo: {
                base: "Create a professional horizontal logo for '{siteName}' website. Include both an icon AND the text '{siteName}' clearly visible. Theme: {siteTheme}. Style: {logoStyle}. Colors: {primaryColor} and {secondaryColor}. The icon should be: {iconDescription}. Layout: icon on the left, text '{siteName}' on the right. Wide horizontal format (3:1 ratio). Clean, modern, professional design.",
                themes: {
                    "calligraphie japonaise": {
                        iconDescription: "a stylized Japanese brush (fude) or ink stone, elegant and minimalist",
                        logoStyle: "Japanese-inspired, zen, elegant"
                    },
                    "traduction": {
                        iconDescription: "abstract language symbols, speech bubbles, or translation arrows",
                        logoStyle: "modern, international, professional"
                    },
                    "default": {
                        iconDescription: "geometric shapes or abstract symbol representing the brand",
                        logoStyle: "clean, professional, modern"
                    }
                }
            },
            hero: {
                base: "Create a hero background image for {siteName}, a {siteTheme} website. Style: {heroStyle}. Mood: professional, welcoming. Colors palette: {primaryColor}, {secondaryColor}. Content: {heroDescription}. High quality, web-optimized, no text overlay.",
                themes: {
                    "calligraphie japonaise": {
                        heroDescription: "Traditional Japanese calligraphy workspace with brush, ink stone, rice paper, serene and minimalist atmosphere",
                        heroStyle: "Traditional Japanese aesthetic, zen, natural lighting"
                    },
                    "traduction": {
                        heroDescription: "Modern office setup with multiple language books, global communication concept",
                        heroStyle: "Professional, international, modern workspace"
                    },
                    "default": {
                        heroDescription: "Clean, professional workspace or abstract geometric background",
                        heroStyle: "Modern, professional, clean"
                    }
                }
            },
            service: {
                base: "Create an image representing '{serviceName}' for a {siteTheme} website. Description: {serviceDescription}. Style: {serviceStyle}. Colors: {primaryColor}, {secondaryColor}. Professional, high-quality, web-optimized.",
                themes: {
                    "calligraphie japonaise": {
                        serviceStyle: "Traditional Japanese aesthetic, zen, natural materials"
                    },
                    "traduction": {
                        serviceStyle: "Professional, international, modern"
                    },
                    "default": {
                        serviceStyle: "Clean, professional, modern"
                    }
                }
            },
            blog: {
                base: "Create an illustration for a blog article titled '{articleTitle}' about {articleSummary}. For a {siteTheme} website. Style: {blogStyle}. Informative, engaging, professional. Colors: {primaryColor}, {secondaryColor}.",
                themes: {
                    "calligraphie japonaise": {
                        blogStyle: "Traditional Japanese art style, educational, cultural"
                    },
                    "traduction": {
                        blogStyle: "Professional, educational, international"
                    },
                    "default": {
                        blogStyle: "Modern, educational, professional"
                    }
                }
            }
        };
    }

    /**
     * Configure la clé API OpenAI
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.openai = new OpenAI({
            apiKey: this.apiKey
        });
    }

    /**
     * Vérifie si une image existe dans le config et la copie vers outputDir
     * IMPORTANT: Images générées ne sont JAMAIS écrasées (forceRegenerate ignoré)
     */
    async checkAndCopyFromConfig(siteConfig, filename, outputDir, forceRegenerate = false) {
        // 🛡️ PROTECTION: Images générées ne sont JAMAIS écrasées
        // forceRegenerate est ignoré pour éviter coûts IA inutiles
        
        const siteId = siteConfig.meta?.siteId;
        const configDir = `configs/${siteId}/assets`;
        const configImagePath = path.join(configDir, filename);
        const outputPath = path.join(outputDir, filename);

        if (await fs.pathExists(configImagePath)) {
            console.log(`✅ Using existing image from config: ${filename}`);
            await fs.copy(configImagePath, outputPath);
            return true;
        }
        
        console.log(`🔍 Image not found in config: ${filename} - AI generation will be needed`);
        return false;
    }

    /**
     * Sauvegarde une image générée dans le config pour réutilisation future
     */
    async saveToConfig(siteConfig, filename, outputDir) {
        const siteId = siteConfig.meta?.siteId;
        const configDir = `configs/${siteId}/assets`;
        const outputPath = path.join(outputDir, filename);
        const configPath = path.join(configDir, filename);

        try {
            await fs.ensureDir(configDir);
            await fs.copy(outputPath, configPath);
            console.log(`💾 Saved generated image to config: ${filename}`);
        } catch (error) {
            console.warn(`⚠️  Could not save image to config: ${error.message}`);
        }
    }

    /**
     * Détecte le thème principal du site
     */
    detectSiteTheme(siteConfig) {
        const name = siteConfig.brand?.name?.toLowerCase() || '';
        const description = siteConfig.seo?.description?.toLowerCase() || '';
        const content = JSON.stringify(siteConfig.content || {}).toLowerCase();
        
        const themeKeywords = {
            "calligraphie japonaise": ["calligraphie", "japonais", "shodo", "pinceau", "encre", "kanji", "kaisho"],
            "traduction": ["traduction", "translate", "langue", "language", "interpreter"],
            "technologie": ["tech", "software", "développement", "app", "digital"],
            "santé": ["santé", "health", "médical", "wellness", "thérapie"],
            "éducation": ["éducation", "formation", "cours", "école", "apprentissage"]
        };

        for (const [theme, keywords] of Object.entries(themeKeywords)) {
            if (keywords.some(keyword => 
                name.includes(keyword) || 
                description.includes(keyword) || 
                content.includes(keyword)
            )) {
                return theme;
            }
        }
        
        return "default";
    }

    /**
     * Génère un prompt adaptatif
     */
    generatePrompt(type, siteConfig, options = {}) {
        const theme = this.detectSiteTheme(siteConfig);
        const template = this.promptTemplates[type];
        
        if (!template) {
            throw new Error(`Template not found for type: ${type}`);
        }

        const themeConfig = template.themes[theme] || template.themes.default;
        const siteName = siteConfig.brand?.name || 'Website';
        const primaryColor = siteConfig.brand?.colors?.primary || '#4F46E5';
        const secondaryColor = siteConfig.brand?.colors?.secondary || '#7C3AED';

        let prompt = template.base
            .replace('{siteName}', siteName)
            .replace('{siteTheme}', theme)
            .replace('{primaryColor}', primaryColor)
            .replace('{secondaryColor}', secondaryColor);

        // Ajouter les variables spécifiques au thème
        for (const [key, value] of Object.entries(themeConfig)) {
            prompt = prompt.replace(`{${key}}`, value);
        }

        // Ajouter les options spécifiques
        for (const [key, value] of Object.entries(options)) {
            prompt = prompt.replace(`{${key}}`, value);
        }

        return prompt;
    }

    /**
     * Demande confirmation avant génération IA coûteuse
     */
    async confirmAIGeneration(filename, type = 'image', estimatedCost = '$0.50') {
        // Skip confirmation si variable d'environnement
        if (process.env.AI_AUTO_CONFIRM === 'true') {
            return true;
        }
        
        console.log(`\n💰 IA Generation Required`);
        console.log(`📄 File: ${filename}`);
        console.log(`🎨 Type: ${type}`); 
        console.log(`💸 Estimated cost: ${estimatedCost}`);
        console.log(`⚠️  This will use OpenAI DALL-E API`);
        
        // Import readline dynamically
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question('Continue with AI generation? (y/N): ', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y');
            });
        });
    }

    /**
     * Génère une image avec DALL-E
     */
    async generateImage(prompt, filename, outputDir, size = "1024x1024", forceRegenerate = false) {
        if (!this.openai) {
            throw new Error("OpenAI API key not configured");
        }

        // CONTRÔLE : Vérifier si l'image existe déjà
        const outputPath = path.join(outputDir, filename);
        if (!forceRegenerate && await fs.pathExists(outputPath)) {
            console.log(`⏭️  Image already exists, skipping: ${filename}`);
            console.log(`   To regenerate, use --force-regenerate flag`);
            return outputPath;
        }

        console.log(`🤖 Generating AI image: ${filename}`);
        console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

        // 💰 CONFIRMATION OBLIGATOIRE AVANT GÉNÉRATION IA
        const confirmed = await this.confirmAIGeneration(filename, 'DALL-E image', '$0.50');
        if (!confirmed) {
            console.log(`❌ AI generation cancelled by user`);
            throw new Error('AI generation cancelled by user');
        }

        try {
            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: size,
                quality: "standard",
                response_format: "url"
            });

            const imageUrl = response.data[0].url;
            
            // Télécharger l'image
            const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
            });

            const outputPath = path.join(outputDir, filename);
            await fs.ensureDir(path.dirname(outputPath));
            await fs.writeFile(outputPath, imageResponse.data);

            console.log(`✅ AI image generated: ${filename}`);
            return outputPath;

        } catch (error) {
            console.error(`❌ Failed to generate ${filename}:`, error.message);
            throw error;
        }
    }


    /**
     * Génère l'image hero
     */
    async generateHeroImage(siteConfig, outputDir, forceRegenerate = false) {
        const siteId = siteConfig.meta?.siteId || 'website';
        const filename = `${siteId}-hero.png`;
        
        // 1. Vérifier d'abord si l'image existe dans le config
        if (await this.checkAndCopyFromConfig(siteConfig, filename, outputDir, forceRegenerate)) {
            return filename;
        }
        
        // 2. Si pas trouvée, générer avec AI
        const heroPrompt = this.generatePrompt('hero', siteConfig);
        await this.generateImage(
            heroPrompt,
            filename,
            outputDir,
            "1792x1024",
            forceRegenerate
        );
        
        // 3. Sauvegarder la nouvelle image dans le config
        await this.saveToConfig(siteConfig, filename, outputDir);

        return filename;
    }

    /**
     * Génère les images des services
     */
    async generateServiceImages(siteConfig, outputDir, forceRegenerate = false) {
        const siteId = siteConfig.meta?.siteId || 'website';
        const services = siteConfig.content?.services || [];
        const generatedImages = [];

        for (let i = 0; i < services.length && i < 4; i++) {
            const service = services[i];
            const filename = `${siteId}-${i + 1}.${i === 0 ? 'jpg' : 'png'}`;
            
            // 1. Vérifier d'abord si l'image existe dans le config
            if (await this.checkAndCopyFromConfig(siteConfig, filename, outputDir, forceRegenerate)) {
                generatedImages.push(filename);
                continue;
            }
            
            // 2. Si pas trouvée, générer avec AI
            const servicePrompt = this.generatePrompt('service', siteConfig, {
                serviceName: service.title || `Service ${i + 1}`,
                serviceDescription: service.description || service.subtitle || 'Professional service'
            });

            await this.generateImage(
                servicePrompt,
                filename,
                outputDir,
                "1024x1024",
                forceRegenerate
            );
            
            // 3. Sauvegarder la nouvelle image dans le config
            await this.saveToConfig(siteConfig, filename, outputDir);

            generatedImages.push(filename);
        }

        return generatedImages;
    }

    /**
     * Génère les images des articles de blog
     */
    async generateBlogImages(siteConfig, outputDir, blogArticles = [], forceRegenerate = false) {
        const generatedImages = [];

        for (const article of blogArticles) {
            const filename = `${article.slug || article.title?.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
            
            // 1. Vérifier d'abord si l'image existe dans le config/blog/images
            const configBlogPath = path.join(`configs/${siteConfig.meta?.siteId}/assets/blog/images`, filename);
            const outputPath = path.join(outputDir, filename);
            
            if (!forceRegenerate && await fs.pathExists(configBlogPath)) {
                console.log(`✅ Using existing blog image from config: ${filename}`);
                await fs.ensureDir(outputDir);
                await fs.copy(configBlogPath, outputPath);
                generatedImages.push(filename);
                continue;
            }
            
            // 2. Si pas trouvée, générer avec AI
            const blogPrompt = this.generatePrompt('blog', siteConfig, {
                articleTitle: article.title || 'Blog Article',
                articleSummary: article.summary || article.description || 'Educational content'
            });

            await fs.ensureDir(outputDir);
            await this.generateImage(
                blogPrompt,
                filename,
                outputDir,
                "1024x1024",
                forceRegenerate
            );
            
            // 3. Sauvegarder la nouvelle image dans le config/blog/images
            const configBlogDir = path.dirname(configBlogPath);
            try {
                await fs.ensureDir(configBlogDir);
                await fs.copy(outputPath, configBlogPath);
                console.log(`💾 Saved blog image to config: ${filename}`);
            } catch (error) {
                console.warn(`⚠️  Could not save blog image to config: ${error.message}`);
            }

            generatedImages.push(filename);
        }

        return generatedImages;
    }


    /**
     * Génère les images AI seulement (hero, services, blog)
     * Note: Les logos/favicons sont maintenant traités par LogoProcessor
     */
    async generateAllAssets(siteConfig, outputDir, blogArticles = [], forceOptions = false) {
        console.log('🤖 Starting AI image generation...');
        console.log('ℹ️  Note: Logos/favicons are processed separately by LogoProcessor');

        // Handle both boolean (legacy) and object (selective regeneration) formats
        let forceRegenerate, forceBlog, forceHero, forceServices;
        
        if (typeof forceOptions === 'boolean') {
            // Legacy mode - boolean applies to all
            forceRegenerate = forceBlog = forceHero = forceServices = forceOptions;
            if (forceOptions) {
                console.log('🔄 Force regenerating ALL images (legacy boolean mode)');
            }
        } else if (typeof forceOptions === 'object' && forceOptions !== null) {
            // New selective mode
            forceRegenerate = forceOptions.all || false;
            forceBlog = forceOptions.blog || forceRegenerate;
            forceHero = forceOptions.hero || forceRegenerate;
            forceServices = forceOptions.services || forceRegenerate;
            
            if (forceBlog || forceHero || forceServices) {
                console.log('🎯 Selective force regeneration:');
                if (forceHero) console.log('  • Hero images: ✅');
                if (forceServices) console.log('  • Service images: ✅');
                if (forceBlog) console.log('  • Blog images: ✅');
            }
        } else {
            // Default - no regeneration
            forceRegenerate = forceBlog = forceHero = forceServices = false;
        }

        const results = {
            hero: await this.generateHeroImage(siteConfig, outputDir, forceHero),
            services: await this.generateServiceImages(siteConfig, outputDir, forceServices),
            blog: await this.generateBlogImages(siteConfig, path.join(outputDir, 'blog/images'), blogArticles, forceBlog)
        };

        console.log('✅ AI image generation completed!');
        return results;
    }
}

/**
 * Usage CLI
 */
async function main() {
    const [,, command, configPath, outputDir, apiKey] = process.argv;
    
    if (!command || !configPath || !outputDir) {
        console.error('Usage: node ai-image-generator.js <command> <configPath> <outputDir> [apiKey]');
        console.error('Commands:');
        console.error('  generate-all     Generate all AI images (hero, services, blog)');
        console.error('  generate-hero    Generate hero image only');
        console.error('Note: Logos/favicons are processed by LogoProcessor via image-controller.js');
        process.exit(1);
    }

    // Charger la configuration pour récupérer la clé API
    const siteConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const openaiApiKey = apiKey || siteConfig.api?.openai || process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
        console.error('❌ OpenAI API key not found. Please add it to site config under "api.openai"');
        process.exit(1);
    }
    
    const generator = new AIImageGenerator(openaiApiKey);
    
    try {
        
        let result;
        if (command === 'generate-all') {
            // Charger les articles de blog s'ils existent
            let blogArticles = [];
            const blogIndexPath = path.join(path.dirname(outputDir), 'content', 'blog-index.json');
            if (await fs.pathExists(blogIndexPath)) {
                try {
                    const blogIndex = JSON.parse(await fs.readFile(blogIndexPath, 'utf8'));
                    blogArticles = blogIndex.articles || [];
                    console.log(`📰 Found ${blogArticles.length} blog articles for AI generation`);
                } catch (error) {
                    console.warn('⚠️  Could not load blog index for AI generation');
                }
            }
            
            result = await generator.generateAllAssets(siteConfig, outputDir, blogArticles);
        } else if (command === 'generate-hero') {
            result = await generator.generateHeroImage(siteConfig, outputDir);
        } else {
            console.error(`❌ Unknown command: ${command}`);
            process.exit(1);
        }

        console.log('🎉 AI image generation completed successfully!');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ AI image generation failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { AIImageGenerator };