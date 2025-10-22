#!/bin/bash

# Test validation v1.0.4 - CSS cleanup
echo "🧪 TEST v1.0.4 - NETTOYAGE CSS page-layout.css"
echo "================================================"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compteurs
SUCCESS=0
TOTAL=0

validate() {
    local test_name="$1"
    local command="$2"
    
    TOTAL=$((TOTAL + 1))
    echo -n "  $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        SUCCESS=$((SUCCESS + 1))
        return 0
    else
        echo -e "${RED}❌${NC}"
        return 1
    fi
}

echo -e "${BLUE}📋 Phase 1: Validation suppressions CSS${NC}"
echo "🔍 Vérification que les doublons hero ont été supprimés..."

# Vérifier suppressions dans page-layout.css
validate "Suppression .hero-content" "! grep -q '\\.hero-content' templates/template-base/src/styles/page-layout.css"
validate "Suppression .hero-title" "! grep -q '\\.hero-title' templates/template-base/src/styles/page-layout.css"
validate "Suppression .hero-subtitle" "! grep -q '\\.hero-subtitle' templates/template-base/src/styles/page-layout.css"
validate "Suppression .hero-cta" "! grep -q '\\.hero-cta' templates/template-base/src/styles/page-layout.css"

echo -e "\n${BLUE}📋 Phase 2: Validation styles conservés${NC}"
echo "🔍 Vérification que les styles utiles sont toujours présents..."

# Vérifier que les styles utiles restent
validate "Layout principal conservé" "grep -q '\\.page-layout' templates/template-base/src/styles/page-layout.css"
validate "Navbar styles conservés" "grep -q '\\.navbar' templates/template-base/src/styles/page-layout.css"
validate "Main content conservé" "grep -q '\\.page-main' templates/template-base/src/styles/page-layout.css"
validate "Section styles conservés" "grep -q '\\.content-section' templates/template-base/src/styles/page-layout.css"
validate "Grid layouts conservés" "grep -q '\\.grid-2' templates/template-base/src/styles/page-layout.css"
validate "Cards conservées" "grep -q '\\.content-card' templates/template-base/src/styles/page-layout.css"
validate "Buttons conservés" "grep -q '\\.btn' templates/template-base/src/styles/page-layout.css"

echo -e "\n${BLUE}📋 Phase 3: Architecture CSS validée${NC}"
echo "🔍 Vérification que l'architecture Clean v1.1.3 est respectée..."

# Vérifier architecture globale
validate "layout-variables.css existe" "[ -f 'templates/template-base/src/styles/layout-variables.css' ]"
validate "Hero styles dans layout-variables" "grep -q '\\.hero-section h1' templates/template-base/src/styles/layout-variables.css"
validate "Import page-layout dans main.jsx" "grep -q 'page-layout.css' templates/template-base/src/main.jsx"

echo -e "\n${BLUE}📋 Phase 4: Test génération Qalyarab${NC}"
echo "🔍 Test de génération avec CSS nettoyé..."

# Test génération rapide
if ./scripts/generate-site.sh qalyarab > /tmp/test-v104.log 2>&1; then
    echo -e "  ${GREEN}✅ Génération Qalyarab réussie${NC}"
    SUCCESS=$((SUCCESS + 1))
    
    # Vérifier CSS généré
    if [ -f "generated-sites/qalyarab/src/styles/page-layout.css" ]; then
        validate "CSS nettoyé copié" "! grep -q '\\.hero-title' generated-sites/qalyarab/src/styles/page-layout.css"
        validate "Layout styles copiés" "grep -q '\\.page-layout' generated-sites/qalyarab/src/styles/page-layout.css"
    fi
    
    # Nettoyer
    rm -rf generated-sites/qalyarab
else
    echo -e "  ${RED}❌ Échec génération Qalyarab${NC}"
    echo "Voir logs: /tmp/test-v104.log"
fi
TOTAL=$((TOTAL + 1))

echo -e "\n=================================="
echo -e "${BLUE}📊 RÉSULTATS v1.0.4${NC}"
echo "=================================="

PERCENTAGE=$(( (SUCCESS * 100) / TOTAL ))
echo -e "✅ Tests réussis: ${GREEN}$SUCCESS/$TOTAL${NC} (${PERCENTAGE}%)"

if [ $SUCCESS -eq $TOTAL ]; then
    echo -e "\n${GREEN}🎉 v1.0.4 CSS CLEANUP VALIDÉ !${NC}"
    echo ""
    echo -e "${BLUE}🎯 CORRECTIONS CONFIRMÉES:${NC}"
    echo "  ✅ Doublons CSS supprimés (.hero-title, .hero-subtitle, .hero-content)"
    echo "  ✅ Styles essentiels conservés (layout, navbar, grids, cards, buttons)"
    echo "  ✅ Architecture CSS Clean v1.1.3 respectée"
    echo "  ✅ Génération Qalyarab fonctionnelle"
    echo ""
    echo -e "${YELLOW}🚀 PRÊT POUR v1.0.5 : FIX NAVIGATION${NC}"
    echo ""
    echo -e "${BLUE}💡 PROCHAINE CORRECTION:${NC}"
    echo "  • Problème 2: Navigation home/logo sans effet quand scrollé"
    echo ""
    
    # Tag v1.0.4
    echo "v1.0.4 CSS cleanup validated - $(date)" > /tmp/v104-success.txt
    exit 0
else
    echo -e "\n${RED}⚠️  v1.0.4 VALIDATION ÉCHOUÉE${NC}"
    echo ""
    echo -e "${YELLOW}📋 ACTIONS CORRECTIVES:${NC}"
    echo "  • Vérifier que les doublons CSS ont été supprimés"
    echo "  • Valider que les styles essentiels restent"
    echo "  • Tester la génération de sites"
    echo ""
    exit 1
fi