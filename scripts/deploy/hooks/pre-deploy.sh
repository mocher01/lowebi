#!/bin/bash
# Pre-deployment hooks
# Executed before deployment starts

echo "🔍 Running pre-deployment hooks..."

# Check for uncommitted changes
if [ -d ".git" ]; then
    if ! git diff-index --quiet HEAD --; then
        echo "⚠️  Warning: There are uncommitted changes"
        echo "   Consider committing changes before deployment"
    fi
fi

# Create deployment backup
echo "📦 Creating pre-deployment backup..."

# Additional pre-deployment checks can be added here
echo "✅ Pre-deployment hooks completed"