#!/usr/bin/env node
import { createCanvas } from 'canvas';
import fs from 'fs-extra';
import path from 'path';

/**
 * 🎨 Pattern Generator - Canvas Geometric Patterns
 * Génère des patterns et backgrounds cohérents avec la palette du site
 */

class PatternGenerator {
    constructor() {
        this.patterns = {
            geometric: this.generateGeometric.bind(this),
            gradient: this.generateGradient.bind(this),
            circles: this.generateCircles.bind(this),
            lines: this.generateLines.bind(this),
            hexagon: this.generateHexagon.bind(this)
        };
    }

    /**
     * Génère un pattern selon le type et la couleur
     */
    async generatePattern(type, primaryColor, secondaryColor, outputPath, size = { width: 400, height: 300 }) {
        console.log(`🎨 Generating ${type} pattern: ${path.basename(outputPath)}`);
        
        const canvas = createCanvas(size.width, size.height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size.width, size.height);

        // Générer le pattern demandé
        if (this.patterns[type]) {
            await this.patterns[type](ctx, primaryColor, secondaryColor, size);
        } else {
            // Fallback sur geometric
            await this.patterns.geometric(ctx, primaryColor, secondaryColor, size);
        }

        // Sauvegarder
        await this.saveCanvas(canvas, outputPath);
        console.log(`  ✅ Pattern generated: ${path.basename(outputPath)}`);
    }

    /**
     * Pattern géométrique moderne
     */
    async generateGeometric(ctx, primary, secondary, size) {
        const { width, height } = size;
        
        // Gradient de base
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, this.addAlpha(primary, 0.1));
        gradient.addColorStop(1, this.addAlpha(secondary, 0.1));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Formes géométriques
        ctx.fillStyle = this.addAlpha(primary, 0.3);
        
        // Triangles
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 20 + Math.random() * 40;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x - size, y + size);
            ctx.closePath();
            ctx.fill();
        }

        // Cercles
        ctx.fillStyle = this.addAlpha(secondary, 0.4);
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 10 + Math.random() * 30;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Pattern gradient moderne
     */
    async generateGradient(ctx, primary, secondary, size) {
        const { width, height } = size;
        
        // Gradient radial
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 2
        );
        
        gradient.addColorStop(0, primary);
        gradient.addColorStop(0.7, secondary);
        gradient.addColorStop(1, this.lightenColor(primary, 20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Overlay pattern
        ctx.fillStyle = this.addAlpha('#FFFFFF', 0.1);
        for (let i = 0; i < width; i += 40) {
            ctx.fillRect(i, 0, 20, height);
        }
    }

    /**
     * Pattern cercles organiques
     */
    async generateCircles(ctx, primary, secondary, size) {
        const { width, height } = size;
        
        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, this.lightenColor(primary, 50));
        bg.addColorStop(1, this.lightenColor(secondary, 50));
        
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        // Cercles de différentes tailles
        const circles = [
            { color: this.addAlpha(primary, 0.6), count: 3, minSize: 60, maxSize: 120 },
            { color: this.addAlpha(secondary, 0.4), count: 5, minSize: 30, maxSize: 80 },
            { color: this.addAlpha(primary, 0.2), count: 8, minSize: 15, maxSize: 50 }
        ];

        circles.forEach(circleType => {
            ctx.fillStyle = circleType.color;
            
            for (let i = 0; i < circleType.count; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = circleType.minSize + Math.random() * (circleType.maxSize - circleType.minSize);
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    /**
     * Pattern lignes dynamiques
     */
    async generateLines(ctx, primary, secondary, size) {
        const { width, height } = size;
        
        // Background
        ctx.fillStyle = this.lightenColor(primary, 60);
        ctx.fillRect(0, 0, width, height);

        // Lignes diagonales
        ctx.strokeStyle = this.addAlpha(primary, 0.8);
        ctx.lineWidth = 3;
        
        for (let i = 0; i < 12; i++) {
            const startX = (i * width / 12) - 50;
            const startY = 0;
            const endX = (i * width / 12) + 50;
            const endY = height;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Lignes horizontales accent
        ctx.strokeStyle = this.addAlpha(secondary, 0.6);
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 6; i++) {
            const y = i * height / 6;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    /**
     * Pattern hexagonal moderne
     */
    async generateHexagon(ctx, primary, secondary, size) {
        const { width, height } = size;
        
        // Background
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, this.lightenColor(secondary, 70));
        bg.addColorStop(1, this.lightenColor(primary, 70));
        
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        // Hexagones
        const hexSize = 30;
        const hexHeight = hexSize * Math.sqrt(3);
        
        ctx.strokeStyle = this.addAlpha(primary, 0.6);
        ctx.lineWidth = 2;
        ctx.fillStyle = this.addAlpha(secondary, 0.3);

        for (let row = 0; row < height / hexHeight + 2; row++) {
            for (let col = 0; col < width / (hexSize * 1.5) + 2; col++) {
                const x = col * hexSize * 1.5;
                const y = row * hexHeight + (col % 2) * (hexHeight / 2);
                
                this.drawHexagon(ctx, x, y, hexSize);
                
                if (Math.random() > 0.7) {
                    ctx.fill();
                }
                ctx.stroke();
            }
        }
    }

    /**
     * Dessine un hexagone
     */
    drawHexagon(ctx, centerX, centerY, radius) {
        ctx.beginPath();
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
    }

    /**
     * Génère un ensemble de patterns pour un site
     */
    async generateSitePatterns(siteId, primaryColor, secondaryColor, outputDir) {
        console.log(`🎨 Generating pattern suite for ${siteId}...`);
        
        const patterns = [
            { name: 'hero-bg', type: 'gradient', size: { width: 1200, height: 600 } },
            { name: 'service-1', type: 'geometric', size: { width: 400, height: 300 } },
            { name: 'service-2', type: 'circles', size: { width: 400, height: 300 } },
            { name: 'service-3', type: 'lines', size: { width: 400, height: 300 } },
            { name: 'service-4', type: 'hexagon', size: { width: 400, height: 300 } },
            { name: 'about-bg', type: 'gradient', size: { width: 800, height: 400 } },
            { name: 'cta-bg', type: 'geometric', size: { width: 1000, height: 300 } }
        ];

        const results = [];
        
        for (const pattern of patterns) {
            const filename = `${siteId}-${pattern.name}.png`;
            const outputPath = path.join(outputDir, filename);
            
            await this.generatePattern(
                pattern.type,
                primaryColor,
                secondaryColor,
                outputPath,
                pattern.size
            );
            
            results.push(filename);
        }

        console.log(`✅ Generated ${results.length} patterns for ${siteId}`);
        return results;
    }

    /**
     * Utilitaires couleurs
     */
    addAlpha(color, alpha) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

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
    const [,, siteId, primaryColor, secondaryColor, outputDir] = process.argv;
    
    if (!siteId || !primaryColor || !outputDir) {
        console.error('Usage: node pattern-generator.js <siteId> <primaryColor> [secondaryColor] <outputDir>');
        console.error('Example: node pattern-generator.js "translatepro" "#059669" "#10B981" "./output"');
        process.exit(1);
    }

    const generator = new PatternGenerator();
    const secondary = secondaryColor || generator.lightenColor(primaryColor, 20);
    
    try {
        const patterns = await generator.generateSitePatterns(siteId, primaryColor, secondary, outputDir);
        console.log('🎉 Pattern generation completed!');
        console.log('Generated patterns:', patterns);
        
    } catch (error) {
        console.error('❌ Pattern generation failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { PatternGenerator };