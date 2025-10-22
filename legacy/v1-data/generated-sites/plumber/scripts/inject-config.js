#!/usr/bin/env node

/**
 * Script pour injecter la configuration dans le template
 * Usage: node inject-config.js <site-name>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function injectConfig(siteName) {
  console.log(`🔧 Injecting config for site: ${siteName}`);
  
  // Lire la configuration du site
  const configPath = path.join(__dirname, '..', '..', 'configs', siteName, 'site-config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log(`✅ Config loaded for ${config.brand.name}`);
  
  // Créer le dossier de config
  const configDir = path.join(__dirname, '..', 'src', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Écrire la config dans le template
  fs.writeFileSync(
    path.join(configDir, 'site.json'),
    JSON.stringify(config, null, 2)
  );
  
  // Injecter les variables dans index.html
  injectIndexHtml(config);
  
  // Copier les assets
  copyAssets(siteName, config);
  
  console.log(`🎉 Configuration injected successfully!`);
}

function injectIndexHtml(config) {
  const indexPath = path.join(__dirname, '..', 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Remplacer les variables
  const replacements = {
    '{{SITE_TITLE}}': config.seo.title,
    '{{SITE_DESCRIPTION}}': config.seo.description,
    '{{SITE_CANONICAL}}': `https://${config.meta.domain}`,
    '{{SITE_OG_IMAGE}}': `/assets/${config.seo.ogImage}`,
    '{{SITE_FAVICON}}': `/assets/${config.brand.favicon}`,
    '{{SITE_APPLE_ICON}}': `/assets/${config.brand.logo}`
  };
  
  Object.entries(replacements).forEach(([placeholder, value]) => {
    indexContent = indexContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ index.html updated');
}

function copyAssets(siteName, config) {
  const srcAssetsPath = path.join(__dirname, '..', '..', 'configs', siteName, 'assets');
  const destAssetsPath = path.join(__dirname, '..', 'public', 'assets');
  
  if (fs.existsSync(srcAssetsPath)) {
    // Créer le dossier de destination
    if (!fs.existsSync(destAssetsPath)) {
      fs.mkdirSync(destAssetsPath, { recursive: true });
    }
    
    // Copier récursivement les assets
    copyDir(srcAssetsPath, destAssetsPath);
    console.log('✅ Assets copied');
  } else {
    console.warn('⚠️ No assets directory found');
  }
}

function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Exécution
const siteName = process.argv[2];
if (!siteName) {
  console.error('Usage: node inject-config.js <site-name>');
  process.exit(1);
}

injectConfig(siteName);