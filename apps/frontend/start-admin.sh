#!/bin/bash

# LOCOD-AI Staff Admin Dashboard Startup Script
# This script starts the staff admin dashboard on port 7601

echo "🚀 Starting LOCOD-AI Staff Admin Dashboard..."
echo "📊 Dashboard will be available at: http://localhost:7601/admin"
echo "🔐 Admin login required"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables for admin dashboard
export NEXT_PUBLIC_API_URL="http://162.55.213.90:3080"
export NODE_ENV="development"

# Start the development server
echo "🌟 Starting development server on port 7601..."
npm run admin

echo "✅ Admin dashboard started successfully!"
echo "🌐 Access the dashboard at: http://localhost:7601/admin"