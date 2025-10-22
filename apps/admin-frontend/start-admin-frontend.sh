#!/bin/bash

echo "🔧 Starting LOGEN Admin Frontend..."
echo "📍 Port: 7602"
echo "🌐 URL: https://admin.logen.locod-ai.com"
echo "🔐 Admin Access Only"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🚀 Starting development server..."
npm run dev