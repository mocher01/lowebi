const fs = require('fs').promises;
const path = require('path');

class ImageProcessor {
    constructor() {
        this.imageMapping = {
            'logo': 'logo-clair.png',
            'logoFooter': 'logo-sombre.png',
            'hero': 'hero.jpg',
            'faviconLight': 'favicon-clair.png',
            'faviconDark': 'favicon-sombre.png'
        };
    }

    /**
     * Process uploaded images and rename them according to site convention
     * @param {string} siteId - The site identifier
     * @param {object} imageData - Object containing image data (base64 or file paths)
     * @returns {object} - Processed image filenames
     */
    async processImages(siteId, imageData) {
        const processedImages = {};
        const configDir = path.join(__dirname, '..', 'configs', siteId, 'assets');
        
        // Ensure assets directory exists
        await this.ensureDirectory(configDir);
        
        for (const [imageType, data] of Object.entries(imageData)) {
            if (!data) continue;
            
            let filename;
            
            // Handle main images
            if (this.imageMapping[imageType]) {
                filename = `${siteId}-${this.imageMapping[imageType]}`;
            }
            // Handle service images
            else if (imageType.startsWith('service_')) {
                const index = parseInt(imageType.split('_')[1]) + 1;
                filename = `${siteId}-service-${index}.jpg`;
            }
            // Handle blog images
            else if (imageType.startsWith('blog_')) {
                const index = parseInt(imageType.split('_')[1]) + 1;
                filename = `${siteId}-blog-${index}.jpg`;
            }
            else {
                // Default naming
                filename = `${siteId}-${imageType}.jpg`;
            }
            
            // If data is base64, save it
            if (typeof data === 'object' && data.data) {
                await this.saveBase64Image(data.data, path.join(configDir, filename));
                processedImages[imageType] = filename;
            }
            // If data is already a filename, just record it
            else if (typeof data === 'string') {
                processedImages[imageType] = filename;
            }
        }
        
        return processedImages;
    }

    /**
     * Save base64 image to file
     */
    async saveBase64Image(base64Data, filePath) {
        // Remove data:image/xxx;base64, prefix
        const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        await fs.writeFile(filePath, buffer);
    }

    /**
     * Ensure directory exists
     */
    async ensureDirectory(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    /**
     * Update site configuration with processed image filenames
     */
    async updateSiteConfig(siteId, processedImages) {
        const configPath = path.join(__dirname, '..', 'configs', siteId, 'site-config.json');
        
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // Update brand logos
            if (processedImages.logo) {
                config.brand.logos.navbar = processedImages.logo;
            }
            if (processedImages.logoFooter) {
                config.brand.logos.footer = processedImages.logoFooter;
            }
            
            // Update favicons
            if (processedImages.faviconLight) {
                config.brand.favicons.light = processedImages.faviconLight;
            }
            if (processedImages.faviconDark) {
                config.brand.favicons.dark = processedImages.faviconDark;
            }
            
            // Update hero image
            if (processedImages.hero) {
                config.content.hero.image = processedImages.hero;
            }
            
            // Update service images
            const serviceImages = Object.entries(processedImages)
                .filter(([key]) => key.startsWith('service_'))
                .sort(([a], [b]) => {
                    const indexA = parseInt(a.split('_')[1]);
                    const indexB = parseInt(b.split('_')[1]);
                    return indexA - indexB;
                });
            
            serviceImages.forEach(([key, filename], index) => {
                if (config.content.services && config.content.services[index]) {
                    config.content.services[index].image = filename;
                }
            });
            
            // Update blog images
            const blogImages = Object.entries(processedImages)
                .filter(([key]) => key.startsWith('blog_'))
                .sort(([a], [b]) => {
                    const indexA = parseInt(a.split('_')[1]);
                    const indexB = parseInt(b.split('_')[1]);
                    return indexA - indexB;
                });
            
            if (config.content.blog && config.content.blog.articles) {
                blogImages.forEach(([key, filename], index) => {
                    if (config.content.blog.articles[index]) {
                        config.content.blog.articles[index].image = filename;
                    }
                });
            }
            
            // Save updated config
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            return config;
        } catch (error) {
            console.error('Error updating site config:', error);
            throw error;
        }
    }
}

module.exports = ImageProcessor;