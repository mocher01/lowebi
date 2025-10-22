#!/bin/bash

# 🌐 Customer Portal Startup Script v1.1.1.9.2.4
# Launch the customer-facing web interface

set -e

echo "🌐 Starting Customer Portal v1.1.1.9.2.4"
echo "========================================"

# Check if Node.js dependencies are installed
if [ ! -d "api/node_modules" ]; then
    echo "📦 Installing API dependencies..."
    cd api
    npm install express cors fs-extra
    cd ..
fi

# Check if portal UI directory exists
if [ ! -d "api/portal-ui" ]; then
    echo "❌ Portal UI directory not found"
    exit 1
fi

echo ""
echo "🚀 Starting Customer Portal API..."
echo "📊 Admin Dashboard: http://localhost:3080/admin"
echo "🎯 Site Creator: http://localhost:3080/create"
echo "🔧 API Health: http://localhost:3080/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the API server
node api/customer-portal.js