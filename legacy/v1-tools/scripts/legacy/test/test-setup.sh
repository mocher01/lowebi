#!/bin/bash

# Test setup validation script
echo "🧪 Testing setup..."

# Check if directories exist
echo "📁 Checking directory structure..."
directories=("api" "templates/template-base" "scripts" "docker" "configs" "assets" "tests" "docs")

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ exists"
    else
        echo "❌ $dir/ missing"
        exit 1
    fi
done

# Check if key files exist
echo "📄 Checking key files..."
files=("package.json" "README.md" ".gitignore" "LICENSE")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo "🎉 Setup validation passed!"
echo "Ready to start Iteration 1"
