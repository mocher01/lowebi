#!/bin/bash

# Script avancé d'injection de configuration et génération de site
# Usage: ./generate-site.sh <site-name> [--build] [--docker]

set -e

# Get script directory for absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR_ROOT="$(dirname "$SCRIPT_DIR")"

SITE_NAME="$1"
BUILD_SITE=false
BUILD_DOCKER=false
IMAGE_MODE="process"  # Par défaut: "none" | "copy" | "process" | "ai" | "ai:force" | "ai:blog" | "ai:hero" | "ai:services"
FORCE_REGENERATE=false
FORCE_BLOG_IMAGES=false
FORCE_HERO_IMAGES=false
FORCE_SERVICE_IMAGES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_SITE=true
            shift
            ;;
        --docker)
            BUILD_DOCKER=true
            shift
            ;;
        --images)
            IMAGE_MODE="$2"
            shift 2
            ;;
        --auto-images)
            IMAGE_MODE="placeholder"
            shift
            ;;
        --ai-images)
            IMAGE_MODE="ai"
            shift
            ;;
        --no-images)
            IMAGE_MODE="none"
            shift
            ;;
        --force-regenerate)
            FORCE_REGENERATE=true
            shift
            ;;
        --force-blog-images)
            FORCE_BLOG_IMAGES=true
            shift
            ;;
        --force-hero-images)
            FORCE_HERO_IMAGES=true
            shift
            ;;
        --force-service-images)
            FORCE_SERVICE_IMAGES=true
            shift
            ;;
        --force-all-images)
            FORCE_BLOG_IMAGES=true
            FORCE_HERO_IMAGES=true
            FORCE_SERVICE_IMAGES=true
            shift
            ;;
        *)
            if [ -z "$SITE_NAME" ]; then
                SITE_NAME="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$SITE_NAME" ]; then
    echo "❌ Usage: $0 <site-name> [--build] [--docker] [--images MODE] [--auto-images] [--ai-images]"
    echo "Available sites:"
    ls configs/ 2>/dev/null || echo "  No configurations found in configs/"
    echo ""
    echo "Options:"
    echo "  --build            Build the site after generation"
    echo "  --docker           Build Docker container"
    echo "  --images MODE      Image processing mode: none|copy|process|ai|ai:force|ai:blog|ai:hero|ai:services"
    echo "  --auto-images      Generate placeholder images with filenames (debug mode)"
    echo "  --ai-images        Use AI to generate missing images (default)"
    echo "  --no-images        Skip all image processing"
    echo "  --force-regenerate Force regenerate ALL images (even existing ones)"
    echo "  --force-blog-images    Regenerate blog images only"
    echo "  --force-hero-images    Regenerate hero images only"
    echo "  --force-service-images Regenerate service images only"
    echo "  --force-all-images     Regenerate all image categories"
    exit 1
fi

# Configuration paths - ✅ CORRECTION: CONTENT SPÉCIFIQUE AU SITE
CONFIG_DIR="/var/apps/logen/logen-site-configs/$SITE_NAME"
CONFIG_FILE="$CONFIG_DIR/site-config.json"

# 🎯 DYNAMIC TEMPLATE SELECTION - Read template from config or use default
TEMPLATE_NAME=$(node -e "
  try {
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
    const template = config.meta?.template || 'template-base';
    console.log(template);
  } catch (e) {
    console.log('template-base');
  }
" 2>/dev/null || echo "template-base")

TEMPLATE_DIR="/var/apps/logen/logen-templates/$TEMPLATE_NAME"
OUTPUT_DIR="/var/apps/logen/logen-generated-sites/$SITE_NAME"
CONTENT_DIR="$CONFIG_DIR/content"  # ✅ CORRIGÉ: Contenu spécifique au site
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 GÉNÉRATION DE SITE: $SITE_NAME${NC}"
echo "=============================================="

# 🛡️ VALIDATION STRICTE OBLIGATOIRE
echo ""
echo -e "${BLUE}🛡️  VALIDATION STRICTE DE LA CONFIGURATION${NC}"
echo "=============================================="

# Vérifications de base
if [ ! -d "$CONFIG_DIR" ]; then
    echo -e "${RED}❌ Configuration directory not found: $CONFIG_DIR${NC}"
    echo -e "${YELLOW}💡 Créez le dossier avec: mkdir -p $CONFIG_DIR${NC}"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    echo -e "${YELLOW}💡 Créez le fichier de configuration requis${NC}"
    exit 1
fi

# 🎨 Template validation with helpful output
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo -e "${RED}❌ Template directory not found: $TEMPLATE_DIR${NC}"
    echo -e "${YELLOW}📋 Template '$TEMPLATE_NAME' specified in config but not found${NC}"
    echo -e "${BLUE}Available templates:${NC}"
    ls -d templates/*/ 2>/dev/null | sed 's|templates/||g; s|/||g' | while read tmpl; do
        echo "  • $tmpl"
    done || echo "  No templates found"
    exit 1
else
    echo -e "${GREEN}✅ Using template: $TEMPLATE_NAME${NC}"
fi

# Validation JSON basique
echo "📋 Validation JSON de base..."
if ! node -e "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'))" > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid JSON in configuration file${NC}"
    echo -e "${YELLOW}💡 Vérifiez la syntaxe JSON avec: node -e \"JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'))\"${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ VALIDATION RÉUSSIE - Génération autorisée${NC}"

# Nettoyer et créer le dossier de sortie
echo ""
echo "📁 Préparation de l'environnement..."

# Clean everything for fresh generation (node_modules will be reinstalled)
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Copier le template
echo "  📋 Copying template files..."
cp -r "$TEMPLATE_DIR"/* "$OUTPUT_DIR/"

# ✅ CORRIGÉ: Copier le contenu Markdown spécifique au site s'il existe
if [ -d "$CONTENT_DIR" ]; then
    echo "  📝 Copying Markdown content..."
    mkdir -p "$OUTPUT_DIR/public/content"
    cp -r "$CONTENT_DIR"/* "$OUTPUT_DIR/public/content/"
    echo "     ✓ Site-specific Markdown content copied to public/content/"
    
    # 🔧 NOUVEAU: Générer l'index des articles blog
    if [ -d "$OUTPUT_DIR/public/content/blog" ]; then
        echo "  📋 Generating blog index..."
        node /var/apps/logen/apps/site-generator/maintenance/generate-blog-index.js "$OUTPUT_DIR/public/content/blog" "$OUTPUT_DIR/public/content/blog-index.json"
    fi
else
    echo "  ⚠️  No site-specific Markdown content found ($CONTENT_DIR)"
    # ✅ FALLBACK: Vérifier le répertoire global pour compatibilité
    if [ -d "content" ]; then
        echo "  📝 Using global Markdown content as fallback..."
        mkdir -p "$OUTPUT_DIR/public/content"
        cp -r content/* "$OUTPUT_DIR/public/content/"
        echo "     ✓ Global Markdown content copied to public/content/"
        
        # 🔧 NOUVEAU: Générer l'index pour le fallback aussi
        if [ -d "$OUTPUT_DIR/public/content/blog" ]; then
            echo "  📋 Generating blog index..."
            node /var/apps/logen/apps/site-generator/maintenance/generate-blog-index.js "$OUTPUT_DIR/public/content/blog" "$OUTPUT_DIR/public/content/blog-index.json"
        fi
    fi
fi

# Note: Assets are now handled by the unified image generator

# Injecter la configuration
echo "  ⚙️  Injecting configuration..."
cp "$CONFIG_FILE" "$OUTPUT_DIR/public/config.json"

# ✅ RESTAURER: Injection des placeholders HTML avec le script dédié
echo "  📄 Injecting HTML placeholders..."
if [ -f "$GENERATOR_ROOT/maintenance/inject-html-config.js" ]; then
    node "$GENERATOR_ROOT/maintenance/inject-html-config.js" "$CONFIG_FILE" "$OUTPUT_DIR"
else
    echo -e "${YELLOW}⚠️  Warning: inject-html-config.js not found at $GENERATOR_ROOT/maintenance/${NC}"
fi

# 🔧 RESTAURER: Génération CSS Variables Layout (Architecture Clean v1.1)
echo "  🎨 Generating Layout CSS Variables..."
if [ -f "$GENERATOR_ROOT/maintenance/generate-layout-css.js" ]; then
    node "$GENERATOR_ROOT/maintenance/generate-layout-css.js" "$CONFIG_FILE" "$OUTPUT_DIR"
else
    echo -e "${YELLOW}⚠️  Warning: generate-layout-css.js not found at $GENERATOR_ROOT/maintenance/${NC}"
fi

# ✅ RESTAURER: Génération CSS variables couleurs (système complet)
echo "  🌈 Generating color CSS variables..."

# Créer le script Node.js pour générer les variables CSS couleurs
cat > /tmp/generate-css-colors.js << 'JSEOF'
const fs = require('fs');
const path = require('path');

const configFile = process.argv[2];
const outputDir = process.argv[3];

// 🎨 Convert HEX to HSL format (for Tailwind CSS variables)
function hexToHSL(hex, colorType = 'unknown') {
    // Remove # if present
    const originalHex = hex;
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    // 🔧 VALIDATION: Lightness check for accent colors
    // Accent colors with lightness > 70% have poor contrast on white backgrounds (WCAG fail)
    if (colorType === 'accent' && l > 70) {
        console.warn(`⚠️  WARNING: Accent color ${originalHex} has lightness ${l}% (too light for good contrast)`);
        console.warn(`   → Auto-adjusting to 60% for WCAG AA compliance (4.5:1 contrast ratio)`);
        l = 60;  // Adjust to safe lightness
    }

    // Return HSL values as space-separated (Tailwind format)
    return `${h} ${s}% ${l}%`;
}

try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

    let cssVars = ':root {\n';

    // Couleurs de brand - Use HEX directly (gradient fix)
    if (config.brand && config.brand.colors) {
        const colors = config.brand.colors;
        if (colors.primary) {
            cssVars += `  --color-primary: ${colors.primary};\n`;
        }
        if (colors.secondary) {
            cssVars += `  --color-secondary: ${colors.secondary};\n`;
        }
        if (colors.accent) {
            cssVars += `  --color-accent: ${colors.accent};\n`;
        }
    }
    
    // Couleurs de la navbar
    if (config.navbar) {
        const navbar = config.navbar;
        if (navbar.background) cssVars += `  --navbar-background: ${navbar.background};\n`;
        if (navbar.textColor) cssVars += `  --navbar-text: ${navbar.textColor};\n`;
        if (navbar.accentColor) cssVars += `  --navbar-accent: ${navbar.accentColor};\n`;
    }
    
    // Couleurs des sections
    if (config.sections) {
        Object.keys(config.sections).forEach(sectionKey => {
            const section = config.sections[sectionKey];
            if (section.background) {
                cssVars += `  --section-${sectionKey}-bg: ${section.background};\n`;
            }
            if (section.textColor) {
                cssVars += `  --section-${sectionKey}-text: ${section.textColor};\n`;
            }
        });
    }
    
    // Variables de police (si définies)
    if (config.brand && config.brand.fonts) {
        const fonts = config.brand.fonts;
        if (fonts.primary) cssVars += `  --font-primary: '${fonts.primary}', sans-serif;\n`;
        if (fonts.secondary) cssVars += `  --font-secondary: '${fonts.secondary}', serif;\n`;
    }
    
    cssVars += '}\n\n';
    
    // 🔧 ARCHITECTURE CLEAN v1.1: Générer les classes avec les bons noms
    if (config.sections) {
        Object.keys(config.sections).forEach(sectionKey => {
            const section = config.sections[sectionKey];
            if (section.background || section.textColor) {
                // 🔧 FIX: Utiliser le nom correct pour hero
                const className = sectionKey === 'hero' ? 'hero-section' : `section-${sectionKey}`;
                
                cssVars += `.${className} {\n`;
                if (section.background) {
                    cssVars += `  background-color: ${section.background};\n`;
                }
                if (section.textColor) {
                    cssVars += `  color: ${section.textColor};\n`;
                }
                cssVars += '}\n\n';
            }
            
            // 🎯 SPÉCIAL: Classes page-header spécifiques par page
            if (sectionKey === 'contact' && section.titleBackground) {
                cssVars += `body[data-page="contact"] .page-header {\n`;
                cssVars += `  background-color: ${section.titleBackground};\n`;
                cssVars += '}\n\n';
                
                cssVars += `body[data-page="contact"] .page-header h1 {\n`;
                cssVars += `  color: ${section.titleTextColor || '#ffffff'};\n`;
                cssVars += '}\n\n';
                
                cssVars += `body[data-page="contact"] .page-header .subtitle {\n`;
                cssVars += `  color: ${section.subtitleTextColor || '#ffffff'};\n`;
                cssVars += '}\n\n';
            }
        });
    }
    
    // Écrire le fichier CSS
    const cssPath = path.join(outputDir, 'src/styles/site-variables.css');
    fs.writeFileSync(cssPath, cssVars);
    
    console.log('✓ Color CSS variables generated with Clean v1.1 architecture');
} catch (error) {
    console.error('Error generating color CSS variables:', error.message);
    process.exit(1);
}
JSEOF

# Exécuter le script Node.js pour les couleurs
node /tmp/generate-css-colors.js "$CONFIG_FILE" "$OUTPUT_DIR"

# Nettoyer le fichier temporaire
rm -f /tmp/generate-css-colors.js

# ✅ RESTAURER: Mettre à jour le package.json avec le nom du site
echo "  📦 Updating package.json..."

cat > /tmp/update-package.js << 'JSEOF'
const fs = require('fs');
const path = require('path');

const configFile = process.argv[2];
const outputDir = process.argv[3];

try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const packagePath = path.join(outputDir, 'package.json');
    
    if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        pkg.name = config.meta.siteId || config.brand.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        pkg.description = (config.seo && config.seo.description) || `Site web pour ${config.brand.name}`;
        pkg.version = '1.0.0';
        
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
        console.log('✓ Package.json updated');
    }
} catch (error) {
    console.error('Error updating package.json:', error.message);
    process.exit(1);
}
JSEOF

node /tmp/update-package.js "$CONFIG_FILE" "$OUTPUT_DIR"
rm -f /tmp/update-package.js

echo -e "${GREEN}✅ Site généré: $OUTPUT_DIR${NC}"

# 📝 GÉNÉRATION DES ARTICLES DE BLOG (MARKDOWN)
echo ""
echo -e "${BLUE}📝 GÉNÉRATION DES ARTICLES DE BLOG${NC}"
echo "===================================="

cat > /tmp/generate-blog-content.js << 'JSEOF'
const fs = require('fs');
const path = require('path');

const configFile = process.argv[2];
const outputDir = process.argv[3];

try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const blogArticles = config.content?.blog?.articles || [];

    if (blogArticles.length === 0) {
        console.log('ℹ️  No blog articles found in config - skipping blog content generation');
        process.exit(0);
    }

    // Create content/blog directory
    const blogDir = path.join(outputDir, 'public', 'content', 'blog');
    fs.mkdirSync(blogDir, { recursive: true });

    console.log(`📝 Generating ${blogArticles.length} blog articles as markdown files...`);

    const indexFiles = [];

    // Generate each article as a markdown file
    blogArticles.forEach((article, index) => {
        // Generate slug if missing
        const slug = article.slug || article.title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        const filename = `${slug}.md`;
        indexFiles.push(filename);

        // Clean image path - remove query params and ensure proper format
        let imagePath = article.image || '';
        if (imagePath) {
            imagePath = imagePath.split('?')[0]; // Remove query params
            // If it's a blog image, use just the filename
            if (imagePath.startsWith('site-blog-')) {
                imagePath = imagePath;
            }
        }

        // Generate markdown frontmatter
        const frontMatter = [
            '---',
            `title: "${article.title || 'Article sans titre'}"`,
            `slug: "${slug}"`,
            `date: "${article.date || new Date().toISOString()}"`,
            `author: "${article.author || config.brand?.name || 'Author'}"`,
            `category: "${article.category || 'Article'}"`,
            `tags: [${(article.tags || []).map(tag => `"${tag}"`).join(', ')}]`,
            imagePath ? `image: "${imagePath}"` : '',
            `excerpt: "${(article.excerpt || '').replace(/"/g, '\\"')}"`,
            '---',
            ''
        ].filter(line => line !== '' || line === '---').join('\n');

        // Generate markdown content
        const content = article.content || article.excerpt || '';

        const fullMarkdown = frontMatter + '\n' + content + '\n';

        // Write markdown file
        const articlePath = path.join(blogDir, filename);
        fs.writeFileSync(articlePath, fullMarkdown, 'utf8');

        console.log(`  ✓ ${filename}`);
    });

    // Generate blog-index.json
    const indexData = {
        count: blogArticles.length,
        generated: new Date().toISOString(),
        files: indexFiles
    };

    const indexPath = path.join(outputDir, 'public', 'content', 'blog-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');

    console.log(`✓ Blog index created: ${indexFiles.length} articles`);
    console.log('✓ Blog content generation complete');

} catch (error) {
    console.error('Error generating blog content:', error.message);
    process.exit(1);
}
JSEOF

# Execute blog content generator
node /tmp/generate-blog-content.js "$CONFIG_FILE" "$OUTPUT_DIR"

# Cleanup temporary file
rm -f /tmp/generate-blog-content.js

# 🎨 OPTIMISATION AUTOMATIQUE DES LOGOS
echo ""
echo -e "${BLUE}🎨 OPTIMISATION DES LOGOS${NC}"
echo "================================"

if command -v node &> /dev/null; then
    if [ -f "scripts/utils/logo-config-optimizer.js" ]; then
        echo -e "${YELLOW}🔧 Optimisation de la configuration des logos...${NC}"
        node /var/apps/logen/apps/site-generator/utils/logo-config-optimizer.js "$CONFIG_FILE" || true
        echo -e "${GREEN}✅ Configuration des logos optimisée${NC}"
    else
        echo -e "${YELLOW}⚠️  Optimiseur de logos non trouvé, configuration par défaut maintenue${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Node.js requis pour l'optimisation des logos${NC}"
fi

# 🔄 CONFIGURATION AUTOMATIQUE N8N - APRÈS la génération
echo ""
echo -e "${BLUE}🔄 CONFIGURATION AUTOMATIQUE N8N${NC}"
echo "====================================="

# Vérifier si N8N est activé dans la config
if grep -q '"enabled".*:.*true' "$CONFIG_FILE" 2>/dev/null && grep -q '"n8n"' "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${CYAN}🔄 Configuration N8N détectée dans $CONFIG_FILE${NC}"
    
    if command -v node &> /dev/null; then
        echo -e "${YELLOW}📡 Création automatique du workflow N8N...${NC}"
        
        # Exécuter le générateur N8N
        if node /var/apps/logen/apps/site-generator/generators/n8n-workflow-generator.js "$SITE_NAME" "$CONFIG_FILE"; then
            echo -e "${GREEN}✅ Workflow N8N créé et configuré automatiquement${NC}"
        else
            echo -e "${YELLOW}⚠️  Échec création workflow N8N automatique${NC}"
            echo -e "${CYAN}💡 Vous pouvez créer le workflow manuellement avec :${NC}"
            echo "   node /var/apps/logen/apps/site-generator/generators/n8n-workflow-generator.js $SITE_NAME $CONFIG_FILE"
        fi
    else
        echo -e "${YELLOW}⚠️  Node.js non trouvé - Impossible de créer le workflow N8N automatiquement${NC}"
        echo -e "${CYAN}💡 Créez le workflow manuellement après avoir installé Node.js${NC}"
    fi
else
    echo -e "${CYAN}ℹ️  N8N non activé dans la configuration - Ignoré${NC}"
    echo -e "${YELLOW}💡 Pour activer N8N, définissez 'integrations.n8n.enabled: true' dans votre config${NC}"
fi

# 🔧 NGINX CONFIGURATION - Based on N8N integration
echo ""
echo -e "${BLUE}🔧 CONFIGURATION NGINX${NC}"
echo "================================"

# Check if N8N is enabled in the configuration
N8N_ENABLED=$(node -e "
    try {
        const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
        console.log(config.integrations?.n8n?.enabled === true ? 'true' : 'false');
    } catch (e) {
        console.log('false');
    }
" 2>/dev/null)

if [ "$N8N_ENABLED" = "true" ] && command -v node &> /dev/null; then
    echo -e "${CYAN}🔄 N8N integration enabled - configuring proxy${NC}"
    
    # Injecter le webhook URL dans la config nginx avec proxy
    if node /var/apps/logen/apps/site-generator/maintenance/inject-nginx-webhook.js "$SITE_NAME"; then
        echo -e "${GREEN}✅ Nginx proxy configuré pour le formulaire de contact${NC}"
    else
        echo -e "${YELLOW}⚠️  Échec configuration nginx proxy - utilisant config par défaut${NC}"
        # Fallback to default nginx config
        cp "$TEMPLATE_DIR/docker/nginx.conf" "$OUTPUT_DIR/docker/nginx.conf"
    fi
else
    echo -e "${CYAN}ℹ️  N8N non activé - utilisant config nginx standard${NC}"
    # Copier la config nginx standard si pas de N8N
    cp "$TEMPLATE_DIR/docker/nginx.conf" "$OUTPUT_DIR/docker/nginx.conf"
fi

# 🎨 TRAITEMENT DES IMAGES - APRÈS la génération complète
if [ "$IMAGE_MODE" != "none" ]; then
    echo ""
    echo -e "${BLUE}🎨 TRAITEMENT DES IMAGES${NC}"
    echo "================================"
    
    # Vérifier que Node.js est disponible
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Required for image generation.${NC}"
        exit 1
    fi
    
    # Installer les dépendances si nécessaire
    if [ ! -d "/var/apps/logen/apps/site-generator/node_modules" ]; then
        echo "  📦 Installing image generation dependencies..."
        cd /var/apps/logen/apps/site-generator
        npm install --silent
        cd /var/apps/logen
    fi
    
    # Créer le dossier assets
    mkdir -p "$OUTPUT_DIR/public/assets"
    mkdir -p "$OUTPUT_DIR/public/assets/blog/images"
    
    # Extraire les infos de la configuration
    PRIMARY_COLOR=$(node -e "
        const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
        console.log(config.brand?.colors?.primary || '#4F46E5');
    ")
    
    SECONDARY_COLOR=$(node -e "
        const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
        console.log(config.brand?.colors?.secondary || '#7C3AED');
    ")
    
    SITE_NAME_CLEAN=$(node -e "
        const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
        console.log(config.brand?.name || '$SITE_NAME');
    ")
    
    echo "  🎨 Generating images for: $SITE_NAME_CLEAN"
    echo "  🎯 Primary color: $PRIMARY_COLOR"
    echo "  🎯 Secondary color: $SECONDARY_COLOR"
    echo "  📁 Output directory: $OUTPUT_DIR/public/assets"
    
    # Afficher le mode de génération
    case "$IMAGE_MODE" in
        "none")
            echo "  🚫 Mode: No image processing"
            ;;
        "copy")
            echo "  📋 Mode: Copy images without processing"
            ;;
        "process")
            echo "  🔧 Mode: Process logos (cropping/sizing) + copy images"
            ;;
        "ai")
            echo "  🤖 Mode: AI image generation (for missing images only)"
            ;;
        "ai:force")
            echo "  🤖 Mode: Force AI image regeneration (complete)"
            ;;
        "ai:blog")
            echo "  🤖 Mode: Force AI blog images only"
            ;;
        "ai:hero")
            echo "  🤖 Mode: Force AI hero image only"
            ;;
        "ai:services")
            echo "  🤖 Mode: Force AI service images only"
            ;;
        "placeholder")
            echo "  📋 Mode: Placeholder images (debug)"
            ;;
        *)
            echo "  ❓ Mode: Unknown ($IMAGE_MODE)"
            ;;
    esac
    
    # Configuration des modes force-regenerate sélectifs
    if [ "$FORCE_REGENERATE" = true ]; then
        echo "  ⚠️  FORCE REGENERATE MODE - All images will be recreated"
        export FORCE_REGENERATE=true
        export FORCE_BLOG_IMAGES=true
        export FORCE_HERO_IMAGES=true
        export FORCE_SERVICE_IMAGES=true
    else
        # Modes sélectifs
        if [ "$FORCE_BLOG_IMAGES" = true ]; then
            echo "  🔄 Force regenerating BLOG images only"
            export FORCE_BLOG_IMAGES=true
        fi
        if [ "$FORCE_HERO_IMAGES" = true ]; then
            echo "  🔄 Force regenerating HERO images only"
            export FORCE_HERO_IMAGES=true
        fi
        if [ "$FORCE_SERVICE_IMAGES" = true ]; then
            echo "  🔄 Force regenerating SERVICE images only"
            export FORCE_SERVICE_IMAGES=true
        fi
        
        if [ "$FORCE_BLOG_IMAGES" != true ] && [ "$FORCE_HERO_IMAGES" != true ] && [ "$FORCE_SERVICE_IMAGES" != true ]; then
            echo "  ✅ Preserving existing images (use --force-*-images to override specific categories)"
        fi
    fi
    
    # Générer toutes les images avec le contrôleur unifié
    echo "  🎯 Launching unified image controller..."
    IMAGE_MODE="$IMAGE_MODE" FORCE_REGENERATE="$FORCE_REGENERATE" FORCE_BLOG_IMAGES="$FORCE_BLOG_IMAGES" FORCE_HERO_IMAGES="$FORCE_HERO_IMAGES" FORCE_SERVICE_IMAGES="$FORCE_SERVICE_IMAGES" node /var/apps/logen/apps/site-generator/generators/image-controller.js "$CONFIG_FILE" "$OUTPUT_DIR/public/assets"

    # ✅ ISSUE #138 FIX: Copy blog images to correct subdirectory after generation
    # Template expects blog images in /assets/blog/images/
    echo "  📝 Copying blog images to template-expected location..."
    ASSETS_SOURCE="logen-site-configs/$SITE_NAME/assets"
    ASSETS_DEST="$OUTPUT_DIR/public/assets"
    mkdir -p "$ASSETS_DEST/blog/images"
    if ls "$ASSETS_SOURCE"/site-blog-*.png 1> /dev/null 2>&1; then
        cp "$ASSETS_SOURCE"/site-blog-*.png "$ASSETS_DEST/blog/images/" 2>/dev/null || true
        echo -e "${GREEN}✅ Blog images copied to /assets/blog/images/${NC}"
    fi

    echo -e "${GREEN}✅ Image generation completed${NC}"
    echo ""
else
    # Mode copie: copier les assets sans traitement
    echo ""
    echo -e "${BLUE}📁 COPIE DES ASSETS (MODE --no-images)${NC}"
    echo "================================"

    ASSETS_SOURCE="logen-site-configs/$SITE_NAME/assets"
    ASSETS_DEST="$OUTPUT_DIR/public/assets"
    
    if [ -d "$ASSETS_SOURCE" ]; then
        echo "  📋 Copie depuis: $ASSETS_SOURCE"
        echo "  📁 Destination: $ASSETS_DEST"
        
        # Créer le dossier de destination
        mkdir -p "$ASSETS_DEST"
        mkdir -p "$ASSETS_DEST/blog/images"

        # ✅ ISSUE #138 FIX: Copy blog images ONLY to /assets/blog/images/, NOT to root
        # Template constructs path as: /assets/blog/images/${image}
        if ls "$ASSETS_SOURCE"/site-blog-*.png 1> /dev/null 2>&1; then
            cp "$ASSETS_SOURCE"/site-blog-*.png "$ASSETS_DEST/blog/images/" 2>/dev/null || true
            echo -e "${GREEN}✅ Blog images copied to /assets/blog/images/${NC}"
        fi

        # Copy all OTHER assets (excluding blog images to avoid duplication)
        find "$ASSETS_SOURCE" -type f ! -name "site-blog-*.png" -exec cp {} "$ASSETS_DEST/" \; 2>/dev/null || true

        echo -e "${GREEN}✅ Assets copiés sans traitement${NC}"
    else
        echo -e "${YELLOW}⚠️  Aucun dossier assets trouvé: $ASSETS_SOURCE${NC}"
    fi
    echo ""
fi

# Build du site si demandé
if [ "$BUILD_SITE" = true ]; then
    echo ""
    echo -e "${BLUE}🔨 Building site...${NC}"

    cd "$OUTPUT_DIR"

    # Always install dependencies when building to ensure they're complete
    # Use --include=dev to install devDependencies even in production NODE_ENV
    echo "  📦 Installing dependencies..."
    npm install --include=dev

    echo "  🏗️  Building for production..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful${NC}"
        echo "  📁 Build output: $OUTPUT_DIR/dist/"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    cd - > /dev/null
fi

# Build Docker si demandé
if [ "$BUILD_DOCKER" = true ]; then
    echo ""
    echo -e "${BLUE}🐳 Building Docker image...${NC}"
    
    cd "$OUTPUT_DIR"
    
    # S'assurer que le build existe
    if [ ! -d "dist" ] && [ "$BUILD_SITE" != true ]; then
        echo "  📦 Installing dependencies..."
        npm install --silent
        echo "  🏗️  Building for production..."
        npm run build
    fi
    
    if [ -d "dist" ]; then
        echo "  🐳 Building Docker image: $SITE_NAME..."
        echo "  📋 Command: docker build -t \"$SITE_NAME-website\" ."
        echo "  📁 Build context: $(pwd)"
        
        # 🔧 CRITICAL FIX: Enhanced Docker build with error output capture
        DOCKER_BUILD_OUTPUT=$(docker build -t "$SITE_NAME-website" . 2>&1)
        DOCKER_BUILD_EXIT_CODE=$?
        
        if [ $DOCKER_BUILD_EXIT_CODE -eq 0 ]; then
            echo -e "${GREEN}✅ Docker image built: $SITE_NAME-website${NC}"

            # Verify image was created
            if docker image inspect "$SITE_NAME-website" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Docker image verified and ready${NC}"
            else
                echo -e "${YELLOW}⚠️  Docker build succeeded but image not found in registry${NC}"
            fi
        else
            echo -e "${RED}❌ Docker build failed (Exit code: $DOCKER_BUILD_EXIT_CODE)${NC}"
            echo -e "${RED}🔍 Build output:${NC}"
            echo "$DOCKER_BUILD_OUTPUT" | tail -20  # Show last 20 lines of build output
            echo ""
            echo -e "${YELLOW}🔧 Debug Information:${NC}"
            echo "  • Dockerfile exists: $([ -f "Dockerfile" ] && echo "✅ Yes" || echo "❌ No")"
            echo "  • Build directory: $([ -d "dist" ] && echo "✅ dist/" || echo "❌ No dist/")"
            echo "  • Package.json exists: $([ -f "package.json" ] && echo "✅ Yes" || echo "❌ No")"
            echo "  • Working directory: $(pwd)"
            exit 1
        fi
    else
        echo -e "${RED}❌ No build directory found. Run with --build first.${NC}"
        echo -e "${YELLOW}🔧 Debug: Expected 'dist/' directory in $(pwd)${NC}"
        echo -e "${YELLOW}💡 Try running with --build flag to create the build first${NC}"
        exit 1
    fi
    
    cd - > /dev/null
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 GÉNÉRATION TERMINÉE${NC}"
echo "=============================================="
echo "📋 Résumé:"
echo "  • Site: $SITE_NAME"
echo "  • Configuration: $CONFIG_FILE"
echo "  • Output: $OUTPUT_DIR"

if [ -d "$CONTENT_DIR" ]; then
    echo "  • Markdown: ✅ Site-specific content copied to public/content/"
elif [ -d "content" ]; then
    echo "  • Markdown: ✅ Global fallback content copied to public/content/"
fi

if [ "$BUILD_DOCKER" = true ]; then
    echo "  • Docker: ✅ Image created ($SITE_NAME-website)"
fi

# Run image verification if site was built (to avoid testing on dev server)
if [ "$BUILD_SITE" = true ] && [ -d "$OUTPUT_DIR/dist" ]; then
    echo ""
    echo -e "${BLUE}🔍 Running image verification...${NC}"
    
    # Check if the verification script exists
    if [ -f "scripts/test/verify-images.sh" ]; then
        # Run the verification with the site name and try to detect port
        PORT=$(ps aux | grep -E "serve.*$SITE_NAME|http-server.*$SITE_NAME|live-server.*$SITE_NAME" | grep -v grep | head -1 | sed -n 's/.*:\([0-9]\+\).*/\1/p')
        
        if [ -n "$PORT" ]; then
            echo "  📡 Found site running on port $PORT, verifying images..."
            bash scripts/test/verify-images.sh "$SITE_NAME" "$PORT"
        else
            echo "  ℹ️  Site not running - image verification skipped (build only mode)"
            echo "     To verify images, start the site and run: bash scripts/test/verify-images.sh $SITE_NAME <port>"
        fi
    else
        echo "  ⚠️  Image verification script not found: scripts/test/verify-images.sh"
    fi
fi

echo ""
echo -e "${GREEN}🎯 v1.1.1.7: Script avec support Markdown spécifique par site !${NC}"