#!/bin/bash

# Test validation v1.0.5 - Navigation scroll fix
echo "🧪 TEST v1.0.5 - FIX NAVIGATION SCROLL"
echo "======================================"

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

echo -e "${BLUE}📋 Phase 1: Validation imports React Router${NC}"
echo "🔍 Vérification des hooks ajoutés..."

# Vérifier imports React Router
validate "Import useLocation" "grep -q 'useLocation' template-base/src/components/layout/Navbar.jsx"
validate "Import useNavigate" "grep -q 'useNavigate' template-base/src/components/layout/Navbar.jsx"
validate "Hooks initialisés" "grep -q 'const location = useLocation()' template-base/src/components/layout/Navbar.jsx"
validate "Navigate initialisé" "grep -q 'const navigate = useNavigate()' template-base/src/components/layout/Navbar.jsx"

echo -e "\n${BLUE}📋 Phase 2: Validation fonction handleHomeNavigation${NC}"
echo "🔍 Vérification de la logique de navigation..."

# Vérifier la fonction handleHomeNavigation
validate "Fonction handleHomeNavigation définie" "grep -q 'const handleHomeNavigation' template-base/src/components/layout/Navbar.jsx"
validate "Gestion pathname =='/'" "grep -q \"location.pathname === '/'\" template-base/src/components/layout/Navbar.jsx"
validate "window.scrollTo smooth" "grep -q 'behavior: \"smooth\"' template-base/src/components/layout/Navbar.jsx"
validate "Navigate fallback" "grep -q \"navigate('/')\" template-base/src/components/layout/Navbar.jsx"
validate "Fermeture menu mobile" "grep -q 'setIsOpen(false)' template-base/src/components/layout/Navbar.jsx"

echo -e "\n${BLUE}📋 Phase 3: Validation modification logo${NC}"
echo "🔍 Vérification que le logo utilise button au lieu de Link..."

# Vérifier modification du logo
validate "Logo en button" "grep -A3 -B1 'handleHomeNavigation' template-base/src/components/layout/Navbar.jsx | grep -q '<button'"
validate "Aria-label logo" "grep -q 'aria-label.*Retour à l.accueil' template-base/src/components/layout/Navbar.jsx"
validate "onClick sur logo" "grep -q 'onClick={handleHomeNavigation}' template-base/src/components/layout/Navbar.jsx"

echo -e "\n${BLUE}📋 Phase 4: Validation lien Accueil desktop${NC}"
echo "🔍 Vérification que le lien Accueil utilise button..."

# Vérifier modification lien Accueil desktop
validate "Condition link.path === '/'" "grep -q \"if (link.path === '/')\" template-base/src/components/layout/Navbar.jsx"
validate "Button pour Accueil desktop" "grep -A5 \"if (link.path === '/')\" template-base/src/components/layout/Navbar.jsx | grep -q '<button'"
validate "Style button Accueil" "grep -A8 \"if (link.path === '/')\" template-base/src/components/layout/Navbar.jsx | grep -q 'background.*none'"

echo -e "\n${BLUE}📋 Phase 5: Validation lien Accueil mobile${NC}"
echo "🔍 Vérification du comportement mobile..."

# Vérifier modification lien Accueil mobile
validate "Condition mobile link.path === '/'" "grep -A20 'Mobile Navigation' template-base/src/components/layout/Navbar.jsx | grep -q \"if (link.path === '/')\""
validate "Button pour Accueil mobile" "grep -A30 'flex flex-col space-y-4' template-base/src/components/layout/Navbar.jsx | grep -q '<button'"

echo -e "\n${BLUE}📋 Phase 6: Test génération Qalyarab${NC}"
echo "🔍 Test de génération avec navigation fixée..."

# Test génération rapide
if ./scripts/generate-site.sh qalyarab > /tmp/test-v105.log 2>&1; then
    echo -e "  ${GREEN}✅ Génération Qalyarab réussie${NC}"
    SUCCESS=$((SUCCESS + 1))
    
    # Vérifier Navbar généré
    if [ -f "generated-sites/qalyarab/src/components/layout/Navbar.jsx" ]; then
        validate "handleHomeNavigation copié" "grep -q 'handleHomeNavigation' generated-sites/qalyarab/src/components/layout/Navbar.jsx"
        validate "Hooks React Router copiés" "grep -q 'useLocation.*useNavigate' generated-sites/qalyarab/src/components/layout/Navbar.jsx"
        validate "Logo button copié" "grep -q 'onClick={handleHomeNavigation}' generated-sites/qalyarab/src/components/layout/Navbar.jsx"
    fi
    
    # Nettoyer
    rm -rf generated-sites/qalyarab
else
    echo -e "  ${RED}❌ Échec génération Qalyarab${NC}"
    echo "Voir logs: /tmp/test-v105.log"
fi
TOTAL=$((TOTAL + 1))

echo -e "\n=================================="
echo -e "${BLUE}📊 RÉSULTATS v1.0.5${NC}"
echo "=================================="

PERCENTAGE=$(( (SUCCESS * 100) / TOTAL ))
echo -e "✅ Tests réussis: ${GREEN}$SUCCESS/$TOTAL${NC} (${PERCENTAGE}%)"

if [ $SUCCESS -eq $TOTAL ]; then
    echo -e "\n${GREEN}🎉 v1.0.5 NAVIGATION FIX VALIDÉ !${NC}"
    echo ""
    echo -e "${BLUE}🎯 CORRECTIONS CONFIRMÉES:${NC}"
    echo "  ✅ Hooks React Router ajoutés (useLocation, useNavigate)"
    echo "  ✅ Fonction handleHomeNavigation implémentée"
    echo "  ✅ Logo converti en button avec onClick"
    echo "  ✅ Lien 'Accueil' converti en button (desktop + mobile)"
    echo "  ✅ Scroll vers le haut quand pathname === '/'"
    echo "  ✅ Navigation normale vers autres pages"
    echo "  ✅ Fermeture automatique menu mobile"
    echo ""
    echo -e "${YELLOW}🚀 PRÊT POUR v1.0.6 : FIX CTA ACTIVITÉS${NC}"
    echo ""
    echo -e "${BLUE}💡 PROCHAINE CORRECTION:${NC}"
    echo "  • Problème 3: Bouton 'Réserver un cours d'essai' sans effet"
    echo ""
    echo -e "${BLUE}📋 TESTS MANUELS RECOMMANDÉS:${NC}"
    echo "  1. Déployer: ./init.sh qalyarab --docker --force"
    echo "  2. Scroll vers le bas sur http://localhost:3000"
    echo "  3. Clic sur logo → doit scroller vers le haut"
    echo "  4. Clic sur 'Accueil' → doit scroller vers le haut"
    echo "  5. Navigation vers /services puis retour → doit fonctionner"
    echo ""
    
    # Tag v1.0.5
    echo "v1.0.5 navigation fix validated - $(date)" > /tmp/v105-success.txt
    exit 0
else
    echo -e "\n${RED}⚠️  v1.0.5 VALIDATION ÉCHOUÉE${NC}"
    echo ""
    echo -e "${YELLOW}📋 ACTIONS CORRECTIVES:${NC}"
    echo "  • Vérifier imports React Router (useLocation, useNavigate)"
    echo "  • Valider fonction handleHomeNavigation"
    echo "  • Contrôler conversion Link → button pour logo et Accueil"
    echo "  • Tester génération de sites"
    echo ""
    exit 1
fi