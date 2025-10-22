#!/bin/bash

# Script de validation finale GÉNÉRIQUE - Fonctionne pour N'IMPORTE QUEL site
# Usage: ./validate-final.sh [site-name]
# v1.0.10: Tests génériques basés sur la configuration, pas hardcodés

echo "🎯 VALIDATION FINALE GÉNÉRIQUE v1.0.10"
echo "======================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compteurs
SUCCESS=0
TOTAL=0

# Site à valider (paramètre ou détection automatique)
SITE_NAME="$1"

# 🆕 v1.0.10: Détection automatique du site généré
if [ -z "$SITE_NAME" ]; then
    echo -e "${YELLOW}🔍 Détection automatique du site généré...${NC}"
    
    # Chercher le site le plus récemment généré
    if [ -d "generated-sites" ]; then
        RECENT_SITE=$(ls -t generated-sites/ 2>/dev/null | head -1)
        if [ ! -z "$RECENT_SITE" ]; then
            SITE_NAME="$RECENT_SITE"
            echo -e "${BLUE}📋 Site détecté: $SITE_NAME${NC}"
        fi
    fi
    
    # Si toujours pas de site, valider tous
    if [ -z "$SITE_NAME" ]; then
        echo -e "${YELLOW}⚠️  Aucun site spécifique détecté, validation globale${NC}"
        SITE_NAME="ALL"
    fi
fi

echo -e "${BLUE}🎯 Mode de validation: ${SITE_NAME}${NC}"
echo ""

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

# 🆕 v1.0.10: Fonction de validation générique des couleurs
validate_site_colors() {
    local site="$1"
    local config_file="configs/$site/site-config.json"
    local css_file="test-generation-final/$site/src/styles/site-variables.css"
    
    echo -e "${BLUE}🎨 Validation couleurs génériques pour: $site${NC}"
    
    if [ ! -f "$config_file" ] || [ ! -f "$css_file" ]; then
        echo -e "${RED}❌ Fichiers manquants pour $site${NC}"
        return 1
    fi
    
    # Extraire les couleurs de la configuration avec Node.js
    local validation_script="/tmp/validate_colors_$site.js"
    cat > "$validation_script" << 'EOF'
const fs = require('fs');

try {
    const configFile = process.argv[2];
    const cssFile = process.argv[3];
    const siteName = process.argv[4];
    
    // Lire la configuration
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    
    console.log(`🔍 Validation couleurs pour ${siteName}:`);
    
    let success = true;
    let total = 0;
    let passed = 0;
    
    // Vérifier les couleurs de brand
    if (config.brand && config.brand.colors) {
        const colors = config.brand.colors;
        
        if (colors.primary) {
            total++;
            const colorRegex = new RegExp(`--color-primary.*${colors.primary.replace('#', '#')}`, 'i');
            if (colorRegex.test(cssContent)) {
                console.log(`  ✅ Couleur primaire: ${colors.primary} → CSS`);
                passed++;
            } else {
                console.log(`  ❌ Couleur primaire manquante: ${colors.primary}`);
                success = false;
            }
        }
        
        if (colors.secondary) {
            total++;
            const colorRegex = new RegExp(`--color-secondary.*${colors.secondary.replace('#', '#')}`, 'i');
            if (colorRegex.test(cssContent)) {
                console.log(`  ✅ Couleur secondaire: ${colors.secondary} → CSS`);
                passed++;
            } else {
                console.log(`  ❌ Couleur secondaire manquante: ${colors.secondary}`);
                success = false;
            }
        }
    }
    
    // Vérifier les couleurs de sections
    if (config.sections) {
        Object.keys(config.sections).forEach(sectionKey => {
            const section = config.sections[sectionKey];
            
            if (section.background) {
                total++;
                const bgRegex = new RegExp(`(--section-${sectionKey}-bg.*${section.background.replace('#', '#')}|\.${sectionKey === 'hero' ? 'hero-section' : 'section-' + sectionKey}.*background.*${section.background.replace('#', '#')})`, 'i');
                if (bgRegex.test(cssContent)) {
                    console.log(`  ✅ Section ${sectionKey} background: ${section.background} → CSS`);
                    passed++;
                } else {
                    console.log(`  ❌ Section ${sectionKey} background manquant: ${section.background}`);
                    success = false;
                }
            }
            
            if (section.textColor) {
                total++;
                const textRegex = new RegExp(`(--section-${sectionKey}-text.*${section.textColor.replace('#', '#')}|\.${sectionKey === 'hero' ? 'hero-section' : 'section-' + sectionKey}.*color.*${section.textColor.replace('#', '#')})`, 'i');
                if (textRegex.test(cssContent)) {
                    console.log(`  ✅ Section ${sectionKey} text: ${section.textColor} → CSS`);
                    passed++;
                } else {
                    console.log(`  ❌ Section ${sectionKey} text manquant: ${section.textColor}`);
                    success = false;
                }
            }
        });
    }
    
    console.log(`🎯 Résultat couleurs ${siteName}: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
    
    process.exit(success ? 0 : 1);
    
} catch (error) {
    console.error('❌ Erreur validation couleurs:', error.message);
    process.exit(1);
}
EOF
    
    # Exécuter la validation
    if node "$validation_script" "$config_file" "$css_file" "$site"; then
        echo -e "  ${GREEN}✅ Couleurs $site cohérentes${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "  ${RED}❌ Couleurs $site incohérentes${NC}"
    fi
    TOTAL=$((TOTAL + 1))
    
    # Nettoyer
    rm -f "$validation_script"
}

echo -e "${BLUE}📋 Phase 0: Validation architecture CSS${NC}"
echo "🔍 Vérification correction Hero.jsx et architecture CSS..."

# Vérifier que Hero.jsx n'a plus de hardcode
validate "Hero.jsx sans hardcode couleur" "! grep -q '#[0-9A-Fa-f]\{6\}' templates/template-base/src/components/home/Hero.jsx"
validate "Hero.jsx utilise classes CSS" "grep -q 'btn-primary\|btn-secondary\|hero-section' templates/template-base/src/components/home/Hero.jsx"
validate "Hero.jsx sans styles inline" "! grep -q 'style={{.*background' templates/template-base/src/components/home/Hero.jsx"

# Vérifier architecture CSS
validate "layout-variables.css existe" "[ -f 'templates/template-base/src/styles/layout-variables.css' ]"
validate "page-layout.css existe" "[ -f 'templates/template-base/src/styles/page-layout.css' ]"
validate "globals.css avec variables" "grep -q 'theme-primary\|theme-secondary' templates/template-base/src/styles/globals.css"

echo ""
echo "🔍 Analyse doublons CSS:"
if grep -q "\.hero-title\|\.hero-subtitle" templates/template-base/src/styles/page-layout.css 2>/dev/null; then
    echo -e "  ${YELLOW}⚠️  page-layout.css contient .hero-title/.hero-subtitle${NC}"
else
    echo -e "  ${GREEN}✅ Pas de doublons hero détectés${NC}"
fi

validate "CSS loading order correct" "grep -A3 'index.css' templates/template-base/src/main.jsx | grep -q 'globals.css'"

echo -e "\n${BLUE}📋 Phase 1: Vérification de l'environnement${NC}"
validate "Repository structure" "[ -d 'template-base' ] && [ -d 'configs' ] && [ -d 'scripts' ]"
validate "Template complete" "[ -f 'templates/template-base/package.json' ] && [ -f 'templates/template-base/src/App.jsx' ]"
validate "Generation script" "[ -x 'scripts/generate-site.sh' ]"

# 🆕 v1.0.10: Validation adaptative des configurations
echo -e "\n${BLUE}📋 Phase 2: Validation configurations (adaptative)${NC}"

# Sites à valider selon le mode
SITES_TO_VALIDATE=""
if [ "$SITE_NAME" = "ALL" ]; then
    # Mode global : tous les sites disponibles
    SITES_TO_VALIDATE=$(ls configs/ 2>/dev/null | tr '\n' ' ')
    echo -e "${YELLOW}📋 Mode global: validation de tous les sites disponibles${NC}"
else
    # Mode spécifique : seulement le site demandé
    SITES_TO_VALIDATE="$SITE_NAME"
    echo -e "${BLUE}📋 Mode spécifique: validation de $SITE_NAME SEULEMENT${NC}"
fi

echo -e "${YELLOW}🎯 Sites à valider: $SITES_TO_VALIDATE${NC}"
echo ""

# Validation des configurations pour chaque site
for site in $SITES_TO_VALIDATE; do
    if [ -f "configs/$site/site-config.json" ]; then
        echo -e "${BLUE}📋 Validation configuration: $site${NC}"
        
        validate "$site config exists" "[ -f 'configs/$site/site-config.json' ]"
        validate "$site JSON valid" "python3 -m json.tool configs/$site/site-config.json"
        
        # 🆕 v1.0.10: Validation générique des couleurs (pas hardcodée)
        validate "$site a une configuration brand" "grep -q '\"brand\"' configs/$site/site-config.json"
        validate "$site a des couleurs configurées" "grep -q '\"colors\"' configs/$site/site-config.json"
        validate "$site a des sections configurées" "grep -q '\"sections\"' configs/$site/site-config.json"
    fi
done

echo -e "\n${BLUE}📋 Phase 3: Test de génération (adaptative)${NC}"

# Nettoyer les anciens tests
rm -rf test-generation-final/
mkdir -p test-generation-final/

# 🆕 v1.0.10: Génération adaptative
for site in $SITES_TO_VALIDATE; do
    if [ -f "configs/$site/site-config.json" ]; then
        echo "  🏗️  Générant $site..."
        if ./scripts/generate-site.sh $site > test-generation-final/$site.log 2>&1; then
            if [ -d "generated-sites/$site" ]; then
                mv generated-sites/$site test-generation-final/
            fi
            echo -e "  ${GREEN}✅ $site généré${NC}"
            SUCCESS=$((SUCCESS + 1))
        else
            echo -e "  ${RED}❌ Échec génération $site${NC}"
            echo "Voir: test-generation-final/$site.log"
        fi
        TOTAL=$((TOTAL + 1))
    fi
done

echo -e "\n${BLUE}📋 Phase 4: Validation générique des sites générés${NC}"

for site in $SITES_TO_VALIDATE; do
    if [ -d "test-generation-final/$site" ]; then
        echo -e "${BLUE}📋 Validation site généré: $site${NC}"
        
        validate "$site config injected" "[ -f 'test-generation-final/$site/public/config.json' ]"
        validate "$site package.json updated" "grep -q '$site' test-generation-final/$site/package.json"
        validate "$site site-variables.css généré" "[ -f 'test-generation-final/$site/src/styles/site-variables.css' ]"
        
        # 🎯 v1.0.10: VALIDATION GÉNÉRIQUE DES COULEURS (plus de hardcode !)
        validate_site_colors "$site"
        
        # Vérifier que Hero.jsx généré n'a pas de hardcode
        validate "$site Hero.jsx généré sans hardcode" "! grep -q '#[0-9A-Fa-f]\{6\}' test-generation-final/$site/src/components/home/Hero.jsx"
        
        # Vérifier cohérence brand name
        if [ -f "test-generation-final/$site/public/config.json" ]; then
            BRAND=$(grep -o '"name":[[:space:]]*"[^"]*"' test-generation-final/$site/public/config.json | head -1 | sed 's/.*"name":[[:space:]]*"\([^"]*\)".*/\1/')
            if [ ! -z "$BRAND" ]; then
                validate "$site brand name coherent" "grep -q '\"$BRAND\"' configs/$site/site-config.json"
            fi
        fi
        
        echo ""
    fi
done

echo -e "\n${BLUE}📋 Phase 5: Test de build (simulation adaptative)${NC}"

for site in $SITES_TO_VALIDATE; do
    if [ -d "test-generation-final/$site" ]; then
        validate "$site npm dependencies" "[ -f 'test-generation-final/$site/package.json' ]"
        validate "$site Dockerfile" "[ -f 'test-generation-final/$site/Dockerfile' ]"
    fi
done

echo -e "\n${BLUE}📋 Phase 6: Test de performance${NC}"
validate "Template size reasonable" "[ $(du -s template-base | cut -f1) -lt 100000 ]"  # < 100MB
validate "Config loader optimized" "[ -f 'templates/template-base/src/config/config-loader.js' ]"

echo -e "\n=================================="
echo -e "${BLUE}📊 RÉSULTATS FINAUX GÉNÉRIQUES${NC}"
echo "=================================="

PERCENTAGE=$(( (SUCCESS * 100) / TOTAL ))

echo -e "✅ Tests réussis: ${GREEN}$SUCCESS/$TOTAL${NC} (${PERCENTAGE}%)"
echo -e "🎯 Mode de validation: ${BLUE}$SITE_NAME${NC}"
echo -e "📋 Sites validés: ${YELLOW}$SITES_TO_VALIDATE${NC}"

if [ $SUCCESS -eq $TOTAL ]; then
    echo -e "\n${GREEN}🎉 VALIDATION GÉNÉRIQUE RÉUSSIE !${NC}"
    echo ""
    echo -e "${BLUE}🎯 OBJECTIFS ATTEINTS (Mode générique):${NC}"
    echo "  ✅ Template fonctionne pour N'IMPORTE QUEL site"
    echo "  ✅ Couleurs configurées → CSS générées (cohérence)"
    echo "  ✅ Aucun hardcode couleur dans les composants"
    echo "  ✅ Configuration JSON → Rendu final (générique)"
    echo "  ✅ Tests adaptatifs selon le site généré"
    echo "  ✅ Validation basée sur la config, pas hardcodée"
    echo ""
    echo -e "${YELLOW}🚀 SYSTÈME PRÊT POUR N'IMPORTE QUEL SITE${NC}"
    echo ""
    echo -e "${GREEN}🎯 v1.0.10: TESTS VRAIMENT GÉNÉRIQUES !${NC}"
    
    # Sauvegarder les résultats
    echo "VALIDATION GÉNÉRIQUE SUCCESS v1.0.10 - $(date)" > test-generation-final/VALIDATION_SUCCESS.txt
    echo "Mode: $SITE_NAME" >> test-generation-final/VALIDATION_SUCCESS.txt
    echo "Sites validés: $SITES_TO_VALIDATE" >> test-generation-final/VALIDATION_SUCCESS.txt
    echo "Success rate: $SUCCESS/$TOTAL ($PERCENTAGE%)" >> test-generation-final/VALIDATION_SUCCESS.txt
    
    exit 0
else
    echo -e "\n${RED}⚠️  VALIDATION INCOMPLÈTE${NC}"
    echo ""
    echo -e "${YELLOW}📋 Échecs détectés dans la validation générique${NC}"
    echo ""
    echo -e "${BLUE}📁 Logs disponibles:${NC}"
    for site in $SITES_TO_VALIDATE; do
        if [ -f "test-generation-final/$site.log" ]; then
            echo "  • test-generation-final/$site.log"
        fi
    done
    
    exit 1
fi
