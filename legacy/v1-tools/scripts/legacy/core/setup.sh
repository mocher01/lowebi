#!/bin/bash

# Setup script for website-generator
echo "🚀 Setting up Website Generator..."

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p api/{routes,services,middleware}
mkdir -p template-base/{src,public,docker}
mkdir -p docker/{nginx,compose}
mkdir -p configs
mkdir -p assets/{shared,temp}
mkdir -p tests/{unit,integration,e2e}
mkdir -p logs

# Set permissions
chmod +x scripts/*.sh

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Clone locodai-website into template-base/"
echo "2. Configure your first site in configs/"
echo "3. Run 'npm run dev' to start development"
