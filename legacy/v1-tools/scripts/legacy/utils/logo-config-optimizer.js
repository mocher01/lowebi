#!/usr/bin/env node
/**
 * 🎨 Logo Configuration Optimizer
 * 
 * Optimise automatiquement la configuration des logos selon les bonnes pratiques :
 * - Navbar : Logo clair pour être visible sur fond de couleur
 * - Footer : Logo sombre pour être visible sur fond clair
 * - Default : Logo clair comme référence principale
 */

/**
 * Optimise la configuration des logos pour un site
 */
function optimizeLogoConfig(siteConfig) {
    if (!siteConfig.brand?.logos) {
        return siteConfig; // Pas de logos configurés
    }

    const logos = siteConfig.brand.logos;
    const siteId = siteConfig.meta?.siteId || 'website';
    
    // Configuration optimisée selon les bonnes pratiques UX/UI
    const optimizedLogos = {
        // Navbar : Logo clair pour contraster avec le fond coloré de la navbar
        navbar: logos.navbar || `${siteId}-logo-clair.png`,
        
        // Footer : Logo sombre pour contraster avec le fond généralement clair
        footer: logos.footer || `${siteId}-logo-sombre.png`,
        
        // Default : Logo clair comme référence principale
        default: logos.default || `${siteId}-logo-clair.png`
    };

    // Mettre à jour la configuration
    const updatedConfig = {
        ...siteConfig,
        brand: {
            ...siteConfig.brand,
            logos: optimizedLogos
        }
    };

    return updatedConfig;
}

/**
 * Détecte la couleur de fond de la navbar pour choisir le bon logo
 */
function getOptimalNavbarLogo(siteConfig) {
    const navbarBg = siteConfig.navbar?.background || siteConfig.brand?.colors?.primary;
    const siteId = siteConfig.meta?.siteId || 'website';
    
    // Si le fond de la navbar est sombre, utiliser le logo clair
    // Si le fond est clair, utiliser le logo sombre
    if (navbarBg) {
        // Convertir hex en luminosité (approximation simple)
        const hex = navbarBg.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Si sombre (luminosité < 0.5), utiliser logo clair
        return luminosity < 0.5 ? `${siteId}-logo-clair.png` : `${siteId}-logo-sombre.png`;
    }
    
    // Par défaut, utiliser le logo clair (plus versatile)
    return `${siteId}-logo-clair.png`;
}

module.exports = { optimizeLogoConfig, getOptimalNavbarLogo };

// CLI usage
if (require.main === module) {
    async function main() {
        const [,, configPath] = process.argv;
        
        if (!configPath) {
            console.error('Usage: node logo-config-optimizer.js <config-path>');
            process.exit(1);
        }
        
        const fs = require('fs-extra');
        
        try {
            const siteConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
            const optimizedConfig = optimizeLogoConfig(siteConfig);
            
            console.log('🎨 Logo configuration optimized:');
            console.log('  • Navbar:', optimizedConfig.brand.logos.navbar);
            console.log('  • Footer:', optimizedConfig.brand.logos.footer);
            console.log('  • Default:', optimizedConfig.brand.logos.default);
            
            // Optionnel : sauvegarder la config optimisée
            if (process.argv.includes('--save')) {
                await fs.writeFile(configPath, JSON.stringify(optimizedConfig, null, 2));
                console.log('✅ Configuration sauvegardée');
            }
            
        } catch (error) {
            console.error('❌ Erreur:', error.message);
            process.exit(1);
        }
    }
    
    main();
}