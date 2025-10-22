#!/bin/bash

# Script de validation rapide du système de génération
# Usage: ./validate-generation.sh [site-name]

SITE_NAME="${1:-qalyarab}"

echo "🔍 Validation du système de génération pour $SITE_NAME..."

# Test rapide
if [ -f "configs/$SITE_NAME/site-config.json" ]; then
    # Créer un test minimal
    TEMP_DIR="/tmp/validation-$$"
    mkdir -p "$TEMP_DIR"
    cp template-base/index.html "$TEMP_DIR/"
    
    if node scripts/inject-html-config.js "configs/$SITE_NAME/site-config.json" "$TEMP_DIR"; then
        PLACEHOLDERS=$(grep -o "{{[^}]*}}" "$TEMP_DIR/index.html" | wc -l)
        if [ "$PLACEHOLDERS" -eq 0 ] && grep -q "window.SITE_CONFIG" "$TEMP_DIR/index.html"; then
            echo "✅ Système de génération opérationnel"
            rm -rf "$TEMP_DIR"
            exit 0
        fi
    fi
    
    rm -rf "$TEMP_DIR"
fi

echo "❌ Système de génération défaillant"
exit 1
