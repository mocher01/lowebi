#!/bin/bash

# Script de démonstration rapide du système Markdown v1.1.1.7
# Usage: ./demo-markdown-system.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🎭 DÉMONSTRATION SYSTÈME MARKDOWN v1.1.1.7${NC}"
echo "======================================================"

# Variables
SITE_NAME="qalyarab"
OUTPUT_DIR="generated-sites/$SITE_NAME"

echo ""
echo -e "${BLUE}📊 ÉTAT ACTUEL DU SYSTÈME${NC}"
echo "======================================================"

# Compter les articles Markdown
MARKDOWN_COUNT=$(find content/blog -name "*.md" 2>/dev/null | wc -l)
echo "  📝 Articles Markdown disponibles: $MARKDOWN_COUNT"

if [ $MARKDOWN_COUNT -gt 0 ]; then
    echo "  📄 Liste des articles:"
    find content/blog -name "*.md" -exec basename {} .md \; | sed 's/^/     • /'
fi

# Vérifier les composants
echo ""
echo "  🔧 Composants système:"
echo "     • markdown-loader.js: $([ -f "template-base/src/config/markdown-loader.js" ] && echo "✅" || echo "❌")"
echo "     • BlogPage (màj): $(grep -q "getBlogArticles" "template-base/src/pages/blog/BlogPage.jsx" 2>/dev/null && echo "✅" || echo "❌")"
echo "     • BlogArticleRouter (màj): $(grep -q "getBlogArticle" "template-base/src/pages/blog/BlogArticleRouter.jsx" 2>/dev/null && echo "✅" || echo "❌")"
echo "     • Script génération (màj): $(grep -q "content/blog" "scripts/generate-site.sh" 2>/dev/null && echo "✅" || echo "❌")"

echo ""
echo -e "${BLUE}🚀 GÉNÉRATION COMPLÈTE DU SITE${NC}"
echo "======================================================"

# Nettoyer l'ancien build
if [ -d "$OUTPUT_DIR" ]; then
    echo "  🧹 Nettoyage du build précédent..."
    rm -rf "$OUTPUT_DIR"
fi

# Générer le site
echo "  📋 Génération avec Markdown intégré..."
if ./scripts/generate-site.sh "$SITE_NAME" --build; then
    echo -e "${GREEN}     ✅ Génération réussie !${NC}"
else
    echo -e "${RED}     ❌ Échec de la génération${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 VALIDATION POST-GÉNÉRATION${NC}"
echo "======================================================"

# Vérifier la copie des fichiers Markdown
COPIED_COUNT=$(find "$OUTPUT_DIR/public/content/blog" -name "*.md" 2>/dev/null | wc -l)
echo "  📁 Fichiers Markdown copiés: $COPIED_COUNT"

if [ $COPIED_COUNT -gt 0 ]; then
    echo "  📋 Contenu copié:"
    find "$OUTPUT_DIR/public/content/blog" -name "*.md" -exec basename {} .md \; | sed 's/^/     • /'
fi

# Vérifier le build de production
echo ""
echo "  🏗️  Build de production:"
if [ -d "$OUTPUT_DIR/dist" ]; then
    DIST_SIZE=$(du -sh "$OUTPUT_DIR/dist" | cut -f1)
    echo "     ✅ Build créé (taille: $DIST_SIZE)"
    
    # Vérifier les fichiers clés dans dist
    echo "     📁 Fichiers clés dans dist/:"
    echo "        • index.html: $([ -f "$OUTPUT_DIR/dist/index.html" ] && echo "✅" || echo "❌")"
    echo "        • assets/ : $([ -d "$OUTPUT_DIR/dist/assets" ] && echo "✅" || echo "❌")"
    echo "        • content/ : $([ -d "$OUTPUT_DIR/dist/content" ] && echo "✅" || echo "❌")"
else
    echo "     ❌ Build non trouvé"
fi

echo ""
echo -e "${BLUE}📱 TEST RAPIDE DU CONTENU${NC}"
echo "======================================================"

# Tester le contenu d'un article
if [ $MARKDOWN_COUNT -gt 0 ]; then
    FIRST_ARTICLE=$(find content/blog -name "*.md" | head -1)
    ARTICLE_NAME=$(basename "$FIRST_ARTICLE" .md)
    
    echo "  📖 Test de l'article: $ARTICLE_NAME"
    
    # Extraire le titre
    TITLE=$(grep "^title:" "$FIRST_ARTICLE" | sed 's/title: *//' | tr -d '"')
    echo "     • Titre: $TITLE"
    
    # Extraire la catégorie
    CATEGORY=$(grep "^category:" "$FIRST_ARTICLE" | sed 's/category: *//' | tr -d '"')
    echo "     • Catégorie: $CATEGORY"
    
    # Compter les mots
    WORD_COUNT=$(wc -w < "$FIRST_ARTICLE")
    echo "     • Mots: $WORD_COUNT"
    
    # Vérifier la copie
    COPIED_FILE="$OUTPUT_DIR/public/content/blog/$(basename "$FIRST_ARTICLE")"
    if [ -f "$COPIED_FILE" ]; then
        echo -e "${GREEN}     ✅ Fichier correctement copié${NC}"
    else
        echo -e "${RED}     ❌ Fichier non copié${NC}"
    fi
fi

echo ""
echo -e "${BLUE}⚡ TESTS DE PERFORMANCE${NC}"
echo "======================================================"

# Test de temps de génération
echo "  ⏱️  Performance de génération:"
START_TIME=$(date +%s)
./scripts/generate-site.sh "$SITE_NAME" > /dev/null 2>&1
END_TIME=$(date +%s)
GENERATION_TIME=$((END_TIME - START_TIME))
echo "     • Temps de génération: ${GENERATION_TIME}s"

# Taille des fichiers
echo ""
echo "  📏 Tailles des composants:"
if [ -d "$OUTPUT_DIR" ]; then
    echo "     • Source totale: $(du -sh "$OUTPUT_DIR" | cut -f1)"
    echo "     • Build dist/: $([ -d "$OUTPUT_DIR/dist" ] && du -sh "$OUTPUT_DIR/dist" | cut -f1 || echo "N/A")"
    echo "     • Contenu Markdown: $([ -d "$OUTPUT_DIR/public/content" ] && du -sh "$OUTPUT_DIR/public/content" | cut -f1 || echo "N/A")"
fi

echo ""
echo -e "${BLUE}🎯 INSTRUCTIONS DE TEST MANUEL${NC}"
echo "======================================================"

echo "  Pour tester le site généré:"
echo -e "${YELLOW}     cd $OUTPUT_DIR${NC}"
echo -e "${YELLOW}     npm run dev${NC}"
echo ""
echo "  URLs à tester:"
echo "     • http://localhost:5173/ (page d'accueil)"
echo "     • http://localhost:5173/blog (liste des articles)"

if [ $MARKDOWN_COUNT -gt 0 ]; then
    echo "     • Articles spécifiques:"
    find content/blog -name "*.md" -exec grep "^slug:" {} \; | sed 's/slug: *//' | tr -d '"' | sed 's/^/       - http:\/\/localhost:5173\/blog\//'
fi

echo ""
echo -e "${BLUE}📋 CHECKLIST VALIDATION${NC}"
echo "======================================================"

echo "  Validation manuelle recommandée:"
echo "     ☐ Page blog affiche 'Articles depuis Markdown'"
echo "     ☐ Liste des articles complète et triée"
echo "     ☐ Filtrage par catégorie fonctionne"
echo "     ☐ Recherche dans les articles"
echo "     ☐ Navigation article individuel"
echo "     ☐ Contenu HTML riche affiché correctement"
echo "     ☐ Images des articles (si présentes)"
echo "     ☐ Responsive design mobile/desktop"

echo ""
echo -e "${GREEN}🎉 DÉMONSTRATION TERMINÉE${NC}"
echo "======================================================"

if [ $MARKDOWN_COUNT -gt 0 ] && [ -d "$OUTPUT_DIR/dist" ]; then
    echo -e "${GREEN}✅ Système Markdown v1.1.1.7 opérationnel !${NC}"
    echo ""
    echo "📊 Résumé:"
    echo "  • Articles Markdown: $MARKDOWN_COUNT"
    echo "  • Articles copiés: $COPIED_COUNT"
    echo "  • Build de production: ✅"
    echo "  • Temps de génération: ${GENERATION_TIME}s"
    echo ""
    echo -e "${PURPLE}🚀 Le système est prêt pour la production !${NC}"
else
    echo -e "${YELLOW}⚠️  Système partiellement fonctionnel${NC}"
    echo "Vérifiez les erreurs ci-dessus"
fi

echo ""
echo -e "${BLUE}📚 RESSOURCES SUPPLÉMENTAIRES${NC}"
echo "  • Documentation: docs/markdown-blog.md"
echo "  • Test complet: ./scripts/test-markdown-v1117.sh"
echo "  • Exemples d'articles: content/blog/*.md"