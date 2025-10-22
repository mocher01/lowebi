#!/bin/bash

# 🧪 Script de lancement des tests de régression
# Usage: ./run-regression-tests.sh <siteName> [port]

set -e

SITE_NAME="${1:-translatepros}"
PORT="${2:-3001}"
SERVER_IP="162.55.213.90"
BASE_URL="http://${SERVER_IP}:${PORT}"

echo "🧪 Lancement des tests de régression"
echo "=================================="
echo "Site: $SITE_NAME"
echo "URL: $BASE_URL"
echo ""

# Vérifier que le site est accessible
echo "🔍 Vérification que le site est accessible..."
if ! curl -f -s "$BASE_URL" > /dev/null; then
    echo "❌ Erreur: Site $BASE_URL inaccessible"
    echo "Vérifiez que le container Docker est démarré:"
    echo "  docker ps | grep $SITE_NAME"
    exit 1
fi

echo "✅ Site accessible"
echo ""

# Installer les dépendances si nécessaire
if [ ! -d "scripts/generators/node_modules" ]; then
    echo "📦 Installation des dépendances..."
    cd scripts/generators
    npm install node-fetch
    cd ../..
fi

# Lancer les tests
echo "🚀 Exécution des tests automatisés..."
node scripts/test/automated-regression-tests.js "$BASE_URL" "$SITE_NAME"

echo ""
echo "🎯 Tests terminés pour $SITE_NAME"
echo "📁 Rapports disponibles dans: test-results/"