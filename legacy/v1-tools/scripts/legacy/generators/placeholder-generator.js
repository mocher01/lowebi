#!/usr/bin/env node
import { createCanvas } from 'canvas';
import fs from 'fs-extra';
import path from 'path';

/**
 * 🖼️ Placeholder Generator - Mode Debug
 * Génère des images placeholder avec le nom du fichier écrit dedans
 */

class PlaceholderGenerator {
    constructor() {
        this.defaultSizes = {
            logo: { width: 400, height: 120 },
            favicon: { width: 64, height: 64 },
            hero: { width: 1200, height: 600 },
            service: { width: 400, height: 300 },
            blog: { width: 600, height: 400 }
        };
    }

    /**
     * Génère un placeholder avec le nom du fichier
     */
    async generatePlaceholder(filename, outputPath, options = {}) {
        const { 
            width, 
            height, 
            backgroundColor = '#E5E7EB',
            textColor = '#4B5563',
            primaryColor
        } = options;

        console.log(`  📋 Generating placeholder: ${filename}`);

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Bordure colorée si couleur primaire fournie
        if (primaryColor) {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, width - 4, height - 4);
        }

        // Icône image au centre
        this.drawImageIcon(ctx, width, height, textColor);

        // Nom du fichier
        ctx.fillStyle = textColor;
        ctx.font = `bold ${Math.min(width / 20, 20)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Texte principal (nom du fichier)
        const mainText = filename;
        ctx.fillText(mainText, width / 2, height / 2 + height / 6);

        // Dimensions (plus petit)
        ctx.font = `${Math.min(width / 30, 14)}px Arial, sans-serif`;
        ctx.fillStyle = this.lightenColor(textColor, 20);
        ctx.fillText(`${width} × ${height}`, width / 2, height / 2 + height / 4);

        // Sauvegarder
        await this.saveCanvas(canvas, outputPath);
    }

    /**
     * Dessine une icône d'image au centre
     */
    drawImageIcon(ctx, canvasWidth, canvasHeight, color) {
        const iconSize = Math.min(canvasWidth, canvasHeight) / 4;
        const x = (canvasWidth - iconSize) / 2;
        const y = (canvasHeight - iconSize) / 2 - canvasHeight / 10;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        // Rectangle de l'image
        ctx.strokeRect(x, y, iconSize, iconSize * 0.75);
        
        // Montagne simple
        ctx.beginPath();
        ctx.moveTo(x + iconSize * 0.2, y + iconSize * 0.55);
        ctx.lineTo(x + iconSize * 0.4, y + iconSize * 0.35);
        ctx.lineTo(x + iconSize * 0.6, y + iconSize * 0.55);
        ctx.stroke();

        // Soleil
        ctx.beginPath();
        ctx.arc(x + iconSize * 0.75, y + iconSize * 0.25, iconSize * 0.08, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Génère tous les placeholders pour un site
     */
    async generateAllPlaceholders(siteConfig, outputDir) {
        console.log('🖼️ Generating debug placeholders with filenames...');
        
        const siteId = siteConfig.meta.siteId;
        const siteName = siteConfig.brand.name;
        const primaryColor = siteConfig.brand.colors.primary;
        
        const placeholders = [];

        // Logos
        if (siteConfig.brand.logos) {
            for (const [key, filename] of Object.entries(siteConfig.brand.logos)) {
                await this.generatePlaceholder(
                    filename,
                    path.join(outputDir, filename),
                    {
                        ...this.defaultSizes.logo,
                        primaryColor,
                        backgroundColor: key === 'navbar' ? '#F9FAFB' : '#1F2937'
                    }
                );
                placeholders.push(filename);
            }
        }

        // Favicons
        if (siteConfig.brand.favicons) {
            for (const [key, filename] of Object.entries(siteConfig.brand.favicons)) {
                if (filename.endsWith('.png') || filename.endsWith('.ico')) {
                    await this.generatePlaceholder(
                        filename,
                        path.join(outputDir, filename),
                        {
                            ...this.defaultSizes.favicon,
                            primaryColor,
                            backgroundColor: key === 'light' ? '#FFFFFF' : '#1F2937'
                        }
                    );
                    placeholders.push(filename);
                }
            }
        }

        // Hero image
        if (siteConfig.content?.hero?.image) {
            const heroImageName = siteConfig.content.hero.image;
            // Force PNG extension for compatibility
            const heroImagePath = heroImageName.replace(/\.(jpg|jpeg|svg|webp)$/i, '.png');
            
            await this.generatePlaceholder(
                heroImageName,
                path.join(outputDir, heroImagePath),
                {
                    ...this.defaultSizes.hero,
                    primaryColor
                }
            );
            placeholders.push(heroImagePath);
        }

        // Service images
        if (siteConfig.content?.services) {
            for (const service of siteConfig.content.services) {
                if (service.image) {
                    await this.generatePlaceholder(
                        service.image,
                        path.join(outputDir, service.image),
                        {
                            ...this.defaultSizes.service,
                            primaryColor
                        }
                    );
                    placeholders.push(service.image);
                }
            }
        }

        // Images génériques
        if (siteConfig.content?.images) {
            for (const [key, filename] of Object.entries(siteConfig.content.images)) {
                await this.generatePlaceholder(
                    filename,
                    path.join(outputDir, filename),
                    {
                        ...this.defaultSizes.service,
                        primaryColor
                    }
                );
                placeholders.push(filename);
            }
        }

        // Blog images - Scanner les articles
        const blogDir = path.join(outputDir, '../content/blog');
        if (await fs.pathExists(blogDir)) {
            const articles = await fs.readdir(blogDir);
            
            for (const article of articles) {
                if (article.endsWith('.md')) {
                    const content = await fs.readFile(path.join(blogDir, article), 'utf8');
                    const imageMatch = content.match(/image:\s*"([^"]+)"/);
                    
                    if (imageMatch && imageMatch[1]) {
                        const imagePath = imageMatch[1];
                        const imageName = path.basename(imagePath);
                        const imageOutputPath = path.join(outputDir, imagePath);
                        
                        await fs.ensureDir(path.dirname(imageOutputPath));
                        await this.generatePlaceholder(
                            imageName,
                            imageOutputPath,
                            {
                                ...this.defaultSizes.blog,
                                primaryColor
                            }
                        );
                        placeholders.push(imagePath);
                    }
                }
            }
        }

        console.log(`✅ Generated ${placeholders.length} placeholder images`);
        return placeholders;
    }

    /**
     * Génère un placeholder spécifique
     */
    async generateSpecificPlaceholder(filename, outputPath, type = 'generic', primaryColor = '#4F46E5') {
        const sizes = {
            logo: this.defaultSizes.logo,
            favicon: this.defaultSizes.favicon,
            hero: this.defaultSizes.hero,
            service: this.defaultSizes.service,
            blog: this.defaultSizes.blog,
            generic: { width: 400, height: 300 }
        };

        const size = sizes[type] || sizes.generic;
        
        await this.generatePlaceholder(filename, outputPath, {
            ...size,
            primaryColor
        });
    }

    /**
     * Utilitaires
     */
    lightenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * percent / 100));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * percent / 100));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * percent / 100));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    async saveCanvas(canvas, outputPath) {
        await fs.ensureDir(path.dirname(outputPath));
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(outputPath, buffer);
    }
}

/**
 * Usage CLI
 */
async function main() {
    const [,, configPath, outputDir] = process.argv;
    
    if (!configPath || !outputDir) {
        console.error('Usage: node placeholder-generator.js <configPath> <outputDir>');
        console.error('Example: node placeholder-generator.js "./site-config.json" "./output/assets"');
        process.exit(1);
    }

    try {
        const siteConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
        const generator = new PlaceholderGenerator();
        
        const placeholders = await generator.generateAllPlaceholders(siteConfig, outputDir);
        
        console.log('🎉 Placeholder generation completed!');
        console.log('Generated files:', placeholders);
        
    } catch (error) {
        console.error('❌ Placeholder generation failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { PlaceholderGenerator };