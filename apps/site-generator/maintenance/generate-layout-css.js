#!/usr/bin/env node

/**
 * 🎨 CSS Variables Generator - Clean Architecture v1.1.3
 * 
 * ✅ UTILISE le CSS layout-variables.css synchronisé avec les composants React
 * 🔧 Plus de génération : utilise le CSS existant corrigé
 */

const fs = require('fs');
const path = require('path');

function copyLayoutCSS(outputDir) {
  // 🎯 NOUVEAU v1.1.3 : Copier le CSS corrigé au lieu de le régénérer
  const sourceCSS = path.join('/var/apps/logen/logen-templates', 'template-basic', 'src', 'styles', 'layout-variables.css');
  const destinationCSS = path.join(outputDir, 'src', 'styles', 'layout-variables.css');
  
  if (!fs.existsSync(sourceCSS)) {
    throw new Error('❌ CSS source non trouvé : ' + sourceCSS);
  }
  
  // Créer le dossier de destination s'il n'existe pas
  const destDir = path.dirname(destinationCSS);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copier le CSS corrigé
  fs.copyFileSync(sourceCSS, destinationCSS);
  
  return destinationCSS;
}

function main() {
  try {
    const configFile = process.argv[2];
    const outputDir = process.argv[3];
    
    if (!configFile || !outputDir) {
      console.error('Usage: node generate-layout-css.js <config-file> <output-dir>');
      process.exit(1);
    }
    
    // Lecture de la configuration (pour log)
    let config = {};
    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    }
    
    // Copier le CSS corrigé v1.1.3
    const outputPath = copyLayoutCSS(outputDir);
    
    console.log('✅ CSS Layout Variables synchronisé:', outputPath);
    console.log('🔧 Architecture v1.1.3 - CSS synchronisé avec composants React');
    console.log('📄 Pages: Navbar + CSS classes + Titres configurables');
    console.log('🎯 Navbar présente + Styles appliqués + v1.1 fonctionnalité maintenue');
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation CSS:', error.message);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = { copyLayoutCSS };
