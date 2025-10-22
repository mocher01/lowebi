#!/usr/bin/env node
import { createApi } from 'unsplash-js';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

/**
 * 🖼️ Image Fetcher - Unsplash API
 * Récupère automatiquement des images professionnelles selon le métier
 */

class ImageFetcher {
    constructor() {
        // Clé API Unsplash gratuite (5000 requêtes/heure)
        this.unsplash = createApi({
            accessKey: process.env.UNSPLASH_ACCESS_KEY || 'demo-key'
        });

        // Mapping métiers → mots-clés de recherche
        this.businessKeywords = {
            // Services existants
            'locod-ai': ['automation', 'technology', 'business process', 'office'],
            'qalyarab': ['calligraphy', 'arabic art', 'traditional art', 'writing'],  
            'qalyjap': ['japanese calligraphy', 'shodo', 'zen art', 'brush'],
            'helpeople': ['home care', 'elderly care', 'assistance', 'helping'],
            'translatepro': ['translation', 'languages', 'international business', 'communication'],
            
            // Métiers courants
            'consulting': ['business meeting', 'office', 'consulting', 'strategy'],
            'restaurant': ['restaurant', 'food', 'chef', 'dining'],
            'fitness': ['gym', 'fitness', 'sport', 'health'],
            'travel': ['travel', 'vacation', 'tourism', 'destination'],
            'education': ['education', 'learning', 'books', 'teaching'],
            'medical': ['medical', 'healthcare', 'doctor', 'clinic'],
            'law': ['law', 'lawyer', 'justice', 'legal'],
            'real-estate': ['real estate', 'house', 'property', 'home'],
            'finance': ['finance', 'money', 'investment', 'banking'],
            'photography': ['photography', 'camera', 'portrait', 'studio']
        };
    }

    /**
     * Fetch automatique des images pour un site
     */
    async fetchImagesForSite(siteConfig, outputDir) {
        console.log(`🖼️ Fetching images for ${siteConfig.meta.siteId}...`);
        
        const siteId = siteConfig.meta.siteId;
        const keywords = this.getKeywordsForSite(siteId, siteConfig);
        
        try {
            // Hero image
            const heroImage = await this.fetchHeroImage(keywords.hero, outputDir, siteId);
            
            // Service images  
            const serviceImages = await this.fetchServiceImages(keywords.services, outputDir, siteId);
            
            // Blog images si nécessaire
            const blogImages = await this.fetchBlogImages(keywords.blog, outputDir, siteId);

            return {
                hero: heroImage,
                services: serviceImages,
                blog: blogImages
            };

        } catch (error) {
            console.error(`❌ Error fetching images for ${siteId}:`, error.message);
            return this.generateFallbackImages(siteId, outputDir);
        }
    }

    /**
     * Détermine les mots-clés selon le site
     */
    getKeywordsForSite(siteId, siteConfig) {
        // Mots-clés prédéfinis
        const predefined = this.businessKeywords[siteId];
        
        if (predefined) {
            return {
                hero: predefined,
                services: predefined,
                blog: predefined
            };
        }

        // Extraction automatique du contenu
        const heroDesc = siteConfig.content?.hero?.description || '';
        const serviceDescs = siteConfig.content?.services?.map(s => s.description).join(' ') || '';
        
        // Mots-clés génériques basés sur le contenu
        const extractedKeywords = this.extractKeywordsFromText(heroDesc + ' ' + serviceDescs);
        
        return {
            hero: extractedKeywords.length > 0 ? extractedKeywords : ['business', 'professional', 'office'],
            services: extractedKeywords.length > 0 ? extractedKeywords : ['service', 'professional', 'modern'],
            blog: extractedKeywords.length > 0 ? extractedKeywords : ['business', 'tips', 'professional']
        };
    }

    /**
     * Récupère l'image hero principale
     */
    async fetchHeroImage(keywords, outputDir, siteId) {
        console.log(`  🎯 Fetching hero image with keywords: ${keywords.join(', ')}`);
        
        const query = keywords.slice(0, 3).join(' '); // Limite à 3 mots-clés
        
        try {
            const result = await this.unsplash.search.getPhotos({
                query,
                page: 1,
                perPage: 10,
                orientation: 'landscape',
                color: 'blue' // Couleur professionnelle
            });

            if (result.response?.results?.length > 0) {
                const photo = result.response.results[0];
                const imageUrl = photo.urls.regular;
                const filename = `${siteId}-hero.jpg`;
                
                await this.downloadImage(imageUrl, path.join(outputDir, filename));
                
                console.log(`  ✅ Hero image downloaded: ${filename}`);
                return filename;
            }
        } catch (error) {
            console.warn(`  ⚠️ Failed to fetch hero image: ${error.message}`);
        }

        // Fallback
        return this.generatePlaceholderHero(siteId, outputDir);
    }

    /**
     * Récupère les images de services
     */
    async fetchServiceImages(keywords, outputDir, siteId) {
        console.log(`  🛠️ Fetching service images...`);
        
        const serviceImages = [];
        const maxServices = 4; // Limite pour éviter trop de requêtes
        
        try {
            for (let i = 0; i < maxServices; i++) {
                const query = keywords[i % keywords.length];
                
                const result = await this.unsplash.search.getPhotos({
                    query,
                    page: Math.floor(i / keywords.length) + 1,
                    perPage: 5,
                    orientation: 'landscape'
                });

                if (result.response?.results?.length > 0) {
                    const photo = result.response.results[i % result.response.results.length];
                    const filename = `${siteId}-image-${i + 1}.jpg`;
                    
                    await this.downloadImage(photo.urls.regular, path.join(outputDir, filename));
                    serviceImages.push(filename);
                    
                    console.log(`  ✅ Service image ${i + 1} downloaded: ${filename}`);
                }

                // Délai pour respecter les limites de l'API
                await this.delay(200);
            }

        } catch (error) {
            console.warn(`  ⚠️ Error fetching service images: ${error.message}`);
        }

        // Compléter avec des placeholders si nécessaire
        while (serviceImages.length < maxServices) {
            const placeholder = await this.generatePlaceholderService(siteId, serviceImages.length + 1, outputDir);
            serviceImages.push(placeholder);
        }

        return serviceImages;
    }

    /**
     * Récupère les images de blog
     */
    async fetchBlogImages(keywords, outputDir, siteId) {
        console.log(`  📝 Fetching blog images...`);
        
        const blogDir = path.join(outputDir, 'blog', 'images');
        await fs.ensureDir(blogDir);
        
        const blogImages = [];
        
        try {
            for (let i = 0; i < 3; i++) {
                const query = keywords[i % keywords.length] + ' article';
                
                const result = await this.unsplash.search.getPhotos({
                    query,
                    page: 1,
                    perPage: 5,
                    orientation: 'landscape'
                });

                if (result.response?.results?.length > 0) {
                    const photo = result.response.results[0];
                    const filename = `${siteId}-blog-${i + 1}.jpg`;
                    
                    await this.downloadImage(photo.urls.regular, path.join(blogDir, filename));
                    blogImages.push(filename);
                    
                    console.log(`  ✅ Blog image ${i + 1} downloaded: ${filename}`);
                }

                await this.delay(200);
            }

        } catch (error) {
            console.warn(`  ⚠️ Error fetching blog images: ${error.message}`);
        }

        return blogImages;
    }

    /**
     * Télécharge une image depuis une URL
     */
    async downloadImage(url, outputPath) {
        await fs.ensureDir(path.dirname(outputPath));
        
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    /**
     * Génère des images de fallback/placeholder
     */
    async generateFallbackImages(siteId, outputDir) {
        console.log(`  🔄 Generating fallback images for ${siteId}...`);
        
        return {
            hero: await this.generatePlaceholderHero(siteId, outputDir),
            services: [
                await this.generatePlaceholderService(siteId, 1, outputDir),
                await this.generatePlaceholderService(siteId, 2, outputDir),
                await this.generatePlaceholderService(siteId, 3, outputDir),
                await this.generatePlaceholderService(siteId, 4, outputDir)
            ],
            blog: []
        };
    }

    /**
     * Génère placeholder hero (couleur unie)
     */
    async generatePlaceholderHero(siteId, outputDir) {
        // Pour simplifier, on crée un fichier SVG
        const filename = `${siteId}-hero.svg`;
        const svgContent = `
            <svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)"/>
                <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dy=".3em">
                    ${siteId.toUpperCase()}
                </text>
            </svg>
        `;
        
        await fs.writeFile(path.join(outputDir, filename), svgContent);
        console.log(`  ✅ Placeholder hero generated: ${filename}`);
        return filename;
    }

    /**
     * Génère placeholder service
     */
    async generatePlaceholderService(siteId, index, outputDir) {
        const filename = `${siteId}-image-${index}.svg`;
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
        const color = colors[(index - 1) % colors.length];
        
        const svgContent = `
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${color}"/>
                <circle cx="200" cy="150" r="60" fill="rgba(255,255,255,0.2)"/>
                <text x="50%" y="85%" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">
                    Service ${index}
                </text>
            </svg>
        `;
        
        await fs.writeFile(path.join(outputDir, filename), svgContent);
        console.log(`  ✅ Placeholder service ${index} generated: ${filename}`);
        return filename;
    }

    /**
     * Utilitaires
     */
    extractKeywordsFromText(text) {
        // Extraction simple de mots-clés du contenu
        const words = text.toLowerCase()
            .split(/[^a-zA-Z]+/)
            .filter(word => word.length > 4)
            .filter(word => !['cette', 'avec', 'dans', 'pour', 'vous', 'votre', 'nous', 'notre'].includes(word))
            .slice(0, 5);
            
        return words;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Usage CLI
 */
async function main() {
    const [,, configPath, outputDir] = process.argv;
    
    if (!configPath || !outputDir) {
        console.error('Usage: node image-fetcher.js <configPath> <outputDir>');
        console.error('Example: node image-fetcher.js "./site-config.json" "./output/assets"');
        process.exit(1);
    }

    try {
        const siteConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
        const fetcher = new ImageFetcher();
        
        const images = await fetcher.fetchImagesForSite(siteConfig, outputDir);
        
        console.log('🎉 Image fetching completed!');
        console.log('Generated images:', images);
        
    } catch (error) {
        console.error('❌ Image fetching failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { ImageFetcher };