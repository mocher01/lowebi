#!/bin/bash

# Script pour builder le site avec une configuration spécifique
# Usage: ./build-with-config.sh <site-name>

SITE_NAME=$1

if [ -z "$SITE_NAME" ]; then
    echo "Usage: ./build-with-config.sh <site-name>"
    exit 1
fi

echo "🏗️ Building site: $SITE_NAME"

# Nettoyer le build précédent
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf src/config/
rm -rf public/assets/

# Injecter la configuration
echo "🔧 Injecting configuration..."
node scripts/inject-config.js $SITE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Configuration injection failed"
    exit 1
fi

# Builder l'application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully for $SITE_NAME"
echo "📁 Build output in: dist/"
echo "🐳 Ready for Docker build"