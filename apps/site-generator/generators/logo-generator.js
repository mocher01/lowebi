#!/usr/bin/env node
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs-extra';
import path from 'path';

/**
 * 🎨 Logo Generator - Canvas Node.js
 * Génère automatiquement logos et favicons pour les sites
 */

class LogoGenerator {
    constructor() {
        this.canvasSize = {
            logo: { width: 400, height: 120 },
            favicon: { width: 64, height: 64 },
            hero: { width: 200, height: 200 }
        };
    }

    /**
     * Génère un logo professionnel basé sur le nom et la couleur
     */
    async generateLogo(siteName, primaryColor, outputDir, debugMode = true) {
        console.log(`🎨 Generating logo for ${siteName}...`);
        
        const { width, height } = this.canvasSize.logo;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background transparent
        ctx.clearRect(0, 0, width, height);

        // Dessiner un cercle/rectangle stylé
        this.drawLogoBackground(ctx, primaryColor, width, height);

        // Ajouter le texte
        this.drawLogoText(ctx, siteName, primaryColor, width, height);

        // Sauvegarder
        await this.saveCanvas(canvas, path.join(outputDir, `${siteName.toLowerCase()}-logo.png`));
        
        // Générer variations
        await this.generateLogoVariations(siteName, primaryColor, outputDir, debugMode);
        
        console.log(`✅ Logo generated for ${siteName}`);
    }

    /**
     * Dessine le background du logo (forme géométrique)
     */
    drawLogoBackground(ctx, color, width, height) {
        // Gradient moderne
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.lightenColor(color, 20));

        // Rectangle avec coins arrondis
        ctx.fillStyle = gradient;
        this.roundRect(ctx, 10, 10, width - 20, height - 20, 15);
        ctx.fill();

        // Accent géométrique
        ctx.fillStyle = this.lightenColor(color, 40);
        ctx.beginPath();
        ctx.arc(width - 30, 30, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Dessine le texte du logo
     */
    drawLogoText(ctx, siteName, color, width, height) {
        // Configuration police
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Effet ombre
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Dessiner le texte
        ctx.fillText(siteName, width / 2, height / 2);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
    }

    /**
     * Génère les variations du logo (clair, sombre, favicon)
     */
    async generateLogoVariations(siteName, primaryColor, outputDir, debugMode = true) {
        const basename = siteName.toLowerCase();
        
        // Logo clair (sur fond sombre)
        const lightLogoName = `${basename}-logo-clair.png`;
        await this.generateLogoVariant(siteName, '#FFFFFF', primaryColor, 
            path.join(outputDir, lightLogoName), debugMode ? lightLogoName : null);
        
        // Logo sombre (sur fond clair)
        const darkLogoName = `${basename}-logo-sombre.png`;  
        await this.generateLogoVariant(siteName, primaryColor, '#FFFFFF',
            path.join(outputDir, darkLogoName), debugMode ? darkLogoName : null);

        // Favicon
        await this.generateFavicon(siteName, primaryColor, outputDir, debugMode);
    }

    /**
     * Génère une variation du logo
     */
    async generateLogoVariant(siteName, textColor, bgColor, outputPath, debugFilename = null) {
        const { width, height } = this.canvasSize.logo;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background avec bordure debug
        if (bgColor !== '#FFFFFF') {
            ctx.fillStyle = bgColor;
            this.roundRect(ctx, 0, 0, width, height, 15);
            ctx.fill();
        } else {
            // Background blanc avec bordure pour le mode debug
            ctx.fillStyle = '#F3F4F6';
            this.roundRect(ctx, 0, 0, width, height, 15);
            ctx.fill();
            
            if (debugFilename) {
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                this.roundRect(ctx, 2, 2, width - 4, height - 4, 15);
                ctx.stroke();
            }
        }

        if (debugFilename) {
            // Mode debug : afficher le nom du fichier
            ctx.fillStyle = textColor;
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(debugFilename, width / 2, height / 2);
            
            // Icône logo plus petite
            ctx.font = 'bold 12px Arial, sans-serif';
            ctx.fillText('LOGO', width / 2, height / 2 - 25);
        } else {
            // Mode normal : nom du site
            ctx.fillStyle = textColor;
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(siteName, width / 2, height / 2);
        }

        await this.saveCanvas(canvas, outputPath);
    }

    /**
     * Génère les favicons
     */
    async generateFavicon(siteName, primaryColor, outputDir, debugMode = true) {
        const basename = siteName.toLowerCase();
        const { width, height } = this.canvasSize.favicon;
        
        // Favicon principal
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background circulaire
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(width/2, height/2, width/2 - 2, 0, Math.PI * 2);
        ctx.fill();

        if (debugMode) {
            // Mode debug : afficher "FAV" en petit
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('FAV', width/2, height/2);
        } else {
            // Mode normal : initiales du site
            const initials = this.getInitials(siteName);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, width/2, height/2);
        }

        // Sauvegarder en PNG
        await this.saveCanvas(canvas, path.join(outputDir, `${basename}-favicon.png`));
        
        // Générer favicon.ico (copie en PNG pour simplifier)
        await this.saveCanvas(canvas, path.join(outputDir, `${basename}-favicon.ico`));

        // Variations clair/sombre
        await this.generateFaviconVariations(siteName, primaryColor, outputDir, debugMode);
    }

    /**
     * Génère variations favicon clair/sombre
     */
    async generateFaviconVariations(siteName, primaryColor, outputDir, debugMode = true) {
        const basename = siteName.toLowerCase();
        const { width, height } = this.canvasSize.favicon;

        // Favicon clair
        const canvasLight = createCanvas(width, height);
        const ctxLight = canvasLight.getContext('2d');
        ctxLight.fillStyle = '#FFFFFF';
        ctxLight.beginPath();
        ctxLight.arc(width/2, height/2, width/2 - 2, 0, Math.PI * 2);
        ctxLight.fill();

        ctxLight.fillStyle = primaryColor;
        if (debugMode) {
            ctxLight.font = 'bold 8px Arial, sans-serif';
            ctxLight.textAlign = 'center';
            ctxLight.textBaseline = 'middle';
            ctxLight.fillText('FAV-L', width/2, height/2);
        } else {
            ctxLight.font = 'bold 24px Arial, sans-serif';
            ctxLight.textAlign = 'center';
            ctxLight.textBaseline = 'middle';
            ctxLight.fillText(this.getInitiales(siteName), width/2, height/2);
        }

        await this.saveCanvas(canvasLight, path.join(outputDir, `${basename}-favicon-clair.png`));

        // Favicon sombre  
        const canvasDark = createCanvas(width, height);
        const ctxDark = canvasDark.getContext('2d');
        ctxDark.fillStyle = '#1F2937';
        ctxDark.beginPath();
        ctxDark.arc(width/2, height/2, width/2 - 2, 0, Math.PI * 2);
        ctxDark.fill();

        ctxDark.fillStyle = '#FFFFFF';
        if (debugMode) {
            ctxDark.font = 'bold 8px Arial, sans-serif';
            ctxDark.textAlign = 'center';
            ctxDark.textBaseline = 'middle';
            ctxDark.fillText('FAV-D', width/2, height/2);
        } else {
            ctxDark.font = 'bold 24px Arial, sans-serif';
            ctxDark.textAlign = 'center';
            ctxDark.textBaseline = 'middle';
            ctxDark.fillText(this.getInitiales(siteName), width/2, height/2);
        }

        await this.saveCanvas(canvasDark, path.join(outputDir, `${basename}-favicon-sombre.png`));
    }

    /**
     * Utilitaires
     */
    getInitials(siteName) {
        return siteName
            .split(/[\s-_]/)
            .filter(word => word.length > 0)
            .map(word => word[0].toUpperCase())
            .slice(0, 2)
            .join('');
    }

    getInitiales(siteName) {
        // Méthode corrigée
        return this.getInitials(siteName);
    }

    lightenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * percent / 100));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * percent / 100));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * percent / 100));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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
    const [,, siteName, primaryColor, outputDir] = process.argv;
    
    if (!siteName || !primaryColor || !outputDir) {
        console.error('Usage: node logo-generator.js <siteName> <primaryColor> <outputDir>');
        console.error('Example: node logo-generator.js "TranslatePro" "#059669" "./output"');
        process.exit(1);
    }

    const generator = new LogoGenerator();
    
    try {
        await generator.generateLogo(siteName, primaryColor, outputDir);
        console.log('🎉 Logo generation completed!');
    } catch (error) {
        console.error('❌ Logo generation failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { LogoGenerator };