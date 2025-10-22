#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

/**
 * 🖼️ Logo Processor - Traitement des logos et favicons uploadés manuellement
 * 
 * Responsabilités:
 * - Chercher les logos/favicons dans configs/{site}/assets/
 * - Appliquer le cropping optimisé pour les logos
 * - Redimensionner les favicons
 * - Copier vers le dossier de destination
 */

class LogoProcessor {
    constructor(siteId = null) {
        this.imageMagickAvailable = this.checkImageMagick();
        this.siteId = siteId;
        
        // 🎯 V4.62 - Less aggressive cropping to prevent over-cropping
        this.logoParams = {
            // Paramètres moins agressifs pour éviter le sur-recadrage
            navbar: {
                // V4.62: paramètres plus conservateurs (80% largeur, 40% hauteur)
                crop: '80%x40%+10%+8%',
                description: 'V4.62 conservative parameters to prevent over-cropping'
            },
            footer: {
                // Même paramètre pour cohérence
                crop: '80%x40%+10%+8%',
                description: 'V4.62 conservative parameters - consistent with navbar'
            },
            default: {
                // Même paramètre pour cohérence
                crop: '80%x40%+10%+8%',
                description: 'V4.62 conservative parameters - universal use'
            },
            maxHeight: null,
            version: 'V4.62 - Conservative cropping (80%x40%) to prevent over-cropping of logos'
        };
        
        this.faviconParams = {
            crop: '60%x60%+40%+0',
            size: 512
        };
    }

    /**
     * 🔍 Check if ImageMagick is available
     */
    checkImageMagick() {
        try {
            execSync('identify -version', { stdio: 'ignore' });
            console.log('✅ ImageMagick detected - smart cropping enabled');
            return true;
        } catch (error) {
            console.log('⚠️  ImageMagick not found - logos will be copied without processing');
            console.log('💡 Install ImageMagick to enable smart cropping and favicon processing');
            return false;
        }
    }

    /**
     * 🧠 Intelligent Content Analysis - Analyzes actual image pixels to determine optimal cropping
     * @param {string} imagePath - Path to the image file
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {Object} Analysis results with recommended crop parameters
     */
    async analyzeImageContent(imagePath, width, height) {
        if (!this.imageMagickAvailable) {
            return { 
                contentBounds: null, 
                whitespaceAnalysis: null, 
                recommendedCrop: null,
                confidence: 0,
                method: 'unavailable'
            };
        }

        try {
            console.log(`🧠 Analyzing image content for intelligent cropping...`);
            
            // 1. Edge detection to find actual content boundaries
            const edgeAnalysis = await this.detectContentEdges(imagePath, width, height);
            
            // 2. Analyze whitespace distribution
            const whitespaceAnalysis = await this.analyzeWhitespace(imagePath, width, height);
            
            // 3. Detect logo positioning and density
            const contentDensity = await this.analyzeContentDensity(imagePath, width, height);
            
            // 4. Generate intelligent crop recommendation
            const recommendedCrop = this.generateIntelligentCrop(
                edgeAnalysis, 
                whitespaceAnalysis, 
                contentDensity, 
                width, 
                height
            );
            
            console.log(`📊 Content Analysis Results:`);
            console.log(`   • Content bounds: ${edgeAnalysis.bounds.left}px, ${edgeAnalysis.bounds.top}px, ${edgeAnalysis.bounds.right}px, ${edgeAnalysis.bounds.bottom}px`);
            console.log(`   • Whitespace: ${whitespaceAnalysis.topWhitespace}% top, ${whitespaceAnalysis.bottomWhitespace}% bottom`);
            console.log(`   • Content density: ${contentDensity.density}%`);
            console.log(`   • Recommended crop: ${recommendedCrop.crop} (confidence: ${recommendedCrop.confidence}%)`);
            
            return {
                contentBounds: edgeAnalysis.bounds,
                whitespaceAnalysis,
                contentDensity,
                recommendedCrop,
                confidence: recommendedCrop.confidence,
                method: 'intelligent-analysis'
            };
            
        } catch (error) {
            console.log(`⚠️  Content analysis failed: ${error.message}`);
            return { 
                contentBounds: null, 
                whitespaceAnalysis: null, 
                recommendedCrop: null,
                confidence: 0,
                method: 'fallback'
            };
        }
    }

    /**
     * 🔍 Detect content edges using ImageMagick trim and bounds detection
     */
    async detectContentEdges(imagePath, width, height) {
        try {
            // Method 1: Use ImageMagick's trim to find content bounds
            const trimCmd = `convert "${imagePath}" -trim -format "%[fx:page.x],%[fx:page.y],%[fx:page.width],%[fx:page.height]" info:`;
            const trimResult = execSync(trimCmd, { encoding: 'utf8' }).trim();
            
            if (trimResult && trimResult.includes(',')) {
                const [x, y, w, h] = trimResult.split(',').map(Number);
                
                // Validate results are reasonable
                if (w > 0 && h > 0 && w <= width && h <= height) {
                    return {
                        bounds: {
                            left: x || 0,
                            top: y || 0,
                            right: (x || 0) + w,
                            bottom: (y || 0) + h,
                            width: w,
                            height: h
                        },
                        method: 'trim-detection'
                    };
                }
            }
            
            // Method 2: Fallback to edge detection if trim fails
            const tempEdgePath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '_edges.png');
            
            // Create edge-detected version and find bounds
            execSync(`convert "${imagePath}" -colorspace Gray -edge 1 -threshold 50% "${tempEdgePath}"`, { stdio: 'ignore' });
            
            // Find bounding box of non-black content
            const boundingCmd = `convert "${tempEdgePath}" -trim -format "%[fx:page.x],%[fx:page.y],%[fx:page.width],%[fx:page.height]" info:`;
            const boundingResult = execSync(boundingCmd, { encoding: 'utf8' }).trim();
            
            // Clean up temp file
            try { 
                execSync(process.platform === 'win32' ? `del "${tempEdgePath}"` : `rm "${tempEdgePath}"`, { stdio: 'ignore' }); 
            } catch {}
            
            if (boundingResult && boundingResult.includes(',')) {
                const [x, y, w, h] = boundingResult.split(',').map(Number);
                
                if (w > 0 && h > 0 && w <= width && h <= height) {
                    return {
                        bounds: {
                            left: x || 0,
                            top: y || 0,
                            right: (x || 0) + w,
                            bottom: (y || 0) + h,
                            width: w,
                            height: h
                        },
                        method: 'edge-detection'
                    };
                }
            }
            
        } catch (error) {
            console.log(`   ⚠️  Edge detection failed: ${error.message}`);
        }
        
        // Fallback: assume content is in center 80% of image
        const margin = 0.1;
        return {
            bounds: {
                left: Math.floor(width * margin),
                top: Math.floor(height * margin),
                right: Math.floor(width * (1 - margin)),
                bottom: Math.floor(height * (1 - margin)),
                width: Math.floor(width * (1 - 2 * margin)),
                height: Math.floor(height * (1 - 2 * margin))
            },
            method: 'fallback-center'
        };
    }

    /**
     * 📏 Analyze whitespace distribution in the image
     */
    async analyzeWhitespace(imagePath, width, height) {
        try {
            // Sample the image at various points to detect whitespace/transparency
            const samples = [];
            const samplePoints = [
                // Top edge samples
                { x: '10%', y: '5%', region: 'top' },
                { x: '50%', y: '5%', region: 'top' },
                { x: '90%', y: '5%', region: 'top' },
                // Bottom edge samples  
                { x: '10%', y: '95%', region: 'bottom' },
                { x: '50%', y: '95%', region: 'bottom' },
                { x: '90%', y: '95%', region: 'bottom' },
                // Left edge samples
                { x: '5%', y: '50%', region: 'left' },
                // Right edge samples
                { x: '95%', y: '50%', region: 'right' }
            ];
            
            for (const point of samplePoints) {
                try {
                    // Get pixel color at this point
                    const colorCmd = `convert "${imagePath}" -crop 1x1+${point.x}+${point.y} -format "%[pixel:u]" info:`;
                    const color = execSync(colorCmd, { encoding: 'utf8' }).trim();
                    
                    // Consider white, near-white, or transparent as whitespace
                    const isWhitespace = this.isWhitespacePixel(color);
                    samples.push({ ...point, color, isWhitespace });
                } catch {
                    samples.push({ ...point, color: 'unknown', isWhitespace: false });
                }
            }
            
            // Calculate whitespace percentages
            const topSamples = samples.filter(s => s.region === 'top');
            const bottomSamples = samples.filter(s => s.region === 'bottom');
            const leftSamples = samples.filter(s => s.region === 'left');
            const rightSamples = samples.filter(s => s.region === 'right');
            
            return {
                topWhitespace: Math.round((topSamples.filter(s => s.isWhitespace).length / topSamples.length) * 100),
                bottomWhitespace: Math.round((bottomSamples.filter(s => s.isWhitespace).length / bottomSamples.length) * 100),
                leftWhitespace: Math.round((leftSamples.filter(s => s.isWhitespace).length / leftSamples.length) * 100),
                rightWhitespace: Math.round((rightSamples.filter(s => s.isWhitespace).length / rightSamples.length) * 100),
                samples: samples.length,
                method: 'pixel-sampling'
            };
            
        } catch (error) {
            return {
                topWhitespace: 20,
                bottomWhitespace: 20, 
                leftWhitespace: 10,
                rightWhitespace: 10,
                samples: 0,
                method: 'fallback-estimate'
            };
        }
    }

    /**
     * 🎯 Analyze content density to avoid over-cropping
     */
    async analyzeContentDensity(imagePath, width, height) {
        try {
            // Get histogram to understand content distribution
            const histCmd = `identify -format "%[fx:mean]" "${imagePath}"`;
            const meanBrightness = parseFloat(execSync(histCmd, { encoding: 'utf8' }).trim());
            
            // Get standard deviation to understand content variance
            const stdCmd = `identify -format "%[fx:standard_deviation]" "${imagePath}"`;
            const stdDev = parseFloat(execSync(stdCmd, { encoding: 'utf8' }).trim());
            
            // High std dev + moderate mean = complex logo with details
            // Low std dev = simple logo or lots of whitespace
            const density = Math.min(100, Math.max(0, (stdDev * 100) + (meanBrightness * 50)));
            
            return {
                density: Math.round(density),
                meanBrightness: Math.round(meanBrightness * 100),
                standardDeviation: Math.round(stdDev * 100),
                complexity: density > 60 ? 'high' : density > 30 ? 'medium' : 'low',
                method: 'histogram-analysis'
            };
            
        } catch (error) {
            return {
                density: 50,
                meanBrightness: 50,
                standardDeviation: 25,
                complexity: 'medium',
                method: 'fallback-medium'
            };
        }
    }

    /**
     * 🎨 Generate intelligent crop parameters based on content analysis
     */
    generateIntelligentCrop(edgeAnalysis, whitespaceAnalysis, contentDensity, width, height) {
        const bounds = edgeAnalysis.bounds;
        
        // Calculate actual content margins as percentages
        const leftMargin = Math.round((bounds.left / width) * 100);
        const rightMargin = Math.round(((width - bounds.right) / width) * 100);
        const topMargin = Math.round((bounds.top / height) * 100);
        const bottomMargin = Math.round(((height - bounds.bottom) / height) * 100);
        
        // 🧠 INTELLIGENT ANALYSIS: Calculate based on ACTUAL detected content boundaries
        
        // Calculate detected content utilization (how much of the image is actual content)
        const contentUtilization = {
            horizontal: (bounds.width / width) * 100,
            vertical: (bounds.height / height) * 100
        };
        
        // Determine smart buffer based on content analysis
        const smartBuffer = this.calculateSmartBuffer(contentDensity, whitespaceAnalysis, contentUtilization);
        
        // Calculate crop based on ACTUAL content boundaries with intelligent buffers
        let cropLeft = Math.max(1, leftMargin - smartBuffer.left);
        let cropTop = Math.max(1, topMargin - smartBuffer.top);
        let cropRight = Math.max(1, rightMargin - smartBuffer.right);
        let cropBottom = Math.max(1, bottomMargin - smartBuffer.bottom);
        
        // Calculate final crop dimensions
        let cropWidth = 100 - cropLeft - cropRight;
        let cropHeight = 100 - cropTop - cropBottom;
        
        // Ensure reasonable bounds (prevent extreme crops)
        cropWidth = Math.max(30, Math.min(98, cropWidth)); // Never crop more than 70% or less than 2%
        cropHeight = Math.max(20, Math.min(98, cropHeight)); // Never crop more than 80% or less than 2%
        
        // Recalculate positions if bounds were adjusted
        if (cropWidth !== (100 - cropLeft - cropRight)) {
            const adjustment = ((100 - cropLeft - cropRight) - cropWidth) / 2;
            cropLeft = Math.max(1, cropLeft + adjustment);
        }
        if (cropHeight !== (100 - cropTop - cropBottom)) {
            const adjustment = ((100 - cropTop - cropBottom) - cropHeight) / 2;
            cropTop = Math.max(1, cropTop + adjustment);
        }
        
        // Ensure reasonable aspect ratio for logos (horizontal preferred)
        const aspectRatio = cropWidth / cropHeight;
        if (aspectRatio < 1.5) {
            // Make more horizontal
            const targetHeight = cropWidth / 2;
            if (targetHeight < cropHeight) {
                cropHeight = Math.max(targetHeight, 25);
            }
        }
        
        // Generate ImageMagick crop string
        const crop = `${Math.round(cropWidth)}%x${Math.round(cropHeight)}%+${Math.round(cropLeft)}%+${Math.round(cropTop)}%`;
        
        // Calculate confidence based on analysis quality
        let confidence = 70; // Base confidence
        if (edgeAnalysis.method === 'edge-detection') confidence += 20;
        if (whitespaceAnalysis.method === 'pixel-sampling') confidence += 10;
        if (contentDensity.method === 'histogram-analysis') confidence += 10;
        
        // Reduce confidence if fallback methods were used
        if (edgeAnalysis.method === 'fallback-center') confidence -= 30;
        if (whitespaceAnalysis.method === 'fallback-estimate') confidence -= 20;
        
        return {
            crop,
            margins: { left: leftMargin, right: rightMargin, top: topMargin, bottom: bottomMargin },
            adjustedCrop: { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight },
            aspectRatio: Math.round(aspectRatio * 100) / 100,
            confidence: Math.max(30, Math.min(100, confidence)),
            reasoning: `Detected content: ${leftMargin}%,${topMargin}% to ${100-rightMargin}%,${100-bottomMargin}% | Utilization: ${contentUtilization.horizontal.toFixed(1)}%w×${contentUtilization.vertical.toFixed(1)}%h | Complexity: ${contentDensity.complexity} | Buffers: L${smartBuffer.left}% R${smartBuffer.right}% T${smartBuffer.top}% B${smartBuffer.bottom}%`
        };
    }

    /**
     * 🎯 Intelligent assessment: Is this logo already well-dimensioned and ready to use?
     */
    isLogoWellDimensioned(width, height, aspectRatio, contentAnalysis) {
        // Rule 1: Classic "small and horizontal" logos are usually pre-cropped
        if (aspectRatio >= 1.8 && aspectRatio <= 8 && height <= 200 && width <= 800) {
            return { 
                skip: true, 
                reason: `Compact horizontal logo (${width}x${height}, ratio ${aspectRatio.toFixed(2)}) - likely pre-cropped` 
            };
        }
        
        // Rule 2: If content analysis shows logo is using most of the image efficiently
        if (contentAnalysis && contentAnalysis.contentBounds && contentAnalysis.whitespaceAnalysis) {
            const bounds = contentAnalysis.contentBounds;
            const whitespace = contentAnalysis.whitespaceAnalysis;
            
            // Calculate content utilization
            const contentWidthUsage = (bounds.width / width) * 100;
            const contentHeightUsage = (bounds.height / height) * 100;
            
            // If logo uses >85% of width and has reasonable aspect ratio, it's likely well-cropped
            if (contentWidthUsage > 85 && aspectRatio >= 2.5 && aspectRatio <= 6) {
                return { 
                    skip: true, 
                    reason: `Efficient content usage (${contentWidthUsage.toFixed(1)}% width, ratio ${aspectRatio.toFixed(2)}) - no cropping needed` 
                };
            }
            
            // If logo has minimal whitespace on sides and good aspect ratio
            if (whitespace.leftWhitespace <= 20 && whitespace.rightWhitespace <= 20 && aspectRatio >= 2.2) {
                return { 
                    skip: true, 
                    reason: `Minimal side whitespace (L:${whitespace.leftWhitespace}% R:${whitespace.rightWhitespace}%) - already well-cropped` 
                };
            }
        }
        
        // Rule 3: Already horizontal logos with reasonable dimensions
        if (aspectRatio >= 2.5 && aspectRatio <= 6 && width >= 400 && height >= 100 && height <= 500) {
            return { 
                skip: true, 
                reason: `Well-proportioned horizontal logo (${width}x${height}, ratio ${aspectRatio.toFixed(2)}) - no improvement needed` 
            };
        }
        
        return { 
            skip: false, 
            reason: `Logo could benefit from cropping analysis` 
        };
    }

    /**
     * 🧠 Determines if a favicon is already well-sized and should skip resizing
     * @param {number} width - Original width
     * @param {number} height - Original height
     * @returns {Object} Decision object with skip boolean and reason
     */
    isFaviconWellSized(width, height) {
        // Favicons should be square or nearly square
        const aspectRatio = width / height;
        
        // Rule 1: Already optimal favicon sizes (common favicon dimensions)
        const optimalSizes = [16, 32, 48, 64, 96, 128, 152, 192, 256, 512];
        if (Math.abs(aspectRatio - 1) <= 0.1 && optimalSizes.includes(width) && optimalSizes.includes(height)) {
            return { 
                skip: true, 
                reason: `Already optimal favicon size (${width}x${height}) - no resizing needed` 
            };
        }
        
        // Rule 2: Large square favicons that are already good
        if (Math.abs(aspectRatio - 1) <= 0.1 && width >= 256 && width <= 1024) {
            return { 
                skip: true, 
                reason: `Good square favicon size (${width}x${height}) - already usable` 
            };
        }
        
        // Rule 3: Small square favicons that should stay small
        if (Math.abs(aspectRatio - 1) <= 0.1 && width >= 16 && width <= 128) {
            return { 
                skip: true, 
                reason: `Small favicon size (${width}x${height}) - preserving original size` 
            };
        }
        
        return { 
            skip: false, 
            reason: `Favicon could benefit from resizing to standard 512x512` 
        };
    }

    /**
     * 🎯 Site-specific intelligence: Skip all processing for sites with pre-optimized assets
     * @param {string} filename - File being processed
     * @returns {Object} Decision object with skip boolean and reason
     */
    shouldSkipSiteSpecificProcessing(filename) {
        // Qalyarab has pre-optimized assets that should not be processed
        if (this.siteId === 'qalyarab-3005' || (this.siteId && this.siteId.includes('qalyarab'))) {
            if (filename.includes('favicon') || filename.includes('logo')) {
                return { 
                    skip: true, 
                    reason: `Site-specific intelligence: Qalyarab assets are pre-optimized - no processing needed` 
                };
            }
        }
        
        return { 
            skip: false, 
            reason: `Site allows processing` 
        };
    }

    /**
     * 🧠 Calculate intelligent buffer sizes based on actual content analysis
     */
    calculateSmartBuffer(contentDensity, whitespaceAnalysis, contentUtilization) {
        // Base buffer starts small and adjusts based on analysis
        let baseBuffer = 2; // Start with 2% base buffer
        
        // Adjust based on content complexity
        if (contentDensity.complexity === 'high') {
            // Complex content needs more buffer to avoid cutting details
            baseBuffer += 3;
        } else if (contentDensity.complexity === 'medium') {
            baseBuffer += 1;
        }
        
        // Adjust based on content utilization
        if (contentUtilization.horizontal < 70) {
            // If content uses less than 70% of width, we can be more aggressive
            baseBuffer = Math.max(1, baseBuffer - 1);
        }
        if (contentUtilization.vertical < 50) {
            // If content uses less than 50% of height, we can be more aggressive
            baseBuffer = Math.max(1, baseBuffer - 1);
        }
        
        // Adjust each side based on detected whitespace
        const buffers = {
            left: baseBuffer,
            right: baseBuffer,
            top: baseBuffer,
            bottom: baseBuffer
        };
        
        // If we detected significant whitespace on a side, we can be more aggressive on that side
        if (whitespaceAnalysis.leftWhitespace > 80) {
            buffers.left = Math.max(1, buffers.left - 1);
        }
        if (whitespaceAnalysis.rightWhitespace > 80) {
            buffers.right = Math.max(1, buffers.right - 1);
        }
        if (whitespaceAnalysis.topWhitespace > 80) {
            buffers.top = Math.max(1, buffers.top - 1);
        }
        if (whitespaceAnalysis.bottomWhitespace > 80) {
            buffers.bottom = Math.max(1, buffers.bottom - 1);
        }
        
        // If we detected no whitespace on a side, be more conservative
        if (whitespaceAnalysis.leftWhitespace === 0) {
            buffers.left += 2;
        }
        if (whitespaceAnalysis.rightWhitespace === 0) {
            buffers.right += 2;
        }
        if (whitespaceAnalysis.topWhitespace === 0) {
            buffers.top += 2;
        }
        if (whitespaceAnalysis.bottomWhitespace === 0) {
            buffers.bottom += 2;
        }
        
        return buffers;
    }

    /**
     * 🔍 Determine if a pixel color represents whitespace
     */
    isWhitespacePixel(colorString) {
        if (!colorString || colorString === 'unknown') return false;
        
        // Handle various ImageMagick color formats
        if (colorString.includes('rgba(')) {
            // RGBA format - check for transparency or near-white
            const matches = colorString.match(/rgba?\((\d+),(\d+),(\d+)(?:,([0-9.]+))?\)/);
            if (matches) {
                const [, r, g, b, a] = matches;
                const alpha = a ? parseFloat(a) : 1;
                
                // Transparent or very transparent
                if (alpha < 0.1) return true;
                
                // Near white (RGB values > 240)
                if (parseInt(r) > 240 && parseInt(g) > 240 && parseInt(b) > 240) return true;
            }
        }
        
        // Handle hex colors
        if (colorString.startsWith('#')) {
            const hex = colorString.substring(1);
            if (hex.length === 6) {
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return r > 240 && g > 240 && b > 240;
            }
        }
        
        // Handle named colors
        const whiteColors = ['white', 'transparent', 'none', 'WhiteSmoke', 'Snow', 'Ivory'];
        return whiteColors.some(color => colorString.toLowerCase().includes(color.toLowerCase()));
    }

    /**
     * 🔍 Valide la qualité du cropping en comparant les dimensions avant/après
     * @param {string} beforeDims - Dimensions avant (ex: "1024x1024")  
     * @param {string} afterDims - Dimensions après (ex: "870x614")
     * @param {string} filename - Nom du fichier pour le rapport
     */
    validateCroppingQuality(beforeDims, afterDims, filename) {
        const [beforeW, beforeH] = beforeDims.split('x').map(Number);
        const [afterW, afterH] = afterDims.split('x').map(Number);
        
        const widthReduction = ((beforeW - afterW) / beforeW * 100).toFixed(1);
        const heightReduction = ((beforeH - afterH) / beforeH * 100).toFixed(1);
        const aspectRatioBefore = (beforeW / beforeH).toFixed(2);
        const aspectRatioAfter = (afterW / afterH).toFixed(2);
        
        console.log(`📊 Cropping Analysis for ${filename}:`);
        console.log(`   Before: ${beforeDims} (ratio: ${aspectRatioBefore})`);
        console.log(`   After:  ${afterDims} (ratio: ${aspectRatioAfter})`);
        console.log(`   Width reduced: ${widthReduction}% | Height reduced: ${heightReduction}%`);
        
        // Validation rules
        const issues = [];
        
        // Rule 1: Width should not be reduced by more than 15%
        if (parseFloat(widthReduction) > 15) {
            issues.push(`⚠️  Width over-cropped: ${widthReduction}% (max 15%)`);
        }
        
        // Rule 2: Height should be significantly reduced (at least 60% for square logos)
        if (aspectRatioBefore <= 1.2 && parseFloat(heightReduction) < 60) {
            issues.push(`⚠️  Height under-cropped: ${heightReduction}% (min 60% for square logos)`);
        }
        
        // Rule 3: Final aspect ratio should be horizontal (> 1.3)
        if (parseFloat(aspectRatioAfter) < 1.3) {
            issues.push(`⚠️  Final ratio too square: ${aspectRatioAfter} (should be > 1.3)`);
        }
        
        // Rule 4: Logo should not be too small (min 60px height for web)
        if (afterH < 60) {
            issues.push(`⚠️  Final height too small: ${afterH}px (min 60px for web)`);
        }
        
        if (issues.length > 0) {
            console.log(`❌ Cropping Quality Issues:`);
            issues.forEach(issue => console.log(`   ${issue}`));
            return { valid: false, issues };
        } else {
            console.log(`✅ Cropping quality OK`);
            return { valid: true, issues: [] };
        }
    }

    /**
     * Traite tous les logos et favicons d'un site
     */
    async processLogos(siteConfig, outputDir) {
        const siteId = siteConfig.meta?.siteId;
        const configDir = `/var/apps/logen/logen-site-configs/${siteId}/assets`;

        console.log('🖼️  Processing manual logos and favicons...');
        
        if (!(await fs.pathExists(configDir))) {
            console.log('ℹ️  No config assets directory found, skipping logo processing');
            return;
        }
        
        // Créer le dossier de sortie
        await fs.ensureDir(outputDir);
        
        // Lire tous les fichiers du config
        const files = await fs.readdir(configDir);
        
        for (const filename of files) {
            // Exclure les fichiers JSON et traiter seulement les images
            if ((filename.includes('logo') || filename.includes('favicon')) && 
                !filename.endsWith('.json')) {
                await this.processFile(filename, configDir, outputDir);
            } else if (filename.endsWith('.json')) {
                // Copier les fichiers JSON sans traitement
                const sourcePath = path.join(configDir, filename);
                const outputPath = path.join(outputDir, filename);
                await fs.copy(sourcePath, outputPath);
                console.log(`✅ Copied config file: ${filename}`);
            }
        }
    }

    /**
     * Traite un fichier individuel
     */
    async processFile(filename, configDir, outputDir) {
        const sourcePath = path.join(configDir, filename);
        const outputPath = path.join(outputDir, filename);
        
        // Déterminer le type de fichier
        const isLogo = filename.includes('logo') && !filename.includes('original');
        const isFavicon = filename.includes('favicon') && !filename.includes('original');
        const isOriginal = filename.includes('original');
        
        if (isLogo) {
            await this.processLogo(filename, configDir, outputDir);
        } else if (isFavicon) {
            await this.processFavicon(filename, configDir, outputDir);
        } else {
            // Copie simple pour les fichiers originaux ou autres
            await fs.copy(sourcePath, outputPath);
            console.log(`✅ Copied: ${filename}`);
        }
    }

    /**
     * 🎯 Détermine le type de logo et les paramètres adaptatifs
     */
    getAdaptiveCropParams(filename, width, height, aspectRatio) {
        const logoType = this.detectLogoType(filename);
        let baseParams = this.logoParams[logoType] || this.logoParams.default;
        
        // 🧠 ADAPTATION INTELLIGENTE selon la taille et ratio
        let adaptedParams = { ...baseParams };
        
        // Pour les logos très larges (ratio > 4:1), crop moins agressif
        if (aspectRatio > 4) {
            console.log(`🔍 Logo très large détecté (ratio: ${aspectRatio.toFixed(2)}), adaptation du crop`);
            adaptedParams.crop = logoType === 'navbar' ? '94%x40%+3%+8%' : '98%x50%+1%+5%';
        }
        // 🔄 V4.60 - PAS d'adaptation pour les logos carrés, utiliser V4.57
        else if (aspectRatio < 1.5) {
            console.log(`🔍 Logo carré/vertical détecté (ratio: ${aspectRatio.toFixed(2)}) - utilisation V4.57`);
            // Utiliser les paramètres de base V4.57 (pas d'override)
        }
        // Pour les très gros logos (> 800px), crop plus conservateur
        else if (width > 800 || height > 600) {
            console.log(`🔍 Logo haute résolution détecté (${width}x${height}), crop conservateur`);
            const widthCrop = logoType === 'navbar' ? '96%' : '98%';
            const heightCrop = logoType === 'navbar' ? '50%' : '60%';
            adaptedParams.crop = `${widthCrop}x${heightCrop}+${(100 - parseInt(widthCrop))/2}%+5%`;
        }
        
        return {
            ...adaptedParams,
            logoType,
            originalRatio: aspectRatio,
            originalSize: `${width}x${height}`
        };
    }
    
    /**
     * 🔍 Détecte le type de logo depuis le nom de fichier
     */
    detectLogoType(filename) {
        const lowerName = filename.toLowerCase();
        
        if (lowerName.includes('navbar') || lowerName.includes('nav') || lowerName.includes('clair')) {
            return 'navbar';
        }
        if (lowerName.includes('footer') || lowerName.includes('sombre') || lowerName.includes('dark')) {
            return 'footer';
        }
        
        // Détection par pattern de nom : siteId-logo-type.png
        const parts = lowerName.split('-');
        if (parts.includes('clair')) return 'navbar';
        if (parts.includes('sombre')) return 'footer';
        
        return 'default';
    }

    /**
     * Traite un logo avec adaptation intelligente V4.59
     */
    async processLogo(filename, configDir, outputDir) {
        const outputPath = path.join(outputDir, filename);
        
        // Chercher d'abord la version originale
        const originalFilename = filename.replace('.png', '-original.png');
        const originalPath = path.join(configDir, originalFilename);
        
        // Utiliser l'original si disponible, sinon le fichier source
        const sourcePath = await fs.pathExists(originalPath) 
            ? originalPath 
            : path.join(configDir, filename);
        
        // Copier d'abord
        await fs.copy(sourcePath, outputPath);
        
        let cropParams = null; // Declare outside try block for wider scope
        
        // Skip processing if ImageMagick is not available
        if (!this.imageMagickAvailable) {
            console.log(`⏭️  Skipping processing for ${filename} - ImageMagick not available`);
            return;
        }

        try {
            // Vérifier les dimensions actuelles du logo
            const dimensionsCmd = `identify -format "%wx%h" "${outputPath}"`;
            const dimensions = execSync(dimensionsCmd, { encoding: 'utf8' }).trim();
            const [width, height] = dimensions.split('x').map(Number);
            const aspectRatio = width / height;
            
            console.log(`📐 Logo ${filename} dimensions: ${width}x${height}, aspect ratio: ${aspectRatio.toFixed(2)}`);
            
            // 🎯 CHECK FOR CUSTOM CROP PARAMETERS FIRST
            const customCropPath = path.join(configDir, 'logo-crop-params.json');
            let customParams = null;
            
            if (await fs.pathExists(customCropPath)) {
                try {
                    const customCropData = JSON.parse(await fs.readFile(customCropPath, 'utf8'));
                    // Find the latest version (highest version number)
                    const versions = Object.keys(customCropData).filter(k => k.startsWith('v'));
                    if (versions.length > 0) {
                        const latestVersion = versions.sort().pop();
                        customParams = customCropData[latestVersion];
                        console.log(`📋 Found custom crop parameters: ${latestVersion} - ${customParams.description}`);
                        console.log(`📋 Custom crop: ${customParams.crop}`);
                    }
                } catch (error) {
                    console.log(`⚠️  Could not parse custom crop parameters: ${error.message}`);
                }
            }
            
            // 🎯 PRIORITY SYSTEM: Custom params FIRST, then intelligent analysis
            if (customParams && customParams.crop) {
                // Use manually fine-tuned custom parameters (HIGHEST PRIORITY)
                cropParams = {
                    crop: customParams.crop,
                    description: `${customParams.description || 'Custom parameters'} (manually fine-tuned)`,
                    logoType: this.detectLogoType(filename),
                    originalRatio: aspectRatio,
                    originalSize: `${width}x${height}`,
                    analysisMethod: 'custom-parameters-priority'
                };
                console.log(`🎯 Using custom crop parameters for ${filename} (manually fine-tuned)`);
                console.log(`📋 Custom crop: ${customParams.crop}`);
            }
            // 🧠 INTELLIGENT CONTENT ANALYSIS (fallback when no custom params)
            else {
                const contentAnalysis = await this.analyzeImageContent(outputPath, width, height);
                
                if (contentAnalysis.confidence > 70 && contentAnalysis.recommendedCrop) {
                    // Use AI-analyzed crop parameters
                    cropParams = {
                        crop: contentAnalysis.recommendedCrop.crop,
                        description: `Intelligent analysis (${contentAnalysis.confidence}% confidence): ${contentAnalysis.recommendedCrop.reasoning}`,
                        logoType: this.detectLogoType(filename),
                        originalRatio: aspectRatio,
                        originalSize: `${width}x${height}`,
                        analysisMethod: 'intelligent-content-analysis',
                        contentBounds: contentAnalysis.contentBounds,
                        whitespace: contentAnalysis.whitespaceAnalysis,
                        density: contentAnalysis.contentDensity
                    };
                    console.log(`🧠 Using intelligent content analysis for ${filename}`);
                    console.log(`🎯 Analysis confidence: ${contentAnalysis.confidence}%`);
                    console.log(`🎯 Content complexity: ${contentAnalysis.contentDensity?.complexity || 'unknown'}`);
                }
                // Fallback to adaptive logic
                else {
                    // 🎯 LOGIQUE ADAPTATIVE V4.59
                    cropParams = this.getAdaptiveCropParams(filename, width, height, aspectRatio);
                    cropParams.analysisMethod = 'adaptive-metadata';
                    console.log(`🎯 Logo type détecté: ${cropParams.logoType}`);
                    console.log(`🎯 Paramètres: ${cropParams.description}`);
                }
            }
            
            // 🎯 SITE-SPECIFIC INTELLIGENCE: Check if site has pre-optimized assets (highest priority)
            const siteSpecificSkip = this.shouldSkipSiteSpecificProcessing(filename);
            
            if (siteSpecificSkip.skip) {
                console.log(`✅ Logo ${filename} skipped - ${siteSpecificSkip.reason}`);
                console.log(`🎯 Site-Specific Intelligence Summary:`);
                console.log(`   • ${siteSpecificSkip.reason}`);
                console.log(`   • Original file preserved without any processing`);
                return;
            }
            
            // 🎯 INTELLIGENT DECISION: Skip cropping if logo is already well-dimensioned
            const contentAnalysisForCheck = cropParams.analysisMethod === 'intelligent-content-analysis' ? 
                { contentBounds: cropParams.contentBounds, whitespaceAnalysis: cropParams.whitespace } : null;
            const isWellDimensioned = this.isLogoWellDimensioned(width, height, aspectRatio, contentAnalysisForCheck);
            
            if (isWellDimensioned.skip) {
                console.log(`✅ Logo ${filename} already well dimensioned - ${isWellDimensioned.reason}`);
                console.log(`   Aspect ratio: ${aspectRatio.toFixed(2)}, dimensions: ${width}x${height}`);
                if (cropParams.analysisMethod === 'intelligent-content-analysis') {
                    console.log(`🧠 Intelligent Analysis Summary:`);
                    console.log(`   • Content analysis performed but cropping deemed unnecessary`);
                    console.log(`   • ${isWellDimensioned.reason}`);
                }
            } else {
                // Appliquer le cropping adaptatif
                console.log(`🔧 APPLYING ADAPTIVE CROP to ${filename} with: ${cropParams.crop}`);
                console.log(`🔧 Command: convert "${outputPath}" -gravity center -crop ${cropParams.crop} +repage "${outputPath}"`);
                
                try {
                    execSync(
                        `convert "${outputPath}" -gravity center -crop ${cropParams.crop} +repage "${outputPath}"`,
                        { stdio: 'inherit' }
                    );
                    console.log(`✅ Successfully applied adaptive crop for ${cropParams.logoType} logo`);
                    
                    // 🔍 Valider la qualité du cropping
                    const finalDimensionsCmd = `identify -format "%wx%h" "${outputPath}"`;
                    const finalDimensions = execSync(finalDimensionsCmd, { encoding: 'utf8' }).trim();
                    const qualityResult = this.validateCroppingQuality(dimensions, finalDimensions, filename);
                    
                    // 📊 Additional reporting for intelligent analysis
                    if (cropParams.analysisMethod === 'intelligent-content-analysis') {
                        console.log(`🧠 Intelligent Analysis Summary:`);
                        console.log(`   • Method: ${cropParams.analysisMethod}`);
                        console.log(`   • Content bounds detected: ${cropParams.contentBounds?.width}x${cropParams.contentBounds?.height}`);
                        console.log(`   • Whitespace: T:${cropParams.whitespace?.topWhitespace}% B:${cropParams.whitespace?.bottomWhitespace}% L:${cropParams.whitespace?.leftWhitespace}% R:${cropParams.whitespace?.rightWhitespace}%`);
                        console.log(`   • Content density: ${cropParams.density?.density}% (${cropParams.density?.complexity})`);
                        console.log(`   • Crop quality: ${qualityResult.valid ? '✅ Excellent' : '⚠️ Needs adjustment'}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to crop ${filename}:`, error.message);
                }
            }
            
            // Redimensionner seulement si maxHeight est défini
            if (this.logoParams.maxHeight) {
                console.log(`📏 Resizing ${filename} to max height: ${this.logoParams.maxHeight}px`);
                execSync(
                    `convert "${outputPath}" -resize x${this.logoParams.maxHeight} "${outputPath}"`,
                    { stdio: 'inherit' }
                );
                console.log(`✅ Processed logo: ${filename} (height: max ${this.logoParams.maxHeight}px)`);
            } else {
                const logoType = cropParams ? cropParams.logoType : 'unknown';
                console.log(`✅ Processed ${logoType} logo: ${filename} (adaptive crop applied, CSS handles sizing)`);
            }
        } catch (error) {
            if (error.message.includes('identify') || error.message.includes('convert')) {
                console.log(`❌ ImageMagick not available for ${filename}:`, error.message);
                console.log(`💡 To enable smart cropping, install ImageMagick:`);
                console.log(`   Ubuntu/Debian: sudo apt-get install imagemagick`);
                console.log(`   CentOS/RHEL: sudo yum install ImageMagick`);
                console.log(`   macOS: brew install imagemagick`);
                console.log(`   Windows: Download from https://imagemagick.org/script/download.php#windows`);
            } else {
                console.log(`❌ Unexpected error for ${filename}:`, error.message);
            }
            console.log(`✅ Copied logo: ${filename} (using original without processing)`);
        }
    }

    /**
     * Traite un favicon (applique cropping et resize)
     */
    async processFavicon(filename, configDir, outputDir) {
        const sourcePath = path.join(configDir, filename);
        const outputPath = path.join(outputDir, filename);
        
        await fs.copy(sourcePath, outputPath);
        
        // Ne pas traiter les fichiers .ico
        if (filename.endsWith('.ico')) {
            console.log(`✅ Copied favicon: ${filename}`);
            return;
        }
        
        // Skip processing if ImageMagick is not available
        if (!this.imageMagickAvailable) {
            console.log(`⏭️  Skipping favicon processing for ${filename} - ImageMagick not available`);
            return;
        }
        
        try {
            // 🎯 SITE-SPECIFIC INTELLIGENCE: Check if site has pre-optimized assets
            const siteSpecificSkip = this.shouldSkipSiteSpecificProcessing(filename);
            
            if (siteSpecificSkip.skip) {
                console.log(`✅ Favicon ${filename} skipped - ${siteSpecificSkip.reason}`);
                console.log(`🎯 Site-Specific Intelligence Summary:`);
                console.log(`   • ${siteSpecificSkip.reason}`);
                console.log(`   • Original file preserved without any processing`);
                return;
            }
            
            // Get favicon dimensions for intelligent sizing
            const dimensions = execSync(`identify -format "%wx%h" "${outputPath}"`, { encoding: 'utf-8' }).trim();
            const [width, height] = dimensions.split('x').map(Number);
            
            console.log(`📐 Favicon ${filename} dimensions: ${width}x${height}`);
            
            // 🧠 INTELLIGENT SIZING: Check if favicon is already well-sized
            const isWellSized = this.isFaviconWellSized(width, height);
            
            if (isWellSized.skip) {
                console.log(`✅ Favicon ${filename} already well sized - ${isWellSized.reason}`);
                console.log(`🧠 Intelligent Analysis Summary:`);
                console.log(`   • Size analysis performed but processing deemed unnecessary`);
                console.log(`   • ${isWellSized.reason}`);
                return;
            }
            
            console.log(`🧠 Favicon processing needed: ${isWellSized.reason}`);
            
            // Rogner pour enlever l'espace vide
            console.log(`🔧 Cropping favicon ${filename} with: ${this.faviconParams.crop}`);
            execSync(
                `convert "${outputPath}" -gravity center -crop ${this.faviconParams.crop} +repage "${outputPath}"`,
                { stdio: 'inherit' }
            );
            
            // Redimensionner à la taille standard
            console.log(`📏 Resizing favicon ${filename} to: ${this.faviconParams.size}x${this.faviconParams.size}`);
            execSync(
                `convert "${outputPath}" -resize ${this.faviconParams.size}x${this.faviconParams.size} "${outputPath}"`,
                { stdio: 'inherit' }
            );
            
            console.log(`✅ Processed favicon: ${filename} (${this.faviconParams.size}x${this.faviconParams.size})`);
        } catch (error) {
            console.log(`❌ ImageMagick error for favicon ${filename}:`, error.message);
            console.log(`✅ Copied favicon: ${filename} (using original without processing)`);
        }
    }
}

// Export pour utilisation dans d'autres modules
export { LogoProcessor };

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
    async function main() {
        const [,, configPath, outputDir] = process.argv;
        
        if (!configPath || !outputDir) {
            console.error('Usage: node logo-processor.js <configPath> <outputDir>');
            process.exit(1);
        }
        
        const processor = new LogoProcessor();
        const siteConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
        
        await processor.processLogos(siteConfig, outputDir);
        console.log('🎉 Logo processing completed!');
    }
    
    main().catch(console.error);
}