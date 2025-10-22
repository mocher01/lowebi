#!/bin/bash

# 🎯 Guided Setup v1.1.1.9.2.4
# Interactive site creation with step-by-step guidance

set -e

echo "🎯 Website Generator - Configuration guidée"
echo "==========================================="
echo ""

# Check if guided generation script exists
if [ ! -f "scripts/core/guided-generation.js" ]; then
    echo "❌ Script de génération guidée non trouvé"
    exit 1
fi

# Run the guided generation
echo "🚀 Lancement de la configuration guidée..."
echo ""

node scripts/core/guided-generation.js

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📚 Commandes utiles:"
echo "  ./init.sh <site-id> --docker          # Déployer le site"
echo "  node scripts/core/hot-patch.js list  # Voir les mises à jour possibles"
echo "  node scripts/core/template-isolation.js scan  # Vérifier l'isolation des templates"