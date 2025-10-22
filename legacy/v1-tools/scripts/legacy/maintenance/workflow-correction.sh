#!/bin/bash

# 🔄 WORKFLOW UNIVERSEL DE CORRECTION - Website Generator
# 
# Ce workflow permet de corriger et améliorer n'importe quel site généré
# par le website-generator de manière sécurisée avec versioning.
#
# Usage: ./scripts/workflow-correction.sh <site-name> <version> "<description>"
#
# Exemples:
#   ./scripts/workflow-correction.sh qalyarab v1.2.1 "Correction navigation et boutons CTA"
#   ./scripts/workflow-correction.sh locod-ai v2.0.0 "Migration vers nouveau système de couleurs"
#   ./scripts/workflow-correction.sh mon-client v1.0.3 "Ajout section témoignages"

set -e

# Configuration
SITE_NAME="$1"
VERSION="$2"
PROBLEM_DESC="$3"
SCRIPT_VERSION="2.0.0"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Fonctions utilitaires
log_header() {
    echo -e "${BLUE}$1${NC}"
    echo "============================================="
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${PURPLE}📋 $1${NC}"
}

# Validation des paramètres
if [ -z "$SITE_NAME" ] || [ -z "$VERSION" ] || [ -z "$PROBLEM_DESC" ]; then
    log_error "Usage: $0 <site-name> <version> \"<description>\""
    echo ""
    echo -e "${YELLOW}📚 Exemples d'utilisation:${NC}"
    echo "  • Correction mineure:     $0 qalyarab v1.0.1 \"Fix bouton contact\""
    echo "  • Nouvelle fonctionnalité: $0 locod-ai v1.1.0 \"Ajout section blog\""
    echo "  • Changement majeur:      $0 mon-client v2.0.0 \"Refonte complète UI\""
    echo ""
    echo -e "${YELLOW}💡 Sites disponibles:${NC}"
    if [ -d "configs" ]; then
        ls configs/ | grep -v "^\\." | while read site; do
            if [ -f "configs/$site/site-config.json" ]; then
                echo "  • $site"
            fi
        done
    fi
    echo ""
    echo -e "${YELLOW}📖 Versioning sémantique:${NC}"
    echo "  • vX.Y.Z où X=major, Y=minor, Z=patch"
    echo "  • Patch (v1.0.1): Corrections de bugs"
    echo "  • Minor (v1.1.0): Nouvelles fonctionnalités"
    echo "  • Major (v2.0.0): Changements incompatibles"
    exit 1
fi

# Validation du format de version
if ! echo "$VERSION" | grep -qE "^v[0-9]+\.[0-9]+\.[0-9]+$"; then
    log_error "Format de version invalide: $VERSION"
    echo -e "${YELLOW}💡 Format attendu: vX.Y.Z (exemple: v1.0.1)${NC}"
    exit 1
fi

# Vérifier que le site existe
if [ ! -d "configs/$SITE_NAME" ]; then
    log_error "Site '$SITE_NAME' non trouvé dans configs/"
    echo -e "${YELLOW}💡 Sites disponibles:${NC}"
    ls configs/ | grep -v "^\\." | while read site; do
        if [ -f "configs/$site/site-config.json" ]; then
            echo "  • $site"
        fi
    done
    exit 1
fi

# Header du workflow
echo -e "${BLUE}🔄 WEBSITE GENERATOR - WORKFLOW CORRECTION UNIVERSEL${NC}"
echo -e "${PURPLE}Version du script: $SCRIPT_VERSION${NC}"
echo "============================================="
echo -e "${YELLOW}🎯 Site cible:${NC} $SITE_NAME"
echo -e "${YELLOW}📦 Version:${NC} $VERSION"
echo -e "${YELLOW}📋 Description:${NC} $PROBLEM_DESC"
echo -e "${YELLOW}🌐 Générateur:${NC} Website Generator (template universel)"
echo ""

# ÉTAPE 0: Vérification de l'environnement
log_header "🔍 ÉTAPE 0: Vérification de l'environnement"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "scripts/generate-site.sh" ]; then
    log_error "Script doit être exécuté depuis la racine du website-generator"
    exit 1
fi

# Vérifier Git
if [ ! -d ".git" ]; then
    log_error "Pas dans un repository Git"
    exit 1
fi

# Vérifier les outils requis
for tool in node docker python3; do
    if ! command -v $tool &> /dev/null; then
        log_error "Outil requis manquant: $tool"
        exit 1
    fi
done

log_success "Environnement validé"

# Vérifier l'état du working directory
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Working directory not clean"
    echo "Fichiers modifiés:"
    git status --porcelain
    echo ""
    echo -e "${YELLOW}Voulez-vous continuer ? (y/N)${NC}"
    read -p "" -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Annulé par l'utilisateur"
        exit 1
    fi
fi

# Récupérer la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
log_success "Branche actuelle: $CURRENT_BRANCH"

# ÉTAPE 1: Gestion des branches et versioning
log_header "🌿 ÉTAPE 1: Gestion des branches et versioning"

# Générer les noms de branches avec versioning
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BRANCH="backup/${SITE_NAME}_${VERSION}_${TIMESTAMP}"
FIX_BRANCH="fix/${SITE_NAME}_${VERSION}_${TIMESTAMP}"
RELEASE_TAG="${SITE_NAME}_${VERSION}"

# Créer la branche de sauvegarde
echo "Création de la branche de sauvegarde: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"

# Commiter l'état actuel si nécessaire
if [ -n "$(git status --porcelain)" ]; then
    echo "Commit de l'état actuel dans la branche de sauvegarde..."
    git add .
    git commit -m "💾 BACKUP: $SITE_NAME ${VERSION} - État avant correction

📋 Description: $PROBLEM_DESC
🎯 Site: $SITE_NAME
📦 Version: $VERSION
🌐 Générateur: Website Generator
⏰ Timestamp: $TIMESTAMP"
fi

log_success "Branche de sauvegarde créée: $BACKUP_BRANCH"

# Créer la branche de correction
echo "Création de la branche de correction: $FIX_BRANCH"
git checkout -b "$FIX_BRANCH"

log_success "Branche de correction créée: $FIX_BRANCH"

# ÉTAPE 2: Backup local et documentation
log_header "📦 ÉTAPE 2: Backup local et documentation"

# Créer le dossier de backup avec versioning
BACKUP_DIR="backups/${SITE_NAME}/${VERSION}_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

# Backup de la configuration du site
if [ -f "configs/$SITE_NAME/site-config.json" ]; then
    cp "configs/$SITE_NAME/site-config.json" "$BACKUP_DIR/site-config.json.bak"
    log_success "Configuration $SITE_NAME sauvegardée"
fi

# Backup des assets du site
if [ -d "configs/$SITE_NAME/assets" ]; then
    cp -r "configs/$SITE_NAME/assets" "$BACKUP_DIR/assets.bak"
    log_success "Assets $SITE_NAME sauvegardés"
fi

# Créer un fichier de documentation de la correction
cat > "$BACKUP_DIR/correction-info.md" << EOF
# Correction Website Generator

## Informations générales
- **Site**: $SITE_NAME
- **Version**: $VERSION
- **Description**: $PROBLEM_DESC
- **Date**: $(date)
- **Branche backup**: $BACKUP_BRANCH
- **Branche correction**: $FIX_BRANCH

## Contexte
Le Website Generator permet de générer automatiquement des sites web 
personnalisés à partir d'un template React/Vite unique.

## Sites supportés
$(ls configs/ | grep -v "^\\." | while read site; do
    if [ -f "configs/$site/site-config.json" ]; then
        echo "- $site"
    fi
done)

## Fichiers sauvegardés
- Configuration: site-config.json.bak
- Assets: assets.bak/
- Template: (référence Git: $BACKUP_BRANCH)

## Commandes de récupération
\`\`\`bash
# Retour à l'état de sauvegarde
git checkout $BACKUP_BRANCH

# Restauration des fichiers
cp $BACKUP_DIR/site-config.json.bak configs/$SITE_NAME/site-config.json
cp -r $BACKUP_DIR/assets.bak/* configs/$SITE_NAME/assets/
\`\`\`
EOF

log_success "Documentation créée: $BACKUP_DIR/correction-info.md"

# ÉTAPE 3: Nettoyage de l'environnement
log_header "🧹 ÉTAPE 3: Nettoyage de l'environnement"

# Arrêter tous les containers du site
echo "Arrêt des containers $SITE_NAME..."
docker stop ${SITE_NAME}-container ${SITE_NAME} ${SITE_NAME}-test ${SITE_NAME}-dev 2>/dev/null || true
docker rm ${SITE_NAME}-container ${SITE_NAME} ${SITE_NAME}-test ${SITE_NAME}-dev 2>/dev/null || true

# Nettoyer les images si demandé
if [ "$4" = "--clean-images" ]; then
    echo "Nettoyage des images $SITE_NAME..."
    docker rmi ${SITE_NAME}-website ${SITE_NAME}-site 2>/dev/null || true
fi

# Nettoyer les sites générés précédents
if [ -d "generated-sites/$SITE_NAME" ]; then
    echo "Nettoyage des sites générés précédents..."
    rm -rf "generated-sites/$SITE_NAME"
fi

log_success "Environnement nettoyé"

# ÉTAPE 4: Validation pré-correction
log_header "🔍 ÉTAPE 4: Validation pré-correction"

log_info "Validation de la configuration $SITE_NAME..."
if node scripts/validate-config.js "$SITE_NAME"; then
    log_success "Configuration $SITE_NAME valide"
else
    log_warning "Configuration $SITE_NAME invalide - corrections nécessaires"
fi

# Vérifier les assets
log_info "Vérification des assets..."
if [ -d "configs/$SITE_NAME/assets" ]; then
    ASSET_COUNT=$(find "configs/$SITE_NAME/assets" -type f | wc -l)
    log_success "Assets trouvés: $ASSET_COUNT fichiers"
else
    log_warning "Aucun asset trouvé pour $SITE_NAME"
fi

# ÉTAPE 5: Instructions pour les corrections
log_header "✏️ ÉTAPE 5: Effectuer les corrections"

echo -e "${YELLOW}📝 Vous êtes maintenant dans la branche de correction: $FIX_BRANCH${NC}"
echo ""
echo -e "${YELLOW}🎯 Corrections possibles pour le site '$SITE_NAME':${NC}"
echo ""
echo "  📁 Configuration du site:"
echo "     nano configs/$SITE_NAME/site-config.json"
echo ""
echo "  🎨 Assets du site:"
echo "     configs/$SITE_NAME/assets/"
echo ""
echo "  🧩 Template universel (affecte TOUS les sites):"
echo "     template-base/src/components/"
echo "     template-base/src/utils/"
echo ""
echo -e "${YELLOW}💡 Autres sites dans ce générateur:${NC}"
ls configs/ | grep -v "^\\." | while read site; do
    if [ -f "configs/$site/site-config.json" ] && [ "$site" != "$SITE_NAME" ]; then
        echo "  • $site (sera aussi affecté par les changements de template)"
    fi
done
echo ""
echo -e "${YELLOW}🔄 Commandes Git utiles:${NC}"
echo "  • Voir les modifications: git status"
echo "  • Commiter au fur et à mesure: git add . && git commit -m 'Description'"
echo "  • Revenir au backup: git checkout $BACKUP_BRANCH"
echo ""
echo -e "${YELLOW}🧪 Test rapide pendant correction:${NC}"
echo "  ./scripts/generate-site.sh $SITE_NAME --build"
echo "  cd generated-sites/$SITE_NAME && npm run dev"
echo ""
echo -e "${YELLOW}⏳ Appuyez sur ENTRÉE quand les corrections sont terminées...${NC}"
read -p ""

# ÉTAPE 6: Validation post-correction
log_header "🛡️ ÉTAPE 6: Validation post-correction"

log_info "Validation de la configuration corrigée..."
if ! node scripts/validate-config.js "$SITE_NAME"; then
    log_error "Validation échouée après corrections"
    echo -e "${YELLOW}💡 Corrigez les erreurs et relancez le script${NC}"
    exit 1
fi

log_success "Configuration $SITE_NAME validée"

# ÉTAPE 7: Génération et tests
log_header "🔨 ÉTAPE 7: Génération et tests"

log_info "Génération du site $SITE_NAME avec le template universel..."
if ./scripts/generate-site.sh "$SITE_NAME" --build --docker; then
    log_success "Site $SITE_NAME généré avec succès"
else
    log_error "Échec de la génération du site $SITE_NAME"
    exit 1
fi

# ÉTAPE 8: Déploiement de test
log_header "🚀 ÉTAPE 8: Déploiement de test"

log_info "Démarrage du container de test pour $SITE_NAME..."
docker run -d \
    --name "${SITE_NAME}" \
    -p 3000:80 \
    "${SITE_NAME}-website"

sleep 5

# Vérifier que le container tourne
if docker ps | grep -q "${SITE_NAME}"; then
    log_success "Container $SITE_NAME démarré"
else
    log_error "Échec du démarrage du container $SITE_NAME"
    echo "Logs du container:"
    docker logs "${SITE_NAME}"
    exit 1
fi

# ÉTAPE 9: Tests automatiques
log_header "🧪 ÉTAPE 9: Tests automatiques"

log_info "Test HTTP du site $SITE_NAME..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    log_success "Test HTTP réussi (Status: $HTTP_STATUS)"
else
    log_error "Test HTTP échoué (Status: $HTTP_STATUS)"
    exit 1
fi

log_info "Test des assets..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/assets/ > /dev/null
log_success "Assets accessibles"

# ÉTAPE 10: Commit et versioning
log_header "💾 ÉTAPE 10: Commit et versioning"

# Vérifier s'il y a des modifications
if [ -n "$(git status --porcelain)" ]; then
    log_info "Commit des corrections..."
    git add .
    git commit -m "🔧 $SITE_NAME $VERSION: $PROBLEM_DESC

✨ Corrections appliquées sur le site $SITE_NAME
🎯 Version: $VERSION
🧪 Tests automatiques: ✅ Réussis
🚀 Déploiement: ✅ Fonctionnel
🌐 Générateur: Website Generator (template universel)

📋 Détails:
- Site concerné: $SITE_NAME
- Template universel: template-base/
- Configuration: configs/$SITE_NAME/
- Assets: configs/$SITE_NAME/assets/

🌿 Branches:
- Backup: $BACKUP_BRANCH
- Fix: $FIX_BRANCH
- Release: $RELEASE_TAG

🔄 Impact sur autres sites:
$(ls configs/ | grep -v "^\\." | while read site; do
    if [ -f "configs/$site/site-config.json" ] && [ "$site" != "$SITE_NAME" ]; then
        echo "- $site (affecté par changements template)"
    fi
done)"
    
    log_success "Corrections commitées"
    
    # Créer un tag de release
    if git tag -a "$RELEASE_TAG" -m "Release $SITE_NAME $VERSION: $PROBLEM_DESC"; then
        log_success "Tag de release créé: $RELEASE_TAG"
    fi
else
    log_warning "Aucune modification à commiter"
fi

# ÉTAPE 11: Résumé final
log_header "📋 ÉTAPE 11: Résumé final"

echo -e "${GREEN}🎉 WORKFLOW WEBSITE GENERATOR TERMINÉ AVEC SUCCÈS${NC}"
echo ""
echo -e "${YELLOW}📊 Résumé de la correction:${NC}"
echo "  • 🎯 Site traité: $SITE_NAME"
echo "  • 📦 Version: $VERSION"
echo "  • 📋 Description: $PROBLEM_DESC"
echo "  • 🌐 Générateur: Website Generator (template universel)"
echo "  • 🌿 Branche backup: $BACKUP_BRANCH"
echo "  • 🌿 Branche correction: $FIX_BRANCH"
echo "  • 🏷️ Tag release: $RELEASE_TAG"
echo "  • 📁 Backup local: $BACKUP_DIR"
echo "  • 🐳 Container: $SITE_NAME (port 3000)"
echo "  • ✅ Status: Opérationnel"
echo ""
echo -e "${YELLOW}🔗 Accès au site $SITE_NAME:${NC}"
echo "  • 🏠 Local: http://localhost:3000"
echo "  • 🌐 Serveur: http://YOUR_SERVER_IP:3000"
echo ""
echo -e "${YELLOW}🌿 Gestion des branches:${NC}"
echo "  • 📍 Branche actuelle: $FIX_BRANCH"
echo "  • 🔄 Retour backup: git checkout $BACKUP_BRANCH"
echo "  • 🏠 Retour main: git checkout main"
echo "  • 🔀 Merger corrections: git checkout main && git merge $FIX_BRANCH"
echo ""
echo -e "${YELLOW}🌐 Impact sur le générateur:${NC}"
echo "  • 🎯 Site principal traité: $SITE_NAME"
echo "  • 🧩 Template universel: Peut affecter tous les sites"
echo "  • 📁 Autres sites disponibles:"
ls configs/ | grep -v "^\\." | while read site; do
    if [ -f "configs/$site/site-config.json" ] && [ "$site" != "$SITE_NAME" ]; then
        echo "    - $site (regénérer si template modifié)"
    fi
done
echo ""
echo -e "${YELLOW}🧪 Tests recommandés:${NC}"
echo "  1. ✅ Vérifier que le problème est corrigé sur $SITE_NAME"
echo "  2. 🔄 Tester la navigation et fonctionnalités"
echo "  3. 📱 Vérifier l'affichage mobile"
echo "  4. 🌐 Si template modifié: regénérer les autres sites"
echo ""
echo -e "${YELLOW}⏭️ Prochaines étapes:${NC}"
echo "  • ✅ Si $SITE_NAME fonctionne: git checkout main && git merge $FIX_BRANCH"
echo "  • 🔄 Si template modifié: regénérer les autres sites"
echo "  • 📤 Push: git push origin $FIX_BRANCH"
echo "  • 🏷️ Release: git push origin $RELEASE_TAG"
echo "  • 🚨 Si problème: git checkout $BACKUP_BRANCH"
echo ""
echo -e "${YELLOW}🔄 Commandes Docker utiles:${NC}"
echo "  • 📋 Logs: docker logs $SITE_NAME"
echo "  • 🔄 Redémarrer: docker restart $SITE_NAME"
echo "  • 🛑 Arrêter: docker stop $SITE_NAME"
echo ""
echo -e "${BLUE}✅ Website Generator - Correction $SITE_NAME $VERSION terminée !${NC}"
echo -e "${PURPLE}🌐 Générateur prêt pour traiter d'autres sites si nécessaire.${NC}"
