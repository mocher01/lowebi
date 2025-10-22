#!/bin/bash

# 🚀 Script de création rapide d'un nouveau site
# Usage: ./create-new-site.sh <nom-site>

set -e

SITE_NAME="$1"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ -z "$SITE_NAME" ]; then
    echo -e "${RED}Usage: $0 <nom-site>${NC}"
    echo -e "${CYAN}Exemple: $0 mon-entreprise${NC}"
    exit 1
fi

# Validate site name
if [[ ! "$SITE_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}❌ Le nom de site doit contenir uniquement des lettres minuscules, chiffres et tirets${NC}"
    echo -e "${YELLOW}💡 Exemples valides: mon-site, entreprise-2024, qalyarab${NC}"
    exit 1
fi

CONFIG_DIR="configs/$SITE_NAME"
ASSETS_DIR="$CONFIG_DIR/assets"
CONFIG_FILE="$CONFIG_DIR/site-config.json"

echo -e "${BLUE}🚀 CRÉATION NOUVEAU SITE: $SITE_NAME${NC}"
echo "=============================================="

# Check if site already exists
if [ -d "$CONFIG_DIR" ]; then
    echo -e "${RED}❌ Le site '$SITE_NAME' existe déjà dans $CONFIG_DIR${NC}"
    echo -e "${YELLOW}💡 Choisissez un autre nom ou supprimez le dossier existant${NC}"
    exit 1
fi

# Create directories
echo "📁 Création des dossiers..."
mkdir -p "$ASSETS_DIR"

# Copy template configuration
echo "📋 Copie du template de configuration..."
if [ -f "docs/TEMPLATE_CONFIG_COMPLETE.json" ]; then
    cp "docs/TEMPLATE_CONFIG_COMPLETE.json" "$CONFIG_FILE"
    
    # Replace site name placeholders
    if command -v sed &> /dev/null; then
        # Replace {votre-site} with actual site name
        sed -i.bak "s/{votre-site}/$SITE_NAME/g" "$CONFIG_FILE"
        rm -f "$CONFIG_FILE.bak"
        echo -e "${GREEN}✅ Template copié et nom de site injecté${NC}"
    else
        echo -e "${YELLOW}⚠️  Template copié, vous devrez remplacer manuellement {votre-site} par $SITE_NAME${NC}"
    fi
else
    echo -e "${RED}❌ Template de configuration non trouvé: docs/TEMPLATE_CONFIG_COMPLETE.json${NC}"
    exit 1
fi

# Create assets README
cat > "$ASSETS_DIR/README.md" << EOF
# Assets pour le site $SITE_NAME

## 📁 Fichiers requis

Vous devez créer ces 4 fichiers pour que la validation passe :

### 🌞 Logos adaptatifs
- \`$SITE_NAME-logo-clair.png\` - Logo pour navbar (fond clair)
- \`$SITE_NAME-logo-sombre.png\` - Logo pour footer (fond sombre)

### 🎨 Favicons adaptatifs
- \`$SITE_NAME-favicon-clair.png\` - Favicon mode clair navigateur
- \`$SITE_NAME-favicon-sombre.png\` - Favicon mode sombre navigateur

## 📏 Dimensions recommandées

- **Logos :** 200x56px minimum
- **Favicons :** 192x192px recommandé (minimum 32x32px)

## 🎯 Guide complet

Consultez le guide complet : \`docs/ADAPTIVE_ASSETS_GUIDE.md\`

## ✅ Validation

Une fois vos assets créés, validez avec :
\`\`\`bash
node scripts/validate-config.js $SITE_NAME
\`\`\`
EOF

echo ""
echo -e "${GREEN}✅ NOUVEAU SITE CRÉÉ AVEC SUCCÈS !${NC}"
echo "=============================================="
echo -e "${CYAN}📁 Dossier créé :${NC} $CONFIG_DIR"
echo -e "${CYAN}📄 Configuration :${NC} $CONFIG_FILE"
echo -e "${CYAN}🖼️  Assets :${NC} $ASSETS_DIR"

echo ""
echo -e "${BLUE}🔧 PROCHAINES ÉTAPES :${NC}"
echo ""
echo -e "${YELLOW}1. Éditez la configuration :${NC}"
echo "   nano $CONFIG_FILE"
echo "   # Remplacez TOUS les placeholders {VOTRE_*} par vos valeurs"
echo ""
echo -e "${YELLOW}2. Ajoutez vos assets (4 fichiers requis) :${NC}"
echo "   $ASSETS_DIR/$SITE_NAME-logo-clair.png"
echo "   $ASSETS_DIR/$SITE_NAME-logo-sombre.png"
echo "   $ASSETS_DIR/$SITE_NAME-favicon-clair.png"
echo "   $ASSETS_DIR/$SITE_NAME-favicon-sombre.png"
echo ""
echo -e "${YELLOW}3. Validez votre configuration :${NC}"
echo "   node scripts/validate-config.js $SITE_NAME"
echo ""
echo -e "${YELLOW}4. Configurez N8N automatiquement (optionnel) :${NC}"
echo "   node scripts/generators/n8n-workflow-generator.js $SITE_NAME configs/$SITE_NAME/site-config.json"
echo ""
echo -e "${YELLOW}5. Générez votre site :${NC}"
echo "   ./scripts/generate-site.sh $SITE_NAME --build --docker"
echo ""
echo -e "${BLUE}📚 RESSOURCES UTILES :${NC}"
echo "• Template de config : $CONFIG_FILE"
echo "• Guide des assets : docs/ADAPTIVE_ASSETS_GUIDE.md"
echo "• Exemple de référence : configs/qalyarab/"
echo ""
echo -e "${GREEN}🎉 Bon développement !${NC}"