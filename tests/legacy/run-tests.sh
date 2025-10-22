#!/bin/bash

# 🧪 Script de lancement des tests automatisés professionnels
# Usage: ./run-tests.sh <siteName> [port] [server]

set -e

SITE_NAME="${1:-translatepros}"
PORT="${2:-3001}"
SERVER="${3:-162.55.213.90}"
BASE_URL="http://${SERVER}:${PORT}"

echo "🚀 TESTS AUTOMATISÉS PROFESSIONNELS"
echo "===================================="
echo "Site: $SITE_NAME"
echo "URL: $BASE_URL"
echo "Navigateur: Chromium + Mobile"
echo ""

# Vérifier que le site est accessible
echo "🔍 Vérification de l'accessibilité du site..."
if ! curl -f -s "$BASE_URL" > /dev/null; then
    echo "❌ ERREUR: Site $BASE_URL inaccessible"
    echo ""
    echo "🔧 Actions possibles:"
    echo "  1. Vérifier que le container Docker est démarré:"
    echo "     ssh root@$SERVER 'docker ps | grep $SITE_NAME'"
    echo ""
    echo "  2. Redémarrer le container si nécessaire:"
    echo "     ssh root@$SERVER 'docker restart ${SITE_NAME}-current'"
    echo ""
    echo "  3. Vérifier les logs:"
    echo "     ssh root@$SERVER 'docker logs ${SITE_NAME}-current'"
    exit 1
fi

echo "✅ Site accessible"
echo ""

# Aller dans le dossier tests
cd "$(dirname "$0")"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances de test..."
    npm install
    echo ""
fi

# Installer les navigateurs Playwright si nécessaire
if [ ! -d "node_modules/@playwright/test" ]; then
    echo "🌐 Installation des navigateurs Playwright..."
    npx playwright install
    echo ""
fi

# Définir l'URL de base pour les tests
export BASE_URL="$BASE_URL"

echo "🧪 Lancement des tests Playwright..."
echo "⏱️  Timeout: 30s par navigation, 10s par action"
echo ""

# Lancer les tests avec rapport détaillé
npx playwright test \
    --reporter=list,html,json \
    --output=test-results/artifacts \
    2>&1 | tee test-results/console-output.log

# Vérifier le code de sortie
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "📊 RÉSULTATS DES TESTS"
echo "====================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 TOUS LES TESTS RÉUSSIS"
    echo "✅ Le site $SITE_NAME est entièrement fonctionnel"
    echo ""
    echo "🎯 Prêt pour validation manuelle"
else
    echo "❌ CERTAINS TESTS ONT ÉCHOUÉ"
    echo "🔍 Consultez les rapports détaillés ci-dessous"
fi

echo ""
echo "📁 RAPPORTS DISPONIBLES:"
echo "  📋 Rapport HTML: test-results/html-report/index.html"
echo "  📄 Rapport JSON: test-results/results.json"
echo "  📝 Log console: test-results/console-output.log"
echo "  🎬 Captures/vidéos: test-results/artifacts/"

# Ouvrir le rapport HTML si possible (sur serveur avec GUI)
if command -v xdg-open >/dev/null 2>&1; then
    echo ""
    echo "🌐 Ouverture du rapport HTML..."
    xdg-open test-results/html-report/index.html 2>/dev/null &
elif command -v open >/dev/null 2>&1; then
    echo ""
    echo "🌐 Ouverture du rapport HTML..."
    open test-results/html-report/index.html 2>/dev/null &
fi

echo ""
echo "🏁 Tests terminés pour $SITE_NAME"

# Retourner le code de sortie des tests
exit $TEST_EXIT_CODE